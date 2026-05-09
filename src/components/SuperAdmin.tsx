import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Banknote, Clock, Search, ChevronDown, 
  ChevronUp, Edit3, Trash2, X, Save, MessageSquare, 
  Ban, CheckCircle2, TrendingUp, Filter, Copy, Key, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, query, getDocs, doc, updateDoc, 
  deleteDoc, onSnapshot, orderBy, where, getDoc,
  Timestamp, setDoc
} from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import { formatarDinheiro } from '../lib/utils';
import { EgmanLogo } from './EgmanLogo';
import { GlobalNotifications } from './GlobalNotifications';

interface Cliente {
  id: string; // email as ID usually
  email: string;
  assinatura: {
    ativa: boolean;
    expiracao: string;
    razao: string;
    pendente: boolean;
    comprovativoUrl?: string;
    mensagem?: string;
    meses?: number;
  };
  criadoEm: number;
  password?: string;
}

interface SuperAdminProps {
  onSair: () => void;
  temaEscuro: boolean;
}

export function SuperAdmin({ onSair, temaEscuro }: SuperAdminProps) {
  const [aba, setAba] = useState<'global' | 'clientes' | 'validacoes' | 'avisos'>('global');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [avisosGerais, setAvisosGerais] = useState<any[]>([]);
  const [novoAviso, setNovoAviso] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [tipoDestino, setTipoDestino] = useState<'geral' | 'especifico'>('geral');
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [clienteExpandido, setClienteExpandido] = useState<string | null>(null);
  const [faturacaoReal, setFaturacaoReal] = useState(0);
  const [custoMmrBase, setCustoMmrBase] = useState(9000);
  const [editandoStats, setEditandoStats] = useState(false);
  const [tempFatura, setTempFatura] = useState('');
  const [tempMmr, setTempMmr] = useState('');
  const [comprovativoFull, setComprovativoFull] = useState<string | null>(null);

  // Estados para inputs manuais de edição
  const [editState, setEditState] = useState<Record<string, { date: string; pass: string; msg: string }>>({});

  const ACCOUNTS_PATH = `artifacts/${appId}/public/data/contas`;
  const STATS_PATH = `artifacts/${appId}/public/data/admin_stats`;
  const ANNOUNCEMENTS_PATH = `artifacts/${appId}/public/data/announcements`;

  const toggleSelecao = (id: string) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const enviarAviso = async () => {
    if (!novoAviso.trim()) return;
    
    try {
      if (tipoDestino === 'geral') {
        await setDoc(doc(collection(db, ANNOUNCEMENTS_PATH)), {
          texto: novoAviso,
          timestamp: Date.now(),
          autor: 'Cloud Admin'
        });
        alert('Aviso Geral publicado!');
      } else {
        if (selecionados.length === 0) return alert('Selecione pelo menos um cliente.');
        
        const promises = selecionados.map(id => 
          updateDoc(doc(db, ACCOUNTS_PATH, id), {
            mensagemAdmin: novoAviso
          })
        );
        await Promise.all(promises);
        alert(`Mensagem enviada para ${selecionados.length} cliente(s)!`);
      }
      setNovoAviso('');
      setSelecionados([]);
    } catch (err) {
      alert('Erro ao enviar.');
    }
  };

  // Stats
  const [stats, setStats] = useState({
    mrr: 0,
    lojasAtivas: 0,
    pendentes: 0,
    inativas: 0
  });

  useEffect(() => {
    // Escutar Avisos Gerais
    const qAvisos = query(collection(db, ANNOUNCEMENTS_PATH), orderBy('timestamp', 'desc'));
    const unsubAvisos = onSnapshot(qAvisos, (snap) => {
      setAvisosGerais(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Escutar Stats Globais
    const unsubStats = onSnapshot(doc(db, STATS_PATH, 'global'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setFaturacaoReal(data.totalFaturado || 0);
        setCustoMmrBase(data.custoMmrBase || 9000);
        setTempFatura((data.totalFaturado || 0).toString());
        setTempMmr((data.custoMmrBase || 9000).toString());
      }
    });

    const q = query(collection(db, ACCOUNTS_PATH));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        const expMs = data.dataExpiracao || 0;
        const estaAtiva = data.ativo !== false && expMs > Date.now();
        
        return { 
          id: d.id, 
          email: data.email || d.id,
          assinatura: {
            ativa: estaAtiva,
            expiracao: new Date(expMs || Date.now()).toISOString(),
            razao: data.plano || 'Standard',
            pendente: !!data.pagamentoPendente,
            comprovativoUrl: data.pagamentoPendente?.comprovativo,
            mensagem: data.pagamentoPendente?.mensagem,
            meses: data.pagamentoPendente?.meses
          },
          criadoEm: data.criadoEm || 0,
          password: data.password
        } as Cliente;
      });
      setClientes(docs);
      
      // Inicializar estados de edição se necessário
      setEditState(prev => {
        const next = { ...prev };
        docs.forEach(c => {
          if (!next[c.id]) {
            next[c.id] = { 
              date: new Date(c.assinatura.expiracao).toISOString().split('T')[0], 
              pass: '',
              msg: ''
            };
          }
        });
        return next;
      });
      
      // Calcular Stats
      let ativas = 0;
      let inativas = 0;
      let pendentes = 0;
      let mrr = 0;

      docs.forEach(c => {
        if (c.assinatura?.ativa) ativas++;
        else inativas++;
        if (c.assinatura?.pendente) pendentes++;
      });

      // Cálculo do MRR dinâmico baseado no custo base guardado
      const mrrCalculado = ativas * custoMmrBase;

      setStats({ lojasAtivas: ativas, inativas, pendentes, mrr: mrrCalculado });
      setCarregando(false);
    });

    return () => {
      unsubscribe();
      unsubStats();
    };
  }, []);

  const incrementarFaturacao = async (valor: number) => {
    try {
      const docRef = doc(db, STATS_PATH, 'global');
      const snap = await getDoc(docRef);
      const atual = snap.exists() ? (snap.data().totalFaturado || 0) : 0;
      await setDoc(docRef, { totalFaturado: atual + valor }, { merge: true });
    } catch (err) {
      console.error('Erro ao somar fatura:', err);
    }
  };

  const salvarStatsManuais = async () => {
    const fat = parseFloat(tempFatura);
    const mmr = parseFloat(tempMmr);
    
    if (isNaN(fat) || isNaN(mmr)) return alert('Valores inválidos.');

    try {
      await setDoc(doc(db, STATS_PATH, 'global'), { 
        totalFaturado: fat,
        custoMmrBase: mmr
      }, { merge: true });
      setEditandoStats(false);
      alert('Estatísticas atualizadas!');
    } catch (err) {
      alert('Erro ao guardar.');
    }
  };

  const ajustarAssinatura = async (clienteId: string, meses: number) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;

    // Use current expiration if it's in the future, otherwise use now
    const currentExp = new Date(cliente.assinatura.expiracao).getTime();
    const baseTimeMs = Math.max(Date.now(), currentExp);
    
    // Add exactly 'meses' months
    const d = new Date(baseTimeMs);
    d.setMonth(d.getMonth() + meses);
    const novaExpMs = d.getTime();
    
    try {
      await updateDoc(doc(db, ACCOUNTS_PATH, clienteId), {
        dataExpiracao: novaExpMs,
        ativo: true,
        pagamentoPendente: null,
        plano: 'Acesso Premium'
      });
      
      // Se for meses positivos, somamos à faturação (considerando 3000 Kz/mês base)
      if (meses > 0) {
        await incrementarFaturacao(meses * 3000);
      }
      
      // Atualizar local state do input de data para refletir a mudança
      const newDateStr = new Date(novaExpMs).toISOString().split('T')[0];
      setEditState(prev => ({
        ...prev,
        [clienteId]: { ...prev[clienteId], date: newDateStr }
      }));

      alert('Assinatura atualizada!');
    } catch (err) {
      alert('Erro ao atualizar assinatura.');
    }
  };

  const definirDataExata = async (clienteId: string) => {
    const dataStr = editState[clienteId]?.date;
    if (!dataStr) return alert('Selecione uma data.');

    try {
      // Definir para o final do dia (23:59:59) para evitar confusão
      const d = new Date(dataStr);
      d.setHours(23, 59, 59, 999);
      const timestamp = d.getTime();

      await updateDoc(doc(db, ACCOUNTS_PATH, clienteId), {
        dataExpiracao: timestamp,
        ativo: true,
        pagamentoPendente: null,
        plano: 'Acesso Premium'
      });
      alert('Data definida!');
    } catch (err) {
      alert('Erro ao definir data.');
    }
  };

  const alterarPasswordManual = async (clienteId: string) => {
    const novaVal = editState[clienteId]?.pass;
    if (!novaVal || novaVal.trim().length < 4) return alert('A password deve ter pelo menos 4 caracteres.');

    try {
      await updateDoc(doc(db, ACCOUNTS_PATH, clienteId), {
        password: novaVal.trim()
      });
      
      // Limpar input após sucesso
      setEditState(prev => ({
        ...prev,
        [clienteId]: { ...prev[clienteId], pass: '' }
      }));
      
      alert('Password alterada com sucesso!');
    } catch (err) {
      alert('Erro ao alterar password.');
    }
  };

  const alterarPassword = async (clienteId: string) => {
    const nova = prompt('Nova password para este cliente:');
    if (!nova) return;
    try {
      await updateDoc(doc(db, ACCOUNTS_PATH, clienteId), {
        password: nova
      });
      alert('Password alterada!');
    } catch (err) {
      alert('Erro ao alterar password.');
    }
  };

  const cortarAcesso = async (clienteId: string) => {
    if (!confirm('Cortar acesso imediatamente?')) return;
    try {
      await updateDoc(doc(db, ACCOUNTS_PATH, clienteId), {
        ativo: false,
        dataExpiracao: Date.now() - 1000
      });
    } catch (err) {
      alert('Erro ao cortar acesso.');
    }
  };

  const aprovarPagamento = async (clienteId: string, mesesSugestao: number) => {
    if (!confirm(`Aprovar este pagamento e ativar ${mesesSugestao} mês(es)?`)) return;
    await ajustarAssinatura(clienteId, mesesSugestao);
  };

  const rejeitarPagamento = async (clienteId: string) => {
    if (!confirm('Rejeitar pagamento?')) return;
    try {
      await updateDoc(doc(db, ACCOUNTS_PATH, clienteId), {
        pagamentoPendente: null
      });
    } catch (err) {
      alert('Erro ao rejeitar.');
    }
  };

  const enviarMensagemManual = async (clienteId: string) => {
    const msg = editState[clienteId]?.msg;
    if (!msg || msg.trim().length < 2) return alert('Escreva uma mensagem válida.');
    
    try {
      await updateDoc(doc(db, ACCOUNTS_PATH, clienteId), {
        mensagemAdmin: msg.trim()
      });
      
      setEditState(prev => ({
        ...prev,
        [clienteId]: { ...prev[clienteId], msg: '' }
      }));
      
      alert('Mensagem enviada com sucesso!');
    } catch (err) {
      alert('Erro ao enviar mensagem.');
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[1000] bg-[#05080c] flex flex-col overflow-hidden text-white font-sans">
      {/* Header Estilo Cloud Admin */}
      <header className="p-6 bg-[#0a0f18] border-b border-indigo-500/20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-widest leading-none">Cloud Admin</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter mt-1">Torre de Controlo</p>
          </div>
        </div>
        <button 
          onClick={onSair}
          className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-2 active:scale-95 transition-all"
        >
          <Ban size={14} /> Sair
        </button>
      </header>

      {/* Navegação Topo */}
      <div className="flex p-4 gap-2 bg-[#0a0f18]/50 shrink-0">
        <button 
          onClick={() => setAba('global')}
          className={`flex-1 py-3 rounded-2xl flex items-center justify-center transition-all ${aba === 'global' ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-gray-900 border border-gray-800 text-gray-500'}`}
        >
          <TrendingUp size={20} />
        </button>
        <button 
          onClick={() => setAba('clientes')}
          className={`flex-1 py-3 rounded-2xl flex items-center justify-center transition-all ${aba === 'clientes' ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-gray-900 border border-gray-800 text-gray-500'}`}
        >
          <Users size={20} />
        </button>
        <button 
          onClick={() => setAba('validacoes')}
          className={`flex-1 py-3 rounded-2xl flex items-center justify-center transition-all relative ${aba === 'validacoes' ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-gray-900 border border-gray-800 text-gray-500'}`}
        >
          <Banknote size={20} />
          {stats.pendentes > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full text-[8px] font-black flex items-center justify-center animate-bounce">
              {stats.pendentes}
            </span>
          )}
        </button>
        <button 
          onClick={() => setAba('avisos')}
          className={`flex-1 py-3 rounded-2xl flex items-center justify-center transition-all relative ${aba === 'avisos' ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-gray-900 border border-gray-800 text-gray-500'}`}
        >
          <MessageSquare size={20} />
        </button>
      </div>

      <main className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {aba === 'global' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <EgmanLogo size={20} /> Visão Global
              </h2>
              <button 
                onClick={() => setEditandoStats(!editandoStats)}
                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${editandoStats ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-900 text-indigo-400 border-indigo-500/20'}`}
              >
                {editandoStats ? 'Cancelar Edição' : 'Ajustar Valores'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {editandoStats ? (
                <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-[32px] flex flex-col gap-4 animate-in slide-in-from-top-4">
                  <div>
                    <label className="text-[10px] text-indigo-400 font-black uppercase mb-1 block">Faturação Total (Kz):</label>
                    <input 
                      type="number" 
                      value={tempFatura}
                      onChange={(e) => setTempFatura(e.target.value)}
                      className="w-full bg-[#05080c] border border-indigo-500/20 rounded-xl p-3 text-lg font-black text-indigo-400 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-indigo-400 font-black uppercase mb-1 block">Custo Mensal p/ Loja (Kz):</label>
                    <input 
                      type="number" 
                      value={tempMmr}
                      onChange={(e) => setTempMmr(e.target.value)}
                      className="w-full bg-[#05080c] border border-indigo-500/20 rounded-xl p-3 text-lg font-black text-indigo-400 focus:border-indigo-500 outline-none"
                    />
                    <p className="text-[8px] text-gray-500 mt-1 uppercase font-bold">Esse valor será multiplicado pelas lojas ativas para estimar o MRR.</p>
                  </div>
                  <button 
                    onClick={salvarStatsManuais}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95"
                  >
                    Salvar Alterações
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-[#0a0f18] p-6 rounded-[32px] border border-indigo-500/10 shadow-xl relative overflow-hidden group transition-all">
                    <TrendingUp className="absolute -right-4 -bottom-4 text-indigo-500/5 group-hover:scale-110 transition-transform" size={120} />
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Faturação Total (Real)</p>
                    <h3 className="text-3xl font-black text-indigo-400">{formatarDinheiro(faturacaoReal)}</h3>
                  </div>

                  <div className="bg-gray-900/20 p-5 rounded-[28px] border border-gray-800">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">MRR Mensal Estimativo ({stats.lojasAtivas} lojas)</p>
                    <h3 className="text-xl font-black text-gray-300">
                      {formatarDinheiro(stats.mrr)}
                      <span className="text-[10px] text-gray-600 ml-2 font-bold">(Base: {formatarDinheiro(custoMmrBase)}/mês)</span>
                    </h3>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 p-5 rounded-[28px] border border-emerald-500/10">
                   <CheckCircle2 size={18} className="text-emerald-500 mb-2" />
                   <p className="text-[9px] text-emerald-500/60 font-black uppercase tracking-widest mb-1">Lojas Ativas</p>
                   <p className="text-2xl font-black text-white">{stats.lojasAtivas}</p>
                </div>
                <div className="bg-orange-500/5 p-5 rounded-[28px] border border-orange-500/10">
                   <Clock size={18} className="text-orange-500 mb-2" />
                   <p className="text-[9px] text-orange-500/60 font-black uppercase tracking-widest mb-1">Pendentes</p>
                   <p className="text-2xl font-black text-white">{stats.pendentes}</p>
                </div>
              </div>

              <div className="bg-red-500/5 p-5 rounded-[28px] border border-red-500/10">
                 <Ban size={18} className="text-red-500 mb-2" />
                 <p className="text-[9px] text-red-500/60 font-black uppercase tracking-widest mb-1">Lojas Inativas</p>
                 <p className="text-2xl font-black text-white">{stats.inativas}</p>
              </div>
            </div>

            <section>
              <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Lojas Ativas Recentemente</h4>
              <div className="flex flex-col gap-3">
                {clientes.filter(c => c.assinatura.ativa).slice(0, 5).map(c => (
                  <div key={c.id} className="bg-gray-900/40 p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-gray-200">{c.email}</p>
                      <p className="text-[8px] text-emerald-500 font-bold uppercase mt-0.5">Expira a: {new Date(c.assinatura.expiracao).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[8px] font-black bg-gray-800 px-2 py-1 rounded-lg text-gray-400 uppercase tracking-widest">Premium</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {aba === 'clientes' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar loja..."
                  className="w-full bg-gray-900 border border-gray-800 pl-12 pr-4 py-4 rounded-2xl text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                />
             </div>

             <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Base de Dados</h3>
                <div className="flex gap-2">
                   <button 
                    onClick={() => setSelecionados(clientesFiltrados.map(c => c.id))}
                    className="text-[8px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 active:scale-95 transition-all"
                   >
                    Selecionar Tudo
                   </button>
                   <button 
                    onClick={() => setSelecionados([])}
                    className="text-[8px] text-gray-500 font-black uppercase tracking-widest bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700 active:scale-95 transition-all"
                   >
                    Limpar
                   </button>
                </div>
             </div>

             <div className="flex flex-col gap-3">
                {clientesFiltrados.map(c => {

                  const expandida = clienteExpandido === c.id;
                  const validDays = Math.ceil((new Date(c.assinatura.expiracao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const selecionado = selecionados.includes(c.id);

                  return (
                    <div 
                      key={c.id} 
                      className={`bg-gray-900/40 border ${expandida ? 'border-indigo-500' : selecionado ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-gray-800'} rounded-[32px] overflow-hidden transition-all shadow-xl`}
                    >
                       <div className="flex">
                          <button 
                           onClick={(e) => { e.stopPropagation(); toggleSelecao(c.id); }}
                           className="px-5 flex items-center justify-center border-r border-gray-800/50 active:scale-95 transition-all"
                          >
                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selecionado ? 'bg-indigo-500 border-indigo-500' : 'border-gray-700'}`}>
                               {selecionado && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                          </button>

                          <button 
                           onClick={() => setClienteExpandido(expandida ? null : c.id)}
                           className="flex-1 p-5 flex items-center justify-between text-left"
                          >
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                   <EgmanLogo size={20} className="text-indigo-500" />
                                </div>
                                <div>
                                   <p className="text-sm font-black text-white">{c.email}</p>
                                   <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${c.assinatura.ativa ? 'text-emerald-500' : 'text-red-500'}`}>
                                      {c.assinatura.ativa ? `Ativo (${validDays}d)` : 'Inativo'}
                                   </p>
                                </div>
                             </div>
                             {expandida ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                          </button>
                       </div>

                       <AnimatePresence>
                         {expandida && (
                           <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden bg-[#0d1420] border-t border-gray-800"
                           >
                             <div className="p-6 flex flex-col gap-6">
                                <div className="flex flex-col gap-1">
                                   <h5 className="text-[10px] text-indigo-400 font-black uppercase tracking-widest border-b border-indigo-500/20 pb-2 flex items-center gap-2">
                                      <Edit3 size={12} /> Painel de Edição Manual
                                   </h5>
                                   <p className="text-[9px] text-gray-500 font-bold mt-2 uppercase">Pass Admin: <span className="text-white font-black">{c.password || 'player'}</span></p>
                                </div>

                                <div className="space-y-4">
                                   {/* 1. Definir Data Exata */}
                                   <div className="flex flex-col gap-2">
                                      <label className="text-[8px] text-gray-400 font-black uppercase tracking-widest">1. Definir fim da subscrição (Data exata):</label>
                                      <div className="flex gap-2">
                                         <input 
                                          type="date" 
                                          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 text-xs font-bold"
                                          value={editState[c.id]?.date || ''}
                                          onChange={(e) => setEditState(prev => ({
                                            ...prev,
                                            [c.id]: { ...prev[c.id], date: e.target.value }
                                          }))}
                                         />
                                         <button 
                                          onClick={() => definirDataExata(c.id)}
                                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95"
                                         >
                                            Salvar
                                         </button>
                                      </div>
                                   </div>

                                   {/* 2. Adicionar Meses Rápido */}
                                   <div className="flex flex-col gap-2">
                                      <label className="text-[8px] text-gray-400 font-black uppercase tracking-widest">2. Adicionar Meses Rápido:</label>
                                      <div className="grid grid-cols-4 gap-2">
                                         {[
                                           { l: '-1 Mês', m: -1, c: 'bg-red-500/10 text-red-500 border-red-500/20' },
                                           { l: '+1 Mês', m: 1, c: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
                                           { l: '+3 Meses', m: 3, c: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
                                           { l: '+1 Ano', m: 12, c: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' },
                                         ].map(btn => (
                                           <button 
                                            key={btn.l}
                                            onClick={() => ajustarAssinatura(c.id, btn.m)}
                                            className={`${btn.c} py-3 rounded-xl text-[8px] font-black uppercase tracking-tighter border transition-all active:scale-95`}
                                           >
                                              {btn.l}
                                           </button>
                                         ))}
                                      </div>
                                   </div>

                                   {/* 3. Alterar Password */}
                                   <div className="flex flex-col gap-2">
                                      <label className="text-[8px] text-gray-400 font-black uppercase tracking-widest">3. Alterar password de login:</label>
                                      <div className="flex gap-2">
                                         <input 
                                          type="text" 
                                          placeholder="Nova password..."
                                          value={editState[c.id]?.pass || ''}
                                          onChange={(e) => setEditState(prev => ({
                                            ...prev,
                                            [c.id]: { ...prev[c.id], pass: e.target.value }
                                          }))}
                                          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                                         />
                                         <button 
                                          onClick={() => alterarPasswordManual(c.id)}
                                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95"
                                         >
                                            Guardar
                                         </button>
                                      </div>
                                   </div>

                                   {/* 4. Enviar Mensagem Direta */}
                                   <div className="flex flex-col gap-2">
                                      <label className="text-[8px] text-gray-400 font-black uppercase tracking-widest">4. Mensagem Direta p/ o Dono:</label>
                                      <div className="flex gap-2">
                                         <input 
                                          type="text" 
                                          placeholder="Escreva algo..."
                                          value={editState[c.id]?.msg || ''}
                                          onChange={(e) => setEditState(prev => ({
                                            ...prev,
                                            [c.id]: { ...prev[c.id], msg: e.target.value }
                                          }))}
                                          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                                         />
                                         <button 
                                          onClick={() => enviarMensagemManual(c.id)}
                                          className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 flex items-center gap-2"
                                         >
                                            <Send size={12} />
                                         </button>
                                      </div>
                                   </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-800">
                                   <button 
                                    onClick={() => {
                                      if (confirm('APAGAR CONTA DEFINITIVAMENTE? Todos os dados (clientes, stock, faturas) serão perdidos.')) {
                                          deleteDoc(doc(db, ACCOUNTS_PATH, c.id));
                                          alert('Conta apagada.');
                                      }
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-widest"
                                   >
                                      <Trash2 size={14} /> Eliminar Conta e Todos os Dados
                                   </button>
                                </div>

                                <button 
                                  onClick={() => cortarAcesso(c.id)}
                                  className="w-full py-4 rounded-2xl bg-red-900/20 text-red-500 border border-red-500/30 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                   <Ban size={16} /> Cortar Acesso Imediato
                                </button>
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                  );
                })}
                {clientesFiltrados.length === 0 && (
                  <div className="p-20 text-center opacity-20">
                     <Users size={64} className="mx-auto mb-4" />
                     <p className="font-black uppercase tracking-[0.3em] text-xs">Sem clientes</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {aba === 'validacoes' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
             <h2 className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Banknote size={20} className="text-indigo-500" /> Validações Pendentes
             </h2>

             <div className="flex flex-col gap-4">
                {clientes.filter(c => c.assinatura.pendente).map(c => (
                  <div key={c.id} className="bg-gray-900 border border-indigo-500/30 rounded-[32px] overflow-hidden">
                     <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-black text-white">{c.email}</p>
                          <p className="text-[8px] text-gray-500 font-bold uppercase mt-1">Solicitou {c.assinatura.meses || 1} mês(es)</p>
                        </div>
                        {c.assinatura.mensagem && (
                          <div className="bg-white/5 p-2 rounded-lg border border-white/10 max-w-[50%]">
                            <p className="text-[8px] text-white italic">"{c.assinatura.mensagem}"</p>
                          </div>
                        )}
                     </div>
                     <div className="p-5 bg-black/40">
                        {c.assinatura.comprovativoUrl ? (
                          <div 
                            onClick={() => setComprovativoFull(c.assinatura.comprovativoUrl!)}
                            className="rounded-2xl overflow-hidden border border-gray-800 cursor-zoom-in active:scale-[0.98] transition-all"
                          >
                             {c.assinatura.comprovativoUrl.includes('application/pdf') ? (
                               <iframe src={c.assinatura.comprovativoUrl} className="w-full h-48 pointer-events-none" />
                             ) : (
                               <img src={c.assinatura.comprovativoUrl} alt="Comprovativo" className="w-full h-48 object-contain bg-black" />
                             )}
                          </div>
                        ) : (
                          <div className="h-48 bg-gray-900 rounded-2xl flex flex-col items-center justify-center text-gray-700 border border-dashed border-gray-800">
                             <Ban size={32} />
                             <p className="text-[8px] font-black uppercase tracking-widest mt-2">Sem Imagem</p>
                          </div>
                        )}
                     </div>
                     <div className="p-5 grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => rejeitarPagamento(c.id)}
                          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest"
                        >
                           <X size={16} /> Rejeitar
                        </button>
                        <button 
                          onClick={() => aprovarPagamento(c.id, c.assinatura.meses || 1)}
                          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 text-[10px] font-black uppercase tracking-widest"
                        >
                           <CheckCircle2 size={16} /> Aprovar {c.assinatura.meses || 1} Mês(es)
                        </button>
                     </div>
                  </div>
                ))}

                {clientes.filter(c => c.assinatura.pendente).length === 0 && (
                  <div className="p-20 text-center flex flex-col items-center justify-center border-4 border-dashed border-gray-900 rounded-[60px] opacity-20">
                     <p className="font-black uppercase tracking-[0.3em] text-[10px] text-gray-400">Sem pagamentos pendentes</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {aba === 'avisos' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
             <h2 className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck size={20} className="text-indigo-500" /> Comunicações
             </h2>
             
             <div className="bg-gray-900 border border-gray-800 p-6 rounded-[32px] flex flex-col gap-6">
                <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Enviar Mensagem Para:</p>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setTipoDestino('geral')}
                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${tipoDestino === 'geral' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/40 border-gray-800 text-gray-500'}`}
                      >
                         Todos (Painel Geral)
                      </button>
                      <button 
                        onClick={() => setTipoDestino('especifico')}
                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${tipoDestino === 'especifico' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/40 border-gray-800 text-gray-500'}`}
                      >
                         Selecionados ({selecionados.length})
                      </button>
                   </div>
                   {tipoDestino === 'especifico' && (
                     <p className="text-[8px] text-indigo-400 font-bold mt-2 text-center animate-pulse">
                        {selecionados.length > 0 ? `A enviar para ${selecionados.length} clientes específicos` : 'Vá à lista de clientes e selecione os destinatários'}
                     </p>
                   )}
                </div>

                <div className="flex flex-col gap-2">
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Conteúdo da Mensagem:</p>
                   <textarea 
                     value={novoAviso}
                     onChange={(e) => setNovoAviso(e.target.value)}
                     placeholder="Escreva aqui o aviso ou mensagem..."
                     className="w-full bg-black/40 border border-gray-800 rounded-2xl p-4 text-xs font-medium focus:border-indigo-500 outline-none h-32 resize-none"
                   />
                </div>

                <button 
                  onClick={enviarAviso}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} /> {tipoDestino === 'geral' ? 'Publicar Aviso Geral' : `Enviar para ${selecionados.length} Clientes`}
                </button>
             </div>

             <div className="flex flex-col gap-3">
                <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Histórico de Avisos Gerais</h3>
                {avisosGerais.map(aviso => (
                   <div key={aviso.id} className="bg-gray-900/40 p-4 rounded-2xl border border-gray-800 flex justify-between items-center group">
                      <div className="flex-1">
                         <p className="text-[11px] text-gray-200 font-medium">{aviso.texto}</p>
                         <p className="text-[8px] text-gray-500 mt-2 uppercase font-bold">{new Date(aviso.timestamp).toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={async () => {
                          if (confirm('Apagar aviso?')) {
                            await deleteDoc(doc(db, ANNOUNCEMENTS_PATH, aviso.id));
                          }
                        }}
                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                ))}
             </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {comprovativoFull && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/95 flex flex-col p-6"
          >
            <div className="flex justify-end p-4">
               <button onClick={() => setComprovativoFull(null)} className="p-2 bg-gray-900 rounded-full text-white active:scale-95">
                  <X size={24} />
               </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
               {comprovativoFull.includes('application/pdf') ? (
                 <iframe src={comprovativoFull} className="w-full h-full rounded-2xl border border-gray-800 shadow-2xl" />
               ) : (
                 <img src={comprovativoFull} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
