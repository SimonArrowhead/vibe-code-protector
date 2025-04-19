const vscode = require('vscode');

function createDiagnostic(range, message, severity, source, code) {
  return new vscode.Diagnostic(range, message, severity, source, code);
}

function updateDiagnostics(diagnosticCollection, document, diagnostics) {
  diagnosticCollection.set(document.uri, diagnostics);
}

function showWarningMessage(message) {
  vscode.window.showWarningMessage(message);
}

module.exports = {
  createDiagnostic,
  updateDiagnostics,
  showWarningMessage
};