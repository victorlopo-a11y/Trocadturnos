import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X as CloseIcon, Send, Image as ImageIcon, FileText, Users, Trash2, CornerUpLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { supabase } from '../supabaseClient';
import { ChatAttachment, ChatMessage, User } from '../types';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onClearUnread?: () => void;
}

type ChatTab = 'sector' | 'global';

const MAX_FILES = 4;
const MAX_FILE_SIZE_MB = 8;

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, user, onClearUnread }) => {
  const [activeTab, setActiveTab] = useState<ChatTab>('sector');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const roomKey = activeTab === 'sector' ? `sector:${user.role}` : 'global';
  const roomLabel = activeTab === 'sector' ? `Setor: ${user.role}` : 'Todas as Engenharias';
  const onlineLabel = activeTab === 'sector' ? 'Online no setor' : 'Online no global';

  const canClear = !!user.isDeveloper;

  const scrollToBottom = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('createdAt', { ascending: true })
        .limit(200);

      if (activeTab === 'sector') {
        query = query.eq('room', 'sector').eq('sector', user.role);
      } else {
        query = query.eq('room', 'global');
      }

      const { data, error } = await query;
      if (error) throw error;
      setMessages((data || []) as ChatMessage[]);
      setTimeout(scrollToBottom, 50);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadMessages();
    onClearUnread?.();
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase.channel(`chat:${roomKey}`, {
      config: { presence: { key: user.id } }
    });

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const msg = payload.new as ChatMessage;
        if (activeTab === 'sector') {
          if (msg.room !== 'sector' || msg.sector !== user.role) return;
        } else {
          if (msg.room !== 'global') return;
        }
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 30);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state)
          .flat()
          .map((p: any) => ({ id: p.userId, name: p.userName, avatar: p.avatar }))
          .filter((p: any) => p.id && p.name);
        const unique = new Map<string, { id: string; name: string; avatar?: string }>();
        users.forEach((u: any) => unique.set(u.id, u));
        const list = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
        const me = list.find((u) => u.id === user.id);
        const others = list.filter((u) => u.id !== user.id);
        setOnlineUsers(me ? [me, ...others] : others);
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ userId: user.id, userName: user.name, avatar: user.avatar });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, roomKey, activeTab, user.id, user.name, user.role]);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const selected = Array.from(incoming);
    const limited = selected.slice(0, MAX_FILES);
    const valid = limited.filter((file) => file.size / (1024 * 1024) <= MAX_FILE_SIZE_MB);
    setFiles(valid);
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];
    const uploaded: ChatAttachment[] = [];
    for (const file of files) {
      const path = `${roomKey}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('chat-uploads').upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (error) throw error;
      const { data } = supabase.storage.from('chat-uploads').getPublicUrl(path);
      uploaded.push({
        name: file.name,
        url: data.publicUrl,
        type: file.type || 'application/octet-stream',
        size: file.size
      });
    }
    return uploaded;
  };

  const sendMessage = async () => {
    if (!text.trim() && files.length === 0) return;
    setIsSending(true);
    try {
      const attachments = await uploadFiles();
      const payload: ChatMessage = {
        id: crypto.randomUUID(),
        room: activeTab,
        sector: activeTab === 'sector' ? user.role : null,
        userId: user.id,
        userName: user.name,
        text: text.trim() ? text.trim() : null,
        attachments: attachments.length > 0 ? attachments : null,
        replyToId: replyTarget?.id || null,
        replyToUserName: replyTarget?.userName || null,
        replyToText: replyTarget?.text || null,
        createdAt: Date.now()
      };

      setMessages((prev) => [...prev, payload]);
      setTimeout(scrollToBottom, 20);
      const { error } = await supabase.from('chat_messages').insert([payload]);
      if (error) throw error;
      setText('');
      setFiles([]);
      setReplyTarget(null);
    } catch (err: any) {
      const msg = err?.message || 'Erro ao enviar mensagem.';
      alert(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!canClear) return;
    if (!confirm('Deseja limpar este chat?')) return;
    let query = supabase.from('chat_messages').delete().neq('id', '0');
    if (activeTab === 'sector') {
      query = query.eq('room', 'sector').eq('sector', user.role);
    } else {
      query = query.eq('room', 'global');
    }
    const { error } = await query;
    if (!error) setMessages([]);
  };

  const visibleMessages = useMemo(() => messages, [messages]);

  const colorPalette = [
    { bg: 'bg-indigo-600 text-white', light: 'bg-indigo-50 text-indigo-700' },
    { bg: 'bg-emerald-600 text-white', light: 'bg-emerald-50 text-emerald-700' },
    { bg: 'bg-rose-600 text-white', light: 'bg-rose-50 text-rose-700' },
    { bg: 'bg-amber-500 text-white', light: 'bg-amber-50 text-amber-800' },
    { bg: 'bg-sky-600 text-white', light: 'bg-sky-50 text-sky-700' },
    { bg: 'bg-violet-600 text-white', light: 'bg-violet-50 text-violet-700' }
  ];

  const getUserColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    const idx = Math.abs(hash) % colorPalette.length;
    return colorPalette[idx];
  };

  const renderText = (value: string) => {
    const parts = value.split(/(@[^@\s]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return <span key={idx} className="font-black text-amber-200">{part}</span>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-4 top-4 bottom-4 w-full max-w-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chat Online</p>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{roomLabel}</h2>
          </div>
          <div className="flex items-center gap-2">
            {canClear && (
              <button onClick={handleClearChat} className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors" title="Limpar chat">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 pt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('sector')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sector' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              Meu Setor
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'global' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-emerald-600'}`}
            >
              Todas as Eng
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Users size={14} />
            {onlineUsers.length} {onlineLabel}
          </div>
        </div>

        {onlineUsers.length > 0 && (
          <div className="px-6 pt-2 flex flex-wrap gap-2">
            {onlineUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => setText((prev) => `${prev.trim()} @${u.name} `)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest"
                title="Mencionar"
              >
                <div className="relative">
                  <img
                    src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-emerald-50 rounded-full" />
                </div>
                <span className="max-w-[140px] truncate">
                  {u.name}{u.id === user.id ? ' (Você)' : ''}
                </span>
              </button>
            ))}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading && (
            <div className="text-center text-xs text-slate-400">Carregando mensagens...</div>
          )}
          {!isLoading && visibleMessages.length === 0 && (
            <div className="text-center text-xs text-slate-400">Sem mensagens ainda.</div>
          )}
          {visibleMessages.map((msg) => {
            const color = getUserColor(msg.userId);
            const isMine = msg.userId === user.id;
            return (
            <div key={msg.id} className={`flex ${msg.userId === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isMine ? color.bg : color.light}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    {msg.userName}
                  </div>
                  <button
                    onClick={() => setReplyTarget(msg)}
                    className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100"
                    title="Responder"
                  >
                    <CornerUpLeft size={12} />
                  </button>
                </div>
                {msg.replyToUserName && (
                  <div className="mt-2 rounded-xl bg-white/20 px-3 py-2 text-[11px]">
                    <div className="font-black uppercase tracking-widest opacity-70">{msg.replyToUserName}</div>
                    <div className="truncate opacity-80">{msg.replyToText || 'Arquivo'}</div>
                  </div>
                )}
                {msg.text && <div className="mt-2 whitespace-pre-wrap">{renderText(msg.text)}</div>}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.attachments.map((att) => (
                      <a
                        key={att.url}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${isMine ? 'bg-white/20' : 'bg-white dark:bg-slate-900'}`}
                      >
                        {att.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                        <span className="truncate">{att.name}</span>
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-[9px] uppercase tracking-widest opacity-60">
                  {format(msg.createdAt, "HH:mm '·' d MMM", { locale: ptBR })}
                </div>
              </div>
            </div>
          )})}
        </div>

        <div className="border-t dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-900">
          {files.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {files.map((file) => (
                <div key={file.name} className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-500 flex items-center gap-2">
                  {file.type.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
                  <span className="max-w-[220px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(file.name)}
                    className="ml-1 text-slate-400 hover:text-red-500"
                    title="Remover"
                  >
                    <CloseIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {replyTarget && (
            <div className="mb-3 flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold">
              <div className="truncate">
                Respondendo a {replyTarget.userName}: {replyTarget.text || 'Arquivo'}
              </div>
              <button onClick={() => setReplyTarget(null)} className="text-amber-700 hover:text-amber-900">
                <CloseIcon size={12} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <ImageIcon size={18} />
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 min-h-[44px] max-h-32 resize-none px-4 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={sendMessage}
              disabled={isSending}
              className="px-5 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <Send size={16} />
              Enviar
            </button>
          </div>
          <p className="mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Até {MAX_FILES} arquivos (imagens/PDF), {MAX_FILE_SIZE_MB}MB cada.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
