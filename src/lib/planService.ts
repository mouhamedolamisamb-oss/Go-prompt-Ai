import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { PLANS } from '../constants/plans';

export const activatePlan = async (userId: string, planId: string) => {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) throw new Error('Plan not found');

  try {
    const userRef = doc(db, 'profiles', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error('User not found');
    const userData = userSnap.data();

    // 1. Update Profile (Level never goes down)
    const newMaxLevel = Math.max(userData.maxPlanLevel || 0, plan.level);
    
    await updateDoc(userRef, {
      currentPlan: planId,
      planLevel: plan.level,
      maxPlanLevel: newMaxLevel,
      planActivatedAt: serverTimestamp()
    });

    // 2. Add Credits (Always increment)
    const creditsRef = doc(db, 'credits', userId);
    await updateDoc(creditsRef, {
      promptCredits: increment(plan.promptCredits),
      imageCredits: increment(plan.imageCredits),
      updatedAt: serverTimestamp()
    });

    // 3. Log Transaction
    await addDoc(collection(db, 'transactions'), {
      userId,
      userEmail: userData.email,
      planName: planId,
      promptCreditsAdded: plan.promptCredits,
      imageCreditsAdded: plan.imageCredits,
      addedByAdmin: true,
      createdAt: serverTimestamp()
    });

    // 4. Send Notification
    await addDoc(collection(db, 'notifications'), {
      userId,
      title: '🎉 Plan activé !',
      message: `Votre plan ${plan.name} a été activé. ${plan.promptCredits} crédits prompts et ${plan.imageCredits} crédits images ont été ajoutés à votre compte.`,
      type: 'plan_activated',
      read: false,
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (err) {
    console.error('Plan activation failed:', err);
    throw err;
  }
};
