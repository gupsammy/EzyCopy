(function () {
  // Prevent redeclaration when scripts are injected multiple times
  if (window.EzyCopyPlatform) return;

  // Expect shared helpers to be loaded first
  if (!window.EzyCopyFiles) {
    console.error('EzyCopyFiles not loaded; platform helpers unavailable');
    return;
  }

  const {
    EZYCOPY_FOLDER,
    IMAGES_SUBFOLDER,
    getBasePath: getEzyCopyBasePath,
    getImagesPath,
    sanitizeImageFilename,
    generatePageSubfolder,
    rewriteImagePaths,
  } = window.EzyCopyFiles;

  // Expose API once to avoid polluting global scope with redeclarable consts
  window.EzyCopyPlatform = {
    EZYCOPY_FOLDER,
    IMAGES_SUBFOLDER,
    getEzyCopyBasePath,
    getImagesPath,
    sanitizeImageFilename,
    generatePageSubfolder,
    rewriteImagePaths,
  };

  // Backwards compatibility for existing global calls
  window.rewriteImagePaths = rewriteImagePaths;
  window.generatePageSubfolder = generatePageSubfolder;
  window.sanitizeImageFilename = sanitizeImageFilename;
})();
