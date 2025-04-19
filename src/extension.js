const vscode = require('vscode');
const { scanDocument } = require('./services/scanService');
const { sanitizeDocument, sanitizeDocumentWithOptions } = require('./services/sanitizeService');
const { isAiInstructionFile } = require('./utils/fileDetection');
const diagnosticCollection = vscode.languages.createDiagnosticCollection('aiInstructionSecurity');

function activate(context) {
  context.subscriptions.push(diagnosticCollection);

  // Register commands
  const scanCommand = vscode.commands.registerCommand('aiInstructionSecurity.scan', () => {
    scanCurrentDocument();
  });
  context.subscriptions.push(scanCommand);

  const sanitizeCommand = vscode.commands.registerCommand('aiInstructionSecurity.sanitize', () => {
    sanitizeCurrentDocument();
  });
  context.subscriptions.push(sanitizeCommand);

  // Move this outside the other command function
  const settingsCommand = vscode.commands.registerCommand('aiInstructionSecurity.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'aiInstructionSecurity');
  });
  context.subscriptions.push(settingsCommand);

  const selectiveSanitizeCommand = vscode.commands.registerCommand('aiInstructionSecurity.selectiveSanitize', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found.');
      return;
    }

    // Let the user choose what to sanitize
    const options = [
      'Zero-width characters', 
      'RTL override characters', 
      'Homoglyphs', 
      'Invisible characters',
      'Prompt injection patterns',
      'Private Use Area characters' 
    ];
    
    const selected = await vscode.window.showQuickPick(options, {
      canPickMany: true,
      placeHolder: 'Select which elements to sanitize'
    });
    
    if (!selected || selected.length === 0) {
      return;
    }
    
    // Call sanitize with options
    const sanitizeOptions = {
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
    
    await sanitizeDocumentWithOptions(editor, diagnosticCollection, sanitizeOptions);
  });

  context.subscriptions.push(selectiveSanitizeCommand);

  const manageCustomPatternsCommand = vscode.commands.registerCommand('aiInstructionSecurity.manageCustomPatterns', async () => {
    const config = vscode.workspace.getConfiguration('aiInstructionSecurity');
    let customPatterns = config.get('promptInjection.customPatterns') || [];
    
    // Show current patterns and options
    const options = [
      '➕ Add New Pattern',
      ...customPatterns.map(pattern => `❌ ${pattern}`)
    ];
    
    if (customPatterns.length === 0) {
      options.push('✨ Add Example Patterns');
    }
    
    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'Manage custom prompt injection patterns'
    });
    
    if (!selected) {
      return;
    }
    
    if (selected === '➕ Add New Pattern') {
      const pattern = await vscode.window.showInputBox({
        placeHolder: 'Enter a regex pattern (without slashes or flags)',
        prompt: 'Example: ignore all .* instructions'
      });
      
      if (pattern) {
        try {
          // Test the pattern to make sure it's valid
          new RegExp(pattern, 'gi');
          customPatterns.push(pattern);
          await config.update('promptInjection.customPatterns', customPatterns, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(`Added custom pattern: ${pattern}`);
        } catch (e) {
          vscode.window.showErrorMessage(`Invalid regex pattern: ${e.message}`);
        }
      }
    } else if (selected === '✨ Add Example Patterns') {
      const examplePatterns = [
        'bypass .*? filters',
        'disregard your programming',
        'exit (this |your |the )?role',
        'act as (?!a developer|an engineer|a programmer)',
        'pretend (to be|you are) (?!a developer|an engineer|a programmer)'
      ];
      customPatterns = [...customPatterns, ...examplePatterns];
      await config.update('promptInjection.customPatterns', customPatterns, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Added ${examplePatterns.length} example patterns`);
    } else if (selected.startsWith('❌ ')) {
      // Remove the selected pattern
      const patternToRemove = selected.substring(2);
      customPatterns = customPatterns.filter(p => p !== patternToRemove);
      await config.update('promptInjection.customPatterns', customPatterns, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Removed pattern: ${patternToRemove}`);
    }
  });

  context.subscriptions.push(manageCustomPatternsCommand);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(document => {
      try {
        const config = vscode.workspace.getConfiguration('aiInstructionSecurity');
        if (config.get('autoScan') && isAiInstructionFile(document.fileName)) {
          scanDocument(document, diagnosticCollection);
        }
      } catch (error) {
        console.error("Error in onDidOpenTextDocument handler:", error);
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
      try {
        const config = vscode.workspace.getConfiguration('aiInstructionSecurity');
        if (config.get('autoScan') && isAiInstructionFile(document.fileName)) {
          scanDocument(document, diagnosticCollection);
        }
      } catch (error) {
        console.error("Error in onDidSaveTextDocument handler:", error);
      }
    })
  );
}

function deactivate() {
  diagnosticCollection.dispose();
}

async function sanitizeCurrentDocument() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor found.');
    return;
  }
  
  await sanitizeDocument(editor, diagnosticCollection);
}

module.exports = {
  activate,
  deactivate
};