// Shared file/path helpers usable in window, content scripts, and service worker
(function (root) {
  if (root.EzyCopyFiles) return;

  const EZYCOPY_FOLDER = 'EzyCopy';
  const IMAGES_SUBFOLDER = 'images';

  function getBasePath() {
    return EZYCOPY_FOLDER;
  }

  function getImagesPath(pageSubfolder) {
    return `${EZYCOPY_FOLDER}/${IMAGES_SUBFOLDER}/${pageSubfolder}`;
  }

  function sanitizeImageFilename(url, index) {
    try {
      const urlObj = new URL(url);
      let filename = urlObj.pathname.split('/').pop() || `image-${index}`;

      filename = filename.split('?')[0];

      try {
        filename = decodeURIComponent(filename);
      } catch (e) {
        // keep as-is if decode fails
      }

      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

      if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i)) {
        filename += '.png';
      }

      if (filename.length > 200) {
        const ext = filename.match(/\.[^.]+$/)?.[0] || '.png';
        filename = filename.substring(0, 200 - ext.length) + ext;
      }

      return filename;
    } catch (e) {
      return `image-${index}.png`;
    }
  }

  function rewriteImagePaths(markdown, urlToPathMap) {
    let result = markdown;

    for (const [originalUrl, localPath] of Object.entries(urlToPathMap)) {
      const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(!\\[[^\\]]*\\]\\()${escapedUrl}((?:\\s+"[^"]*")?\\))`, 'g');
      result = result.replace(regex, `$1${localPath}$2`);
    }

    return result;
  }

  root.EzyCopyFiles = {
    EZYCOPY_FOLDER,
    IMAGES_SUBFOLDER,
    getBasePath,
    getImagesPath,
    sanitizeImageFilename,
    rewriteImagePaths,
  };
})(typeof self !== 'undefined' ? self : this);
