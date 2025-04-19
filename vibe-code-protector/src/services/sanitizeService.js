const PATTERNS = require('../utils/patterns');

async function sanitizeDocument(editor) {
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();

  const sanitized = text
    .replace(PATTERNS.ZERO_WIDTH, '')
    .replace(PATTERNS.RTL_OVERRIDE, '');

  await editor.edit(editBuilder => {
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );
    editBuilder.replace(fullRange, sanitized);
  });

  vscode.window.showInformationMessage('Document sanitized.');
}

module.exports = {
  sanitizeDocument
};