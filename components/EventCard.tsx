
import React from 'react';
import { ShiftEvent } from '../types';
import { EVENT_METADATA, SHIFT_METADATA } from '../constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Clock, Play } from 'lucide-react';

interface EventCardProps {
  event: ShiftEvent;
  onClick?: (event: ShiftEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const meta = EVENT_METADATA[event.category];
  const shiftMeta = SHIFT_METADATA[event.shift];
  const getDurationMinutes = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    if ([startHours, startMinutes, endHours, endMinutes].some(Number.isNaN)) return null;
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    const diff = endTotal - startTotal;
    return diff >= 0 ? diff : diff + 24 * 60;
  };
  const durationMinutes = getDurationMinutes(event.startTime, event.endTime);

  return (
    <div 
      onClick={() => onClick?.(event)}
      className={`
        bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-8 
        transition-all duration-300 cursor-pointer group hover:shadow-2xl hover:border-indigo-100
        flex flex-col md:flex-row gap-8 items-center md:items-start
      `}
    >
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0 ${meta.bgColor} ${meta.color} transition-transform group-hover:scale-105`}>
        {React.cloneElement(meta.icon as React.ReactElement<{ size?: number }>, { size: 40 })}
      </div>
      
      <div className="flex-1 min-w-0 text-center md:text-left w-full">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${meta.bgColor} ${meta.color}`}>
            {event.category}
          </span>
          <span className="text-slate-200 dark:text-slate-700">•</span>
          <span className="text-xs font-bold text-slate-400">
            {format(event.timestamp, "HH:mm '·' d 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
        
        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 truncate">
          {event.title}
        </h3>
        <p className="text-slate-400 dark:text-slate-400 text-sm font-medium mb-6 line-clamp-2">
          {event.description}
        </p>
        
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linha:</span>
            <span className="text-xs text-slate-700 dark:text-slate-200 font-black">{event.line}</span>
          </div>

          {event.equipment && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento:</span>
              <span className="text-xs text-slate-700 dark:text-slate-200 font-black">{event.equipment}</span>
            </div>
          )}

          {event.product && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto:</span>
              <span className="text-xs text-slate-700 dark:text-slate-200 font-black">{event.product}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
            <span className={`${shiftMeta.color}`}>{shiftMeta.icon}</span>
            <span className="text-xs text-slate-700 dark:text-slate-200 font-black">{event.shift}</span>
          </div>

          {event.startTime && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
              <Clock size={14} className="text-amber-500" />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Inicio:</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-black">{event.startTime}</span>
            </div>
          )}

          {event.endTime && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <Play size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Liberacao:</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-black">{event.endTime}</span>
            </div>
          )}

          {durationMinutes !== null && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
              <Clock size={14} className="text-slate-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo:</span>
              <span className="text-xs text-slate-700 dark:text-slate-200 font-black">{durationMinutes} min</span>
            </div>
          )}

          <div className="md:ml-auto flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Relatado por:</span>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-widest">
              {event.userName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
