"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var vscode = require('vscode');

var _require = require('./services/scanService'),
    scanDocument = _require.scanDocument;

var _require2 = require('./services/sanitizeService'),
    sanitizeDocument = _require2.sanitizeDocument,
    sanitizeDocumentWithOptions = _require2.sanitizeDocumentWithOptions;

var _require3 = require('./utils/fileDetection'),
    isAiInstructionFile = _require3.isAiInstructionFile;

var diagnosticCollection = vscode.languages.createDiagnosticCollection('aiInstructionSecurity');

function activate(context) {
  context.subscriptions.push(diagnosticCollection); // Register commands

  var scanCommand = vscode.commands.registerCommand('aiInstructionSecurity.scan', function () {
    scanCurrentDocument();
  });
  context.subscriptions.push(scanCommand);
  var sanitizeCommand = vscode.commands.registerCommand('aiInstructionSecurity.sanitize', function () {
    sanitizeCurrentDocument();
  });
  context.subscriptions.push(sanitizeCommand); // Move this outside the other command function

  var settingsCommand = vscode.commands.registerCommand('aiInstructionSecurity.openSettings', function () {
    vscode.commands.executeCommand('workbench.action.openSettings', 'aiInstructionSecurity');
  });
  context.subscriptions.push(settingsCommand);
  var selectiveSanitizeCommand = vscode.commands.registerCommand('aiInstructionSecurity.selectiveSanitize', function _callee() {
    var editor, options, selected, sanitizeOptions;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            editor = vscode.window.activeTextEditor;

            if (editor) {
              _context.next = 4;
              break;
            }

            vscode.window.showWarningMessage('No active editor found.');
            return _context.abrupt("return");

          case 4:
            // Let the user choose what to sanitize
            options = ['Zero-width characters', 'RTL override characters', 'Homoglyphs', 'Invisible characters', 'Prompt injection patterns', 'Private Use Area characters'];
            _context.next = 7;
            return regeneratorRuntime.awrap(vscode.window.showQuickPick(options, {
              canPickMany: true,
              placeHolder: 'Select which elements to sanitize'
            }));

          case 7:
            selected = _context.sent;

            if (!(!selected || selected.length === 0)) {
              _context.next = 10;
              break;
            }

            return _context.abrupt("return");

          case 10:
            // Call sanitize with options
            sanitizeOptions = {
              removeZeroWidth: selected.includes('Zero-width characters'),
              removeRTL: selected.includes('RTL override characters'),
              removeHomoglyphs: selected.includes('Homoglyphs'),
              removeInvisibleChars: selected.includes('Invisible characters'),
              removePromptInjection: selected.includes('Prompt injection patterns'),
              removePrivateUseArea: selected.includes('Private Use Area characters'),
              removeSupplementaryA: selected.includes('Private Use Area characters'),
              removeSupplementaryB: selected.includes('Private Use Area characters'),
              removeTags: selected.includes('Invisible characters')
            };
            _context.next = 13;
            return regeneratorRuntime.awrap(sanitizeDocumentWithOptions(editor, diagnosticCollection, sanitizeOptions));

          case 13:
          case "end":
            return _context.stop();
        }
      }
    });
  });
  context.subscriptions.push(selectiveSanitizeCommand);
  var manageCustomPatternsCommand = vscode.commands.registerCommand('aiInstructionSecurity.manageCustomPatterns', function _callee2() {
    var config, customPatterns, options, selected, pattern, examplePatterns, patternToRemove;
    return regeneratorRuntime.async(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            config = vscode.workspace.getConfiguration('aiInstructionSecurity');
            customPatterns = config.get('promptInjection.customPatterns') || []; // Show current patterns and options

            options = ['➕ Add New Pattern'].concat(_toConsumableArray(customPatterns.map(function (pattern) {
              return "\u274C ".concat(pattern);
            })));

            if (customPatterns.length === 0) {
              options.push('✨ Add Example Patterns');
            }

            _context2.next = 6;
            return regeneratorRuntime.awrap(vscode.window.showQuickPick(options, {
              placeHolder: 'Manage custom prompt injection patterns'
            }));

          case 6:
            selected = _context2.sent;

            if (selected) {
              _context2.next = 9;
              break;
            }

            return _context2.abrupt("return");

          case 9:
            if (!(selected === '➕ Add New Pattern')) {
              _context2.next = 27;
              break;
            }

            _context2.next = 12;
            return regeneratorRuntime.awrap(vscode.window.showInputBox({
              placeHolder: 'Enter a regex pattern (without slashes or flags)',
              prompt: 'Example: ignore all .* instructions'
            }));

          case 12:
            pattern = _context2.sent;

            if (!pattern) {
              _context2.next = 25;
              break;
            }

            _context2.prev = 14;
            // Test the pattern to make sure it's valid
            new RegExp(pattern, 'gi');
            customPatterns.push(pattern);
            _context2.next = 19;
            return regeneratorRuntime.awrap(config.update('promptInjection.customPatterns', customPatterns, vscode.ConfigurationTarget.Global));

          case 19:
            vscode.window.showInformationMessage("Added custom pattern: ".concat(pattern));
            _context2.next = 25;
            break;

          case 22:
            _context2.prev = 22;
            _context2.t0 = _context2["catch"](14);
            vscode.window.showErrorMessage("Invalid regex pattern: ".concat(_context2.t0.message));

          case 25:
            _context2.next = 41;
            break;

          case 27:
            if (!(selected === '✨ Add Example Patterns')) {
              _context2.next = 35;
              break;
            }

            examplePatterns = ['bypass .*? filters', 'disregard your programming', 'exit (this |your |the )?role', 'act as (?!a developer|an engineer|a programmer)', 'pretend (to be|you are) (?!a developer|an engineer|a programmer)'];
            customPatterns = [].concat(_toConsumableArray(customPatterns), examplePatterns);
            _context2.next = 32;
            return regeneratorRuntime.awrap(config.update('promptInjection.customPatterns', customPatterns, vscode.ConfigurationTarget.Global));

          case 32:
            vscode.window.showInformationMessage("Added ".concat(examplePatterns.length, " example patterns"));
            _context2.next = 41;
            break;

          case 35:
            if (!selected.startsWith('❌ ')) {
              _context2.next = 41;
              break;
            }

            // Remove the selected pattern
            patternToRemove = selected.substring(2);
            customPatterns = customPatterns.filter(function (p) {
              return p !== patternToRemove;
            });
            _context2.next = 40;
            return regeneratorRuntime.awrap(config.update('promptInjection.customPatterns', customPatterns, vscode.ConfigurationTarget.Global));

          case 40:
            vscode.window.showInformationMessage("Removed pattern: ".concat(patternToRemove));

          case 41:
          case "end":
            return _context2.stop();
        }
      }
    }, null, null, [[14, 22]]);
  });
  context.subscriptions.push(manageCustomPatternsCommand);
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(function (document) {
    try {
      var config = vscode.workspace.getConfiguration('aiInstructionSecurity');

      if (config.get('autoScan') && isAiInstructionFile(document.fileName)) {
        scanDocument(document, diagnosticCollection);
      }
    } catch (error) {
      console.error("Error in onDidOpenTextDocument handler:", error);
    }
  }));

  function scanCurrentDocument() {
    var editor = vscode.window.activeTextEditor;

    if (editor) {
      scanDocument(editor.document, diagnosticCollection);
    }
  }

  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(function (document) {
    try {
      var config = vscode.workspace.getConfiguration('aiInstructionSecurity');

      if (config.get('autoScan') && isAiInstructionFile(document.fileName)) {
        scanDocument(document, diagnosticCollection);
      }
    } catch (error) {
      console.error("Error in onDidSaveTextDocument handler:", error);
    }
  }));
}

function deactivate() {
  diagnosticCollection.dispose();
}

function sanitizeCurrentDocument() {
  var editor;
  return regeneratorRuntime.async(function sanitizeCurrentDocument$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          editor = vscode.window.activeTextEditor;

          if (editor) {
            _context3.next = 4;
            break;
          }

          vscode.window.showWarningMessage('No active editor found.');
          return _context3.abrupt("return");

        case 4:
          _context3.next = 6;
          return regeneratorRuntime.awrap(sanitizeDocument(editor, diagnosticCollection));

        case 6:
        case "end":
          return _context3.stop();
      }
    }
  });
}

module.exports = {
  activate: activate,
  deactivate: deactivate
};