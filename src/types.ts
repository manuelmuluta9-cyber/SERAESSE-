export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface Funcionario {
  id: string;
  nome: string;
  foto?: string;
  senha: string;
  ativo: boolean;
  criadoEm: number;
}

export type Role = 'admin' | 'funcionario' | null;

export interface Config {
  precoHora: number;
  adminPin: string;
  sistemaAberto: boolean;
  categoriasEntrada: string[];
  categoriasDespesa: string[];
}

export interface Transacao {
  id: string;
  tipo: 'entrada' | 'despesa';
  valor: number;
  categoria: string;
  metodo?: string;
  descricao?: string;
  data: string;
  hora: string;
  criadoEm: string;
  autor: string;
  maquinaId?: string;
  funcionarioId?: string;
  tipoVenda?: 'produto' | 'sessao';
  produtoId?: string;
}

export interface Sessao {
  id: string;
  maquinaId: string;
  maquinaNome: string;
  inicio: number;
  modo: 'livre' | 'prepago' | 'pospago';
  tempoPrePagoMin: number | null;
  precoHoraAplicado: number | null;
  valorCobrado: number | null;
  autor: string;
  funcionarioId?: string;
  emPausa: boolean;
  momentoPausa: number | null;
}

export interface Maquina {
  id: string;
  nome: string;
  criadoEm: number;
}

export interface AuditoriaLog {
  id: string;
  acao: string;
  detalhe: string;
  autor: string;
  dataHora: string;
  data: string;
  hora: string;
}

export interface MensagemEquipa {
  id: string;
  autor: string;
  roleAutor?: Role;
  funcionarioId?: string;
  timestamp: number;
  tipo: 'texto' | 'audio' | 'imagem';
  texto?: string;
  textoOriginal?: string;
  url?: string;
  apagada: boolean;
  apagadaPor?: string;
  apagadaEm?: number;
  editada?: boolean;
}

export interface Assinatura {
  ativa: boolean;
  razao: 'expirada' | 'suspensa' | 'ok';
  expiracao: number;
  plano: string;
  pendente: boolean;
  mensagemAdmin?: string;
}

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  precoVenda: number;
  stockAtual: number;
  stockMinimo: number;
  unidadeMedida: string;
  ultimaReposicao?: string;
}

export interface RelatorioExportado {
  id: string;
  nome: string;
  tipo: 'pdf' | 'excel';
  dataCriacao: number;
  blobBase64: string; // Storing as base64 for offline/internal caching
  tamanho: number;
}
