/**
 * EzyCopy - Shared extraction logic
 * Uses Readability.js for content extraction + Turndown.js for Markdown conversion
 */

/**
 * Get selected HTML content or null if no selection
 * Uses Selection API to capture the selected DOM fragment
 */
function getSelectionHtml() {
  const selection = window.getSelection();

  // Check if there's a valid, non-collapsed selection
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  // Check if selection has meaningful content
  const text = selection.toString().trim();
  if (!text) {
    return null;
  }

  // Clone the selected content as HTML
  const range = selection.getRangeAt(0);
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());

  return container.innerHTML;
}

// Configure Turndown with GFM (GitHub Flavored Markdown) support
function createTurndownService() {
  const turndown = new TurndownService({
    headingStyle: 'atx',        // # style headings
    codeBlockStyle: 'fenced',   // ``` code blocks
    bulletListMarker: '-',
    emDelimiter: '*',
  });

  // Add GFM support for tables, strikethrough, task lists
  if (typeof turndownPluginGfm !== 'undefined') {
    turndown.use(turndownPluginGfm.gfm);
  }

  return turndown;
}

/**
 * Remove all markdown image references from content
 * Handles: ![alt](url), ![alt](url "title"), ![](url)
 */
function stripImages(markdown) {
  return markdown.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
}

/**
 * Analyze images in an HTML string - returns both count and image data
 * Single-pass extraction to avoid redundant HTML parsing
 * @param {string} html - HTML content to parse
 * @returns {{count: number, images: Array<{src: string, alt: string}>}} Image analysis result
 */
function analyzeImagesInHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imgElements = doc.querySelectorAll('img');

  const images = [];
  const seenUrls = new Set();

  imgElements.forEach((img, index) => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    if (!src || src.startsWith('data:') || seenUrls.has(src)) return;

    seenUrls.add(src);

    // Resolve relative URLs to absolute
    let absoluteSrc = src;
    try {
      absoluteSrc = new URL(src, location.href).href;
    } catch (e) {
      // Keep original if URL parsing fails
    }

    images.push({
      src: absoluteSrc,
      alt: img.alt || `image-${index}`
    });
  });

  return { count: images.length, images };
}

/**
 * Calculate text overlap between Readability output and a container
 * Used to identify which CMS container matches the extracted article content
 * @param {string} readabilityText - Text content from Readability
 * @param {string} containerText - Text content from a CMS container
 * @returns {number} Overlap ratio between 0 and 1
 */
function calculateTextOverlap(readabilityText, containerText) {
  if (!readabilityText || readabilityText.length === 0) return 0;

  // Normalize: lowercase, collapse whitespace
  const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedReadability = normalize(readabilityText);
  const normalizedContainer = normalize(containerText);

  // Check if one contains the other (handles Readability stripping or container having extra)
  if (normalizedContainer.includes(normalizedReadability)) return 1.0;
  if (normalizedReadability.includes(normalizedContainer)) {
    return normalizedContainer.length / normalizedReadability.length;
  }

  // Word-based overlap for partial matches (filter words > 3 chars to avoid noise)
  const words = normalizedReadability.split(' ').filter(w => w.length > 3);
  if (words.length === 0) return 0;
  const matchedWords = words.filter(w => normalizedContainer.includes(w));
  return matchedWords.length / words.length;
}

/**
 * Clean HTML by removing non-content elements (styles, scripts, promos)
 * @param {Element} container - The container element to clean
 * @returns {string} Cleaned innerHTML
 */
function cleanContainerHtml(container) {
  // Clone to avoid modifying the actual DOM
  const clone = container.cloneNode(true);

  // Remove style and script tags
  clone.querySelectorAll('style, script, noscript').forEach(el => el.remove());

  // Remove common promo/ad patterns
  const promoSelectors = [
    '[class*="interlude"]',
    '[class*="promo"]',
    '[class*="advert"]',
    '[class*="sidebar"]',
    '[class*="related"]',
    '[class*="newsletter"]',
    '[class*="subscribe"]',
    '[id*="promo"]',
    '[id*="advert"]',
  ];
  promoSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  return clone.innerHTML;
}

/**
 * Find the best content container for fallback extraction using hybrid approach
 * Uses text overlap with Readability output as primary signal, image count as tiebreaker
 * @param {string} readabilityText - Text content extracted by Readability (used as "fingerprint")
 * @returns {Element|null} The best matching container, or null if none found
 */
function findBestContentContainer(readabilityText) {
  // CMS-specific selectors only - avoid generic main/article which include sidebars
  const selectors = [
    '.rte',              // Shopify
    '.entry-content',    // WordPress
    '.post-content',     // WordPress alt
    '.article-content',  // Common CMS
    '.post-body',        // Blogger/Tumblr
    '.story-body',       // News sites
    '.article-body',     // News sites alt
  ];

  // Collect ALL matching containers across all selectors
  const candidates = [];
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (el.querySelectorAll('img').length > 0) {
        candidates.push({
          element: el,
          selector,
          textOverlap: calculateTextOverlap(readabilityText, el.textContent),
          imageCount: el.querySelectorAll('img').length
        });
      }
    });
  });

  if (candidates.length === 0) return null;

  // Filter to candidates with >50% text overlap
  const goodMatches = candidates.filter(c => c.textOverlap > 0.5);

  if (goodMatches.length === 0) {
    // No good text match - fall back to container with most images
    candidates.sort((a, b) => b.imageCount - a.imageCount);
    return candidates[0].element;
  }

  // Among good text matches, pick the one with most images (tiebreaker)
  goodMatches.sort((a, b) => b.imageCount - a.imageCount);
  return goodMatches[0].element;
}

