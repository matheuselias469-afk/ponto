import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { secretKey, name, number, role, pin } = data;

    // A Chave de Segurança única que o Gestor tem (podemos colocar em variaveis de ambiente depois)
    const MANAGER_SECRET_KEY = process.env.INVITE_KEY || '14060920';

    if (secretKey !== MANAGER_SECRET_KEY) {
      return NextResponse.json({ error: 'Chave de Segurança inválida.' }, { status: 403 });
    }

    if (!name || !number || !role || !pin) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }

    // Verifica se o código contábil já existe
    const existingEmployee = await prisma.employee.findUnique({
      where: { number: number }
    });

    if (existingEmployee) {
      return NextResponse.json({ error: 'Este código de funcionário já está em uso.' }, { status: 400 });
    }

    // Cria o funcionário no banco
    const newEmployee = await prisma.employee.create({
      data: {
        name,
        number,
        role,
        pin,
        active: true,
        admissionDate: new Date(), // Padrão usa o dia de hoje
      }
    });

    return NextResponse.json({ success: true, employee: newEmployee });

  } catch (error) {
    console.error('Erro ao registrar:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
