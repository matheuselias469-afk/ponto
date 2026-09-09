import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { put } from '@vercel/blob';

// Função auxiliar para calcular distância (Haversine)
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Raio da Terra em metros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const employeeId = formData.get('employeeId') as string;
    const pin = formData.get('pin') as string;
    const photo = formData.get('photo') as File;
    const lat = parseFloat(formData.get('latitude') as string);
    const lon = parseFloat(formData.get('longitude') as string);
    const justification = formData.get('justification') as string | null;

    if (!employeeId || !pin || !photo || isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    // 1. Validar funcionário e PIN
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee || employee.pin !== pin) {
      return NextResponse.json({ error: 'PIN incorreto ou funcionário não encontrado.' }, { status: 401 });
    }

    // 2. Validar Localização
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
    let distance = 0;
    if (settings) {
      distance = getDistanceFromLatLonInMeters(settings.latitude, settings.longitude, lat, lon);
      if (distance > settings.radiusMeters) {
         return NextResponse.json({ error: `Você está fora do raio permitido da loja (${Math.round(distance)}m).` }, { status: 403 });
      }
    }

    // 3. Determinar o tipo de batida (Lógica simplificada para Entrada/Saída)
    // No mundo real, buscaríamos os pontos de hoje para saber a sequência
    const todayPunches = await prisma.punch.count({
      where: {
        employeeId,
        timestamp: { gte: new Date(new Date().setHours(0,0,0,0)) }
      }
    });

    let punchType: any = 'ENTRADA';
    if (justification) punchType = 'SAIDA_ANTECIPADA';
    else if (todayPunches === 1) punchType = 'SAIDA_ALMOCO';
    else if (todayPunches === 2) punchType = 'VOLTA_ALMOCO';
    else if (todayPunches === 3) punchType = 'SAIDA';
    else if (todayPunches >= 4) punchType = 'EXTRA';

    // 4. Upload da foto
    let photoUrl = '';
    try {
      // O @vercel/blob já puxa automaticamente o BLOB_READ_WRITE_TOKEN do ambiente
      const blob = await put(photo.name, photo, { access: 'public' });
      photoUrl = blob.url;
    } catch (blobError) {
      console.error('Erro ao fazer upload para o Vercel Blob:', blobError);
      photoUrl = 'mock-url-porque-sem-token.jpg'; // fallback em caso de erro
    }

    // 5. Salvar Ponto
    const punch = await prisma.punch.create({
      data: {
        employeeId,
        timestamp: new Date(),
        type: punchType,
        photoUrl,
        latitude: lat,
        longitude: lon,
        distanceFromStoreMeters: distance,
        justification
      }
    });

    return NextResponse.json({ success: true, punch });
  } catch (error) {
    console.error('Erro ao bater ponto:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
