import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, increment, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface Credits {
  promptCredits: number;
  imageCredits: number;
}

export const CREDIT_COSTS = {
  PROMPT_STANDARD: 10,
  PROMPT_ULTRA: 25,
  IMAGE: 1,
};

interface CreditsContextType {
  credits: Credits | null;
  deductCredits: (type: 'prompt_standard' | 'prompt_ultra' | 'image') => Promise<boolean>;
  refundCredits: (type: 'prompt_standard' | 'prompt_ultra' | 'image') => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const CreditsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<Credits | null>(null);

  useEffect(() => {
    if (!user) {
      setCredits(null);
      return;
    }

    const docRef = doc(db, 'credits', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCredits({
          promptCredits: Number(data?.promptCredits) || 0,
          imageCredits: Number(data?.imageCredits) || 0
        });
      } else {
        setCredits({ promptCredits: 0, imageCredits: 0 });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `credits/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  const deductCredits = async (type: 'prompt_standard' | 'prompt_ultra' | 'image') => {
    if (!user) return false;
    const docRef = doc(db, 'credits', user.uid);
    
    let amount = 0;
    let field = '';
    
    if (type === 'prompt_standard') { amount = CREDIT_COSTS.PROMPT_STANDARD; field = 'promptCredits'; }
    if (type === 'prompt_ultra') { amount = CREDIT_COSTS.PROMPT_ULTRA; field = 'promptCredits'; }
    if (type === 'image') { amount = CREDIT_COSTS.IMAGE; field = 'imageCredits'; }

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    
    const data = docSnap.data();
    if ((data[field] || 0) < amount) return false;

    try {
      await updateDoc(docRef, {
        [field]: increment(-amount),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `credits/${user.uid}`);
      return false;
    }
  };

  const refundCredits = async (type: 'prompt_standard' | 'prompt_ultra' | 'image') => {
    if (!user) return;
    const docRef = doc(db, 'credits', user.uid);
    
    let amount = 0;
    let field = '';
    
    if (type === 'prompt_standard') { amount = CREDIT_COSTS.PROMPT_STANDARD; field = 'promptCredits'; }
    if (type === 'prompt_ultra') { amount = CREDIT_COSTS.PROMPT_ULTRA; field = 'promptCredits'; }
    if (type === 'image') { amount = CREDIT_COSTS.IMAGE; field = 'imageCredits'; }

    try {
      await updateDoc(docRef, {
        [field]: increment(amount),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `credits/${user.uid}`);
    }
  };

  return (
    <CreditsContext.Provider value={{ credits, deductCredits, refundCredits }}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
};
