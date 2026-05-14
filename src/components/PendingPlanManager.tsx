import { useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { activatePlan } from '../lib/planService';
import { useAuth } from '../context/AuthContext';

export default function PendingPlanManager() {
  const { user, profile } = useAuth();
  
  const superAdmins = ['mouhamedolamisamb@gmail.com', 'kondedemba210@gmail.com'];
  const isAuthorized = user && (superAdmins.includes(user.email || '') || profile?.isAdmin);

  useEffect(() => {
    if (!isAuthorized) return;

    const checkPendingPlans = async () => {
      try {
        const now = Timestamp.now();
        const q = query(
          collection(db, 'pending_plans'),
          where('status', '==', 'pending'),
          where('scheduledAt', '<=', now)
        );

        const snapshot = await getDocs(q);
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const { userId, planName } = data;

          try {
            await activatePlan(userId, planName);
            
            // Mark as activated
            await updateDoc(doc(db, 'pending_plans', docSnap.id), {
              status: 'activated',
              activatedAt: serverTimestamp()
            });
            console.log(`Plan ${planName} activated for user ${userId}`);
          } catch (err) {
            console.error(`Failed to activate pending plan ${docSnap.id}:`, err);
            // Optionally mark as failed
            await updateDoc(doc(db, 'pending_plans', docSnap.id), {
              status: 'failed',
              error: err instanceof Error ? err.message : String(err)
            });
          }
        }
      } catch (err) {
        console.error('Error checking pending plans:', err);
      }
    };

    // Check every minute
    const interval = setInterval(checkPendingPlans, 60000);
    checkPendingPlans(); // Initial check

    return () => clearInterval(interval);
  }, [isAuthorized]);

  return null; // This is a background logic component
}
