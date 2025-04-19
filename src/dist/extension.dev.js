"use strict";

var vscode = require('vscode');

var _require = require('./services/scanService'),
    scanDocument = _require.scanDocument;

var _require2 = require('./services/sanitizeService'),
    sanitizeDocument = _require2.sanitizeDocument;

var _require3 = require('./utils/fileDetection'),
    isAiInstructionFile = _require3.isAiInstructionFile;

var diagnosticCollection = vscode.languages.createDiagnosticCollection('aiInstructionSecurity');

function activate(context) {
  context.subscriptions.push(diagnosticCollection);
  var scanCommand = vscode.commands.registerCommand('aiInstructionSecurity.scan', function () {
    scanCurrentDocument();
  });
  context.subscriptions.push(scanCommand);
  var sanitizeCommand = vscode.commands.registerCommand('aiInstructionSecurity.sanitize', function () {
    sanitizeCurrentDocument();
  });
  context.subscriptions.push(sanitizeCommand);
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(function (document) {
    var config = vscode.workspace.getConfiguration('aiInstructionSecurity');

    if (config.get('autoScan') && isAiInstructionFile(document)) {
      scanDocument(document);
    }
  }));

  function scanCurrentDocument() {
    var editor = vscode.window.activeTextEditor;

    if (editor) {
      scanDocument(editor.document, diagnosticCollection);
    }
  }

  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(function (document) {
    if (isAiInstructionFile(document)) {
      scanDocument(document);
    }
  }));
}

function deactivate() {
  diagnosticCollection.dispose();
}

function scanCurrentDocument() {
  var editor = vscode.window.activeTextEditor;

  if (editor) {
    scanDocument(editor.document);
  }
}

function sanitizeCurrentDocument() {
  var editor, document;
  return regeneratorRuntime.async(function sanitizeCurrentDocument$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          editor = vscode.window.activeTextEditor;

          if (editor) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return");

        case 3:
          document = editor.document;
          _context.next = 6;
          return regeneratorRuntime.awrap(sanitizeDocument(document));

        case 6:
        case "end":
          return _context.stop();
      }
    }
  });
}

module.exports = {
  activate: activate,
  deactivate: deactivate
};