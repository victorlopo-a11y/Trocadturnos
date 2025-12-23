
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Bell, 
  Settings as SettingsIcon, 
  Plus, 
  Calendar as CalendarIcon,
  Filter,
  ClipboardList,
  AlertTriangle,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  Trash2,
  Database,
  RefreshCcw,
  ShieldAlert,
  Check,
  X as CloseIcon
} from 'lucide-react';
import { ShiftEvent, User, ShiftType, EventCategory, AppNotification, Comment } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import Login from './components/Login';
import NewEventModal from './components/NewEventModal';
import EventCard from './components/EventCard';
import EventDetailModal from './components/EventDetailModal';
import AdminPanel from './components/AdminPanel';
import { EVENT_METADATA } from './constants';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('eng_control_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<ShiftEvent | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'Todos' | ShiftType>('Todos');
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('eng_control_darkmode') === 'true');

  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadInitialData();
    else setIsLoading(false);
  }, [user]);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchEvents(), fetchNotifications()]);
      setDbError(null);
    } catch (err) {
      setDbError("Erro ao carregar dados. Verifique o banco.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!user) return;
    let query = supabase
      .from('events')
      .select('*, comments (*)')
      .order('timestamp', { ascending: false });

    if (!user.isDeveloper) {
      query = query.eq('sector', user.role);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data) setEvents(data);
  };

  const fetchNotifications = async () => {
    if (!user) return;
    let query = supabase
      .from('notifications')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (!user.isDeveloper) {
      query = query.or(`userId.is.null,userId.eq.${user.id}`);
      query = query.neq('audience', 'dev');
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data) setNotifications(data);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      let query = supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('isRead', false);

      if (!user.isDeveloper) {
        query = query.or(`userId.is.null,userId.eq.${user.id}`);
        query = query.neq('audience', 'dev');
      }

      const { error } = await query;
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Erro ao ler notifica??es:", err);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;
    if (!confirm("Deseja limpar o hist?rico de notifica??es?")) return;
    try {
      let query = supabase.from('notifications').delete().neq('id', '0');

      if (!user.isDeveloper) {
        query = query.eq('userId', user.id);
        query = query.neq('audience', 'dev');
      }

      const { error } = await query;
      if (error) throw error;
      if (user.isDeveloper) {
        setNotifications([]);
      } else {
        setNotifications(prev => prev.filter(n => !n.userId || n.userId !== user.id));
      }
    } catch (err) {
      console.error("Erro ao limpar notifica??es:", err);
    }
  };

  const getChangedFields = (prevEvent: ShiftEvent, nextEvent: any) => {
    const normalize = (value: any) => JSON.stringify(value ?? null);
    const fields = [
      { key: 'title', label: 'titulo' },
      { key: 'description', label: 'descricao' },
      { key: 'solution', label: 'solucao' },
      { key: 'impact', label: 'impacto' },
      { key: 'downtime', label: 'parada' },
      { key: 'releaseTime', label: 'liberacao' },
      { key: 'line', label: 'linha' },
      { key: 'shift', label: 'turno' },
      { key: 'category', label: 'categoria' },
      { key: 'equipmentSubtype', label: 'modelo' },
      { key: 'photos', label: 'fotos' }
    ];

    return fields
      .filter(({ key }) => normalize((prevEvent as any)[key]) !== normalize((nextEvent as any)[key]))
      .map(({ label }) => label);
  };

  const handleSaveEvent = async (eventData: any) => {
    if (!user) return;
    
    if (eventToEdit) {
      const updatePayload = {
        ...eventData,
        lastEditedBy: user.name,
        lastEditedAt: Date.now()
      };
      try {
        const { error } = await supabase.from('events').update(updatePayload).eq('id', eventToEdit.id);
        if (error) throw error;
        setEvents(prev => prev.map(e => e.id === eventToEdit.id ? { ...e, ...updatePayload } : e));
        const changedFields = getChangedFields(eventToEdit, eventData);
        if (changedFields.length > 0) {
          const editNotification = {
            id: crypto.randomUUID(),
            title: "Evento editado",
            message: `${user.name} editou "${eventData.title || eventToEdit.title}". Campos: ${changedFields.join(', ')}.`,
            timestamp: Date.now(),
            isRead: false,
            category: eventData.category || eventToEdit.category,
            audience: 'dev',
            eventId: eventToEdit.id
          };
          await supabase.from('notifications').insert([editNotification]);
          if (user.isDeveloper) {
            setNotifications(prev => [editNotification as AppNotification, ...prev]);
          }
        }
        setEventToEdit(null);
        alert('Relatório atualizado com sucesso!');
      } catch (err) { alert('Erro ao atualizar.'); }
    } else {
      const eventId = crypto.randomUUID();
      const newEvent = {
        ...eventData,
        id: eventId,
        timestamp: Date.now(),
        date: format(new Date(), 'yyyy-MM-dd'),
        userId: user.id,
        userName: user.name,
        sector: user.role
      };

      try {
        // 1. Salvar Evento
        const { error: eventError } = await supabase.from('events').insert([newEvent]);
        if (eventError) throw eventError;

        // 2. Criar Notificação para outros usuários
        const newNotification = {
          id: crypto.randomUUID(),
          title: `Nova ${eventData.category}`,
          message: `${user.name} registrou em ${eventData.line}`,
          timestamp: Date.now(),
          isRead: false,
          category: eventData.category
        };
        
        await supabase.from('notifications').insert([newNotification]);
        
        setEvents(prev => [{...newEvent, comments: []}, ...prev]);
        setNotifications(prev => [newNotification as AppNotification, ...prev]);
        
      } catch (err) { 
        console.error(err);
        alert('Erro ao salvar. Verifique se as tabelas existem.'); 
      }
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const event = events.find(e => e.id === id);
    if (!event || !user) return;

    if (event.userId !== user.id && !user.isDeveloper) {
      alert("Apenas o autor ou admin pode excluir.");
      return;
    }

    if (!confirm("Excluir permanentemente este relatório?")) return;

    try {
      await supabase.from('comments').delete().eq('eventId', id);
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      
      setEvents(prev => prev.filter(e => e.id !== id));
      setSelectedEventId(null);
      const deleteNotification = {
        id: crypto.randomUUID(),
        title: "Evento excluido",
        message: `${user.name} excluiu "${event.title}" (${event.category}, ${event.shift}).`,
        timestamp: Date.now(),
        isRead: false,
        category: event.category,
        audience: 'dev',
        eventId: event.id
      };
      await supabase.from('notifications').insert([deleteNotification]);
      if (user.isDeveloper) {
        setNotifications(prev => [deleteNotification as AppNotification, ...prev]);
      }
      alert("Relatorio excluido.");
    } catch (err) {
      alert("Erro ao excluir.");
    }
  };

  const handleAddComment = async (eventId: string, text: string) => {
    if (!user) return;
    const targetEvent = events.find(ev => ev.id === eventId);
    const newComment = { id: crypto.randomUUID(), userId: user.id, userName: user.name, text, timestamp: Date.now() };
    const { error } = await supabase.from('comments').insert([{ ...newComment, eventId }]);
    if (!error) {
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, comments: [...(ev.comments || []), newComment as Comment] } : ev));
    }

    if (targetEvent && targetEvent.userId !== user.id) {
      const newNotification = {
        id: crypto.randomUUID(),
        title: "Novo comentario",
        message: `${user.name} comentou no seu registro: ${targetEvent.title}`,
        timestamp: Date.now(),
        isRead: false,
        category: targetEvent.category,
        userId: targetEvent.userId,
        eventId
      };

      await supabase.from('notifications').insert([newNotification]);
    }
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('eng_control_darkmode', darkMode.toString());
  }, [darkMode]);

  const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId) || null, [events, selectedEventId]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
  const filteredEvents = useMemo(() => events.filter(e => (selectedShiftFilter === 'Todos' || e.shift === selectedShiftFilter) && e.date === selectedDate), [events, selectedShiftFilter, selectedDate]);

  const stats = useMemo(() => {
    const today = events.filter(e => e.date === selectedDate);
    return {
      total: today.length,
      falhas: today.filter(e => e.category === EventCategory.FALHA).length,
      adm: today.filter(e => e.shift === ShiftType.ADM).length,
      segundo: today.filter(e => e.shift === ShiftType.SEGUNDO).length
    };
  }, [events, selectedDate]);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><SettingsIcon size={24} /></div>
          <div>
            <h1 className="text-lg font-black tracking-tight dark:text-white uppercase leading-none">ENG.CONTROL</h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Sincronizado
               </span>
               <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 rounded text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                  <ShieldCheck size={8} /> {user.role}
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={loadInitialData} className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><RefreshCcw size={20} className={isLoading ? "animate-spin" : ""} /></button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={async () => {
                const nextOpen = !isNotificationOpen;
                setIsNotificationOpen(nextOpen);
                if (nextOpen) {
                  await fetchNotifications();
                  await markAllAsRead();
                }
              }} 
              className={`p-2.5 rounded-xl transition-all relative ${isNotificationOpen ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">{unreadCount}</span>}
            </button>
            
            {isNotificationOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Notificações</h3>
                  <div className="flex gap-1">
                    <button onClick={clearNotifications} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Limpar tudo">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? notifications.map(n => {
                    const meta = EVENT_METADATA[n.category as EventCategory] || { bgColor: 'bg-slate-100', color: 'text-slate-500' };
                    return (
                      <div key={n.id} className={`p-4 border-b dark:border-slate-800 flex gap-3 transition-colors ${!n.isRead ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${meta.bgColor} ${meta.color}`}>
                           <Bell size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold leading-tight">{n.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{n.message}</p>
                          <p className="text-[8px] font-black text-slate-300 uppercase mt-1">
                            {format(n.timestamp, "HH:mm '·' d MMM", { locale: ptBR })}
                          </p>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div>}
                      </div>
                    );
                  }) : (
                    <div className="py-12 text-center">
                      <Bell size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sem alertas</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 pl-4 border-l dark:border-slate-800">
              <div className="hidden md:block text-right"><p className="text-sm font-black dark:text-white">{user.name}</p></div>
              <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                {user.isDeveloper && <button onClick={() => { setIsAdminPanelOpen(true); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-indigo-600 font-black hover:bg-indigo-50 rounded-xl mb-1"><ShieldAlert size={18} /> Administrativo</button>}
                <button onClick={() => { setUser(null); localStorage.removeItem('eng_control_user'); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-black hover:bg-red-50 rounded-xl transition-colors"><LogOut size={18} /> Sair</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Hoje" value={stats.total} icon={<ClipboardList size={22} />} color="text-indigo-600" bgColor="bg-indigo-50" />
          <StatCard title="Falhas" value={stats.falhas} icon={<AlertTriangle size={22} />} color="text-red-600" bgColor="bg-red-50" />
          <StatCard title="ADM" value={stats.adm} icon={<Sun size={22} />} color="text-orange-500" bgColor="bg-orange-50" />
          <StatCard title="2º Turno" value={stats.segundo} icon={<Moon size={22} />} color="text-indigo-800" bgColor="bg-indigo-50" />
        </div>

        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex flex-wrap items-center gap-4">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-5 py-3.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl font-black text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10" />
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl">
              <FilterChip active={selectedShiftFilter === 'Todos'} onClick={() => setSelectedShiftFilter('Todos')}>Todos</FilterChip>
              <FilterChip active={selectedShiftFilter === ShiftType.ADM} onClick={() => setSelectedShiftFilter(ShiftType.ADM)}>ADM</FilterChip>
              <FilterChip active={selectedShiftFilter === ShiftType.SEGUNDO} onClick={() => setSelectedShiftFilter(ShiftType.SEGUNDO)}>2º</FilterChip>
            </div>
          </div>
          <button onClick={() => { setEventToEdit(null); setIsModalOpen(true); }} className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"><Plus size={20} /> Novo Registro</button>
        </section>

        <div className="grid grid-cols-1 gap-6">
          {filteredEvents.length > 0 ? filteredEvents.map(event => (
            <EventCard 
              key={event.id} 
              event={event} 
              onClick={() => setSelectedEventId(event.id)} 
            />
          )) : <div className="py-32 text-center border-2 border-dashed dark:border-slate-800 rounded-[3rem] text-slate-300 font-black uppercase">Sem registros para este dia</div>}
        </div>
      </main>

      <NewEventModal 
        isOpen={isModalOpen} 
        initialData={eventToEdit}
        onClose={() => { setIsModalOpen(false); setEventToEdit(null); }} 
        onSave={handleSaveEvent} 
      />
      
      <EventDetailModal 
        event={selectedEvent} 
        canManage={selectedEvent ? (selectedEvent.userId === user.id || user.isDeveloper) : false}
        onClose={() => setSelectedEventId(null)} 
        onEdit={() => { if(selectedEvent) { setEventToEdit(selectedEvent); setIsModalOpen(true); setSelectedEventId(null); } }}
        onDelete={() => { if(selectedEvent) handleDeleteEvent(selectedEvent.id); }}
        onAddComment={handleAddComment}
      />
      
      <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
    </div>
  );
};

const StatCard = ({ title, value, icon, color, bgColor }: any) => (
  <div className="bg-white dark:bg-slate-800 p-7 rounded-[2rem] border dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
    <div><p className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">{title}</p><p className={`text-3xl font-black ${color}`}>{value}</p></div>
    <div className={`p-4 rounded-2xl ${bgColor} ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
  </div>
);

const FilterChip = ({ active, onClick, children }: any) => (
  <button onClick={onClick} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}>{children}</button>
);

export default App;






