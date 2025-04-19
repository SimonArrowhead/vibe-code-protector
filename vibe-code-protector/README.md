# Vibe Code Protector

## Overview
Vibe Code Protector is a Visual Studio Code extension designed to enhance the security of AI instruction files by scanning for potential security issues. It detects problematic content such as zero-width characters, right-to-left overrides, prompt injection patterns, and homoglyphs.

## Features
- **Scan Documents**: Automatically scan documents for AI instruction security issues upon opening or saving.
- **Sanitize Documents**: Remove problematic characters from documents to ensure clean and secure content.
- **Diagnostic Messages**: Provides clear diagnostic messages for detected issues, helping users understand and resolve potential vulnerabilities.

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/vibe-code-protector.git
   ```
2. Navigate to the project directory:
   ```
   cd vibe-code-protector
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Open the project in Visual Studio Code.

## Usage
- Use the command palette (Ctrl+Shift+P) to access the following commands:
  - **Scan Document**: `aiInstructionSecurity.scan` - Scans the current document for security issues.
  - **Sanitize Document**: `aiInstructionSecurity.sanitize` - Sanitizes the current document by removing problematic characters.

## Configuration
You can configure the extension settings in your `settings.json` file. For example, you can enable or disable auto-scanning when documents are opened.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.

## Acknowledgments
Thanks to the open-source community for their contributions and support in developing this extension.