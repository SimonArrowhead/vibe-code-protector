const vscode = require('vscode');
const { PATTERNS } = require('../utils/patterns');
const { createDiagnostic } = require('../utils/diagnostics');

function scanDocument(document) {
  const text = document.getText();
  const diagnostics = [];

  let match;
  while ((match = PATTERNS.ZERO_WIDTH.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    diagnostics.push(createDiagnostic(startPos, endPos, 'Hidden zero-width character detected.'));
  }

  while ((match = PATTERNS.RTL_OVERRIDE.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    diagnostics.push(createDiagnostic(startPos, endPos, 'Right-to-left override character detected.'));
  }

  while ((match = PATTERNS.PROMPT_INJECTION.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    diagnostics.push(createDiagnostic(startPos, endPos, 'Potential prompt injection detected.'));
  }

  while ((match = PATTERNS.HOMOGLYPHS.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    diagnostics.push(createDiagnostic(startPos, endPos, 'Potential homoglyph detected.'));
  }

  return diagnostics;
}

module.exports = {
  scanDocument
};