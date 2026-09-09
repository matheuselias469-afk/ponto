import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  // Mock simplificado do relatório. A lógica completa envolveria:
  // 1. Buscar todos os registros do funcionário no mês (Punches)
  // 2. Buscar a Jornada (WorkSchedule)
  // 3. Buscar os Eventos do Dia (DayEvent) e Feriados (Holiday)
  // 4. Fazer a matemática de diferenças em minutos
  
  const wb = XLSX.utils.book_new();
  const wsData = [
    // Cabeçalho
    ['Func:', 'DAVI DE MENEZES', '', '', '', '24/07/2026'],
    ['Cod:', '6', 'Competência:', 'ago-26', '', 'AUX. DEPOSIT.'],
    [],
    // Colunas
    ['#', 'DATA', 'DIA', 'EVENTO', 'ENT 1', 'SAI 1', 'ENT 2', 'SAI 2', 'E1', 'S1', 'E2', 'S2', 'H. Not.'],
    ['1', '1', 'Sáb', 'Normal', 0.3368, 0.4930, 0.5555, 0.6736, 0, 0, 0, 0.0194, 0], // Exemplo usando fração do dia para horas
    ['2', '2', 'Dom', 'Falta', '', '', '', '', '', '', '', '', '']
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Exemplo de formatação de células para "hh:mm"
  // Na prática iríamos iterar nas colunas D até M (índices 4 a 12)
  if (ws['E5']) ws['E5'].z = 'hh:mm';
  if (ws['F5']) ws['F5'].z = 'hh:mm';

  XLSX.utils.book_append_sheet(wb, ws, 'DAVI DE MENEZES');

  // Gerar o buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Disposition': 'attachment; filename="Relatorio_Ponto.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });
}
