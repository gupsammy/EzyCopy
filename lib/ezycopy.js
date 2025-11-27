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
