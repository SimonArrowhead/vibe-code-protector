# Vibe Code Protector

## Overview
Vibe Code Protector is a Visual Studio Code extension designed to enhance the security of AI instruction files by detecting and preventing potential security issues. It identifies problematic content such as zero-width characters, right-to-left overrides, prompt injection patterns, homoglyphs, and various malicious content patterns.

## Features
- **Smart Document Scanning**: Automatically scans documents for AI instruction security issues upon opening or saving
- **Multi-Level Sanitization**: 
  - Basic sanitization for quick cleanup
  - Selective sanitization allowing you to choose which elements to remove
  - Custom pattern management for prompt injection detection
- **Comprehensive Detection**:
  - Zero-width and invisible characters
  - Right-to-left override characters
  - Homoglyphs (Cyrillic characters that look like Latin)
  - Private Use Area Unicode characters
  - Over 30 prompt injection patterns
  - Unicode Tags and surrogate pairs
  - Harmful content patterns
  - Base64 encoded instructions
- **File Monitoring**:
  - Automatic monitoring of critical files like `.github/copilot-instructions.md`
  - Custom file path monitoring (relative or absolute paths)
  - Real-time scanning when monitored files change
  - Notifications for security issues in monitored files
- **File Ignore System**:
  - Exclude specific files from being scanned
  - Ignore entire folders from scanning
  - Use glob patterns for more advanced ignore rules
  - Quickly ignore the current file with a single command

## Feedback and Notifications
The extension provides helpful feedback throughout your workflow:

- When issues are detected, they appear as warnings or errors in your document
- After scanning a document with no issues, a confirmation message appears
- After sanitization, the document is automatically rescanned to verify all issues were fixed
- Hover over detected issues for detailed information about the security concern
- Notifications when monitored files are changed or contain security issues

## Installation
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Vibe Code Protector"
4. Click Install

## Usage
### Commands
Access these commands via the Command Palette (Ctrl+Shift+P):
- `VCP: Scan for Security Issues` - Scans current document for security issues
- `VCP: Sanitize Document` - Removes all detected security issues
- `VCP: Selective Sanitize` - Choose which types of issues to remove
- `VCP: Manage Custom Patterns` - Add/remove custom prompt injection patterns
- `VCP: Configure Monitored Files` - Add/remove files to monitor for security issues
- `VCP: View Monitored Files Settings` - Opens settings focused on monitored files
- `VCP: Ignore Current File` - Exclude current file from security scanning
- `VCP: Manage Ignored Files` - Add/remove files and folders to ignore
- `VCP: Open Settings` - Configure extension settings

### Context Menu
Right-click in the editor to access:
- Scan for Security Issues
- Sanitize Document
- Selective Sanitize
- Ignore Current File

These commands appear in their own "Vibe Code Protector" section in the context menu.

### Basic Settings
```json
{
  "vibeCodeProtector.autoScan": true,
  "vibeCodeProtector.detection.zeroWidth": true,
  "vibeCodeProtector.detection.rtlOverride": true,
  "vibeCodeProtector.detection.homoglyphs": true,
  "vibeCodeProtector.detection.invisibleChars": true,
  "vibeCodeProtector.detection.privateUseArea": true,
  "vibeCodeProtector.detection.promptInjection": true
}
```

### File Monitoring Settings
```json
{
  "vibeCodeProtector.monitoredFiles": [".github/copilot-instructions.md"],
  "vibeCodeProtector.monitoredFilesEnabled": true,
  "vibeCodeProtector.monitoredFilesNotifications": true
}
```
### Ignore File Settings
```json
{
  "vibeCodeProtector.ignoredFiles": ["path/to/file.md"],
  "vibeCodeProtector.ignoredFolders": ["node_modules"],
  "vibeCodeProtector.ignoreGlobPatterns": ["**/*.min.js", "**/dist/**"]
}
```

### Custom Prompt Injection Patterns
Add your own patterns to detect specific threats:
```json
{
  "vibeCodeProtector.promptInjection.customPatterns": [
    "bypass .*? filters",
    "disregard your programming",
    "exit (this |your |the )?role"
  ]
}
```
### Detection Categories
- **Invisible Characters**: Zero-width spaces, RTL overrides, Unicode Tags
- **Homoglyphs**: Cyrillic characters that look like Latin letters
- **Prompt Injection**:
   - Basic override attempts
   - Role manipulation
   - DAN and jailbreak attempts
   - Token manipulation
   - Hypothetical scenarios
   - Authority impersonation
   - Two-stage attacks
   - Format manipulation
   - Emotional manipulation
- **Harmful Content**:
   - Direct harmful instructions
   - Malicious code requests
   - Rule-breaking attempts
   - Base64 encoded instructions

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.

## Acknowledgments
Thanks to the open-source community for their contributions and support in developing this extension.