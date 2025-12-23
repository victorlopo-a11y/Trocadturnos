
import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, User as UserIcon, ShieldAlert, CheckCircle, Search, Trash2, ArrowUpCircle, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { AppNotification } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [auditLogs, setAuditLogs] = useState<AppNotification[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (activeTab === 'audit') {
        fetchAuditLogs();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, isOpen]);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });
    
    if (!error && data) {
      setUsers(data);
    }
    setIsLoading(false);
  };

  const fetchAuditLogs = async () => {
    setIsAuditLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('audience', 'dev')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (!error && data) {
      setAuditLogs(data as AppNotification[]);
    }
    setIsAuditLoading(false);
  };

  if (!isOpen) return null;

  const handleUpdateRole = async (username: string, newRole: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('username', username);

    if (error) {
      alert('Erro ao atualizar cargo.');
    } else {
      setUsers(users.map(u => u.username === username ? { ...u, role: newRole } : u));
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${username}? Esta ação é irreversível.`)) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('username', username);

      if (error) {
        alert('Erro ao excluir usuário. Verifique as permissões RLS.');
      } else {
        setUsers(users.filter(u => u.username !== username));
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-4xl shadow-2xl border border-white dark:border-slate-800 flex flex-col h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-900/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">Gestǜo de Equipe</h2>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Controle de Acesso via Supabase</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl shadow-sm text-slate-400 hover:text-red-500 transition-all">
            <X size={24} />
          </button>
        </div>\n        {/* Busca */}
        <div className="px-8 py-4 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}
              >
                Equipe
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}
              >
                Auditoria
              </button>
            </div>
            {activeTab === 'users' && (
              <div className="relative group flex-1 min-w-[220px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar usuario por nome ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white font-bold"
                />
              </div>
            )}
          </div>
        </div>
{/* Lista de Usuǭrios */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">\n          {activeTab === 'users' && isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando usuǭrios...</p>
            </div>
          ) : activeTab === 'users' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredUsers.map((user) => (
                <div key={user.username} className={`p-6 rounded-[2rem] border transition-all ${user.is_developer ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800' : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 border-2 border-white dark:border-slate-600 overflow-hidden shadow-sm">
                      <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 dark:text-white leading-tight">{user.name}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">ID: {user.username}</p>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.is_developer ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                        {user.is_developer ? <ShieldAlert size={10} /> : <UserIcon size={10} />}
                        {user.role}
                      </div>
                    </div>
                  </div>

                  {!user.is_developer && (
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <select 
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.username, e.target.value)}
                          className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[10px] font-black uppercase appearance-none outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Setup Engenharia">Setup Engenharia</option>
                          <option value="Engenharia de Processos">Engenharia de Processos</option>
                          <option value="Manuten��ǜo / Mǭquinas">Manuten��ǜo / Mǭquinas</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => handleDeleteUser(user.username)}
                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        title="Excluir Usuǭrio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  {user.is_developer && (
                     <div className="w-full py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl text-center border border-indigo-200 dark:border-indigo-800">
                        Usuǭrio Master Inviolǭvel
                     </div>
                  )}
                </div>
              ))}
            </div>
          ) : isAuditLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando auditoria...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.length > 0 ? auditLogs.map((log) => (
                <div key={log.id} className="p-5 rounded-2xl border bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-white">{log.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{log.message}</p>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sem registros de auditoria</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Sincronizado com Banco de Dados Cloud</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;




