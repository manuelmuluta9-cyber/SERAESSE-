import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Banknote, Coffee, ChevronRight, Clock as ClockIcon, Zap } from 'lucide-react';
import { Transacao, Maquina, Role, Produto } from '../types';
import { formatarDinheiro, obterDataHoje } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  transacoes: Transacao[];
  produtos: Produto[];
  setTelaAtual: (tela: any) => void;
  role: Role;
  podeOperar: boolean;
  apagarTransacao: (id: string, valor: number, categoria: string) => void;
  editarTransacao: (t: Transacao) => void;
  maquinas: Maquina[];
  temaEscuro: boolean;
}

interface TransacaoItemProps {
  key?: string;
  t: Transacao;
  podeOperar: boolean;
  editarTransacao: (t: Transacao) => void;
  index: number;
  temaEscuro: boolean;
}

function TransacaoItem({ t, podeOperar, editarTransacao, index, temaEscuro }: TransacaoItemProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => podeOperar && editarTransacao(t)} 
      className={`${temaEscuro ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} backdrop-blur-sm border p-2 rounded-[1.25rem] flex justify-between items-center group transition-all ${podeOperar ? 'cursor-pointer hover:bg-gray-800/80 hover:border-orange-500/50 active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-xl ${t.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]'}`}>
          {t.tipo === 'entrada' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        </div>
        <div className="min-w-0">
          <p className={`font-bold ${temaEscuro ? 'text-gray-200' : 'text-gray-900'} text-[11px] leading-tight uppercase tracking-tight truncate`}>{t.categoria}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[8px] text-gray-500 font-mono tracking-tight">{t.hora}</span>
            <span className="w-0.5 h-0.5 bg-gray-700 rounded-full"></span>
            <span className="text-[8px] text-gray-600 font-bold uppercase truncate max-w-[80px]">{t.descricao || t.metodo || 'Dinheiro'}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className={`font-black text-xs ${t.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
            {t.tipo === 'entrada' ? '+' : '-'}{formatarDinheiro(t.valor)}
          </p>
        </div>
        {podeOperar && <ChevronRight size={14} className="text-gray-700 group-hover:text-orange-400 transition-colors" />}
      </div>
    </motion.div>
  );
}

export function Dashboard({ transacoes, produtos, podeOperar, editarTransacao, temaEscuro }: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dataHoje = obterDataHoje();
  const transacoesHoje = transacoes.filter(t => t.data === dataHoje);
  const entradasHoje = transacoesHoje.filter(t => t.tipo === 'entrada').reduce((acc, curr) => acc + curr.valor, 0);
  const despesasHoje = transacoesHoje.filter(t => t.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
  const lucroHoje = entradasHoje - despesasHoje;
  
  const entradasCount = transacoesHoje.filter(t => t.tipo === 'entrada').length;
  const ticketMedio = entradasCount > 0 ? (entradasHoje / entradasCount) : 0;

  const seteDiasAtras = new Date(); seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const data7Dias = seteDiasAtras.toISOString().split('T')[0];
  const transacoes7d = transacoes.filter(t => t.data >= data7Dias);
  const lucro7d = transacoes7d.filter(t => t.tipo === 'entrada').reduce((a, b) => a + b.valor, 0) - transacoes7d.filter(t => t.tipo === 'despesa').reduce((a, b) => a + b.valor, 0);
  const mediaSemanal = lucro7d / 7;

  // Cálculos do Stock
  const valorTotalStock = produtos.reduce((acc, p) => acc + (p.stockAtual * p.precoVenda), 0);
  const totalVendidoStock = transacoes.filter(t => (t.categoria === 'Consumo (Bar)' || t.categoria === 'Bar / Snacks' || t.descricao?.startsWith('Venda:')) && t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);

  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');

  return (
    <div className="p-3 flex flex-col gap-3 animate-in fade-in duration-300 pb-10">
      <div className="flex justify-between items-center mb-1">
        <div>
          <h2 className={`text-lg font-black tracking-widest ${temaEscuro ? 'text-white' : 'text-gray-900'} uppercase flex items-center gap-2`}>
            <Zap className="text-orange-500 fill-orange-500" size={15} />
            Egman Space
          </h2>
          <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em]">{dataHoje}</p>
        </div>
        <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-gray-200 border-gray-300'} px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-inner`}>
          <ClockIcon size={12} className="text-gray-500" />
          <span className={`text-xs font-black ${temaEscuro ? 'text-white' : 'text-gray-800'} font-mono tracking-tighter`}>
            {hours}:{minutes}<span className="text-gray-600 ml-0.5 text-[8px]">{seconds}</span>
          </span>
        </div>
      </div>

      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="bg-gradient-to-br from-orange-600 via-orange-600 to-amber-700 rounded-[2rem] p-4 shadow-2xl relative overflow-hidden group cursor-pointer"
      >
         {/* Abstract Geometric Pattern Background */}
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
                <linearGradient id="fadeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <path d="M0,100 C30,80 70,120 100,100 L100,0 L0,0 Z" fill="url(#fadeGrad)" />
            </svg>
         </div>

         {/* Decorative Blur Elements */}
         <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-[60px] group-hover:bg-white/20 transition-all duration-700 animate-pulse"></div>
         
         <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-emerald-100 font-black text-[7px] uppercase tracking-[0.2em] flex items-center gap-1 opacity-80 mb-0.5">
                  <div className="w-1 h-1 bg-emerald-300 rounded-full animate-pulse"></div>
                  Lucro Real Diário
                </div>
                <motion.h2 
                  key={lucroHoje}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-black text-white tracking-tighter drop-shadow-2xl leading-none"
                >
                  {formatarDinheiro(lucroHoje)}
                </motion.h2>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-xl">
                <Wallet className="text-emerald-200" size={20} />
              </div>
            </div>

            {/* Visual Balance Bar */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[8px] font-black text-emerald-200/60 uppercase tracking-[0.15em]">Performance do Dia</span>
                <span className="text-[8px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                  {entradasHoje > 0 ? Math.round((lucroHoje / entradasHoje) * 100) : 0}% Margem
                </span>
              </div>
              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden flex shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${entradasHoje > 0 ? Math.min(100, Math.max(0, (lucroHoje / entradasHoje) * 100)) : 0}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
                ></motion.div>
              </div>
            </div>
         </div>
      </motion.div> 
      
      <div className="grid grid-cols-2 gap-2">
         <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-3 rounded-[1.25rem] shadow-sm flex flex-col justify-between overflow-hidden relative`}>
            <div className="absolute top-0 right-0 p-1.5 opacity-5"><TrendingUp size={30} /></div>
            <p className="text-[7px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Entradas</p>
            <p className="text-sm font-black text-emerald-500">{formatarDinheiro(entradasHoje)}</p>
         </div>
         <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-3 rounded-[1.25rem] shadow-sm flex flex-col justify-between overflow-hidden relative`}>
            <div className="absolute top-0 right-0 p-1.5 opacity-5"><TrendingDown size={30} /></div>
            <p className="text-[7px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Despesas</p>
            <p className="text-sm font-black text-red-500">{formatarDinheiro(despesasHoje)}</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
         <div className={`${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-emerald-950/20 shadow-sm'} border p-2 rounded-xl flex items-center gap-2`}>
            <div className={`p-1 ${temaEscuro ? 'bg-gray-900' : 'bg-white shadow-sm'} rounded-md`}><Coffee size={10} className="text-orange-500" /></div>
            <div className="min-w-0">
              <p className="text-[7px] text-gray-500 font-black uppercase tracking-widest truncate">Valor em Stock</p>
              <p className={`text-[9px] font-black ${temaEscuro ? 'text-white' : 'text-gray-800'} truncate`}>{formatarDinheiro(valorTotalStock)}</p>
            </div>
         </div>
         <div className={`${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-emerald-950/20 shadow-sm'} border p-2 rounded-xl flex items-center gap-2`}>
            <div className={`p-1 ${temaEscuro ? 'bg-gray-900' : 'bg-white shadow-sm'} rounded-md`}><TrendingUp size={10} className="text-emerald-500" /></div>
            <div className="min-w-0">
              <p className="text-[7px] text-gray-500 font-black uppercase tracking-widest truncate">Vendas Stock</p>
              <p className={`text-[9px] font-black ${temaEscuro ? 'text-white' : 'text-gray-800'} truncate`}>{formatarDinheiro(totalVendidoStock)}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
         <div className={`${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-200 shadow-sm'} border p-2 rounded-xl flex items-center gap-2`}>
            <div className={`p-1 ${temaEscuro ? 'bg-gray-900' : 'bg-white shadow-sm'} rounded-md`}><Zap size={10} className="text-orange-500" /></div>
            <div className="min-w-0">
              <p className="text-[7px] text-gray-500 font-black uppercase tracking-widest truncate">Tickets Med.</p>
              <p className={`text-[9px] font-black ${temaEscuro ? 'text-white' : 'text-gray-800'} truncate`}>{formatarDinheiro(ticketMedio)}</p>
            </div>
         </div>
         <div className={`${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-200 shadow-sm'} border p-2 rounded-xl flex items-center gap-2`}>
            <div className={`p-1 ${temaEscuro ? 'bg-gray-900' : 'bg-white shadow-sm'} rounded-md`}><TrendingUp size={10} className="text-blue-500" /></div>
            <div className="min-w-0">
              <p className="text-[7px] text-gray-500 font-black uppercase tracking-widest truncate">Média 7D</p>
              <p className={`text-[9px] font-black ${temaEscuro ? 'text-white' : 'text-gray-800'} truncate`}>{formatarDinheiro(mediaSemanal)}</p>
            </div>
         </div>
      </div>

      <div className="mt-1"> 
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <div className={`h-px w-4 ${temaEscuro ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
            Últimas Operações
          </h3>
          <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black uppercase">
            {transacoesHoje.length} Ops
          </span>
        </div> 
        {transacoesHoje.length === 0 ? (
          <div className={`text-center py-8 ${temaEscuro ? 'bg-gray-900/30 border-gray-800' : 'bg-gray-50 border-gray-200'} rounded-[2rem] border border-dashed`}>
            <Coffee size={30} className="text-gray-700 mx-auto mb-2 opacity-50" />
            <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest">Caixa em repouso...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {transacoesHoje.map((t, i) => (
                <TransacaoItem 
                  key={t.id} 
                  t={t} 
                  podeOperar={podeOperar} 
                  editarTransacao={editarTransacao} 
                  index={i}
                  temaEscuro={temaEscuro}
                />
              ))}
            </AnimatePresence>
          </div>
        )} 
      </div> 
    </div>
  );
}
