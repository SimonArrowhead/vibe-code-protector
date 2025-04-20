Vibe Code Protector

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

## Feedback and Notifications
The extension provides helpful feedback throughout your workflow:

- When issues are detected, they appear as warnings or errors in your document
- After scanning a document with no issues, a confirmation message appears
- After sanitization, the document is automatically rescanned to verify all issues were fixed
- Hover over detected issues for detailed information about the security concern

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
- `VCP: Open Settings` - Configure extension settings

### Context Menu
Right-click in the editor to access:
- Scan for Security Issues
- Sanitize Document
- Selective Sanitize

These commands appear in their own "Vibe Code Protector" section in the context menu.

### Basic Settings
```json
{
  "aiInstructionSecurity.autoScan": true,
  "aiInstructionSecurity.detection.zeroWidth": true,
  "aiInstructionSecurity.detection.rtlOverride": true,
  "aiInstructionSecurity.detection.homoglyphs": true,
  "aiInstructionSecurity.detection.invisibleChars": true,
  "aiInstructionSecurity.detection.privateUseArea": true,
  "aiInstructionSecurity.detection.promptInjection": true
}
```
### Custom Prompt Injection Patterns
Add your own patterns to detect specific threats:
```json
{
  "aiInstructionSecurity.promptInjection.customPatterns": [
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