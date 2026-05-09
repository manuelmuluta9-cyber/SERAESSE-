import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X, Timer, ShieldAlert, TrendingUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatarDinheiro } from '../lib/utils';

export type NotificationType = 'session_ending' | 'session_finished' | 'high_value' | 'security' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  targetId?: string;
}

interface Props {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationCenter({ notifications, onDismiss, onClearAll }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.length;

  // Sound effect and continuous alarm for finished sessions
  useEffect(() => {
    // Single beep for general notifications
    if (notifications.length > 0) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }

    // Continuous alarm for finished sessions
    let alarmInterval: any;
    const hasFinishedSessions = notifications.some(n => n.type === 'session_finished');

    if (hasFinishedSessions) {
      const playAlarm = () => {
        // High frequency alarm sound
        const alarm = new Audio('https://assets.mixkit.co/active_storage/sfx/992/992-preview.mp3');
        alarm.volume = 0.8;
        alarm.play().catch(() => {
          console.warn("Áudio bloqueado pelo navegador. Interaja com a página para ativar alertas sonoros.");
        });
      };

      playAlarm(); // Play immediately
      alarmInterval = setInterval(playAlarm, 3000); // Repeat every 3 seconds (faster)
    }

    return () => {
      if (alarmInterval) clearInterval(alarmInterval);
    };
  }, [notifications.length]);

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.type === 'session_finished' && b.type !== 'session_finished') return -1;
    if (a.type !== 'session_finished' && b.type === 'session_finished') return 1;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'session_ending': return <Timer className="text-orange-400" size={18} />;
      case 'session_finished': return <BellRing className="text-red-500" size={18} />;
      case 'high_value': return <TrendingUp className="text-emerald-400" size={18} />;
      case 'security': return <ShieldAlert className="text-red-600" size={18} />;
      default: return <Info className="text-blue-400" size={18} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-all relative flex items-center justify-center ${
          isOpen ? 'bg-gray-800 text-orange-500' : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
      >
        {unreadCount > 0 ? (
          <BellRing className="text-orange-500 animate-bounce" size={24} />
        ) : (
          <Bell className="text-gray-400" size={24} />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-gray-950 shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed top-20 right-4 w-[calc(100vw-32px)] max-w-80 bg-gray-900 border border-gray-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[110]"
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/80">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Alertas do Sistema</h3>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button onClick={onClearAll} className="text-[9px] font-black text-orange-500 hover:text-orange-400 uppercase tracking-widest">Limpar</button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 text-gray-500 hover:text-white"><X size={16}/></button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2 scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center opacity-30 gap-2">
                  <Bell className="text-gray-600" size={32} />
                  <p className="text-[10px] font-black uppercase text-gray-500">Sem notificações</p>
                </div>
              ) : (
                sortedNotifications.map(n => (
                  <motion.div 
                    key={n.id} 
                    layout
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ 
                      x: 0, 
                      opacity: 1,
                      scale: n.type === 'session_finished' ? [1, 1.02, 1] : 1
                    }}
                    transition={{
                      scale: n.type === 'session_finished' ? { repeat: Infinity, duration: 1.5 } : { duration: 0.2 }
                    }}
                    className={`p-3 rounded-2xl border flex gap-3 relative transition-colors ${
                      n.type === 'session_finished' ? 'bg-red-600/20 border-red-500 shadow-lg shadow-red-500/20' : 
                      n.priority === 'high' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-800/50 border-gray-700/50'
                    }`}
                  >
                    <div className="shrink-0 mt-1">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-white leading-tight mb-1">{n.title}</p>
                      <p className="text-[10px] text-gray-400 font-medium leading-normal">{n.message}</p>
                      <span className="text-[8px] text-gray-600 font-bold uppercase mt-2 block">
                        {n.timestamp.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button 
                      onClick={() => onDismiss(n.id)}
                      className="shrink-0 p-1 hover:bg-gray-700 rounded-lg text-gray-500 transition-colors self-start"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
