import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { employeeId, pin } = await request.json();

    if (!employeeId || !pin) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        pendingPunches: {
          where: { status: 'PENDING' },
          orderBy: { timestamp: 'asc' },
          take: 1 // Tratamos 1 pendência por vez
        }
      }
    });

    if (!employee || employee.pin !== pin) {
      return NextResponse.json({ error: 'PIN incorreto ou funcionário não encontrado.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, pendingPunches: employee.pendingPunches });

  } catch (error) {
    console.error('Erro ao verificar funcionário:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
