// Feature requirements by plan level
// Level 0: Free/Explorer
// Level 1: Starter (500 FCFA)
// Level 2: Basic (1 000 FCFA)
// Level 3: Pro (5 000 FCFA)
// Level 4: Expert (10 000 FCFA)
// Level 5: Ultimate (20 000 FCFA)

export const PLAN_LEVELS = {
  'free': 0,
  'starter': 1,
  'basic': 2,
  'pro': 3,
  'expert': 4,
  'ultimate': 5
};

export const FEATURES = {
  // GRATUIT (plan_level >= 0)
  'prompt_standard':      { minLevel: 0, cost: 10,  costType: 'prompt' },
  'prompt_ultra':         { minLevel: 0, cost: 25,  costType: 'prompt' },
  'image_basic':          { minLevel: 0, cost: 1,   costType: 'image'  },
  'history_20':           { minLevel: 0, cost: 0,   costType: null     },
  
  // STARTER — 500 FCFA (plan_level >= 1)
  'regenerate':           { minLevel: 1, cost: 5,   costType: 'prompt' },
  'translate_prompt':     { minLevel: 1, cost: 3,   costType: 'prompt' },
  
  // BASIC — 1 000 FCFA (plan_level >= 2)
  'style_selector':       { minLevel: 2, cost: 5,   costType: 'prompt' },
  'voice_input':          { minLevel: 2, cost: 15,  costType: 'prompt' },
  'image_hd':             { minLevel: 2, cost: 3,   costType: 'image'  },
  'unlimited_history':    { minLevel: 2, cost: 0,   costType: null     },
  
  // PRO — 5 000 FCFA (plan_level >= 3)
  'improve_prompt':       { minLevel: 3, cost: 20,  costType: 'prompt' },
  'batch_3_variations':   { minLevel: 3, cost: 20,  costType: 'prompt' },
  'favorites':            { minLevel: 3, cost: 0,   costType: null     },
  
  // EXPERT — 10 000 FCFA (plan_level >= 4)
  'image_to_prompt':      { minLevel: 4, cost: 30,  costType: 'prompt' },
  'image_professional':   { minLevel: 4, cost: 5,   costType: 'image'  },
  'personal_analytics':   { minLevel: 4, cost: 0,   costType: null     },
  
  // ULTIMATE — 20 000 FCFA (plan_level >= 5)
  'ai_chat':              { minLevel: 5, cost: 5,   costType: 'prompt' },
  'collections':          { minLevel: 5, cost: 0,   costType: null     },
  'export_pdf':           { minLevel: 5, cost: 2,   costType: 'prompt' },
  'share_link':           { minLevel: 5, cost: 1,   costType: 'prompt' },
};

export const FEATURE_REQUIREMENTS = {
  'voice_input': 2,
  'prompt_enhancement': 3,
  'variations': 3,
  'favorites': 3,
  'image_to_prompt': 4,
  'statistics': 4,
  'ai_chat': 5,
  'collections': 5,
  'export': 5,
};
