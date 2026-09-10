import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || 'all';
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const employees = await prisma.employee.findMany({
      where: employeeId === 'all' ? { active: true } : { id: employeeId },
      include: {
        schedules: true,
        punches: {
          where: {
            timestamp: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1)
            }
          },
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Ponto';

    const blueFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
    const whiteFont = { color: { argb: 'FFFFFFFF' }, bold: true };
    const borderThin: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    for (const emp of employees) {
      // Limitar nome da aba a 31 chars
      const sheetName = emp.name.substring(0, 31).replace(/[\*\?\/\\\[\]]/g, '');
      const sheet = workbook.addWorksheet(sheetName);

      // Configurar larguras das colunas
      sheet.columns = [
        { width: 5 },  // A: Num
        { width: 6 },  // B: Dia sem.
        { width: 12 }, // C: Evento
        { width: 8 },  // D: ENT 1
        { width: 8 },  // E: SAI 1
        { width: 8 },  // F: ENT 2
        { width: 8 },  // G: SAI 2
        { width: 8 },  // H: E1
        { width: 8 },  // I: S1
        { width: 8 },  // J: E2
        { width: 8 },  // K: S2
        { width: 10 }  // L: H. Not.
      ];

      // Linha 1
      sheet.getCell('A1').value = 'Func:';
      sheet.getCell('A1').fill = blueFill;
      sheet.getCell('A1').font = whiteFont;
      sheet.mergeCells('B1:D1');
      sheet.getCell('B1').value = emp.name;
      sheet.getCell('B1').font = { bold: true };
      sheet.getCell('E1').value = new Date().toLocaleDateString('pt-BR');

      // Linha 2
      sheet.getCell('A2').value = 'Cod:';
      sheet.getCell('A2').fill = blueFill;
      sheet.getCell('A2').font = whiteFont;
      sheet.getCell('B2').value = emp.number;
      sheet.getCell('C2').value = 'Competencia:';
      sheet.getCell('C2').fill = blueFill;
      sheet.getCell('C2').font = whiteFont;
      sheet.getCell('D2').value = `${month.toString().padStart(2, '0')}/${year}`;
      sheet.mergeCells('E2:H2');
      sheet.getCell('E2').value = emp.role;

      // Linha 5 (Cabeçalho da tabela)
      const headers = ['DATA', '', 'EVENTO', 'ENT 1', 'SAI 1', 'ENT 2', 'SAI 2', 'E1', 'S1', 'E2', 'S2', 'H. Not.'];
      sheet.getRow(5).values = headers;
      sheet.mergeCells('A5:B5');
      sheet.getCell('A5').value = 'DATA';

      sheet.getRow(5).eachCell((cell) => {
        cell.fill = blueFill;
        cell.font = whiteFont;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = borderThin;
      });

      // Gerar dias do mês
      const daysInMonth = new Date(year, month, 0).getDate();
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeekStr = diasSemana[currentDate.getDay()];
        
        // Filtrar pontos do dia
        const dayPunches = emp.punches.filter(p => new Date(p.timestamp).getDate() === day);
        
        const ent1 = dayPunches.find(p => p.type === 'ENTRADA');
        const sai1 = dayPunches.find(p => p.type === 'SAIDA_ALMOCO');
        const ent2 = dayPunches.find(p => p.type === 'VOLTA_ALMOCO');
        const sai2 = dayPunches.find(p => p.type === 'SAIDA');

        const formatTime = (p: any) => p ? new Date(p.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '';

        const row = sheet.addRow([
          day,
          dayOfWeekStr,
          'Normal',
          formatTime(ent1),
          formatTime(sai1),
          formatTime(ent2),
          formatTime(sai2),
          '0:00', '0:00', '0:00', '0:00', '00:00' // E1, S1, E2, S2, H. Not (mock para fórmulas depois)
        ]);

        row.eachCell((cell) => {
          cell.border = borderThin;
          cell.alignment = { horizontal: 'center' };
        });
      }

      // Rodapé Totalizadores
      const footerStart = 5 + daysInMonth + 2;
      sheet.getRow(footerStart).values = ['Extra 50%', 'Extra 100%', 'Feriado', 'H. Not', 'Atraso', 'Faltas'];
      sheet.mergeCells(`A${footerStart}:B${footerStart}`);
      sheet.getCell(`A${footerStart}`).value = 'Extra 50%';

      sheet.getRow(footerStart).eachCell((cell) => {
        cell.fill = blueFill;
        cell.font = whiteFont;
        cell.alignment = { horizontal: 'center' };
        cell.border = borderThin;
      });
      
      const footerValues = sheet.addRow(['00:00', '00:00', '00:00', '00:00', '00:00', 'Dias integrais:']);
      sheet.mergeCells(`A${footerStart+1}:B${footerStart+1}`);
      footerValues.eachCell((cell) => { cell.border = borderThin; cell.alignment = { horizontal: 'center' }; });
    }

    if (employees.length === 0) {
      return NextResponse.json({ error: 'Nenhum funcionário encontrado.' }, { status: 404 });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Relatorio_Ponto_${month}_${year}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Erro ao gerar relatório Excel:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar o Excel.' }, { status: 500 });
  }
}
