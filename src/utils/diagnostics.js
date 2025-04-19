const vscode = require('vscode');

function createDiagnostic(startPos, endPos, message, severity = vscode.DiagnosticSeverity.Warning, source = 'AI Instruction Security', code = null) {
  const range = new vscode.Range(startPos, endPos);
  const diagnostic = new vscode.Diagnostic(range, message, severity);
  diagnostic.source = source;
  if (code) diagnostic.code = code;
  return diagnostic;
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