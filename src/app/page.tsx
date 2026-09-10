import Link from 'next/link';
import prisma from '@/lib/prisma';
import PushNotifications from '@/components/PushNotifications';

export const dynamic = 'force-dynamic'; // Para não fazer cache da lista de funcionários

export default async function Home() {
  // Busca apenas os funcionários ativos
  const employees = await prisma.employee.findMany({
    where: { active: true },
    orderBy: { name: 'asc' }
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0d394e] to-[#041620] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Elementos decorativos de fundo (Brilhos/Auras) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#cca158]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#cca158]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-8 relative z-10 animate-fade-in-up">
        
        {/* LOGO */}
        <div className="flex flex-col items-center justify-center mb-8 transform transition-transform hover:scale-105 duration-500">
          <div className="p-1 bg-gradient-to-br from-[#cca158] to-[#99763d] rounded-2xl shadow-xl mb-4">
            <div className="bg-[#0d394e] rounded-xl p-2">
              <img src="/decor-logo.png" alt="Decor" className="w-20 h-20 object-contain rounded-lg" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.3em] ml-2">Ponto</h1>
          <div className="w-12 h-1 bg-[#cca158] rounded-full mt-4 opacity-70"></div>
        </div>

        <p className="text-center text-[#cca158] mb-8 font-medium text-sm tracking-widest uppercase">Selecione seu Nome</p>
        
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {employees.map((emp) => (
            <Link 
              href={`/ponto?id=${emp.id}`} 
              key={emp.id}
              className="block w-full group relative overflow-hidden bg-white/5 hover:bg-[#cca158]/20 transition-all duration-300 rounded-2xl p-4 border border-white/5 hover:border-[#cca158]/50 transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(204,161,88,0.15)]"
            >
              {/* Brilho hover interno */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
              
              <div className="flex justify-between items-center relative z-10">
                <span className="font-semibold text-gray-100 group-hover:text-white transition-colors text-lg">{emp.name}</span>
                <span className="text-xs font-bold text-[#cca158] bg-[#cca158]/10 px-3 py-1.5 rounded-lg border border-[#cca158]/20">
                  {emp.number}
                </span>
              </div>
            </Link>
          ))}
          {employees.length === 0 && (
            <p className="text-center text-white/50 py-8 font-light">Nenhum funcionário ativo.</p>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex flex-col space-y-4 items-center relative z-10">
        <Link href="/cadastro" className="text-[#cca158] hover:text-white px-6 py-2 rounded-full border border-[#cca158]/30 hover:border-[#cca158] hover:bg-[#cca158]/10 transition-all duration-300 font-medium text-sm tracking-wide">
          Primeiro Acesso? Criar Conta
        </Link>
        <Link href="/admin" className="text-xs text-white/40 hover:text-white/80 transition-colors uppercase tracking-widest">
          Painel do Gestor
        </Link>
        
        <PushNotifications />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(204,161,88,0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(204,161,88,0.6); }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </main>
  );
}
