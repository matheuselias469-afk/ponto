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

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.push('/admin/login');
  };

  // Filtragem e Agrupamento dos Pontos (Histórico)
  const filteredPunches = punches.filter((p: any) => {
    const d = new Date(p.timestamp);
    return (d.getMonth() + 1) === filterMonth && d.getFullYear() === filterYear;
  });

  const punchesByEmployee = filteredPunches.reduce((acc: any, punch: any) => {
    const empName = punch.employee.name;
    const dataStr = new Date(punch.timestamp).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    if (!acc[empName]) acc[empName] = {};
    if (!acc[empName][dataStr]) acc[empName][dataStr] = [];
    acc[empName][dataStr].push(punch);
    return acc;
  }, {});

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">Carregando painel...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0d394e] to-[#041620] p-4 md:p-8 text-white relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#cca158]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 animate-fade-in-up">
        
        {/* Cabeçalho Bonito e Responsivo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/10 mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#cca158]/10 p-3 rounded-2xl border border-[#cca158]/30 hidden md:block">
              <img src="/decor-logo.png" alt="Decor" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase">Painel Gestão</h1>
              <p className="text-[#cca158] mt-1 text-sm opacity-80">Controle e Relatórios</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            <Link href="/" className="flex-1 md:flex-none text-center bg-white/10 text-white border border-white/20 px-5 py-2.5 rounded-xl font-bold hover:bg-white/20 transition-all text-sm uppercase tracking-wider">
              📱 Ir para o Ponto
            </Link>
            <button onClick={handleLogout} className="flex-1 md:flex-none bg-red-500/20 text-red-300 border border-red-500/30 px-5 py-2.5 rounded-xl font-bold hover:bg-red-500/30 transition-all text-sm uppercase tracking-wider">
              Sair
            </button>
          </div>
        </div>

        {/* --- EXPORTAÇÃO EXCEL --- */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-[#cca158]/20 mb-8 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#cca158]/5 rounded-full blur-3xl group-hover:bg-[#cca158]/10 transition-all"></div>
          <div className="flex-1 relative z-10">
            <h2 className="text-xl font-bold text-[#cca158] mb-1 tracking-wide">Gerar Planilha (Excel)</h2>
            <p className="text-sm text-white/60 mb-4">Escolha o funcionário e o mês para baixar o relatório completo.</p>
            
            <form action="/api/admin/report" method="GET" target="_blank" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#cca158] mb-1 uppercase tracking-wider">Funcionário</label>
                  <select 
                    name="employeeId"
                    value={reportForm.employeeId} 
                    onChange={e => setReportForm({...reportForm, employeeId: e.target.value})}
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#cca158] transition-colors"
                  >
                    <option value="all" className="bg-[#0d394e]">Todos os Funcionários</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id} className="bg-[#0d394e]">{emp.name}</option>)}
                  </select>
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-xs font-bold text-[#cca158] mb-1 uppercase tracking-wider">Mês</label>
                  <select 
                    name="month"
                    value={reportForm.month} 
                    onChange={e => setReportForm({...reportForm, month: parseInt(e.target.value)})}
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#cca158] transition-colors"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m} className="bg-[#0d394e]">{m.toString().padStart(2, '0')}</option>)}
                  </select>
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-xs font-bold text-[#cca158] mb-1 uppercase tracking-wider">Ano</label>
                  <input 
                    type="number"
                    name="year"
                    value={reportForm.year} 
                    onChange={e => setReportForm({...reportForm, year: parseInt(e.target.value)})}
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#cca158] transition-colors"
                  />
                </div>
              </div>
              <button type="submit" className="bg-gradient-to-r from-[#cca158] to-[#aa8343] text-[#0d394e] font-black py-3 px-6 rounded-xl hover:shadow-[0_0_15px_rgba(204,161,88,0.4)] transition-all transform hover:-translate-y-1 w-full md:w-auto tracking-wide flex items-center justify-center gap-2">
                <span>⬇️</span> BAIXAR PLANILHA
              </button>
            </form>
          </div>
        </div>

        {/* Painel de Configurações Dividido em 3 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* Gerenciador de Chave de Segurança */}
          <div className="bg-white/5 p-6 rounded-[2rem] shadow-xl border border-white/10 flex flex-col gap-4 relative overflow-hidden group hover:border-[#cca158]/30 transition-colors">
            <div className="flex-1 relative z-10">
              <h2 className="text-lg font-bold text-white mb-1">Chave de Segurança</h2>
              <p className="text-sm text-white/50 mb-3">Compartilhe para novos cadastros.</p>
              <input 
                type="text" 
                value={inviteKey}
                onChange={(e) => setInviteKey(e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-[#cca158] text-[#cca158] font-bold tracking-widest text-center"
                placeholder="Ex: MINHALOJA2026"
              />
            </div>
            <button 
              onClick={handleUpdateKey}
              className="w-full bg-white/10 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-all border border-white/10 hover:border-white/30 shadow-sm relative z-10"
            >
              ATUALIZAR CHAVE
            </button>
          </div>

          {/* Configuração de Localização da Loja */}
          <div className="bg-white/5 p-6 rounded-[2rem] shadow-xl border border-white/10 flex flex-col gap-4 relative overflow-hidden group hover:border-[#cca158]/30 transition-colors">
            <div className="flex-1 relative z-10">
              <h2 className="text-lg font-bold text-white mb-1">Localização (GPS)</h2>
              <p className="text-sm text-white/50 mb-3">Defina onde fica a loja.</p>
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={handleGetLocation}
                  className="w-full bg-[#cca158]/10 text-[#cca158] border border-[#cca158]/30 font-bold py-2 rounded-xl hover:bg-[#cca158]/20 transition-colors text-sm flex justify-center items-center gap-2"
                >
                  📍 Pegar localização atual
                </button>
              </div>
              <div className="flex gap-2 text-sm text-[#cca158] mb-2">
                <span className="flex-1 bg-black/20 p-2 border border-white/5 rounded-xl font-mono truncate text-center">Lat: {storeLat}</span>
                <span className="flex-1 bg-black/20 p-2 border border-white/5 rounded-xl font-mono truncate text-center">Lon: {storeLon}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-3 bg-black/20 p-2 rounded-xl border border-white/5">
                <span className="font-bold text-white/70 ml-2">Raio Permitido:</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={storeRadius} onChange={e => setStoreRadius(Number(e.target.value))} className="w-16 p-1 text-center bg-transparent border-b border-white/20 focus:border-[#cca158] focus:outline-none font-bold text-white"/>
                  <span className="text-[#cca158] font-bold mr-2">metros</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleUpdateLocation}
              className="w-full bg-white/10 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-all border border-white/10 hover:border-white/30 shadow-sm relative z-10"
            >
              SALVAR LOCALIZAÇÃO
            </button>
          </div>

          {/* Notificações (Horários) */}
          <div className="bg-white/5 p-6 rounded-[2rem] shadow-xl border border-white/10 flex flex-col gap-4 relative overflow-hidden group hover:border-[#cca158]/30 transition-colors">
            <div className="flex-1 relative z-10">
              <h2 className="text-lg font-bold text-white mb-1">Notificações</h2>
              <p className="text-sm text-white/50 mb-3">Lembretes para bater o ponto.</p>
              <div className="flex gap-2 mb-4">
                <input 
                  type="time" 
                  value={newNotifTime}
                  onChange={(e) => setNewNotifTime(e.target.value)}
                  className="flex-1 p-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-[#cca158] text-white font-bold"
                />
                <button 
                  onClick={handleAddNotificationTime}
                  className="bg-[#cca158] text-[#0d394e] font-black px-6 rounded-xl hover:bg-[#aa8343] transition-colors"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                {notificationTimes.length === 0 ? (
                  <span className="text-xs text-white/40 italic">Nenhum horário.</span>
                ) : (
                  notificationTimes.map(t => (
                    <span key={t} className="bg-[#cca158]/10 border border-[#cca158]/30 text-[#cca158] text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                      {t}
                      <button onClick={() => handleRemoveNotificationTime(t)} className="text-[#cca158]/60 hover:text-red-400 transition-colors">×</button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- PONTOS ATRASADOS / SOLICITAÇÃO --- */}
        <div className="bg-white/5 p-6 rounded-[2rem] shadow-xl border border-white/10 mb-8 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:border-[#cca158]/30 transition-colors">
          <div className="flex-1 relative z-10">
            <h2 className="text-xl font-bold text-white mb-1">Solicitar Ponto Atrasado</h2>
            <p className="text-sm text-white/50 mb-4">Esqueceu de bater? Selecione o funcionário e crie a pendência.</p>
            
            <form onSubmit={handleCreateLatePunch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#cca158] mb-1 uppercase tracking-wider">Funcionário</label>
                  <select 
                    required 
                    value={lateForm.employeeId} 
                    onChange={e => setLateForm({...lateForm, employeeId: e.target.value})}
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#cca158] transition-colors"
                  >
                    <option value="" className="bg-[#0d394e]">Selecione...</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id} className="bg-[#0d394e]">{emp.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#cca158] mb-1 uppercase tracking-wider">Tipo</label>
                  <select 
                    required 
                    value={lateForm.type} 
                    onChange={e => setLateForm({...lateForm, type: e.target.value})}
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#cca158] transition-colors"
                  >
                    <option value="ENTRADA" className="bg-[#0d394e]">Entrada</option>
                    <option value="SAIDA_ALMOCO" className="bg-[#0d394e]">Saída Almoço</option>
                    <option value="VOLTA_ALMOCO" className="bg-[#0d394e]">Volta Almoço</option>
                    <option value="SAIDA" className="bg-[#0d394e]">Saída</option>
                  </select>
                </div>
                <div className="flex-1 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#cca158] mb-1 uppercase tracking-wider">Data</label>
                    <input type="date" required value={lateForm.date} onChange={e => setLateForm({...lateForm, date: e.target.value})} className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#cca158] transition-colors [color-scheme:dark]"/>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#cca158] mb-1 uppercase tracking-wider">Hora</label>
                    <input type="time" required value={lateForm.time} onChange={e => setLateForm({...lateForm, time: e.target.value})} className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#cca158] transition-colors [color-scheme:dark]"/>
                  </div>
                </div>
              </div>
              <button type="submit" className="bg-white/10 text-white border border-white/20 font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-all shadow-sm w-full md:w-auto hover:border-white/30 text-sm tracking-wide">
                ENVIAR SOLICITAÇÃO
              </button>
            </form>
          </div>

          {/* Listagem de pendentes */}
          <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 flex flex-col relative z-10">
            <h3 className="text-sm font-bold text-[#cca158] mb-3 uppercase tracking-widest">Aguardando Confirmação ({pendingPunches.length})</h3>
            <div className="flex-1 overflow-y-auto max-h-48 space-y-2 pr-2 custom-scrollbar">
              {pendingPunches.length === 0 ? (
                <p className="text-xs text-white/40 italic">Nenhuma pendência.</p>
              ) : (
                pendingPunches.map(p => (
                  <div key={p.id} className="bg-black/20 p-3 rounded-xl border border-white/5 shadow-sm text-xs relative">
                    <span className="font-bold text-white block mb-0.5">{p.employee.name}</span>
                    <span className="text-[#cca158] font-black">{p.type.replace('_', ' ')}</span> • <span className="text-white/60">{new Date(p.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- FERIADOS E FOLGAS --- */}
        <div className="bg-white/5 p-6 rounded-[2rem] shadow-xl border border-white/10 mb-8 relative overflow-hidden group hover:border-[#cca158]/30 transition-colors">
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-1">Registrar Feriado ou Folga</h2>
            <p className="text-sm text-white/50 mb-4">Marque os dias que não haverá expediente para preencher o Excel corretamente.</p>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#cca158] mb-1 uppercase tracking-wider">Funcionário</label>
                  <select 
                    required 
                    value={eventForm.employeeId} 
                    onChange={e => setEventForm({...eventForm, employeeId: e.target.value})}
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#cca158] transition-colors"
                  >
                    <option value="all" className="bg-[#0d394e]">⭐ TODOS OS FUNCIONÁRIOS</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id} className="bg-[#0d394e]">{emp.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#cca158] mb-1 uppercase tracking-wider">Tipo de Evento</label>
                  <select 
                    required 
                    value={eventForm.eventType} 
                    onChange={e => setEventForm({...eventForm, eventType: e.target.value})}
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#cca158] transition-colors"
                  >
                    <option value="FERIADO" className="bg-[#0d394e]">Feriado</option>
                    <option value="FOLGA" className="bg-[#0d394e]">Folga</option>
                    <option value="ATESTADO" className="bg-[#0d394e]">Atestado</option>
                    <option value="FALTA" className="bg-[#0d394e]">Falta</option>
                    <option value="FERIAS" className="bg-[#0d394e]">Férias</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#cca158] mb-1 uppercase tracking-wider">Data</label>
                  <input 
                    type="date" 
                    required 
                    value={eventForm.date} 
                    onChange={e => setEventForm({...eventForm, date: e.target.value})} 
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#cca158] transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>
              <button type="submit" className="bg-white/10 text-white border border-white/20 font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-all shadow-sm w-full md:w-auto hover:border-white/30 text-sm tracking-wide">
                SALVAR EVENTO NA PLANILHA
              </button>
            </form>
          </div>
        </div>

        {/* --- HISTÓRICO DE PONTOS (Agrupado por Funcionário) --- */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase">Histórico de Pontos</h2>
            <p className="text-[#cca158] text-sm mt-1 opacity-80">Visualize as batidas organizadas por funcionário.</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={filterMonth} 
              onChange={e => setFilterMonth(parseInt(e.target.value))}
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 font-bold text-white shadow-sm focus:outline-none focus:border-[#cca158]"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m} className="bg-[#0d394e]">Mês {m.toString().padStart(2, '0')}</option>)}
            </select>
            <input 
              type="number" 
              value={filterYear} 
              onChange={e => setFilterYear(parseInt(e.target.value))}
              className="w-24 bg-black/20 border border-white/10 rounded-xl px-4 py-2 font-bold text-white shadow-sm focus:outline-none focus:border-[#cca158]"
            />
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {Object.entries(punchesByEmployee).length === 0 ? (
            <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] p-12 text-center backdrop-blur-md">
              <span className="text-4xl block mb-2 opacity-70">📭</span>
              <p className="text-white/50 font-semibold tracking-wide">Nenhum ponto registrado neste mês.</p>
            </div>
          ) : (
            Object.entries(punchesByEmployee).map(([empName, daysObj]: any) => (
              <div key={empName} className="bg-white/5 rounded-[2rem] shadow-xl border border-white/10 overflow-hidden transition-all duration-300 backdrop-blur-md">
                {/* Cabeçalho do Accordion */}
                <button 
                  onClick={() => toggleAccordion(empName)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#cca158] to-[#99763d] text-[#0d394e] flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(204,161,88,0.3)]">
                      {empName.charAt(0)}
                    </div>
                    <h3 className="font-bold text-lg text-white tracking-wide">{empName}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-white/40">
                    <span className="text-xs font-bold bg-[#cca158]/10 border border-[#cca158]/20 px-3 py-1.5 rounded-full text-[#cca158] uppercase tracking-wider">
                      {Object.keys(daysObj).length} dias trabalhados
                    </span>
                    <span className={`transform transition-transform duration-300 text-xl text-[#cca158] ${expandedEmp === empName ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Conteúdo do Accordion */}
                {expandedEmp === empName && (
                  <div className="border-t border-white/10 bg-black/20 p-6 space-y-6">
                    {Object.entries(daysObj).sort((a: any, b: any) => new Date(b[0].split('/').reverse().join('-')).getTime() - new Date(a[0].split('/').reverse().join('-')).getTime()).map(([dateStr, empPunches]: any) => {
                      const sortedPunches = [...empPunches].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                      return (
                        <div key={dateStr} className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-sm">
                          <h4 className="font-bold text-[#cca158] mb-4 flex items-center gap-2 tracking-wide uppercase text-sm border-b border-white/10 pb-2">
                            📅 {dateStr}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {sortedPunches.map((p: any) => (
                              <div key={p.id} className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-[#cca158]/30 transition-colors group">
                                {p.photoUrl && p.photoUrl !== 'mock-url-porque-sem-token.jpg' ? (
                                  <a href={p.photoUrl} target="_blank" rel="noreferrer" className="relative">
                                    <img src={p.photoUrl} alt="Foto" className="w-16 h-16 rounded-full object-cover border-2 border-[#cca158]/50 shadow-[0_0_10px_rgba(204,161,88,0.2)] mb-3 group-hover:scale-110 transition-transform" />
                                  </a>
                                ) : (
                                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-[10px] text-white/30 mb-3 shadow-inner border border-white/10">Sem foto</div>
                                )}
                                <span className="font-black text-white text-xl tracking-widest drop-shadow-md">
                                  {new Date(p.timestamp).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-[#cca158] mt-2 mb-2 flex items-center gap-1 justify-center tracking-wider">
                                  {p.type.replace('_', ' ')}
                                  {p.isLatePunch && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded ml-1" title="Ponto Atrasado">⚠️</span>}
                                </span>
                                {p.distanceFromStoreMeters !== null && p.latitude && p.longitude && (
                                  <a 
                                    href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={`text-[10px] font-bold mt-1 px-2.5 py-1 rounded border transition-opacity ${p.distanceFromStoreMeters > 100 ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}
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
