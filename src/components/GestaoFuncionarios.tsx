import React, { useState } from 'react';
import { User, Trash2, Key, UserPlus, ShieldOff, ShieldCheck, X, Camera, Save, Edit3 } from 'lucide-react';
import { Funcionario } from '../types';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface Props {
  funcionarios: Funcionario[];
  db: any;
  appId: string;
  contaNegocio: string;
  registarAuditoria: (acao: string, detalhe: string) => Promise<void>;
  mostrarConfirmacao: (titulo: string, mensagem: string, onConfirm: () => void) => void;
  mostrarAlerta: (titulo: string, mensagem: string) => void;
  processarComprovativo: (file: File) => Promise<string>;
  temaEscuro?: boolean;
}

export function GestaoFuncionarios({ funcionarios, db, appId, contaNegocio, registarAuditoria, mostrarConfirmacao, mostrarAlerta, processarComprovativo, temaEscuro }: Props) {
  const [novoNome, setNovoNome] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novaFoto, setNovaFoto] = useState<string | null>(null);
  const [mostrandoAdd, setMostrandoAdd] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Estados para Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editSenha, setEditSenha] = useState('');
  const [editFoto, setEditFoto] = useState<string | null>(null);

  const criarFuncionario = async () => {
    if (!novoNome.trim() || !novaSenha.trim()) {
      mostrarAlerta("Erro", "Nome e senha são obrigatórios.");
      return;
    }
    setCarregando(true);
    try {
      const payload: Omit<Funcionario, 'id'> = {
        nome: novoNome.trim(),
        senha: novaSenha.trim(),
        foto: novaFoto || undefined,
        ativo: true,
        criadoEm: Date.now()
      };
      await addDoc(collection(db, `artifacts/${appId}/public/data/funcionarios_${contaNegocio}`), payload);
      await registarAuditoria('FUNC_CRIAR', `Criou funcionário: ${novoNome}`);
      setNovoNome(''); setNovaSenha(''); setNovaFoto(null); setMostrandoAdd(false);
      mostrarAlerta("Sucesso", "Funcionário criado com sucesso!");
    } finally {
      setCarregando(false);
    }
  };

  const atualizarFuncionario = async (id: string) => {
    if (!editNome.trim() || !editSenha.trim()) {
      mostrarAlerta("Erro", "Nome e senha não podem estar vazios.");
      return;
    }
    setCarregando(true);
    try {
      const updateData: any = {
        nome: editNome.trim(),
        senha: editSenha.trim(),
      };
      if (editFoto) updateData.foto = editFoto;

      await updateDoc(doc(db, `artifacts/${appId}/public/data/funcionarios_${contaNegocio}`, id), updateData);
      await registarAuditoria('FUNC_EDITAR', `Editou funcionário: ${editNome}`);
      setEditingId(null);
      mostrarAlerta("Sucesso", "Dados do funcionário atualizados!");
    } finally {
      setCarregando(false);
    }
  };

  const iniciarEdicao = (f: Funcionario) => {
    setEditingId(f.id);
    setEditNome(f.nome);
    setEditSenha(f.senha);
    setEditFoto(f.foto || null);
  };

  const alternarEstado = async (f: Funcionario) => {
    const novoEstado = !f.ativo;
    await updateDoc(doc(db, `artifacts/${appId}/public/data/funcionarios_${contaNegocio}`, f.id), { ativo: novoEstado });
    await registarAuditoria('FUNC_ESTADO', `${novoEstado ? 'Ativou' : 'Bloqueou'} acesso de ${f.nome}`);
  };

  const eliminarFuncionario = (f: Funcionario) => {
    mostrarConfirmacao("Eliminar Funcionário", `Desejas eliminar ${f.nome} permanentemente? Todos os dados associados poderão ser perdidos.`, async () => {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/funcionarios_${contaNegocio}`, f.id));
      await registarAuditoria('FUNC_ELIMINAR', `Eliminou funcionário: ${f.nome}`);
    });
  };

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await processarComprovativo(file);
      if (isEdit) setEditFoto(base64);
      else setNovaFoto(base64);
    }
  };

  return (
    <div className={`flex flex-col gap-4 animate-in fade-in ${temaEscuro ? 'text-white' : 'text-gray-900'}`}>
      <div className={`flex justify-between items-center ${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-4 rounded-2xl`}>
        <h3 className={`text-sm font-black ${temaEscuro ? 'text-white' : 'text-gray-900'} uppercase tracking-widest flex items-center gap-2`}><User size={18} className="text-orange-500"/> Funcionários</h3>
        <button onClick={() => { setMostrandoAdd(!mostrandoAdd); setEditingId(null); }} className="bg-orange-600 text-white p-2 rounded-xl transition-transform active:scale-90">
          {mostrandoAdd ? <X size={20}/> : <UserPlus size={20}/>}
        </button>
      </div>

      {mostrandoAdd && (
        <div className={`${temaEscuro ? 'bg-gray-900 border-orange-500/30' : 'bg-orange-50 border-orange-200 shadow-lg'} border p-5 rounded-2xl animate-in slide-in-from-top-2 flex flex-col gap-4 shadow-xl`}>
          <div className="flex flex-col items-center gap-3">
             <div className={`w-20 h-20 rounded-full ${temaEscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border-2 border-dashed flex items-center justify-center overflow-hidden relative group`}>
                {novaFoto ? <img src={novaFoto} className="w-full h-full object-cover" /> : <Camera className="text-gray-500" size={32}/>}
                <input type="file" accept="image/*" onChange={(e) => handleFoto(e, false)} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
             <p className="text-[10px] text-gray-500 font-bold uppercase">Toque para adicionar foto</p>
          </div>
          <input type="text" placeholder="Nome do Funcionário" value={novoNome} onChange={e=>setNovoNome(e.target.value)} className={`${temaEscuro ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'} p-3 rounded-xl border outline-none font-bold`} />
          <input type="password" placeholder="Senha de Acesso" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} className={`${temaEscuro ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'} p-3 rounded-xl border outline-none font-bold`} />
          <button onClick={criarFuncionario} disabled={carregando} className="bg-orange-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {carregando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={18}/> CRIAR PERFIL</>}
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {funcionarios.length === 0 ? (
          <div className={`p-10 text-center ${temaEscuro ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'} rounded-2xl border border-dashed`}>
            <User className="inline-block text-gray-700 mb-2" size={32}/>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nenhum funcionário registado</p>
          </div>
        ) : (
          funcionarios.map(f => (
            <div key={f.id} className="flex flex-col gap-2">
              <div className={`${temaEscuro ? 'bg-gray-900' : 'bg-white shadow-sm'} border p-4 rounded-2xl flex items-center justify-between transition-all ${f.ativo ? (temaEscuro ? 'border-gray-800' : 'border-gray-200') : 'border-red-500/20 opacity-70'} ${editingId === f.id ? 'border-orange-500 bg-gray-800/40' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${temaEscuro ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} flex items-center justify-center overflow-hidden border`}>
                    {f.foto ? <img src={f.foto} className="w-full h-full object-cover" /> : <User className="text-gray-500" size={24}/>}
                  </div>
                  <div>
                    <h4 className={`font-black uppercase text-sm leading-none mb-1 ${temaEscuro ? 'text-white' : 'text-gray-900'}`}>{f.nome}</h4>
                    <p className={`text-[9px] font-bold uppercase ${f.ativo ? 'text-emerald-500' : 'text-red-500'}`}>{f.ativo ? 'Acesso Aberto' : 'Acesso Fechado'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => alternarEstado(f)} className={`p-2 rounded-lg transition-colors ${f.ativo ? 'text-gray-500 hover:bg-red-500/10 hover:text-red-500' : 'text-emerald-500 hover:bg-emerald-500/10'}`}>
                    {f.ativo ? <ShieldOff size={18}/> : <ShieldCheck size={18}/>}
                  </button>
                  <button onClick={() => editingId === f.id ? setEditingId(null) : iniciarEdicao(f)} className={`p-2 rounded-lg transition-colors ${editingId === f.id ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:bg-gray-800 hover:text-white'}`}>
                    <Edit3 size={18}/>
                  </button>
                  <button onClick={() => eliminarFuncionario(f)} className="p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-500 rounded-lg"><Trash2 size={18}/></button>
                </div>
              </div>

              {editingId === f.id && (
                <div className={`${temaEscuro ? 'bg-gray-900 border-orange-500/40' : 'bg-white border-orange-500/50 shadow-2xl'} border p-5 rounded-2xl animate-in slide-in-from-top-2 flex flex-col gap-4 shadow-xl mx-2`}>
                   <div className="flex flex-col items-center gap-3">
                      <div className={`w-16 h-16 rounded-full ${temaEscuro ? 'bg-gray-800 border-orange-500/50' : 'bg-gray-50 border-orange-200'} border-2 border-dashed flex items-center justify-center overflow-hidden relative group`}>
                         {editFoto ? <img src={editFoto} className="w-full h-full object-cover" /> : <Camera className="text-gray-500" size={24}/>}
                         <input type="file" accept="image/*" onChange={(e) => handleFoto(e, true)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Alterar foto (toque)</p>
                   </div>
                   <div className="grid gap-2">
                      <p className="text-[10px] text-gray-500 font-bold uppercase ml-1">Nome do Funcionário</p>
                      <input type="text" value={editNome} onChange={e=>setEditNome(e.target.value)} className={`${temaEscuro ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'} p-3 rounded-xl border outline-none font-bold text-sm`} />
                   </div>
                   <div className="grid gap-2">
                      <p className="text-[10px] text-gray-500 font-bold uppercase ml-1">Senha de Acesso</p>
                      <input type="text" value={editSenha} onChange={e=>setEditSenha(e.target.value)} className={`${temaEscuro ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'} p-3 rounded-xl border outline-none font-bold text-sm`} />
                   </div>
                   <div className="flex gap-2 mt-2">
                      <button onClick={() => setEditingId(null)} className={`flex-1 ${temaEscuro ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'} py-3 rounded-xl font-black uppercase text-[10px]`}>Cancelar</button>
                      <button onClick={() => atualizarFuncionario(f.id)} disabled={carregando} className="flex-[2] bg-orange-600 text-white py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                        {carregando ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={14}/> GUARDAR ALTERAÇÕES</>}
                      </button>
                   </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

