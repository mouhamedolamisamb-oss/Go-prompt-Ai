import { PLANS } from '../constants/plans';

/**
 * Checks if a user has access to a specific feature based on their max plan level.
 * Features accumulate, so a level 3 user has all features for levels 1, 2, and 3.
 */
export const isFeatureUnlocked = (
  featureId: string,
  maxPlanLevel: number,
  overrides: Record<string, boolean> = {}
): boolean => {
  // If there's an explicit override (from the admin), respect it
  if (overrides[featureId] !== undefined) {
    return overrides[featureId];
  }

  // Basic features are unlocked for all users (Level 0+)
  const DEFAULT_FEATURES = ['prompt_standard', 'image_basic', 'fast_regen', 'translate_prompt'];
  if (DEFAULT_FEATURES.includes(featureId)) {
    return true;
  }

  // Otherwise, find the minimum plan level required for this feature
  const requiredLevel = PLANS.find(plan => plan.features.includes(featureId))?.level || 0;

  return maxPlanLevel >= requiredLevel;
};

/**
 * Gets the list of all features unlocked for a given plan level.
 */
export const getUnlockedFeatures = (maxPlanLevel: number): string[] => {
  const unlocked = new Set<string>();
  PLANS.forEach(plan => {
    if (maxPlanLevel >= plan.level) {
      plan.features.forEach(f => unlocked.add(f));
    }
  });
  return Array.from(unlocked);
};
