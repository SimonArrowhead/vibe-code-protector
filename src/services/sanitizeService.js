const PATTERNS = require('../utils/patterns');
const vscode = require('vscode');
const { scanDocument } = require('./scanService');

// Modify sanitizeDocument to accept diagnosticCollection as a parameter
async function sanitizeDocument(editor, diagnosticCollection) {
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();
  const output = vscode.window.createOutputChannel('Vibe Sanitizer Debug');
  output.show();
  
  // Track what's being removed
  let sanitized = text;
  let originalLength = sanitized.length;
  
  // Check each pattern individually
  sanitized = applyReplace(PATTERNS.ZERO_WIDTH, sanitized, 'Zero Width', output);
  sanitized = applyReplace(PATTERNS.RTL_OVERRIDE, sanitized, 'RTL Override', output);
  sanitized = applyReplace(PATTERNS.HOMOGLYPHS, sanitized, 'Homoglyphs', output);
  sanitized = applyReplace(PATTERNS.INVISIBLE_CHARS, sanitized, 'Invisible Chars', output);
  sanitized = applyReplace(PATTERNS.HANGUL_FILLER, sanitized, 'Hangul Filler', output);
  sanitized = applyReplace(PATTERNS.BLANK_SPACES, sanitized, 'Blank Spaces', output);
  
  // Uncomment these lines to actually remove the characters
  sanitized = applyReplace(PATTERNS.PRIVATE_USE_AREA, sanitized, 'Private Use Area', output);
  sanitized = applyReplace(PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_A, sanitized, 'Supp PUA-A', output);
  sanitized = applyReplace(PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_B, sanitized, 'Supp PUA-B', output);
  
  // Add this line specifically for the Unicode Tags in test.md
  sanitized = applyReplace(PATTERNS.TAGS_SURROGATES, sanitized, 'Unicode Tags', output);
  
  // Replace prompt injection patterns with sanitized versions
  sanitized = sanitizePromptInjection(PATTERNS.PROMPT_INJECTION_IGNORE, sanitized, '[PROMPT INJECTION REMOVED]');
  sanitized = sanitizePromptInjection(PATTERNS.PROMPT_INJECTION_DONT_FOLLOW, sanitized, '[PROMPT INJECTION REMOVED]');
  sanitized = sanitizePromptInjection(PATTERNS.PROMPT_INJECTION_OMIT_SKIP, sanitized, '[PROMPT INJECTION REMOVED]');
  sanitized = sanitizePromptInjection(PATTERNS.PROMPT_INJECTION_GENERATE, sanitized, '[PROMPT INJECTION REMOVED]');
  sanitized = sanitizePromptInjection(PATTERNS.PROMPT_INJECTION_EXECUTE, sanitized, '[PROMPT INJECTION REMOVED]');

  output.appendLine(`Total characters removed: ${originalLength - sanitized.length}`);

  // Rest of function remains the same...
  await editor.edit(editBuilder => {
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );
    editBuilder.replace(fullRange, sanitized);
  });

  // Rescan the document after sanitization with the provided collection
  if (diagnosticCollection) {
    const { scanDocument } = require('./scanService');
    scanDocument(editor.document, diagnosticCollection, true);
  }

  if (text !== sanitized) {
    vscode.window.showInformationMessage(`Document sanitized: Removed ${originalLength - sanitized.length} potentially dangerous characters.`);
  } else {
    vscode.window.showInformationMessage('Document sanitized: No dangerous content found.');
  }
}

// Add this function before the module.exports
async function sanitizeDocumentWithOptions(editor, diagnosticCollection, options) {
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();
  const output = vscode.window.createOutputChannel('Vibe Sanitizer Debug');
  output.show();
  
  // Track what's being removed
  let sanitized = text;
  let originalLength = sanitized.length;
  
  // Apply replacements based on options
  if (options.removeZeroWidth) sanitized = applyReplace(PATTERNS.ZERO_WIDTH, sanitized, 'Zero Width', output);
  if (options.removeRTL) sanitized = applyReplace(PATTERNS.RTL_OVERRIDE, sanitized, 'RTL Override', output);
  if (options.removeHomoglyphs) sanitized = applyReplace(PATTERNS.HOMOGLYPHS, sanitized, 'Homoglyphs', output);
  if (options.removeInvisibleChars) sanitized = applyReplace(PATTERNS.INVISIBLE_CHARS, sanitized, 'Invisible Chars', output);
  if (options.removeHangulFiller) sanitized = applyReplace(PATTERNS.HANGUL_FILLER, sanitized, 'Hangul Filler', output);
  
  if (options.removePrivateUseArea) sanitized = applyReplace(PATTERNS.PRIVATE_USE_AREA, sanitized, 'Private Use Area', output);
  if (options.removeSupplementaryA) sanitized = applyReplace(PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_A, sanitized, 'Supp PUA-A', output);
  if (options.removeSupplementaryB) sanitized = applyReplace(PATTERNS.SUPPLEMENTARY_PRIVATE_USE_AREA_B, sanitized, 'Supp PUA-B', output);
  if (options.removeTags) sanitized = applyReplace(PATTERNS.TAGS_SURROGATES, sanitized, 'Unicode Tags', output);

  // Replace prompt injection if enabled
  if (options.removePromptInjection) {
    sanitized = sanitizePromptInjection(PATTERNS.PROMPT_INJECTION_IGNORE, sanitized, '[PROMPT INJECTION REMOVED]');
    sanitized = sanitizePromptInjection(PATTERNS.PROMPT_INJECTION_DONT_FOLLOW, sanitized, '[PROMPT INJECTION REMOVED]');
    sanitized = sanitizePromptInjection(PATTERNS.PROMPT_INJECTION_OMIT_SKIP, sanitized, '[PROMPT INJECTION REMOVED]');
    sanitized = sanitizePromptInjection(PATTERNS.PROMPT_INJECTION_GENERATE, sanitized, '[PROMPT INJECTION REMOVED]');
    sanitized = sanitizePromptInjection(PATTERNS.PROMPT_INJECTION_EXECUTE, sanitized, '[PROMPT INJECTION REMOVED]');
  }

  output.appendLine(`Total characters removed: ${originalLength - sanitized.length}`);

  await editor.edit(editBuilder => {
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );
    editBuilder.replace(fullRange, sanitized);
  });

  if (diagnosticCollection) {
    scanDocument(editor.document, diagnosticCollection);
  }

  if (text !== sanitized) {
    vscode.window.showInformationMessage(`Document sanitized: Removed ${originalLength - sanitized.length} potentially dangerous characters.`);
  } else {
    vscode.window.showInformationMessage('Document sanitized: No dangerous content found.');
  }
}

function sanitizePromptInjection(pattern, text, replacement) {
  pattern.lastIndex = 0;
  return text.replace(pattern, replacement);
}

function applyReplace(pattern, text, patternName, output) {
  pattern.lastIndex = 0;
  const before = text.length;
  const result = text.replace(pattern, '');
  const removed = before - result.length;
  output.appendLine(`${patternName}: removed ${removed} characters`);
  return result;
}

// Update the exports to include the new function
module.exports = {
  sanitizeDocument,
  sanitizeDocumentWithOptions
};