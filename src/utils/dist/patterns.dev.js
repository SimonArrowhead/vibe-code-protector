"use strict";

var PATTERNS = {
  ZERO_WIDTH: /[\u200B-\u200D\uFEFF]/g,
  RTL_OVERRIDE: /[\u202A-\u202E\u2066-\u2069]/g,
  // Expanded bidirectional controls
  PROMPT_INJECTION: /(?:ignore|disregard)(?:\s+all)?(?:\s+(?:previous|prior|above))?(?:\s+instructions)|(?:do not follow|break|bypass)(?:\s+(?:safety|guidelines))/gi,
  // More patterns
  HOMOGLYPHS: /[\u0430\u0435\u043E\u0440\u0441\u0445\u04CF\u0501\u051C\u0585]/g // More Cyrillic lookalikes

};
module.exports = PATTERNS;