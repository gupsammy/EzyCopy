// Shared list of scripts to inject into the active tab
(function (root) {
  if (root.EzyCopyInjection) return;

  const CONTENT_SCRIPTS = [
    "lib/readability.js",
    "lib/turndown.js",
    "lib/turndown-plugin-gfm.js",
    "file-helpers.js",
    "lib/ezycopy.js",
    "content-script.js",
  ];

  root.EzyCopyInjection = {
    CONTENT_SCRIPTS,
  };
})(typeof self !== 'undefined' ? self : this);
