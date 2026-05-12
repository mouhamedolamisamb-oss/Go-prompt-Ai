import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#050506] border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
                G
              </div>
              <span className="text-xl font-bold tracking-tight text-white">GoPrompt</span>
            </Link>
            <p className="text-gray-500 text-sm max-w-xs text-center md:text-left">
              Boostez votre créativité avec des prompts optimisés par l'IA.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-semibold text-sm">Produit</h4>
              <Link to="/#features" className="text-gray-500 hover:text-white text-sm transition-colors">{t('landing.features')}</Link>
              <Link to="/#pricing" className="text-gray-500 hover:text-white text-sm transition-colors">{t('landing.pricing')}</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-semibold text-sm">Légal</h4>
              <Link to="/tos" className="text-gray-500 hover:text-white text-sm transition-colors">Mentions légales</Link>
              <Link to="/privacy" className="text-gray-500 hover:text-white text-sm transition-colors">Confidentialité</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-semibold text-sm">Contact</h4>
              <a href="https://wa.me/221706113645" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white text-sm transition-colors">WhatsApp</a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">
            {t('landing.footer')}
          </p>
          <div className="flex gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
            <span className="text-gray-600 text-[10px] uppercase tracking-widest">System Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
