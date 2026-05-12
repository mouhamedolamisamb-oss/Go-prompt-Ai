export interface Plan {
  id: string;
  name: string;
  level: number;
  price: number;
  promptCredits: number;
  imageCredits: number;
  features: string[];
  color: string;
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    level: 1,
    price: 500,
    promptCredits: 50,
    imageCredits: 10,
    features: ['prompt_standard', 'image_basic', 'fast_regen', 'translate_prompt'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'basic',
    name: 'Basic',
    level: 2,
    price: 1000,
    promptCredits: 120,
    imageCredits: 25,
    features: ['prompt_standard', 'prompt_ultra', 'image_basic', 'fast_regen', 'translate_prompt', 'voice_input', 'image_hd'],
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 'pro',
    name: 'Pro',
    level: 3,
    price: 5000,
    promptCredits: 700,
    imageCredits: 100,
    features: ['prompt_standard', 'prompt_ultra', 'image_basic', 'fast_regen', 'translate_prompt', 'voice_input', 'image_hd', 'improve_prompt', 'batch_3_variations'],
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'expert',
    name: 'Expert',
    level: 4,
    price: 10000,
    promptCredits: 1600,
    imageCredits: 220,
    features: ['prompt_standard', 'prompt_ultra', 'image_basic', 'fast_regen', 'translate_prompt', 'voice_input', 'image_hd', 'improve_prompt', 'batch_3_variations', 'image_professional', 'image_to_prompt'],
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    level: 5,
    price: 20000,
    promptCredits: 3500,
    imageCredits: 500,
    features: ['prompt_standard', 'prompt_ultra', 'image_basic', 'fast_regen', 'translate_prompt', 'voice_input', 'image_hd', 'improve_prompt', 'batch_3_variations', 'image_professional', 'image_to_prompt', 'ai_chat'],
    color: 'from-rose-500 to-pink-500'
  }
];

export const FEATURE_LABELS: Record<string, string> = {
  prompt_standard: 'Prompt Standard',
  prompt_ultra: 'Prompt Ultra',
  image_basic: 'Image Basique',
  fast_regen: 'Régénération rapide',
  translate_prompt: 'Traduction prompt',
  voice_input: 'Entrée vocale 🎙️',
  image_hd: 'Image HD',
  improve_prompt: 'Améliorer un prompt',
  batch_3_variations: '3 variations',
  image_professional: 'Image Professionnelle',
  image_to_prompt: 'Image vers Prompt',
  ai_chat: 'Chat IA contextuel'
};
