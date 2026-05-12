import React, { useState } from 'react';
import { Bell, X, Check, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/5"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-[#0a0a0b]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Bell className="w-3 h-3 text-violet-500" /> Notifications
                </h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Tout lire
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium tracking-tight">Aucune notification pour le moment.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => !notif.read && markAsRead(notif.id)}
                        className={`p-4 hover:bg-white/[0.03] transition-colors cursor-pointer group relative ${!notif.read ? 'bg-violet-600/[0.02]' : ''}`}
                      >
                        {!notif.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-600" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-violet-500' : 'bg-gray-700'}`} />
                          <div className="flex-1">
                            <p className={`text-xs font-bold leading-tight mb-1 ${!notif.read ? 'text-white' : 'text-gray-400'}`}>
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-gray-500 line-clamp-3 font-medium">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-gray-600 font-bold uppercase mt-2 block">
                              {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Maintenant'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-white/[0.01] border-t border-white/5 text-center">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-gray-400"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
