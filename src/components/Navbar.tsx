import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, LogOut, LayoutDashboard, History, Settings, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCredits } from '../context/CreditsContext';
import { motion } from 'motion/react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, signOut, globalConfig } = useAuth();
  const { credits } = useCredits();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === '/' || location.pathname === '';
  const showCredits = user && !isLanding && (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin'));

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <>
      {globalConfig?.bannerText && (
        <div className="fixed top-0 w-full z-[60] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-2 overflow-hidden border-b border-white/20">
          <motion.div 
            animate={{ x: [0, -200] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="whitespace-nowrap flex gap-10 items-center justify-center text-[10px] font-black uppercase tracking-widest text-white"
          >
            {[...Array(10)].map((_, i) => (
              <span key={i}>✨ {globalConfig.bannerText} ✨</span>
            ))}
          </motion.div>
        </div>
      )}
      <nav className={`fixed ${globalConfig?.bannerText ? 'top-8' : 'top-0'} w-full z-50 bg-[#0a0a0b]/80 backdrop-blur-md border-b border-white/5 transition-all duration-500`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">
                G
              </div>
              <span className="text-xl font-bold tracking-tight text-white">GoPrompt</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {!user ? (
              <>
                <Link to="/auth/login" className="text-sm text-gray-300 hover:text-white transition-colors">{t('common.login')}</Link>
                <Link to="/auth/register" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-200 transition-colors">
                  {t('common.register')}
                </Link>
              </>
            ) : (
              <>
                {showCredits && (
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex flex-col items-center">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Prompts</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white">{credits?.promptCredits ?? 0}</span>
                        <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${Math.min((Number(credits?.promptCredits) || 0) / 50 * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full flex flex-col items-center">
                      <span className="text-[9px] font-black text-pink-500 uppercase tracking-tighter">Images</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white">{credits?.imageCredits ?? 0}</span>
                        <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500" style={{ width: `${Math.min((Number(credits?.imageCredits) || 0) / 10 * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <Link to="/dashboard" className="px-6 py-2 bg-violet-600 text-white text-xs font-black rounded-lg hover:bg-violet-700 transition-all uppercase tracking-widest">
                  {t('common.dashboard')}
                </Link>
                {!isLanding && (
                  <>
                    <Link to="/dashboard/recharge" className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-orange-500/20 uppercase tracking-widest animate-pulse-glow">
                      {t('common.recharge')}
                    </Link>
                    <Link to="/dashboard/settings" title={t('common.settings')}>
                      <Settings className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
                    </Link>
                    <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                )}
                {!isLanding && <NotificationBell />}
              </>
            )}
            <button onClick={toggleLanguage} className="p-2 text-gray-400 hover:text-white transition-colors">
              <Globe className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            {!user ? (
              <button onClick={toggleLanguage} className="p-2 text-gray-400 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </button>
            ) : (
              <>
                {showCredits && (
                  <div className="flex gap-1.5">
                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                        <span className="text-[10px] font-black text-white">{credits?.promptCredits ?? 0}</span>
                    </div>
                    <div className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full flex items-center gap-2">
                        <span className="text-[10px] font-black text-white">{credits?.imageCredits ?? 0}</span>
                    </div>
                  </div>
                )}
                {user && <NotificationBell />}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
                >
                  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0a0a0b] border-b border-white/5 px-2 pt-2 pb-3 space-y-1">
          {!user && (
            <>
              <Link
                to="/auth/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
              >
                {t('common.login')}
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-violet-600"
              >
                {t('common.register')}
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <LayoutDashboard className="w-5 h-5" /> {t('common.dashboard')}
              </Link>
              {!isLanding && (
                <>
                  <Link
                    to="/dashboard/history"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white"
                  >
                    <History className="w-5 h-5" /> {t('common.history')}
                  </Link>
                  <Link
                    to="/dashboard/recharge"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-white/5 hover:text-amber-300"
                  >
                    <CreditCard className="w-5 h-5" /> {t('common.recharge')}
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    <Settings className="w-5 h-5" /> {t('common.settings')}
                  </Link>
                </>
              )}
              <button
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-white/5"
              >
                <LogOut className="w-5 h-5" /> {t('common.logout')}
              </button>
            </>
          )}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
          >
            <Globe className="w-5 h-5" /> {i18n.language === 'fr' ? 'English' : 'Français'}
          </button>
        </div>
      )}
    </nav>
    </>
  );
}
