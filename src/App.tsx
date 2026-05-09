import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Wallet, TrendingUp, MonitorPlay, Calendar as CalendarIcon, 
  Activity, ShieldAlert, Settings, LogIn, Lock, CheckCircle2, AlertCircle, 
  PlusCircle, Info, ChevronRight, MessageCircle, Play, Pause, Square, 
  Trash2, Timer, Clock, Edit3, ImagePlus, User, Landmark, Banknote, 
  CreditCard, UserCog, History, ChevronLeft, Download, Crown, Key, Mail,
  Send, BrainCircuit, Package, Sun, Moon
} from 'lucide-react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { 
  onSnapshot, doc, collection, setDoc, deleteDoc, addDoc, updateDoc, getDoc 
} from 'firebase/firestore';
import { NotificationCenter, AppNotification, NotificationType } from './components/NotificationCenter';

import { auth, db, appId } from './lib/firebase';
import { 
  Role, Config, Transacao, Sessao, Maquina, AuditoriaLog, MensagemEquipa, Assinatura, Funcionario, Produto 
} from './types';
import { 
  obterDataHoje, obterHoraAtual, obterDataHoraCompleta, formatarDinheiro, 
  processarComprovativo, DADOS_PAGAMENTO 
} from './lib/utils';

// Components
import { EgmanLogo } from './components/EgmanLogo';
import { GlobalNotifications } from './components/GlobalNotifications';
import { TelaAutenticacao } from './components/TelaAutenticacao';
import { TelaSelecaoRole } from './components/TelaSelecaoRole';
import { TelaAssinaturaExpirada } from './components/TelaAssinaturaExpirada';
import { Dashboard } from './components/Dashboard';
import { AdicionarTransacao } from './components/AdicionarTransacao';
import { GestorSessoes } from './components/GestorSessoes';
import { Calendario } from './components/Calendario';
import { RelatoriosInteligentes } from './components/RelatoriosInteligentes';
import { Auditoria } from './components/Auditoria';
import { Configuracoes } from './components/Configuracoes';
import { TeamChat } from './components/TeamChat';
import { GestaoFuncionarios } from './components/GestaoFuncionarios';
import { IntelligenceHub } from './components/IntelligenceHub';
import { GestaoStock } from './components/GestaoStock';
import { SuperAdmin } from './components/SuperAdmin';

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [superAdminAberto, setSuperAdminAberto] = useState(false);
  const [contaNegocio, setContaNegocio] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null); 
  const [pinInput, setPinInput] = useState("");
  const [erroPin, setErroPin] = useState(false);
  const [alertaLogin, setAlertaLogin] = useState('');
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaLog[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [currentFuncionario, setCurrentFuncionario] = useState<Funcionario | null>(null);
  
  const [temaEscuro, setTemaEscuro] = useState(() => {
    const salvo = localStorage.getItem('egman-tema');
    return salvo ? salvo === 'escuro' : true;
  });

  useEffect(() => {
    localStorage.setItem('egman-tema', temaEscuro ? 'escuro' : 'claro');
  }, [temaEscuro]);
  
  const [mostrarDicaScroll, setMostrarDicaScroll] = useState(true);
  const [avisosAbertos, setAvisosAbertos] = useState(false);
  
  const scrollBy = (dir: 'up' | 'down') => {
    if (mainRef.current) {
      const amount = dir === 'up' ? -300 : 300;
      mainRef.current.scrollBy({ top: amount, behavior: 'smooth' });
      // Esconder a dica ao interagir com o scroll
      setMostrarDicaScroll(false);
    }
  };
  
  const [config, setConfig] = useState<Config>({ 
    precoHora: 1000, adminPin: "1234", sistemaAberto: true,
    categoriasEntrada: ['Sessão Jogo', 'Consumo (Bar)', 'Torneios', 'Outros'],
    categoriasDespesa: ['Renda', 'Energia', 'Manutenção', 'Compras de Stock', 'Internet/TV', 'Outros']
  });
  
  const [telaAtual, setTelaAtual] = useState<string>('dashboard');
  const [menuAberto, setMenuAberto] = useState(false);
  const [loadingDados, setLoadingDados] = useState(true);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<Transacao | null>(null);
  const [gestaoStockAberta, setGestaoStockAberta] = useState(false);

  const [modalUI, setModalUI] = useState<{isOpen: boolean, type: string, titulo: string, mensagem: string, onConfirm: any, inputRequerido: string, placeholder: string, imagemUrl: string}>({ 
    isOpen: false, type: '', titulo: '', mensagem: '', onConfirm: null, inputRequerido: '', placeholder: '', imagemUrl: '' 
  });
  const [promptInput, setPromptInput] = useState('');

  const mostrarAlerta = (titulo: string, mensagem: string) => setModalUI({ ...modalUI, isOpen: true, type: 'alert', titulo, mensagem });
  const mostrarConfirmacao = (titulo: string, mensagem: string, onConfirm: any) => setModalUI({ ...modalUI, isOpen: true, type: 'confirm', titulo, mensagem, onConfirm });
  const mostrarPrompt = (titulo: string, mensagem: string, inputRequerido: string, onConfirm: any) => { setPromptInput(''); setModalUI({ ...modalUI, isOpen: true, type: 'prompt', titulo, mensagem, inputRequerido, onConfirm }); };
  const mostrarImagemModal = (url: string) => setModalUI({ ...modalUI, isOpen: true, type: 'image', imagemUrl: url });
  const fecharModal = () => setModalUI({ isOpen: false, type: '', titulo: '', mensagem: '', onConfirm: null, inputRequerido: '', placeholder: '', imagemUrl: '' });

  const isSistemaAberto = config.sistemaAberto !== false;
  const podeOperar = role === 'admin' || isSistemaAberto;

  const [teamChatAberto, setTeamChatAberto] = useState(false);
  const [mensagensEquipa, setMensagensEquipa] = useState<MensagemEquipa[]>([]);
  const [unreadTeam, setUnreadTeam] = useState(0);
  const lastSeenTeamRef = useRef(parseInt(localStorage.getItem('pm_last_seen_chat') || Date.now().toString()));
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notifiedSessions = useRef<Set<string>>(new Set());
  const warningSessions = useRef<Set<string>>(new Set());

  const addNotification = (type: NotificationType, title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium', targetId?: string) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: new Date(),
      isRead: false,
      priority,
      targetId
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  };

  const removeNotification = (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (notif?.type === 'session_finished' && notif.targetId) {
      const sessao = sessoes.find(s => s.id === notif.targetId);
      if (sessao && sessao.status === 'ativa') {
        terminarSessao(sessao);
      }
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    // When clearing all, we should also terminate all pending finished sessions
    notifications.forEach(n => {
      if (n.type === 'session_finished' && n.targetId) {
        const sessao = sessoes.find(s => s.id === n.targetId);
        if (sessao && sessao.status === 'ativa') {
          terminarSessao(sessao);
        }
      }
    });
    setNotifications([]);
  };

  const notifiedStock = useRef<Set<string>>(new Set());

  // Session monitor
  useEffect(() => {
    if (sessoes.length === 0 || !contaNegocio) return;

    const interval = setInterval(() => {
      const agora = Date.now();
      
      sessoes.forEach(s => {
        if (s.status !== 'ativa' || !s.fim) return;

        const tempoRestante = s.fim - agora;
        const machine = maquinas.find(m => m.id === s.maquinaId);
        const machineLabel = machine ? machine.nome : `Mesa ${s.maquinaId}`;

        // Alerta de 2 minutos (120000 ms)
        if (tempoRestante > 0 && tempoRestante <= 120000 && !warningSessions.current.has(s.id)) {
          warningSessions.current.add(s.id);
          addNotification(
            'session_ending', 
            'Tempo a Esgotar', 
            `${machineLabel} tem menos de 2 min!`, 
            'medium',
            s.id
          );
        }

        // Alerta de Término (Tempo Esgotado)
        if (tempoRestante <= 0 && !notifiedSessions.current.has(s.id)) {
          notifiedSessions.current.add(s.id);
          
          // Force a higher visual priority alert
          addNotification(
            'session_finished', 
            '!!! TEMPO ESGOTADO !!!', 
            `A sessão em ${machineLabel} terminou. Clique para liberar a máquina.`, 
            'high',
            s.id
          );
          
          // Debug sound trigger attempt
          console.log(`[ALERTA] Sessão terminada em ${machineLabel}`);
        }
      });
    }, 3000); // Check every 3 seconds for better responsiveness

    return () => clearInterval(interval);
  }, [sessoes, maquinas, contaNegocio]);

  useEffect(() => {
    if (!teamChatAberto) {
      const novas = mensagensEquipa.filter(m => m.timestamp > lastSeenTeamRef.current && m.autor !== role && !m.apagada);
      setUnreadTeam(novas.length);
    } else {
      setUnreadTeam(0);
      lastSeenTeamRef.current = Date.now();
      localStorage.setItem('pm_last_seen_chat', lastSeenTeamRef.current.toString());
    }
  }, [mensagensEquipa, teamChatAberto, role]);

  const diasRestantesGlobais = assinatura?.expiracao ? Math.ceil((assinatura.expiracao - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const [avisoSubscricaoFechado, setAvisoSubscricaoFechado] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (usr) => {
      setFirebaseUser(usr);
      if (!usr) {
        try { await signInAnonymously(auth); } catch {}
      }
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  const handleCustomAuth = async (isLogin: boolean, emailInput: string, passwordInput: string, planoChoice?: string, comprovativoBase64?: string | null, meses = 1, mensagem?: string) => {
    const emailLimpo = emailInput.toLowerCase().trim();
    
    // PORTA DE ENTRADA SECRETA (SUPER ADMIN)
    if (isLogin && emailLimpo === 'egman.admin@egman.com' && passwordInput === '0t4kum4ng4k4g4m3r') {
      setSuperAdminAberto(true);
      return;
    }

    const emailSafe = emailLimpo.replace(/[^a-z0-9]/g, '_');
    const docRef = doc(db, `artifacts/${appId}/public/data/contas`, emailSafe);
    
    if (isLogin) {
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().password === passwordInput) {
        localStorage.setItem('pm_saved_email', emailLimpo); 
        setContaNegocio(emailSafe); setAlertaLogin(''); 
      }
      else throw new Error("Email ou palavra-passe incorretos.");
    } else {
      const snap = await getDoc(docRef);
      if (snap.exists()) throw new Error("Este email já está registado.");
      const payload: any = { email: emailLimpo, password: passwordInput, criadoEm: Date.now(), ativo: true, usouTrial: planoChoice === 'trial' };
      if (planoChoice === 'trial') { 
        payload.plano = 'Trial 7 Dias'; payload.dataExpiracao = Date.now() + (7 * 24 * 60 * 60 * 1000); localStorage.setItem('pm_trial_used', 'true'); 
      } else if (planoChoice === 'premium_pendente') { 
        payload.plano = 'Aguardando Aprovação'; payload.dataExpiracao = Date.now() + (1 * 24 * 60 * 60 * 1000); payload.pagamentoPendente = { data: Date.now(), comprovativo: comprovativoBase64, meses: meses, mensagem: mensagem || "" }; 
      }
      localStorage.setItem('pm_saved_email', emailLimpo);
      await setDoc(docRef, payload);
      setContaNegocio(emailSafe); setAlertaLogin('');
    }
  };

  const handleUploadComprovativoExistente = async (base64: string, meses = 1, mensagem?: string) => {
     if (!contaNegocio) return;
     await updateDoc(doc(db, `artifacts/${appId}/public/data/contas`, contaNegocio), { 
       pagamentoPendente: { 
         data: Date.now(), 
         comprovativo: base64, 
         meses: meses,
         mensagem: mensagem || ""
       } 
     });
     mostrarAlerta("Sucesso", "Comprovativo enviado para a administração.");
  };

  useEffect(() => {
    if (!contaNegocio) return;
    const unsubConta = onSnapshot(doc(db, `artifacts/${appId}/public/data/contas`, contaNegocio), (snap) => {
      if (!snap.exists()) {
        setContaNegocio(null); setRole(null);
      } else {
        const data = snap.data();
        if (data.ativo === false) { setAssinatura({ ativa: false, razao: 'suspensa', expiracao: data.dataExpiracao, pendente: !!data.pagamentoPendente, plano: data.plano || 'Standard', mensagemAdmin: data.mensagemAdmin }); return; }
        const isExpirada = Date.now() > (data.dataExpiracao || 0);
        setAssinatura({ ativa: !isExpirada, razao: isExpirada ? 'expirada' : 'ok', expiracao: data.dataExpiracao || 0, plano: data.plano || 'Standard', pendente: !!data.pagamentoPendente, mensagemAdmin: data.mensagemAdmin });
      }
    });
    return () => unsubConta();
  }, [contaNegocio]);

  useEffect(() => {
    if (!firebaseUser || !contaNegocio || !assinatura?.ativa) return;
    setLoadingDados(true);
    const DB_PATH = `artifacts/${appId}/public/data`;
    
    const unsubTransacoes = onSnapshot(collection(db, DB_PATH, `transacoes_${contaNegocio}`), (snap) => setTransacoes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transacao)).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())));
    const unsubSessoes = onSnapshot(collection(db, DB_PATH, `sessoes_${contaNegocio}`), (snap) => setSessoes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sessao))));
    const unsubMaquinas = onSnapshot(collection(db, DB_PATH, `maquinas_${contaNegocio}`), (snap) => setMaquinas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Maquina)).sort((a, b) => a.criadoEm - b.criadoEm)));
    const unsubAuditoria = onSnapshot(collection(db, DB_PATH, `auditoria_${contaNegocio}`), (snap) => setAuditoria(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditoriaLog)).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())));
    const unsubProdutos = onSnapshot(collection(db, DB_PATH, `produtos_${contaNegocio}`), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto)).sort((a, b) => a.nome.localeCompare(b.nome));
      setProdutos(list);
      
      // Monitor Stock
      list.forEach(p => {
        if (p.stockAtual <= p.stockMinimo) {
          if (!notifiedStock.current.has(p.id)) {
            notifiedStock.current.add(p.id);
            const type = p.stockAtual === 0 ? 'high' : 'medium';
            const msg = p.stockAtual === 0 ? `ACABOU: ${p.nome}` : `Stock Baixo: ${p.nome}`;
            addNotification(
              'info', 
              msg, 
              `Restam apenas ${p.stockAtual} ${p.unidadeMedida}(s).`, 
              type as any
            );
          }
        } else {
          // Reset notification tracking if stock is replenished
          if (notifiedStock.current.has(p.id)) {
            notifiedStock.current.delete(p.id);
          }
        }
      });
    });
    const unsubChatEquipa = onSnapshot(collection(db, DB_PATH, `chat_equipa_${contaNegocio}`), (snap) => setMensagensEquipa(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MensagemEquipa)).sort((a, b) => a.timestamp - b.timestamp)));
    const unsubFuncionarios = onSnapshot(collection(db, DB_PATH, `funcionarios_${contaNegocio}`), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Funcionario));
      setFuncionarios(list);
      // Auto logout if current employee is deactivated
      if (role === 'funcionario' && currentFuncionario) {
        const matching = list.find(f => f.id === currentFuncionario.id);
        if (matching && !matching.ativo) {
          setRole(null);
          setCurrentFuncionario(null);
          mostrarAlerta("Sessão Encerrada", "O teu acesso foi bloqueado pelo administrador.");
        }
      }
    });
    
    const unsubConfig = onSnapshot(doc(db, DB_PATH, `settings_${contaNegocio}`, 'geral'), (docSnap) => {
      if (docSnap.exists()) setConfig(prev => ({ ...prev, ...docSnap.data() }));
      else setDoc(doc(db, DB_PATH, `settings_${contaNegocio}`, 'geral'), config);
      setLoadingDados(false);
    });
    
    return () => { unsubTransacoes(); unsubSessoes(); unsubMaquinas(); unsubAuditoria(); unsubProdutos(); unsubChatEquipa(); unsubFuncionarios(); unsubConfig(); };
  }, [firebaseUser, contaNegocio, assinatura?.ativa]);

  const registarAuditoria = async (acao: string, detalhe: string) => {
    if (!contaNegocio) return;
    await addDoc(collection(db, `artifacts/${appId}/public/data/auditoria_${contaNegocio}`), { acao, detalhe, autor: role || 'Sistema', dataHora: obterDataHoraCompleta(), data: obterDataHoje(), hora: obterHoraAtual() });
  };

  const atualizarConfig = async (novasConfigs: Partial<Config>) => {
    if (!contaNegocio) return;
    await setDoc(doc(db, `artifacts/${appId}/public/data/settings_${contaNegocio}`, 'geral'), { ...config, ...novasConfigs }, { merge: true });
  };

  const handleAIAction = async (call: any) => {
    const { name, args } = call;
    try {
      if (name === 'registarTransacao') {
        const nova = { ...args, data: new Date().toISOString() };
        await addDoc(collection(db, `artifacts/${appId}/public/data/transacoes_${contaNegocio}`), nova);
        await registarAuditoria('IA_ACAO', `Registou: ${args.descricao}`);
        mostrarAlerta("EGMAN AI", `Ação executada: ${args.descricao} (${formatarDinheiro(args.valor)})`);
      } else if (name === 'alterarConfiguracao') {
        await setDoc(doc(db, `artifacts/${appId}/public/data/settings_${contaNegocio}`, 'geral'), args, { merge: true });
        await registarAuditoria('IA_ACAO', "Alterou configurações.");
        mostrarAlerta("EGMAN AI", "Configurações atualizadas.");
      } else if (name === 'bloquearFuncionario') {
        await updateDoc(doc(db, `artifacts/${appId}/public/data/funcionarios_${contaNegocio}`, args.id), { ativo: args.ativo });
        await registarAuditoria('IA_ACAO', `Funcionario ${args.id} ${args.ativo ? 'ativo' : 'inativo'}`);
        mostrarAlerta("EGMAN AI", `Utilizador ${args.ativo ? 'desbloqueado' : 'bloqueado'}.`);
      }
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro IA", "Falha na execução.");
    }
  };

  const handleLoginRole = (tipoRole: 'admin' | 'funcionario', funcId?: string, senha?: string) => {
    if (tipoRole === 'funcionario') { 
      const f = funcionarios.find(v => v.id === funcId);
      if (f) {
        if (f.senha === senha) {
          if (!f.ativo) {
            mostrarAlerta("Acesso Negado", "A tua conta foi bloqueada pelo administrador.");
            addNotification('security', 'Acesso Bloqueado', `Tentativa de login por funcionário inativo: ${f.nome}`, 'high');
            return;
          }
          setRole('funcionario'); 
          setCurrentFuncionario(f);
          setPinInput("");
          addNotification('info', 'Login Efetuado', `Funcionário ${f.nome} entrou no sistema.`, 'low');
        } else {
          mostrarAlerta("Erro", "Senha incorreta.");
          addNotification('security', 'Falha de Login', `PIN incorreto tentado por ${f.nome}.`, 'medium');
        }
      }
    } 
    else { 
      if (pinInput === config.adminPin) { 
        setRole('admin'); 
        setCurrentFuncionario(null); 
        setErroPin(false); 
        setPinInput(""); 
        addNotification('security', 'Acesso Root', 'Administrador autenticado com sucesso.', 'medium');
      } else { 
        setErroPin(true); 
        setPinInput(""); 
        addNotification('security', 'Falha Crítica', 'Tentativa de acesso ADM com PIN incorreto!', 'high');
      } 
    }
  };

  const apagarContaNegocio = () => {
    mostrarConfirmacao(
      "ELIMINAR NEGÓCIO", 
      "Ação irreversível. Confirmas?", 
      async () => {
        if (!contaNegocio) return;
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/contas`, contaNegocio));
      }
    );
  };

  const adicionarTransacao = async (nova: any, produtoId?: string) => {
    if (!contaNegocio || !podeOperar) return;
    setTelaAtual('dashboard'); 
    
    const dataToSave: any = { 
      ...nova, 
      criadoEm: obterDataHoraCompleta(), 
      autor: role === 'admin' ? 'Administrador' : (currentFuncionario?.nome || role || 'Sistema'),
      funcionarioId: nova.funcionarioId || currentFuncionario?.id || undefined,
      tipoVenda: nova.tipoVenda || (produtoId ? 'produto' : (nova.categoria === 'Sessão Jogo' ? 'sessao' : undefined))
    };

    // Remove undefined fields to prevent Firestore errors
    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key] === undefined) {
        delete dataToSave[key];
      }
    });

    await addDoc(collection(db, `artifacts/${appId}/public/data/transacoes_${contaNegocio}`), dataToSave);
    registarAuditoria('ADICIONAR_TRANSACAO', `Registou ${nova.tipo} de ${formatarDinheiro(nova.valor)}`);
    
    // Decrementar Stock se houver produtoId
    if (produtoId) {
      const prod = produtos.find(p => p.id === produtoId);
      if (prod) {
        await updateDoc(doc(db, `artifacts/${appId}/public/data/produtos_${contaNegocio}`, produtoId), {
           stockAtual: Math.max(0, prod.stockAtual - 1)
        });
      }
    }

    // Alerta de Transação de Alto Valor (ex: >= 10.000 AKZ)
    if (nova.valor >= 10000) {
      addNotification(
        'high_value', 
        'Transação de Alto Valor', 
        `${role?.toUpperCase()} registou ${formatarDinheiro(nova.valor)} em ${nova.categoria}.`, 
        'medium'
      );
    }
  };

  const atualizarTransacao = (dadosAtualizados: any) => {
    if (!contaNegocio || !transacaoSelecionada || !podeOperar) return;
    setTelaAtual('dashboard'); 
    setTransacaoSelecionada(null);

    const dataToUpdate = { ...dadosAtualizados };
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    updateDoc(doc(db, `artifacts/${appId}/public/data/transacoes_${contaNegocio}`, transacaoSelecionada.id), dataToUpdate);
    registarAuditoria('EDITAR_TRANSACAO', `Editou transação`);
  };

  const apagarTransacao = (id: string, valor: number, categoria: string) => {
    if (!contaNegocio || !podeOperar) return;
    mostrarConfirmacao('Apagar', `Apagar registo de ${formatarDinheiro(valor)}?`, () => {
      deleteDoc(doc(db, `artifacts/${appId}/public/data/transacoes_${contaNegocio}`, id));
      registarAuditoria('APAGAR_TRANSACAO', `Apagou transação de ${formatarDinheiro(valor)}`);
      setTelaAtual('dashboard');
      setTransacaoSelecionada(null);
    });
  };

  const iniciarSessaoConfirmada = (maquina: Maquina, modo: 'livre' | 'prepago' | 'pospago', mins: number, valor: number) => {
    if (!contaNegocio || !podeOperar) return;
    const novaSessao = {
      maquinaId: maquina.id, maquinaNome: maquina.nome, inicio: Date.now(),
      modo: modo, tempoPrePagoMin: (modo === 'prepago' || modo === 'pospago') ? mins : null,
      precoHoraAplicado: modo === 'livre' ? valor : null, valorCobrado: (modo === 'prepago' || modo === 'pospago') ? valor : null, 
      autor: role === 'admin' ? 'Administrador' : (currentFuncionario?.nome || role || 'Sistema'),
      funcionarioId: currentFuncionario?.id || undefined,
      emPausa: false, momentoPausa: null
    };
    addDoc(collection(db, `artifacts/${appId}/public/data/sessoes_${contaNegocio}`), novaSessao);
    if (modo === 'prepago') {
      adicionarTransacao({ 
        tipo: 'entrada', 
        valor: valor, 
        categoria: 'Sessão Jogo', 
        metodo: 'Dinheiro', 
        descricao: `${maquina.nome} [PRÉ-PAGO]`, 
        data: obterDataHoje(), 
        hora: obterHoraAtual(),
        maquinaId: maquina.id,
        tipoVenda: 'sessao'
      });
    }
    registarAuditoria('SESSAO_INICIO', `Iniciou ${maquina.nome} (${modo})`);
  };

  const alternarPausaSessao = (sessao: Sessao) => {
    if (!contaNegocio || !podeOperar) return;
    const docRef = doc(db, `artifacts/${appId}/public/data/sessoes_${contaNegocio}`, sessao.id);
    if (sessao.emPausa) {
      const tempoParado = Date.now() - (sessao.momentoPausa || 0);
      updateDoc(docRef, { emPausa: false, momentoPausa: null, inicio: sessao.inicio + tempoParado });
    } else {
      updateDoc(docRef, { emPausa: true, momentoPausa: Date.now() });
    }
  };

  const terminarSessao = (sessao: Sessao) => {
    if (!contaNegocio || !podeOperar) return;
    const tempoFinal = sessao.emPausa ? sessao.momentoPausa! : Date.now();
    const duracaoMs = tempoFinal - sessao.inicio;

    if (sessao.modo === 'livre') {
      const horasJogadas = duracaoMs / (1000 * 60 * 60);
      const precoUsado = sessao.precoHoraAplicado || config.precoHora;
      const valorCalculado = Math.max(0, Math.ceil(horasJogadas * precoUsado)); 
      adicionarTransacao({ 
        tipo: 'entrada', 
        valor: valorCalculado, 
        categoria: 'Sessão Jogo', 
        metodo: 'Dinheiro', 
        descricao: `${sessao.maquinaNome} [LIVRE]`, 
        data: obterDataHoje(), 
        hora: obterHoraAtual(),
        maquinaId: sessao.maquinaId,
        funcionarioId: currentFuncionario?.id || sessao.funcionarioId,
        tipoVenda: 'sessao'
      });
    } else if (sessao.modo === 'pospago') {
      adicionarTransacao({ 
        tipo: 'entrada', 
        valor: sessao.valorCobrado, 
        categoria: 'Sessão Jogo', 
        metodo: 'Dinheiro', 
        descricao: `${sessao.maquinaNome} [PÓS-PAGO]`, 
        data: obterDataHoje(), 
        hora: obterHoraAtual(),
        maquinaId: sessao.maquinaId,
        funcionarioId: currentFuncionario?.id || sessao.funcionarioId,
        tipoVenda: 'sessao'
      });
    } else if (sessao.modo === 'prepago') {
       // A transação já foi feita no início, mas podemos querer registar quem terminou
       registarAuditoria('SESSAO_FIM', `Finalizou ${sessao.maquinaNome} (Pré-pago)`);
    }

    if (sessao.modo !== 'prepago') {
        registarAuditoria('SESSAO_FIM', `Finalizou ${sessao.maquinaNome} (${sessao.modo})`);
    }

    deleteDoc(doc(db, `artifacts/${appId}/public/data/sessoes_${contaNegocio}`, sessao.id));
  };

  const adicionarMaquinaGlobal = async (nome: string) => {
    if (!nome.trim() || !contaNegocio || !podeOperar) return;
    await addDoc(collection(db, `artifacts/${appId}/public/data/maquinas_${contaNegocio}`), { nome: nome.trim(), criadoEm: Date.now() });
    registarAuditoria('MÁQUINA_ADC', `Adicionou: ${nome}`);
  };

  const handleActivarSuperAdmin = () => {
    const pass = prompt('INSIRA A PALAVRA-PASSE DE ADMIN CLOUD:');
    if (pass === '0t4kum4ng4k4g4m3r') {
      setSuperAdminAberto(true);
    } else if (pass) {
      alert('Acesso Negado.');
    }
  };

  if (authLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (superAdminAberto) {
    return <SuperAdmin onSair={() => setSuperAdminAberto(false)} temaEscuro={temaEscuro} />;
  }

  if (!contaNegocio) return <TelaAutenticacao onCustomAuth={handleCustomAuth} erroExterno={alertaLogin} processarComprovativo={processarComprovativo} onSuperAdminClick={handleActivarSuperAdmin} />;
  if (assinatura && !assinatura.ativa) return <TelaAssinaturaExpirada razao={assinatura.razao} expiracao={assinatura.expiracao} pendente={assinatura.pendente} mensagemAdmin={assinatura.mensagemAdmin} fazerLogout={() => { setContaNegocio(null); setRole(null); }} processarComprovativo={processarComprovativo} onUpload={handleUploadComprovativoExistente} />;
  if (loadingDados) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-orange-400 font-bold gap-3"><div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div> Abrindo Cloud...</div>;
  if (!role) return <TelaSelecaoRole pinInput={pinInput} setPinInput={setPinInput} handleLoginRole={handleLoginRole} erroPin={erroPin} fazerLogout={() => { setContaNegocio(null); setRole(null); }} emailAtual={contaNegocio} funcionarios={funcionarios} />;

  return (
    <div className={`fixed inset-0 ${temaEscuro ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'} font-sans flex justify-center selection:bg-orange-500/30 overflow-hidden touch-none transition-colors duration-300`}>
      <div className={`w-full max-w-md ${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} h-full relative shadow-2xl flex flex-col border-x`}>
        
        {/* Floating Scroll Controls */}
        <div className="fixed bottom-24 right-[calc(50%-200px)] md:right-[calc(50%-190px)] flex flex-col items-end gap-2 z-[60] pointer-events-none">
          <AnimatePresence>
            {mostrarDicaScroll && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-orange-500 text-gray-950 p-3 rounded-2xl shadow-2xl text-[10px] font-black uppercase tracking-wider mb-2 flex items-center gap-2 pointer-events-auto border-4 border-gray-950"
              >
                <span>Use as setas se o deslize falhar</span>
                <button onClick={() => setMostrarDicaScroll(false)} className="bg-gray-950/20 p-1 rounded-full text-gray-950 hover:bg-gray-950/40">
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => scrollBy('up')}
              className="w-10 h-10 bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-full flex items-center justify-center text-orange-500 shadow-xl pointer-events-auto active:scale-95 transition-transform"
            >
              <ChevronRight className="-rotate-90" size={20} />
            </button>
            <button 
              onClick={() => scrollBy('down')}
              className="w-10 h-10 bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-full flex items-center justify-center text-orange-500 shadow-xl pointer-events-auto active:scale-95 transition-transform"
            >
              <ChevronRight className="rotate-90" size={20} />
            </button>
          </div>
        </div>
        
        {/* Modal UI Handler */}
        {modalUI.isOpen && (
          <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            {modalUI.type === 'image' ? (
              <div className="relative w-full max-w-2xl flex flex-col items-center">
                 <button onClick={fecharModal} className="absolute -top-12 right-0 bg-gray-800 text-white p-2 rounded-full"><X size={24}/></button>
                 <img src={modalUI.imagemUrl} alt="Visualização" className="w-full h-auto max-h-[90vh] object-contain rounded-2xl border border-gray-800" />
              </div>
            ) : (
             <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-[320px] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-4 bg-gray-800 text-white border-b border-gray-700 font-black uppercase text-sm">{modalUI.titulo}</div>
                <div className="p-5 flex flex-col gap-4">
                   <p className="text-sm text-gray-300">{modalUI.mensagem}</p>
                   <div className="flex gap-2">
                      <button onClick={fecharModal} className="flex-1 py-3 rounded-xl font-bold text-xs bg-gray-800 text-gray-400 uppercase">Cancelar</button>
                      <button onClick={() => { if (modalUI.onConfirm) modalUI.onConfirm(); fecharModal(); }} className="flex-1 py-3 rounded-xl font-bold text-xs bg-orange-600 text-white uppercase">Confirmar</button>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        <header className={`${temaEscuro ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b p-2 flex justify-between items-center z-10 sticky top-0 shadow-md transition-colors`}>
          <div className="flex items-center gap-2">
            <EgmanLogo size={24} />
            <div className="flex flex-col"><span className={`${temaEscuro ? 'text-white' : 'text-gray-900'} font-black text-xs leading-none`}>EGMAN PLAY</span><span className="text-orange-500 font-bold text-[7px] leading-none tracking-widest mt-0.5 sm:text-[9px]">MANAGER</span></div>
          </div>
          <div className="flex items-center gap-0.5">
            {!isOnline && (
              <div className="flex items-center gap-1 bg-red-500/20 text-red-500 px-2 py-1 rounded-full mr-1 animate-pulse">
                <ShieldAlert size={12} />
                <span className="text-[8px] font-black uppercase tracking-tighter">Offline</span>
              </div>
            )}
            {isOnline && (
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full mr-1">
                <CheckCircle2 size={12} />
                <span className="text-[8px] font-black uppercase tracking-tighter">Online</span>
              </div>
            )}
            <button 
              onClick={() => setTemaEscuro(!temaEscuro)} 
              className={`p-1.5 ${temaEscuro ? 'hover:bg-gray-800 text-yellow-500' : 'hover:bg-gray-100 text-gray-600'} rounded-full transition-colors`}
            >
              {temaEscuro ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {podeOperar && (
               <button onClick={() => setTeamChatAberto(true)} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors relative text-orange-500">
                  <MessageCircle size={18} />
                  {unreadTeam > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full border border-gray-950 animate-bounce">{unreadTeam}</span>}
               </button>
            )}
            <NotificationCenter 
              notifications={notifications} 
              onDismiss={removeNotification} 
              onClearAll={clearNotifications} 
            />
            <span className={`hidden sm:block text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700 text-gray-300'}`}>{role}</span>
            <button onClick={() => setMenuAberto(!menuAberto)} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-white">{menuAberto ? <X size={20}/> : <Menu size={20}/>}</button>
          </div>
        </header>

        {diasRestantesGlobais !== null && diasRestantesGlobais <= 3 && !avisoSubscricaoFechado && (
          <div className="bg-orange-500 text-white text-[9px] font-black text-center py-1.5 px-6 shadow-lg uppercase relative z-10 border-b border-orange-700">
            FALTAM {diasRestantesGlobais} DIAS! RENOVE JÁ!
            <button onClick={() => setAvisoSubscricaoFechado(true)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1"><X size={10}/></button>
          </div>
        )}

        {menuAberto && (
          <div className="absolute top-[70px] right-2 w-64 bg-gray-900/98 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-800 z-50 rounded-3xl animate-in fade-in slide-in-from-top-4">
            <div className="p-3 flex flex-col gap-1">
              {[
                { icon: Wallet, text: "Dashboard", tela: 'dashboard' },
                { 
                  icon: MonitorPlay, 
                  text: "Sessões", 
                  tela: 'sessoes', 
                  critical: notifications.some(n => n.type === 'session_finished') 
                },
                { icon: CalendarIcon, text: "Calendário", tela: 'calendar' }
              ].map(item => (
                <button 
                  key={item.tela} 
                  onClick={() => { setTelaAtual(item.tela); setMenuAberto(false); }} 
                  className={`flex items-center gap-3 text-left p-3 rounded-xl transition-colors font-medium text-sm ${
                    (item as any).critical 
                      ? 'bg-red-500/20 text-red-400 animate-pulse' 
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className="relative">
                    <item.icon size={18} />
                    {(item as any).critical && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-ping" />}
                  </div> 
                  {item.text}
                </button>
              ))}
              {role === 'admin' && (
                <>
                  <div className="border-t border-gray-800 my-1"></div>
                  {[
                    { icon: BrainCircuit, text: "Inteligência IA", tela: 'intelligence' },
                    { icon: Package, text: "Gestão Stock", action: () => setGestaoStockAberta(true) },
                    { icon: Activity, text: "Relatórios Pro", tela: 'reports' },
                    { icon: ShieldAlert, text: "Auditoria", tela: 'auditoria' },
                    { icon: Settings, text: "Configurações", tela: 'settings' }
                  ].map(item => (
                    <button 
                      key={item.text} 
                      onClick={() => { 
                        if (item.tela) setTelaAtual(item.tela); 
                        if (item.action) item.action();
                        setMenuAberto(false); 
                      }} 
                      className="flex items-center gap-3 text-left p-3 hover:bg-gray-800 rounded-xl transition-colors font-medium text-sm text-gray-300"
                    >
                      <item.icon size={18} /> {item.text}
                    </button>
                  ))}
                </>
              )}
              <div className="border-t border-gray-800 my-1"></div>
              <button onClick={() => { setRole(null); setTelaAtual('dashboard'); setMenuAberto(false); }} className="flex items-center gap-3 text-left p-3 hover:bg-gray-800 rounded-xl text-yellow-500 font-bold text-sm"><Lock size={18} /> Trancar</button>
              <button onClick={() => { setContaNegocio(null); setRole(null); setMenuAberto(false); setTelaAtual('dashboard'); }} className="flex items-center gap-3 text-left p-3 hover:bg-gray-800 rounded-xl text-red-400 font-bold text-sm"><LogIn size={18} /> Sair</button>
            </div>
          </div>
        )}

        <main ref={mainRef} className={`flex-1 overflow-y-auto pb-8 scrollbar-hide ${temaEscuro ? 'bg-[#0a0f16]' : 'bg-gray-50'} relative touch-pan-y transition-colors`}>
          <AnimatePresence mode="wait">
            {telaAtual === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard transacoes={transacoes} produtos={produtos} setTelaAtual={setTelaAtual} role={role!} podeOperar={podeOperar} apagarTransacao={apagarTransacao} editarTransacao={(t) => { setTransacaoSelecionada(t); setTelaAtual('add'); }} maquinas={maquinas} temaEscuro={temaEscuro} />
              </motion.div>
            )}
            {telaAtual === 'add' && podeOperar && (
              <motion.div
                key="add"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                <AdicionarTransacao 
                  produtos={produtos}
                  transacaoInicial={transacaoSelecionada} 
                  onSalvar={transacaoSelecionada ? atualizarTransacao : adicionarTransacao} 
                  onCancelar={() => { setTelaAtual('dashboard'); setTransacaoSelecionada(null); }} 
                  config={config} 
                  atualizarConfig={atualizarConfig} 
                  onApagar={() => transacaoSelecionada && apagarTransacao(transacaoSelecionada.id, transacaoSelecionada.valor, transacaoSelecionada.categoria)} 
                  temaEscuro={temaEscuro}
                />
              </motion.div>
            )}
            {gestaoStockAberta && (
              <motion.div
                key="stock"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[60] bg-gray-950 overflow-y-auto"
              >
                <GestaoStock 
                  produtos={produtos}
                  transacoes={transacoes}
                  contaNegocio={contaNegocio!}
                  onBack={() => setGestaoStockAberta(false)}
                  mostrarAlerta={mostrarAlerta}
                  registarAuditoria={registarAuditoria}
                  temaEscuro={temaEscuro}
                />
              </motion.div>
            )}
            {telaAtual === 'sessoes' && (
              <motion.div
                key="sessoes"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GestorSessoes config={config} sessoes={sessoes} maquinas={maquinas} role={role!} podeOperar={podeOperar} iniciarSessaoConfirmada={iniciarSessaoConfirmada} alternarPausaSessao={alternarPausaSessao} terminarSessao={terminarSessao} registarAuditoria={registarAuditoria} mostrarConfirmacao={mostrarConfirmacao} adicionarMaquinaGlobal={adicionarMaquinaGlobal} db={db} appId={appId} contaNegocio={contaNegocio} temaEscuro={temaEscuro} />
              </motion.div>
            )}
            {telaAtual === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Calendario transacoes={transacoes} podeOperar={podeOperar} editarTransacao={(t) => { setTransacaoSelecionada(t); setTelaAtual('add'); }} apagarTransacao={apagarTransacao} temaEscuro={temaEscuro} />
              </motion.div>
            )}
            {telaAtual === 'reports' && role === 'admin' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
              >
                <RelatoriosInteligentes transacoes={transacoes} appId={appId} contaNegocio={contaNegocio!} mostrarAlerta={mostrarAlerta} temaEscuro={temaEscuro} />
              </motion.div>
            )}
            {telaAtual === 'intelligence' && role === 'admin' && (
              <motion.div
                key="intelligence"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <IntelligenceHub transacoes={transacoes} maquinas={maquinas} funcionarios={funcionarios} produtos={produtos} sessoes={sessoes} config={config} onAIAction={handleAIAction} />
              </motion.div>
            )}
            {telaAtual === 'auditoria' && role === 'admin' && (
              <motion.div
                key="auditoria"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Auditoria logs={auditoria} temaEscuro={temaEscuro} />
              </motion.div>
            )}
            {telaAtual === 'settings' && role === 'admin' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-6"
              >
                <Configuracoes 
                  config={config} 
                  atualizarConfig={atualizarConfig} 
                  assinatura={assinatura} 
                  onUpload={handleUploadComprovativoExistente} 
                  processarComprovativo={processarComprovativo} 
                  mostrarAlerta={mostrarAlerta} 
                  registarAuditoria={registarAuditoria} 
                  apagarContaNegocio={apagarContaNegocio} 
                  onVerHistorico={() => setAvisosAbertos(true)}
                  temaEscuro={temaEscuro} 
                />
                <div className="px-4 pb-20">
                  <GestaoFuncionarios funcionarios={funcionarios} db={db} appId={appId} contaNegocio={contaNegocio} registarAuditoria={registarAuditoria} mostrarConfirmacao={mostrarConfirmacao} mostrarAlerta={mostrarAlerta} processarComprovativo={processarComprovativo} temaEscuro={temaEscuro} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {teamChatAberto && <TeamChat mensagensEquipa={mensagensEquipa} role={role} currentFuncionario={currentFuncionario} funcionarios={funcionarios} db={db} appId={appId} contaNegocio={contaNegocio!} setTeamChatAberto={setTeamChatAberto} mostrarConfirmacao={mostrarConfirmacao} mostrarImagemModal={mostrarImagemModal} processarComprovativo={processarComprovativo} temaEscuro={temaEscuro} />}

        <nav className="shrink-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 flex justify-between items-center px-2 py-2 z-20 pb-safe-offset-2">
          {[
            { icon: Wallet, text: "Início", tela: 'dashboard' },
            { 
              icon: MonitorPlay, 
              text: "Sessões", 
              tela: 'sessoes', 
              critical: notifications.some(n => n.type === 'session_finished') 
            },
            { icon: PlusCircle, text: "Add", tela: 'add', isMain: true },
            { icon: CalendarIcon, text: "Historial", tela: 'calendar' },
            { icon: Activity, text: "KPIs", tela: 'reports', adminOnly: true }
          ].map(btn => {
            if (btn.adminOnly && role !== 'admin') return <div key={btn.tela} className="w-[40px]"></div>;
            if (btn.isMain) return (
              <div key={btn.tela} className="relative -top-4">
                {podeOperar ? (
                  <button onClick={() => { setTransacaoSelecionada(null); setTelaAtual('add'); }} className="bg-gradient-to-tr from-orange-500 to-amber-400 text-gray-950 p-2.5 rounded-full shadow-xl border-4 border-gray-950 active:scale-90 transition-transform">
                    <PlusCircle size={20} />
                  </button>
                ) : (
                  <div className="bg-gray-800 text-gray-600 p-2.5 rounded-full border-4 border-gray-950 cursor-not-allowed shadow-inner"><Lock size={20} /></div>
                )}
              </div>
            );
            const isCritical = (btn as any).critical;
            return (
              <button 
                key={btn.tela} 
                onClick={() => setTelaAtual(btn.tela)} 
                className={`flex flex-col items-center gap-0.5 p-1 w-[50px] transition-all relative ${
                  isCritical 
                    ? 'text-red-500' 
                    : (telaAtual === btn.tela ? 'text-orange-500 scale-105' : 'text-gray-500 hover:text-gray-400')
                }`}
              >
                <div className="relative">
                  <btn.icon size={15} className={isCritical ? 'animate-bounce' : ''} />
                  {isCritical && (
                    <>
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-600 rounded-full border-2 border-gray-900 shadow-[0_0_15px_rgba(220,38,38,1)]" />
                      <span className="absolute -inset-2 bg-red-600/20 rounded-full animate-ping" />
                    </>
                  )}
                </div>
                <span className={`text-[5.5px] font-black uppercase tracking-tight ${isCritical ? 'text-red-500' : ''}`}>{btn.text}</span>
                {telaAtual === btn.tela && !isCritical && (
                  <motion.div layoutId="underline" className="absolute -bottom-1 w-4 h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <GlobalNotifications 
        accountId={contaNegocio} 
        forceOpen={avisosAbertos} 
        onClose={() => setAvisosAbertos(false)} 
      />
    </div>
  );
}
