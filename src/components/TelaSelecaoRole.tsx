import React, { useState } from 'react';
import { Users, UserCog, ChevronRight, ChevronLeft, LogIn, User, Lock, Key } from 'lucide-react';
import { EgmanLogo } from './EgmanLogo';
import { Role, Funcionario } from '../types';

interface Props {
  pinInput: string;
  setPinInput: React.Dispatch<React.SetStateAction<string>>;
  handleLoginRole: (tipoRole: 'admin' | 'funcionario', funcId?: string, senha?: string) => void;
  erroPin: boolean;
  fazerLogout: () => void;
  emailAtual: string;
  funcionarios: Funcionario[];
}

export function TelaSelecaoRole({ pinInput, setPinInput, handleLoginRole, erroPin, fazerLogout, emailAtual, funcionarios }: Props) {
  const [selecionandoAdmin, setSelecionandoAdmin] = useState(false);
  const [selecionandoFuncionario, setSelecionandoFuncionario] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null);
  const [senhaFuncionario, setSenhaFuncionario] = useState('');

  const voltar = () => {
    setSelecionandoAdmin(false);
    setSelecionandoFuncionario(false);
    setFuncionarioSelecionado(null);
    setSenhaFuncionario('');
    setPinInput("");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex justify-center items-center font-sans text-gray-100">
      <div className="w-full max-w-md bg-gray-900 min-h-screen flex flex-col items-center p-6 shadow-2xl relative overflow-y-auto scrollbar-hide pb-10">
        <div className="absolute top-4 right-4 bg-gray-800/50 border border-gray-700 px-3 py-1 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[9px] font-bold text-gray-300 uppercase truncate max-w-[120px]">{emailAtual.replace(/_/g, '.')}</span>
        </div>
        
        <div className={`flex flex-col items-center transition-all duration-300 ${(selecionandoAdmin || selecionandoFuncionario) ? 'mt-4 mb-4' : 'mt-16 mb-6'}`}>
          <EgmanLogo size={(selecionandoAdmin || selecionandoFuncionario) ? 80 : 140} className="mb-4 drop-shadow-2xl transition-all" />
          <h1 className="text-xl font-black tracking-widest text-white">EGMAN <span className="text-orange-500">PLAY</span></h1>
          <p className="text-gray-400 text-[10px] tracking-widest uppercase mt-1">
            {funcionarioSelecionado ? `Bem-vindo, ${funcionarioSelecionado.nome}` : selecionandoFuncionario ? 'Seleciona o teu perfil' : 'Quem está a usar o dispositivo?'}
          </p>
        </div>

        {(!selecionandoAdmin && !selecionandoFuncionario) && (
          <div className="w-full max-w-[280px] flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <button onClick={() => setSelecionandoFuncionario(true)} className="bg-gray-800 p-5 rounded-2xl flex items-center justify-between hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-gray-700 p-3 rounded-xl"><Users size={24}/></div>
                <div className="text-left"><p className="font-bold text-white text-lg">Funcionário</p><p className="text-[10px] text-gray-400">Acesso Restrito</p></div>
              </div>
              <ChevronRight className="text-gray-500" />
            </button>
            <button onClick={() => setSelecionandoAdmin(true)} className="bg-gray-800 p-5 rounded-2xl flex items-center justify-between hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-gray-700 p-3 rounded-xl"><UserCog size={24}/></div>
                <div className="text-left"><p className="font-bold text-white text-lg">Administrador</p><p className="text-[10px] text-gray-400">Controlo Total</p></div>
              </div>
              <ChevronRight className="text-gray-500" />
            </button>
            <button onClick={fazerLogout} className="mt-6 text-[10px] font-bold text-red-500 uppercase tracking-widest flex justify-center items-center gap-1 w-full p-2 hover:bg-red-500/10 rounded-lg"><LogIn size={12}/> Sair da Conta</button>
          </div>
        )}

        {selecionandoFuncionario && !funcionarioSelecionado && (
          <div className="w-full flex flex-col gap-3 animate-in slide-in-from-right-4">
             <button onClick={voltar} className="self-start text-gray-400 flex items-center gap-2 mb-2 hover:text-white"><ChevronLeft size={20}/> Voltar</button>
             <div className="grid grid-cols-2 gap-3">
                {funcionarios.map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => setFuncionarioSelecionado(f)}
                    className="bg-gray-800 p-4 rounded-2xl flex flex-col items-center gap-3 hover:bg-gray-750 transition-all active:scale-95 border border-gray-700/50"
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-orange-500/20">
                      {f.foto ? <img src={f.foto} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-gray-500" />}
                    </div>
                    <span className="font-black text-xs text-white uppercase tracking-tight">{f.nome}</span>
                  </button>
                ))}
                {funcionarios.length === 0 && (
                  <div className="col-span-2 py-10 text-center text-gray-500 bg-gray-800/20 rounded-2xl border border-dashed border-gray-800">
                    Nenhum funcionário criado.
                  </div>
                )}
             </div>
          </div>
        )}

        {funcionarioSelecionado && (
          <div className="w-full max-w-[280px] flex flex-col gap-6 animate-in zoom-in-95">
             <button onClick={() => setFuncionarioSelecionado(null)} className="self-start text-gray-400 flex items-center gap-2 hover:text-white"><ChevronLeft size={20}/> Escolher outro</button>
             
             <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full border-4 border-orange-500/30 overflow-hidden shadow-2xl">
                  {funcionarioSelecionado.foto ? <img src={funcionarioSelecionado.foto} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-gray-700 bg-gray-800" />}
                </div>
                <div className="text-center">
                   <h2 className="text-xl font-black text-white uppercase">{funcionarioSelecionado.nome}</h2>
                   <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em]">Introduz a tua senha</p>
                </div>
             </div>

             <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Lock size={18}/></div>
                <input 
                  autoFocus
                  type="password" 
                  value={senhaFuncionario} 
                  onChange={e => setSenhaFuncionario(e.target.value)} 
                  placeholder="Senha de Acesso"
                  className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-gray-600 outline-none focus:border-orange-500 transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleLoginRole('funcionario', funcionarioSelecionado.id, senhaFuncionario)}
                />
             </div>

             <button 
               onClick={() => handleLoginRole('funcionario', funcionarioSelecionado.id, senhaFuncionario)}
               className="bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-sm"
             >
               Confirmar Acesso <ChevronRight size={18}/>
             </button>
          </div>
        )}

        {selecionandoAdmin && (
          <div className="w-full flex flex-col items-center animate-in slide-in-from-right-4">
            <button onClick={voltar} className="self-start text-gray-400 flex items-center gap-2 mb-4 hover:text-white"><ChevronLeft size={20}/> Voltar</button>
            <p className="text-gray-400 mb-2 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Key size={12}/> PIN de Administrador</p>
            <div className="flex gap-4 mb-6">{[0, 1, 2, 3].map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${pinInput.length > i ? 'bg-orange-500 border-orange-500 scale-110 shadow-lg shadow-orange-500/40' : 'border-gray-700 bg-gray-800'}`}></div>))}</div>
            {erroPin && <p className="text-red-400 text-sm mb-4 font-bold bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">PIN INCORRETO!</p>}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (<button key={num} onClick={() => setPinInput(p => p.length < 4 ? p + num : p)} className="bg-gray-800 text-2xl py-4 rounded-2xl font-black hover:bg-gray-700 active:scale-95 transition-all border border-gray-700/50">{num}</button>))}
              <button onClick={() => setPinInput("")} className="bg-gray-900 text-[10px] font-black text-gray-400 rounded-2xl active:scale-95 transition-all uppercase">Limpar</button>
              <button onClick={() => setPinInput(p => p.length < 4 ? p + '0' : p)} className="bg-gray-800 text-2xl py-4 rounded-2xl font-black hover:bg-gray-700 active:scale-95 transition-all border border-gray-700/50">0</button>
              <button onClick={() => handleLoginRole('admin')} className="bg-orange-600 text-white text-lg py-4 rounded-2xl font-black hover:bg-orange-500 active:scale-95 transition-all shadow-xl shadow-orange-500/30">OK</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
