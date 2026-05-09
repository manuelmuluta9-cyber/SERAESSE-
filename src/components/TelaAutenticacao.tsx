import React, { useState } from 'react';
import { Mail, Key, UserCog, LogIn, ArrowRight, ChevronLeft, Clock, Crown, UploadCloud, Info } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import { EgmanLogo } from './EgmanLogo';
import { formatarDinheiro, DADOS_PAGAMENTO } from '../lib/utils';

interface Props {
  onCustomAuth: (isLogin: boolean, email: string, pass: string, plan?: string, cert?: string | null, months?: number, message?: string) => Promise<void>;
  erroExterno: string;
  processarComprovativo: (file: File) => Promise<string>;
  onSuperAdminClick?: () => void;
}

export function TelaAutenticacao({ onCustomAuth, erroExterno, processarComprovativo, onSuperAdminClick }: Props) {
  const [step, setStep] = useState<'auth' | 'select_plan' | 'payment' | 'recovery'>('auth');
  const [pressTimer, setPressTimer] = useState<any>(null);

  const handleLogoDown = () => {
    const timer = setTimeout(() => {
      onSuperAdminClick?.();
    }, 4000); // 4 seconds long press
    setPressTimer(timer);
  };

  const handleLogoUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };
  const [emailSalvo] = useState(() => localStorage.getItem('pm_saved_email') || '');
  const [trialUsado] = useState(() => localStorage.getItem('pm_trial_used') === 'true');

  const [isLogin, setIsLogin] = useState(emailSalvo !== '');
  const [email, setEmail] = useState(emailSalvo);
  const [password, setPassword] = useState('');
  const [pinRecuperacao, setPinRecuperacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mesesSelecionados, setMesesSelecionados] = useState(1);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [mensagemAdm, setMensagemAdm] = useState("");

  const [recStage, setRecStage] = useState(1);
  const [recEmail, setRecEmail] = useState('');
  const [recPinInput, setRecPinInput] = useState('');
  const [recNovaPass, setRecNovaPass] = useState('');
  const [recConfirmPass, setRecConfirmPass] = useState('');
  const [adminPinValidado, setAdminPinValidado] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (isLogin) {
      setLoading(true);
      try { await onCustomAuth(true, email, password); }
      catch (err: any) { setErro(err.message); }
      finally { setLoading(false); }
    }
    else {
      if (password.length < 4) return setErro("A palavra-passe deve ter pelo menos 4 caracteres.");
      if (pinRecuperacao.length !== 4) return setErro("O PIN de Recuperação deve ter exatamente 4 dígitos numéricos.");
      setLoading(true);
      try {
        const emailLimpo = email.toLowerCase().trim();
        const emailSafe = emailLimpo.replace(/[^a-z0-9]/g, '_');
        const docRef = doc(db, `artifacts/${appId}/public/data/contas`, emailSafe);
        const snap = await getDoc(docRef);

        if (snap.exists() || emailLimpo === 'admin@cloud.com' || emailLimpo === 'egman.admin@egman.com') {
          setErro("Atenção: Este email já tem uma conta registada! Foste redirecionado para a aba 'Entrar'.");
          setIsLogin(true);
        } else {
          // Store minimal settings for the account creation flow
          await setDoc(doc(db, `artifacts/${appId}/public/data/settings_${emailSafe}`, 'geral'), {
            adminPin: pinRecuperacao,
            precoHora: 1000,
            sistemaAberto: true,
            categoriasEntrada: ['Sessão Jogo', 'Bar / Snacks', 'Eventos/Torneios', 'Outros'],
            categoriasDespesa: ['Energia / Água', 'Internet', 'Funcionários', 'Manutenção', 'Compras Bar', 'Outros']
          });
          setStep('select_plan');
        }
      } catch (err) { setErro("Erro de ligação ao servidor. Tenta novamente."); }
      finally { setLoading(false); }
    }
  };

  const verificarEmailRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault(); setErro(''); setLoading(true);
    try {
      const emailLimpo = recEmail.toLowerCase().trim();
      const emailSafe = emailLimpo.replace(/[^a-z0-9]/g, '_');
      const docRef = doc(db, `artifacts/${appId}/public/data/contas`, emailSafe);
      const snap = await getDoc(docRef);
      if (!snap.exists()) { setErro("Não encontrámos nenhuma conta com este email."); setLoading(false); return; }

      const configRef = doc(db, `artifacts/${appId}/public/data/settings_${emailSafe}`, 'geral');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists() && configSnap.data().adminPin) {
        setAdminPinValidado(configSnap.data().adminPin);
      } else {
        setAdminPinValidado('1234');
      }
      setRecStage(2);
    } catch (err) { setErro("Erro ao verificar email."); }
    finally { setLoading(false); }
  };

  const verificarPinRecuperacao = (e: React.FormEvent) => {
    e.preventDefault(); setErro('');
    if (recPinInput === adminPinValidado) { setRecStage(3); }
    else { setErro("O PIN do Administrador está incorreto."); setRecPinInput(''); }
  };

  const salvarNovaPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setErro('');
    if (recNovaPass.length < 4) return setErro("A nova palavra-passe tem de ter pelo menos 4 caracteres.");
    if (recNovaPass !== recConfirmPass) return setErro("As palavras-passe não coincidem.");
    setLoading(true);
    try {
      const emailSafe = recEmail.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      await updateDoc(doc(db, `artifacts/${appId}/public/data/contas`, emailSafe), { password: recNovaPass });
      alert("Sucesso! A tua palavra-passe foi alterada na base de dados. Já podes entrar.");
      setStep('auth'); setIsLogin(true); setEmail(recEmail); setPassword('');
    } catch (err) { setErro("Erro ao alterar a palavra-passe."); }
    finally { setLoading(false); }
  };

  const handleChoiceTrial = async () => {
    setLoading(true); try { await onCustomAuth(false, email, password, 'trial'); } catch (err: any) { setErro(err.message); setStep('auth'); } finally { setLoading(false); }
  };

  const handleUploadNewPayment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true);
    try {
      const base64 = await processarComprovativo(file);
      setPreviewImagem(base64);
    } catch (err) {
      setErro("Erro ao processar comprovativo.");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const confirmarEnvioPayment = async () => {
    setLoading(true);
    try {
      await onCustomAuth(false, email, password, 'premium_pendente', previewImagem, mesesSelecionados, mensagemAdm);
      setPreviewImagem(null);
      setMensagemAdm("");
    } catch (err) {
      setErro("Erro ao processar comprovativo.");
    } finally {
      setLoading(false);
    }
  };

  const isPDF = previewImagem?.startsWith('data:application/pdf');

  // Skip the rest for brevity in this call if needed, but I'll implement the UI logic
  
  if (step === 'recovery') {
    return (
      <div className="min-h-screen bg-gray-950 flex justify-center items-center font-sans text-gray-100 p-4">
        <div className="w-full max-w-md bg-gray-900 flex flex-col p-8 rounded-3xl shadow-2xl relative border border-gray-800">
           <button onClick={() => { setStep('auth'); setRecStage(1); setErro(''); }} className="text-gray-400 mb-6 self-start flex items-center gap-1 hover:text-white"><ChevronLeft size={18}/> Voltar ao Login</button>
           <h2 className="text-xl font-black text-white mb-2 uppercase flex items-center gap-2"><Key className="text-orange-500"/> Recuperar Acesso</h2>
           <p className="text-xs text-gray-400 mb-8">Esqueceste a palavra-passe? Usa o PIN de Administrador do teu negócio para a repor.</p>

           {erro && <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 font-bold text-center">{erro}</div>}

           {recStage === 1 && (
              <form onSubmit={verificarEmailRecuperacao} className="flex flex-col gap-4">
                 <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl focus-within:border-orange-500 transition-colors"><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Qual é o Email do Negócio?</label><input type="email" value={recEmail} onChange={e => setRecEmail(e.target.value)} className="w-full bg-transparent text-white font-medium text-sm outline-none" required /></div>
                 <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-black text-sm bg-orange-600 hover:bg-orange-500 text-white mt-2 shadow-lg shadow-orange-500/20">{loading ? 'A VERIFICAR...' : 'AVANÇAR'}</button>
              </form>
           )}

           {recStage === 2 && (
              <form onSubmit={verificarPinRecuperacao} className="flex flex-col gap-4">
                 <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl focus-within:border-emerald-500 transition-colors"><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Insere o PIN de Administrador (4 Dígitos)</label><input type="text" maxLength={4} autoFocus value={recPinInput} onChange={e => setRecPinInput(e.target.value.replace(/\D/g, ''))} className="w-full bg-transparent text-white font-mono text-2xl tracking-[0.5em] text-center outline-none" placeholder="****" required /></div>
                 <p className="text-[10px] text-gray-500 text-center">Para segurança, só o dono com o PIN pode alterar a palavra-passe.</p>
                 <button type="submit" className="w-full py-4 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-500 text-white mt-2 shadow-lg shadow-emerald-500/20">VALIDAR PIN</button>
              </form>
           )}

           {recStage === 3 && (
              <form onSubmit={salvarNovaPassword} className="flex flex-col gap-4">
                 <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl focus-within:border-orange-500 transition-colors"><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Nova Palavra-passe</label><input type="password" value={recNovaPass} onChange={e => setRecNovaPass(e.target.value)} className="w-full bg-transparent text-white font-medium text-sm outline-none" required /></div>
                 <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl focus-within:border-orange-500 transition-colors"><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Confirmar Nova Palavra-passe</label><input type="password" value={recConfirmPass} onChange={e => setRecConfirmPass(e.target.value)} className="w-full bg-transparent text-white font-medium text-sm outline-none" required /></div>
                 <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-black text-sm bg-orange-600 hover:bg-orange-500 text-white mt-2 shadow-lg shadow-orange-500/10">{loading ? 'A GUARDAR...' : 'REPOR PALAVRA-PASSE'}</button>
              </form>
           )}
        </div>
      </div>
    );
  }

  if (step === 'select_plan') {
    return (
      <div className="min-h-screen bg-gray-950 flex justify-center items-center font-sans text-gray-100 p-4">
        <div className="w-full max-w-md bg-gray-900 flex flex-col p-8 rounded-3xl shadow-2xl relative border border-gray-800">
           <button onClick={() => setStep('auth')} className="text-gray-400 mb-6 self-start flex items-center gap-1 hover:text-white"><ChevronLeft size={18}/> Voltar</button>
           <h2 className="text-xl font-black text-white mb-2">Escolhe o teu Plano</h2><p className="text-xs text-gray-400 mb-8">Como preferes começar a usar a Cloud Manager?</p>

           <div className="flex flex-col gap-4">
              {trialUsado ? (
                <div className="bg-gray-800/30 border border-gray-700/50 p-5 rounded-2xl flex flex-col items-start opacity-60 cursor-not-allowed">
                   <div className="flex justify-between w-full mb-2"><span className="font-bold text-gray-500 text-lg flex items-center gap-2"><Clock className="text-gray-600"/> 7 Dias Grátis</span><span className="bg-red-500/10 text-red-500 text-[10px] px-2 py-1 font-bold rounded-lg uppercase">Esgotado</span></div>
                   <p className="text-xs text-gray-500 text-left">Este telemóvel já utilizou o período de teste. Para continuar a usar o sistema deves carregar a conta.</p>
                </div>
              ) : (
                <button onClick={handleChoiceTrial} disabled={loading} className="bg-gray-800 border border-gray-700 hover:border-emerald-500 p-5 rounded-2xl flex flex-col items-start transition-all group">
                   <div className="flex justify-between w-full mb-2"><span className="font-bold text-white text-lg flex items-center gap-2"><Clock className="text-emerald-500"/> 7 Dias Grátis</span><span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 font-bold rounded-lg uppercase">Recomendado</span></div>
                   <p className="text-xs text-gray-400 text-left">Testa o sistema completo sem compromisso. Pagas depois se gostares.</p>
                </button>
              )}
              <button onClick={() => setStep('payment')} disabled={loading} className="bg-gradient-to-tr from-orange-900/40 to-orange-800/40 border border-orange-500/30 hover:border-orange-500 p-5 rounded-2xl flex flex-col items-start transition-all">
                 <div className="flex justify-between w-full mb-2"><span className="font-bold text-white text-lg flex items-center gap-2"><Crown className="text-orange-400"/> Acesso Premium</span><span className="text-orange-400 font-black">{formatarDinheiro(DADOS_PAGAMENTO.precoMensalBase)}/mês</span></div>
                 <p className="text-xs text-orange-200/70 text-left">Garante já o teu mês completo. Acesso total e imediato.</p>
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gray-950 flex justify-center items-center font-sans text-gray-100 p-4">
        <div className="w-full max-w-md bg-gray-900 flex flex-col p-6 rounded-3xl shadow-2xl relative overflow-hidden border border-orange-500/30">
           {previewImagem && (
             <div className="absolute inset-0 z-50 bg-gray-950 flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
                <div className="border-b border-gray-800 p-4 flex items-center justify-between shrink-0">
                   <h3 className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2"><Crown size={18} className="text-orange-500"/> Revisão de Pagamento</h3>
                   <button onClick={() => setPreviewImagem(null)} disabled={loading} className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full"><ChevronLeft size={20}/></button>
                </div>
                <div className="flex-1 min-h-0 p-4 flex flex-col gap-4 overflow-y-auto bg-[#05080c]">
                   <div className="bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center min-h-[220px]">
                      {isPDF ? (
                        <iframe src={previewImagem!} className="w-full h-[400px] border-none rounded-lg" title="PDF Preview"></iframe>
                      ) : (
                        <img src={previewImagem!} alt="Preview" className="max-w-full max-h-[300px] object-contain shadow-2xl shadow-orange-500/5" />
                      )}
                   </div>

                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Informação Adicional (Opcional)</label>
                     <textarea 
                        value={mensagemAdm} 
                        onChange={e => setMensagemAdm(e.target.value)}
                        placeholder="Escreve uma mensagem para o Administrador..."
                        className="w-full bg-[#0a0f16] border border-gray-800 p-3 rounded-xl text-xs text-white outline-none focus:border-orange-500/50 transition-colors h-24 resize-none"
                     />
                  </div>

                  <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                     <p className="text-[9px] text-orange-400 font-bold uppercase mb-1">Resumo da Compra</p>
                     <p className="text-xs text-white font-black">{mesesSelecionados} {mesesSelecionados === 1 ? 'Mês' : 'Meses'} • <span className="text-orange-500">{formatarDinheiro(DADOS_PAGAMENTO.precoMensalBase * mesesSelecionados)}</span></p>
                  </div>

                   {loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}
                </div>
                <div className="bg-gray-950 border-t border-gray-800 p-4 flex gap-3 shrink-0 pb-6">
                   <button onClick={() => setPreviewImagem(null)} disabled={loading} className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase bg-gray-900 border border-gray-800 text-gray-400 tracking-widest">Cancelar</button>
                   <button onClick={confirmarEnvioPayment} disabled={loading} className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase bg-orange-600 text-white shadow-lg shadow-orange-500/20 tracking-widest">Confirmar e Enviar</button>
                </div>
             </div>
           )}

           <button onClick={() => setStep('select_plan')} className="text-gray-400 mb-4 self-start flex items-center gap-1 hover:text-white"><ChevronLeft size={18}/> Voltar</button>
           
           <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl mb-4 text-center"><Crown size={32} className="text-orange-500 mx-auto mb-2"/><h3 className="font-black text-white uppercase tracking-widest">Ativar Premium</h3></div>

           <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl mb-6">
              <div className="flex justify-between items-center mb-3">
                 <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tempo de Subscrição</span>
                 <div className="flex items-center gap-2 bg-gray-950 p-1 rounded-lg border border-gray-700">
                    <button onClick={() => setMesesSelecionados(p => Math.max(1, p-1))} className="w-6 h-6 flex items-center justify-center bg-gray-800 text-white rounded font-bold">-</button>
                    <span className="text-xs font-black text-white w-12 text-center">{mesesSelecionados} {mesesSelecionados === 1 ? 'Mês' : 'Meses'}</span>
                    <button onClick={() => setMesesSelecionados(p => p+1)} className="w-6 h-6 flex items-center justify-center bg-gray-800 text-white rounded font-bold">+</button>
                 </div>
              </div>
              <div className="flex justify-between items-center mb-4 bg-orange-500/10 p-2 rounded-lg border border-orange-500/20"><span className="text-[10px] text-orange-400 font-bold uppercase">Total:</span><span className="text-lg text-white font-black">{formatarDinheiro(DADOS_PAGAMENTO.precoMensalBase * mesesSelecionados)}</span></div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mb-3">
                 <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest leading-tight">
                   Aviso: O pagamento é via Multicaixa Express (Telefone) para garantir a ativação da sua conta.
                 </p>
              </div>

              <p className="text-xs text-gray-400 mb-3">1. Transfira via <strong className="text-white">Multicaixa Express</strong> para:</p>
              <div className="flex items-center justify-between bg-gray-950 p-3 rounded-xl border border-gray-800 mb-2">
                 <div><p className="text-[10px] text-gray-500 font-bold">Telefone (Express)</p><p className="font-mono text-lg font-black text-emerald-400">{DADOS_PAGAMENTO.telefoneMCX}</p></div>
                 <button onClick={() => { navigator.clipboard.writeText(DADOS_PAGAMENTO.telefoneMCX); alert("Copiado!"); }} className="p-2 text-xs font-bold text-gray-300">Copiar</button>
              </div>
           </div>

           <div>
              <p className="text-xs text-orange-400 font-bold mb-3">2. Faça screenshot do comprovativo e carregue aqui:</p>
              <label className="w-full bg-orange-600 text-white font-black text-sm py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/20 active:scale-95 transition-all">
                 <UploadCloud size={18}/> CARREGAR COMPROVATIVO
                 <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadNewPayment} disabled={loading} />
              </label>
              <p className="mt-2 text-[10px] text-gray-500 text-center uppercase font-bold tracking-widest">Imagens (JPG/PNG) ou PDF aceites</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex justify-center items-center font-sans text-gray-100 p-4">
      <div className="w-full max-w-md bg-gray-900 flex flex-col items-center p-8 rounded-3xl shadow-2xl relative border border-gray-800">
        <div 
          className="mt-4 mb-6 flex flex-col items-center select-none active:scale-95 transition-transform cursor-pointer"
          onMouseDown={handleLogoDown}
          onMouseUp={handleLogoUp}
          onMouseLeave={handleLogoUp}
          onTouchStart={handleLogoDown}
          onTouchEnd={handleLogoUp}
        >
          <EgmanLogo size={120} className="mb-4 drop-shadow-2xl" />
          <h1 className="text-2xl font-black tracking-widest text-white">EGMAN <span className="text-orange-500">PLAY</span></h1>
        </div>
        
        <div className="flex bg-gray-800 rounded-xl p-1 mb-6 w-full">
          <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${isLogin ? 'bg-emerald-500 text-emerald-950 shadow-md' : 'text-gray-500'}`}>Entrar</button>
          <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${!isLogin ? 'bg-orange-500 text-orange-950 shadow-md' : 'text-gray-500'}`}>Criar Conta</button>
        </div>
        
        {(erro || erroExterno) && <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 font-bold text-center">{erro || erroExterno}</div>}
        
        <form onSubmit={handleAuthSubmit} className="w-full flex flex-col gap-3">
          <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl flex items-center gap-3 focus-within:border-emerald-500 transition-colors"><Mail size={18} className="text-gray-500" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent text-white font-medium text-sm outline-none" placeholder="Email do Negócio" required /></div>
          
          {!isLogin && (
            <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl flex items-center gap-3 focus-within:border-emerald-500 transition-colors">
              <UserCog size={18} className="text-gray-500" />
              <input type="text" maxLength={4} value={pinRecuperacao} onChange={e => setPinRecuperacao(e.target.value.replace(/\D/g, ''))} className="w-full bg-transparent text-white font-medium text-sm outline-none" placeholder="PIN de Admin (4 dígitos)" required />
            </div>
          )}

          <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl flex items-center gap-3 focus-within:border-emerald-500 transition-colors"><Key size={18} className="text-gray-500" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent text-white font-medium text-sm outline-none" placeholder="Palavra-passe" required /></div>
          
          {isLogin && <button type="button" onClick={() => { setStep('recovery'); setRecEmail(email); }} className="text-[10px] text-orange-400 font-bold self-end mt-1 uppercase tracking-widest">Esqueceste a palavra-passe?</button>}

          <button type="submit" disabled={loading} className={`w-full mt-2 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${isLogin ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white'} ${loading ? 'opacity-50' : ''}`}>
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? <><LogIn size={18}/> ACEDER CONTA</> : <>CONTINUAR <ArrowRight size={18}/></>)}
          </button>
        </form>
      </div>
    </div>
  );
}
