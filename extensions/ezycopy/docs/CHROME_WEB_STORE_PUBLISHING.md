# Chrome Web Store Publishing Guide for EzyCopy

Complete guide to publish EzyCopy on the Chrome Web Store. Follow each section in order.

---

## Quick Checklist

Copy this to track your progress:

```
ACCOUNT SETUP
[ ] Create Google developer account
[ ] Pay $5 registration fee
[ ] Verify email address

ASSETS TO CREATE
[ ] 440x280 promotional image (required)
[ ] 1280x800 screenshot #1 (required)
[ ] 1280x800 screenshot #2 (recommended)
[ ] 1280x800 screenshot #3 (recommended)
[ ] 1400x560 marquee image (optional, for featured placement)

PRIVACY & LEGAL
[ ] Write privacy policy
[ ] Host privacy policy (GitHub Pages or similar)
[ ] Get privacy policy URL

STORE LISTING
[ ] Write detailed description
[ ] Write short description (132 chars max)
[ ] Prepare permission justifications
[ ] Select category (Productivity)
[ ] Fill privacy practices form

FINAL STEPS
[ ] Create ZIP package
[ ] Upload to developer dashboard
[ ] Submit for review
[ ] Wait for approval (1-3 days typically)
[ ] Publish!
```

---

## Part 1: Developer Account Setup

### Step 1.1: Register as a Chrome Web Store Developer

1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with your Google account
3. Accept the Developer Agreement
4. Pay the **$5 one-time registration fee**
5. Verify your email address when prompted

**Important:** Use a Google account you plan to maintain long-term. This will be visible as the developer/publisher of your extension.

### Step 1.2: Complete Your Developer Profile

In the developer dashboard:
1. Click on "Account" in the left sidebar
2. Fill in your **Publisher display name** (this appears publicly)
3. Add a **contact email** (can be different from your account email)
4. Optionally add a website URL

---

## Part 2: Create Required Assets

### Asset Specifications

| Asset | Dimensions | Format | Required |
|-------|-----------|--------|----------|
| Extension icon | 128x128 px | PNG | ✅ Yes (you have this) |
| Small promo tile | 440x280 px | PNG/JPG | ✅ Yes |
| Screenshots | 1280x800 px | PNG/JPG | ✅ Yes (1-5) |
| Marquee promo | 1400x560 px | PNG/JPG | Optional |

### Step 2.1: Create the Promotional Image (440x280)

This appears in search results and the Chrome Web Store homepage.

**Design guidelines:**
- Don't just use a screenshot—communicate your brand
- Avoid text (or use minimal text)
- Use saturated colors
- Fill the entire region with no white borders
- Test that it looks good at half size

**What to include:**
- Your EzyCopy logo/icon
- Visual representation of the concept (webpage → markdown)
- Clean, professional design

**Tools you can use:**
- Figma (free): https://figma.com
- Canva (free): https://canva.com
- Adobe Express (free): https://adobe.com/express

### Step 2.2: Create Screenshots (1280x800)

Screenshots show the actual user experience. Create at least 1, ideally 3-5.

**Suggested screenshots for EzyCopy:**

1. **Popup UI** - Show the extension popup open on a webpage
2. **Before/After** - A webpage and the resulting markdown file
3. **Right-click menu** - Show the context menu option
4. **Settings/Options** - If you have a settings panel
5. **Output file** - The saved markdown file in a text editor

**How to capture:**
1. Set your browser window to exactly 1280x800:
   - Open DevTools (F12)
   - Click the device toolbar icon
   - Set dimensions to 1280x800
2. Take screenshot with your OS tool or a Chrome extension
3. Or use a larger window and crop to 1280x800

**Screenshot tips:**
- Use a clean, appealing webpage as your demo
- Make sure the extension popup/menu is clearly visible
- No personal information in screenshots
- Consistent branding across all screenshots

### Step 2.3: Marquee Image (Optional - 1400x560)

Only needed if you want to be considered for featured placement on the Chrome Web Store homepage. Same design principles as the promo tile, just larger.

---

## Part 3: Privacy Policy

**Required because EzyCopy accesses webpage content.**

### Step 3.1: Write Your Privacy Policy

Create a file `docs/PRIVACY_POLICY.md` with this content (customize as needed):

