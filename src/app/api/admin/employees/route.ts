import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      where: { active: true },
      select: { id: true, name: true, number: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ employees });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar funcionários.' }, { status: 500 });
  }
}
