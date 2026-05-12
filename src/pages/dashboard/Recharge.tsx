import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, MessageSquare, CreditCard, ShieldCheck, AlertCircle, Phone, Smartphone, Banknote, Landmark, Wallet } from 'lucide-react';
import { PLANS, FEATURE_LABELS } from '../../constants/plans';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Recharge() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [activePlanConfigs, setActivePlanConfigs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadConfigs = async () => {
      const q = query(collection(db, 'plan_configs'), where('isActive', '==', true));
      const snap = await getDocs(q);
      const configs: Record<string, boolean> = {};
      snap.forEach(doc => {
        configs[doc.data().planName] = true;
      });
      // If no configs found, assume all are active (for first run)
      if (snap.empty) {
        PLANS.forEach(p => configs[p.id] = true);
      }
      setActivePlanConfigs(configs);
    };
    loadConfigs();
  }, []);

  const handlePay = () => {
    if (!selectedPlan || !user) return;

    const message = `Bonjour 👋, je souhaite recharger mon compte GoPrompt.

━━━━━━━━━━━━━━━━━━━━━
📦 Plan choisi : ${selectedPlan.name}
💰 Montant : ${selectedPlan.price} FCFA
💬 Crédits prompts : +${selectedPlan.promptCredits}
🖼️ Crédits images : +${selectedPlan.imageCredits}
━━━━━━━━━━━━━━━━━━━━━
📧 Mon email : ${user.email}
━━━━━━━━━━━━━━━━━━━━━

Je vais effectuer le paiement maintenant et vous envoyer la capture d'écran de confirmation. Merci !`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/221706113645?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setShowInstructions(true);
  };

  const visiblePlans = PLANS;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">{t('recharge.title')}</h1>
        <p className="text-gray-500 max-w-2xl mx-auto font-medium">{t('recharge.whatsapp_info')}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600/10 border border-violet-500/20 rounded-full">
           <ShieldCheck className="w-4 h-4 text-violet-500" />
           <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest leading-none">Paiement 100% sécurisé et vérifié</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {visiblePlans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setSelectedPlan(plan)}
            className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all cursor-pointer group h-full overflow-hidden ${
              selectedPlan?.id === plan.id 
                ? 'bg-violet-600 ring-4 ring-violet-500/30' 
                : 'bg-white/[0.02] border-white/5 hover:border-white/20'
            }`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${plan.color} opacity-10 blur-3xl -z-10 group-hover:opacity-20 transition-opacity`} />
            
            {plan.level === 3 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-500 text-black text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20">
                Populaire
              </div>
            )}

            <div className="mb-8">
              <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${selectedPlan?.id === plan.id ? 'text-white/60' : 'text-gray-500'}`}>{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black italic tracking-tighter ${selectedPlan?.id === plan.id ? 'text-white' : 'text-white'}`}>{plan.price}</span>
                <span className={`text-[10px] font-bold uppercase ${selectedPlan?.id === plan.id ? 'text-white/60' : 'text-gray-600'}`}>FCFA</span>
              </div>
            </div>

            <div className="space-y-6 flex-grow">
              <div className="grid grid-cols-1 gap-2">
                <div className={`rounded-2xl p-4 border transition-colors ${selectedPlan?.id === plan.id ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5'}`}>
                   <div className={`text-[8px] uppercase font-black mb-1 ${selectedPlan?.id === plan.id ? 'text-white/60' : 'text-gray-500'}`}>Prompts & Images</div>
                   <div className="text-xl font-black text-white italic">+{plan.promptCredits}P / +{plan.imageCredits}I</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`text-[8px] font-black uppercase tracking-widest pl-1 ${selectedPlan?.id === plan.id ? 'text-white/60' : 'text-gray-700'}`}>Points forts :</div>
                <div className="space-y-2">
                  {plan.features.slice(0, 5).map((fId, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${selectedPlan?.id === plan.id ? 'bg-white/20' : 'bg-green-500/10'}`}>
                         <Check className={`w-2.5 h-2.5 ${selectedPlan?.id === plan.id ? 'text-white' : 'text-green-500'}`} />
                      </div>
                      <span className={`text-[10px] font-bold ${selectedPlan?.id === plan.id ? 'text-white/80' : 'text-gray-400'}`}>{FEATURE_LABELS[fId] || fId}</span>
                    </div>
                  ))}
                  {plan.features.length > 5 && (
                    <p className={`text-[9px] font-black italic pl-6 ${selectedPlan?.id === plan.id ? 'text-white/60' : 'text-gray-600'}`}>+ {plan.features.length - 5} autres...</p>
                  )}
                </div>
              </div>
            </div>

            <button 
              className={`w-full mt-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedPlan?.id === plan.id 
                  ? 'bg-white text-violet-600 shadow-xl' 
                  : 'bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-white'
                }`}
            >
              Sélectionner →
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPlan && !showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0f0f13] border border-white/10 w-full max-w-lg p-8 lg:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden"
            >
               <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${selectedPlan.color} opacity-10 blur-[100px] -z-10`} />
              
               <button 
                onClick={() => setSelectedPlan(null)}
                className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-6 mb-10">
                <div className="w-16 h-16 bg-violet-600/10 rounded-3xl flex items-center justify-center ring-1 ring-violet-500/20">
                  <CreditCard className="w-8 h-8 text-violet-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Récapitulatif</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Plan ${selectedPlan.name}</p>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                 <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                       <span className="text-gray-400 text-xs font-black uppercase">Prix total</span>
                       <span className="text-3xl font-black text-white italic tracking-tighter">{selectedPlan.price} FCFA</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                          <p className="text-[10px] font-black text-blue-500 uppercase mb-1">Prompts</p>
                          <p className="text-lg font-black text-white">+{selectedPlan.promptCredits}</p>
                       </div>
                       <div className="bg-pink-500/5 p-4 rounded-2xl border border-pink-500/10">
                          <p className="text-[10px] font-black text-pink-500 uppercase mb-1">Images</p>
                          <p className="text-lg font-black text-white">+{selectedPlan.imageCredits}</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                    <p className="text-xs font-black text-emerald-500 uppercase mb-4 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4" /> Nouvelles fonctionnalités
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                       {selectedPlan.features.map((f: string, i: number) => (
                         <div key={i} className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-bold text-gray-300">{FEATURE_LABELS[f] || f}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-amber-500 leading-tight">
                       ⚠️ Vos fonctionnalités actuelles seront <span className="underline italic">intégralement conservées</span>. Le plan s'ajoute à votre compte.
                    </p>
                 </div>
              </div>

              <button
                onClick={handlePay}
                className="w-full py-5 bg-[#25D366] text-white font-black rounded-[2rem] hover:bg-[#128C7E] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#25D366]/20 uppercase tracking-widest text-sm italic"
              >
                <MessageSquare className="w-6 h-6 fill-white" />
                Payer via WhatsApp
              </button>
            </motion.div>
          </motion.div>
        )}

        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0f0f13] border border-white/10 w-full max-w-xl p-8 lg:p-12 rounded-[3.5rem] shadow-2xl text-center relative"
            >
               <button 
                onClick={() => { setShowInstructions(false); setSelectedPlan(null); }}
                className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-4 ring-green-500/5">
                 <Phone className="w-10 h-10 text-green-500" />
              </div>

              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Instructions de Paiement</h2>
              <p className="text-gray-500 text-sm font-medium mb-10">Suivez ces étapes pour finaliser votre recharge</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-10">
                 {[
                   { step: '01', title: 'Paiement', desc: `Effectuez le paiement de ${selectedPlan.price} FCFA via Wave ou Orange Money.` },
                   { step: '02', title: 'Capture', desc: 'Prenez une capture d\'écran nette de la confirmation de transaction.' },
                   { step: '03', title: 'Envoi', desc: 'Envoyez la capture dans la discussion WhatsApp déjà ouverte.' },
                   { step: '04', title: 'Validation', desc: 'Vos crédits seront ajoutés sous 1 à 5 minutes après vérification.' }
                 ].map((s) => (
                   <div key={s.step} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                      <span className="absolute -top-2 -right-2 text-6xl font-black text-white/[0.02] italic pointer-events-none group-hover:text-blue-500/5 transition-all">{s.step}</span>
                      <p className="text-xs font-black text-blue-500 uppercase mb-2">Étape {s.step}</p>
                      <h4 className="text-white font-black uppercase text-sm mb-2">{s.title}</h4>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{s.desc}</p>
                   </div>
                 ))}
              </div>

              <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 mb-8">
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4">Modes de paiement acceptés :</p>
                 <div className="flex flex-wrap justify-center gap-6 opacity-60">
                    <div className="flex flex-col items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-default">
                       <Smartphone className="w-6 h-6 text-blue-400" />
                       <span className="text-[8px] font-black text-blue-400 uppercase">Wave</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-default text-orange-500">
                       <Banknote className="w-6 h-6" />
                       <span className="text-[8px] font-black uppercase">Orange M.</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-default text-blue-600">
                       <Landmark className="w-6 h-6" />
                       <span className="text-[8px] font-black uppercase">Free M.</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 grayscale hover:grayscale-0 transition-all cursor-default text-emerald-500">
                       <Wallet className="w-6 h-6" />
                       <span className="text-[8px] font-black uppercase">Bank</span>
                    </div>
                 </div>
              </div>

              <button
                onClick={() => { setShowInstructions(false); setSelectedPlan(null); }}
                className="px-12 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs italic"
              >
                Compris, j'ai envoyé la capture !
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

