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
 * Clean common markup artifacts from final markdown output.
 * Targets patterns that are unambiguously broken (not natural language).
 * @param {string} markdown - Markdown content to clean
 * @returns {string} Cleaned markdown
 */
function cleanMarkdown(markdown) {
  return markdown
    // Remove orphaned link fragments: ](#) from stripped carousel/gallery links
    .replace(/\]\(#\)/g, '')
    // Remove orphaned gallery counters: lines starting with [digits (no closing bracket on same line)
    .replace(/^\[\d+\s*$/gm, '')
    // Collapse 3+ consecutive blank lines to 2
    .replace(/\n{3,}/g, '\n\n')
    // Remove orphaned horizontal rules (--- on its own line surrounded by blank lines)
    .replace(/\n\n---\n\n/g, '\n\n')
    .trim();
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
 * Interactive widget selectors to strip from cloned DOM.
 * These match visible interactive UI that Readability doesn't handle:
 * ARIA roles for widget patterns, video players, rating UIs, custom form elements, etc.
 */
const WIDGET_SELECTORS = [
  // ARIA widget roles (interactive, not content)
  '[role="toolbar"]',
  '[role="tablist"]',
  '[role="tab"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="tooltip"]',
  '[role="listbox"]',
  '[role="combobox"]',
  '[role="search"]',
  '[role="radiogroup"]',
  '[role="progressbar"]',

  // Video player chrome
  '[class*="jw-"]',
  '[class*="vjs-"]',
  '[class*="plyr"]',

  // Rating widgets
  '[class*="rating-star"]',
  '[class*="star-rating"]',

  // Custom form/dropdown widgets
  '[class*="custom-select"]',
  '[class*="dropdown-menu"]',

  // Recipe-specific interactive UI
  '[class*="recipe-adjust"]',
  '[class*="recipe-scale"]',
  '[class*="serving-size"]',

  // Action bars and social
  '[class*="social-share"]',
  '[class*="print-button"]',
  '[class*="action-bar"]',

  // Community/form widgets
  '[class*="answer-form"]',
  '[class*="review-form"]',
  '[class*="comment-form"]',

  // Interactive markers
  '[contenteditable="true"]',
  '[data-toggle]',
  '[data-action]',
];

const WIDGET_SELECTOR_STRING = WIDGET_SELECTORS.join(', ');

/**
 * Check if an element likely contains real article content and should be preserved.
 * Skips removal for elements with substantial text containing sentence punctuation.
 * @param {Element} el - The element to check
 * @returns {boolean} True if the element should be kept (likely content)
 */
function isLikelyContent(el) {
  const text = el.textContent || '';
  return text.length > 200 && /[.!?]/.test(text);
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

  // Clean markup artifacts from final output
  content = cleanMarkdown(content);

  return content;
}

/**
 * Mark elements hidden via CSS on the live DOM before cloning.
 * getComputedStyle() resolves stylesheet rules that cloneNode() loses.
 * @param {Document} liveDoc - The live document (window.document)
 * @returns {Element[]} Array of marked elements (for cleanup after cloning)
 */
function markHiddenElements(liveDoc) {
  const marked = [];
  const elements = liveDoc.body.getElementsByTagName('*');

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];

    // Skip descendants of already-marked elements
    if (el.closest('[data-ezycopy-hidden]')) continue;

    // Skip elements that won't have meaningful computed styles
    const tag = el.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'link' || tag === 'meta') continue;

    try {
      const style = liveDoc.defaultView.getComputedStyle(el);
      const isHidden =
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0' ||
        (style.height === '0px' && style.overflow === 'hidden');

      if (isHidden) {
        el.setAttribute('data-ezycopy-hidden', '');
        marked.push(el);
      }
    } catch (e) {
      // getComputedStyle can fail on detached elements — skip safely
    }
  }

  return marked;
}

/**
 * Remove data-ezycopy-hidden markers from the live DOM after cloning.
 * @param {Element[]} markedElements - Elements previously marked by markHiddenElements()
 */
function cleanupMarkers(markedElements) {
  for (const el of markedElements) {
    el.removeAttribute('data-ezycopy-hidden');
  }
}

/**
 * Pre-clean a cloned DOM before passing to Readability.
 * Phase 1: Remove CSS-hidden elements (marked on live DOM).
 * Phase 2: Remove interactive widget patterns by selector.
 * @param {Document} clonedDoc - The cloned document to clean in-place
 */
function preCleanDom(clonedDoc) {
  // Phase 1: Remove elements that were hidden via CSS on the live page
  clonedDoc.querySelectorAll('[data-ezycopy-hidden]').forEach(el => el.remove());

  // Phase 2: Remove interactive widget patterns
  clonedDoc.querySelectorAll(WIDGET_SELECTOR_STRING).forEach(el => {
    if (isLikelyContent(el)) return;
    el.remove();
  });

  // Phase 3: Wrap standalone <img> in <figure> to protect from Readability's
  // _cleanConditionally, which skips nodes inside <figure> ancestors.
  clonedDoc.querySelectorAll('img').forEach(img => {
    // Already protected by a <figure> ancestor
    if (img.closest('figure')) return;

    // Skip tracking pixels and icons (tiny or data-URI)
    const w = parseInt(img.getAttribute('width'), 10);
    const h = parseInt(img.getAttribute('height'), 10);
    if ((w > 0 && w <= 1) || (h > 0 && h <= 1)) return;
    const src = img.getAttribute('src') || '';
    if (src.startsWith('data:')) return;

    const figure = clonedDoc.createElement('figure');
    img.parentNode.insertBefore(figure, img);
    figure.appendChild(img);
  });
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
  // Pre-clean: mark CSS-hidden elements on live DOM, clone, clean markers, strip widgets
  const hiddenMarkers = markHiddenElements(document);
  let docClone;
  try {
    docClone = document.cloneNode(true);
  } finally {
    cleanupMarkers(hiddenMarkers);
  }
  preCleanDom(docClone);
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

  // Check if Readability lost >50% of page images
  const pageImageCount = document.querySelectorAll('img').length;
  const readabilityAnalysis = analyzeImagesInHtml(article.content);
  const imageLossRatio = pageImageCount > 0
    ? (pageImageCount - readabilityAnalysis.count) / pageImageCount
    : 0;

  // If significant image loss, re-run Readability without FLAG_CLEAN_CONDITIONALLY.
  // This preserves image-heavy containers while keeping other cleanup (unlikelys, class-weights).
  if (imageLossRatio > 0.5) {
    const retryMarkers = markHiddenElements(document);
    let retryClone;
    try {
      retryClone = document.cloneNode(true);
    } finally {
      cleanupMarkers(retryMarkers);
    }
    preCleanDom(retryClone);
    const retryReader = new Readability(retryClone);
    // FLAG_STRIP_UNLIKELYS (0x1) | FLAG_WEIGHT_CLASSES (0x2), omitting FLAG_CLEAN_CONDITIONALLY (0x4)
    retryReader._flags = 0x1 | 0x2;
    const retryArticle = retryReader.parse();

    if (retryArticle) {
      const { images } = analyzeImagesInHtml(retryArticle.content);
      return {
        title: retryArticle.title,
        body: turndown.turndown(retryArticle.content),
        sourceUrl: location.href,
        byline: retryArticle.byline,
        isSelection: false,
        html: retryArticle.content,
        images
      };
    }
  }

  // Default: use first Readability pass output
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