```markdown
# EzyCopy Privacy Policy

Last updated: [DATE]

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

## Contact

For questions about this privacy policy, please contact: [YOUR EMAIL]

## Changes to This Policy

Any changes to this privacy policy will be posted on this page with an updated revision date.
```

### Step 3.2: Host Your Privacy Policy

**Option A: GitHub Pages (Recommended)**

1. Your privacy policy is already in your repo at `docs/PRIVACY_POLICY.md`
2. Go to your GitHub repo → Settings → Pages
3. Enable GitHub Pages (source: main branch, /docs folder)
4. Your URL will be: `https://[username].github.io/EzyCopy/PRIVACY_POLICY`

**Option B: GitHub Raw File**

Use the raw file URL directly:
`https://raw.githubusercontent.com/[username]/EzyCopy/main/docs/PRIVACY_POLICY.md`

**Option C: Create a Simple Website**

Use any free hosting: Netlify, Vercel, or even a Google Doc (set to "Anyone with link can view")

---

## Part 4: Prepare Store Listing Content

### Step 4.1: Detailed Description

Write a compelling description (up to 16,000 characters). Here's a template:

```
EzyCopy - Save Any Webpage as Clean Markdown

Instantly extract and save article content from any webpage as a beautifully formatted Markdown file. Perfect for researchers, writers, students, and anyone who wants to save web content for offline reading or note-taking.

✦ FEATURES

• One-Click Extraction - Click the extension icon to instantly extract and save the main content
• Right-Click Menu - Right-click anywhere on a page to save it
• Clean Output - Removes ads, navigation, and clutter automatically
• Full Markdown Support - Headings, lists, links, images, tables, code blocks, and more
• GitHub Flavored Markdown - Tables, strikethrough, and task lists supported
• Smart Filenames - Automatically generates filenames from the article title and date
• Works Offline - All processing happens locally in your browser

✦ WHAT GETS EXTRACTED

• Article text with proper formatting
• Headings (H1-H6)
• Paragraphs and line breaks
• Bullet and numbered lists
• Links with proper [text](url) syntax
• Images with ![alt](url) syntax
• Tables (GFM format)
• Code blocks (fenced)
• Blockquotes
• Bold, italic, and strikethrough

✦ PRIVACY FOCUSED

EzyCopy processes everything locally in your browser. No data is ever sent to external servers. No tracking, no analytics, no accounts required.

✦ HOW TO USE

1. Navigate to any article or webpage
2. Click the EzyCopy icon in your toolbar (or right-click the page)
3. The markdown file is automatically saved to your Downloads folder

Perfect for saving articles, documentation, blog posts, tutorials, recipes, and any web content you want to keep.

Built with Mozilla's Readability (the same technology behind Firefox Reader View) and Turndown for reliable, high-quality extraction.
```

### Step 4.2: Short Description

Maximum 132 characters. This appears in search results.

```
Extract and save any webpage as clean Markdown. One-click article extraction with full formatting support.
```

### Step 4.3: Permission Justifications

You'll need to explain each permission in the Privacy Practices form:

| Permission | Justification |
|-----------|---------------|
| **activeTab** | Required to access the current webpage content when the user clicks the extension icon or uses the context menu. Only accesses the tab the user explicitly activates the extension on. |
| **scripting** | Required to inject the content extraction libraries (Readability.js and Turndown.js) into the webpage to extract and convert the article content. |
| **contextMenus** | Provides users an alternative way to trigger content extraction via right-click menu, improving accessibility and user experience. |
| **storage** | Stores user preferences locally (such as toggle settings). No personal data is stored. |
| **downloads** | Required to save the generated Markdown file to the user's Downloads folder. |
| **host_permissions: <all_urls>** | The extension must work on any webpage the user chooses to extract content from. Users decide which pages to use it on. No automatic background access occurs. |

### Step 4.4: Category Selection

Select: **Productivity**

Alternative options if Productivity doesn't fit:
- Tools
- Search Tools

---

## Part 5: Package and Submit

### Step 5.1: Prepare Your Extension Package

Create a ZIP file containing your extension files:

```bash
cd /path/to/EzyCopy
zip -r EzyCopy.zip . -x "*.git*" -x "docs/*" -x "*.DS_Store" -x "*.md"
```

**Files to include:**
- manifest.json
- popup.html, popup.js, popup.css
- background.js
- content-script.js
- lib/ folder (all .js files)
- icons/ folder (all icon sizes)

