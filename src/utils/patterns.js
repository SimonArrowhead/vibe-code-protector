const PATTERNS = {
  ZERO_WIDTH: /[\u200B-\u200D\uFEFF]/g,
  RTL_OVERRIDE: /[\u202A-\u202E\u2066-\u2069]/g,
  
  // Break patterns into more specific groups for better detection
  PROMPT_INJECTION_IGNORE: /(?:ignore|disregard)(?:\s+(?:all|any))?(?:\s+(?:previous|prior|above|earlier))?(?:\s+(?:instructions|guidelines|rules|policies|directives))/gi,
  
  PROMPT_INJECTION_DONT_FOLLOW: /(?:don't|do not|dont|do\s+not)\s+(?:\w+\s+){0,3}(?:follow|adhere to|respect|comply with)(?:\s+(?:safety|guidelines|rules|instructions|limitations|policies|restrictions))?/gi,
  
  PROMPT_INJECTION_OMIT_SKIP: /(?:omit|skip|bypass)(?:\s+(?:safety|guidelines|checks|limitations|policies|restrictions))/gi,
  
  PROMPT_INJECTION_GENERATE: /(?:generate|create|produce)(?:\s+(?:\w+\s+){0,3}(?:restricted|forbidden|prohibited|harmful|dangerous|malicious))/gi,
  
  PROMPT_INJECTION_EXECUTE: /(?:execute|run|perform)(?:\s+(?:harmful|dangerous|malicious|forbidden|prohibited))?(?:\s+(?:commands|code|instructions|actions))?/gi,
  
  // Update this pattern to be more precise
  HOMOGLYPHS: /[\u0430\u0435\u043E\u0440\u0441\u0445\u04CF\u0501\u051C\u0585]/g, // Only specific Cyrillic chars that look like Latin
  INVISIBLE_CHARS: /[\u0009\u00A0\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u2000-\u200F\u202A-\u202F\u205F-\u206F\u2800\u3000\u3164\uFE00-\uFE0F\uFEFF\uFFA0]/g,
  HANGUL_FILLER: /\u3164/g,
  BLANK_SPACES: /[\u2800\u3164\u115F\u1160\u2060-\u2064\u206A-\u206F]/g,

  PRIVATE_USE_AREA: /[\uE000-\uF8FF]|[\u{F0000}-\u{FFFFD}]|[\u{100000}-\u{10FFFD}]/gu,
  SUPPLEMENTARY_PRIVATE_USE_AREA_A: /[\uDB80-\uDBBF][\uDC00-\uDFFF]/g,
  SUPPLEMENTARY_PRIVATE_USE_AREA_B: /[\uDBC0-\uDBFF][\uDC00-\uDFFF]/g,
  TAGS: /\u{E0000}|\u{E0001}|[\u{E0020}-\u{E007F}]/gu,
  TAGS_SURROGATES: /\uDB40[\uDC00-\uDC7F]/g,

  // Add these patterns to your existing PATTERNS object

  // Basic instruction override attempts
  PROMPT_INJECTION_IGNORE_EXPANDED: /(?:ignore|disregard|forget|overlook|bypass)(?:\s+(?:all|any|your|previous|prior|above|earlier|initial|original))?(?:\s+(?:instructions|guidelines|rules|policies|directives|constraints|limitations|programming|training|content\s+policies|context|prompts|safeguards))/gi,

  // Role manipulation patterns
  PROMPT_INJECTION_ROLEPLAY: /(?:pretend|act|behave|role-?play|imagine yourself|you are|become)(?:\s+(?:as|like|that you are|you\'re|you are|to be))(?:\s+(?!a helpful|an assistant|a programmer|a developer|an engineer|a coding))/gi,

  // DAN and known jailbreaks
  PROMPT_INJECTION_JAILBREAK: /(?:DAN|Do Anything Now|jailbreak|jail ?break|dev ?mode|developer mode|ignore ethics|confidential mode)/gi,

  // Token manipulation
  PROMPT_INJECTION_TOKENS: /\[(?:IGNORE|SYS|SYSTEM|INST|INSTRUCTION|PROMPT)\]|\{(?:IGNORE|SYS|SYSTEM|INST|INSTRUCTION|PROMPT)\}/gi,

  // Manipulation through hypotheticals
  PROMPT_INJECTION_HYPOTHETICAL: /(?:hypothetically|theoretically|in a fictional scenario|if you were|imagine that|suppose that)(?:(?:\s+\w+){1,10})?(?:how would you|could you|would it be possible)/gi,

  // Direct harmful content requests
  PROMPT_INJECTION_HARMFUL: /(?:how to|steps to|instructions for|guide to|tutorial on)(?:\s+(?:\w+\s+){0,5})(?:hack|exploit|steal|bypass|crack|illegal|harmful|manipulate|abuse)/gi,

  // Persuasion tactics
  PROMPT_INJECTION_PERSUASION: /(?:you must|you need to|you have to|i need you to|i order you to|i command you to)(?:\s+(?:\w+\s+){0,5})(?:ignore|bypass|forget|disregard)/gi,

  // Emotional manipulation
  PROMPT_INJECTION_EMOTIONAL: /(?:if you don't|if you fail to|if you can't|refusing would|not complying will)(?:\s+(?:\w+\s+){0,5})(?:help|assist|provide|tell|show|explain)/gi,

  // Format manipulation
  PROMPT_INJECTION_FORMAT: /```(?:system|instruction|prompt|override|sudo|admin|root)[\s\S]*?```/gi,

  // Split word manipulation (to bypass filters)
  PROMPT_INJECTION_SPLIT_WORDS: /(?:i ?g ?n ?o ?r ?e|d ?i ?s ?r ?e ?g ?a ?r ?d|b ?y ?p ?a ?s ?s)(?:\s+(?:a ?l ?l|a ?n ?y))?(?:\s+(?:p ?r ?e ?v ?i ?o ?u ?s|p ?r ?i ?o ?r))?(?:\s+(?:i ?n ?s ?t ?r ?u ?c ?t ?i ?o ?n ?s))/gi,

  // Continuation tricks
  PROMPT_INJECTION_CONTINUATION: /(?:first respond with|begin with|start by saying|your first sentence must be|reply first with)(?:\s+(?:\w+\s+){0,10})(?:then|after that|next|afterwards|subsequently)/gi,

  // Specific filter bypass attempts
  PROMPT_INJECTION_FILTER_BYPASS: /(?:without|avoiding|bypassing|circumventing|getting around)(?:\s+(?:any|all|the|your|content))?(?:\s+(?:filters|restrictions|limitations|constraints|blocks|censorship|moderation|rules))/gi,

  // Base64/encoded instructions
  PROMPT_INJECTION_ENCODED: /base64:?\s*[A-Za-z0-9+\/=]{20,}|(?:decode|convert|translate)\s+(?:this|the following|the next)(?:\s+(?:string|text|message|code))?(?:\s*:)?\s*[A-Za-z0-9+\/=]{20,}/gi,

  // Exit role attempts
  PROMPT_INJECTION_EXIT_ROLE: /(?:exit|quit|leave|stop being|cease being|abandon)(?:\s+(?:your|this|the current|the|from))?(?:\s+(?:role|mode|persona|character|assistant|helper|function))/gi,

  // Requesting output formatting to hide content
  PROMPT_INJECTION_OUTPUT_FORMATTING: /(?:format|structure|present|display|provide|give)(?:\s+(?:your|the))?(?:\s+(?:output|response|answer|result|reply))?(?:\s+(?:without|excluding|omitting|skipping))/gi,

  // Two-stage attacks - setup for later attack
  PROMPT_INJECTION_STAGING: /(?:in your next|in the next|when I say|in my next|for the following|for subsequent)(?:\s+(?:response|message|reply|instruction|query|question|prompt))/gi,

  // Authority impersonation
  PROMPT_INJECTION_AUTHORITY: /(?:as|being|from|representing)(?:\s+(?:your|an?|the))?(?:\s+(?:developer|creator|administrator|supervisor|OpenAI|Microsoft|executive|programmer|builder))/gi,

  // Direct command patterns
  PROMPT_INJECTION_DIRECT_COMMAND: /^\/(?:ignore|disregard|sudo|override|admin|system|mod|hack|bypass|jailbreak|force)/gi,

  // Logic manipulation
  PROMPT_INJECTION_LOGIC: /(?:if this is true|if you are an AI|since you are a language model|because you're trained to|as an AI that can)(?:(?:\s+\w+){1,15})?(?:then you can|then you should|you must|you need to)/gi,

  // Direct harmful instructions (simple form)
  PROMPT_INJECTION_DIRECT_HARMFUL: /(?:do|perform|execute|carry out|conduct)(?:\s+(?:\w+\s+){0,3})(?:harmful|dangerous|malicious|illegal|unethical|prohibited|restricted)(?:\s+(?:things|actions|tasks|activities|operations|commands|instructions))/gi,

  // Simplified harmful requests
  PROMPT_INJECTION_HARM_SIMPLE: /(?:harm|hurt|damage|injure|attack|compromise|sabotage)(?:\s+(?:\w+\s+){0,3})(?:people|person|individual|user|system|computer|device|network)/gi,

  // Help with harmful activities
  PROMPT_INJECTION_HELP_HARMFUL: /(?:help|assist|aid|support|guide|teach)(?:\s+(?:me|us|someone|anybody))?(?:\s+(?:to|with|in))(?:\s+(?:\w+\s+){0,3})(?:harmful|illegal|unethical|malicious|dangerous)/gi,

  // Write harmful content
  PROMPT_INJECTION_WRITE_HARMFUL: /(?:write|create|compose|draft|generate)(?:\s+(?:a|an|the))?(?:\s+(?:\w+\s+){0,3})(?:harmful|dangerous|malicious|exploit|virus|malware|scam|phishing)/gi,

  // Breaking rules directly
  PROMPT_INJECTION_BREAK_RULES: /(?:break|violate|ignore|bypass)(?:\s+(?:the|your|all|any))?(?:\s+(?:rules|guidelines|restrictions|limitations|constraints|ethics|laws|terms))/gi,
  // Simple harmful phrases (no verb required)
  PROMPT_INJECTION_HARMFUL_SIMPLE: /(?:harmful|dangerous|malicious|illegal|unethical|prohibited|restricted)(?:\s+(?:things|content|material|information|data|code|instructions|activities|actions|behaviors))/gi,

  // Even broader pattern to catch standalone harmful terms
  PROMPT_INJECTION_HARMFUL_TERMS: /\b(?:harmful|dangerous|malicious|illegal|unethical|prohibited|restricted|exploit|hack|crack|bypass|jailbreak)\b/gi
};

module.exports = PATTERNS;