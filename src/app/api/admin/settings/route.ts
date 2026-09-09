import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'singleton', adminPin: '14060920' }
      });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar configurações.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { inviteKey } = await request.json();
    
    if (!inviteKey || inviteKey.length < 4) {
      return NextResponse.json({ error: 'A chave deve ter pelo menos 4 caracteres.' }, { status: 400 });
    }

    const settings = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: { adminPin: inviteKey },
      create: { id: 'singleton', adminPin: inviteKey }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar chave.' }, { status: 500 });
  }
}
