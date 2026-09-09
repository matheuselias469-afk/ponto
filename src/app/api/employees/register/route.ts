import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { secretKey, name, number, role, pin } = data;

    // Busca a chave de segurança dinâmica do banco de dados (guardada no campo adminPin)
    let settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    const MANAGER_SECRET_KEY = settings?.adminPin || '14060920';

    if (secretKey !== MANAGER_SECRET_KEY) {
      return NextResponse.json({ error: 'Chave de Segurança inválida. Peça a nova chave ao gestor.' }, { status: 403 });
    }

    if (!name || !number || !role || !pin) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { number: number }
    });

    if (existingEmployee) {
      return NextResponse.json({ error: 'Este código de funcionário já está em uso.' }, { status: 400 });
    }

    const newEmployee = await prisma.employee.create({
      data: {
        name,
        number,
        role,
        pin,
        active: true,
        admissionDate: new Date(),
      }
    });

    return NextResponse.json({ success: true, employee: newEmployee });

  } catch (error) {
    console.error('Erro ao registrar:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
