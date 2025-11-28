/**
 * EzyCopy - Shared extraction logic
 * Uses Readability.js for content extraction + Turndown.js for Markdown conversion
 */

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

// Main extraction function - call this from popup.js or content-script.js
function extractContent() {
  // Clone document so Readability doesn't modify the live DOM
  const docClone = document.cloneNode(true);

  // Use Readability to extract main content
  const reader = new Readability(docClone);
  const article = reader.parse();

  const turndown = createTurndownService();

  if (!article) {
    // Fallback: convert body directly if Readability can't parse
    const content = [
      `# ${document.title}`,
      '',
      `Source: ${location.href}`,
      '',
      turndown.turndown(document.body)
    ].join('\n');

    return { content };
  }

  // Build markdown with metadata
  const parts = [
    `# ${article.title}`,
    '',
    `Source: ${location.href}`,
  ];

  // Add author if available
  if (article.byline) {
    parts.push(`Author: ${article.byline}`);
  }

  parts.push('');

  // Convert article HTML to Markdown
  parts.push(turndown.turndown(article.content));

  return { content: parts.join('\n') };
}

// Generate a safe filename from extracted content
function generateFilename(content) {
  const pageTitle = content.split("\n")[0].replace(/^#\s*/, "").trim();
  const safeTitle = pageTitle.substring(0, 50).replace(/[^a-zA-Z0-9]/g, "-");
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${safeTitle}-${timestamp}.md`;
}

// Extract the page title from markdown content
function extractPageTitle(content) {
  return content.split("\n")[0].replace(/^#\s*/, "").trim();
}

/**
 * Extract all images from the article content
 * Uses DOMParser for safe HTML parsing (no script execution)
 * @param {string} articleHtml - HTML content from Readability
 * @returns {Array<{src: string, alt: string}>} Array of image objects
 */
function extractImagesFromHtml(articleHtml) {
  const images = [];
  const seenUrls = new Set();

  // DOMParser is safe - it doesn't execute scripts or load external resources
  const parser = new DOMParser();
  const doc = parser.parseFromString(articleHtml, 'text/html');

  const imgElements = doc.querySelectorAll('img');

  imgElements.forEach((img, index) => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');

    if (!src) return;

    // Skip data URIs (already embedded)
    if (src.startsWith('data:')) return;

    // Skip duplicates
    if (seenUrls.has(src)) return;
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

  return images;
}

/**
 * Extended extraction that also returns images
 * @returns {{content: string, images: Array, title: string, subfolder: string}}
 */
function extractContentWithImages() {
  // Clone document so Readability doesn't modify the live DOM
  const docClone = document.cloneNode(true);

  // Use Readability to extract main content
  const reader = new Readability(docClone);
  const article = reader.parse();

  const turndown = createTurndownService();

  let content, images, title;

  if (!article) {
    // Fallback: convert body directly if Readability can't parse
    content = [
      `# ${document.title}`,
      '',
      `Source: ${location.href}`,
      '',
      turndown.turndown(document.body)
    ].join('\n');

    title = document.title;
    images = extractImagesFromHtml(document.body.outerHTML);
  } else {
    // Build markdown with metadata
    const parts = [
      `# ${article.title}`,
      '',
      `Source: ${location.href}`,
    ];

    if (article.byline) {
      parts.push(`Author: ${article.byline}`);
    }

    parts.push('');
    parts.push(turndown.turndown(article.content));

    content = parts.join('\n');
    title = article.title;
    images = extractImagesFromHtml(article.content);
  }

  // Generate subfolder name for images
  const safeTitle = title
    .substring(0, 50)
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const timestamp = new Date().toISOString().slice(0, 10);
  const subfolder = `${safeTitle}-${timestamp}`;

  return { content, images, title, subfolder };
}
