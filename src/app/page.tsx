import Link from 'next/link';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Para não fazer cache da lista de funcionários

export default async function Home() {
  // Busca apenas os funcionários ativos
  const employees = await prisma.employee.findMany({
    where: { active: true },
    orderBy: { name: 'asc' }
  });

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Ponto por Foto</h1>
        <p className="text-center text-gray-500 mb-8">Selecione o seu nome para bater o ponto</p>
        
        <div className="space-y-3">
          {employees.map((emp) => (
            <Link 
              href={`/ponto?id=${emp.id}`} 
              key={emp.id}
              className="block w-full text-left bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-lg p-4 font-medium text-gray-700 text-lg border border-transparent hover:border-blue-200"
            >
              <div className="flex justify-between items-center">
                <span>{emp.name}</span>
                <span className="text-sm text-gray-400 bg-gray-200 px-2 py-1 rounded">Cód: {emp.number}</span>
              </div>
            </Link>
          ))}
          {employees.length === 0 && (
            <p className="text-center text-gray-400 py-4">Nenhum funcionário cadastrado.</p>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex flex-col space-y-2 items-center">
        <Link href="/cadastro" className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition">
          Primeiro Acesso? Criar Conta
        </Link>
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 underline mt-4">
          Acesso do Gestor
        </Link>
      </div>
    </main>
  );
}
