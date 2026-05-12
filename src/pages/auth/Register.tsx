import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2, ArrowLeft, Chrome, Ban } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { globalConfig } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      
      if (!profileDoc.exists() && globalConfig?.allowSignups === false) {
        await auth.signOut();
        setError("⛔ Les inscriptions sont temporairement fermées par l'administration.");
        setLoading(false);
        return;
      }

      if (profileDoc.exists() && profileDoc.data().isBlocked) {
        await auth.signOut();
        setError("⛔ Votre compte a été suspendu par l'administration.");
        setLoading(false);
        return;
      }
      
      if (!profileDoc.exists()) {
        await setDoc(doc(db, 'profiles', user.uid), {
          email: user.email,
          name: user.displayName || 'Utilisateur Google',
          language: i18n.language || 'fr',
          promptLanguage: i18n.language || 'fr',
          isBlocked: false,
          createdAt: serverTimestamp(),
          isAdmin: false,
          currentPlan: 'free',
          planLevel: 0
        });

        await setDoc(doc(db, 'credits', user.uid), {
          userId: user.uid,
          promptCredits: globalConfig?.signupBonusPrompts ?? 5,
          imageCredits: globalConfig?.signupBonusImages ?? 2,
          updatedAt: serverTimestamp()
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (globalConfig?.allowSignups === false) {
      setError("⛔ Les inscriptions sont temporairement fermées par l'administration.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create profile
      await setDoc(doc(db, 'profiles', user.uid), {
        email: user.email,
        name: name,
        language: i18n.language || 'fr',
        promptLanguage: i18n.language || 'fr',
        isBlocked: false,
        createdAt: serverTimestamp(),
        isAdmin: false,
        currentPlan: 'free',
        planLevel: 0
      });

      // Create initial credits
      await setDoc(doc(db, 'credits', user.uid), {
        userId: user.uid,
        promptCredits: globalConfig?.signupBonusPrompts ?? 5,
        imageCredits: globalConfig?.signupBonusImages ?? 2,
        updatedAt: serverTimestamp()
      });

      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("L'inscription par Email/Mot de passe n'est pas activée dans votre console Firebase. Veuillez l'activer dans 'Authentication > Sign-in method'.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Cet email est déjà utilisé par un autre compte.");
      } else if (err.code === 'auth/weak-password') {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'inscription.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t('common.home')}
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">{t('common.register')}</h1>
            <p className="text-gray-500 text-sm">Créez votre compte gratuit GoPrompt</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Nom complet</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.register')}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-grow bg-white/10" />
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">OU</span>
            <div className="h-px flex-grow bg-white/10" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            <Chrome className="w-5 h-5 text-blue-400" />
            S'inscrire avec Google
          </button>

          <div className="mt-6 flex items-start gap-3">
             <div className="bg-violet-500/10 border border-violet-500/20 p-2 rounded-lg text-[10px] text-violet-400">
               🎁 +{globalConfig?.signupBonusPrompts ?? 5} Crédits Prompts & +{globalConfig?.signupBonusImages ?? 2} Crédits Images offerts
             </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Déjà un compte ? <Link to="/auth/login" className="text-white font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
