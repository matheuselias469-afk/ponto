import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { employeeId, time, type, date } = data; // time format "HH:mm", date "YYYY-MM-DD"

    if (!employeeId || !time || !type || !date) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    // Parse data e hora para criar o timestamp
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const timestamp = new Date(year, month - 1, day, hours, minutes);

    const pendingPunch = await prisma.pendingPunch.create({
      data: {
        employeeId,
        timestamp,
        type,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, pendingPunch });
  } catch (error) {
    console.error('Erro ao criar ponto atrasado:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const pending = await prisma.pendingPunch.findMany({
      where: { status: 'PENDING' },
      include: { employee: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ pending });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
