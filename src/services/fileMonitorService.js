const vscode = require('vscode');
const path = require('path');
const { scanDocument } = require('./scanService');
const { shouldIgnoreFile } = require('../utils/ignoreUtils');

/**
 * Monitors specific files for changes and security issues
 */
class FileMonitorService {
  constructor(context, diagnosticCollection, outputChannel) {
    this.context = context;
    this.diagnosticCollection = diagnosticCollection;
    this.fileWatchers = new Map();
    this.outputChannel = outputChannel || console;
    this.initialize();
  }

  /**
   * Initialize the file monitor service
   */
  initialize() {
    // Listen for configuration changes
    this.configListener = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('vibeCodeProtector.monitoredFiles')) {
        this.updateMonitoredFiles();
      }
    });

    // Add to context subscriptions
    this.context.subscriptions.push(this.configListener);
  }

  /**
   * Update the list of monitored files based on configuration
   */
  updateMonitoredFiles() {
    // Clear existing watchers
    this.disposeFileWatchers();
    
    // Get configuration with correct properties names
    const config = vscode.workspace.getConfiguration('vibeCodeProtector');
    
    // Use a separate setting name instead of trying to nest under monitoredFiles
    const enabled = config.get('monitoredFilesEnabled');
    
    if (enabled === false) {
      return;
    }
    
    // Get monitored files list
    const monitoredFiles = config.get('monitoredFiles') || ['.github/copilot-instructions.md'];
    
    // Create watchers for each workspace
    if (vscode.workspace.workspaceFolders) {
      vscode.workspace.workspaceFolders.forEach(folder => {
        monitoredFiles.forEach(relativeFilePath => {
          if (!path.isAbsolute(relativeFilePath)) {
            this.monitorFile(folder.uri, relativeFilePath);
          }
        });
      });
    } else {
      this.outputChannel.appendLine('No workspace folders found');
    }
    
    // Also check for absolute paths
    monitoredFiles.forEach(filePath => {
      if (path.isAbsolute(filePath)) {
        this.monitorAbsoluteFilePath(filePath);
      }
    });
  }

  /**
   * Monitor a specific file
   */
  monitorFile(workspaceUri, relativeFilePath) {
    const fileUri = vscode.Uri.joinPath(workspaceUri, relativeFilePath);
    const fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceUri, relativeFilePath)
    );

    // Register event handlers
    fileWatcher.onDidChange(uri => this.onFileChanged(uri, 'changed'));
    fileWatcher.onDidCreate(uri => this.onFileChanged(uri, 'created'));
    fileWatcher.onDidDelete(uri => this.onFileDeleted(uri));
    
    // Store the watcher
    this.fileWatchers.set(fileUri.toString(), fileWatcher);
    
    // Initial scan if file exists
    vscode.workspace.fs.stat(fileUri).then(
      () => this.scanMonitoredFile(fileUri),
      () => this.outputChannel.appendLine(`Monitored file not found: ${relativeFilePath}`)
    );
  }

  /**
   * Monitor an absolute file path
   */
  monitorAbsoluteFilePath(absolutePath) {
    try {
      // Create full URI from the file path
      const fileUri = vscode.Uri.file(absolutePath);
      
      // Create a more specific watcher
      const fileWatcher = vscode.workspace.createFileSystemWatcher(fileUri.fsPath);
      
      // Register handlers
      fileWatcher.onDidChange(uri => this.onFileChanged(uri, 'changed'));
      fileWatcher.onDidCreate(uri => this.onFileChanged(uri, 'created'));
      fileWatcher.onDidDelete(uri => this.onFileDeleted(uri));
      
      // Store the watcher
      this.fileWatchers.set(fileUri.toString(), fileWatcher);
      
      // Immediate scan
      vscode.workspace.fs.stat(fileUri).then(
        () => this.scanMonitoredFile(fileUri),
        (err) => this.outputChannel.appendLine(`Monitored file not found: ${absolutePath}`)
      );
    } catch (err) {
      this.outputChannel.appendLine(`Error setting up watcher: ${err.message}`);
    }
  }

  /**
   * Handle file change/creation event
   */
  onFileChanged(uri, changeType) {
    const config = vscode.workspace.getConfiguration('vibeCodeProtector');
    const showNotifications = config.get('monitoredFilesNotifications'); // Fixed property name
    
    if (showNotifications) {
      const relativePath = vscode.workspace.asRelativePath(uri);
      vscode.window.showWarningMessage(
        `Monitored security-sensitive file was ${changeType}: ${relativePath}`,
        'Scan Now'
      ).then(selection => {
        if (selection === 'Scan Now') {
          this.scanMonitoredFile(uri, true);
        }
      });
    }
    
    // Automatically scan the file
    this.scanMonitoredFile(uri);
  }

  /**
   * Handle file deletion event
   */
  onFileDeleted(uri) {
    const relativePath = vscode.workspace.asRelativePath(uri);
    const config = vscode.workspace.getConfiguration('vibeCodeProtector');
    const showNotifications = config.get('monitoredFilesNotifications'); // Fixed property name
    
    if (showNotifications) {
      vscode.window.showWarningMessage(
        `Security-sensitive file was deleted: ${relativePath}`
      );
    }
    
    // Clean up diagnostics
    this.diagnosticCollection.delete(uri);
  }

  /**
   * Scan a monitored file for issues
   */
  async scanMonitoredFile(uri, focusEditor = false) {
    try {
      // Skip ignored files
      if (shouldIgnoreFile(uri.fsPath)) {
        this.outputChannel.appendLine(`Skipping ignored file: ${uri.fsPath}`);
        return;
      }
      
      // Open document and scan
      const document = await vscode.workspace.openTextDocument(uri);
      
      // Force a thorough scan regardless of file type
      const scanResult = scanDocument(document, this.diagnosticCollection);
      
      // Show notification if issues are found
      if (scanResult.length > 0) {
        const config = vscode.workspace.getConfiguration('vibeCodeProtector');
        const showNotifications = config.get('monitoredFilesNotifications'); // Fixed property name
        
        if (showNotifications) {
          const relativePath = vscode.workspace.asRelativePath(uri);
          vscode.window.showWarningMessage(
            `Security issues detected in monitored file: ${relativePath}`,
            'View Issues'
          ).then(selection => {
            if (selection === 'View Issues') {
              vscode.window.showTextDocument(document);
            }
          });
        }
      }
      
      // Focus editor if requested
      if (focusEditor) {
        await vscode.window.showTextDocument(document);
      }
    } catch (err) {
      this.outputChannel.appendLine(`ERROR scanning file: ${err.message}`);
    }
  }

  /**
   * Dispose of all file watchers
   */
  disposeFileWatchers() {
    this.fileWatchers.forEach(watcher => {
      watcher.dispose();
    });
    this.fileWatchers.clear();
  }

  /**
   * Dispose of the service
   */
  dispose() {
    this.disposeFileWatchers();
    if (this.configListener) {
      this.configListener.dispose();
    }
  }
}

module.exports = { FileMonitorService };