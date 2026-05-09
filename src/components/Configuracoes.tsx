import React, { useState } from 'react';
import { Settings, Crown, UploadCloud, Settings2, Trash2, X, MessageSquare, Bell } from 'lucide-react';
import { Config, Assinatura } from '../types';
import { formatarDinheiro, DADOS_PAGAMENTO } from '../lib/utils';

interface Props {
  config: Config;
  atualizarConfig: (novasConfigs: Partial<Config>) => Promise<void>;
  assinatura: Assinatura | null;
  onUpload: (base64: string, meses: number, mensagem?: string) => Promise<void>;
  processarComprovativo: (file: File) => Promise<string>;
  mostrarAlerta: (titulo: string, mensagem: string) => void;
  registarAuditoria: (acao: string, detalhe: string) => Promise<void>;
  apagarContaNegocio: () => void;
  onVerHistorico?: () => void;
  temaEscuro?: boolean;
}

export function Configuracoes({ config, atualizarConfig, assinatura, onUpload, processarComprovativo, mostrarAlerta, registarAuditoria, apagarContaNegocio, onVerHistorico, temaEscuro }: Props) {
  const [preco, setPreco] = useState(config.precoHora);
  const [pin, setPin] = useState(config.adminPin);
  const [aberto, setAberto] = useState(config.sistemaAberto);
  const [uploading, setUploading] = useState(false);
  const [mesesSelecionados, setMesesSelecionados] = useState(1);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [mensagemAdm, setMensagemAdm] = useState("");
  const dataExpiracao = assinatura?.expiracao ? new Date(assinatura.expiracao).toLocaleDateString('pt-AO') : '...';

  const guardar = () => { 
    atualizarConfig({ precoHora: Number(preco), adminPin: pin, sistemaAberto: aberto }); 
    mostrarAlerta("Sucesso", "Configurações guardadas!"); 
    registarAuditoria("CONFIG_UPDATE", "Alterou configurações"); 
  };

  const handleRenovacao = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0]; if(!file) return;
     setUploading(true);
     try {
        const base64 = await processarComprovativo(file);
        setPreviewImagem(base64);
     } catch(e) {
        mostrarAlerta("Erro", "Falha ao processar comprovativo.");
     } finally {
        setUploading(false);
        e.target.value = '';
     }
  };

  const confirmarEnvio = async () => {
    if (!previewImagem) return;
    setUploading(true);
    try {
       await onUpload(previewImagem, mesesSelecionados, mensagemAdm); 
       setPreviewImagem(null);
       setMensagemAdm("");
    } catch(e) {
       mostrarAlerta("Erro", "Falha ao carregar comprovativo.");
    } finally {
       setUploading(false);
    }
  };

  const isPDF = previewImagem?.startsWith('data:application/pdf');

  return (
    <div className={`p-4 pb-20 animate-in fade-in ${temaEscuro ? 'text-white' : 'text-gray-900'}`}>
      <h2 className={`text-xl font-black tracking-widest ${temaEscuro ? 'text-white' : 'text-gray-900'} mb-6 flex gap-2 items-center uppercase`}><Settings className="text-orange-500"/> Configurações</h2>
      
      <div className={`${temaEscuro ? 'bg-gradient-to-tr from-gray-900 to-gray-800 border-gray-700 shadow-xl' : 'bg-orange-50 border-orange-200 shadow-sm'} border p-5 rounded-2xl mb-6 relative overflow-hidden`}>
         <div className="absolute -right-4 -top-4 opacity-10"><Crown size={120}/></div>

         {previewImagem && (
            <div className="absolute inset-0 z-[100] bg-gray-950 flex flex-col animate-in slide-in-from-bottom duration-300">
               <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
                  <h3 className="text-white font-black uppercase tracking-widest text-[10px]">Revisão de Pagamento</h3>
                  <button onClick={() => setPreviewImagem(null)} className="text-gray-400 p-2"><X size={20}/></button>
               </div>
               <div className="flex-1 min-h-0 p-4 flex flex-col gap-4 overflow-y-auto">
                  <div className="bg-black/40 rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center min-h-[200px]">
                     {isPDF ? (
                       <iframe src={previewImagem!} className="w-full h-[300px] border-none rounded-lg" title="PDF Preview"></iframe>
                     ) : (
                       <img src={previewImagem!} alt="Comprovativo" className="max-w-full max-h-[300px] object-contain" />
                     )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Mensagem para o Administrador (Opcional)</label>
                     <textarea 
                        value={mensagemAdm} 
                        onChange={e => setMensagemAdm(e.target.value)}
                        placeholder="Ex: Pagamento referente ao mês de Maio..."
                        className="w-full bg-gray-900 border border-gray-800 p-3 rounded-xl text-xs text-white outline-none focus:border-orange-500/50 transition-colors h-24 resize-none"
                     />
                  </div>

                  <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                     <p className="text-[9px] text-orange-400 font-bold uppercase mb-1">Resumo do Pedido</p>
                     <p className="text-xs text-white font-black">{mesesSelecionados} {mesesSelecionados === 1 ? 'Mês' : 'Meses'} • <span className="text-orange-500">{formatarDinheiro(DADOS_PAGAMENTO.precoMensalBase * mesesSelecionados)}</span></p>
                  </div>
               </div>
               <div className="p-4 bg-gray-950 border-t border-gray-800 flex gap-3 pb-6 shrink-0">
                  <button onClick={() => setPreviewImagem(null)} className="flex-1 py-4 bg-gray-900 text-gray-400 font-black text-[10px] uppercase rounded-xl border border-gray-800">Cancelar</button>
                  <button onClick={confirmarEnvio} disabled={uploading} className="flex-1 py-4 bg-orange-600 text-white font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20">
                     {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'CONFIRMAR E ENVIAR'}
                  </button>
               </div>
            </div>
         )}
         <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10"><Crown size={16} className="text-orange-400"/> Licença Cloud</h3>
         <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
            <div><p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Plano</p><p className={`text-sm font-black ${temaEscuro ? 'text-white' : 'text-gray-900'}`}>{assinatura?.plano || 'Standard'}</p></div>
            <div><p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Validade</p><p className={`text-sm font-black ${assinatura?.ativa ? 'text-emerald-400' : 'text-red-400'}`}>{dataExpiracao}</p></div>
         </div>
         {assinatura?.pendente ? (
            <div className="bg-orange-500/20 text-orange-400 p-3 rounded-xl border border-orange-500/30 text-[10px] font-bold uppercase tracking-widest text-center">Renovação Pendente</div>
         ) : (
            <div className="relative z-10">
               <div className={`flex justify-between items-center mb-4 ${temaEscuro ? 'bg-gray-950/40 border-white/5' : 'bg-white/50 border-gray-200'} p-3 rounded-xl border`}>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Duração</span>
                  <div className="flex items-center gap-2">
                     <button onClick={() => setMesesSelecionados(p => Math.max(1, p-1))} className={`w-8 h-8 flex items-center justify-center ${temaEscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'} text-white rounded-lg font-black border transition-active active:scale-90`}>-</button>
                     <span className={`text-xs font-black ${temaEscuro ? 'text-white' : 'text-gray-900'} w-10 text-center`}>{mesesSelecionados}</span>
                     <button onClick={() => setMesesSelecionados(p => p+1)} className={`w-8 h-8 flex items-center justify-center ${temaEscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'} text-white rounded-lg font-black border transition-active active:scale-90`}>+</button>
                  </div>
               </div>

               <div className="flex justify-between items-center mb-3 p-2 bg-orange-500/5 rounded-lg border border-orange-500/10">
                  <span className="text-[10px] text-orange-400 font-bold uppercase">Total a pagar:</span>
                  <span className={`text-sm font-black ${temaEscuro ? 'text-white' : 'text-gray-900'}`}>{formatarDinheiro(DADOS_PAGAMENTO.precoMensalBase * mesesSelecionados)}</span>
               </div>

               <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mb-3">
                  <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest leading-tight">
                    Lembre-se: O pagamento deve ser efectuado via Multicaixa Express (Telefone) para ativação imediata.
                  </p>
               </div>

               <p className="text-[10px] text-gray-400 mb-2">Transfira p/ <strong className="text-emerald-400">{DADOS_PAGAMENTO.telefoneMCX}</strong>. Faça screenshot do comprovativo e carregue aqui:</p>
               <label className={`w-full bg-orange-600 text-white font-black text-sm py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/20 active:scale-95 transition-all ${uploading ? 'opacity-50' : ''}`}>
                 {uploading ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" /> : <><UploadCloud size={18}/> CARREGAR COMPROVATIVO</>}
                 <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleRenovacao} disabled={uploading} />
               </label>
            </div>
         )}
      </div>

      <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-5 rounded-2xl flex flex-col gap-4 shadow-sm mb-6`}>
         <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><MessageSquare size={16} className="text-indigo-500"/> Suporte & Avisos</h3>
         <p className="text-[10px] text-gray-500">Consulte aqui todas as comunicações enviadas pela administração da Egman.</p>
         <button 
           onClick={onVerHistorico}
           className="w-full py-4 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
         >
           <Bell size={16} /> Ver Histórico de Avisos
         </button>
      </div>

      <div className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-5 rounded-2xl flex flex-col gap-4 shadow-sm`}>
         <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Settings2 size={16} className="text-gray-500"/> Parâmetros</h3>
         <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex flex-col gap-2">Preço por Hora<input type="number" value={preco} onChange={e=>setPreco(Number(e.target.value))} className={`${temaEscuro ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-100 border-gray-200 text-gray-900 shadow-inner'} border p-3 rounded-xl outline-none font-black text-lg`} /></label>
         <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex flex-col gap-2">PIN Administrador<input type="text" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g, ''))} className={`${temaEscuro ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-100 border-gray-200 text-gray-900 shadow-inner'} border p-3 rounded-xl outline-none font-black tracking-[0.5em] text-center text-lg`} /></label>
         
         <div className={`${temaEscuro ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-200 shadow-inner'} border p-4 rounded-xl mt-2`}>
            <label className={`flex items-center justify-between text-sm ${temaEscuro ? 'text-white' : 'text-gray-900'} font-bold cursor-pointer`}>
               <span className="uppercase tracking-widest text-xs">Sistema Aberto</span>
               <input type="checkbox" checked={aberto} onChange={e=>setAberto(e.target.checked)} className="h-5 w-5 accent-emerald-500"/>
            </label>
         </div>

         <button onClick={guardar} className="bg-orange-600 text-white font-black tracking-widest text-sm py-4 rounded-xl mt-2 shadow-lg">GUARDAR ALTERAÇÕES</button>
      </div>

      <div className={`${temaEscuro ? 'bg-red-900/10 border-red-500/30' : 'bg-red-50 border-red-200 shadow-sm'} border p-5 rounded-2xl mt-6`}>
         <h3 className="text-red-500 font-black text-sm mb-2 uppercase tracking-widest">Zona Perigosa</h3>
         <button onClick={apagarContaNegocio} className="w-full bg-red-600 text-white font-black text-[10px] py-4 rounded-xl flex items-center justify-center gap-2"><Trash2 size={16}/> APAGAR CONTA PERMANENTEMENTE</button>
      </div>
    </div>
  );
}
