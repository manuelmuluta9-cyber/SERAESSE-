import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MessageSquarePlus, Send, X, ImagePlus, User, Trash2, Edit3, Check, Eye, MessageCircle, Users, ChevronRight } from 'lucide-react';
import { MensagemEquipa, Role, Funcionario } from '../types';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';

interface Props {
  mensagensEquipa: MensagemEquipa[];
  role: Role;
  currentFuncionario: Funcionario | null;
  funcionarios: Funcionario[];
  db: any;
  appId: string;
  contaNegocio: string;
  setTeamChatAberto: (aberto: boolean) => void;
  mostrarConfirmacao: (titulo: string, mensagem: string, onConfirm: () => void) => void;
  mostrarImagemModal: (url: string) => void;
  processarComprovativo: (file: File) => Promise<string>;
  temaEscuro?: boolean;
}

export function TeamChat({ mensagensEquipa, role, currentFuncionario, funcionarios, db, appId, contaNegocio, setTeamChatAberto, mostrarConfirmacao, mostrarImagemModal, processarComprovativo, temaEscuro }: Props) {
  const [teamInput, setTeamInput] = useState('');
  const [editandoTeamMsgId, setEditandoTeamMsgId] = useState<string | null>(null);
  const [editTeamMsgTexto, setEditTeamMsgTexto] = useState('');
  const [imagemPreviewTeam, setImagemPreviewTeam] = useState<string | null>(null);
  const teamChatEndRef = useRef<HTMLDivElement>(null);

  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [chatSelecionadoId, setChatSelecionadoId] = useState<string | null>(role === 'admin' ? null : (currentFuncionario?.id || null));

  const filteredMessages = mensagensEquipa.filter(m => {
    if (role === 'admin') {
      return m.funcionarioId === chatSelecionadoId;
    } else {
      return m.funcionarioId === currentFuncionario?.id;
    }
  });

  useEffect(() => { teamChatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [filteredMessages]);

  const enviarMensagemEquipa = async (e?: React.FormEvent, tipo: 'texto' | 'audio' | 'imagem' = 'texto', conteudoExtra: string | null = null) => {
    if (e) e.preventDefault();
    const msgTexto = teamInput.trim();
    if (tipo === 'texto' && !msgTexto) return;
    
    // Who is this message for/about?
    const targetFuncId = role === 'admin' ? chatSelecionadoId : currentFuncionario?.id;
    if (!targetFuncId) return;

    let novaMsg: any = { 
      autor: role === 'admin' ? 'Admin' : (currentFuncionario?.nome || 'Funcionário'), 
      roleAutor: role,
      funcionarioId: targetFuncId,
      timestamp: Date.now(), 
      tipo, 
      apagada: false 
    };
    if (tipo === 'texto') { novaMsg.texto = msgTexto; setTeamInput(''); }
    if (tipo === 'imagem') { novaMsg.url = conteudoExtra; }
    await addDoc(collection(db, `artifacts/${appId}/public/data/chat_equipa_${contaNegocio}`), novaMsg);
  };

  const apagarMensagemEquipa = (id: string) => {
     updateDoc(doc(db, `artifacts/${appId}/public/data/chat_equipa_${contaNegocio}`, id), { apagada: true, apagadaPor: role, apagadaEm: Date.now() });
  };
  
  const salvarEdicaoTeam = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTeamMsgTexto.trim()) return;
    const msgAtual = mensagensEquipa.find(m => m.id === editandoTeamMsgId);
    if (!msgAtual) return;
    const textoOriginalDaMsg = msgAtual.textoOriginal || msgAtual.texto;
    await updateDoc(doc(db, `artifacts/${appId}/public/data/chat_equipa_${contaNegocio}`, editandoTeamMsgId!), { texto: editTeamMsgTexto.trim(), editada: true, textoOriginal: textoOriginalDaMsg });
    setEditandoTeamMsgId(null); setEditTeamMsgTexto(''); setSelectedMsgId(null);
  };

  const handleUploadImagemTeam = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const base64 = await processarComprovativo(file);
    setImagemPreviewTeam(base64);
    e.target.value = ''; 
  };

  const currentChatPartner = role === 'admin' ? funcionarios.find(f => f.id === chatSelecionadoId) : { nome: 'Administração' };

  return (
    <div className={`absolute inset-0 z-[100] flex flex-col animate-in slide-in-from-bottom-full ${temaEscuro ? 'bg-gray-950' : 'bg-white'}`} onClick={() => setSelectedMsgId(null)}>
      {imagemPreviewTeam ? (
        <div className={`absolute inset-0 z-50 flex flex-col animate-in fade-in ${temaEscuro ? 'bg-gray-950' : 'bg-white'}`}>
          <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border-b p-4 flex items-center justify-between`}>
             <h3 className="font-black uppercase text-sm flex items-center gap-2"><ImagePlus size={18} className="text-orange-500"/> Enviar Imagem</h3>
             <button onClick={() => setImagemPreviewTeam(null)} className={`text-gray-400 p-2 ${temaEscuro ? 'bg-gray-800' : 'bg-gray-200'} rounded-full`}><X size={20}/></button>
          </div>
          <div className={`flex-1 p-4 flex items-center justify-center ${temaEscuro ? 'bg-[#0a0f16]' : 'bg-gray-100'} overflow-hidden`}>
             <img src={imagemPreviewTeam} alt="Preview" className={`max-w-full max-h-full object-contain rounded-2xl border ${temaEscuro ? 'border-gray-800' : 'border-gray-300'}`} />
          </div>
          <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t p-4 flex gap-3 pb-6`}>
             <button onClick={() => setImagemPreviewTeam(null)} className={`flex-1 py-4 ${temaEscuro ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'} font-bold rounded-2xl`}>Cancelar</button>
             <button onClick={() => { enviarMensagemEquipa(undefined, 'imagem', imagemPreviewTeam); setImagemPreviewTeam(null); }} className="flex-1 py-4 bg-orange-600 text-white font-bold rounded-2xl">Enviar</button>
          </div>
        </div>
      ) : (
        <>
          <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b p-4 flex items-center gap-3`}>
            <button onClick={() => { 
               if (role === 'admin' && chatSelecionadoId) setChatSelecionadoId(null);
               else setTeamChatAberto(false);
            }} className={`${temaEscuro ? 'bg-gray-800' : 'bg-gray-100'} text-gray-400 p-2 rounded-full`}>
              <ChevronLeft size={20}/>
            </button>
            <div className="bg-orange-500 p-2 rounded-xl"><MessageCircle size={20} className="text-white"/></div>
            <div>
               <h2 className={`${temaEscuro ? 'text-white' : 'text-gray-900'} font-black uppercase text-sm leading-none`}>
                 {role === 'admin' && !chatSelecionadoId ? 'Conversas com Equipa' : `Chat: ${currentChatPartner?.nome}`}
               </h2>
               {role === 'admin' && chatSelecionadoId && <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Sessão Individual</p>}
            </div>
          </div>
          
          <div className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 ${temaEscuro ? 'bg-[#0a0f16]' : 'bg-gray-50'}`}>
            {role === 'admin' && !chatSelecionadoId ? (
              <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2 px-2">Escolha um funcionário para conversar:</p>
                {funcionarios.map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => setChatSelecionadoId(f.id)}
                    className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-4 rounded-2xl flex items-center justify-between hover:border-orange-500/50 transition-all active:scale-95`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-full overflow-hidden border ${temaEscuro ? 'border-gray-700' : 'border-gray-200'}`}>
                          {f.foto ? <img src={f.foto} className="w-full h-full object-cover" /> : <User className={`w-full h-full p-3 ${temaEscuro ? 'text-gray-600 bg-gray-800' : 'text-gray-400 bg-gray-100'}`} />}
                       </div>
                       <div className="text-left">
                          <p className={`${temaEscuro ? 'text-white' : 'text-gray-900'} font-black uppercase text-sm`}>{f.nome}</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase">Ver conversa</p>
                       </div>
                    </div>
                    <ChevronRight className="text-gray-700" />
                  </button>
                ))}
                {funcionarios.length === 0 && (
                  <div className="text-center py-20 opacity-20"><Users size={48} className="mx-auto mb-2 text-gray-500"/><p className={`text-xs uppercase font-black ${temaEscuro ? 'text-white' : 'text-gray-900'}`}>Nenhum funcionário</p></div>
                )}
              </div>
            ) : (
              <>
                {filteredMessages.filter(m => role === 'admin' || !m.apagada).map(msg => (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.roleAutor === role ? 'self-end items-end' : 'self-start items-start'}`}>
                    <span className="text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-widest">{msg.autor} • {new Date(msg.timestamp).toLocaleTimeString('pt-AO', {hour: '2-digit', minute:'2-digit'})}</span>
                    {editandoTeamMsgId === msg.id ? (
                      <form onSubmit={salvarEdicaoTeam} className={`${temaEscuro ? 'bg-gray-800 border-orange-500' : 'bg-white border-orange-500 shadow-lg'} p-2 rounded-2xl flex items-center gap-2 border w-[250px]`}>
                          <input autoFocus type="text" value={editTeamMsgTexto} onChange={e => setEditTeamMsgTexto(e.target.value)} className={`bg-transparent ${temaEscuro ? 'text-white' : 'text-gray-900'} text-sm w-full outline-none px-2`} />
                          <button type="submit" className="text-orange-500"><Check size={18}/></button>
                          <button type="button" onClick={() => setEditandoTeamMsgId(null)} className="text-red-500"><X size={18}/></button>
                      </form>
                    ) : (
                      <div 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!msg.apagada && (msg.roleAutor === role || role === 'admin')) {
                            setSelectedMsgId(selectedMsgId === msg.id ? null : msg.id);
                          }
                        }}
                        className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${msg.roleAutor === role ? 'bg-orange-600 border-orange-500 text-white rounded-br-sm' : (temaEscuro ? 'bg-gray-800 border-gray-700 text-gray-200 rounded-bl-sm' : 'bg-white border-gray-200 text-gray-800 rounded-bl-sm shadow-sm')} ${msg.apagada ? 'opacity-40 cursor-default' : ''} ${selectedMsgId === msg.id ? 'scale-95 brightness-110' : ''}`}
                      >
                        {msg.apagada && <div className="text-[9px] text-red-500 font-black mb-1 flex items-center gap-1 uppercase">Apagada</div>}
                        {msg.tipo === 'texto' && <p className="text-sm whitespace-pre-wrap">{msg.texto}</p>}
                        {msg.tipo === 'imagem' && <img src={msg.url} alt="Partilha" className={`rounded-lg max-w-full max-h-[250px] cursor-pointer ${temaEscuro ? 'border-white/10' : 'border-gray-200 shadow-sm'}`} onClick={(e) => { e.stopPropagation(); !msg.apagada && mostrarImagemModal(msg.url!); }} />}
                        {msg.editada && !msg.apagada && <span className="text-[8px] opacity-60 block mt-1 text-right italic">editada</span>}
                        
                        {selectedMsgId === msg.id && !msg.apagada && (
                          <div className={`absolute z-20 flex items-center gap-1 top-full mt-2 ${temaEscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200 shadow-2xl'} p-1.5 rounded-xl border animate-in fade-in zoom-in-95 ${msg.roleAutor === role ? 'right-0' : 'left-0'}`}>
                            {msg.roleAutor === role && msg.tipo === 'texto' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  mostrarConfirmacao('Editar', 'Desejas editar esta mensagem?', () => {
                                    setEditandoTeamMsgId(msg.id);
                                    setEditTeamMsgTexto(msg.texto!);
                                  });
                                }} 
                                className={`flex items-center gap-2 px-3 py-2 ${temaEscuro ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} text-orange-400 rounded-lg text-[10px] font-black uppercase`}
                              >
                                <Edit3 size={14}/> EDITAR
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                mostrarConfirmacao('Apagar', 'Apagar esta mensagem permanentemente?', () => apagarMensagemEquipa(msg.id));
                              }} 
                              className={`flex items-center gap-2 px-3 py-2 ${temaEscuro ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} text-red-500 rounded-lg text-[10px] font-black uppercase`}
                            >
                              <Trash2 size={14}/> APAGAR
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={teamChatEndRef} />
              </>
            )}
          </div>

          {(role !== 'admin' || chatSelecionadoId) && (
            <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-inner'} border-t p-3 flex flex-col gap-2 pb-5`}>
                <form onSubmit={(e) => enviarMensagemEquipa(e, 'texto')} className="flex items-end gap-2">
                  <div className={`flex-1 ${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-300'} border rounded-2xl flex flex-col overflow-hidden`}>
                    <textarea value={teamInput} onChange={e => setTeamInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagemEquipa(undefined, 'texto'); } }} placeholder="Escreve uma mensagem..." className={`bg-transparent ${temaEscuro ? 'text-white' : 'text-gray-900'} text-sm p-3 outline-none resize-none min-h-[50px] max-h-[120px] w-full`} rows={1} />
                    <div className={`flex items-center justify-between px-3 py-1 ${temaEscuro ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-200/50 border-gray-300'} border-t`}>
                      <label className="p-2 text-gray-500 hover:text-orange-400 cursor-pointer"><ImagePlus size={18}/> <input type="file" accept="image/*" className="hidden" onChange={handleUploadImagemTeam} /></label>
                    </div>
                  </div>
                  <button type="submit" disabled={!teamInput.trim()} className="p-4 rounded-full bg-orange-600 text-white disabled:opacity-30"><Send size={20}/></button>
                </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
