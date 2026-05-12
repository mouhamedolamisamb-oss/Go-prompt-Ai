import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, onSnapshot, doc, updateDoc, increment, deleteDoc, 
  getDoc, getDocs, where, limit, orderBy, serverTimestamp, setDoc, addDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Minus, Ban, Trash2, Home, Users, BarChart3, Loader2, 
  ShieldCheck, Mail, User as UserIcon, LayoutDashboard, History as HistoryIcon,
  Zap, ImageIcon, Settings, LogOut, Bell, Coins, X, ChevronRight,
  TrendingUp, AlertCircle, CheckCircle2, MessageSquare, CreditCard
} from 'lucide-react';

// --- Types ---
interface UserProfile {
  id: string;
  email: string;
  name: string;
  isBlocked: boolean;
  isAdmin: boolean;
  createdAt: any;
  promptCredits?: number;
  imageCredits?: number;
  currentPlan?: string;
  planLevel?: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  trend?: string;
  color: string;
}

// --- Constants ---
const PLAN_MAPPING = {
  'starter': { level: 1, promptCredits: 75, imageCredits: 10 },
  'basic': { level: 2, promptCredits: 200, imageCredits: 30 },
  'pro': { level: 3, promptCredits: 1200, imageCredits: 150 },
  'expert': { level: 4, promptCredits: 2500, imageCredits: 350 },
  'ultimate': { level: 5, promptCredits: 3500, imageCredits: 500 }
};

