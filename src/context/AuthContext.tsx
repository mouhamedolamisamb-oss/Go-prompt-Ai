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

  // Safety timeout to prevent infinite black/loading screen
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Auth initialization timed out. Forcing ready state.");
        setLoading(false);
      }
    }, 8000); // 8 seconds
    return () => clearTimeout(timeout);
  }, [loading]);

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
      {loading ? (
        <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-8 text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="mt-8 text-xl font-black text-white uppercase tracking-widest italic animate-pulse">GoPrompt</h2>
          <p className="mt-4 text-gray-500 text-sm font-medium">Initialisation du système...</p>
          
          <div className="mt-12 flex flex-col gap-2 items-center">
             <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]"></div>
             </div>
             <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.3em]">Connexion sécurisée</p>
          </div>
        </div>
      ) : children}
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
