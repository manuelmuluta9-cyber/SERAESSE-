import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Banknote, CreditCard, Landmark, Trash2, Plus, Settings2, ShoppingBag, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { Transacao, Config, Produto } from '../types';
import { obterDataHoje, obterHoraAtual, MOEDA, formatarDinheiro } from '../lib/utils';

interface Props {
  transacaoInicial: Transacao | null;
  onSalvar: (nova: any, produtoId?: string) => void;
  onCancelar: () => void;
  config: Config;
  produtos: Produto[];
  atualizarConfig: (novasConfigs: Partial<Config>) => Promise<void>;
  onApagar: () => void;
  temaEscuro?: boolean;
}

export function AdicionarTransacao({ transacaoInicial, onSalvar, onCancelar, config, produtos, atualizarConfig, onApagar, temaEscuro }: Props) {
  const [tipo, setTipo] = useState<'entrada' | 'despesa'>(transacaoInicial?.tipo || 'entrada');
  const [valor, setValor] = useState(transacaoInicial?.valor.toString() || '');
  const [categoria, setCategoria] = useState(transacaoInicial?.categoria || '');
  const [metodo, setMetodo] = useState(transacaoInicial?.metodo || 'Dinheiro');
  const [descricao, setDescricao] = useState(transacaoInicial?.descricao || '');
  const [data, setData] = useState(transacaoInicial?.data || obterDataHoje());
  const [gerirCategorias, setGerirCategorias] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [mostrarProdutos, setMostrarProdutos] = useState(false);
  
  const metodosPagamento = [
    {id: 'Dinheiro', icon: Banknote},
    {id: 'Multicaixa', icon: CreditCard},
    {id: 'Transferência', icon: Landmark}
  ];
  
  const listaCategorias = tipo === 'entrada' ? config.categoriasEntrada : config.categoriasDespesa;

  useEffect(() => { setCategoria(''); setGerirCategorias(false); }, [tipo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); if (!valor || !categoria) return;
    onSalvar({ 
      tipo, 
      valor: parseFloat(valor), 
      categoria, 
      metodo, 
      descricao: descricao.trim(), 
      data, 
      hora: transacaoInicial?.hora || obterHoraAtual(),
      produtoId: produtoSelecionado?.id
    }, produtoSelecionado?.id);
  };

  const handleSalvarNovaCategoria = () => {
    if(!novaCatNome.trim()) return;
    const fieldName = tipo === 'entrada' ? 'categoriasEntrada' : 'categoriasDespesa';
    if (!listaCategorias.includes(novaCatNome.trim())) {
        atualizarConfig({ [fieldName]: [...listaCategorias, novaCatNome.trim()] });
    }
    setNovaCatNome('');
  };

  const removerCategoria = (catParaRemover: string) => {
    const fieldName = tipo === 'entrada' ? 'categoriasEntrada' : 'categoriasDespesa';
    atualizarConfig({ [fieldName]: listaCategorias.filter(c => c !== catParaRemover) });
    if (categoria === catParaRemover) setCategoria('');
  };

  if (gerirCategorias) {
    return (
      <div className="p-4 animate-in slide-in-from-right duration-300">
         <div className="flex items-center justify-between mb-8">
            <button type="button" onClick={() => setGerirCategorias(false)} className={`p-2.5 ${temaEscuro ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-600 shadow-sm'} border rounded-full hover:text-orange-500 transition-all active:scale-95`}>
              <ChevronLeft size={20} />
            </button>
            <h2 className={`text-sm font-black tracking-[0.2em] ${temaEscuro ? 'text-white' : 'text-gray-900'} uppercase text-center flex-1`}>Gestão de Categorias</h2>
            <div className="w-10"></div>
         </div>
         <div className={`flex ${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-200 shadow-inner'} border rounded-2xl p-1.5 mb-6 shadow-inner`}>
           <button type="button" onClick={() => setTipo('entrada')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${tipo === 'entrada' ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20' : 'text-gray-500'}`}>Receitas</button>
           <button type="button" onClick={() => setTipo('despesa')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${tipo === 'despesa' ? 'bg-red-500 text-red-950 shadow-lg shadow-red-500/20' : 'text-gray-500'}`}>Despesas</button>
         </div>
         <div className="flex gap-2 mb-8">
            <input value={novaCatNome} onChange={e => setNovaCatNome(e.target.value)} placeholder="Nova etiqueta..." className={`flex-1 ${temaEscuro ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'} border p-4 rounded-2xl text-sm font-black outline-none focus:border-orange-500 transition-all shadow-inner`} />
            <button type="button" onClick={handleSalvarNovaCategoria} disabled={!novaCatNome.trim()} className={`p-4 rounded-2xl transition-all shadow-xl active:scale-95 ${novaCatNome.trim() ? 'bg-orange-600 text-white hover:bg-orange-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
               <Plus size={24}/>
            </button>
         </div>
         <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 ml-1">Etiquetas Existentes</p>
         <div className="flex flex-col gap-3">
             {listaCategorias.map(cat => (
               <motion.div layout key={cat} className={`flex justify-between items-center ${temaEscuro ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} backdrop-blur-sm border p-4 rounded-2xl group hover:border-gray-700 transition-all`}>
                  <div className="flex items-center gap-3">
                    <Tag size={14} className="text-gray-600" />
                    <span className={`font-extrabold ${temaEscuro ? 'text-gray-300' : 'text-gray-800'} text-sm uppercase tracking-tight`}>{cat}</span>
                  </div>
                  <button type="button" onClick={() => removerCategoria(cat)} className="text-red-500 bg-red-500/5 p-2.5 rounded-xl hover:bg-red-500/20 transition-all">
                    <Trash2 size={16}/>
                  </button>
               </motion.div>
             ))}
             {listaCategorias.length === 0 && <div className={`text-center py-10 ${temaEscuro ? 'bg-gray-900/30 border-gray-800' : 'bg-gray-50 border-gray-200'} border-2 border-dashed rounded-3xl`}><p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Nenhuma categoria configurada.</p></div>}
         </div>
      </div>
    );
  }

  return (
    <div className="p-3 animate-in slide-in-from-right duration-300 pb-10">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={onCancelar} className={`p-2 ${temaEscuro ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-600 shadow-sm'} border rounded-full hover:text-orange-500 transition-all active:scale-95`}>
          <ChevronLeft size={16} />
        </button>
        <h2 className={`text-[10px] font-black tracking-[0.2em] ${temaEscuro ? 'text-white' : 'text-gray-900'} uppercase`}>{transacaoInicial ? 'Modificar Registo' : 'Novo Lançamento'}</h2>
        <div className="w-8"></div>
      </div>

      <div className={`flex ${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-300 shadow-inner'} border rounded-xl p-1 mb-4`}>
        <button type="button" onClick={() => setTipo('entrada')} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${tipo === 'entrada' ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20' : 'text-gray-500 font-bold'}`}>Receita</button>
        <button type="button" onClick={() => setTipo('despesa')} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${tipo === 'despesa' ? 'bg-red-500 text-red-950 shadow-lg shadow-red-500/20' : 'text-gray-500 font-bold'}`}>Despesa</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <motion.div 
          layout
          className={`p-3 rounded-[1.5rem] border transition-all shadow-xl relative overflow-hidden ${tipo === 'entrada' ? (temaEscuro ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200') : (temaEscuro ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50 border-red-200')}`}
        >
          <label className={`text-[8px] font-black uppercase tracking-[0.2em] block mb-1.5 ml-1 ${tipo === 'entrada' ? 'text-emerald-500/60' : 'text-red-500/60'}`}>Monto ({MOEDA})</label>
          <div className="flex items-center gap-2">
             <span className="text-sm font-black text-gray-600">AKZ</span>
             <input 
               type="number" 
               value={valor} 
               onChange={(e) => setValor(e.target.value)} 
               className={`w-full bg-transparent text-2xl font-black ${temaEscuro ? 'text-white' : 'text-gray-900'} outline-none placeholder-gray-800 tracking-tighter`}
               placeholder="0" 
               autoFocus 
               required 
               disabled={!!produtoSelecionado} 
             />
          </div>
        </motion.div>

        {tipo === 'entrada' && (categoria === 'Consumo (Bar)' || categoria === 'Bar / Snacks') && (
          <div className={`${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-300 shadow-inner'} border rounded-[2rem] overflow-hidden`}>
             <button 
               type="button"
               onClick={() => setMostrarProdutos(!mostrarProdutos)}
               className="w-full p-5 flex items-center justify-between hover:bg-gray-900/50 transition-all group"
             >
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform">
                      <ShoppingBag size={22} />
                   </div>
                   <div className="text-left">
                      <span className="block text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-0.5">Catálogo de Venda</span>
                      <span className={`text-sm font-black ${temaEscuro ? 'text-white' : 'text-gray-900'} uppercase tracking-tight`}>{produtoSelecionado ? produtoSelecionado.nome : 'Selecionar Item'}</span>
                   </div>
                </div>
                <div className={`${temaEscuro ? 'bg-gray-900' : 'bg-white shadow-sm'} p-2 rounded-xl`}>
                  {mostrarProdutos ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
             </button>

             <AnimatePresence mode="wait">
                {mostrarProdutos ? (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={`p-4 border-t ${temaEscuro ? 'border-gray-800/50' : 'border-gray-300/50'} space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide py-4`}>
                       {produtos.map(p => (
                         <button 
                           key={p.id}
                           type="button"
                           disabled={p.stockAtual <= 0}
                           onClick={() => {
                              setProdutoSelecionado(p);
                              setValor(p.precoVenda.toString());
                              setDescricao(`Venda: ${p.nome}`);
                              setMostrarProdutos(false);
                           }}
                           className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${produtoSelecionado?.id === p.id ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/20' : (temaEscuro ? 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-500 shadow-sm')} ${p.stockAtual <= 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                         >
                            <div className="text-left">
                               <div className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                                 {p.nome} 
                                 <span className={`px-2 py-0.5 rounded-full text-[9px] ${p.stockAtual > p.stockMinimo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>STOCK: {p.stockAtual}</span>
                               </div>
                               <div className="text-[9px] font-bold opacity-60 uppercase mt-1 tracking-widest">{p.categoria}</div>
                            </div>
                            <div className="text-sm font-black font-mono tracking-tighter">{formatarDinheiro(p.precoVenda)}</div>
                         </button>
                       ))}
                    </div>
                  </motion.div>
                ) : null}
             </AnimatePresence>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Tag size={10} className="text-gray-700" />
              Etiqueta
            </label>
            <button type="button" onClick={() => setGerirCategorias(true)} className="text-[8px] font-black text-orange-500 hover:text-orange-400 uppercase tracking-widest flex items-center gap-1 transition-colors">
              <Settings2 size={10}/> Ajustar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
             {listaCategorias.map(cat => (
               <button 
                 key={cat} 
                 type="button" 
                 onClick={() => { setCategoria(cat); setProdutoSelecionado(null); }} 
                 className={`px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl border transition-all active:scale-95 ${categoria === cat ? (tipo === 'entrada' ? 'bg-emerald-500 text-emerald-950 border-emerald-500' : 'bg-red-500 text-red-950 border-red-500') : (temaEscuro ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-white border-gray-200 text-gray-600 shadow-sm')}`}
               >
                 {cat}
               </button>
             ))}
          </div>
        </div>

        <div className={`${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-300 shadow-inner'} border p-2 rounded-xl`}>
          <label className="text-[7px] text-gray-600 font-black uppercase tracking-[0.2em] block mb-1 px-1">Notas</label>
          <div className="flex items-center gap-2">
             <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Opcional..." className={`w-full bg-transparent ${temaEscuro ? 'text-white' : 'text-gray-900'} font-bold text-[10px] outline-none placeholder-gray-800`} />
          </div>
        </div>

        {tipo === 'entrada' && (
          <div className="space-y-2">
            <label className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] px-1">Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {metodosPagamento.map(met => (
                <button 
                  key={met.id} 
                  type="button" 
                  onClick={() => setMetodo(met.id)} 
                  className={`flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all active:scale-95 ${metodo === met.id ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-xl' : (temaEscuro ? 'bg-gray-900 border-gray-800 text-gray-600' : 'bg-white border-gray-200 text-gray-400 shadow-sm')}`}
                >
                  <met.icon size={16} className={metodo === met.id ? 'text-orange-500' : 'text-gray-700'} />
                  <span className="text-[8px] font-black uppercase tracking-widest">{met.id}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-300 shadow-inner'} border p-2 rounded-xl mb-2`}>
          <label className="text-[7px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-1 px-1">Data</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`w-full bg-transparent ${temaEscuro ? 'text-white' : 'text-gray-900'} font-black text-[10px] outline-none cursor-pointer`} />
        </div>
        
        <div className="flex gap-2 pt-2 sticky bottom-2 z-10">
          {transacaoInicial && (
            <button 
              type="button" 
              onClick={onApagar} 
              className="p-4 rounded-2xl bg-red-500/5 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button 
            type="submit" 
            disabled={!valor || !categoria} 
            className={`flex-1 py-3.5 rounded-2xl font-black tracking-[0.3em] text-[9px] shadow-xl transition-all active:scale-[0.98] ${(!valor || !categoria) ? 'bg-gray-800 text-gray-600' : (tipo === 'entrada' ? 'bg-emerald-500 text-emerald-950 shadow-emerald-500/20' : 'bg-red-500 text-red-950 shadow-red-500/20')}`}
          >
            {transacaoInicial ? 'SALVAR' : `REGISTAR ${tipo.toUpperCase()}`}
          </button>
        </div>
      </form>
    </div>
  );
}
