function isAiInstructionFile(fileName) {
  const lowerCaseFileName = fileName.toLowerCase();
  return lowerCaseFileName.includes('ai') && 
         (lowerCaseFileName.includes('instruction') || 
          lowerCaseFileName.includes('prompt') || 
          lowerCaseFileName.endsWith('.md') || 
          lowerCaseFileName.includes('.github'));
}

module.exports = {
  isAiInstructionFile
};