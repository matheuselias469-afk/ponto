import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:contato@decor.com",
  "BEIOV33lW67i26EaQ7wqSZmsftMB3VY4m-SBNa-8y0ZvLGIxyYMV8IzBDVCyd7c00Aa0yq6XNXq8OKxtpLLK1nw",
  "qM8eo6k5r7xNbre_TCBgMFEj66qPvRR2h0BCtudIbf8"
);

export async function POST(req: Request) {
  try {
    const { title, message } = await req.json();
    
    // Buscar todas as inscrições
    const subscriptions = await prisma.pushSubscription.findMany();
    
    if (subscriptions.length === 0) {
      return NextResponse.json({ success: false, error: "Nenhuma inscrição encontrada." });
    }

    const payload = JSON.stringify({
      title: title || "Decor Ponto",
      body: message || "Não se esqueça de bater o ponto!",
      icon: "/decor-logo.png",
      badge: "/decor-logo.png"
    });

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };
        await webpush.sendNotification(pushSub, payload);
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        console.error("Erro ao enviar push:", err);
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
