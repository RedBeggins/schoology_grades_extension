# Schoology Grades Extension
![image](https://github.com/user-attachments/assets/178b879f-fece-4e62-a637-46ae8030bc91)

This repository contains a Chrome extension designed to enhance the display of grades on Schoology. It aims to provide a more user-friendly and informative overview of your academic performance.

## Features:
- **Improved Grade Visualization**: Presents grades in a clear and organized manner.
- **Quick Access**: Easily view your grades directly from the extension popup.
- **Customizable Display**: (Potentially) Allows users to customize how grades are presented.

## Installation:
To install this extension:
1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" by toggling the switch in the top right corner.
4. Click on "Load unpacked" and select the `schoology_grades_extension` directory from your downloaded repository.
5. The extension should now be installed and visible in your Chrome extensions list.

## Usage:
1. Navigate to Schoology and log in to your account.
2. The extension will automatically enhance the grades display on relevant pages.
3. Click on the extension icon in your Chrome toolbar to access the popup for quick grade summaries or additional features.

## Files:
- `schoology_grades_extension/manifest.json`: The manifest file for the Chrome extension. It defines the extension's name, version, permissions, background scripts, content scripts, and other essential metadata.
- `schoology_grades_extension/background.js`: This script runs in the background and handles events such as extension installation, updates, and communication with other parts of the extension. It might also manage alarms or context menus.
- `schoology_grades_extension/content.js`: This script is injected into Schoology web pages. It interacts with the page's DOM to extract grade information, modify the display, or inject new UI elements.
- `schoology_grades_extension/grades_display.html`: An HTML file that serves as a template or container for displaying detailed grade information within the extension's context, possibly in a new tab or a dedicated section.
- `schoology_grades_extension/grades_display.js`: The JavaScript file associated with `grades_display.html`. It contains the logic for fetching, processing, and rendering the grade data onto the HTML page.
- `schoology_grades_extension/popup.html`: The HTML file for the extension's popup window, which appears when the user clicks the extension icon in the browser toolbar.
- `schoology_grades_extension/popup.js`: The JavaScript file that controls the functionality of the extension's popup. It handles user interactions within the popup and communicates with background scripts or content scripts.
- `schoology_grades_extension/images/`: This directory contains various image assets used by the extension, such as icons for different sizes (16x16, 48x48, 128x128) as specified in the manifest file.
