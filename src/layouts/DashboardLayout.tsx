import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function DashboardLayout() {
  const { profile } = useAuth();

  if (profile?.isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] text-white p-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Compte bloqué</h1>
          <p className="text-gray-400 mb-6">Votre compte a été suspendu par un administrateur.</p>
          <button 
             onClick={() => window.location.href = "https://wa.me/221706113645"}
             className="px-6 py-2 bg-white text-black font-semibold rounded-full"
          >
            Contacter le support
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </div>
    </main>
  );
}
