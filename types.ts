
export enum ShiftType {
  ADM = 'ADM',
  SEGUNDO = 'Segundo',
  TERCEIRO = 'Terceiro'
}

export enum EventCategory {
  FALHA = 'Falha',
  DIFICULDADE = 'Dificuldade',
  MELHORIA = 'Melhoria',
  NPI = 'NPI',
  PROJETO = 'Projeto',
  CINCO_S = '5S',
  FERRAMENTA = 'Ferramenta',
  PERIFERICOS = 'Periféricos',
  MAQUINA = 'Máquina',
  OUTROS = 'Outros'
}

export enum EventPriority {
  BAIXA = 'Baixa',
  MEDIA = 'Media',
  ALTA = 'Alta',
  CRITICA = 'Critica'
}

export enum EventStatus {
  ABERTO = 'Aberto',
  EM_ANDAMENTO = 'Em andamento',
  RESOLVIDO = 'Resolvido',
  ENCERRADO = 'Encerrado'
}

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isDeveloper?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  category: EventCategory;
  userId?: string | null;
  eventId?: string;
  audience?: string | null;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface ChatAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  room: 'global' | 'sector';
  sector?: string | null;
  userId: string;
  userName: string;
  text: string | null;
  attachments?: ChatAttachment[] | null;
  replyToId?: string | null;
  replyToUserName?: string | null;
  replyToText?: string | null;
  createdAt: number;
}

export interface ShiftEvent {
  id: string;
  date: string;
  shift: ShiftType;
  line: string;
  product?: string;
  equipment?: string;
  category: EventCategory;
  priority?: EventPriority;
  status?: EventStatus;
  title: string;
  description: string;
  solution?: string;
  impact?: string;
  lostPieces?: number;
  reworkCount?: number;
  downtimeMinutes?: number;
  startTime?: string;
  endTime?: string;
  photos?: string[];
  equipmentSubtype?: string;
  editCount?: number;
  editHistory?: Array<{
    editedBy: string;
    editedAt: number;
    prev: Partial<ShiftEvent>;
  }>;
  userId: string;
  userName: string;
  sector: string;
  timestamp: number;
  comments?: Comment[];
  lastEditedBy?: string;
  lastEditedAt?: number;
}
