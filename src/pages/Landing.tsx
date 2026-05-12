import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, MessageSquare, Image as ImageIcon, History, Globe, CreditCard, ChevronRight, Star, Zap, Sparkles } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Landing() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-violet-400 mb-8 font-mono">
              <Star className="w-3 h-3 fill-violet-400" />
              <span>Propulsé par Gemini 1.5 Flash</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
              {t('landing.hero_title')}
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('landing.hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth/register" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                Commencer gratuitement <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/auth/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white font-semibold rounded-full border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center">
                {t('common.login')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-[#050506]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">{t('landing.how_it_works')}</h2>
            <div className="w-20 h-1 bg-violet-600 mx-auto rounded-full" />
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-12"
          >
            {[
              { icon: MessageSquare, title: t('landing.step1_title'), desc: t('landing.step1_desc'), step: '01' },
              { icon: Globe, title: t('landing.step2_title'), desc: t('landing.step2_desc'), step: '02' },
              { icon: CheckCircle2, title: t('landing.step3_title'), desc: t('landing.step3_desc'), step: '03' },
            ].map((item, idx) => (
              <motion.div key={idx} variants={itemVariants} className="relative group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all overflow-hidden flex flex-col items-start translate-z-0">
                <div className="absolute bottom-6 right-6 text-6xl font-black text-white/[0.01] group-hover:text-violet-600/10 transition-all font-mono italic select-none pointer-events-none group-hover:scale-110">
                  {item.step}
                </div>
                <div className="relative z-10 w-full">
                  <div className="w-14 h-14 bg-violet-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-violet-600/20 transition-all transform group-hover:rotate-6 ring-1 ring-violet-500/10 shadow-lg shadow-violet-600/5">
                    <item.icon className="w-7 h-7 text-violet-500" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-3 uppercase italic tracking-tight">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm font-medium">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-8">{t('landing.features')}</h2>
              <div className="space-y-8">
                {[
                  { title: t('landing.feat1_title'), desc: t('landing.feat1_desc'), icon: MessageSquare },
                  { title: t('landing.feat2_title'), desc: t('landing.feat2_desc'), icon: ImageIcon },
                  { title: t('landing.feat3_title'), desc: t('landing.feat3_desc'), icon: History },
                ].map((feat, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      <feat.icon className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">{feat.title}</h4>
                      <p className="text-gray-500">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-white/10 p-8"
            >
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
              <div className="relative h-full flex flex-col justify-end">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center font-bold">G</div>
                    <div>
                      <div className="text-white font-medium text-sm">GoPrompt AI</div>
                      <div className="text-gray-400 text-xs">Optimisation terminée</div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-xs font-mono text-gray-300 leading-relaxed italic">
                    "Génère une scène d'action cinématographique dans les rues de Dakar, éclairage néon, style cyberpunk, 8k, ultra détaillé..."
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing - Recharge only */}
      <section id="pricing" className="py-20 lg:py-32 bg-[#050506]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
               Paiement Flexible
            </div>
            <h2 className="text-4xl font-black text-white mb-4 italic tracking-tighter uppercase">Plans de <span className="text-violet-500">Crédits</span></h2>
            <p className="text-gray-500 max-w-xl mx-auto">Rechargez vos crédits en toute simplicité. Tous les modes de paiement sont acceptés via WhatsApp.</p>
          </div>

          <div className="text-center mb-16">
             <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Nos Formules</h3>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { 
                name: 'Starter', price: '500', prompts: 50, images: 10, color: 'text-[#cd7f32]', accent: 'from-[#cd7f32]/10',
                features: ['Génération Standard & Ultra', 'Régénération rapide', 'Traduction prompt']
              },
              { 
                name: 'Basic', price: '1 000', prompts: 120, images: 25, color: 'text-[#c0c0c0]', accent: 'from-[#c0c0c0]/10',
                features: ['Tout le Starter inclus', 'Styles personnalisés', 'Entrée vocale 🎙️']
              },
              { 
                name: 'Pro', price: '5 000', prompts: 700, images: 100, color: 'text-[#ffd700]', accent: 'from-[#ffd700]/10', popular: true,
                features: ['Tout le Basic inclus', 'Améliorer un prompt ✨', 'Favoris illimités ⭐']
              },
              { 
                name: 'Expert', price: '10 000', prompts: 1600, images: 220, color: 'text-[#00d4ff]', accent: 'from-[#00d4ff]/10',
                features: ['Tout le Pro inclus', 'Image → Prompt 📄', 'Tableau de bord 📊']
              },
              { 
                name: 'Ultimate', price: '20 000', prompts: 3500, images: 500, color: 'text-violet-400', accent: 'from-violet-500/10 to-pink-500/10',
                features: ['TOUTES les fonctionnalités', 'Chat IA contextuel 🤖', 'Export PDF / TXT']
              },
            ].map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`flex flex-col bg-[#0a0a0b] border ${plan.popular ? 'border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/50' : 'border-white/5'} rounded-3xl p-6 relative overflow-hidden group hover:border-white/20 transition-all`}
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${plan.accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-500 text-white text-[9px] uppercase font-black rounded-full shadow-lg animate-pulse">
                    Populaire
                  </div>
                )}
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${plan.color}`}>{plan.name}</div>
                <div className="text-3xl font-black text-white mb-6 tracking-tight">{plan.price} <span className="text-[10px] font-bold text-gray-600 uppercase">FCFA</span></div>
                
                <div className="grid grid-cols-2 gap-2 mb-8">
                   <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <div className="text-[8px] font-black font-mono text-gray-600 uppercase mb-1">Prompts</div>
                      <div className="text-lg font-black text-white">{plan.prompts}</div>
                   </div>
                   <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <div className="text-[8px] font-black font-mono text-gray-600 uppercase mb-1">Images</div>
                      <div className="text-lg font-black text-white">{plan.images}</div>
                   </div>
                </div>

                <ul className="space-y-3 mb-8 text-[11px] text-gray-400 flex-grow font-medium">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span>Validité illimitée</span>
                  </li>
                </ul>

                <Link 
                  to="/dashboard/recharge" 
                  className={`w-full py-4 rounded-xl text-center text-[10px] font-black uppercase tracking-widest transition-all ${plan.popular ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:scale-[1.02]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                  Choisir ce plan →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">{t('landing.faq')}</h2>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {[
              { q: "Qu'est-ce que GoPrompt ?", a: "GoPrompt est une plateforme qui optimise vos idées en prompts professionnels pour les meilleurs modèles d'IA (ChatGPT, Midjourney, etc.)." },
              { q: "Comment fonctionnent les crédits ?", a: "Chaque génération consomme des crédits. Les prompts coûtent 10 (Standard) ou 25 (Ultra) crédits, et les images 1 crédit." },
              { q: "Les crédits expirent-ils ?", a: "Non, vos crédits achetés restent valables sans limite de temps sur votre compte." },
              { q: "Quels sont les modes de paiement ?", a: "Nous acceptons tous les modes de paiement (Wave, Orange Money, Free Money, virement, etc.). Le paiement s'effectue directement via WhatsApp avec un support réactif." },
              { q: "Puis-je changer la langue des prompts ?", a: "Oui, vous pouvez configurer la langue de sortie (FR/EN) dans les paramètres de votre compte." }
            ].map((faq, idx) => (
              <details key={idx} className="group bg-white/5 border border-white/5 rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-300">
                <summary className="flex items-center justify-between list-none text-white font-medium">
                  {faq.q}
                  <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-gray-500 leading-relaxed text-sm">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
