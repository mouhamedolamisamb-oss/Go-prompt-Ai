import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface Profile {
  email: string;
  name: string;
  language: string;
  promptLanguage: string;
  isBlocked: boolean;
  createdAt: any;
  isAdmin: boolean;
  currentPlan: string;
  planLevel: number;
  maxPlanLevel: number;
  planActivatedAt: any;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  globalConfig: any | null;
  featureOverrides: Record<string, boolean>;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [globalConfig, setGlobalConfig] = useState<any | null>(null);
  const [featureOverrides, setFeatureOverrides] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    // Config global listener
    const unsubConfig = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalConfig(docSnap.data());
      } else {
        // Init default if missing
        setDoc(doc(db, 'settings', 'global'), {
          allowSignups: true,
          bannerText: '',
          maintenanceMode: false,
          signupBonusPrompts: 5,
          signupBonusImages: 2
        });
      }
      setConfigLoaded(true);
    });

    let unsubProfile: (() => void) | null = null;
    let unsubOverrides: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (unsubProfile) unsubProfile();
      if (unsubOverrides) unsubOverrides();

      if (authUser) {
        // Listen to profile
        unsubProfile = onSnapshot(doc(db, 'profiles', authUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as Profile;
            if (profileData.isBlocked) {
              await firebaseSignOut(auth);
              setUser(null);
              setProfile(null);
            } else {
              setUser(authUser);
              setProfile(profileData);
            }
          } else {
            setUser(authUser);
            setProfile(null);
          }
          setAuthLoaded(true);
        });

        // Listen to overrides
        unsubOverrides = onSnapshot(doc(db, 'feature_overrides', authUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setFeatureOverrides(docSnap.data().features || {});
          } else {
            setFeatureOverrides({});
          }
        });

      } else {
        setUser(null);
        setProfile(null);
        setFeatureOverrides({});
        setAuthLoaded(true);
      }
    });

    return () => {
      unsubConfig();
      if (unsubProfile) unsubProfile();
      if (unsubOverrides) unsubOverrides();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (configLoaded && authLoaded) {
      setLoading(false);
    }
  }, [configLoaded, authLoaded]);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const fetchProfile = async (uid: string) => {
    const docRef = doc(db, 'profiles', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setProfile(docSnap.data() as Profile);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, globalConfig, featureOverrides, loading, signOut, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
