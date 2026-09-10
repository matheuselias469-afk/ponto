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
  const [notificationTimes, setNotificationTimes] = useState<string[]>([]);
  const [newNotifTime, setNewNotifTime] = useState('');

  const [employees, setEmployees] = useState<any[]>([]);
  const [pendingPunches, setPendingPunches] = useState<any[]>([]);
  const [lateForm, setLateForm] = useState({ employeeId: '', date: '', time: '', type: 'ENTRADA' });
  const [eventForm, setEventForm] = useState({ employeeId: 'all', date: '', eventType: 'FERIADO' });
  const [reportForm, setReportForm] = useState({ employeeId: 'all', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [loading, setLoading] = useState(true);

  // Estados para o Histórico de Pontos
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null);

  const toggleAccordion = (empName: string) => {
    setExpandedEmp(prev => prev === empName ? null : empName);
  };

  const fetchData = () => {
    fetch('/api/admin/punches').then(res => res.json()).then(data => setPunches(data.punches || []));
    fetch('/api/admin/employees').then(res => res.json()).then(data => setEmployees(data.employees || []));
    fetch('/api/admin/pending-punches').then(res => res.json()).then(data => setPendingPunches(data.pending || []));
    fetch('/api/admin/settings').then(res => res.json()).then(data => {
      if (data.settings) {
        setInviteKey(data.settings.adminPin || '');
        setStoreLat(data.settings.latitude || 0);
        setStoreLon(data.settings.longitude || 0);
        setStoreRadius(data.settings.radiusMeters || 100);
        try {
          const times = JSON.parse(data.settings.notificationTimes || '[]');
          setNotificationTimes(times);
        } catch(e) {}
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    const isAuth = localStorage.getItem('admin_auth');
    if (!isAuth) {
      router.push('/admin/login');
      return;
    }
    fetchData();
  }, [router]);

  // ... (funções de submit)
  
  const handleAddNotificationTime = async () => {
    if (!newNotifTime) return;
    if (notificationTimes.includes(newNotifTime)) return;
    const newTimes = [...notificationTimes, newNotifTime].sort();
    setNotificationTimes(newTimes);
    setNewNotifTime('');
    
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationTimes: newTimes })
    });
  };

  const handleRemoveNotificationTime = async (timeToRemove: string) => {
    const newTimes = notificationTimes.filter(t => t !== timeToRemove);
    setNotificationTimes(newTimes);
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationTimes: newTimes })
    });
  };

  const handleCreateLatePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/pending-punches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lateForm)
      });
      if (res.ok) {
        alert('Solicitação enviada!');
        setLateForm({ employeeId: '', date: '', time: '', type: 'ENTRADA' });
        fetchData();
      } else {
        const err = await res.json();
        alert('Erro: ' + err.error);
      }
    } catch (e) {
      alert('Erro de conexão.');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });
      if (res.ok) {
        alert('Evento registrado com sucesso!');
        setEventForm({ employeeId: 'all', date: '', eventType: 'FERIADO' });
      } else {
        const err = await res.json();
        alert('Erro: ' + err.error);
      }
    } catch (e) {
      alert('Erro de conexão.');
    }
  };

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
          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            <button onClick={handleLogout} className="flex-1 md:flex-none bg-gray-100 text-gray-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
              Sair
            </button>
          </div>
        </div>

        {/* --- EXPORTAÇÃO EXCEL --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 mb-8 flex flex-col md:flex-row gap-6 bg-gradient-to-r from-green-50 to-white">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-green-900 mb-1">Gerar Planilha (Excel)</h2>
            <p className="text-sm text-green-700 mb-4">Escolha o funcionário e o mês para baixar o relatório completo.</p>
            
            <form action="/api/admin/report" method="GET" target="_blank" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-green-800 mb-1 uppercase">Funcionário</label>
                  <select 
                    name="employeeId"
                    value={reportForm.employeeId} 
                    onChange={e => setReportForm({...reportForm, employeeId: e.target.value})}
                    className="w-full p-2.5 bg-white border border-green-200 rounded-lg text-black focus:outline-none focus:border-green-500"
                  >
                    <option value="all">Todos os Funcionários</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-xs font-bold text-green-800 mb-1 uppercase">Mês</label>
                  <select 
                    name="month"
                    value={reportForm.month} 
                    onChange={e => setReportForm({...reportForm, month: parseInt(e.target.value)})}
                    className="w-full p-2.5 bg-white border border-green-200 rounded-lg text-black focus:outline-none focus:border-green-500"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
                  </select>
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-xs font-bold text-green-800 mb-1 uppercase">Ano</label>
                  <input 
                    type="number"
                    name="year"
                    value={reportForm.year} 
                    onChange={e => setReportForm({...reportForm, year: parseInt(e.target.value)})}
                    className="w-full p-2.5 bg-white border border-green-200 rounded-lg text-black focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <button type="submit" className="bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-green-700 transition shadow-sm w-full md:w-auto">
                ⬇️ Baixar Planilha
              </button>
            </form>
          </div>
        </div>

        {/* Painel de Configurações Dividido em 3 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* Gerenciador de Chave de Segurança */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col gap-4 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-blue-900 mb-1">Chave de Segurança</h2>
              <p className="text-sm text-blue-700 mb-3">Compartilhe para novos cadastros.</p>
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
              <h2 className="text-lg font-bold text-orange-900 mb-1">Localização (GPS)</h2>
              <p className="text-sm text-orange-700 mb-3">Defina onde fica a loja.</p>
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={handleGetLocation}
                  className="w-full bg-orange-100 text-orange-800 border border-orange-200 font-bold py-2 rounded-lg hover:bg-orange-200 transition text-sm flex justify-center items-center gap-2"
                >
                  📍 Pegar localização atual
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

          {/* Notificações (Horários) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100 flex flex-col gap-4 bg-gradient-to-r from-teal-50 to-white">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-teal-900 mb-1">Notificações</h2>
              <p className="text-sm text-teal-700 mb-3">Lembretes para bater o ponto.</p>
              <div className="flex gap-2 mb-4">
                <input 
                  type="time" 
                  value={newNotifTime}
                  onChange={(e) => setNewNotifTime(e.target.value)}
                  className="flex-1 p-2 bg-white border border-teal-200 rounded-lg focus:outline-none focus:border-teal-500 text-black font-bold"
                />
                <button 
                  onClick={handleAddNotificationTime}
                  className="bg-teal-600 text-white font-bold px-4 rounded-lg hover:bg-teal-700 transition"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {notificationTimes.length === 0 ? (
                  <span className="text-xs text-teal-600 italic">Nenhum horário.</span>
                ) : (
                  notificationTimes.map(t => (
                    <span key={t} className="bg-teal-100 text-teal-800 text-sm font-bold px-3 py-1 rounded-full flex items-center gap-2">
                      {t}
                      <button onClick={() => handleRemoveNotificationTime(t)} className="text-teal-500 hover:text-red-500">×</button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- PONTOS ATRASADOS / SOLICITAÇÃO --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 mb-8 flex flex-col md:flex-row gap-6 bg-gradient-to-r from-purple-50 to-white">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-purple-900 mb-1">Solicitar Ponto Atrasado</h2>
            <p className="text-sm text-purple-700 mb-4">Esqueceu de bater? Selecione o funcionário e crie a pendência. Ele precisará tirar a foto para confirmar.</p>
            
            <form onSubmit={handleCreateLatePunch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-purple-800 mb-1 uppercase">Funcionário</label>
                  <select 
                    required 
                    value={lateForm.employeeId} 
                    onChange={e => setLateForm({...lateForm, employeeId: e.target.value})}
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-lg text-black focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Selecione...</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-purple-800 mb-1 uppercase">Tipo</label>
                  <select 
                    required 
                    value={lateForm.type} 
                    onChange={e => setLateForm({...lateForm, type: e.target.value})}
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-lg text-black focus:outline-none focus:border-purple-500"
                  >
                    <option value="ENTRADA">Entrada</option>
                    <option value="SAIDA_ALMOCO">Saída Almoço</option>
                    <option value="VOLTA_ALMOCO">Volta Almoço</option>
                    <option value="SAIDA">Saída</option>
                  </select>
                </div>
                <div className="flex-1 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-purple-800 mb-1 uppercase">Data</label>
                    <input type="date" required value={lateForm.date} onChange={e => setLateForm({...lateForm, date: e.target.value})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg text-black focus:outline-none focus:border-purple-500"/>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-purple-800 mb-1 uppercase">Hora</label>
                    <input type="time" required value={lateForm.time} onChange={e => setLateForm({...lateForm, time: e.target.value})} className="w-full p-2.5 bg-white border border-purple-200 rounded-lg text-black focus:outline-none focus:border-purple-500"/>
                  </div>
                </div>
              </div>
              <button type="submit" className="bg-purple-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-purple-700 transition shadow-sm w-full md:w-auto">
                Enviar Solicitação ao Funcionário
              </button>
            </form>
          </div>

          {/* Listagem de pendentes */}
          <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-purple-200 pt-4 md:pt-0 md:pl-6 flex flex-col">
            <h3 className="text-sm font-bold text-purple-900 mb-3">Aguardando Confirmação ({pendingPunches.length})</h3>
            <div className="flex-1 overflow-y-auto max-h-48 space-y-2 pr-2">
              {pendingPunches.length === 0 ? (
                <p className="text-xs text-purple-600 italic">Nenhuma pendência.</p>
              ) : (
                pendingPunches.map(p => (
                  <div key={p.id} className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-sm text-xs relative">
                    <span className="font-bold text-gray-900 block">{p.employee.name}</span>
                    <span className="text-purple-600 font-semibold">{p.type.replace('_', ' ')}</span> • {new Date(p.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- FERIADOS E FOLGAS --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 mb-8 bg-gradient-to-r from-pink-50 to-white">
          <h2 className="text-xl font-bold text-pink-900 mb-1">Registrar Feriado ou Folga</h2>
          <p className="text-sm text-pink-700 mb-4">Marque os dias que não haverá expediente para preencher o Excel corretamente.</p>
          
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-pink-800 mb-1 uppercase">Funcionário</label>
                <select 
                  required 
                  value={eventForm.employeeId} 
                  onChange={e => setEventForm({...eventForm, employeeId: e.target.value})}
                  className="w-full p-2.5 bg-white border border-pink-200 rounded-lg text-black focus:outline-none focus:border-pink-500"
                >
                  <option value="all">⭐ TODOS OS FUNCIONÁRIOS</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-pink-800 mb-1 uppercase">Tipo de Evento</label>
                <select 
                  required 
                  value={eventForm.eventType} 
                  onChange={e => setEventForm({...eventForm, eventType: e.target.value})}
                  className="w-full p-2.5 bg-white border border-pink-200 rounded-lg text-black focus:outline-none focus:border-pink-500"
                >
                  <option value="FERIADO">Feriado</option>
                  <option value="FOLGA">Folga</option>
                  <option value="ATESTADO">Atestado</option>
                  <option value="FALTA">Falta</option>
                  <option value="FERIAS">Férias</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-pink-800 mb-1 uppercase">Data</label>
                <input 
                  type="date" 
                  required 
                  value={eventForm.date} 
                  onChange={e => setEventForm({...eventForm, date: e.target.value})} 
                  className="w-full p-2.5 bg-white border border-pink-200 rounded-lg text-black focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
            <button type="submit" className="bg-pink-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-pink-700 transition shadow-sm w-full md:w-auto">
              Salvar Evento na Planilha
            </button>
          </form>
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
        {/* --- HISTÓRICO DE PONTOS (Agrupado por Funcionário) --- */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Histórico de Pontos</h2>
            <p className="text-gray-500 text-sm mt-1">Visualize as batidas organizadas por funcionário.</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={filterMonth} 
              onChange={e => setFilterMonth(parseInt(e.target.value))}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 font-bold text-gray-700 shadow-sm focus:outline-none focus:border-blue-500"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Mês {m.toString().padStart(2, '0')}</option>)}
            </select>
            <input 
              type="number" 
              value={filterYear} 
              onChange={e => setFilterYear(parseInt(e.target.value))}
              className="w-24 bg-white border border-gray-300 rounded-lg px-4 py-2 font-bold text-gray-700 shadow-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(punchesByEmployee).length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <span className="text-4xl block mb-2">📭</span>
              <p className="text-gray-500 font-semibold">Nenhum ponto registrado neste mês.</p>
            </div>
          ) : (
            Object.entries(punchesByEmployee).map(([empName, daysObj]: any) => (
              <div key={empName} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
                {/* Cabeçalho do Accordion */}
                <button 
                  onClick={() => toggleAccordion(empName)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                      {empName.charAt(0)}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">{empName}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-gray-400">
                    <span className="text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                      {Object.keys(daysObj).length} dias trabalhados
                    </span>
                    <span className={`transform transition-transform duration-300 text-xl ${expandedEmp === empName ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Conteúdo do Accordion */}
                {expandedEmp === empName && (
                  <div className="border-t border-gray-100 bg-gray-50 p-6 space-y-6">
                    {Object.entries(daysObj).sort((a: any, b: any) => new Date(b[0].split('/').reverse().join('-')).getTime() - new Date(a[0].split('/').reverse().join('-')).getTime()).map(([dateStr, empPunches]: any) => {
                      const sortedPunches = [...empPunches].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                      return (
                        <div key={dateStr} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            📅 {dateStr}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {sortedPunches.map((p: any) => (
                              <div key={p.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                {p.photoUrl && p.photoUrl !== 'mock-url-porque-sem-token.jpg' ? (
                                  <a href={p.photoUrl} target="_blank" rel="noreferrer">
                                    <img src={p.photoUrl} alt="Foto" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm mb-2" />
                                  </a>
                                ) : (
                                  <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-[9px] text-gray-500 mb-2 shadow-inner">Sem foto</div>
                                )}
                                <span className="font-black text-gray-900 text-lg tracking-tight">
                                  {new Date(p.timestamp).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-blue-600 mt-1 mb-1 flex items-center gap-1 justify-center">
                                  {p.type.replace('_', ' ')}
                                  {p.isLatePunch && <span className="bg-purple-100 text-purple-700 px-1 rounded" title="Ponto Atrasado">⚠️</span>}
                                </span>
                                {p.distanceFromStoreMeters !== null && p.latitude && p.longitude && (
                                  <a 
                                    href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded transition-opacity ${p.distanceFromStoreMeters > 100 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
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
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
