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
    const data = await request.json();
    
    // Preparar objeto de atualização com apenas os campos enviados
    const updateData: any = {};
    if (data.inviteKey !== undefined) updateData.adminPin = data.inviteKey;
    if (data.latitude !== undefined) updateData.latitude = parseFloat(data.latitude);
    if (data.longitude !== undefined) updateData.longitude = parseFloat(data.longitude);
    if (data.radiusMeters !== undefined) updateData.radiusMeters = parseInt(data.radiusMeters);

    const settings = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: { 
        id: 'singleton', 
        adminPin: data.inviteKey || '14060920',
        latitude: updateData.latitude || 0,
        longitude: updateData.longitude || 0,
        radiusMeters: updateData.radiusMeters || 100
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
