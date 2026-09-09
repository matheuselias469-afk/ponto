'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [punches, setPunches] = useState<any[]>([]);
  const [inviteKey, setInviteKey] = useState('');
  const [storeLat, setStoreLat] = useState(0);
  const [storeLon, setStoreLon] = useState(0);
  const [storeRadius, setStoreRadius] = useState(100);
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

    // Busca configurações (Chave e Localização)
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setInviteKey(data.settings.adminPin || '');
          setStoreLat(data.settings.latitude || 0);
          setStoreLon(data.settings.longitude || 0);
          setStoreRadius(data.settings.radiusMeters || 100);
        }
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

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setStoreLat(pos.coords.latitude);
          setStoreLon(pos.coords.longitude);
        },
        () => alert('Erro: ative o GPS do celular/computador para pegar a localização.')
      );
    } else {
      alert('GPS não suportado.');
    }
  };

  const handleUpdateLocation = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: storeLat, longitude: storeLon, radiusMeters: storeRadius })
      });
      if (res.ok) alert('Localização da loja salva com sucesso!');
      else alert('Erro ao salvar localização.');
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

        {/* Painel de Configurações Dividido em 2 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          
          {/* Gerenciador de Chave de Segurança */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col gap-4 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-blue-900 mb-1">Chave de Segurança (Cadastro)</h2>
              <p className="text-sm text-blue-700 mb-3">Compartilhe para os funcionários criarem contas.</p>
              <input 
                type="text" 
                value={inviteKey}
                onChange={(e) => setInviteKey(e.target.value)}
                className="w-full p-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 text-black font-bold tracking-wide"
                placeholder="Ex: MINHALOJA2026"
              />
            </div>
            <button 
              onClick={handleUpdateKey}
              className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition shadow-sm"
            >
              Atualizar Chave
            </button>
          </div>

          {/* Configuração de Localização da Loja */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col gap-4 bg-gradient-to-r from-orange-50 to-white">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-orange-900 mb-1">Localização da Loja (GPS)</h2>
              <p className="text-sm text-orange-700 mb-3">Defina onde fica a loja para o bloqueio de raio funcionar.</p>
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={handleGetLocation}
                  className="w-full bg-orange-100 text-orange-800 border border-orange-200 font-bold py-2 rounded-lg hover:bg-orange-200 transition text-sm flex justify-center items-center gap-2"
                >
                  📍 Pegar minha localização atual
                </button>
              </div>
              <div className="flex gap-2 text-sm text-gray-700 mb-2">
                <span className="flex-1 bg-white p-2 border border-orange-200 rounded-lg font-mono truncate">Lat: {storeLat}</span>
                <span className="flex-1 bg-white p-2 border border-orange-200 rounded-lg font-mono truncate">Lon: {storeLon}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-3">
                <span className="font-bold text-orange-900">Raio Permitido:</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={storeRadius} onChange={e => setStoreRadius(Number(e.target.value))} className="w-16 p-1 text-center border rounded font-bold text-black"/>
                  <span className="text-orange-900 font-bold">metros</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleUpdateLocation}
              className="w-full bg-orange-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-700 transition shadow-sm"
            >
              Salvar Localização
            </button>
          </div>

        </div>

        {/* Lista de Registros Agrupados por Data */}
        <h2 className="text-xl font-bold text-gray-800 mb-4 mt-8">Histórico de Pontos</h2>
        <div className="space-y-8">
          {punches.length === 0 && (
            <div className="bg-white p-8 rounded-2xl text-center text-gray-500 border border-gray-100 shadow-sm">
              Nenhum ponto registrado ainda.
            </div>
          )}
          
          {/* Lógica de Agrupamento por Data */}
          {Object.entries(
            punches.reduce((acc: any, punch: any) => {
              const dataStr = new Date(punch.timestamp).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
              if (!acc[dataStr]) acc[dataStr] = {};
              if (!acc[dataStr][punch.employee.name]) acc[dataStr][punch.employee.name] = [];
              acc[dataStr][punch.employee.name].push(punch);
              return acc;
            }, {})
          ).map(([dataStr, employeeGroups]: any) => (
            <div key={dataStr} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                📅 Data: {dataStr}
              </h3>
              
              <div className="space-y-6">
                {Object.entries(employeeGroups).map(([empName, empPunches]: any) => {
                  // Ordenar do menor horário (mais antigo) para o maior (mais recente)
                  const sortedPunches = [...empPunches].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                  return (
                    <div key={empName} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        👤 {empName}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {sortedPunches.map((p: any) => (
                          <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center text-center">
                            {p.photoUrl && p.photoUrl !== 'mock-url-porque-sem-token.jpg' ? (
                              <a href={p.photoUrl} target="_blank" rel="noreferrer">
                                <img src={p.photoUrl} alt="Foto" className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 mb-2 shadow-sm" />
                              </a>
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-400 mb-2">Sem foto</div>
                            )}
                            <span className="font-bold text-gray-900 text-lg">
                              {new Date(p.timestamp).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-blue-600 mt-1 mb-1">{p.type.replace('_', ' ')}</span>
                            
                            {p.distanceFromStoreMeters !== null && p.latitude && p.longitude && (
                              <a 
                                href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`text-[11px] font-bold mt-1 px-2 py-1 rounded hover:opacity-80 transition-opacity ${p.distanceFromStoreMeters > 100 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                                title="Ver no mapa"
                              >
                                📍 {Math.round(p.distanceFromStoreMeters)}m
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
