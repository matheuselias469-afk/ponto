import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { employeeId, date, eventType } = data; // date formato "YYYY-MM-DD"

    if (!employeeId || !date || !eventType) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    const eventDate = new Date(`${date}T12:00:00.000Z`); // Fixar meio-dia UTC para evitar fuso horário

    if (employeeId === 'all') {
      const employees = await prisma.employee.findMany({ where: { active: true } });
      
      // Upsert para todos os funcionários
      const operations = employees.map(emp => 
        prisma.dayEvent.upsert({
          where: {
            employeeId_date: { employeeId: emp.id, date: eventDate }
          },
          update: { eventType },
          create: { employeeId: emp.id, date: eventDate, eventType }
        })
      );
      
      await prisma.$transaction(operations);
    } else {
      await prisma.dayEvent.upsert({
        where: {
          employeeId_date: { employeeId, date: eventDate }
        },
        update: { eventType },
        create: { employeeId, date: eventDate, eventType }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar evento:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
