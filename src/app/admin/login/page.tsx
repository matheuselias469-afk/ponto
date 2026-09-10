'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === '1' && password === '14060920') {
      localStorage.setItem('admin_auth', 'true');
      router.push('/admin');
    } else {
      setError('Usuário ou senha incorretos.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0d394e] to-[#041620] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#cca158]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 border border-white/10 relative z-10 animate-fade-in-up">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#cca158]/10 p-4 rounded-full border border-[#cca158]/30 mb-4">
            <img src="/decor-logo.png" alt="Decor" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Gestão</h1>
          <p className="text-[#cca158] text-sm mt-1 opacity-80">Acesso Restrito</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-xl text-sm text-center font-medium border border-red-500/50 backdrop-blur-sm">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-[#cca158] uppercase tracking-wider mb-2">Usuário (Número)</label>
            <input 
              type="text" 
              inputMode="numeric"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-[#cca158] transition-all text-white placeholder-white/20 text-lg font-bold"
              placeholder="Ex: 1"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#cca158] uppercase tracking-wider mb-2">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-[#cca158] transition-all text-white placeholder-white/20 text-lg tracking-widest"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#cca158] to-[#aa8343] text-[#0d394e] font-black py-4 rounded-xl hover:shadow-[0_0_20px_rgba(204,161,88,0.4)] transition-all duration-300 transform hover:-translate-y-1 mt-6 tracking-wide"
          >
            ENTRAR NO PAINEL
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </main>
  );
}
