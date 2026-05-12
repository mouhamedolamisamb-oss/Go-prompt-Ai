import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { updateProfile, updatePassword, deleteUser } from 'firebase/auth';
import { motion } from 'motion/react';
import { User, Globe, MessageSquare, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [promptLang, setPromptLang] = useState(profile?.promptLanguage || 'fr');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdating(true);
    setMessage(null);

    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        name,
        promptLanguage: promptLang,
        language: i18n.language
      });
      await updateProfile(user, { displayName: name });
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profil mis à jour' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-white mb-2">{t('settings.title')}</h1>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Profile Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-white">{t('settings.change_name')}</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nom Complet</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t('settings.interface_lang')}</label>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => handleChangeLanguage('fr')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${i18n.language === 'fr' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                  Français
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeLanguage('en')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${i18n.language === 'en' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                  English
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t('settings.prompt_lang')}</label>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPromptLang('fr')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${promptLang === 'fr' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Français
                </button>
                <button
                  type="button"
                  onClick={() => setPromptLang('en')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${promptLang === 'en' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : t('common.save')}
          </button>
        </form>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-red-500 underline decoration-red-500/30 underline-offset-8">Zone de danger</h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-white font-bold text-sm mb-1">{t('settings.delete_account')}</h4>
            <p className="text-gray-500 text-xs">Une fois supprimé, votre compte et vos crédits ne peuvent pas être récupérés.</p>
          </div>
          <button
            onClick={() => alert('Veuillez contacter le support pour la suppression définitive.')}
            className="px-6 py-3 border border-red-500/20 text-red-500 font-bold rounded-xl hover:bg-red-500/10 transition-all text-xs uppercase tracking-widest"
          >
            {t('settings.delete_account')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
