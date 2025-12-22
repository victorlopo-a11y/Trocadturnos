
import React, { useState } from 'react';
import { X, Layout, Clock, CheckCircle2, AlertTriangle, FileText, Camera, Play, MessageSquare, Send, Edit2, Trash2, History, AlertCircle, Search } from 'lucide-react';
import { ShiftEvent } from '../types';
import { EVENT_METADATA, SHIFT_METADATA } from '../constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface EventDetailModalProps {
  event: ShiftEvent | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddComment: (eventId: string, text: string) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, canManage, onClose, onEdit, onDelete, onAddComment }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  if (!event) return null;

  const meta = EVENT_METADATA[event.category];

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(event.id, commentText);
    setCommentText('');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border dark:border-slate-800">
          
          <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${meta.bgColor} ${meta.color}`}>{meta.icon}</div>
              <div>
                <h2 className="text-lg font-black dark:text-white leading-tight">{event.title}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{event.category} • {event.shift}</p>
                  {event.lastEditedBy && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 rounded text-[8px] font-black text-amber-600 uppercase tracking-tighter">
                      <History size={8} /> Editado por {event.lastEditedBy}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {canManage && (
                <div className="flex items-center gap-2 mr-4 pr-4 border-r dark:border-slate-800">
                  <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"><Edit2 size={14} /> Editar</button>
                  <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14} /> Excluir</button>
                </div>
              )}
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 transition-all"><X size={20} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 p-8 overflow-y-auto space-y-8 border-r dark:border-slate-800 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem icon={<Layout size={16} />} label="Linha" value={event.line} />
                <InfoItem icon={<Clock size={16} />} label="Horário" value={format(event.timestamp, "HH:mm")} />
                {event.downtime !== undefined && event.downtime > 0 && <InfoItem icon={<Clock size={16} />} label="Parada" value={`${event.downtime} min`} color="text-red-500" />}
                {event.releaseTime ? <InfoItem icon={<Play size={16} />} label="Liberação" value={event.releaseTime} color="text-emerald-500" /> : event.equipmentSubtype && <InfoItem icon={<Search size={16} />} label="Modelo" value={event.equipmentSubtype} />}
              </div>

              <Section title="Descrição" icon={<FileText size={16} />}>
                <p className="text-slate-600 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl leading-relaxed">{event.description}</p>
              </Section>

              {event.impact && (
                <Section title="Impacto na Produção" icon={<AlertCircle size={16} />} color="text-amber-500">
                  <p className="text-amber-700 dark:text-amber-400 text-sm font-bold bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl">{event.impact}</p>
                </Section>
              )}

              {event.solution && (
                <Section title="Solução Aplicada" icon={<CheckCircle2 size={16} />} color="text-emerald-500">
                  <p className="text-emerald-700 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl">{event.solution}</p>
                </Section>
              )}

              {event.photos && event.photos.length > 0 && (
                <Section title="Fotos" icon={<Camera size={16} />}>
                  <div className="flex flex-wrap gap-3">
                    {event.photos.map((p, i) => (
                      <img key={i} src={p} className="w-28 h-28 object-cover rounded-2xl cursor-pointer border dark:border-slate-700 hover:scale-105 transition-transform" onClick={() => setSelectedPhoto(p)} />
                    ))}
                  </div>
                </Section>
              )}
              
              {event.lastEditedBy && (
                <div className="pt-4 border-t dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2">
                    <History size={12} /> Última atualização por {event.lastEditedBy} em {format(event.lastEditedAt!, "d/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-50/30 dark:bg-slate-900/50 flex flex-col">
              <div className="p-6 border-b dark:border-slate-800 flex items-center gap-2"><MessageSquare size={16} className="text-indigo-600" /><h3 className="text-xs font-black uppercase tracking-widest">Mural</h3></div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {event.comments && event.comments.length > 0 ? event.comments.map(c => (
                  <div key={c.id}>
                    <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">{c.userName} • {format(c.timestamp, "HH:mm")}</p>
                    <p className="text-xs bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border dark:border-slate-700 text-slate-600 dark:text-slate-300">{c.text}</p>
                  </div>
                )) : <p className="text-center text-[10px] text-slate-400 py-10 font-bold uppercase tracking-widest">Sem mensagens</p>}
              </div>
              <form onSubmit={handleSendComment} className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700 flex gap-2">
                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Comentar..." className="flex-1 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <button type="submit" disabled={!commentText.trim()} className="p-3 bg-indigo-600 text-white rounded-xl active:scale-90 transition-transform disabled:opacity-50"><Send size={16} /></button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} className="max-w-full max-h-full rounded-3xl shadow-2xl" />
          <button className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32} /></button>
        </div>
      )}
    </>
  );
};

const InfoItem = ({ icon, label, value, color = "text-slate-800 dark:text-white" }: any) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-700 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
    <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">{icon} {label}</p>
    <p className={`text-sm font-black ${color} truncate`}>{value}</p>
  </div>
);

const Section = ({ title, icon, children, color = "text-slate-400" }: any) => (
  <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
    <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${color}`}>{icon} {title}</h3>
    {children}
  </div>
);

export default EventDetailModal;
