import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Trash2, Calendar, Zap, Sparkles, Check, ChevronDown, ChevronUp, MessageSquare, Image as ImageIcon, Download } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'prompt' | 'image';
  idea: string;
  generatedPrompt?: string;
  generatedImageUrl?: string;
  mode?: string;
  quality?: string;
  createdAt: any;
}

export default function History() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prompt' | 'image'>('prompt');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'history'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Fallback for old records without type
        const type = data.type || (data.generatedImageUrl ? 'image' : 'prompt');
        return {
          id: doc.id,
          ...data,
          type
        };
      }) as HistoryItem[];
      setHistory(logs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'history');
    });

    return () => unsubscribe();
  }, [user]);

  const filteredHistory = history.filter(item => item.type === activeTab);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('history.confirm_delete'))) {
      try {
        await deleteDoc(doc(db, 'history', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `goprompt-history-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    try {
      const date = timestamp.toDate();
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Date inconnue';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-violet-500/20" />
        <p className="text-[10px] font-black uppercase text-gray-600 tracking-widest animate-pulse">Chargement de votre passé créatif...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
           <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Historique</h1>
           <p className="text-gray-500 text-xs font-medium">Retrouvez toutes vos créations passées.</p>
        </div>
        
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
           <button 
             onClick={() => setActiveTab('prompt')}
             className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prompt' ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/20' : 'text-gray-500 hover:text-white'}`}
           >
             <MessageSquare className="w-3.5 h-3.5" /> Prompts
           </button>
           <button 
             onClick={() => setActiveTab('image')}
             className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'image' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-gray-500 hover:text-white'}`}
           >
             <ImageIcon className="w-3.5 h-3.5" /> Images
           </button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="bg-[#0f0f15] border border-white/5 rounded-[2.5rem] p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] -z-10" />
          <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/5">
            {activeTab === 'prompt' ? <MessageSquare className="w-8 h-8 text-gray-700" /> : <ImageIcon className="w-8 h-8 text-gray-700" />}
          </div>
          <h3 className="text-white font-black uppercase italic text-lg mb-2">C'est encore vide...</h3>
          <p className="text-gray-600 text-sm max-w-xs mx-auto">Commencez à créer pour voir vos chefs-d'œuvre apparaître ici !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredHistory.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f0f15] border border-white/5 rounded-3xl overflow-hidden group hover:border-white/10 transition-all shadow-lg"
              >
                {item.type === 'prompt' ? (
                  /* Prompt Item */
                  <div className="flex flex-col">
                    <div 
                      className="p-6 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer gap-4"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${item.mode === 'ultra' ? 'bg-pink-500/10 text-pink-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {item.mode === 'ultra' ? <Sparkles className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-white font-black italic tracking-tight uppercase text-sm truncate">{item.idea}</h3>
                          <div className="flex items-center gap-3 text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] mt-1">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(item.createdAt)}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/5" />
                            <span className={item.mode === 'ultra' ? 'text-pink-500' : 'text-amber-500'}>{item.mode}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-white/5 sm:border-none pt-4 sm:pt-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(item.generatedPrompt || '', item.id); }}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all relative ${copiedId === item.id ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedId === item.id ? 'Copié' : 'Copier'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-xl text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="hidden sm:block ml-2 text-gray-700 group-hover:text-gray-500 transition-colors">
                          {expandedId === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedId === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5 bg-black/40"
                        >
                          <div className="p-8">
                             <div className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <div className="w-4 h-[1px] bg-gray-800" /> PROMPT OPTIMISÉ
                             </div>
                             <div className="p-6 bg-[#050508] border border-white/5 rounded-2xl text-xs text-gray-400 leading-relaxed font-mono whitespace-pre-wrap selection:bg-violet-500/30">
                               {item.generatedPrompt}
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Image Item */
                  <div className="p-5 flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 shadow-2xl relative group/img">
                      <img src={item.generatedImageUrl} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => downloadImage(item.generatedImageUrl || '')}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                      >
                         <Download className="w-6 h-6 text-white" />
                      </button>
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <h3 className="text-white font-black italic uppercase tracking-tight text-sm truncate mb-1">{item.idea}</h3>
                      <div className="flex items-center gap-3 text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(item.createdAt)}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/5" />
                        <span className="text-indigo-500">{item.quality || 'Standard'}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => downloadImage(item.generatedImageUrl || '')}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" /> Télécharger
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-white/5 hover:bg-red-500/20 rounded-xl text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
