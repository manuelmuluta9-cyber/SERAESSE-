import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { AuditoriaLog } from '../types';

interface Props {
  logs: AuditoriaLog[];
  temaEscuro?: boolean;
}

export function Auditoria({ logs, temaEscuro }: Props) {
  return (
    <div className={`p-4 pb-20 animate-in fade-in duration-300 ${temaEscuro ? 'text-white' : 'text-gray-900'}`}>
      <h2 className={`text-xl font-black ${temaEscuro ? 'text-white' : 'text-gray-900'} mb-6 flex gap-2 items-center`}><ShieldAlert className="text-orange-500"/> Auditoria</h2>
      {logs.length === 0 ? (
        <div className={`text-center p-8 ${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} rounded-2xl border`}><ShieldAlert size={32} className="text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm font-medium">Sem registos.</p></div>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.slice(0, 50).map(log => (
            <div key={log.id} className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} border p-4 rounded-2xl flex flex-col gap-1 shadow-sm`}>
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{log.acao}</span><span className="text-[9px] text-gray-500 font-bold uppercase">{log.data} às {log.hora}</span></div>
              <p className={`text-sm ${temaEscuro ? 'text-gray-300' : 'text-gray-600'} font-medium mt-1 leading-relaxed`}>{log.detalhe}</p>
              <span className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-black">Autor: <span className={temaEscuro ? 'text-white' : 'text-gray-900'}>{log.autor}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
