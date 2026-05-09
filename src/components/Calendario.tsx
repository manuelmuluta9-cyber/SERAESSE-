import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Banknote, Coffee, Wallet, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Transacao } from '../types';
import { formatarDinheiro, obterDataHoje, obterHoraAtual } from '../lib/utils';
import { motion } from 'motion/react';

interface Props {
  transacoes: Transacao[];
  podeOperar: boolean;
  editarTransacao: (t: Transacao) => void;
  apagarTransacao: (id: string, valor: number, categoria: string) => void;
  temaEscuro: boolean;
}

interface TransacaoItemProps {
  t: Transacao;
  podeOperar: boolean;
  editarTransacao: (t: Transacao) => void;
  key?: string | number;
  temaEscuro: boolean;
}

function TransacaoItem({ t, podeOperar, editarTransacao, temaEscuro }: TransacaoItemProps) {
  return (
    <div onClick={() => podeOperar && editarTransacao(t)} className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-3 rounded-2xl flex justify-between items-center group transition-all ${podeOperar ? 'cursor-pointer hover:bg-gray-800/80 hover:border-orange-500/50 active:scale-[0.98]' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${t.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{t.tipo === 'entrada' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}</div>
        <div>
          <p className={`font-bold ${temaEscuro ? 'text-gray-200' : 'text-gray-800'} text-sm leading-tight`}>{t.categoria}</p>
          <div className="flex items-center gap-2 mt-0.5"><span className="text-[10px] text-gray-500">{t.hora}</span><span className="w-1 h-1 bg-gray-700 rounded-full"></span><span className="text-[10px] text-gray-500 font-medium">{t.metodo || 'Dinheiro'}</span></div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right"><p className={`font-black text-sm ${t.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>{t.tipo === 'entrada' ? '+' : '-'}{formatarDinheiro(t.valor)}</p></div>
        {podeOperar && <ChevronRight size={18} className="text-gray-600 group-hover:text-orange-400" />}
      </div>
    </div>
  );
}

export function Calendario({ transacoes, podeOperar, editarTransacao, temaEscuro }: Props) {
  const dataHoje = new Date();
  const [mesAtual, setMesAtual] = useState(dataHoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(dataHoje.getFullYear());
  const [anoHistorico, setAnoHistorico] = useState(dataHoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const mudarMes = (d: number) => { let m = mesAtual + d, a = anoAtual; if (m > 11) { m = 0; a++; } if (m < 0) { m = 11; a--; } setMesAtual(m); setAnoAtual(a); };
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDiaDoMes = new Date(anoAtual, mesAtual, 1).getDay();
  const dias = Array(primeiroDiaDoMes).fill(null).concat(Array.from({length: diasNoMes}, (_, i) => i + 1));

  const obterResumoDia = (dia: number | null) => {
    if (!dia) return null;
    const dataStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const tDia = transacoes.filter(t => t.data === dataStr);
    const entradas = tDia.filter(t => t.tipo === 'entrada').reduce((a, b) => a + b.valor, 0);
    const despesas = tDia.filter(t => t.tipo === 'despesa').reduce((a, b) => a + b.valor, 0);
    return { temDados: tDia.length > 0, lucro: entradas - despesas };
  };

  const dadosMes = useMemo(() => {
    const diasArr = Array.from({length: diasNoMes}, (_, i) => ({ dia: i + 1, entrada: 0, despesa: 0 }));
    let entradas = 0, despesas = 0;
    transacoes.forEach(t => {
        const [tAno, tMes, tDia] = t.data.split('-');
        if (parseInt(tAno) === anoAtual && parseInt(tMes) === mesAtual + 1) {
            const diaIdx = parseInt(tDia) - 1;
            if (t.tipo === 'entrada') { diasArr[diaIdx].entrada += t.valor; entradas += t.valor; }
            else { diasArr[diaIdx].despesa += t.valor; despesas += t.valor; }
        }
    });
    const lucro = entradas - despesas;
    const maxVal = Math.max(...diasArr.map(d => Math.max(d.entrada, d.despesa)), 100) * 1.1; 
    return { dias: diasArr, entradas, despesas, lucro, maxVal };
  }, [transacoes, mesAtual, anoAtual, diasNoMes]);

  const dadosAnuais = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({ mes: i, entrada: 0, despesa: 0, lucro: 0 }));
    transacoes.forEach(t => {
      const parts = t.data.split('-');
      if (parts.length === 3) {
        const tAno = parseInt(parts[0]);
        const tMes = parseInt(parts[1]) - 1; // 0-indexed
        
        if (tAno === anoHistorico) {
          if (t.tipo === 'entrada') {
            arr[tMes].entrada += t.valor;
          } else {
            arr[tMes].despesa += t.valor;
          }
        }
      }
    });
    const result = arr.map(m => ({ ...m, lucro: m.entrada - m.despesa }));
    const maxAnual = Math.max(...result.map(m => Math.max(m.entrada, m.despesa, Math.abs(m.lucro))), 100);
    
    const totaisAnuais = result.reduce((acc, curr) => ({
      entrada: acc.entrada + curr.entrada,
      despesa: acc.despesa + curr.despesa,
      lucro: acc.lucro + curr.lucro
    }), { entrada: 0, despesa: 0, lucro: 0 });

    return { meses: result, max: maxAnual, totaisAnuais };
  }, [transacoes, anoHistorico]);

  if (diaSelecionado) {
    const transacoesDia = transacoes.filter(t => t.data === diaSelecionado);
    const entradasDia = transacoesDia.filter(t => t.tipo === 'entrada').reduce((acc, curr) => acc + curr.valor, 0);
    const despesasDia = transacoesDia.filter(t => t.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
    const lucroDia = entradasDia - despesasDia;

    return (
      <div className="p-4 pb-10 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-6"><button onClick={() => setDiaSelecionado(null)} className={`p-2 ${temaEscuro ? 'bg-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-600 shadow-sm'} border rounded-full hover:text-white transition-colors`}><ChevronLeft size={20} /></button><h2 className={`text-sm font-black tracking-widest ${temaEscuro ? 'text-white' : 'text-gray-900'} uppercase`}>{diaSelecionado}</h2><div className="w-9"></div></div>
        <div className="grid grid-cols-2 gap-3 mb-6">
           <div className={`${temaEscuro ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-emerald-50 border-emerald-200 shadow-sm'} border p-4 rounded-2xl text-center`}><p className="text-[10px] font-bold uppercase text-emerald-500 mb-1">Receitas</p><p className="text-lg font-black text-emerald-400">{formatarDinheiro(entradasDia)}</p></div>
           <div className={`${temaEscuro ? 'bg-red-950/30 border-red-900/50' : 'bg-red-50 border-red-200 shadow-sm'} border p-4 rounded-2xl text-center`}><p className="text-[10px] font-bold uppercase text-red-500 mb-1">Despesas</p><p className="text-lg font-black text-red-400">{formatarDinheiro(despesasDia)}</p></div>
           <div className={`col-span-2 p-4 rounded-2xl text-center border ${lucroDia >= 0 ? (temaEscuro ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-100 border-emerald-300') : (temaEscuro ? 'bg-red-900/20 border-red-500/30' : 'bg-red-100 border-red-300')}`}>
             <p className={`text-[10px] font-bold uppercase mb-1 ${lucroDia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>Balanço Final</p><p className={`text-2xl font-black ${lucroDia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatarDinheiro(lucroDia)}</p>
           </div>
        </div>
        <div className="flex justify-between items-center mb-3"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Banknote size={14}/> Movimentos</h3><span className={`text-[10px] ${temaEscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'} px-2 py-1 rounded-md font-bold`}>{transacoesDia.length} op</span></div>
        {transacoesDia.length === 0 ? (<div className={`text-center p-8 ${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} rounded-2xl border`}><Coffee size={32} className="text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm font-medium">Nenhum registo.</p></div>) : (<div className="flex flex-col gap-2">{transacoesDia.map(t => (<TransacaoItem key={t.id} t={t} podeOperar={podeOperar} editarTransacao={editarTransacao} temaEscuro={temaEscuro} />))}</div>)}
      </div>
    );
  }

  const pontosEntrada = dadosMes.dias.map((d, i) => `${(i / (diasNoMes - 1)) * 100},${100 - (d.entrada / dadosMes.maxVal) * 100}`).join(' ');
  const pontosDespesa = dadosMes.dias.map((d, i) => `${(i / (diasNoMes - 1)) * 100},${100 - (d.despesa / dadosMes.maxVal) * 100}`).join(' ');

  return (
    <div className="p-4 pb-10 animate-in fade-in duration-300">
      <div className={`flex justify-between items-center ${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-3 rounded-2xl mb-4`}>
        <button onClick={() => mudarMes(-1)} className="p-2 text-gray-400 hover:text-orange-500 transition-colors"><ChevronLeft size={20} /></button>
        <h2 className={`text-sm font-black uppercase tracking-widest ${temaEscuro ? 'text-white' : 'text-gray-900'}`}>{meses[mesAtual]} {anoAtual}</h2>
        <button onClick={() => mudarMes(1)} className="p-2 text-gray-400 hover:text-orange-500 transition-colors"><ChevronRight size={20} /></button>
      </div>
      
      <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-4 rounded-2xl mb-6`}>
        <div className="grid grid-cols-7 gap-1 mb-2">{['D','S','T','Q','Q','S','S'].map((d, i) => <div key={i} className="text-center text-[10px] font-bold text-gray-600">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {dias.map((dia, index) => {
            const resumo = obterResumoDia(dia);
            let cor = "text-gray-500 hover:bg-gray-800", dot = ""; let dataStrOnClick = null;
            if (dia) dataStrOnClick = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            if (resumo?.temDados) { 
              cor = temaEscuro ? "text-white font-bold bg-gray-800" : "text-gray-900 font-bold bg-gray-100"; 
              dot = resumo.lucro > 0 ? "bg-emerald-500" : resumo.lucro < 0 ? "bg-red-500" : "bg-blue-500"; 
            }
            return (
              <div key={index} onClick={() => dataStrOnClick && setDiaSelecionado(dataStrOnClick)} className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-colors ${dataStrOnClick ? 'cursor-pointer' : ''} ${cor}`}>
                <span className="text-xs">{dia}</span>{dot && <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${dot}`}></div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className={`${temaEscuro ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50 border-emerald-200 shadow-sm'} border p-3 rounded-2xl flex flex-col items-center justify-center text-center`}>
           <span className="text-[9px] text-emerald-500/70 font-black uppercase mb-1">Receita</span>
           <span className="text-sm font-black text-emerald-400 whitespace-nowrap">{formatarDinheiro(dadosMes.entradas)}</span>
        </div>
        <div className={`${temaEscuro ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-200 shadow-sm'} border p-3 rounded-2xl flex flex-col items-center justify-center text-center`}>
           <span className="text-[9px] text-red-500/70 font-black uppercase mb-1">Despesa</span>
           <span className="text-sm font-black text-red-400 whitespace-nowrap">{formatarDinheiro(dadosMes.despesas)}</span>
        </div>
        <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-3 rounded-2xl flex flex-col items-center justify-center text-center`}>
           <span className="text-[9px] text-gray-500 font-black uppercase mb-1">Lucro</span>
           <span className={`text-sm font-black whitespace-nowrap ${dadosMes.lucro > 0 ? 'text-orange-400' : (dadosMes.lucro < 0 ? 'text-red-400' : (temaEscuro ? 'text-gray-300' : 'text-gray-900'))}`}>{formatarDinheiro(dadosMes.lucro)}</span>
        </div>
      </div>


      <div className="mt-8 pt-8 border-t border-gray-800/50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
              <BarChart3 size={14} /> Desempenho Anual
            </h3>
            <span className="text-[8px] text-gray-500 font-bold uppercase mt-0.5 tracking-tighter">Comparativo Mensal {anoHistorico}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-xl border border-gray-800">
            <button onClick={() => setAnoHistorico(p => p - 1)} className="p-1 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-[10px] font-black text-white min-w-[32px] text-center">{anoHistorico}</span>
            <button onClick={() => setAnoHistorico(p => p + 1)} className="p-1 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="bg-gray-950/40 border border-gray-800/50 p-6 rounded-3xl relative overflow-hidden">
           <div className="h-64 w-full relative z-10 pt-16 px-2">
              {/* SVG for the Profit Line Trend */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible px-8 pt-20 pb-12">
                <motion.path
                  d={dadosAnuais.meses.map((m, i) => {
                    const x = (i / 11) * 100;
                    const hLucro = (m.lucro / dadosAnuais.max) * 100;
                    // Invert height for SVG coordinate system (0 is top)
                    // The graph area is roughly from top 16 to bottom 8 (percentage-wise in container)
                    const y = 100 - Math.max(0, hLucro);
                    return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                {dadosAnuais.meses.map((m, i) => {
                  const x = (i / 11) * 100;
                  const hLucro = (m.lucro / dadosAnuais.max) * 100;
                  const y = 100 - Math.max(0, hLucro);
                  return (
                    <g key={i} className="overflow-visible">
                      <motion.circle 
                        cx={`${x}%`} cy={`${y}%`} r="4" fill="#3b82f6" stroke="#000" strokeWidth="2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + (i * 0.1) }}
                      />
                      <motion.text
                        x={`${x}%`} y={`${y}%`} dy="-12"
                        textAnchor="middle"
                        className="text-[8px] font-black fill-blue-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 + (i * 0.1) }}
                      >
                        {m.lucro > 0 ? (m.lucro > 1000 ? `${(m.lucro/1000).toFixed(1)}k` : m.lucro) : ''}
                      </motion.text>
                    </g>
                  );
                })}
              </svg>

              <div className="h-full w-full flex items-end justify-between gap-1 relative z-10">
                {dadosAnuais.meses.map((m, i) => {
                  const hEntrada = (m.entrada / dadosAnuais.max) * 100;
                  const hDespesa = (m.despesa / dadosAnuais.max) * 100;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full">
                      <div className="w-full flex items-end gap-[1px] h-full justify-center">
                         {/* Entrada */}
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: `${Math.max(2, hEntrada)}%` }}
                           transition={{ duration: 0.8, delay: i * 0.05 }}
                           className="w-2 bg-emerald-500 rounded-t-sm shadow-[0_0_8px_rgba(16,185,129,0.2)] transition-all"
                         />
                         {/* Despesa */}
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: `${Math.max(2, hDespesa)}%` }}
                           transition={{ duration: 1, delay: i * 0.05 + 0.2 }}
                           className="w-2 bg-red-500/80 rounded-t-sm transition-all"
                         />
                      </div>
                      <span className="text-[7px] text-gray-600 font-bold uppercase mt-2 group-hover:text-gray-400 transition-colors">
                        {meses[i].substring(0, 3)}
                      </span>

                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none bg-gray-900 border border-gray-700 p-2 rounded-lg z-30 w-max shadow-2xl">
                         <div className="text-[7px] text-emerald-400 font-black">ENT: {formatarDinheiro(m.entrada)}</div>
                         <div className="text-[7px] text-red-400 font-black">SAI: {formatarDinheiro(m.despesa)}</div>
                         <div className="text-[7px] text-blue-400 font-black font-bold">LUC: {formatarDinheiro(m.lucro)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>
           
           {/* Summary Info Row */}
           <div className="grid grid-cols-3 gap-2 mt-8 pt-6 border-t border-gray-800/50">
             <div className="text-center">
                <span className="block text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Entradas</span>
                <span className="text-sm font-black text-emerald-400">{formatarDinheiro(dadosAnuais.totaisAnuais.entrada)}</span>
             </div>
             <div className="text-center">
                <span className="block text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Despesas</span>
                <span className="text-sm font-black text-red-500">{formatarDinheiro(dadosAnuais.totaisAnuais.despesa)}</span>
             </div>
             <div className="text-center">
                <span className="block text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Lucro Anual</span>
                <span className="text-sm font-black text-blue-500">{formatarDinheiro(dadosAnuais.totaisAnuais.lucro)}</span>
             </div>
           </div>

           {/* Legend */}
           <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Receita</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Despesa</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Lucro</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
