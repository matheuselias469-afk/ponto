import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Busca os últimos 50 registros de ponto com as informações do funcionário
  const punches = await prisma.punch.findMany({
    take: 50,
    orderBy: { timestamp: 'desc' },
    include: {
      employee: {
        select: { name: true, number: true }
      }
    }
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Painel do Gestor</h1>
          <div className="space-x-4">
            <Link href="/api/admin/report" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">
              Gerar Planilha (Excel)
            </Link>
            <Link href="/" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
              Voltar ao Início
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-sm">
                  <th className="p-4 font-semibold">Foto</th>
                  <th className="p-4 font-semibold">Funcionário</th>
                  <th className="p-4 font-semibold">Data / Hora</th>
                  <th className="p-4 font-semibold">Tipo</th>
                  <th className="p-4 font-semibold">Localização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {punches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum ponto registrado ainda.
                    </td>
                  </tr>
                )}
                {punches.map((punch) => (
                  <tr key={punch.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      {punch.photoUrl && punch.photoUrl !== 'mock-url-porque-sem-token.jpg' ? (
                        <a href={punch.photoUrl} target="_blank" rel="noreferrer">
                          <img 
                            src={punch.photoUrl} 
                            alt="Foto do ponto" 
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm hover:scale-150 transition-transform cursor-pointer"
                          />
                        </a>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 text-center p-1">
                          Sem foto
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{punch.employee.name}</div>
                      <div className="text-sm text-gray-500">Cód: {punch.employee.number}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">
                        {punch.timestamp.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {punch.timestamp.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        punch.type === 'ENTRADA' ? 'bg-blue-100 text-blue-700' :
                        punch.type === 'SAIDA_ALMOCO' || punch.type === 'SAIDA' ? 'bg-orange-100 text-orange-700' :
                        punch.type === 'VOLTA_ALMOCO' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {punch.type.replace('_', ' ')}
                      </span>
                      {punch.justification && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          "{punch.justification}"
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {punch.distanceFromStoreMeters !== null ? (
                        <span className={`text-sm ${punch.distanceFromStoreMeters > 100 ? 'text-red-500 font-medium' : 'text-green-600'}`}>
                          a {Math.round(punch.distanceFromStoreMeters)}m da loja
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Sem GPS</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
