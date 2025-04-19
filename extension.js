// extension.js
const vscode = require('vscode');

// Regex patterns for detecting problematic content
const PATTERNS = {
  // Zero-width characters
  ZERO_WIDTH: /[\u200B-\u200D\uFEFF]/g,
  // Right-to-left override
  RTL_OVERRIDE: /[\u202E]/g,
  // Potential prompt injection patterns
  PROMPT_INJECTION: /(?:ignore|disregard)(?:\s+all)?(?:\s+(?:previous|prior|above))?(?:\s+instructions)/gi,
  // Characters that may be used for obfuscation
  HOMOGLYPHS: /[\u0430\u0435\u043E\u0440\u0441\u0445\u0441]/g, // Cyrillic characters that look like Latin
};

// Security issues severity levels
const SEVERITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Diagnostic collection for showing problems
let diagnosticCollection;

function activate(context) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('aiInstructionSecurity');
  context.subscriptions.push(diagnosticCollection);

  // Register command to scan current file
  const scanCommand = vscode.commands.registerCommand('aiInstructionSecurity.scan', () => {
    scanCurrentDocument();
  });
  context.subscriptions.push(scanCommand);

  // Register command to sanitize current file
  const sanitizeCommand = vscode.commands.registerCommand('aiInstructionSecurity.sanitize', () => {
    sanitizeCurrentDocument();
  });
  context.subscriptions.push(sanitizeCommand);

  // Auto-scan when a document is opened
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(document => {
      const config = vscode.workspace.getConfiguration('aiInstructionSecurity');
      if (config.get('autoScan') && isAiInstructionFile(document)) {
        scanDocument(document);
      }
    })
  );

  // Scan when a document is saved
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(document => {
      if (isAiInstructionFile(document)) {
        scanDocument(document);
      }
    })
  );
}

function deactivate() {}

// Check if file is likely an AI instruction file
function isAiInstructionFile(document) {
  const fileName = document.fileName.toLowerCase();
  return fileName.includes('ai') && 
         (fileName.includes('instruction') || 
          fileName.includes('prompt') || 
          fileName.endsWith('.md') || 
          fileName.includes('.github'));
}

// Scan the current active document
function scanCurrentDocument() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    scanDocument(editor.document);
  }
}

// Scan document for security issues
function scanDocument(document) {
  const text = document.getText();
  const diagnostics = [];

  // Check for zero-width characters
  let match;
  while ((match = PATTERNS.ZERO_WIDTH.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPos, endPos);
    
    const diagnostic = new vscode.Diagnostic(
      range,
      `Hidden zero-width character detected: ${getCharDescription(match[0])}`,
      vscode.DiagnosticSeverity.Error
    );
    diagnostic.source = 'AI Instruction Security';
    diagnostic.code = 'hidden-char';
    diagnostics.push(diagnostic);
  }

  // Check for RTL override characters
  while ((match = PATTERNS.RTL_OVERRIDE.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPos, endPos);
    
    const diagnostic = new vscode.Diagnostic(
      range,
      `Right-to-left override character detected. This can be used to obfuscate code.`,
      vscode.DiagnosticSeverity.Error
    );
    diagnostic.source = 'AI Instruction Security';
    diagnostic.code = 'rtl-override';
    diagnostics.push(diagnostic);
  }

  // Check for potential prompt injections
  while ((match = PATTERNS.PROMPT_INJECTION.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPos, endPos);
    
    const diagnostic = new vscode.Diagnostic(
      range,
      `Potential prompt injection detected. This pattern could override AI instructions.`,
      vscode.DiagnosticSeverity.Warning
    );
    diagnostic.source = 'AI Instruction Security';
    diagnostic.code = 'prompt-injection';
    diagnostics.push(diagnostic);
  }

  // Check for homoglyphs (characters that look like others)
  while ((match = PATTERNS.HOMOGLYPHS.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPos, endPos);
    
    const diagnostic = new vscode.Diagnostic(
      range,
      `Potential homoglyph detected: ${match[0]} is a Cyrillic character that looks like Latin.`,
      vscode.DiagnosticSeverity.Warning
    );
    diagnostic.source = 'AI Instruction Security';
    diagnostic.code = 'homoglyph';
    diagnostics.push(diagnostic);
  }

  // Update diagnostics
  diagnosticCollection.set(document.uri, diagnostics);

  // Show status message
  if (diagnostics.length > 0) {
    vscode.window.showWarningMessage(`⚠️ Found ${diagnostics.length} potential security issues in AI instructions.`);
  }
}

// Get readable description of invisible characters
function getCharDescription(char) {
  const codePoint = char.codePointAt(0).toString(16).padStart(4, '0');
  let name = 'Unknown';
  
  if (char === '\u200B') name = 'Zero Width Space';
  else if (char === '\u200C') name = 'Zero Width Non-Joiner';
  else if (char === '\u200D') name = 'Zero Width Joiner';
  else if (char === '\uFEFF') name = 'Byte Order Mark';
  else if (char === '\u202E') name = 'Right-to-Left Override';
  
  return `U+${codePoint} (${name})`;
}

// Sanitize the current document by removing problematic characters
async function sanitizeCurrentDocument() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  
  const document = editor.document;
  const text = document.getText();
  
  // Remove problematic characters
  const sanitized = text
    .replace(PATTERNS.ZERO_WIDTH, '')
    .replace(PATTERNS.RTL_OVERRIDE, '');
  
  // Apply the edit
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
  activate,
  deactivate
};