# SwiftPlay Video Speed Controller

A Chrome extension for controlling video playback speed on any website.

## Features

- Control video playback speed with keyboard shortcuts
- Simple popup interface with common speed presets
- Customizable keyboard shortcuts and speed increments
- Works across all websites with HTML5 video players
- Enhanced privacy with activeTab permission only

## Privacy & Security

Version 1.4.3 has been restructured to use only the activeTab permission instead of requesting access to all sites by default. This means:

1. The extension only gets temporary access to the site you're actively viewing
2. Access is only granted when you interact with the extension
3. No persistent access to websites when you're not using the extension
4. Your browsing data and privacy are better protected

## Installation

### Chrome Web Store (Recommended)
Search for "SwiftPlay Video Speed Controller" on the Chrome Web Store or visit [the store page](https://chrome.google.com/webstore/detail/swiftplay-video-speed-controller/).

### Manual Installation
1. Download the latest release from the [releases page](https://github.com/yourusername/SwiftPlay/releases)
2. Go to chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked" and select the unzipped folder

## How to Use

1. Click the extension icon when viewing a page with video
2. Use the popup controls to adjust speed
3. Use keyboard shortcuts (Alt+A to slow down, Alt+S to speed up by default)

## Default Keyboard Shortcuts

- Alt+A: Slow down video
- Alt+S: Speed up video
- Alt+,: Reset to normal speed
- Alt+.: Set to maximum speed

These shortcuts can be customized in the extension popup settings.

## Development

### Building from Source
1. Clone this repository
2. Make your changes
3. Load the unpacked extension in Chrome

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 