"use client";

import { useState, useEffect } from "react";

const publicVapidKey = "BEIOV33lW67i26EaQ7wqSZmsftMB3VY4m-SBNa-8y0ZvLGIxyYMV8IzBDVCyd7c00Aa0yq6XNXq8OKxtpLLK1nw";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setIsSubscribed(true);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify(sub),
        headers: { "Content-Type": "application/json" },
      });

      setIsSubscribed(true);
      alert("Notificaes ativadas com sucesso!");
    } catch (e: any) {
      alert("Erro ao ativar: " + e.message);
    }
    setLoading(false);
  };

  if (isSubscribed) return null;

  return (
    <button 
      onClick={subscribe}
      disabled={loading}
      className="mt-6 flex items-center gap-2 bg-[#cca158]/10 text-[#cca158] border border-[#cca158]/30 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#cca158]/20 transition-colors"
    >
      <span>O"</span> {loading ? "Ativando..." : "Ativar Lembretes de Ponto"}
    </button>
  );
}
