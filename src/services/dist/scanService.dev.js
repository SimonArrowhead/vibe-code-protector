"use strict";

var vscode = require('vscode');

var PATTERNS = require('../utils/patterns');

var _require = require('../utils/diagnostics'),
    createDiagnostic = _require.createDiagnostic,
    updateDiagnostics = _require.updateDiagnostics;

function scanDocument(document, diagnosticCollection) {
  var text = document.getText();
  var diagnostics = [];
  var match;

  while ((match = PATTERNS.ZERO_WIDTH.exec(text)) !== null) {
    var startPos = document.positionAt(match.index);
    var endPos = document.positionAt(match.index + match[0].length);
    diagnostics.push(createDiagnostic(startPos, endPos, 'Hidden zero-width character detected.'));
  }

  while ((match = PATTERNS.RTL_OVERRIDE.exec(text)) !== null) {
    var _startPos = document.positionAt(match.index);

    var _endPos = document.positionAt(match.index + match[0].length);

    diagnostics.push(createDiagnostic(_startPos, _endPos, 'Right-to-left override character detected.'));
  }

  while ((match = PATTERNS.PROMPT_INJECTION.exec(text)) !== null) {
    var _startPos2 = document.positionAt(match.index);

    var _endPos2 = document.positionAt(match.index + match[0].length);

    diagnostics.push(createDiagnostic(_startPos2, _endPos2, 'Potential prompt injection detected.'));
  }

  while ((match = PATTERNS.HOMOGLYPHS.exec(text)) !== null) {
    var _startPos3 = document.positionAt(match.index);

    var _endPos3 = document.positionAt(match.index + match[0].length);

    diagnostics.push(createDiagnostic(_startPos3, _endPos3, 'Potential homoglyph detected.'));
  }

  updateDiagnostics(diagnosticCollection, document, diagnostics);
  return diagnostics;
}

module.exports = {
  scanDocument: scanDocument
};