// --- Components ---
const TransactionLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });
  }, []);

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest px-6 py-4">
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Utilisateur</th>
            <th className="px-6 py-4">Plan</th>
            <th className="px-6 py-4">Prompts +</th>
            <th className="px-6 py-4">Images +</th>
            <th className="px-6 py-4">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-xs">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-white/[0.02]">
              <td className="px-6 py-3 text-gray-500 font-mono">{log.createdAt?.toDate().toLocaleString()}</td>
              <td className="px-6 py-3 text-white font-bold">{log.userEmail}</td>
              <td className="px-6 py-3">
                 <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 font-black uppercase text-[8px]">{log.planName}</span>
              </td>
              <td className="px-6 py-3 text-blue-500 font-black">+{log.promptCreditsAdded}</td>
              <td className="px-6 py-3 text-pink-500 font-black">+{log.imageCreditsAdded}</td>
              <td className="px-6 py-3">
                 <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[8px] font-black uppercase">Traité</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const HistoryList = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'history'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'history');
    });
  }, []);

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></div>;

  return (
    <>
      <div className="lg:hidden space-y-4 p-4">
        {history.map(item => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-gray-600">{item.userId?.substring(0, 12)}...</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.mode === 'ultra' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}`}>
                   {item.mode}
                </span>
             </div>
             <p className="text-sm text-gray-300 line-clamp-2">{item.idea}</p>
             <div className="text-[10px] text-gray-600">
                {item.createdAt?.toDate().toLocaleString()}
             </div>
          </div>
        ))}
        {history.length === 0 && <div className="text-center py-8 text-gray-600 italic">Vide</div>}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest px-6 py-4">
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Mode</th>
              <th className="px-6 py-4">Idée Originale</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {history.map(item => (
              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{item.userId?.substring(0, 8)}...</td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.mode === 'ultra' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}`}>
                     {item.mode}
                   </span>
                </td>
                <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{item.idea}</td>
                <td className="px-6 py-4 text-gray-600 text-xs">
                   {item.createdAt?.toDate().toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && (
          <div className="p-12 text-center text-gray-600 font-bold uppercase text-xs">Aucun historique disponible</div>
        )}
      </div>
    </>
  );
};

const StatCard = ({ label, value, icon: Icon, trend, color }: StatCardProps) => (
  <div className="bg-[#0f0f15] border border-white/5 p-6 rounded-2xl shadow-xl">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> {trend}
        </span>
      )}
    </div>
    <div className="text-3xl font-black text-white mb-1">{value}</div>
    <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">{label}</div>
  </div>
);

import AdminPlanManager from './AdminPlanManager';
import { activatePlan } from '../../lib/planService';

// ... (existing codes)

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'history' | 'stats' | 'recharge' | 'config' | 'plans'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkAmount, setBulkAmount] = useState<string>('');
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState('');
  const [isMassCreditOpen, setIsMassCreditOpen] = useState(false);
  const [globalStats, setGlobalStats] = useState({
    totalUsers: 0,
    totalPrompts: 0,
    totalImages: 0,
    creditsConsummed: 0
  });

  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [globalConfig, setGlobalConfig] = useState<any>({
    allowSignups: true,
    bannerText: '',
    maintenanceMode: false,
    signupBonusPrompts: 5,
    signupBonusImages: 2
  });

  // Load Data
  useEffect(() => {
    // Config listener
    const unsubConfig = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) setGlobalConfig(docSnap.data());
    });

    const unsubProfiles = onSnapshot(collection(db, 'profiles'), async (snap) => {
      const usersData = await Promise.all(snap.docs.map(async (d) => {
        const profile = d.data();
        const creditDoc = await getDoc(doc(db, 'credits', d.id));
        const credits = creditDoc.exists() ? creditDoc.data() : { promptCredits: 0, imageCredits: 0 };
        return { 
          id: d.id, 
          ...profile, 
          ...credits,
          currentPlan: profile.currentPlan || 'free',
          planLevel: profile.planLevel || 0
        } as UserProfile;
      }));
      setUsers(usersData);
      setGlobalStats(prev => ({ ...prev, totalUsers: usersData.length }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'profiles');
    });

    // Fetch stats
    getDocs(collection(db, 'history')).then(snap => {
      setGlobalStats(prev => ({ ...prev, totalPrompts: snap.size }));
    });
    
    // Total Credits Distributed (Sum of all transactions)
    getDocs(query(collection(db, 'transactions'))).then(snap => {
      let total = 0;
      snap.forEach(doc => {
        total += (doc.data().promptCreditsAdded || 0);
      });
      setGlobalStats(prev => ({ ...prev, creditsConsummed: total }));
    });

    return () => {
      unsubConfig();
      unsubProfiles();
    };
  }, []);

  const updateGlobalConfig = async (newConfig: any) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { ...globalConfig, ...newConfig });
      alert('Configuration mise à jour !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour.');
    }
  };

  const handleAssignPlan = async (userId: string, userEmail: string, planId: string) => {
    if (!window.confirm(`Assigner le plan ${planId.toUpperCase()} à ${userEmail} ?`)) return;

    try {
      await activatePlan(userId, planId);
      alert(`Succès : ${planId.toUpperCase()} activé pour ${userEmail}.`);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'assignation du plan.');
    }
  };

  const adjustCredits = async (userId: string, type: 'prompt' | 'image', amount: number) => {
    const field = type === 'prompt' ? 'promptCredits' : 'imageCredits';
    try {
      await updateDoc(doc(db, 'credits', userId), {
        [field]: increment(amount),
        updatedAt: serverTimestamp()
      });
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, [field]: (prev[field] || 0) + amount } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBlock = async (u: UserProfile) => {
    if (window.confirm(`Voulez-vous vraiment ${u.isBlocked ? 'débloquer' : 'bloquer'} ${u.email} ?`)) {
      try {
        await updateDoc(doc(db, 'profiles', u.id), { isBlocked: !u.isBlocked });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const deleteUserAccount = async (u: UserProfile) => {
    const confirm = window.prompt(`Pour supprimer définitivement ${u.email}, retapez son adresse email :`);
    if (confirm === u.email) {
      try {
        await deleteDoc(doc(db, 'profiles', u.id));
        await deleteDoc(doc(db, 'credits', u.id));
        alert('Compte supprimé avec succès.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUserIds.size === 0) return;
    
    if (action === 'delete' && bulkConfirmText !== 'CONFIRMER') {
      alert('Veuillez saisir "CONFIRMER" pour supprimer.');
      return;
    }

    if (action === 'block' && !window.confirm(`Bloquer ${selectedUserIds.size} utilisateurs ?`)) return;

    setIsBulkActionLoading(true);
    const amountNum = parseInt(bulkAmount) || 0;
    const ids = Array.from(selectedUserIds);

    try {
      const promises = ids.map(async (id) => {
        if (action === 'add_prompt') {
          return updateDoc(doc(db, 'credits', id), { promptCredits: increment(amountNum), updatedAt: serverTimestamp() });
        }
        if (action === 'remove_prompt') {
          return updateDoc(doc(db, 'credits', id), { 
            promptCredits: increment(-Math.abs(amountNum)), 
            updatedAt: serverTimestamp() 
          });
        }
        if (action === 'add_image') {
          return updateDoc(doc(db, 'credits', id), { imageCredits: increment(amountNum), updatedAt: serverTimestamp() });
        }
        if (action === 'remove_image') {
          return updateDoc(doc(db, 'credits', id), { 
            imageCredits: increment(-Math.abs(amountNum)), 
            updatedAt: serverTimestamp() 
          });
        }
        if (action.startsWith('assign_plan:')) {
          const planId = action.split(':')[1];
          return activatePlan(id, planId);
        }
        if (action === 'block') {
          return updateDoc(doc(db, 'profiles', id), { isBlocked: true });
        }
        if (action === 'unblock') {
          return updateDoc(doc(db, 'profiles', id), { isBlocked: false });
        }
        if (action === 'delete') {
          await deleteDoc(doc(db, 'profiles', id));
          return deleteDoc(doc(db, 'credits', id));
        }
      });

      await Promise.all(promises);
      alert('Action groupée terminée !');
      setSelectedUserIds(new Set());
      setBulkAmount('');
      setBulkConfirmText('');
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors de l\'action groupée.');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleSelectUser = (id: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUserIds(newSelected);
  };

  const giveEveryOneCredits = async (prompts: number, images: number) => {
    if (window.confirm(`Distribuer ${prompts} prompts et ${images} images à TOUS les utilisateurs ?`)) {
       try {
         const batchPromises = users.map(u => 
           updateDoc(doc(db, 'credits', u.id), {
             promptCredits: increment(prompts),
             imageCredits: increment(images),
             updatedAt: serverTimestamp()
           })
         );
         await Promise.all(batchPromises);
         alert('Distribution terminée !');
         setIsMassCreditOpen(false);
       } catch (err) {
         console.error(err);
       }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email?.toLowerCase().includes(search.toLowerCase()) || 
                         u.name?.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = filterPlan === 'all' || u.currentPlan === filterPlan;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'blocked' ? u.isBlocked : !u.isBlocked);
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const [selectedUserHistory, setSelectedUserHistory] = useState<any[]>([]);
  const [loadingUserHistory, setLoadingUserHistory] = useState(false);

  useEffect(() => {
    if (isDrawerOpen && selectedUser) {
      setLoadingUserHistory(true);
      const q = query(collection(db, 'history'), where('userId', '==', selectedUser.id), orderBy('createdAt', 'desc'), limit(10));
      getDocs(q).then(snap => {
        setSelectedUserHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingUserHistory(false);
      });
    }
  }, [isDrawerOpen, selectedUser]);

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        message: broadcastMessage,
        type: 'global',
        createdAt: serverTimestamp()
      });
      alert('Notification envoyée à tous les utilisateurs !');
      setBroadcastMessage('');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'envoi.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#050508] flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">Backoffice Loading...</div>
    </div>
  );

  return (
    <div className="h-screen bg-[#050508] text-gray-300 font-sans flex overflow-hidden relative">
      {/* Sidebar Mobile Toggle Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a0a0f] border-r border-white/5 flex flex-col transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">G</div>
            <span className="text-white font-black text-xl italic tracking-tighter">ADMIN<span className="text-blue-600">PRO</span></span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-500 uppercase tracking-tighter">
            <ShieldCheck className="w-2.5 h-2.5" /> Security Hardened
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'plans', label: '📋 Gérer les Plans', icon: CreditCard },
            { id: 'recharge', label: 'Journal Recharges', icon: HistoryIcon },
            { id: 'history', label: 'Audit Prompts', icon: MessageSquare },
            { id: 'config', label: 'Paramètres', icon: Settings },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" /> Quitter l'admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto bg-[#0a0a0f] relative w-full">
        <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 p-4 lg:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/10"
            >
              <LayoutDashboard className="w-5 h-5 text-blue-500" />
            </button>
            <h2 className="text-lg font-black text-white uppercase tracking-widest">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
             <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} className="w-6 h-6 rounded-full" />
               <span className="text-[10px] font-bold text-white uppercase">{user?.email?.split('@')[0]}</span>
             </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Utilisateurs" value={globalStats.totalUsers} icon={Users} trend="+5%" color="text-blue-500" />
                <StatCard label="Prompts" value={globalStats.totalPrompts} icon={MessageSquare} trend="+12%" color="text-amber-500" />
                <StatCard label="Images" value={globalStats.totalImages} icon={ImageIcon} color="text-pink-500" />
                <StatCard label="Crédits Distribués" value={globalStats.creditsConsummed} icon={Coins} color="text-violet-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#0f0f15] border border-white/5 p-6 lg:p-8 rounded-3xl">
                   <h3 className="text-lg font-bold text-white mb-6">Inscriptions Récentes</h3>
                   <div className="space-y-4">
                     {users.slice(0, 5).map(u => (
                       <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center font-bold text-blue-500 uppercase">{u.name?.[0] || 'U'}</div>
                           <div className="overflow-hidden">
                             <div className="text-sm font-bold text-white truncate">{u.name}</div>
                             <div className="text-[10px] text-gray-600 truncate">{u.email}</div>
                           </div>
                         </div>
                         <ChevronRight className="w-4 h-4 text-gray-700 flex-shrink-0" />
                       </div>
                     ))}
                   </div>
                </div>
                <div className="bg-[#0f0f15] border border-white/5 p-6 lg:p-8 rounded-3xl flex flex-col justify-center">
                   <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                     <Bell className="w-6 h-6 text-blue-500" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2 italic underline decoration-blue-600">Alerte Générale</h3>
                   <p className="text-gray-500 text-sm mb-6">Diffusez un message spécial à tous vos utilisateurs.</p>
                   <textarea 
                     className="w-full bg-[#050508] border border-white/10 rounded-xl p-4 text-sm text-white mb-4 h-24 resize-none"
                     placeholder="Tapez votre message ici..."
                     value={broadcastMessage}
                     onChange={(e) => setBroadcastMessage(e.target.value)}
                   />
                   <button 
                     onClick={handleSendBroadcast}
                     disabled={isBroadcasting || !broadcastMessage.trim()}
                     className="w-full lg:w-fit px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-xs"
                   >
                     {isBroadcasting ? 'Envoi...' : 'ENVOYER L\'ALERTE'}
                   </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plans' && <AdminPlanManager />}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <AnimatePresence>
                {selectedUserIds.size > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="sticky top-24 z-30 bg-violet-600/10 border border-violet-500/60 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(139,92,246,0.2)] mb-8"
                  >
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-violet-600 text-white px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2">
                           <CheckCircle2 className="w-4 h-4" /> {selectedUserIds.size} utilisateurs sélectionnés
                        </div>
                        <button onClick={() => setSelectedUserIds(new Set())} className="text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                           <X className="w-4 h-4" /> Annuler
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        {/* Plan Selection */}
                        <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5">
                           <ShieldCheck className="w-4 h-4 text-violet-500 ml-2" />
                           <select 
                             className="bg-transparent text-white font-black text-xs uppercase focus:outline-none"
                             onChange={(e) => handleBulkAction(`assign_plan:${e.target.value}`)}
                           >
                              <option value="">Assigner plan...</option>
                              <option value="starter">Starter</option>
                              <option value="basic">Basic</option>
                              <option value="pro">Pro</option>
                              <option value="expert">Expert</option>
                              <option value="ultimate">Ultimate</option>
                           </select>
                        </div>

                        {/* Prompt Credits */}
                        <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5">
                           <MessageSquare className="w-4 h-4 text-blue-500 ml-2" />
                           <input 
                             type="number" 
                             placeholder="0"
                             className="w-20 bg-transparent text-white font-black text-center focus:outline-none"
                             value={bulkAmount}
                             onChange={(e) => setBulkAmount(e.target.value)}
                           />
                           <button 
                             onClick={() => handleBulkAction('add_prompt')}
                             disabled={isBulkActionLoading}
                             className="px-4 py-2 bg-[#10b981] text-white rounded-xl text-[10px] font-black uppercase shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all"
                           >
                              Ajouter
                           </button>
                           <button 
                             onClick={() => handleBulkAction('remove_prompt')}
                             disabled={isBulkActionLoading}
                             className="px-4 py-2 bg-[#ef4444] text-white rounded-xl text-[10px] font-black uppercase shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:scale-105 active:scale-95 transition-all"
                           >
                              Retirer
                           </button>
                        </div>

                        {/* Image Credits (Same input) */}
                        <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5">
                           <ImageIcon className="w-4 h-4 text-pink-500 ml-2" />
                           <button 
                             onClick={() => handleBulkAction('add_image')}
                             disabled={isBulkActionLoading}
                             className="px-4 py-2 bg-[#10b981] text-white rounded-xl text-[10px] font-black uppercase shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all"
                           >
                              Ajouter
                           </button>
                           <button 
                             onClick={() => handleBulkAction('remove_image')}
                             disabled={isBulkActionLoading}
                             className="px-4 py-2 bg-[#ef4444] text-white rounded-xl text-[10px] font-black uppercase shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:scale-105 active:scale-95 transition-all"
                           >
                              Retirer
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Autres actions :</span>
                          <button 
                            onClick={() => handleBulkAction('block')}
                            disabled={isBulkActionLoading}
                            className="px-4 py-2 bg-orange-500/10 text-orange-500 border border-orange-500/40 rounded-xl text-[10px] font-black uppercase hover:bg-orange-500 hover:text-white transition-all"
                          >
                             Bloquer tous
                          </button>
                          <button 
                            onClick={() => handleBulkAction('unblock')}
                            disabled={isBulkActionLoading}
                            className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/40 rounded-xl text-[10px] font-black uppercase hover:bg-green-500 hover:text-white transition-all"
                          >
                             Débloquer tous
                          </button>
                       </div>

                       <div className="flex items-center gap-3">
                          <input 
                            type="text" 
                            placeholder="Taper CONFIRMER"
                            className="bg-red-500/5 border border-red-500/20 px-4 py-2 rounded-xl text-[10px] text-white placeholder:text-red-500/40"
                            value={bulkConfirmText}
                            onChange={(e) => setBulkConfirmText(e.target.value)}
                          />
                          <button 
                            onClick={() => handleBulkAction('delete')}
                            disabled={isBulkActionLoading || bulkConfirmText !== 'CONFIRMER'}
                            className="px-6 py-2 bg-red-600/20 text-red-600 border border-red-500 animate-pulse rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all disabled:opacity-20"
                          >
                             Supprimer définitivement
                          </button>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col lg:flex-row gap-4 items-center bg-[#0f0f15] p-6 rounded-3xl border border-white/5">
                <div className="relative flex-grow">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                   <input 
                     type="text"
                     placeholder="Rechercher utilisateur..."
                     className="w-full bg-[#050508] border border-white/10 px-12 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-blue-600 transition-all font-bold placeholder:text-gray-700"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                   <select 
                     value={filterPlan}
                     onChange={(e) => setFilterPlan(e.target.value)}
                     className="flex-1 lg:flex-none bg-[#050508] border border-white/10 px-4 py-3 rounded-xl text-xs font-black uppercase text-gray-500 focus:outline-none focus:border-blue-600 transition-all"
                   >
                      <option value="all">Tous les Plans</option>
                      <option value="starter">Starter</option>
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="expert">Expert</option>
                      <option value="ultimate">Ultimate</option>
                   </select>

                   <select 
                     value={filterStatus}
                     onChange={(e) => setFilterStatus(e.target.value)}
                     className="flex-1 lg:flex-none bg-[#050508] border border-white/10 px-4 py-3 rounded-xl text-xs font-black uppercase text-gray-500 focus:outline-none focus:border-blue-600 transition-all"
                   >
                      <option value="all">Tous Statuts</option>
                      <option value="active">Actif</option>
                      <option value="blocked">Bloqué</option>
                   </select>

                   <button 
                     onClick={() => setIsMassCreditOpen(true)}
                     className="flex-1 lg:flex-none px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-blue-500 uppercase tracking-widest hover:bg-white/10 transition-all whitespace-nowrap"
                   >
                     Cadeau de groupe
                   </button>
                </div>
              </div>

              {/* Responsive Users Display */}
              <div className="lg:hidden space-y-4">
                {filteredUsers.map(u => (
                  <div key={u.id} className="bg-[#0f0f15] p-6 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center font-bold text-indigo-500 uppercase text-xl">
                        {u.name?.[0] || 'U'}
                      </div>
                      <div className="overflow-hidden">
                         <div className="text-white font-bold truncate">{u.name}</div>
                         <div className="text-[10px] uppercase font-mono text-gray-600 truncate">{u.email}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                      <div className="text-center">
                        <div className="text-lg font-black text-blue-500">{u.promptCredits ?? 0}</div>
                        <div className="text-[8px] font-bold text-gray-700 uppercase">Prompts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-black text-pink-500">{u.imageCredits ?? 0}</div>
                        <div className="text-[8px] font-bold text-gray-700 uppercase">Images</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                       <button onClick={() => { setSelectedUser(u); setIsDrawerOpen(true); }} className="flex-1 bg-blue-600/10 text-blue-500 py-3 rounded-xl font-bold text-xs uppercase">Gérer</button>
                       <button onClick={() => toggleBlock(u)} className={`flex-1 ${u.isBlocked ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} py-3 rounded-xl font-bold text-xs uppercase`}>
                         {u.isBlocked ? 'Débloquer' : 'Bloquer'}
                       </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block bg-[#0f0f15] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 text-[9px] font-black text-gray-600 uppercase tracking-widest px-6 py-5">
                      <th className="px-6 py-5 w-12">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-600"
                          checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-5">Utilisateur</th>
                      <th className="px-6 py-5">Crédits (Prompts/Images)</th>
                      <th className="px-6 py-5">Plan</th>
                      <th className="px-6 py-5">Statut</th>
                      <th className="px-6 py-5">Inscrit le</th>
                      <th className="px-6 py-5 text-right">Actions rapides</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className={`hover:bg-white/[0.02] transition-colors group ${selectedUserIds.has(u.id) ? 'bg-blue-600/5' : ''}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-600"
                            checked={selectedUserIds.has(u.id)}
                            onChange={() => toggleSelectUser(u.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center font-bold text-indigo-500 uppercase">
                              {u.name?.[0] || 'U'}
                            </div>
                            <div>
                               <div className="text-sm font-bold text-white group-hover:text-blue-500 transition-colors">{u.name}</div>
                               <div className="text-xs text-gray-600 font-mono italic">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 font-mono text-xs">
                             <div className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded font-bold">{u.promptCredits ?? 0} P</div>
                             <div className="bg-pink-500/10 text-pink-500 px-2 py-1 rounded font-bold">{u.imageCredits ?? 0} I</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={u.currentPlan || 'free'}
                            onChange={(e) => handleAssignPlan(u.id, u.email, e.target.value)}
                            className={`bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] uppercase font-black tracking-widest ${
                              u.currentPlan === 'ultimate' ? 'text-violet-400' : 
                              u.currentPlan === 'expert' ? 'text-sky-400' : 
                              u.currentPlan === 'pro' ? 'text-amber-400' : 'text-gray-400'
                            }`}
                          >
                            <option value="free">Gratuit</option>
                            <option value="starter">Starter</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                            <option value="expert">Expert</option>
                            <option value="ultimate">Ultimate</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${u.isBlocked ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-green-500/20 text-green-500 border border-green-500/20'}`}>
                            {u.isBlocked ? 'BLOQUÉ' : 'ACTIF'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {u.createdAt?.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <button
                               onClick={() => { setSelectedUser(u); setIsDrawerOpen(true); }}
                               className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all transform active:scale-90"
                               title="Gérer crédits"
                             >
                               <Coins className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => toggleBlock(u)}
                               className={`p-2 rounded-lg transition-all transform active:scale-90 ${u.isBlocked ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}
                               title={u.isBlocked ? 'Débloquer' : 'Bloquer'}
                             >
                               <Ban className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => deleteUserAccount(u)}
                               className="p-2 bg-gray-500/10 text-gray-500 rounded-lg hover:bg-red-600 hover:text-white transition-all transform active:scale-90"
                               title="Supprimer"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'recharge' && (
            <div className="space-y-6">
               <div className="bg-[#0f0f15] p-6 lg:p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tight">Journal des Recharges</h3>
                    <p className="text-gray-500 text-xs italic">Historique des plans assignés manuellement.</p>
                  </div>
               </div>
               
               <div className="bg-[#0f0f15] rounded-3xl border border-white/5 overflow-hidden overflow-x-auto shadow-2xl">
                 <TransactionLogs />
               </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="max-w-4xl space-y-8">
               <div className="bg-[#0f0f15] p-8 rounded-3xl border border-white/5 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Paramètres Système</h3>
                      <p className="text-gray-500 text-sm">Contrôle critique des fonctionnalités de la plateforme.</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${globalConfig.maintenanceMode ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-green-500/10 text-green-500'}`}>
                       {globalConfig.maintenanceMode ? 'Maintenance Active' : 'Système OK'}
                    </div>
                  </div>
 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                    {/* Inscriptions */}
                    <div className="space-y-4">
                       <h4 className="text-xs font-black uppercase text-gray-500 tracking-[0.2em]">Inscriptions & Bonus</h4>
                       <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <span className="text-sm font-bold text-white">Autoriser les inscriptions</span>
                          <button 
                            onClick={() => updateGlobalConfig({ allowSignups: !globalConfig.allowSignups })}
                            className={`w-12 h-6 rounded-full transition-all relative ${globalConfig.allowSignups ? 'bg-blue-600' : 'bg-gray-700'}`}
                          >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${globalConfig.allowSignups ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                           <div className="text-[8px] font-bold text-gray-700 uppercase mb-2">Bonus Prompt</div>
                           <input 
                             type="number"
                             className="w-full bg-transparent text-xl font-black text-white focus:outline-none"
                             value={isNaN(globalConfig.signupBonusPrompts) ? '' : globalConfig.signupBonusPrompts}
                             onChange={(e) => {
                               const val = e.target.value === '' ? NaN : parseInt(e.target.value);
                               setGlobalConfig({...globalConfig, signupBonusPrompts: val});
                             }}
                             onBlur={() => {
                               if (!isNaN(globalConfig.signupBonusPrompts)) {
                                 updateGlobalConfig({ signupBonusPrompts: globalConfig.signupBonusPrompts });
                               }
                             }}
                           />
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                           <div className="text-[8px] font-bold text-gray-700 uppercase mb-2">Bonus Image</div>
                           <input 
                             type="number"
                             className="w-full bg-transparent text-xl font-black text-white focus:outline-none"
                             value={isNaN(globalConfig.signupBonusImages) ? '' : globalConfig.signupBonusImages}
                             onChange={(e) => {
                               const val = e.target.value === '' ? NaN : parseInt(e.target.value);
                               setGlobalConfig({...globalConfig, signupBonusImages: val});
                             }}
                             onBlur={() => {
                               if (!isNaN(globalConfig.signupBonusImages)) {
                                 updateGlobalConfig({ signupBonusImages: globalConfig.signupBonusImages });
                               }
                             }}
                           />
                        </div>
                     </div>
                    </div>
 
                    {/* Communication */}
                    <div className="space-y-4">
                       <h4 className="text-xs font-black uppercase text-gray-500 tracking-[0.2em]">Communication</h4>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-700 uppercase">Texte de la bannière (Optionnel)</label>
                          <input 
                            type="text"
                            placeholder="Ex: -50% sur le plan PRO aujourd'hui !"
                            className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-white focus:border-blue-600 transition-all font-bold placeholder:text-gray-800"
                            value={globalConfig.bannerText}
                            onChange={(e) => setGlobalConfig({...globalConfig, bannerText: e.target.value})}
                            onBlur={() => updateGlobalConfig({ bannerText: globalConfig.bannerText })}
                          />
                       </div>
                       <div className="p-4 bg-violet-600/10 border border-violet-600/20 rounded-2xl">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-sm font-bold text-violet-500 uppercase tracking-tighter">Gemini API Status</span>
                             <div className="px-2 py-0.5 bg-violet-500 text-white text-[8px] font-black rounded-full uppercase">Operational</div>
                          </div>
                       </div>
                    </div>
                  </div>
 
                  <div className="pt-8 border-t border-white/5 space-y-6">
                    <h4 className="text-xs font-black uppercase text-gray-500 tracking-[0.2em]">Commandes Critiques</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <button 
                         onClick={() => {
                           if(window.confirm(`Passer le site en mode maintenance ?`)) {
                             updateGlobalConfig({ maintenanceMode: !globalConfig.maintenanceMode });
                           }
                         }}
                         className={`flex items-center gap-3 p-6 rounded-2xl transition-all group border ${globalConfig.maintenanceMode ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-red-600/5 hover:bg-red-600/10 border-red-600/10 text-white'}`}
                       >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${globalConfig.maintenanceMode ? 'bg-red-500 text-white' : 'bg-red-600/20 text-red-600'}`}>
                             <Ban className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                             <div className="text-sm font-bold italic">{globalConfig.maintenanceMode ? 'Désactiver Maintenance' : 'Mode Maintenance'}</div>
                             <div className="text-[10px] text-gray-600">Bloquer l'accès public</div>
                          </div>
                       </button>
                       <button className="flex items-center gap-3 p-6 bg-amber-600/5 hover:bg-amber-600/10 border border-amber-600/10 rounded-2xl transition-all group">
                          <div className="w-10 h-10 bg-amber-600/20 rounded-full flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform"><LayoutDashboard className="w-5 h-5" /></div>
                          <div className="text-left">
                             <div className="text-sm font-bold text-white italic">Clear Cache</div>
                             <div className="text-[10px] text-gray-600">Réinitialiser les sessions serveurs</div>
                          </div>
                       </button>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Drawer: Credit Management */}
      <AnimatePresence>
        {isDrawerOpen && selectedUser && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsDrawerOpen(false)}
               className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-[#0a0a0f] border-l border-white/5 shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Coins className="w-6 h-6 text-blue-500" /> Gestion des Crédits
                </h3>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 mb-8">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white uppercase text-xl">
                     {selectedUser.name?.[0]}
                   </div>
                   <div>
                     <div className="text-white font-bold">{selectedUser.name}</div>
                     <div className="text-xs text-gray-600">{selectedUser.email}</div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                   <div className="text-center">
                      <div className="text-2xl font-black text-blue-500">{selectedUser.promptCredits ?? 0}</div>
                      <div className="text-[10px] uppercase font-bold text-gray-600">Prompts</div>
                   </div>
                   <div className="text-center">
                      <div className="text-2xl font-black text-pink-500">{selectedUser.imageCredits ?? 0}</div>
                      <div className="text-[10px] uppercase font-bold text-gray-600">Images</div>
                   </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                   <h4 className="text-[10px] uppercase font-black text-violet-500 tracking-[0.2em] mb-4">Historique Récent</h4>
                   <div className="space-y-3">
                      {loadingUserHistory ? (
                        <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-500" /></div>
                      ) : selectedUserHistory.length === 0 ? (
                        <div className="text-[10px] text-gray-600 italic text-center py-4">Aucune activité récente</div>
                      ) : (
                        selectedUserHistory.map(h => (
                          <div key={h.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                             <div className="flex justify-between items-center mb-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${h.mode === 'ultra' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}`}>{h.mode}</span>
                                <span className="text-[8px] text-gray-600 font-mono">{h.createdAt?.toDate().toLocaleString()}</span>
                             </div>
                             <p className="text-[11px] text-gray-400 line-clamp-2 italic">"{h.idea}"</p>
                          </div>
                        ))
                      )}
                   </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Ajuster Crédits Prompts</h4>
                  <div className="flex gap-2">
                     <button onClick={() => adjustCredits(selectedUser.id, 'prompt', 100)} className="flex-1 py-3 bg-green-500/10 text-green-500 rounded-xl font-bold border border-green-500/20 active:scale-95 transition-all">+100</button>
                     <button onClick={() => adjustCredits(selectedUser.id, 'prompt', -100)} className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold border border-red-500/20 active:scale-95 transition-all">-100</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Ajuster Crédits Images</h4>
                  <div className="flex gap-2">
                     <button onClick={() => adjustCredits(selectedUser.id, 'image', 10)} className="flex-1 py-3 bg-green-500/10 text-green-500 rounded-xl font-bold border border-green-500/20 active:scale-95 transition-all">+10</button>
                     <button onClick={() => adjustCredits(selectedUser.id, 'image', -10)} className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold border border-red-500/20 active:scale-95 transition-all">-10</button>
                  </div>
                </div>
                
                <div className="pt-8 border-t border-white/5">
                   <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-4">Actions de Sécurité</h4>
                   <button 
                     onClick={() => toggleBlock(selectedUser)}
                     className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedUser.isBlocked ? 'bg-green-500 text-white' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white'}`}
                   >
                     <Ban className="w-4 h-4" /> {selectedUser.isBlocked ? 'Débloquer le compte' : 'Bloquer le compte'}
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mass Credit Modal */}
      <AnimatePresence>
        {isMassCreditOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsMassCreditOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
               className="relative bg-[#0a0a0f] border border-white/10 w-full max-w-md p-8 rounded-3xl shadow-2xl"
             >
                <h3 className="text-xl font-black text-white mb-2">Distribution en Masse</h3>
                <p className="text-gray-500 text-sm mb-8">Ajoutez des crédits à TOUS les utilisateurs actifs ({users.length}).</p>
                
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => giveEveryOneCredits(100, 10)} className="p-6 bg-blue-600/10 border border-blue-600/20 rounded-2xl text-center group hover:bg-blue-600 transition-all">
                         <div className="text-2xl font-black text-blue-500 group-hover:text-white">+100 P</div>
                         <div className="text-[10px] font-bold text-gray-600 group-hover:text-white/70 uppercase">Cadeau Bronze</div>
                      </button>
                      <button onClick={() => giveEveryOneCredits(500, 50)} className="p-6 bg-amber-600/10 border border-amber-600/20 rounded-2xl text-center group hover:bg-amber-600 transition-all">
                         <div className="text-2xl font-black text-amber-500 group-hover:text-white">+500 P</div>
                         <div className="text-[10px] font-bold text-gray-600 group-hover:text-white/70 uppercase">Cadeau Gold</div>
                      </button>
                   </div>
                   <button onClick={() => setIsMassCreditOpen(false)} className="w-full py-4 text-gray-500 font-bold hover:text-white transition-all uppercase tracking-widest text-xs">Annuler</button>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
