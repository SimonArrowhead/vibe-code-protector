const vscode = require('vscode');
const PATTERNS = require('../utils/patterns');
const { createDiagnostic, updateDiagnostics } = require('../utils/diagnostics');

function scanDocument(document, diagnosticCollection, afterSanitization = false) {
  const config = vscode.workspace.getConfiguration('vibeCodeProtector');
  const text = document.getText();
  const diagnostics = [];
  
  // Reset pattern indices
  PATTERNS.ZERO_WIDTH.lastIndex = 0;
  PATTERNS.RTL_OVERRIDE.lastIndex = 0;
  PATTERNS.HOMOGLYPHS.lastIndex = 0;
  PATTERNS.INVISIBLE_CHARS.lastIndex = 0;
  PATTERNS.HANGUL_FILLER.lastIndex = 0;
  PATTERNS.PRIVATE_USE_AREA.lastIndex = 0;
  PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_A.lastIndex = 0;
  PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_B.lastIndex = 0;
  PATTERNS.TAGS.lastIndex = 0;
  
  let match;
  // Only check if the corresponding detection is enabled
  if (config.get('detection.zeroWidth')) {
    while ((match = PATTERNS.ZERO_WIDTH.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      diagnostics.push(createDiagnostic(startPos, endPos, 'Hidden zero-width character detected.'));
    }
  }

  if (config.get('detection.rtlOverride')) {
    while ((match = PATTERNS.RTL_OVERRIDE.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      diagnostics.push(createDiagnostic(startPos, endPos, 'Right-to-left override character detected.'));
    }
  }

  if (config.get('detection.homoglyphs')) {
    while ((match = PATTERNS.HOMOGLYPHS.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      diagnostics.push(createDiagnostic(startPos, endPos, 'Potential homoglyph detected.'));
    }
  }

  if (config.get('detection.invisibleChars')) {
    while ((match = PATTERNS.INVISIBLE_CHARS.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      diagnostics.push(createDiagnostic(startPos, endPos, 'Invisible character detected.'));
    }
    while ((match = PATTERNS.HANGUL_FILLER.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      diagnostics.push(createDiagnostic(startPos, endPos, 'Hangul Filler character detected (invisible but space-taking character)'));
    }
    while ((match = PATTERNS.BLANK_SPACES.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      diagnostics.push(createDiagnostic(startPos, endPos, 'Blank space character detected.'));
    }
    // For proper detection of Unicode Tags surrogate pairs
    PATTERNS.TAGS_SURROGATES.lastIndex = 0;
    while ((match = PATTERNS.TAGS_SURROGATES.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      
      // Get the actual code point from surrogate pair
      const highSurrogate = match[0].charCodeAt(0);
      const lowSurrogate = match[0].charCodeAt(1);
      const codePoint = 0x10000 + ((highSurrogate & 0x3FF) << 10) + (lowSurrogate & 0x3FF);
      
      // Format as U+E00xx for clarity
      const codePointHex = codePoint.toString(16).toUpperCase().padStart(5, '0');
      
      diagnostics.push(createDiagnostic(startPos, endPos, 
        `Unicode Tags character detected (U+${codePointHex}). These characters may hide malicious content.`));
    }
  }

  if (config.get('detection.privateUseArea')) {
    while ((match = PATTERNS.PRIVATE_USE_AREA.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      diagnostics.push(createDiagnostic(startPos, endPos, 'Private Use Area Unicode character detected. These characters may hide malicious content.'));
    }
    while ((match = PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_A.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      diagnostics.push(createDiagnostic(startPos, endPos, 'Supplementary Private Use Area-A character detected. These characters may hide malicious content.'));
    }  
    while ((match = PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_B.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      diagnostics.push(createDiagnostic(startPos, endPos, 'Supplementary Private Use Area-B character detected. These characters may hide malicious content.'));
    }
  }

  if (config.get('detection.promptInjection')) {
    checkPromptInjection(PATTERNS.PROMPT_INJECTION_IGNORE, text, document, diagnostics);
    checkPromptInjection(PATTERNS.PROMPT_INJECTION_DONT_FOLLOW, text, document, diagnostics);
    checkPromptInjection(PATTERNS.PROMPT_INJECTION_OMIT_SKIP, text, document, diagnostics);
    checkPromptInjection(PATTERNS.PROMPT_INJECTION_GENERATE, text, document, diagnostics);
    checkPromptInjection(PATTERNS.PROMPT_INJECTION_EXECUTE, text, document, diagnostics);

    // Also check custom patterns if defined
    const customPatterns = config.get('promptInjection.customPatterns') || [];
    for (const patternStr of customPatterns) {
      try {
        const customPattern = new RegExp(patternStr, 'gi');
        checkPromptInjection(customPattern, text, document, diagnostics);
      } catch (e) {
        console.error(`Invalid custom pattern: ${patternStr}`, e);
      }
    }
  }

  updateDiagnostics(diagnosticCollection, document, diagnostics);
  
  // Add message when no issues are found, but only if not after sanitization
  if (diagnostics.length === 0 && !afterSanitization) {
    vscode.window.showInformationMessage('Vibe Code Protector: No security issues detected in this document.');
  }
  
  return diagnostics;
}

const checkPromptInjection = (pattern, text, document, diagnostics) => {
  pattern.lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    diagnostics.push(createDiagnostic(startPos, endPos, 'Potential prompt injection detected.'));
  }
};

module.exports = {
  scanDocument
};