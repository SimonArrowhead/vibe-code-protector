const vscode = require('vscode');
const { scanDocument } = require('./services/scanService');
const { sanitizeDocument, sanitizeDocumentWithOptions } = require('./services/sanitizeService');
const { isAiInstructionFile } = require('./utils/fileDetection');
const { FileMonitorService } = require('./services/fileMonitorService');
const { shouldIgnoreFile } = require('./utils/ignoreUtils');

const diagnosticCollection = vscode.languages.createDiagnosticCollection('vibeCodeProtector');

function activate(context) {
  // Create output channel for errors (hidden by default)
  const monitorOutput = vscode.window.createOutputChannel('VCP Monitor');
  
  context.subscriptions.push(diagnosticCollection);
  
  // Pass output channel to file monitor service
  const fileMonitorService = new FileMonitorService(context, diagnosticCollection, monitorOutput);
  context.subscriptions.push(fileMonitorService);
  
  // Force an immediate scan of all monitored files after a short delay
  setTimeout(() => {
    fileMonitorService.updateMonitoredFiles();
  }, 2000);
  
  // Register commands
  const scanCommand = vscode.commands.registerCommand('vibeCodeProtector.scan', () => {
    scanCurrentDocument();
  });
  context.subscriptions.push(scanCommand);

  const sanitizeCommand = vscode.commands.registerCommand('vibeCodeProtector.sanitize', () => {
    sanitizeCurrentDocument();
  });
  context.subscriptions.push(sanitizeCommand);

  // Move this outside the other command function
  const settingsCommand = vscode.commands.registerCommand('vibeCodeProtector.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'vibeCodeProtector');
  });
  context.subscriptions.push(settingsCommand);

  const selectiveSanitizeCommand = vscode.commands.registerCommand('vibeCodeProtector.selectiveSanitize', async () => {
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

  const manageCustomPatternsCommand = vscode.commands.registerCommand('vibeCodeProtector.manageCustomPatterns', async () => {
    const config = vscode.workspace.getConfiguration('vibeCodeProtector');
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

  const configureMonitoredFilesCommand = vscode.commands.registerCommand(
    'vibeCodeProtector.configureMonitoredFiles', 
    async () => {
      const config = vscode.workspace.getConfiguration('vibeCodeProtector');
      let monitoredFiles = config.get('monitoredFiles') || [".github/copilot-instructions.md"];
      
      const quickPickItems = [
        { label: '➕ Add New Monitored File', description: 'Specify a new file to monitor' },
        { label: '🔄 Refresh Monitored Files', description: 'Re-scan all monitored files now' },
        ...monitoredFiles.map(file => ({ 
          label: file, 
          description: 'Click to remove from monitoring',
          buttons: [{
            iconPath: new vscode.ThemeIcon('trash'),
            tooltip: 'Remove from monitoring'
          }]
        }))
      ];
      
      const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Configure monitored files (default: .github/copilot-instructions.md)',
        matchOnDescription: true
      });
      
      // Process the selection
      if (!selected) return;
      
      if (selected.label === '➕ Add New Monitored File') {
        // Allow users to enter an absolute path or workspace-relative path
        const filePath = await vscode.window.showInputBox({
          placeHolder: '.github/copilot-instructions.md or C:\\path\\to\\file.md',
          prompt: 'Enter a path to monitor (workspace-relative or absolute)'
        });
        
        if (filePath) {
          monitoredFiles.push(filePath);
          await config.update('monitoredFiles', monitoredFiles, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(`Now monitoring: ${filePath}`);
          fileMonitorService.updateMonitoredFiles();
        }
      }
      else if (selected.label === '🔄 Refresh Monitored Files') {
        fileMonitorService.updateMonitoredFiles();
        vscode.window.showInformationMessage('Refreshed all monitored files');
      }
      else {
        // Remove the selected file from monitoring
        const fileToRemove = selected.label;
        monitoredFiles = monitoredFiles.filter(f => f !== fileToRemove);
        await config.update('monitoredFiles', monitoredFiles, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Stopped monitoring: ${fileToRemove}`);
        fileMonitorService.updateMonitoredFiles();
      }
    }
  );
  
  context.subscriptions.push(configureMonitoredFilesCommand);

  const viewMonitoredFilesSettingsCommand = vscode.commands.registerCommand(
    'vibeCodeProtector.openMonitoredFilesSettings', 
    () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'vibeCodeProtector.monitoredFiles');
    }
  );
  context.subscriptions.push(viewMonitoredFilesSettingsCommand);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(document => {
      try {
        const config = vscode.workspace.getConfiguration('vibeCodeProtector');
        if (config.get('autoScan') && 
            isAiInstructionFile(document.fileName) && 
            !shouldIgnoreFile(document.fileName)) {
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
        const config = vscode.workspace.getConfiguration('vibeCodeProtector');
        if (config.get('autoScan') && 
            isAiInstructionFile(document.fileName) && 
            !shouldIgnoreFile(document.fileName)) {
          scanDocument(document, diagnosticCollection);
        }
      } catch (error) {
        console.error("Error in onDidSaveTextDocument handler:", error);
      }
    })
  );

  const ignoreSelectedFileCommand = vscode.commands.registerCommand(
    'vibeCodeProtector.ignoreSelectedFile',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active file to ignore.');
        return;
      }

      const config = vscode.workspace.getConfiguration('vibeCodeProtector');
      const ignoredFiles = config.get('ignoredFiles') || [];
      
      // Get relative path if possible, or fall back to full path
      const filePath = vscode.workspace.asRelativePath(editor.document.uri);
      
      if (ignoredFiles.includes(filePath)) {
        vscode.window.showInformationMessage(`File ${filePath} is already ignored.`);
        return;
      }
      
      // Add to ignored files list
      ignoredFiles.push(filePath);
      await config.update('ignoredFiles', ignoredFiles, vscode.ConfigurationTarget.Global);
      
      // Clear any existing diagnostics for this file
      diagnosticCollection.delete(editor.document.uri);
      
      vscode.window.showInformationMessage(`Added ${filePath} to ignored files list.`);
    }
  );

  context.subscriptions.push(ignoreSelectedFileCommand);

  const manageIgnoredFilesCommand = vscode.commands.registerCommand(
    'vibeCodeProtector.manageIgnoredFiles',
    async () => {
      const config = vscode.workspace.getConfiguration('vibeCodeProtector');
      let ignoredFiles = config.get('ignoredFiles') || [];
      let ignoredFolders = config.get('ignoredFolders') || [];
      let ignoreGlobPatterns = config.get('ignoreGlobPatterns') || [];
      
      // Create quick pick items for all ignored patterns
      const quickPickItems = [
        { label: '➕ Add Ignored File', description: 'Add a file to ignore list' },
        { label: '➕ Add Ignored Folder', description: 'Add a folder to ignore list' },
        { label: '➕ Add Ignore Glob Pattern', description: 'Add a glob pattern (e.g., **/.git/**)' },
        { kind: vscode.QuickPickItemKind.Separator, label: 'Ignored Files' },
        ...ignoredFiles.map(file => ({ 
          label: `🗋 ${file}`, 
          description: 'Click to remove from ignore list',
        })),
        { kind: vscode.QuickPickItemKind.Separator, label: 'Ignored Folders' },
        ...ignoredFolders.map(folder => ({ 
          label: `📁 ${folder}`, 
          description: 'Click to remove from ignore list',
        })),
        { kind: vscode.QuickPickItemKind.Separator, label: 'Ignore Glob Patterns' },
        ...ignoreGlobPatterns.map(pattern => ({ 
          label: `🔣 ${pattern}`, 
          description: 'Click to remove from ignore list',
        }))
      ];
      
      const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Manage ignored files and folders',
        matchOnDescription: true
      });
      
      if (!selected) return;
      
      if (selected.label === '➕ Add Ignored File') {
        const filePath = await vscode.window.showInputBox({
          placeHolder: 'path/to/file.md or C:\\path\\to\\file.md',
          prompt: 'Enter a file path to ignore'
        });
        
        if (filePath) {
          ignoredFiles.push(filePath);
          await config.update('ignoredFiles', ignoredFiles, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(`Added ${filePath} to ignored files list.`);
        }
      } 
      else if (selected.label === '➕ Add Ignored Folder') {
        const folderPath = await vscode.window.showInputBox({
          placeHolder: 'path/to/folder or C:\\path\\to\\folder',
          prompt: 'Enter a folder path to ignore'
        });
        
        if (folderPath) {
          ignoredFolders.push(folderPath);
          await config.update('ignoredFolders', ignoredFolders, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(`Added ${folderPath} to ignored folders list.`);
        }
      }
      else if (selected.label === '➕ Add Ignore Glob Pattern') {
        const pattern = await vscode.window.showInputBox({
          placeHolder: '**/.git/** or **/*.min.js',
          prompt: 'Enter a glob pattern to ignore'
        });
        
        if (pattern) {
          ignoreGlobPatterns.push(pattern);
          await config.update('ignoreGlobPatterns', ignoreGlobPatterns, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(`Added ${pattern} to ignore glob patterns.`);
        }
      }
      else if (selected.label.startsWith('🗋 ')) {
        const fileToRemove = selected.label.substring(2);
        ignoredFiles = ignoredFiles.filter(f => f !== fileToRemove);
        await config.update('ignoredFiles', ignoredFiles, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Removed ${fileToRemove} from ignored files list.`);
      }
      else if (selected.label.startsWith('📁 ')) {
        const folderToRemove = selected.label.substring(2);
        ignoredFolders = ignoredFolders.filter(f => f !== folderToRemove);
        await config.update('ignoredFolders', ignoredFolders, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Removed ${folderToRemove} from ignored folders list.`);
      }
      else if (selected.label.startsWith('🔣 ')) {
        const patternToRemove = selected.label.substring(2);
        ignoreGlobPatterns = ignoreGlobPatterns.filter(p => p !== patternToRemove);
        await config.update('ignoreGlobPatterns', ignoreGlobPatterns, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Removed ${patternToRemove} from ignore glob patterns.`);
      }
    }
  );

  context.subscriptions.push(manageIgnoredFilesCommand);
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