
import React from 'react';
import { 
  AlertTriangle, 
  HelpCircle, 
  TrendingUp, 
  Box, 
  FolderOpen, 
  Sparkles, 
  MoreHorizontal,
  Sun,
  Moon,
  Clock,
  Wrench,
  Monitor,
  Cpu
} from 'lucide-react';
import { EventCategory, ShiftType } from './types';

export const EVENT_METADATA: Record<EventCategory, { icon: React.ReactNode, color: string, description: string, bgColor: string }> = {
  [EventCategory.FALHA]: {
    icon: <AlertTriangle size={18} />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Falha em equipamento ou processo',
  },
  [EventCategory.DIFICULDADE]: {
    icon: <HelpCircle size={18} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: 'Problema encontrado na linha',
  },
  [EventCategory.MELHORIA]: {
    icon: <TrendingUp size={18} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    description: 'Sugestão de melhoria',
  },
  [EventCategory.NPI]: {
    icon: <Box size={18} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Novo produto/introdução',
  },
  [EventCategory.PROJETO]: {
    icon: <FolderOpen size={18} />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    description: 'Projeto em andamento',
  },
  [EventCategory.CINCO_S]: {
    icon: <Sparkles size={18} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Ação de 5S',
  },
  [EventCategory.FERRAMENTA]: {
    icon: <Wrench size={18} />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    description: 'Ocorrência em Ferramental',
  },
  [EventCategory.PERIFERICOS]: {
    icon: <Monitor size={18} />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    description: 'Ocorrência em Periféricos',
  },
  [EventCategory.MAQUINA]: {
    icon: <Cpu size={18} />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    description: 'Ocorrência em Máquina/Laser',
  },
  [EventCategory.OUTROS]: {
    icon: <MoreHorizontal size={18} />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: 'Outros eventos',
  },
};

export const SHIFT_METADATA: Record<ShiftType, { icon: React.ReactNode, color: string }> = {
  [ShiftType.ADM]: {
    icon: <Sun size={18} />,
    color: 'text-orange-500',
  },
  [ShiftType.SEGUNDO]: {
    icon: <Moon size={18} />,
    color: 'text-indigo-500',
  },
  [ShiftType.TERCEIRO]: {
    icon: <Clock size={18} />,
    color: 'text-slate-700',
  },
};
