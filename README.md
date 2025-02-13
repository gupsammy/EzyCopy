# EzyCopy Chrome Extension

EzyCopy is a powerful Chrome extension that allows you to easily extract and save webpage content as markdown files. It's perfect for content creators, researchers, and anyone who needs to save web content in a clean, formatted way.

## Features

- Extract webpage content and convert it to markdown format
- Save content directly as .md files
- Clean and intuitive user interface
- Preserves basic formatting and structure
- Works on most web pages

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/YourUsername/EzyCopy.git
   ```

2. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" by toggling the switch in the top right corner
   - Click "Load unpacked"
   - Select the directory where you cloned the EzyCopy repository

## Usage

1. Click on the EzyCopy extension icon in your Chrome toolbar
2. The popup interface will appear
3. Click the "Extract Content" button to convert the current webpage to markdown
4. Review the converted content in the preview area
5. Click "Download" to save the content as a markdown file

## Requirements

- Google Chrome browser (version 88 or higher)
- Developer mode enabled in Chrome extensions

## Permissions

The extension requires the following permissions:

- `activeTab`: To access the current webpage
- `scripting`: To run content scripts
- `downloads`: To save markdown files
- Access to all URLs for content extraction

## Development

To modify or enhance the extension:

1. Make your changes to the source files
2. Update the manifest version if necessary
3. Reload the extension in Chrome to test changes

## Project Structure

```
EzyCopy/
├── manifest.json      # Extension configuration
├── popup.html        # Extension popup interface
├── popup.js          # Main extension logic
├── icons/            # Extension icons
└── README.md         # Documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.
