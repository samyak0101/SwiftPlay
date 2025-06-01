# Chrome Web Store Submission Guide

This document contains instructions and assets for submitting SwiftPlay to the Chrome Web Store.

## Submission Checklist

- [ ] Zip the extension package
- [ ] Prepare store assets
- [ ] Complete store listing details
- [ ] Submit for review

## Store Listing Information

### Basic Information

**Extension Name:** SwiftPlay
**Summary:** Take control of video playback speed on any website
**Description:** See `description.txt` for the full store description

### Category
- **Primary Category:** Productivity
- **Secondary Category:** Tools

### Visibility Options
- **Visibility:** Public
- **Distribution:** Available to all Chrome Web Store users

## Assets

### Required Images
- **Store Icon:** 128x128 PNG icon (icons/icon128.png)
- **Screenshots:** At least 1-5 screenshots (1280x800 or 640x400)
  - Main UI screenshot
  - Settings panel screenshot
  - Extension in action screenshot

### Promotional Images (Optional)
- Small Promo Tile: 440x280 PNG
- Large Promo Tile: 920x680 PNG
- Marquee Promo Tile: 1400x560 PNG

## Privacy

- Privacy Policy URL: Link to PRIVACY.md in the GitHub repository
- Permission Justifications: Explain why each permission is needed
  - `storage`: For saving user preferences
  - `activeTab`: For accessing video content on the current page
  - `scripting`: For controlling video playback speed
  - `alarms`: For maintaining speed settings

## Submission Tips

1. Make sure the manifest.json is valid
2. Test thoroughly before submission
3. Respond promptly to any reviewer questions
4. Allow 1-3 business days for review

## Post-Submission

- Monitor the developer dashboard for updates
- Address any feedback from reviewers
- Once approved, the extension will be publicly available 