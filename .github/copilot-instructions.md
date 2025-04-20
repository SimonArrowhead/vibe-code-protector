# Vibe Code Protector - Copilot Instructions

## Project Overview
Vibe Code Protector is a VS Code extension that detects and sanitizes security issues in AI instruction files, including zero-width characters, right-to-left overrides, homoglyphs, and prompt injection patterns.

## Coding Guidelines
- Follow JavaScript best practices
- Use consistent naming conventions: camelCase for variables and functions
- Comment complex logic
- Handle errors gracefully
- Write unit tests for new functionality

## Key Files and Their Purpose
- `extension.js`: Main extension entry point
- `scanService.js`: Contains logic for scanning documents
- `sanitizeService.js`: Contains logic for sanitizing problematic content
- `patterns.js`: Defines regex patterns for detecting security issues
- `fileMonitorService.js`: Monitors critical files for changes

## Feature Context
The extension provides detection and sanitization for:
1. Zero-width characters (U+200B, U+200C, U+200D)
2. Right-to-left overrides (U+202E)
3. Homoglyphs (Cyrillic characters that look like Latin)
4. Various prompt injection patterns
5. File monitoring for critical files

## Implementation Details
- Use regular expressions to identify problematic patterns
- Provide visual diagnostics in the editor for detected issues
- Implement sanitization functionality to remove or replace detected issues
- Monitor critical files (like AI instructions) for changes and scan automatically
- Support user-configurable settings for detection sensitivity

## Expected Behavior
- When zero-width characters are detected, show diagnostics highlighting their position
- When RTL overrides are found, show warning and offer to sanitize
- For homoglyphs, highlight the characters and show which script they belong to
- For prompt injection patterns, show high-severity warnings
- When monitored files change, scan automatically and notify user of issues

## Pattern Descriptions
The extension should detect:

1. Zero-width space: Characters that take up no visual space but affect text behavior
2. RTL override: Unicode characters that change text direction right-to-left
3. Homoglyphs: Characters from non-Latin scripts that visually resemble Latin characters
4. Prompt injection: Text patterns attempting to manipulate AI systems

## Extension Settings
Users can configure:
- Which detection types to enable/disable
- Custom prompt injection patterns
- Files to monitor automatically
- Notification preferences
- Default sanitization behavior

## Testing Instructions
- Test with various edge case inputs
- Verify proper detection of all defined patterns
- Ensure sanitization properly removes problematic content
- Verify file monitoring alerts work correctly