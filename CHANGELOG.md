# CHANGELOG.md

# Changelog for Vibe Code Protector

## [0.1.0] - 2025-04-19
### Added
- Initial release of the Vibe Code Protector extension.
- Functionality to scan documents for AI instruction security issues.
- Regex patterns for detecting zero-width characters, right-to-left overrides, prompt injection patterns, and homoglyphs.
- Commands for scanning and sanitizing documents.
- Auto-scan feature on document open and save events.

## [0.1.1] - 2025-04-20
### Added
- Updated and fixed issues in the README file
- Moved test files to the test directory
- Renamed commands to use "VCP:" prefix for better identification
- Added context menu integration with a dedicated "Vibe Code Protector" section

## [0.1.2] - 2025-04-20
### Added
- Added confirmation message when no security issues are detected
- Improved user feedback after scanning and sanitization operations

### Fixed
- Prevented "No security issues detected" message from appearing after sanitization
- Fixed several minor bugs in pattern detection

## [0.2.0] - 2025-04-20
### Added
- File monitoring system for critical AI instruction files
- Support for workspace-relative and absolute file paths in monitoring
- `VCP: Configure Monitored Files` command to add/remove monitored files
- `VCP: View Monitored Files Settings` command for quick settings access
- Real-time scanning of monitored files when they change
- Notifications for security issues in monitored files

### Fixed
- Corrected extension namespace from 'aiInstructionSecurity' to 'vibeCodeProtector'
- Improved file detection and scanning reliability
- Better handling of configuration changes