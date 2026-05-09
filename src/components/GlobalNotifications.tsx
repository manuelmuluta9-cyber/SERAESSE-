import React, { useState, useEffect } from 'react';
import { Bell, X, MessageSquare, ShieldAlert, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

interface Aviso {
  id: string;
  texto: string;
  timestamp: number;
  autor?: string;
  isDirect?: boolean;
}

interface GlobalNotificationsProps {
  accountId?: string | null;
  forceOpen?: boolean;
  onClose?: () => void;
}

export function GlobalNotifications({ accountId, forceOpen, onClose }: GlobalNotificationsProps) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [direta, setDireta] = useState<Aviso | null>(null);
  const [aberto, setAberto] = useState(false);
  const [lidas, setLidas] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('egman_read_ids');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  });
  const [diretaLidaTexto, setDiretaLidaTexto] = useState('');

  // Persistir lidas
  useEffect(() => {
    if (lidas.length > 0) {
      localStorage.setItem('egman_read_ids', JSON.stringify(lidas));
    }
  }, [lidas]);

  useEffect(() => {
    if (accountId) {
      const key = `egman_direct_read_text_${accountId}`;
      const saved = localStorage.getItem(key) || '';
      setDiretaLidaTexto(saved);
    }
  }, [accountId]);

  const ANNOUNCEMENTS_PATH = `artifacts/${appId}/public/data/announcements`;
  const ACCOUNTS_PATH = `artifacts/${appId}/public/data/contas`;

  useEffect(() => {
    if (forceOpen) setAberto(true);
  }, [forceOpen]);

  useEffect(() => {
    // 1. Avisos Gerais
    const q = query(collection(db, ANNOUNCEMENTS_PATH), orderBy('timestamp', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Aviso));
      setAvisos(docs);
    });

    // 2. Mensagem Direta
    let unsubDirect = () => {};
    if (accountId) {
      unsubDirect = onSnapshot(doc(db, ACCOUNTS_PATH, accountId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.mensagemAdmin) {
            setDireta({
              id: 'direct',
              texto: String(data.mensagemAdmin).trim(),
              timestamp: Date.now(),
              autor: 'Suporte Direto',
              isDirect: true
            });
          } else {
            setDireta(null);
          }
        }
      });
    }

    return () => {
      unsub();
      unsubDirect();
    };
  }, [accountId]);

  const temNovosGerais = avisos.length > 0 && avisos.some(a => !lidas.includes(String(a.id)));
  const temNovaDireta = !!(direta && direta.texto && direta.texto.trim() !== diretaLidaTexto.trim());
  const temNovos = temNovosGerais || temNovaDireta;

  const marcarLida = (id: string) => {
    const idStr = String(id);
    setLidas(prev => prev.includes(idStr) ? prev : [...prev, idStr]);
  };

  const marcarDiretaLida = () => {
    if (direta && accountId) {
      const texto = direta.texto.trim();
      setDiretaLidaTexto(texto);
      localStorage.setItem(`egman_direct_read_text_${accountId}`, texto);
    }
  };

  const marcarTodasLidas = () => {
    const ids = avisos.map(a => String(a.id));
    setLidas(prev => {
      const unique = new Set([...prev, ...ids]);
      return Array.from(unique);
    });
    if (direta) marcarDiretaLida();
  };

  const handleToggle = () => {
    if (aberto && onClose) onClose();
    setAberto(!aberto);
  };

  const listaExibicao = direta ? [direta, ...avisos] : avisos;
  
  // Só mostrar o ícone flutuante se houver algo novo OU se estiver aberto
  if (!temNovos && !aberto && !forceOpen) return null;

  return (
    <>
      <div className="fixed bottom-24 right-6 z-[1500] pointer-events-none">
        <motion.button
          onClick={handleToggle}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`pointer-events-auto p-4 rounded-full shadow-2xl flex items-center justify-center border-2 transition-all relative ${
            temNovos 
              ? 'bg-indigo-600 border-white animate-bounce' 
              : 'bg-gray-900 border-gray-800'
          }`}
        >
          {aberto ? <X size={24} className="text-white" /> : <Bell size={24} className={temNovos ? 'text-white' : 'text-gray-400'} />}
          
          {temNovos && !aberto && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </span>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed inset-x-4 bottom-44 md:inset-x-auto md:right-6 md:w-80 bg-[#0a0f18] border border-indigo-500/30 rounded-[32px] shadow-2xl z-[1500] overflow-hidden flex flex-col max-h-[60vh]"
          >
            <div className="p-5 bg-indigo-600 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <ShieldAlert size={20} className="text-white" />
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Painel Egman</h3>
                    <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-tighter">Central de Mensagens</p>
                 </div>
               </div>
               <button onClick={handleToggle} className="text-white/50 hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-hide">
               {listaExibicao.length > 0 && (
                 <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-1 px-1">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Histórico de Avisos</p>
                    {temNovos && (
                      <button 
                        onClick={marcarTodasLidas}
                        className="text-[9px] font-black text-indigo-400 p-2 hover:bg-indigo-500/10 rounded-lg transition-all uppercase tracking-tighter"
                      >
                        Marcar Tudo como Lido
                      </button>
                    )}
                 </div>
               )}
               
               {listaExibicao.length === 0 ? (
                 <div className="p-10 text-center flex flex-col items-center justify-center opacity-20">
                    <MessageSquare size={32} />
                    <p className="text-[10px] font-black uppercase mt-2">Sem mensagens</p>
                 </div>
               ) : (
                 listaExibicao.map((aviso, idx) => {
                   const isAvisoLido = aviso.isDirect ? (aviso.texto.trim() === diretaLidaTexto.trim()) : lidas.includes(String(aviso.id));
                   
                   return (
                     <div 
                      key={aviso.id === 'direct' ? `direct-${idx}` : aviso.id} 
                      className={`p-4 rounded-2xl border transition-all ${aviso.isDirect ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/10'} ${!isAvisoLido ? 'ring-2 ring-indigo-500/20' : 'opacity-60'}`}
                     >
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-xs font-black flex items-center gap-1 ${aviso.isDirect ? 'text-indigo-400' : 'text-indigo-300'}`}>
                            {aviso.isDirect ? <UserCheck size={10} /> : <ShieldAlert size={10} />} {aviso.autor || 'Admin'}
                          </p>
                          {!isAvisoLido && (
                            <button 
                              onClick={() => aviso.isDirect ? marcarDiretaLida() : marcarLida(aviso.id)}
                              className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20"
                            >
                              Lida
                            </button>
                          )}
                        </div>
                        <p className={`text-xs text-gray-200 leading-relaxed ${isAvisoLido ? 'line-through' : ''}`}>{aviso.texto}</p>
                        {!aviso.isDirect && (
                          <p className="text-[8px] text-gray-500 mt-2 font-bold uppercase">
                            {new Date(aviso.timestamp).toLocaleString()}
                          </p>
                        )}
                        {aviso.isDirect && (
                          <p className="text-[7px] text-indigo-500/50 mt-2 font-black uppercase tracking-widest">Mensagem Pessoal</p>
                        )}
                     </div>
                   );
                 })
               )}
            </div>

            <div className="p-4 bg-black/40 border-t border-white/5 text-center">
               <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Apenas Leitura • Suporte Egman</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
