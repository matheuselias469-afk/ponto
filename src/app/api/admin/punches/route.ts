import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const punches = await prisma.punch.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: {
        employee: {
          select: { name: true, number: true }
        }
      }
    });

    return NextResponse.json({ punches });
  } catch (error) {
    console.error('Erro ao buscar pontos:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
