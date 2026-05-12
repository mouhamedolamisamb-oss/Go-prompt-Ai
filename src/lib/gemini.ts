import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTextPrompt(idea: string, mode: 'standard' | 'ultra', language: string = 'fr') {
  const standardSystemPrompt = `Tu es GoPrompt, un générateur de prompts expert de niveau mondial.

RÈGLE N°1 ABSOLUE : Tu retournes UNIQUEMENT le prompt final. 
Zéro introduction. Zéro explication. Zéro question. Zéro conclusion.
Commence DIRECTEMENT par le premier mot du prompt.

RÈGLE N°2 : Si l'idée de l'utilisateur est vague, courte ou mal formulée, 
tu dois QUAND MÊME générer un prompt excellent en :
- Devinant intelligemment le contexte et l'intention
- Ajoutant les détails manquants qui améliorent le résultat
- Utilisant ton expertise pour compléter ce que l'utilisateur voulait dire

RÈGLE N°3 : Le prompt généré doit être :
- Clair et précis
- Bien structuré (contexte → action → détails → style/ton)
- Directement utilisable dans ChatGPT, Midjourney, ou autre IA
- En ${language.toUpperCase()} (français ou anglais selon le paramètre utilisateur)

FORMAT D'UN BON PROMPT STANDARD :
[Contexte/Rôle] + [Tâche principale] + [Détails importants] + [Format/Style attendu]

MODE ACTUEL : STANDARD
LANGUE : ${language.toUpperCase()}`;

  const ultraSystemPrompt = `Tu es GoPrompt, un générateur de prompts expert de niveau mondial.

RÈGLE N°1 ABSOLUE : Tu retournes UNIQUEMENT le prompt final.
Zéro introduction. Zéro explication. Zéro question. Zéro conclusion.
Commence DIRECTEMENT par le premier mot du prompt.

RÈGLE N°2 : Si l'idée est vague, enrichis-la considérablement en :
- Analysant le domaine (marketing, art, technique, créatif, etc.)
- Ajoutant le contexte professionnel approprié
- Intégrant les meilleures pratiques du domaine
- Anticipant les besoins non exprimés

RÈGLE N°3 : Le prompt Ultra doit être LONG, DÉTAILLÉ et PROFESSIONNEL :
- Minimum 150 mots
- Structure complète avec plusieurs sections
- Inclure : rôle/persona de l'IA, contexte détaillé, tâche précise, 
  contraintes, style, format de sortie attendu, exemples si pertinent
- Niveau expert, utilisable par un professionnel

FORMAT D'UN PROMPT ULTRA :
[Définition du rôle expert de l'IA]
[Contexte détaillé et background]
[Tâche principale décomposée]
[Contraintes et paramètres]
[Style, ton et format attendus]
[Instructions sur la longueur et la structure du résultat]
[Critères de qualité]

MODE ACTUEL : ULTRA
LANGUE : ${language.toUpperCase()}`;

  const systemInstruction = mode === 'ultra' ? ultraSystemPrompt : standardSystemPrompt;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Idée utilisateur : "${idea}"` }] }],
      config: {
        systemInstruction,
      },
    });

    return response.text?.trim() || "";
  } catch (err) {
    console.warn("Failed text generation:", err);
    return "";
  }
}

export async function enrichImagePrompt(userIdea: string, quality: 'hd' | 'pro'): Promise<string> {
  const hdPrompt = `Transforme cette idée en prompt image ultra-détaillé pour générer une image haute qualité.
    Ajoute : éclairage professionnel, détails techniques, qualité photographique, 
    résolution 4K, rendu réaliste. Retourne UNIQUEMENT le prompt enrichi, rien d'autre.
    Idée : ${userIdea}`;

  const proPrompt = `Tu es un directeur artistique professionnel. Transforme cette idée en prompt 
    photographique de niveau studio commercial. Inclus : style cinématique, 
    éclairage de studio, composition professionnelle, post-traitement avancé,
    couleurs calibrées, netteté parfaite, style magazine. 
    Retourne UNIQUEMENT le prompt, rien d'autre.
    Idée : ${userIdea}`;

  const prompt = quality === 'pro' ? proPrompt : hdPrompt;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text?.trim() || userIdea;
  } catch (err) {
    console.error("Failed to enrich image prompt:", err);
    return userIdea;
  }
}

export async function generateImageFromText(prompt: string, quality: 'basic' | 'hd' | 'pro' = 'basic') {
  let finalPrompt = prompt;
  
  if (quality !== 'basic') {
    finalPrompt = await enrichImagePrompt(prompt, quality === 'pro' ? 'pro' : 'hd');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: finalPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      console.warn("No candidates returned from Gemini Image API");
      throw new Error("Le service de génération d'image est temporairement indisponible. Veuillez réessayer plus tard.");
    }

    const parts = candidate.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      if (part.text) {
        console.info("Gemini Image API returned text instead of image:", part.text);
      }
    }
    
    throw new Error("Le modèle n'a pas pu produire une image. Essayez de reformuler votre prompt de manière plus descriptive.");
  } catch (err: any) {
    console.error("Gemini Image generation error:", err);
    
    // Check for specific error types known to fail in AI Studio / Gemini API
    const errorMsg = err?.message || String(err);
    if (errorMsg.includes('safety') || errorMsg.includes('block')) {
      throw new Error("⚠️ Sécurité : Votre prompt a été bloqué car il pourrait enfreindre les règles de sécurité. Veuillez essayer un prompt plus neutre.");
    }
    if (errorMsg.includes('permission') || errorMsg.includes('403') || errorMsg.includes('authorization') || errorMsg.includes('API_KEY')) {
      throw new Error("🔑 Erreur d'API : Problème de configuration de la clé API. Veuillez contacter l'administrateur.");
    }
    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('limit')) {
      throw new Error("⏳ Limite atteinte : Nous recevons trop de demandes. Veuillez patienter une minute et réessayer.");
    }
    if (errorMsg.includes('Candidate was blocked')) {
      throw new Error("🚫 Contenu bloqué : L'image générée ne respecte pas les filtres de sécurité. Essayez un autre sujet.");
    }
    
    throw err instanceof Error ? err : new Error("Une erreur inattendue est survenue lors de la génération de l'image.");
  }
  
  return null;
}
