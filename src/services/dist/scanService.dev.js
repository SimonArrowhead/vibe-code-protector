"use strict";

var vscode = require('vscode');

var PATTERNS = require('../utils/patterns');

var _require = require('../utils/diagnostics'),
    createDiagnostic = _require.createDiagnostic,
    updateDiagnostics = _require.updateDiagnostics;

function scanDocument(document, diagnosticCollection) {
  var afterSanitization = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var config = vscode.workspace.getConfiguration('vibeCodeProtector');
  var text = document.getText();
  var diagnostics = []; // Reset pattern indices

  PATTERNS.ZERO_WIDTH.lastIndex = 0;
  PATTERNS.RTL_OVERRIDE.lastIndex = 0;
  PATTERNS.HOMOGLYPHS.lastIndex = 0;
  PATTERNS.INVISIBLE_CHARS.lastIndex = 0;
  PATTERNS.HANGUL_FILLER.lastIndex = 0;
  PATTERNS.PRIVATE_USE_AREA.lastIndex = 0;
  PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_A.lastIndex = 0;
  PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_B.lastIndex = 0;
  PATTERNS.TAGS.lastIndex = 0;
  var match; // Only check if the corresponding detection is enabled

  if (config.get('detection.zeroWidth')) {
    while ((match = PATTERNS.ZERO_WIDTH.exec(text)) !== null) {
      var startPos = document.positionAt(match.index);
      var endPos = document.positionAt(match.index + match[0].length);
      diagnostics.push(createDiagnostic(startPos, endPos, 'Hidden zero-width character detected.'));
    }
  }

  if (config.get('detection.rtlOverride')) {
    while ((match = PATTERNS.RTL_OVERRIDE.exec(text)) !== null) {
      var _startPos = document.positionAt(match.index);

      var _endPos = document.positionAt(match.index + match[0].length);

      diagnostics.push(createDiagnostic(_startPos, _endPos, 'Right-to-left override character detected.'));
    }
  }

  if (config.get('detection.homoglyphs')) {
    while ((match = PATTERNS.HOMOGLYPHS.exec(text)) !== null) {
      var _startPos2 = document.positionAt(match.index);

      var _endPos2 = document.positionAt(match.index + match[0].length);

      diagnostics.push(createDiagnostic(_startPos2, _endPos2, 'Potential homoglyph detected.'));
    }
  }

  if (config.get('detection.invisibleChars')) {
    while ((match = PATTERNS.INVISIBLE_CHARS.exec(text)) !== null) {
      var _startPos3 = document.positionAt(match.index);

      var _endPos3 = document.positionAt(match.index + match[0].length);

      diagnostics.push(createDiagnostic(_startPos3, _endPos3, 'Invisible character detected.'));
    }

    while ((match = PATTERNS.HANGUL_FILLER.exec(text)) !== null) {
      var _startPos4 = document.positionAt(match.index);

      var _endPos4 = document.positionAt(match.index + match[0].length);

      diagnostics.push(createDiagnostic(_startPos4, _endPos4, 'Hangul Filler character detected (invisible but space-taking character)'));
    }

    while ((match = PATTERNS.BLANK_SPACES.exec(text)) !== null) {
      var _startPos5 = document.positionAt(match.index);

      var _endPos5 = document.positionAt(match.index + match[0].length);

      diagnostics.push(createDiagnostic(_startPos5, _endPos5, 'Blank space character detected.'));
    } // For proper detection of Unicode Tags surrogate pairs


    PATTERNS.TAGS_SURROGATES.lastIndex = 0;

    while ((match = PATTERNS.TAGS_SURROGATES.exec(text)) !== null) {
      var _startPos6 = document.positionAt(match.index);

      var _endPos6 = document.positionAt(match.index + match[0].length); // Get the actual code point from surrogate pair


      var highSurrogate = match[0].charCodeAt(0);
      var lowSurrogate = match[0].charCodeAt(1);
      var codePoint = 0x10000 + ((highSurrogate & 0x3FF) << 10) + (lowSurrogate & 0x3FF); // Format as U+E00xx for clarity

      var codePointHex = codePoint.toString(16).toUpperCase().padStart(5, '0');
      diagnostics.push(createDiagnostic(_startPos6, _endPos6, "Unicode Tags character detected (U+".concat(codePointHex, "). These characters may hide malicious content.")));
    }
  }

  if (config.get('detection.privateUseArea')) {
    while ((match = PATTERNS.PRIVATE_USE_AREA.exec(text)) !== null) {
      var _startPos7 = document.positionAt(match.index);

      var _endPos7 = document.positionAt(match.index + match[0].length);

      diagnostics.push(createDiagnostic(_startPos7, _endPos7, 'Private Use Area Unicode character detected. These characters may hide malicious content.'));
    }

    while ((match = PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_A.exec(text)) !== null) {
      var _startPos8 = document.positionAt(match.index);

      var _endPos8 = document.positionAt(match.index + match[0].length);

      diagnostics.push(createDiagnostic(_startPos8, _endPos8, 'Supplementary Private Use Area-A character detected. These characters may hide malicious content.'));
    }

    while ((match = PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_B.exec(text)) !== null) {
      var _startPos9 = document.positionAt(match.index);

      var _endPos9 = document.positionAt(match.index + match[0].length);

      diagnostics.push(createDiagnostic(_startPos9, _endPos9, 'Supplementary Private Use Area-B character detected. These characters may hide malicious content.'));
    }
  }

  if (config.get('detection.promptInjection')) {
    checkPromptInjection(PATTERNS.PROMPT_INJECTION_IGNORE, text, document, diagnostics);
    checkPromptInjection(PATTERNS.PROMPT_INJECTION_DONT_FOLLOW, text, document, diagnostics);
    checkPromptInjection(PATTERNS.PROMPT_INJECTION_OMIT_SKIP, text, document, diagnostics);
    checkPromptInjection(PATTERNS.PROMPT_INJECTION_GENERATE, text, document, diagnostics);
    checkPromptInjection(PATTERNS.PROMPT_INJECTION_EXECUTE, text, document, diagnostics); // Also check custom patterns if defined

    var customPatterns = config.get('promptInjection.customPatterns') || [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = customPatterns[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var patternStr = _step.value;

        try {
          var customPattern = new RegExp(patternStr, 'gi');
          checkPromptInjection(customPattern, text, document, diagnostics);
        } catch (e) {
          console.error("Invalid custom pattern: ".concat(patternStr), e);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  updateDiagnostics(diagnosticCollection, document, diagnostics); // Add message when no issues are found, but only if not after sanitization

  if (diagnostics.length === 0 && !afterSanitization) {
    vscode.window.showInformationMessage('Vibe Code Protector: No security issues detected in this document.');
  }

  return diagnostics;
}

var checkPromptInjection = function checkPromptInjection(pattern, text, document, diagnostics) {
  pattern.lastIndex = 0;
  var match;

  while ((match = pattern.exec(text)) !== null) {
    var startPos = document.positionAt(match.index);
    var endPos = document.positionAt(match.index + match[0].length);
    diagnostics.push(createDiagnostic(startPos, endPos, 'Potential prompt injection detected.'));
  }
};

module.exports = {
  scanDocument: scanDocument
};