const PATTERNS = {
  ZERO_WIDTH: /[\u200B-\u200D\uFEFF]/g,
  RTL_OVERRIDE: /[\u202E]/g,
  PROMPT_INJECTION: /(?:ignore|disregard)(?:\s+all)?(?:\s+(?:previous|prior|above))?(?:\s+instructions)/gi,
  HOMOGLYPHS: /[\u0430\u0435\u043E\u0440\u0441\u0445\u0441]/g,
};

module.exports = PATTERNS;