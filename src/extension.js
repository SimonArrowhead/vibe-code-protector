const vscode = require('vscode');
const { scanDocument } = require('./services/scanService');
const { sanitizeDocument } = require('./services/sanitizeService');
const { isAiInstructionFile } = require('./utils/fileDetection');
const diagnosticCollection = vscode.languages.createDiagnosticCollection('aiInstructionSecurity');

function activate(context) {
  context.subscriptions.push(diagnosticCollection);

  const scanCommand = vscode.commands.registerCommand('aiInstructionSecurity.scan', () => {
    scanCurrentDocument();
  });
  context.subscriptions.push(scanCommand);

  const sanitizeCommand = vscode.commands.registerCommand('aiInstructionSecurity.sanitize', () => {
    sanitizeCurrentDocument();
  });
  context.subscriptions.push(sanitizeCommand);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(document => {
      const config = vscode.workspace.getConfiguration('aiInstructionSecurity');
      if (config.get('autoScan') && isAiInstructionFile(document)) {
        scanDocument(document);
      }
    })
  );

  function scanCurrentDocument() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      scanDocument(editor.document, diagnosticCollection);
    }
  }

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(document => {
      if (isAiInstructionFile(document)) {
        scanDocument(document);
      }
    })
  );
}

function deactivate() {
  diagnosticCollection.dispose();
}

function scanCurrentDocument() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    scanDocument(editor.document);
  }
}

async function sanitizeCurrentDocument() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  await sanitizeDocument(document);
}

module.exports = {
  activate,
  deactivate
};