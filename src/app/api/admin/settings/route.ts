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
    const { inviteKey, latitude, longitude, radiusMeters, notificationTimes } = data;

    const settings = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {
        adminPin: inviteKey !== undefined ? inviteKey : undefined,
        latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
        longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
        radiusMeters: radiusMeters !== undefined ? parseInt(radiusMeters) : undefined,
        notificationTimes: notificationTimes !== undefined ? JSON.stringify(notificationTimes) : undefined,
      },
      create: { 
        id: 'singleton', 
        adminPin: inviteKey || '14060920',
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        radiusMeters: radiusMeters ? parseInt(radiusMeters) : 100,
        notificationTimes: notificationTimes ? JSON.stringify(notificationTimes) : '[]'
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
