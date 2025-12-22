
import React, { useState } from 'react';
import { Settings, Lock, Loader2, UserPlus, ChevronDown } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [sector, setSector] = useState('Setup Engenharia');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: sbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('password', password)
        .single();

      if (sbError || !data) {
        setError('Acesso negado. Verifique ID e Senha.');
      } else {
        const loggedUser: User = {
          id: data.username,
          name: data.name,
          role: data.role,
          isDeveloper: data.is_developer,
          avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`
        };
        localStorage.setItem('eng_control_user', JSON.stringify(loggedUser));
        onLogin(loggedUser);
      }
    } catch (err) {
      setError('Erro de conexão com o banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!fullName || !username || !password) {
      setError('Preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    try {
      // Verificar se usuário já existe
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (existing) {
        setError('Este ID de usuário já está em uso.');
        setIsLoading(false);
        return;
      }

      // Inserir novo usuário
      const { error: sbError } = await supabase.from('users').insert([{
        username: username.toLowerCase(),
        password,
        name: fullName,
        role: sector,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        is_developer: false
      }]);

      if (sbError) throw sbError;

      alert('Conta criada com sucesso! Agora você pode entrar.');
      setIsRegistering(false);
      setError(null);
    } catch (err) {
      setError('Erro ao criar conta no banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-2xl text-white mb-4 shadow-xl">
            <Settings size={32} />
          </div>
          <h1 className="text-2xl font-black text-[#1e293b] dark:text-white tracking-tighter">ENG.CONTROL</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Setup & Processos</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-8 border border-slate-50 dark:border-slate-800 transition-all">
          <h2 className="text-xl font-black text-[#1e293b] dark:text-white mb-8 flex items-center gap-3">
             {isRegistering ? (
               <><UserPlus className="text-[#10b981]" size={22} /> Novo Usuário</>
             ) : (
               <><Lock className="text-indigo-600" size={20} /> Login do Sistema</>
             )}
          </h2>
          
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-[#10b981] transition-all font-bold text-slate-700 placeholder:text-slate-300" 
                  placeholder="Nome e Sobrenome"
                  required 
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID de Usuário</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className={`w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 ${isRegistering ? 'focus:ring-2 focus:ring-[#10b981]' : 'focus:ring-2 focus:ring-indigo-600'}`} 
                placeholder="Ex: joao.silva"
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className={`w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 ${isRegistering ? 'focus:ring-2 focus:ring-[#10b981]' : 'focus:ring-2 focus:ring-indigo-600'}`} 
                placeholder="••••••"
                required 
              />
            </div>

            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qual é o seu Setor?</label>
                <div className="relative">
                  <select 
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-[#10b981] rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-[#10b981] appearance-none transition-all font-bold text-slate-900"
                  >
                    <option value="Setup Engenharia">Setup Engenharia</option>
                    <option value="Engenharia de Processos">Engenharia de Processos</option>
                    <option value="Manutenção / Máquinas">Manutenção / Máquinas</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading} 
              className={`w-full py-4 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${isRegistering ? 'bg-[#10b981] hover:bg-[#059669]' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-none'}`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                isRegistering ? 'Finalizar Cadastro' : 'Entrar no Sistema'
              )}
            </button>
          </form>

          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(null); }} 
            className="w-full mt-8 text-[11px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
          >
            {isRegistering ? 'Já tenho uma conta? Fazer Login' : 'Não tem conta? Cadastre-se aqui'}
          </button>
        </div>
        
        <p className="text-center mt-10 text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">ENG.CONTROL © 2025</p>
      </div>
    </div>
  );
};

export default Login;
