import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, doc, updateDoc, increment, addDoc, serverTimestamp, getDoc, setDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, User, CreditCard, ChevronRight, Clock, Shield, Check, X, AlertCircle, BarChart3, Settings as SettingsIcon, LayoutDashboard, Zap } from 'lucide-react';
import { PLANS, FEATURE_LABELS } from '../../constants/plans';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../context/NotificationContext';
import { activatePlan } from '../../lib/planService';

export default function AdminPlanManager() {
  const [activeTab, setActiveTab] = useState<'assign' | 'features' | 'overview' | 'config'>('assign');
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingPlans, setPendingPlans] = useState<any[]>([]);
  const [planConfigs, setPlanConfigs] = useState<any[]>([]);
  const [planCounts, setPlanCounts] = useState<Record<string, number>>({});
  const { addNotification } = useNotifications();

  // Load pending plans
  useEffect(() => {
    const q = query(collection(db, 'pending_plans'), where('status', '==', 'pending'), orderBy('scheduledAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setPendingPlans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Load plan configs
  useEffect(() => {
    const q = query(collection(db, 'plan_configs'));
    return onSnapshot(q, (snapshot) => {
      setPlanConfigs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Load user counts per plan for overview
  useEffect(() => {
    const loadStats = async () => {
      const q = query(collection(db, 'profiles'));
      const snapshot = await getDocs(q);
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(d => {
        const p = d.data().currentPlan || 'Gratuit';
        counts[p] = (counts[p] || 0) + 1;
      });
      setPlanCounts(counts);
    };
    if (activeTab === 'overview') {
      loadStats();
    }
  }, [activeTab]);

  const searchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    const q = query(collection(db, 'profiles'), where('email', '>=', searchEmail), where('email', '<=', searchEmail + '\uf8ff'));
    const snapshot = await getDocs(q);
    setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleAssignPlan = async (userId: string, planId: string, delay: number) => {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;

    if (delay === 0) {
      try {
        await activatePlan(userId, planId);
        alert(`Plan ${planId} activé immédiatement.`);
      } catch (err) {
        alert('Erreur lors de l\'activation.');
      }
    } else {
      const scheduledAt = new Date();
      scheduledAt.setMinutes(scheduledAt.getMinutes() + delay);

      await addDoc(collection(db, 'pending_plans'), {
        userId,
        planName: planId,
        scheduledAt: scheduledAt,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert(`Plan ${planId} programmé pour dans ${delay} minutes.`);
    }
  };

  const activatePlanNow = async (userId: string, planId: string) => {
    try {
      await activatePlan(userId, planId);
      alert(`Plan activé immédiatement.`);
    } catch (err) {
      console.error('Error activating plan:', err);
      alert('Erreur lors de l\'activation.');
    }
  };

  const toggleFeatureOverride = async (userId: string, featureName: string, currentlyEnabled: boolean) => {
    try {
      const overrideRef = doc(db, 'feature_overrides', userId);
      const overrideSnap = await getDoc(overrideRef);
      
      let features = {};
      if (overrideSnap.exists()) {
        features = overrideSnap.data().features || {};
      }
      
      const updatedFeatures = {
        ...features,
        [featureName]: !currentlyEnabled
      };

      await setDoc(overrideRef, {
        userId,
        features: updatedFeatures,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Refresh current user overrides
      if (selectedUser?.id === userId) {
        setFeatureOverridesData(updatedFeatures);
      }
    } catch (err) {
      console.error('Error overriding feature:', err);
    }
  };

  const [featureOverridesData, setFeatureOverridesData] = useState<Record<string, boolean>>({});

  const loadUserOverrides = async (userId: string) => {
    const docSnap = await getDoc(doc(db, 'feature_overrides', userId));
    if (docSnap.exists()) {
      setFeatureOverridesData(docSnap.data().features || {});
    } else {
      setFeatureOverridesData({});
    }
  };

  useEffect(() => {
    if (selectedUser) {
      loadUserOverrides(selectedUser.id);
    }
  }, [selectedUser]);

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex items-center gap-4">
         <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20 border border-violet-500/30">
            <LayoutDashboard className="w-6 h-6 text-white" />
         </div>
         <div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Plans</h1>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Gestion des abonnements et crédits</p>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl self-start overflow-x-auto max-w-full no-scrollbar">
        {[
          { id: 'assign', label: 'Assigner', icon: CreditCard },
          { id: 'features', label: 'Fonctions', icon: Shield },
          { id: 'overview', label: 'Stats', icon: BarChart3 },
          { id: 'config', label: 'Config', icon: SettingsIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/20 border border-violet-500/50' 
              : 'text-gray-600 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#0f0f15] border border-white/5 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] -z-10" />
        
        {activeTab === 'assign' && (
          <div className="space-y-10">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
              <CreditCard className="w-8 h-8 text-violet-500" /> Assigner un plan
            </h2>
            
            <form onSubmit={searchUsers} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Email de l'utilisateur..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-700 focus:outline-none focus:border-violet-500/50 transition-all font-bold text-sm shadow-inner"
                />
              </div>
              <button type="submit" className="px-8 py-4 bg-violet-600 text-white font-black rounded-2xl hover:bg-violet-700 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-violet-600/20 active:scale-95 shrink-0">
                Rechercher
              </button>
            </form>

            <div className="space-y-4">
              {users.map((u) => (
                <div 
                  key={u.id} 
                  onClick={() => setSelectedUser(u)}
                  className={`p-6 rounded-[2rem] border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    selectedUser?.id === u.id ? 'bg-violet-600/10 border-violet-500 shadow-xl' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                      <User className="w-7 h-7 text-gray-600" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-white font-black uppercase text-sm italic tracking-tighter truncate">{u.name || 'Sans nom'}</p>
                      <p className="text-gray-600 text-[10px] font-bold truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end bg-white/[0.03] sm:bg-transparent p-3 sm:p-0 rounded-xl border border-white/5 sm:border-none">
                    <p className="text-[8px] font-black text-violet-500 uppercase tracking-[0.2em] mb-1">Plan actuel</p>
                    <p className="text-white font-black uppercase text-[11px] italic">
                       {u.currentPlan || 'Gratuit'} <span className="text-gray-600 font-bold ml-1 tracking-tighter">(NV. {u.maxPlanLevel || 0})</span>
                    </p>
                  </div>
                </div>
              ))}
              {searchEmail && users.length === 0 && !selectedUser && (
                <div className="py-12 text-center opacity-30">
                  <p className="text-xs font-black uppercase tracking-widest italic">Aucun utilisateur trouvé</p>
                </div>
              )}
            </div>

            {selectedUser && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 border-t border-white/5 space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <h3 className="text-lg font-black text-white uppercase italic">Choisir le plan à assigner</h3>
                   <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 w-fit">
                      <div className="flex items-center gap-2">
                         <Clock className="w-4 h-4 text-violet-500" />
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Délai : </span>
                      </div>
                      <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                        <input 
                          id="delay-input"
                          type="number" 
                          defaultValue={0} 
                          className="w-10 bg-transparent text-white text-xs font-black focus:outline-none text-center" 
                        />
                        <span className="text-[10px] font-bold text-gray-600 uppercase">min</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        const delay = parseInt((document.getElementById('delay-input') as HTMLInputElement).value) || 0;
                        handleAssignPlan(selectedUser.id, plan.id, delay);
                      }}
                      className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all text-left flex flex-col group relative overflow-hidden active:scale-95"
                    >
                      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${plan.color} opacity-10 blur-xl -mr-8 -mt-8 group-hover:opacity-20 transition-all`} />
                      
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} mb-4 shadow-lg shadow-black/20 flex items-center justify-center`}>
                         <Zap className="w-5 h-5 text-white/50" />
                      </div>
                      
                      <p className="text-white font-black uppercase text-xs sm:text-sm mb-1 italic tracking-tighter">{plan.name}</p>
                      <p className="text-violet-500 font-black text-[10px] mb-4">{plan.price} FCFA</p>
                      
                      <div className="space-y-1.5 mt-auto bg-black/20 p-2 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between gap-2">
                           <span className="text-[8px] font-bold text-gray-500 uppercase">Prompts</span>
                           <span className="text-[10px] font-black text-blue-500">{plan.promptCredits}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                           <span className="text-[8px] font-bold text-gray-500 uppercase">Images</span>
                           <span className="text-[10px] font-black text-pink-500">{plan.imageCredits}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-8">
             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
              <Shield className="w-6 h-6 text-emerald-500" /> Gérer les fonctionnalités
            </h2>

            {!selectedUser ? (
              <div className="p-12 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl">
                <p className="text-gray-500 font-medium">Recherchez et sélectionnez un utilisateur pour gérer ses fonctionnalités.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-black uppercase text-sm">{selectedUser.name}</p>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Niveau Max: {selectedUser.maxPlanLevel || 0}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedUser(null)} className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Changer</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                    const isOverridden = featureOverridesData[key] !== undefined;
                    const isEnabledByPlan = selectedUser.maxPlanLevel >= (PLANS.find(p => p.features.includes(key))?.level || 0);
                    const isActive = isOverridden ? featureOverridesData[key] : isEnabledByPlan;

                    return (
                      <div key={key} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-white font-bold text-xs uppercase tracking-tight">{label}</p>
                            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                              {isOverridden ? 'Surchargé par Admin' : isEnabledByPlan ? 'Inclus dans le plan' : 'Verrouillé'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFeatureOverride(selectedUser.id, key, isActive)}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                          }`}
                        >
                          {isActive ? 'Désactiver' : 'Débloquer'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-amber-500" /> Vue d'ensemble des plans
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {PLANS.map((plan) => (
                <div key={plan.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{plan.name}</p>
                  <p className="text-3xl font-black text-white italic">{planCounts[plan.id] || 0}</p>
                  <p className="text-[9px] font-bold text-gray-700 uppercase mt-2">Utilisateurs</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
               <h3 className="text-lg font-black text-white uppercase italic">Plans en attente d'activation</h3>
               {pendingPlans.length === 0 ? (
                 <div className="p-8 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
                   <p className="text-gray-500 font-medium">Aucun plan en attente.</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {pendingPlans.map((p) => (
                     <div key={p.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                             <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-xs uppercase">Activation {p.planName}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">
                              Prévu pour : {p.scheduledAt?.toDate?.().toLocaleString()}
                            </p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button 
                            onClick={async () => {
                              await activatePlanNow(p.userId, p.planName);
                              await updateDoc(doc(db, 'pending_plans', p.id), { status: 'activated' });
                            }}
                            className="px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-500/20"
                          >
                            Activer maintenant
                          </button>
                          <button 
                            onClick={async () => await updateDoc(doc(db, 'pending_plans', p.id), { status: 'cancelled' })}
                            className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500/20"
                          >
                            Annuler
                          </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
              <SettingsIcon className="w-6 h-6 text-gray-400" /> Configurations des plans
            </h2>

            <div className="space-y-4">
              {PLANS.map((plan) => {
                const config = planConfigs.find(c => c.planName === plan.id);
                const isActive = config ? config.isActive : true;

                return (
                  <div key={plan.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg shadow-black/20`}>
                         <div className="w-6 h-6 rounded-full bg-black/20 backdrop-blur-sm" />
                      </div>
                      <div>
                        <p className="text-white font-black uppercase text-sm mb-0.5">{plan.name} <span className="text-violet-500">({plan.price} FCFA)</span></p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {isActive ? 'Disponible sur le site' : 'Désactivé globalement'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        await setDoc(doc(db, 'plan_configs', plan.id), {
                          planName: plan.id,
                          isActive: !isActive,
                          updatedAt: serverTimestamp()
                        }, { merge: true });
                      }}
                      className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        isActive 
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                      }`}
                    >
                      {isActive ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-amber-500/80 leading-relaxed uppercase tracking-tight">
                ℹ️ Un plan désactivé n'apparaîtra plus sur la page de recharge pour les utilisateurs. Les utilisateurs ayant déjà acheté ce plan conserveront leurs fonctionnalités.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