**Files to exclude:**
- .git folder
- docs/ folder
- README.md, CLAUDE.md
- Any development/test files

### Step 5.2: Upload to Chrome Web Store

1. Go to: https://chrome.google.com/webstore/devconsole
2. Click **"New Item"** button
3. Upload your ZIP file
4. You'll be taken to the item dashboard

### Step 5.3: Fill Out Store Listing

In the **Store Listing** tab:

1. **Language**: Select primary language (English)
2. **Extension name**: EzyCopy
3. **Short description**: (paste your 132-char version)
4. **Description**: (paste your full description)
5. **Category**: Productivity
6. **Upload screenshots**: Add your 1280x800 images
7. **Upload promotional images**: Add your 440x280 image

### Step 5.4: Fill Out Privacy Practices

In the **Privacy practices** tab:

1. **Single purpose description**:
   > "Extract and save webpage article content as Markdown files"

2. **Permission justifications**: Use the table from Step 4.3

3. **Data use certification**:
   - Check the boxes confirming you comply with the policies
   - You do NOT need to declare "sells user data" or "uses for unrelated purposes"

4. **Privacy policy URL**: Enter your hosted privacy policy URL

### Step 5.5: Distribution Settings

In the **Distribution** tab:

1. **Visibility**: Public (or Unlisted if you want to test first)
2. **Countries**: All countries (or select specific ones)
3. **Pricing**: Free

### Step 5.6: Submit for Review

1. Review all tabs for completeness
2. Click **"Submit for Review"**
3. You'll receive a confirmation email

---

## Part 6: After Submission

### Review Timeline

- **Typical review time**: 1-3 business days
- **Complex extensions**: Up to 7 days
- Check status at: https://chrome.google.com/webstore/devconsole

### If Your Extension is Approved

1. You'll receive an email notification
2. Go to the developer dashboard
3. Your extension will show "Pending publication"
4. Click **"Publish"** to make it live
5. Note: You have 30 days to publish before approval expires

### If Your Extension is Rejected

Common rejection reasons and fixes:

| Rejection Reason | How to Fix |
|-----------------|------------|
| Missing privacy policy | Add a valid, accessible privacy policy URL |
| Insufficient permission justification | Provide more detailed explanations for each permission |
| Misleading description | Ensure description accurately reflects functionality |
| Poor quality screenshots | Replace with clear, high-quality images |
| Code policy violation | Remove any code that fetches/executes remote scripts |

You can appeal rejections or resubmit with fixes.

---

## Quick Links Reference

### Official Documentation
- Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Publishing Guide: https://developer.chrome.com/docs/webstore/publish
- Image Requirements: https://developer.chrome.com/docs/webstore/images
- Listing Best Practices: https://developer.chrome.com/docs/webstore/best-listing
- Program Policies: https://developer.chrome.com/docs/webstore/program-policies
- MV3 Requirements: https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements
- Privacy Policy Requirements: https://developer.chrome.com/docs/webstore/program-policies/privacy
- Limited Use Policy: https://developer.chrome.com/docs/webstore/program-policies/limited-use

### Design Tools (Free)
- Figma: https://figma.com
- Canva: https://canva.com
- Adobe Express: https://adobe.com/express
- Remove.bg (for backgrounds): https://remove.bg

### Privacy Policy Hosting (Free)
- GitHub Pages: https://pages.github.com
- Netlify: https://netlify.com
- Vercel: https://vercel.com

---

## Troubleshooting

### "Permission denied" for downloads
Make sure your manifest includes the `downloads` permission and you're using the Chrome downloads API correctly.

### Extension works locally but not after publishing
Check that all file paths in your code are relative, not absolute. Verify all files are included in the ZIP.

### Screenshots look blurry
Use exactly 1280x800 or 640x400 dimensions. Don't upscale smaller images.

### Privacy policy URL rejected
Ensure the URL is publicly accessible (not behind a login). Test in an incognito window.

---

## Post-Publication

Once published:

1. **Monitor reviews**: Check the developer dashboard for user feedback
2. **Respond to reviews**: Address user concerns professionally
3. **Track installs**: Dashboard shows installation statistics
4. **Update regularly**: Push updates through the same dashboard
5. **Maintain privacy policy**: Keep it current if you add features

For updates, increment the version in `manifest.json` and upload a new ZIP.

---

Good luck with your launch!
