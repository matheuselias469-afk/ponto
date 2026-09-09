'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [punches, setPunches] = useState<any[]>([]);
  const [inviteKey, setInviteKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAuth = localStorage.getItem('admin_auth');
    if (!isAuth) {
      router.push('/admin/login');
      return;
    }

    // Busca os pontos
    fetch('/api/admin/punches')
      .then(res => res.json())
      .then(data => setPunches(data.punches || []));

    // Busca a chave atual
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.adminPin) setInviteKey(data.settings.adminPin);
        setLoading(false);
      });
  }, [router]);

  const handleUpdateKey = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteKey })
      });
      if (res.ok) alert('Chave de segurança atualizada com sucesso!');
      else alert('Erro ao atualizar a chave.');
    } catch (e) {
      alert('Erro ao conectar.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">Carregando painel...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.push('/admin/login');
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho Bonito e Responsivo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Painel do Gestor</h1>
            <p className="text-gray-500 mt-1">Bem-vindo, Matheus. Aqui estão os registros recentes.</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Link href="/api/admin/report" className="flex-1 md:flex-none text-center bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-sm">
              Gerar Excel
            </Link>
            <button onClick={handleLogout} className="flex-1 md:flex-none bg-gray-100 text-gray-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
              Sair
            </button>
          </div>
        </div>

        {/* Gerenciador de Chave de Segurança */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-8 flex flex-col md:flex-row items-start md:items-end gap-4 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-blue-900 mb-1">Chave de Segurança (Cadastro)</h2>
            <p className="text-sm text-blue-700 mb-3">Compartilhe essa chave para os funcionários criarem suas contas.</p>
            <input 
              type="text" 
              value={inviteKey}
              onChange={(e) => setInviteKey(e.target.value)}
              className="w-full md:max-w-xs p-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 text-black font-bold tracking-wide"
              placeholder="Digite uma nova chave"
            />
          </div>
          <button 
            onClick={handleUpdateKey}
            className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            Atualizar Chave
          </button>
        </div>

        {/* Lista de Registros em Cards para Mobile */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Últimos Pontos Batidos</h2>
        <div className="space-y-4">
          {punches.length === 0 && (
            <div className="bg-white p-8 rounded-2xl text-center text-gray-500 border border-gray-100 shadow-sm">
              Nenhum ponto registrado ainda.
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {punches.map((punch) => (
              <div key={punch.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    {punch.photoUrl && punch.photoUrl !== 'mock-url-porque-sem-token.jpg' ? (
                      <a href={punch.photoUrl} target="_blank" rel="noreferrer">
                        <img 
                          src={punch.photoUrl} 
                          alt="Foto" 
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                        />
                      </a>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-400 font-medium">
                        Sem foto
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{punch.employee.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">Cód: {punch.employee.number}</p>
                    </div>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    punch.type === 'ENTRADA' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    punch.type === 'SAIDA_ALMOCO' || punch.type === 'SAIDA' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                    punch.type === 'VOLTA_ALMOCO' ? 'bg-green-50 text-green-600 border border-green-100' :
                    'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {punch.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-auto space-y-2 pt-4 border-t border-gray-50">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Data/Hora:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(punch.timestamp).toLocaleString('pt-BR', { 
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Localização:</span>
                    {punch.distanceFromStoreMeters !== null ? (
                      <span className={`font-medium ${punch.distanceFromStoreMeters > 100 ? 'text-red-500' : 'text-green-600'}`}>
                        {Math.round(punch.distanceFromStoreMeters)}m
                      </span>
                    ) : (
                      <span className="text-gray-400">Sem GPS</span>
                    )}
                  </div>

                  {punch.justification && (
                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic mt-2 border border-gray-100">
                      "{punch.justification}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
