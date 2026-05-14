import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Ban } from 'lucide-react';
import { useEffect } from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import History from './pages/dashboard/History';
import Settings from './pages/dashboard/Settings';
import Recharge from './pages/dashboard/Recharge';
import AdminDashboard from './pages/admin/AdminDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PendingPlanManager from './components/PendingPlanManager';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" state={{ from: location }} replace />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  const superAdmins = ['mouhamedolamisamb@gmail.com', 'kondedemba210@gmail.com'];
  const isAuthorized = user && (superAdmins.includes(user.email || '') || profile?.isAdmin);

  if (!user || !isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { user, globalConfig } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    async function testConnection() {
      try {
        // Try to fetch a known document directly from server to verify connection
        await getDocFromServer(doc(db, 'settings', 'global'));
        console.log("🔥 Firestore connected successfully");
      } catch (error) {
        if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
          console.error("❌ Firestore connection failed. Please check your configuration and internet connection.");
        }
      }
    }
    testConnection();
  }, []);

  if (globalConfig?.maintenanceMode && !isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-8 text-center">
         <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
            <Ban className="w-12 h-12 text-red-600" />
         </div>
         <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter italic">Mode Maintenance</h1>
         <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
            GoPrompt est actuellement en cours de mise à jour pour vous offrir une expérience encore plus fluide. 
            Revenez dans quelques instants !
         </p>
         <div className="mt-8 text-[10px] font-black uppercase text-gray-700 tracking-[0.5em]">System Offline</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white selection:bg-blue-500/50">
      <PendingPlanManager />
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        
        <Route path="/auth">
          <Route path="login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        </Route>

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
          <Route path="recharge" element={<Recharge />} />
        </Route>

        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!isAdminRoute && <Footer />}
    </div>
  );
}