/**
 * Format extracted content for specific output target
 * @param {Object} extraction - Raw extraction result from extractContent()
 * @param {string} target - 'clipboard' or 'download'
 * @param {Object} settings - User settings object
 * @returns {string} Formatted markdown content
 */
function formatContent(extraction, target, settings) {
  const { title, body, byline, sourceUrl, isSelection } = extraction;
  const includeImages = settings.includeImages ?? true;

  let content;

  if (target === 'clipboard') {
    // Clipboard: Title + body only (no metadata)
    if (isSelection) {
      content = [
        `# ${title}`,
        '',
        '---',
        '*Selected content:*',
        '',
        body
      ].join('\n');
    } else {
      content = [
        `# ${title}`,
        '',
        body
      ].join('\n');
    }
  } else {
    // Download: Full metadata
    const parts = [`# ${title}`, '', `Source: ${sourceUrl}`];
    if (byline) parts.push(`Author: ${byline}`);
    parts.push('');
    if (isSelection) {
      parts.push('---', '*Selected content:*', '');
    }
    parts.push(body);
    content = parts.join('\n');
  }

  // Strip images if not enabled
  if (!includeImages) {
    content = stripImages(content);
  }

  return content;
}

/**
 * Main extraction function - returns structured data for formatting
 * @param {Object} options - Extraction options
 * @param {boolean} options.selectiveCopy - Whether to check for text selection
 * @param {boolean} options.includeImages - Whether images are enabled (skip fallback if false)
 * @returns {Object} Structured extraction result
 */
function extractContent(options = {}) {
  const { selectiveCopy = true, includeImages = true } = options;
  const turndown = createTurndownService();

  // Check for text selection (only if selectiveCopy enabled)
  if (selectiveCopy) {
    const selectionHtml = getSelectionHtml();
    if (selectionHtml) {
      const { images } = analyzeImagesInHtml(selectionHtml);
      return {
        title: document.title,
        body: turndown.turndown(selectionHtml),
        sourceUrl: location.href,
        byline: null,
        isSelection: true,
        html: selectionHtml,
        images
      };
    }
  }

  // No selection - extract full page with Readability
  const docClone = document.cloneNode(true);
  const reader = new Readability(docClone);
  const article = reader.parse();

  if (!article) {
    // Fallback: convert body directly if Readability can't parse
    const bodyHtml = document.body.outerHTML;
    const { images } = analyzeImagesInHtml(bodyHtml);
    return {
      title: document.title,
      body: turndown.turndown(document.body),
      sourceUrl: location.href,
      byline: null,
      isSelection: false,
      html: bodyHtml,
      images
    };
  }

  // EARLY RETURN: Skip fallback logic if images are disabled (optimization)
  if (!includeImages) {
    return {
      title: article.title,
      body: turndown.turndown(article.content),
      sourceUrl: location.href,
      byline: article.byline,
      isSelection: false,
      html: article.content,
      images: []  // Skip image analysis when images are disabled
    };
  }

  // Find best container using text matching + image count (hybrid approach)
  const readabilityText = article.textContent || '';
  const container = findBestContentContainer(readabilityText);

  // If no CMS container found, use Readability output
  if (!container) {
    const { images } = analyzeImagesInHtml(article.content);
    return {
      title: article.title,
      body: turndown.turndown(article.content),
      sourceUrl: location.href,
      byline: article.byline,
      isSelection: false,
      html: article.content,
      images
    };
  }

  // Check image loss in selected container
  const containerImageCount = container.querySelectorAll('img').length;
  const readabilityAnalysis = analyzeImagesInHtml(article.content);
  const imageLossRatio = containerImageCount > 0
    ? (containerImageCount - readabilityAnalysis.count) / containerImageCount
    : 0;

  // If >50% images lost, use cleaned container to preserve images
  if (imageLossRatio > 0.5) {
    const cleanedHtml = cleanContainerHtml(container);
    const { images } = analyzeImagesInHtml(cleanedHtml);
    return {
      title: article.title,
      body: turndown.turndown(cleanedHtml),
      sourceUrl: location.href,
      byline: article.byline,
      isSelection: false,
      html: cleanedHtml,
      images
    };
  }

  // Default: use Readability output (reuse already-analyzed images)
  return {
    title: article.title,
    body: turndown.turndown(article.content),
    sourceUrl: location.href,
    byline: article.byline,
    isSelection: false,
    html: article.content,
    images: readabilityAnalysis.images
  };
}

/**
 * Generate a safe base name from page title (without extension)
 * Used for both markdown filenames and image subfolders
 * @param {string} title - Page or article title
 * @returns {string} Safe base name in format "title-YYYY-MM-DD"
 */
function generateBaseName(title) {
  const safeTitle = title
    .substring(0, 50)
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${safeTitle}-${timestamp}`;
}


