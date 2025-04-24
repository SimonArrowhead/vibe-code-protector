const vscode = require('vscode');
const path = require('path');
const minimatch = require('minimatch');

/**
 * Checks if a file should be ignored based on ignore settings
 * @param {string} filePath - The path to the file
 * @returns {boolean} - Whether the file should be ignored
 */
function shouldIgnoreFile(filePath) {
  const config = vscode.workspace.getConfiguration('vibeCodeProtector');
  const ignoredFiles = config.get('ignoredFiles') || [];
  const ignoredFolders = config.get('ignoredFolders') || [];
  const ignoreGlobPatterns = config.get('ignoreGlobPatterns') || [];
  
  // Normalize path for comparison
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Check if the file is directly in the ignored files list
  if (ignoredFiles.some(file => {
    const normalizedFile = file.replace(/\\/g, '/');
    return normalizedPath.endsWith(normalizedFile);
  })) {
    return true;
  }
  
  // Check if the file is in an ignored folder
  if (ignoredFolders.some(folder => {
    const normalizedFolder = folder.replace(/\\/g, '/');
    return normalizedPath.includes(normalizedFolder);
  })) {
    return true;
  }
  
  // Check if the file matches any glob patterns
  if (ignoreGlobPatterns.some(pattern => minimatch(normalizedPath, pattern))) {
    return true;
  }
  
  return false;
}

module.exports = {
  shouldIgnoreFile
};