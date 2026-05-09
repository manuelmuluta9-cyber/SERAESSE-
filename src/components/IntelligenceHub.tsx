import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, TrendingUp, TrendingDown, Zap, BarChart3, Users, Monitor, ShieldCheck, Activity } from 'lucide-react';
import { getSystemIntelligence } from '../services/aiService';
import { formatarDinheiro } from '../lib/utils';
import { motion } from 'motion/react';
import { EgmanLogo } from './EgmanLogo';

interface Props {
  transacoes: any[];
  maquinas: any[];
  funcionarios: any[];
  produtos: any[];
  sessoes: any[];
  config: any;
  onAIAction: (call: any) => Promise<void>;
}

export function IntelligenceHub({ transacoes, maquinas, funcionarios, produtos, sessoes, config, onAIAction }: Props) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const appState = { transacoes, maquinas, funcionarios, produtos, sessoes, config };

  useEffect(() => {
    fetchInsights();
  }, [transacoes]);

  const fetchInsights = async () => {
    if (!navigator.onLine) {
      setInsights(["Modo Offline: Usando apenas análise local de dados.", "Sincronização pendente até haver internet."]);
      setLoadingInsights(false);
      return;
    }
    setLoadingInsights(true);
    const res = await getSystemIntelligence(appState);
    if (!res || res.length === 0) {
      setInsights(["Análise local ativa.", "Processamento inteligente aguardando rede estável."]);
    } else {
      setInsights(res);
    }
    setLoadingInsights(false);
  };

  // Predictive Logic
  const calculateTrends = () => {
    const agora = new Date();
    const currentYear = agora.getFullYear();
    const currentMonth = agora.getMonth();
    
    const transacoesMes = transacoes.filter(t => {
      const parts = t.data.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      return year === currentYear && month === currentMonth;
    });
    const faturasMes = transacoesMes.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
    
    // Simple projection
    const diaMes = agora.getDate();
    const mediaDiaria = faturasMes / (diaMes || 1);
    const estimativaMensal = mediaDiaria * 30;

    // Previous month logic
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    const transacoesMesPassado = transacoes.filter(t => {
      const parts = t.data.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      return year === prevYear && month === prevMonth;
    });
    const faturasMesPassado = transacoesMesPassado.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
    
    const crescimento = faturasMesPassado > 0 ? ((faturasMes - faturasMesPassado) / faturasMesPassado) * 100 : 0;

    return { estimativaMensal, crescimento, faturasMes };
  };

  // Cálculos de Performance
  const getMachineStats = () => {
    const stats: Record<string, number> = {};
    // Considerar todas as entradas financeiras associadas a uma máquina (Sessões)
    transacoes.filter(t => t.tipo === 'entrada' && t.maquinaId).forEach(t => {
      stats[t.maquinaId] = (stats[t.maquinaId] || 0) + t.valor;
    });
    
    return Object.entries(stats).map(([id, val]) => {
      const maquina = maquinas.find(m => m.id === id);
      return { nome: maquina?.nome || 'Desconhecida', total: val };
    }).sort((a, b) => b.total - a.total);
  };

  const getStaffStats = () => {
    const stats: Record<string, number> = {};
    // Somar todas as vendas de produtos e sessões finalizadas por cada funcionário
    transacoes.filter(t => t.tipo === 'entrada' && t.funcionarioId).forEach(t => {
      stats[t.funcionarioId] = (stats[t.funcionarioId] || 0) + t.valor;
    });

    return Object.entries(stats).map(([id, val]) => {
        const func = funcionarios.find(f => f.id === id);
        return { nome: func?.nome || 'Desconhecido', total: val };
    }).sort((a, b) => b.total - a.total);
  };

  const machineStats = getMachineStats();
  const staffStats = getStaffStats();
  const maquinaLider = machineStats[0];
  const funcionarioLider = staffStats[0];

  // Cálculo de Produtos Mais Vendidos
  const getTopProducts = () => {
    const stats: Record<string, number> = {};
    transacoes.filter(t => t.tipo === 'entrada' && t.tipoVenda === 'produto' && t.produtoId).forEach(t => {
      stats[t.produtoId] = (stats[t.produtoId] || 0) + 1;
    });
    return Object.entries(stats).map(([id, qty]) => {
      const prod = produtos?.find((p: any) => p.id === id);
      return { nome: prod?.nome || 'Produto', qty };
    }).sort((a, b) => b.qty - a.qty);
  };

  const topProducts = getTopProducts();
  const maxQty = topProducts[0]?.qty || 1;
  const trends = calculateTrends();

  const getExpensesByCategory = () => {
    const cats: Record<string, number> = {};
    const despesas = transacoes.filter(t => t.tipo === 'despesa');
    despesas.forEach(t => {
      cats[t.categoria] = (cats[t.categoria] || 0) + t.valor;
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  };

  const expensesByCategory = getExpensesByCategory();
  const totalDespesas = expensesByCategory.reduce((acc, c) => acc + c[1], 0);

  return (
    <div className="p-4 flex flex-col gap-6 animate-in fade-in pb-24">
      {/* Resumo Proativo de Inteligência */}
      <section className="bg-gradient-to-br from-indigo-900/40 to-blue-900/20 border border-indigo-500/30 p-5 rounded-3xl relative overflow-hidden">
        <Sparkles className="absolute -right-4 -top-4 text-indigo-500/20" size={120} />
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/40">
            <BrainCircuit size={20} className="text-white" />
          </div>
          <h2 className="text-white font-black uppercase tracking-widest text-sm">Insights Estratégicos</h2>
          {loadingInsights && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin ml-auto" />}
        </div>

        <div className="flex flex-wrap gap-2">
          {insights.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-900/60 backdrop-blur-sm border border-indigo-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3"
            >
              <Zap size={14} className="text-yellow-400" />
              <span className="text-xs text-indigo-100 font-medium">{msg}</span>
            </motion.div>
          ))}
          {insights.length === 0 && !loadingInsights && (
            <div className="flex items-center gap-3 opacity-50 p-2">
               <Activity size={16} className="text-indigo-400 animate-pulse" />
               <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">A analisar fluxo de dados em tempo real...</p>
            </div>
          )}
        </div>
      </section>

      {/* Grid de Métricas Avançadas */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Machine Performance */}
        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl">
           <div className="flex items-center gap-2 mb-4">
              <Monitor size={18} className="text-indigo-500" />
              <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Rentabilidade de Máquinas</h3>
           </div>
           <div className="space-y-3">
              {machineStats.slice(0, 3).map((m, i) => (
                <div key={i} className="space-y-1">
                   <div className="flex justify-between text-[11px] font-bold text-gray-300">
                      <span>{m.nome}</span>
                      <span>{formatarDinheiro(m.total)}</span>
                   </div>
                   <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${(m.total / (maquinaLider?.total || 1)) * 100}%` }}
                      />
                   </div>
                </div>
              ))}
              {machineStats.length === 0 && <p className="text-[10px] text-gray-600 text-center py-4 uppercase font-black">Sem dados de máquinas</p>}
           </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl">
           <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-emerald-500" />
              <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Produtividade de Staff</h3>
           </div>
           <div className="space-y-3">
              {staffStats.slice(0, 3).map((s, i) => (
                <div key={i} className="space-y-1">
                   <div className="flex justify-between text-[11px] font-bold text-gray-300">
                      <span>{s.nome}</span>
                      <span>{formatarDinheiro(s.total)}</span>
                   </div>
                   <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${(s.total / (funcionarioLider?.total || 1)) * 100}%` }}
                      />
                   </div>
                </div>
              ))}
              {staffStats.length === 0 && <p className="text-[10px] text-gray-600 text-center py-4 uppercase font-black">Sem dados de staff</p>}
           </div>
        </div>
      </section>

      {/* Predictions Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={18} className="text-orange-500" />
            <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Previsão Mensal</h3>
          </div>
          <div className="flex items-end gap-3">
             <span className="text-3xl font-black text-white">{formatarDinheiro(trends.estimativaMensal)}</span>
             <div className={`flex items-center text-[10px] font-black pb-1 ${trends.crescimento >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {trends.crescimento >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(trends.crescimento).toFixed(1)}% vs Mês Anterior
             </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Expectativa para o final do mês corrente com base no fluxo atual.</p>
        </div>

        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-blue-500" />
            <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Estabilidade Financeira</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-200 font-medium">
               {trends.crescimento > 10 ? "A saúde financeira do negócio está excelente, operando com margens elevadas." :
                trends.crescimento > 0 ? "Fluxo de caixa saudável com tendência positiva de consolidação." :
                "Atenção: O fluxo está ligeiramente abaixo da média do período anterior."}
            </p>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${trends.crescimento >= 0 ? 'bg-indigo-500' : 'bg-red-500'}`} 
                 style={{ width: `${Math.max(10, Math.min(100, 50 + trends.crescimento))}%` }} 
               />
            </div>
          </div>
        </div>
      </section>

      {/* Analítica de Custos por Categoria */}
      <section className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
             <BarChart3 size={18} className="text-red-500" />
             <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Estrutura de Custos</h3>
           </div>
           <div className="text-right">
              <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest">Total Gasto</span>
              <span className="text-sm font-black text-white">{formatarDinheiro(totalDespesas)}</span>
           </div>
        </div>

        <div className="space-y-4">
          {expensesByCategory.map(([cat, val]) => (
            <div key={cat} className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-300 font-bold uppercase tracking-tighter">{cat}</span>
                <span className="text-gray-400 font-black">
                  {formatarDinheiro(val)} 
                  <span className="text-[9px] text-gray-600 ml-1">({((val / (totalDespesas || 1)) * 100).toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-2 w-full bg-gray-800/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(val / (totalDespesas || 1)) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-red-500/60 rounded-full"
                />
              </div>
            </div>
          ))}
          {expensesByCategory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-30">
               <BarChart3 size={40} className="text-gray-600" />
               <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Nenhuma despesa registada</p>
            </div>
          )}
        </div>
      </section>

      {/* NOVO: Produtos Mais Vendidos */}
      <section className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-yellow-500" />
          <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Best Sellers (Stock)</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {topProducts.slice(0, 5).map((p, i) => (
            <div key={i} className="bg-gray-800/50 px-3 py-2 rounded-2xl border border-gray-700/50 flex items-center gap-2">
               <span className="text-[10px] font-black text-white">{p.nome}</span>
               <div className="bg-yellow-500/10 px-1.5 py-0.5 rounded-lg">
                  <span className="text-[9px] font-black text-yellow-500">{p.qty}x</span>
               </div>
            </div>
          ))}
          {topProducts.length === 0 && <p className="text-[10px] text-gray-600 py-2 uppercase font-black">Sem vendas de stock</p>}
        </div>
      </section>
    </div>
  );
}
