import React, { useState } from 'react';
import { 
  Package, Plus, Search, AlertTriangle, TrendingDown, 
  Trash2, Edit3, ChevronLeft, Save, Archive, ShoppingBag,
  ArrowDownCircle, ArrowUpCircle, X, Info, Tag, Box
} from 'lucide-react';
import { Produto, Transacao } from '../types';
import { formatarDinheiro, MOEDA } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

interface Props {
  produtos: Produto[];
  transacoes: Transacao[];
  contaNegocio: string;
  onBack: () => void;
  mostrarAlerta: (t: string, m: string) => void;
  registarAuditoria: (acao: string, detalhe: string) => void;
  temaEscuro?: boolean;
}

export function GestaoStock({ produtos, transacoes, contaNegocio, onBack, mostrarAlerta, registarAuditoria, temaEscuro }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editando, setEditando] = useState<Partial<Produto> | null>(null);
  const [isNovo, setIsNovo] = useState(false);

  // Calcula vendas por produto
  const vendasPorProduto = transacoes.reduce((acc, t) => {
    // Tenta identificar o produto pelo nome na descrição ou categoria
    // No AdicionarTransacao, a descrição é "Venda: [Nome do Produto]"
    if (t.tipo === 'entrada' && (t.categoria === 'Consumo (Bar)' || t.categoria === 'Bar / Snacks' || t.descricao?.startsWith('Venda:'))) {
      const nomeProduto = t.descricao?.replace('Venda: ', '') || t.categoria;
      acc[nomeProduto] = (acc[nomeProduto] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const filtered = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totaisPorCategoria = produtos.reduce((acc, p) => {
    const valor = p.stockAtual * p.precoVenda;
    acc[p.categoria] = (acc[p.categoria] || 0) + valor;
    return acc;
  }, {} as Record<string, number>);

  const valorTotalStock = Object.values(totaisPorCategoria).reduce((a, b) => a + b, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando?.nome || !editando?.precoVenda) return;

    try {
      const id = editando.id || Math.random().toString(36).substring(2, 11);
      const data: Produto = {
        id,
        nome: editando.nome!,
        descricao: editando.descricao || '',
        categoria: editando.categoria || 'Geral',
        precoVenda: Number(editando.precoVenda),
        stockAtual: Number(editando.stockAtual ?? 0),
        stockMinimo: Number(editando.stockMinimo ?? 5),
        unidadeMedida: editando.unidadeMedida || 'Unidade',
        ultimaReposicao: editando.ultimaReposicao || new Date().toISOString().split('T')[0]
      };

      await setDoc(doc(db, `artifacts/${appId}/public/data/produtos_${contaNegocio}`, id), data);
      registarAuditoria('GESTÃO_STOCK', `${isNovo ? 'Adicionou' : 'Editou'} produto: ${data.nome}`);
      setEditando(null);
      setIsNovo(false);
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro", "Falha ao gravar produto.");
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tens a certeza que queres apagar ${nome}?`)) {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/produtos_${contaNegocio}`, id));
        registarAuditoria('GESTÃO_STOCK', `Removeu produto: ${nome}`);
      } catch (err) {
        mostrarAlerta("Erro", "Falha ao apagar.");
      }
    }
  };

  const adjustStock = async (p: Produto, amount: number) => {
    const newStock = Math.max(0, p.stockAtual + amount);
    await setDoc(doc(db, `artifacts/${appId}/public/data/produtos_${contaNegocio}`, p.id), {
      ...p,
      stockAtual: newStock,
      ultimaReposicao: amount > 0 ? new Date().toISOString().split('T')[0] : p.ultimaReposicao
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 flex flex-col gap-4 pb-24 ${temaEscuro ? 'text-white' : 'text-gray-900'}`}
    >
      <header className="flex items-center justify-between">
        <button onClick={onBack} className={`p-2 ${temaEscuro ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-600 shadow-sm'} border rounded-full hover:text-white transition-all active:scale-95 shadow-xl`}>
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
            <h2 className={`text-[10px] font-black tracking-[0.2em] ${temaEscuro ? 'text-white' : 'text-gray-900'} uppercase flex items-center justify-center gap-2`}>
              <Box className="text-orange-500" size={14} />
              Stock Inteligente
            </h2>
        </div>
        <button 
          onClick={() => { setEditando({ stockAtual: 0, stockMinimo: 5, unidadeMedida: 'Unidade', categoria: 'Bebidas' }); setIsNovo(true); }}
          className="bg-orange-600 p-2 rounded-full text-white hover:bg-orange-500 shadow-xl shadow-orange-500/20 transition-all active:scale-95"
        >
          <Plus size={16} />
        </button>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-2">
          <div className={`${temaEscuro ? 'bg-gradient-to-br from-emerald-950/40 to-teal-900/10 border-emerald-500/20 shadow-2xl' : 'bg-emerald-50 border-emerald-200 shadow-sm'} border p-4 rounded-[1.5rem] relative overflow-hidden`}>
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-[8px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">Estimativa de Stock (Total Geral)</h3>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-black ${temaEscuro ? 'text-white' : 'text-emerald-900'} tracking-tighter`}>{formatarDinheiro(valorTotalStock).replace('AKZ', '')}</span>
                <span className="text-[10px] font-black text-emerald-500/60 uppercase">{MOEDA}</span>
              </div>
            </div>
          </div>
      </div>

      {/* Totais por Categoria */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {Object.entries(totaisPorCategoria).map(([cat, total]) => (
          <div key={cat} className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-2 px-3 rounded-xl shrink-0`}>
            <p className="text-[6px] text-gray-500 font-black uppercase tracking-widest">{cat}</p>
            <p className={`text-[9px] font-black ${temaEscuro ? 'text-gray-300' : 'text-gray-900'}`}>{formatarDinheiro(total)}</p>
          </div>
        ))}
      </div>

      <div className="relative group">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${temaEscuro ? 'text-gray-700' : 'text-gray-400'}`} size={16} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="PESQUISAR..."
          className={`w-full ${temaEscuro ? 'bg-gray-950 border-gray-900 text-white' : 'bg-gray-100 border-gray-300 text-gray-900 shadow-inner'} border rounded-xl py-3 pl-10 pr-4 text-[10px] font-black placeholder-gray-800 outline-none transition-all uppercase tracking-widest`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, idx) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`${temaEscuro ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} backdrop-blur-md border p-3 rounded-[1.5rem] flex flex-col gap-3 relative overflow-hidden group hover:border-gray-700 transition-all`}
            >
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${p.stockAtual <= p.stockMinimo ? 'bg-red-500/10 text-red-500' : (temaEscuro ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')}`}>
                      <Box size={18} />
                    </div>
                    <div>
                      <h3 className={`text-[11px] font-black ${temaEscuro ? 'text-white' : 'text-gray-900'} uppercase tracking-tight`}>{p.nome}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <span className="text-[7.5px] text-gray-500 font-black uppercase tracking-widest">{p.categoria}</span>
                      </div>
                    </div>
                 </div>
                 <div className="flex gap-1">
                   <button onClick={() => { setEditando(p); setIsNovo(false); }} className={`p-1.5 ${temaEscuro ? 'bg-gray-900 border-gray-800 text-gray-500 hover:text-white' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-900 shadow-sm'} rounded-lg border shadow-lg`}><Edit3 size={12}/></button>
                   <button onClick={() => handleDelete(p.id, p.nome)} className="p-1.5 text-red-500/50 hover:text-red-500 bg-red-500/5 rounded-lg border border-red-500/10"><Trash2 size={12}/></button>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                 <div className={`${temaEscuro ? 'bg-gray-950/80 border-gray-800/50' : 'bg-emerald-50 border-emerald-100'} p-2 rounded-xl border flex flex-col justify-center`}>
                    <span className="text-[7px] text-gray-600 font-black uppercase tracking-[0.2em] mb-0.5">Preço</span>
                    <span className="text-[11px] font-black text-emerald-500 tracking-tighter">{formatarDinheiro(p.precoVenda)}</span>
                 </div>
                 <div className={`${temaEscuro ? 'bg-gray-950/80 border-gray-800/50' : 'bg-gray-50 border-gray-200'} p-2 rounded-xl border flex flex-col justify-center relative overflow-hidden`}>
                    <span className="text-[7px] text-gray-600 font-black uppercase tracking-[0.2em] mb-0.5">Stock</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-black tracking-tighter ${p.stockAtual <= p.stockMinimo ? 'text-red-500' : (temaEscuro ? 'text-gray-200' : 'text-gray-900')}`}>
                        {p.stockAtual} <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">{p.unidadeMedida}</span>
                      </span>
                    </div>
                 </div>
                 <div className={`${temaEscuro ? 'bg-gray-950/80 border-gray-800/50' : 'bg-orange-50 border-orange-100'} p-2 rounded-xl border flex flex-col justify-center`}>
                    <span className="text-[7px] text-gray-600 font-black uppercase tracking-[0.2em] mb-0.5">Vendido</span>
                    <span className="text-[11px] font-black text-orange-500 tracking-tighter">
                      {vendasPorProduto[p.nome] || 0} <span className="text-[7px] opacity-60">ITENS</span>
                    </span>
                 </div>
              </div>

              <div className="flex gap-2">
                 <button 
                   onClick={() => adjustStock(p, 1)}
                   className="flex-1 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-xl text-emerald-500 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                 >
                   <ArrowUpCircle size={12} /> Entr.
                 </button>
                 <button 
                   onClick={() => adjustStock(p, -1)}
                   disabled={p.stockAtual <= 0}
                   className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${p.stockAtual <= 0 ? (temaEscuro ? 'bg-gray-900 text-gray-700 border-gray-850' : 'bg-gray-200 text-gray-400 border-gray-300') + ' cursor-not-allowed' : 'bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500'}`}
                 >
                   <ArrowDownCircle size={12} /> Saída
                 </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className={`text-center py-24 ${temaEscuro ? 'bg-gray-950/50 border-gray-900' : 'bg-gray-50 border-gray-200 shadow-inner'} border-2 border-dashed rounded-[3rem] flex flex-col items-center gap-6 shadow-inner`}>
             <div className={`${temaEscuro ? 'bg-gray-900 text-gray-800 shadow-xl' : 'bg-white text-gray-300 shadow-sm'} w-24 h-24 rounded-[2.5rem] flex items-center justify-center`}>
               <Package size={48} strokeWidth={1.5} />
             </div>
             <div className="space-y-2">
               <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">Armazém Vazio</p>
               <p className="text-[10px] text-gray-600 font-bold max-w-[200px] leading-relaxed">NENHUM ITEM CORRESPONDE À TUA PESQUISA OU STOCK NÃO INICIALIZADO.</p>
             </div>
             <button 
               onClick={() => { setEditando({ stockAtual: 0, stockMinimo: 5, unidadeMedida: 'Unidade', categoria: 'Bebidas' }); setIsNovo(true); }}
               className="mt-4 bg-orange-600 px-8 py-4 rounded-[1.5rem] text-white hover:bg-orange-500 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-orange-500/30 active:scale-95 transition-all"
             >
               <Plus size={20} /> Cadastrar Produto
             </button>
          </div>
        )}
      </div>

      {/* Product Editor Modal */}
      <AnimatePresence>
        {editando && (
          <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-2xl'} border w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative`}
             >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600"></div>
                
                <div className={`p-6 border-b ${temaEscuro ? 'border-gray-800 bg-gray-950/50 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'} flex justify-between items-center`}>
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl"><Plus size={18} /></div>
                     <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">{isNovo ? 'Novo Registo de Item' : 'Editar Propriedades'}</h3>
                   </div>
                   <button onClick={() => setEditando(null)} className={`p-3 ${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border rounded-full text-gray-500 hover:text-white transition-all active:scale-90`}><X size={20}/></button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide pb-10">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <Package size={12} /> Designação do Produto
                      </label>
                      <input 
                        required
                        value={editando.nome || ''} 
                        onChange={e => setEditando({...editando, nome: e.target.value})}
                        className={`w-full ${temaEscuro ? 'bg-gray-950 border-gray-900 text-white' : 'bg-gray-100 border-gray-200 text-gray-900 shadow-inner'} border-2 rounded-2xl p-4 text-sm font-black outline-none focus:border-orange-500 transition-all uppercase tracking-tight`}
                        placeholder="EX: COCA-COLA 330ML"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <Info size={12} /> Especificações / Notas
                      </label>
                      <textarea 
                        value={editando.descricao || ''} 
                        onChange={e => setEditando({...editando, descricao: e.target.value})}
                        className={`w-full ${temaEscuro ? 'bg-gray-950 border-gray-900 text-white' : 'bg-gray-100 border-gray-200 text-gray-900 shadow-inner'} border-2 rounded-2xl p-4 text-sm font-black outline-none focus:border-orange-500 min-h-[100px] transition-all resize-none`}
                        placeholder="DETALHES DO ITEM, MARCA OU LOCALIZAÇÃO NO STOCK..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                          <ShoppingBag size={12} /> Preço (AKZ)
                        </label>
                        <input 
                          type="number"
                          required
                          value={editando.precoVenda || ''} 
                          onChange={e => setEditando({...editando, precoVenda: Number(e.target.value)})}
                          className={`w-full ${temaEscuro ? 'bg-gray-950 border-gray-900 text-emerald-400' : 'bg-gray-100 border-gray-200 text-emerald-600 shadow-inner'} border-2 rounded-2xl p-4 text-lg font-black outline-none focus:border-emerald-500 transition-all tracking-tighter`}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                          <Tag size={12} /> Categoria
                        </label>
                        <select 
                          value={editando.categoria || 'Bebidas'} 
                          onChange={e => setEditando({...editando, categoria: e.target.value})}
                          className={`w-full ${temaEscuro ? 'bg-gray-950 border-gray-900 text-white' : 'bg-gray-100 border-gray-200 text-gray-900 shadow-sm'} border-2 rounded-2xl p-4 text-xs font-black outline-none focus:border-orange-500 transition-all uppercase tracking-widest cursor-pointer`}
                        >
                          <option value="Bebidas">Bebidas</option>
                          <option value="Snacks">Snacks / Alimentos</option>
                          <option value="Acessórios">Acessórios</option>
                          <option value="Serviços">Serviços</option>
                          <option value="Limpeza">Limpeza / Consumo</option>
                          <option value="Geral">Etiqueta Geral</option>
                        </select>
                      </div>
                    </div>

                    <div className={`grid grid-cols-3 gap-3 ${temaEscuro ? 'bg-gray-950/30 border-gray-800/30' : 'bg-gray-100 border-gray-200'} p-5 rounded-3xl border`}>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-700 uppercase tracking-widest block text-center">Quant. Inicial</label>
                        <input 
                          type="number"
                          value={editando.stockAtual ?? 0} 
                          onChange={e => setEditando({...editando, stockAtual: Number(e.target.value)})}
                          className={`w-full ${temaEscuro ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-xl p-3 text-center text-sm font-black outline-none focus:border-orange-500`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-700 uppercase tracking-widest block text-center">Alerta Stock</label>
                        <input 
                          type="number"
                          value={editando.stockMinimo ?? 5} 
                          onChange={e => setEditando({...editando, stockMinimo: Number(e.target.value)})}
                          className={`w-full ${temaEscuro ? 'bg-gray-900 border-gray-800 text-orange-500' : 'bg-white border-gray-200 text-orange-600'} border rounded-xl p-3 text-center text-sm font-black outline-none focus:border-orange-500`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-700 uppercase tracking-widest block text-center">Unidade</label>
                        <input 
                          value={editando.unidadeMedida || 'Unidade'} 
                          onChange={e => setEditando({...editando, unidadeMedida: e.target.value})}
                          className={`w-full ${temaEscuro ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-xl p-3 text-center text-[10px] font-black outline-none focus:border-orange-500 uppercase`}
                          placeholder="LATA"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`pt-4 sticky bottom-0 ${temaEscuro ? 'bg-gray-900' : 'bg-white'} pb-2`}>
                    <button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-5 rounded-3xl shadow-2xl shadow-orange-500/20 transition-all uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      <Save size={20} /> Finalizar Registo
                    </button>
                  </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
