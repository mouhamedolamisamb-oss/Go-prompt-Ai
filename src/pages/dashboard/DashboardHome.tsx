import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Copy, Check, Download, Zap, Sparkles, Image as ImageIcon, AlertCircle, CheckCircle2, MessageSquare, Coins, Lock, Star, ChevronRight, Award } from 'lucide-react';
import { generateTextPrompt, generateImageFromText } from '../../lib/gemini';
import { compressImage } from '../../lib/imageUtils';
import { useCredits, CREDIT_COSTS } from '../../context/CreditsContext';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import confetti from 'canvas-confetti';
import VoiceButton from '../../components/VoiceButton';
import { FEATURES } from '../../lib/features';
import { PLANS, FEATURE_LABELS } from '../../constants/plans';
import { isFeatureUnlocked } from '../../lib/planUtils';

export default function DashboardHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, featureOverrides } = useAuth();
  const { credits, deductCredits, refundCredits } = useCredits();

  const [idea, setIdea] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [resultPrompt, setResultPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [promptMode, setPromptMode] = useState<'standard' | 'ultra' | null>(null);

  const [activeTab, setActiveTab] = useState<'prompts' | 'images'>('prompts');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageQuality, setImageQuality] = useState<'basic' | 'hd' | 'pro'>('basic');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [error, setError] = useState('');
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  const maxLevel = profile?.maxPlanLevel || 0;
  const currentPlan = useMemo(() => PLANS.find(p => p.level === profile?.planLevel) || PLANS[0], [profile]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'history'), 
        where('userId', '==', user.uid), 
        orderBy('createdAt', 'desc'), 
        limit(3)
      );
      getDocs(q).then(snap => {
        setRecentHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [user]);

  // Secret admin access
  useEffect(() => {
    if (idea.trim() === 'ola10mi0') {
      navigate('/admin');
    }
  }, [idea, navigate]);

  const handleGeneratePrompt = async (mode: 'standard' | 'ultra') => {
    if (!idea.trim()) return;
    setError('');

    // Check plan level for Ultra
    if (mode === 'ultra' && !isFeatureUnlocked('prompt_ultra', maxLevel, featureOverrides)) {
      setError('🔒 Le Mode Ultra est réservé aux membres à partir du plan Starter.');
      return;
    }

    const costType = mode === 'standard' ? 'prompt_standard' : 'prompt_ultra';
    const costValue = mode === 'standard' ? CREDIT_COSTS.PROMPT_STANDARD : CREDIT_COSTS.PROMPT_ULTRA;

    if ((credits?.promptCredits ?? 0) < costValue) {
      setError(`❌ Crédits insuffisants. Il vous faut ${costValue} crédits pour le mode ${mode === 'standard' ? 'Standard' : 'Ultra'} (vous avez ${credits?.promptCredits} crédits).`);
      return;
    }

    setIsGeneratingPrompt(true);
    setPromptMode(mode);
    setResultPrompt('');

    // 1. Deduct BEFORE generation
    const success = await deductCredits(costType);
    if (!success) {
      setError('Erreur lors de la déduction des crédits.');
      setIsGeneratingPrompt(false);
      return;
    }

    try {
      const prompt = await generateTextPrompt(idea, mode, profile?.promptLanguage || 'fr');
      
      if (prompt) {
        setResultPrompt(prompt);
        try {
          await addDoc(collection(db, 'history'), {
            userId: user?.uid,
            idea,
            generatedPrompt: prompt,
            mode,
            type: 'prompt',
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          handleFirestoreError(dbError, OperationType.CREATE, 'history');
        }
        
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: mode === 'ultra' ? ['#7c3aed', '#ec4899', '#ffffff'] : ['#f59e0b', '#fbbf24', '#ffffff']
        });
      } else {
        throw new Error('Empty prompt generated');
      }
    } catch (error: any) {
      console.error(error);
      const isFirestoreError = error?.message?.includes('operationType');
      setError(isFirestoreError ? '⚠️ Erreur de base de données. Contactez le support.' : '❌ La génération a échoué. Vos crédits ont été remboursés.');
      // 2. Refund if failed
      await refundCredits(costType);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setError('');

    const qualityConfig = imageQuality === 'basic' ? FEATURES.image_basic : (imageQuality === 'hd' ? FEATURES.image_hd : FEATURES.image_professional);
    const featureId = imageQuality === 'hd' ? 'image_hd' : (imageQuality === 'pro' ? 'image_professional' : 'image_basic');
    
    if (!isFeatureUnlocked(featureId, maxLevel, featureOverrides)) {
      setError(`🔒 Qualité ${imageQuality.toUpperCase()} non débloquée pour votre niveau actuel.`);
      return;
    }

    const costValue = qualityConfig.cost;
    setIsGeneratingImage(true);
    setGeneratedImageUrl('');

    if ((credits?.imageCredits ?? 0) < costValue) {
      setError(`❌ Crédits insuffisants. Il vous faut ${costValue} crédits images (vous avez ${credits?.imageCredits}).`);
      setIsGeneratingImage(false);
      return;
    }

    const success = await deductCredits('image');
    if (!success) {
      setError('Erreur lors de la déduction des crédits.');
      setIsGeneratingImage(false);
      return;
    }

    try {
      const imageUrl = await generateImageFromText(imagePrompt, imageQuality);
      if (imageUrl) {
        setGeneratedImageUrl(imageUrl);
        
        // Save compressed version to history to respect Firestore 1MB limit
        try {
          const compressedUrl = await compressImage(imageUrl, 1024, 0.7);
          
          await addDoc(collection(db, 'history'), {
            userId: user?.uid,
            idea: imagePrompt,
            generatedImageUrl: compressedUrl,
            quality: imageQuality,
            type: 'image',
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          console.error("History save failed:", dbError);
          // Don't call handleFirestoreError here to avoid blocking UI for history fail
        }
      } else {
        throw new Error('Image generation failed');
      }
    } catch (error: any) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'La génération d\'image a échoué. Vos crédits ont été remboursés.';
      setError(message);
      await refundCredits('image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resultPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = async () => {
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `goprompt-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback to simple link if fetch fails
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.target = "_blank";
      link.download = `goprompt-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* Credits Low Alert */}
      {((credits?.promptCredits ?? 0) < 10 || (credits?.imageCredits ?? 0) < 1) && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 text-amber-500 shadow-lg shadow-amber-500/5 relative z-30"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs font-bold tracking-tight">Vos crédits sont faibles. Rechargez pour continuer à créer !</p>
          <button onClick={() => navigate('/dashboard/recharge')} className="ml-auto text-[10px] font-black uppercase underline">Recharger</button>
        </motion.div>
      )}

      {/* Tabs Layout */}
      <div className="flex flex-col items-center space-y-8">
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl w-full max-w-sm">
          <button 
            onClick={() => { setActiveTab('prompts'); setError(''); }}
            className={`flex-1 py-3 font-bold rounded-xl transition-all ${activeTab === 'prompts' ? 'bg-white/10 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            Prompts
          </button>
          <button 
            onClick={() => { setActiveTab('images'); setError(''); }}
            className={`flex-1 py-3 font-bold rounded-xl transition-all ${activeTab === 'images' ? 'bg-white/10 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            Images
          </button>
        </div>

        <div className="w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'prompts' ? (
              <motion.div 
                key="prompts-tab"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch"
              >
                {/* Generation Block */}
                <div className="glass-card p-8 border-white/10 relative overflow-hidden group flex flex-col h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-violet-600/20 transition-all" />
                  <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-violet-500" /> Le Générateur
                  </h2>
                  <p className="text-gray-500 text-sm mb-8 italic">Votre idée simple. Notre IA. Le prompt parfait.</p>
                  
                  <div className="relative group/textarea flex-grow flex flex-col">
                    <textarea
                      className="w-full flex-grow min-h-[200px] bg-[#0a0a0f]/50 border border-white/5 rounded-2xl p-6 text-white text-lg placeholder-gray-700 focus:outline-none focus:border-violet-500/50 transition-all resize-none shadow-inner"
                      placeholder="Ex: Une application de fitness avec un design sombre et néon..."
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                    />
                    <VoiceButton 
                      onTranscript={(t) => setIdea(prev => prev + ' ' + t)}
                      language={profile?.promptLanguage || 'fr'}
                      disabled={!isFeatureUnlocked('voice_input', maxLevel, featureOverrides)}
                      lockMessage="🎙️ Débloqué dès le plan Basic (1 000 FCFA)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <button
                      onClick={() => handleGeneratePrompt('standard')}
                      disabled={isGeneratingPrompt || !idea.trim()}
                      className="btn-standard py-5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <div className="text-center">
                        <div className="text-sm font-black mb-0.5">STANDARD</div>
                        <div className="text-[10px] opacity-70">10 CRÉDITS</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleGeneratePrompt('ultra')}
                      disabled={isGeneratingPrompt || !idea.trim()}
                      className="btn-ultra py-5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <div className="text-center">
                        <div className="text-sm font-black mb-0.5">MODE ULTRA</div>
                        <div className="text-[10px] opacity-80">25 CRÉDITS</div>
                      </div>
                    </button>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
                       <AlertCircle className="w-4 h-4" /> {error}
                    </motion.div>
                  )}
                </div>

                {/* Result Block */}
                <div className="flex flex-col h-full">
                  <AnimatePresence mode="wait">
                    {isGeneratingPrompt ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-card p-12 h-full flex flex-col items-center justify-center text-center space-y-6 flex-grow"
                      >
                        <div className="relative">
                          <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />
                          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-pink-500 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white mb-2 italic">Optimisation...</h3>
                          <p className="text-gray-500 text-sm max-w-xs">Nous structurons vos mots pour un impact maximal.</p>
                        </div>
                      </motion.div>
                    ) : resultPrompt ? (
                      <motion.div 
                        key="result"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="glass-card p-8 h-full flex flex-col relative group flex-grow"
                      >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${promptMode === 'ultra' ? 'bg-pink-500/20 text-pink-500 border border-pink-500/20' : 'bg-amber-500/20 text-amber-500 border border-amber-500/20'}`}>
                               {promptMode === 'ultra' ? '✨ Mode Ultra' : '⚡ Standard'}
                            </div>
                            <button 
                              onClick={copyToClipboard}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              {copied ? 'Copié !' : 'Copier'}
                            </button>
                        </div>
                        
                        <div className="flex-grow bg-[#050508]/80 border border-white/5 rounded-2xl p-6 text-gray-300 font-mono text-sm leading-relaxed overflow-y-auto min-h-[250px]">
                           {resultPrompt}
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/5 gap-4">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                               <CheckCircle2 className="w-4 h-4 text-green-500" /> Prêt pour Midjourney / DALL-E
                           </div>
                           <button onClick={() => navigate('/dashboard/history')} className="text-[10px] font-black text-violet-500 uppercase hover:underline">Revoir l'historique</button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="glass-card p-12 h-full flex flex-col items-center justify-center text-center opacity-40 border-dashed flex-grow">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                           <MessageSquare className="w-8 h-8 text-gray-700" />
                        </div>
                        <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">Le prompt optimisé apparaîtra ici</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="images-tab"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="max-w-4xl mx-auto w-full"
              >
                <div className="glass-card p-8 border-indigo-500/20 relative overflow-hidden group">
                  <div className="flex flex-col items-center gap-8">
                      <div className="text-center w-full max-w-xl">
                        <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/10">
                            <ImageIcon className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">Générateur d'Images</h2>
                        <p className="text-gray-500 text-sm mb-6">L'IA transforme vos rêves en pixels haute définition.</p>
                      </div>

                      <div className="w-full space-y-8">
                        <div className="flex flex-col gap-6">
                          <div className="relative group/textarea">
                            <textarea 
                              placeholder="Une forêt enchantée sous la pleine lune, style cinématographique, détails 8K..."
                              className="w-full bg-[#050508] border border-white/10 rounded-2xl px-6 py-6 text-white text-lg placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-all min-h-[160px] resize-none shadow-inner"
                              value={imagePrompt}
                              onChange={(e) => setImagePrompt(e.target.value)}
                            />
                            <VoiceButton 
                              onTranscript={(t) => setImagePrompt(prev => prev + ' ' + t)}
                              language={profile?.promptLanguage || 'fr'}
                              disabled={!isFeatureUnlocked('voice_input', maxLevel, featureOverrides)}
                              lockMessage="🎙️ Débloqué dès le plan Basic (1 000 FCFA)"
                            />
                          </div>

                          <div className="space-y-4">
                             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Choisir la qualité :</div>
                             <div className="grid grid-cols-3 gap-3">
                                {[
                                  { id: 'basic', label: 'Basique', icon: <Star className="w-4 h-4" />, cost: 1, feature: 'image_basic' },
                                  { id: 'hd', label: 'HD', icon: <><Star className="w-4 h-4" /><Star className="w-4 h-4" /></>, cost: 3, feature: 'image_hd' },
                                  { id: 'pro', label: 'Pro', icon: <><Star className="w-4 h-4" /><Star className="w-4 h-4" /><Star className="w-4 h-4" /></>, cost: 5, feature: 'image_professional' },
                                ].map((q) => {
                                  const isLocked = !isFeatureUnlocked(q.feature, maxLevel, featureOverrides);
                                  return (
                                    <button
                                      key={q.id}
                                      onClick={() => !isLocked && setImageQuality(q.id as any)}
                                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 relative ${
                                        imageQuality === q.id 
                                          ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                                          : isLocked 
                                            ? 'border-white/5 bg-white/[0.02] text-gray-600 opacity-60' 
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                      }`}
                                    >
                                      <div className="flex gap-0.5 text-indigo-400">{q.icon}</div>
                                      <div className="text-[10px] font-black uppercase">{q.label}</div>
                                      <div className="text-[9px] font-bold opacity-60">{q.cost} CRÉDIT{q.cost > 1 ? 'S' : ''}</div>
                                      {isLocked && <Lock className="absolute top-2 right-2 w-3 h-3 text-gray-600" />}
                                    </button>
                                  );
                                })}
                             </div>
                          </div>

                          <button 
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage || !imagePrompt.trim()}
                            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all disabled:opacity-30 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 text-lg uppercase tracking-wider"
                          >
                            {isGeneratingImage ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Sparkles className="w-6 h-6" />}
                            {isGeneratingImage ? 'Création en cours...' : "GÉNÉRER L'IMAGE"}
                          </button>
                          
                          <div className="flex justify-center">
                            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/10">
                               <Coins className="w-3.5 h-3.5" /> Coût : variable selon qualité
                            </div>
                          </div>
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center justify-center gap-2">
                             <AlertCircle className="w-4 h-4" /> {error}
                          </motion.div>
                        )}

                        <AnimatePresence>
                          {isGeneratingImage && !generatedImageUrl && (
                            <motion.div 
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="aspect-square w-full max-w-lg mx-auto bg-white/5 border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4 animate-pulse border-dashed"
                            >
                               <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                               <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Fusion des données artistiques...</span>
                            </motion.div>
                          )}
                          {generatedImageUrl && (
                              <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="relative max-w-lg mx-auto w-full space-y-6"
                              >
                                <div className="relative group p-2 bg-amber-500/10 rounded-[2rem] border border-amber-500/20 shadow-2xl shadow-amber-500/5">
                                  <img 
                                    src={generatedImageUrl} 
                                    className="w-full aspect-square object-cover rounded-[1.8rem] border border-white/10" 
                                  />
                                  <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-black text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg">
                                    Nouveau
                                  </div>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                  <button 
                                    onClick={downloadImage} 
                                    className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest"
                                  >
                                    <Download className="w-6 h-6" /> TÉLÉCHARGER L'IMAGE
                                  </button>
                                  <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.2em] italic">Sauvegardé dans votre historique</p>
                                </div>
                              </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Header Info - Private Data Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Status Card */}
        <div className="lg:col-span-2 bg-[#0f0f15] border border-white/5 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden group">
           <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${currentPlan.color} opacity-5 blur-[80px] -z-10 group-hover:opacity-10 transition-opacity`} />
           
           <div className="relative">
              <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} className="w-16 h-16" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg border border-white/10">
                 <Award className="w-4 h-4" />
              </div>
           </div>

           <div className="text-center sm:text-left flex-grow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                 <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">{profile?.name || t('common.user')}</h1>
                 <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-600/20 text-violet-500 border border-violet-500/20 inline-block`}>
                    Plan {currentPlan.name}
                 </div>
              </div>
              <p className="text-gray-500 text-xs font-medium mb-4">{user?.email}</p>
              
              <div className="flex flex-wrap items-center gap-2">
                 {currentPlan.features.slice(0, 3).map((f) => (
                    <span key={f} className="text-[9px] font-bold px-2 py-1 bg-white/5 rounded-lg text-gray-400 border border-white/5">
                       {FEATURE_LABELS[f] || f}
                    </span>
                 ))}
                 {currentPlan.features.length > 3 && (
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">+{currentPlan.features.length - 3} autres</span>
                 )}
              </div>
           </div>

           <div className="flex flex-col gap-3 w-full sm:w-auto">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
                 <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Prompts</p>
                 <p className="text-2xl font-black text-white italic">{credits?.promptCredits || 0}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
                 <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Images</p>
                 <p className="text-2xl font-black text-white italic">{credits?.imageCredits || 0}</p>
              </div>
           </div>
        </div>

        {/* Quick History Card */}
        <div className="bg-[#0f0f15] border border-white/5 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden">
           <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Activités récentes</h3>
           <div className="space-y-3 flex-grow">
              {recentHistory.map((item) => {
                 const type = item.type || (item.generatedImageUrl ? 'image' : 'prompt');
                 return (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer" onClick={() => navigate('/dashboard/history')}>
                     {type === 'image' ? (
                       <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                         <img src={item.generatedImageUrl} className="w-full h-full object-cover" />
                       </div>
                     ) : (
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.mode === 'ultra' ? 'bg-pink-500/10 text-pink-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {item.mode === 'ultra' ? <Sparkles className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                       </div>
                     )}
                     <div className="overflow-hidden">
                        <p className="text-[11px] text-white font-bold truncate">{item.idea}</p>
                        <p className="text-[9px] text-gray-600 font-medium">{item.createdAt?.toDate?.() ? item.createdAt.toDate().toLocaleDateString() : '...'}</p>
                     </div>
                  </div>
                 );
              })}
              {recentHistory.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                    <MessageSquare className="w-8 h-8 mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-widest font-mono">Aucun historique</p>
                 </div>
              )}
           </div>
           <button onClick={() => navigate('/dashboard/history')} className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">
              Tout voir <ChevronRight className="w-3 h-3" />
           </button>
        </div>
      </div>
    </div>
  );
}
