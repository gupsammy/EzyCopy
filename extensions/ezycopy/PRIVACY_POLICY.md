# EzyCopy Privacy Policy

Last updated: November 2024

## Overview

EzyCopy is a browser extension that extracts webpage content and converts it to Markdown format. This privacy policy explains how the extension handles user data.

## Data Collection

EzyCopy does NOT collect, store, or transmit any personal data or browsing information to external servers.

### What the extension accesses:

- **Webpage content**: When you click the extension button or use the right-click menu, EzyCopy reads the current page's HTML content to extract the article text.
- **Local storage**: User preferences (like settings toggles) are stored locally in your browser using Chrome's storage API.

### What the extension does NOT do:

- Does not track your browsing history
- Does not collect personal information
- Does not send any data to external servers
- Does not use analytics or tracking
- Does not share data with third parties

## Data Processing

All content processing happens entirely within your browser:

1. The webpage content is read from the active tab
2. Mozilla's Readability.js extracts the article content
3. Turndown.js converts HTML to Markdown
4. The file is saved to your local Downloads folder
5. No data ever leaves your device

## Permissions Explained

- **activeTab**: Access the current tab only when you activate the extension
- **scripting**: Inject the content extraction scripts into the page
- **contextMenus**: Add the right-click menu option
- **storage**: Save your preferences locally
- **downloads**: Save the markdown file to your Downloads folder

## Third-Party Services

EzyCopy does not use any third-party services, APIs, or analytics.

## Data Retention

EzyCopy does not retain any data. Each extraction is processed in real-time and immediately saved as a local file.

## User Rights

Since no personal data is collected or stored, there is no user data to access, modify, or delete.

## Chrome Web Store Compliance

The use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Open Source

EzyCopy is open source. You can review the complete source code at: https://github.com/gupsammy/EzyCopy

## Contact

For questions about this privacy policy, please open an issue on GitHub or contact the developer through the Chrome Web Store listing.

## Changes to This Policy

Any changes to this privacy policy will be posted on this page with an updated revision date.
