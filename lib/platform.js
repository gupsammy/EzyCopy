(function () {
  // Prevent redeclaration when scripts are injected multiple times
  if (window.EzyCopyPlatform) return;

  /**
   * EzyCopy - Platform utilities for file operations
   */

  // Base folder name (relative to Downloads folder)
  const EZYCOPY_FOLDER = 'EzyCopy';
  const IMAGES_SUBFOLDER = 'images';

  /**
   * Get the relative path prefix for EzyCopy downloads
   * Chrome downloads API uses paths relative to Downloads folder
   */
  function getEzyCopyBasePath() {
    return EZYCOPY_FOLDER;
  }

  /**
   * Get the images folder path for a specific page
   * @param {string} pageSubfolder - Sanitized page title/date subfolder name
   * @returns {string} Path like "EzyCopy/images/page-name-2025-01-15"
   */
  function getImagesPath(pageSubfolder) {
    return `${EZYCOPY_FOLDER}/${IMAGES_SUBFOLDER}/${pageSubfolder}`;
  }

  /**
   * Generate a safe filename from an image URL
   * Handles query strings, special characters, and long names
   * @param {string} url - Original image URL
   * @param {number} index - Index for fallback naming
   * @returns {string} Safe filename like "image-name.png"
   */
  function sanitizeImageFilename(url, index) {
    try {
      const urlObj = new URL(url);
      let filename = urlObj.pathname.split('/').pop() || `image-${index}`;

      // Remove query string if it got included
      filename = filename.split('?')[0];

      // Decode URI components
      try {
        filename = decodeURIComponent(filename);
      } catch (e) {
        // Keep as-is if decode fails
      }

      // Replace unsafe characters
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      // Ensure it has an extension, default to .png
      if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i)) {
        filename += '.png';
      }

      // Truncate if too long (keep extension)
      if (filename.length > 200) {
        const ext = filename.match(/\.[^.]+$/)?.[0] || '.png';
        filename = filename.substring(0, 200 - ext.length) + ext;
      }

      return filename;
    } catch (e) {
      return `image-${index}.png`;
    }
  }

  /**
   * Generate the page subfolder name from page title and date
   * @param {string} pageTitle - Page title
   * @returns {string} Sanitized subfolder name
   */
  function generatePageSubfolder(pageTitle) {
    const safeTitle = pageTitle
      .substring(0, 50)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${safeTitle}-${timestamp}`;
  }

  /**
   * Rewrite image URLs in markdown with local file paths
   * @param {string} markdown - Original markdown content
   * @param {Object} urlToPathMap - Map of original URL to local absolute path
   * @returns {string} Markdown with rewritten image paths
   */
  function rewriteImagePaths(markdown, urlToPathMap) {
    let result = markdown;

    for (const [originalUrl, localPath] of Object.entries(urlToPathMap)) {
      // Escape special regex characters in the URL
      const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Match markdown image syntax: ![alt](url) or ![alt](url "title")
      const regex = new RegExp(`(!\\[[^\\]]*\\]\\()${escapedUrl}((?:\\s+"[^"]*")?\\))`, 'g');
      result = result.replace(regex, `$1${localPath}$2`);
    }

    return result;
  }

  // Expose API once to avoid polluting global scope with redeclarable consts
  window.EzyCopyPlatform = {
    EZYCOPY_FOLDER,
    IMAGES_SUBFOLDER,
    getEzyCopyBasePath,
    getImagesPath,
    sanitizeImageFilename,
    generatePageSubfolder,
    rewriteImagePaths
  };

  // Backwards compatibility for existing global calls
  window.rewriteImagePaths = rewriteImagePaths;
  window.generatePageSubfolder = generatePageSubfolder;
  window.sanitizeImageFilename = sanitizeImageFilename;
})();
