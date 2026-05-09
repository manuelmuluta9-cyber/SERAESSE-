import React, { useState, useEffect } from 'react';
import { MonitorPlay, Settings2, ChevronLeft, AlertCircle, Pause, Play, Square, Timer, Clock, X, Plus, Lock, Cpu } from 'lucide-react';
import { Maquina, Sessao, Config, Role } from '../types';
import { formatTimeDisplay, formatarDinheiro } from '../lib/utils';
import { deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  config: Config;
  sessoes: Sessao[];
  maquinas: Maquina[];
  role: Role;
  podeOperar: boolean;
  iniciarSessaoConfirmada: (maquina: Maquina, modo: 'livre' | 'prepago' | 'pospago', mins: number, valor: number) => void;
  alternarPausaSessao: (sessao: Sessao) => void;
  terminarSessao: (sessao: Sessao) => void;
  registarAuditoria: (acao: string, detalhe: string) => Promise<void>;
  mostrarConfirmacao: (titulo: string, mensagem: string, onConfirm: () => void) => void;
  adicionarMaquinaGlobal: (nome: string) => Promise<void>;
  db: any;
  appId: string;
  contaNegocio: string;
  temaEscuro: boolean;
}

function ModalSetupSessao({ maquina, precoHora, onClose, onStart, temaEscuro }: { maquina: Maquina, precoHora: number, onClose: () => void, onStart: (modo: 'livre' | 'prepago' | 'pospago', mins: number, valor: number) => void, temaEscuro: boolean }) {
  const [modo, setModo] = useState<'livre' | 'prepago' | 'pospago'>('livre');
  const [minutos, setMinutos] = useState(30);
  const [valorFixo, setValorFixo] = useState(Math.ceil((30 / 60) * precoHora));
  const [precoLivre, setPrecoLivre] = useState(precoHora);

  useEffect(() => { setValorFixo(Math.ceil((minutos / 60) * precoHora)); }, [minutos, precoHora]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border rounded-[2.5rem] w-full max-w-[340px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]`}
      >
        <div className={`${temaEscuro ? 'bg-gray-850 border-gray-800' : 'bg-gray-50 border-gray-100'} p-5 flex justify-between items-center border-b`}>
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-orange-500" />
            <h3 className={`font-black ${temaEscuro ? 'text-white' : 'text-gray-900'} uppercase tracking-[0.2em] text-[10px]`}>{maquina.nome}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={18}/>
          </button>
        </div>
        <div className="p-6">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 text-center">Configurar Sessão</p>
          <div className="flex bg-gray-950 border border-gray-800 rounded-2xl p-1.5 mb-6">
            <button onClick={() => setModo('livre')} className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${modo === 'livre' ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20' : 'text-gray-500'}`}>Livre</button>
            <button onClick={() => setModo('prepago')} className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${modo === 'prepago' ? 'bg-blue-500 text-blue-950 shadow-lg shadow-blue-500/20' : 'text-gray-500'}`}>Pré-Pago</button>
            <button onClick={() => setModo('pospago')} className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${modo === 'pospago' ? 'bg-purple-500 text-purple-950 shadow-lg shadow-purple-500/20' : 'text-gray-500'}`}>Pós-Pago</button>
          </div>

          <AnimatePresence mode="wait">
            {(modo === 'prepago' || modo === 'pospago') ? (
              <motion.div 
                key="timer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-3 ml-1">Tempo sugerido</label>
                  <div className="grid grid-cols-3 gap-2">{[15, 30, 60].map(m => <button key={m} onClick={() => setMinutos(m)} className={`py-2.5 border rounded-xl font-black text-xs transition-all ${minutos === m ? (modo === 'prepago' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-purple-500 border-purple-500 text-white') : 'border-gray-800 text-gray-500 hover:border-gray-700'}`}>{m}m</button>)}</div>
                </div>
                <div className="bg-gray-950 border border-gray-800 p-3 rounded-2xl flex items-center shadow-inner">
                  <input type="number" value={minutos} onChange={e => setMinutos(Number(e.target.value))} className="bg-transparent w-full text-white font-black text-xl outline-none" min="1" />
                  <span className="text-gray-600 font-black text-[10px] tracking-widest">MINUTOS</span>
                </div>
                <div className={`${modo === 'prepago' ? 'bg-blue-950/20 border-blue-900/50' : 'bg-purple-950/20 border-purple-900/50'} border p-3 rounded-3xl text-center shadow-xl`}>
                  <label className={`text-[8px] font-black uppercase tracking-[0.2em] block mb-1.5 ${modo === 'prepago' ? 'text-blue-400' : 'text-purple-400'}`}>VALOR DO SERVIÇO</label>
                  <div className="flex items-center justify-center">
                    <span className="text-gray-500 font-black mr-2 text-base">AKZ</span>
                    <input type="number" value={valorFixo} onChange={e => setValorFixo(Number(e.target.value))} className="bg-transparent w-full text-center text-white font-black text-2xl outline-none" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="free"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="text-center py-6 bg-gray-950 rounded-3xl border border-gray-800 shadow-inner">
                  <Clock size={40} className="text-emerald-500 mx-auto mb-3 opacity-30"/>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-6 leading-relaxed">Taxação dinâmica baseada no tempo de uso.</p>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-3xl text-center shadow-xl">
                  <label className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] block mb-2">TAXA HORÁRIA</label>
                  <div className="flex items-center justify-center">
                    <span className="text-emerald-500/50 font-black mr-2 text-lg">AKZ</span>
                    <input type="number" value={precoLivre} onChange={e => setPrecoLivre(Number(e.target.value))} className="bg-transparent w-full text-center text-white font-black text-3xl outline-none" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => onStart(modo, minutos, modo === 'livre' ? precoLivre : valorFixo)} 
            className={`w-full mt-6 py-5 rounded-2xl font-black tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-xl ${modo === 'livre' ? 'bg-emerald-500 text-emerald-950 shadow-emerald-500/20' : (modo === 'prepago' ? 'bg-blue-500 text-blue-950 shadow-blue-500/20' : 'bg-purple-500 text-purple-950 shadow-purple-500/20')}`}
          >
            <Play size={18} fill="currentColor"/> 
            {modo === 'pospago' ? 'LANÇAR PÓS-PAGO' : 'INICIAR SESSÃO'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GestorSessoes({ config, sessoes, maquinas, podeOperar, iniciarSessaoConfirmada, alternarPausaSessao, terminarSessao, registarAuditoria, mostrarConfirmacao, adicionarMaquinaGlobal, db, appId, contaNegocio, temaEscuro }: Props) {
  const [now, setNow] = useState(Date.now());
  const [gerirModo, setGerirModo] = useState(false);
  const [modalIniciar, setModalIniciar] = useState<Maquina | null>(null);
  const [nomeNovaMaquina, setNomeNovaMaquina] = useState('');

  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(interval); }, []);

  const handleRemoverMaquina = (id: string, nome: string) => {
    mostrarConfirmacao('Apagar Máquina', `Queres apagar a máquina "${nome}"?`, async () => {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/maquinas_${contaNegocio}`, id));
        registarAuditoria('MÁQUINA_REM', `Removeu a máquina: ${nome}`);
      } catch (e) {}
    });
  };

  if (gerirModo) {
    return (
      <div className="p-4 animate-in slide-in-from-right duration-300">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => setGerirModo(false)} className="p-2.5 bg-gray-900 border border-gray-800 rounded-full text-gray-400 hover:text-white transition-all active:scale-95 shadow-lg">
            <ChevronLeft size={20}/>
          </button>
          <h2 className="text-sm font-black tracking-[0.2em] text-white uppercase flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg"><Settings2 size={16} className="text-orange-500"/></div>
            CONTROLO DE HARDWARE
          </h2>
          <div className="w-10"></div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if(nomeNovaMaquina.trim()) { adicionarMaquinaGlobal(nomeNovaMaquina); setNomeNovaMaquina(''); } }} className="flex gap-2">
            <input type="text" value={nomeNovaMaquina} onChange={e => setNomeNovaMaquina(e.target.value)} placeholder="Identificação da máquina" className="flex-1 bg-gray-950 border border-gray-800 text-white text-sm font-black px-5 py-4 rounded-2xl outline-none focus:border-orange-500 shadow-inner" required />
            <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white p-4 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center">
              <Plus size={24}/>
            </button>
        </form>
        <div className="mt-8 flex flex-col gap-3">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1">Máquinas Registadas ({maquinas.length})</p>
          {maquinas.map(maq => (<div key={maq.id} className="flex items-center justify-between bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-5 rounded-2xl group hover:border-gray-700 transition-all shadow-sm"><span className="font-extrabold text-gray-200 text-sm tracking-tight uppercase">{maq.nome}</span>{podeOperar && <button onClick={() => handleRemoverMaquina(maq.id, maq.nome)} className="p-2.5 bg-red-500/5 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"><Square size={16} fill="currentColor"/></button>}</div>))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 animate-in fade-in duration-300">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className={`text-lg font-black tracking-tight ${temaEscuro ? 'text-white' : 'text-gray-900'} flex items-center gap-1.5 uppercase`}>
            Sessões
            <div className="flex gap-1 ml-0.5">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(59,130,246,0.5)] [animation-delay:200ms]"></div>
            </div>
          </h2>
          <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mt-0.5">{formatarDinheiro(config.precoHora)}/h</p>
        </div>
        <button onClick={() => setGerirModo(true)} className={`flex items-center gap-1.5 ${temaEscuro ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-600'} text-[8px] font-black uppercase px-3 py-1.5 rounded-xl transition-all hover:bg-gray-800 hover:text-white shadow-lg active:scale-95`}><Settings2 size={12}/> Gestão</button>
      </div>

      {maquinas.length === 0 ? (
        <div className={`text-center py-16 ${temaEscuro ? 'bg-gray-900/30 border-gray-800' : 'bg-gray-50 border-gray-200'} border-2 border-dashed rounded-[2rem] shadow-inner`}>
          <div className={`p-4 ${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} rounded-full w-fit mx-auto mb-4 border`}>
            <MonitorPlay size={32} className="text-gray-700" />
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Sem máquinas</p>
          {podeOperar && <button onClick={() => setGerirModo(true)} className="bg-orange-600 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl shadow-2xl shadow-orange-500/20 active:scale-95 transition-all uppercase">Montar Estação</button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {maquinas.map(maq => {
              const sessaoAtiva = sessoes.find(s => s.maquinaId === maq.id);
              if (sessaoAtiva) {
                const isPausada = sessaoAtiva.emPausa;
                const tempoDecorridoMs = isPausada ? (sessaoAtiva.momentoPausa! - sessaoAtiva.inicio) : (now - sessaoAtiva.inicio);
                const isTemporizador = sessaoAtiva.modo === 'prepago' || sessaoAtiva.modo === 'pospago';
                const isPospago = sessaoAtiva.modo === 'pospago';
                let tempoMostradoMs = tempoDecorridoMs, isEsgotado = false;

                if (isTemporizador && sessaoAtiva.tempoPrePagoMin) {
                  const tempoTotalMs = sessaoAtiva.tempoPrePagoMin * 60000;
                  tempoMostradoMs = tempoTotalMs - tempoDecorridoMs;
                  if (tempoMostradoMs <= 0) isEsgotado = true;
                }

                let colorTheme = isTemporizador ? (isEsgotado ? 'red' : (isPospago ? 'purple' : 'blue')) : 'emerald';
                if (isPausada && !isEsgotado) colorTheme = 'yellow';

                const bgCardClass = colorTheme === 'red' ? 'bg-red-500/10 border-red-500 shadow-lg shadow-red-500/10' : colorTheme === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' : colorTheme === 'blue' ? 'bg-blue-900/30 border-blue-500/30 shadow-lg shadow-blue-500/5' : colorTheme === 'purple' ? 'bg-purple-900/30 border-purple-500/30 shadow-lg shadow-purple-500/5' : 'bg-emerald-900/30 border-emerald-500/30 shadow-lg shadow-emerald-500/5';
                const textTempoClass = colorTheme === 'red' ? 'text-red-500 animate-pulse' : colorTheme === 'yellow' ? 'text-yellow-500' : (temaEscuro ? 'text-white' : 'text-gray-900');
                const btnClass = colorTheme === 'red' ? 'bg-red-600 text-white' : colorTheme === 'yellow' ? 'bg-yellow-600 text-white' : colorTheme === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : colorTheme === 'purple' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20';

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={maq.id} 
                    className={`border p-2.5 rounded-[1.5rem] flex flex-col justify-between relative overflow-hidden transition-all ${temaEscuro ? 'bg-gray-900/40' : 'bg-white shadow-sm'} backdrop-blur-sm ${bgCardClass}`}
                  >
                    <div className="flex justify-between items-start mb-1 relative z-10">
                      <p className={`font-black text-[8px] tracking-widest uppercase truncate max-w-[80%] ${colorTheme === 'red' ? 'text-red-400' : colorTheme === 'yellow' ? 'text-yellow-500' : colorTheme === 'blue' ? 'text-blue-400' : colorTheme === 'purple' ? 'text-purple-400' : 'text-emerald-400'}`}>{maq.nome}</p>
                      {isEsgotado ? <AlertCircle size={12} className="text-red-500 animate-bounce"/> : (
                        isPausada ? <Pause size={10} className="text-yellow-500" /> : <div className={`relative inline-flex rounded-full h-1.5 w-1.5 ${colorTheme === 'blue' ? 'bg-blue-500' : colorTheme === 'purple' ? 'bg-purple-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`}></div>
                      )}
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-1.5 mb-1 text-center justify-center">
                        <span className={`text-lg font-black ${textTempoClass} font-mono tracking-tighter leading-none`}>{formatTimeDisplay(tempoMostradoMs)}</span>
                      </div>
                      <p className="text-[6.5px] font-black uppercase text-gray-500 mb-2 tracking-widest text-center">
                        {isPausada ? 'PAUSA' : (isTemporizador ? (isEsgotado ? 'ESGOTADO' : (isPospago ? 'PÓS' : 'PRÉ')) : `${formatarDinheiro(Math.ceil((tempoDecorridoMs / 3600000) * (sessaoAtiva.precoHoraAplicado || config.precoHora)))}`)}
                      </p>
                      {podeOperar ? (
                        <div className="flex gap-1 w-full">
                          <button onClick={() => alternarPausaSessao(sessaoAtiva)} className={`p-2 rounded-lg ${temaEscuro ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200'} border hover:text-white transition-all active:scale-95`}>
                             {isPausada ? <Play size={10} fill="currentColor"/> : <Pause size={10} fill="currentColor"/>}
                          </button>
                          <button onClick={() => terminarSessao(sessaoAtiva)} className={`flex-1 font-black text-[7px] uppercase py-2 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 ${btnClass}`}>
                            <Square size={8} fill="currentColor"/> Off
                          </button>
                        </div>
                      ) : (
                        <div className="w-full bg-red-950/40 text-red-500 border border-red-900/20 font-black text-[8px] uppercase py-2 rounded-lg flex items-center justify-center gap-1 shadow-inner mt-1"><Lock size={10}/> NO ADM</div>
                      )}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={maq.id} 
                  className={`${temaEscuro ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-2.5 rounded-[1.5rem] flex flex-col justify-between group hover:border-gray-700 hover:bg-gray-900/50 transition-all opacity-70`}
                >
                  <p className={`font-black text-[9px] text-gray-500 uppercase tracking-widest mb-4 leading-tight group-hover:text-gray-300 transition-colors`}>{maq.nome}</p>
                  {podeOperar ? (
                    <button onClick={() => setModalIniciar(maq)} className={`w-full ${temaEscuro ? 'bg-gray-850 border-gray-800 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'} border font-black text-[8px] uppercase py-2 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 hover:text-orange-500`}><Play size={10} fill="currentColor" className="text-gray-600"/> LANÇAR</button>
                  ) : (
                    <div className={`w-full ${temaEscuro ? 'bg-gray-950 text-gray-700 border-gray-800/50' : 'bg-gray-100 text-gray-400 border-gray-200'} font-black text-[8px] uppercase py-2 rounded-xl shadow-inner flex items-center justify-center gap-1 cursor-not-allowed`}>
                      <Lock size={10} fill="currentColor" className="opacity-30"/> 
                      TRAVADO
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modalIniciar && (
          <ModalSetupSessao 
            maquina={modalIniciar} 
            precoHora={config.precoHora} 
            onClose={() => setModalIniciar(null)} 
            temaEscuro={temaEscuro}
            onStart={(modo, mins, valor) => { 
              setModalIniciar(null); 
              iniciarSessaoConfirmada(modalIniciar!, modo, mins, valor); 
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
