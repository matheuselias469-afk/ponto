'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PontoContent() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('id');
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1); // 1 = PIN, 2 = Camera/Ponto
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locError, setLocError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!employeeId) router.push('/');
  }, [employeeId, router]);

  // Função para abrir câmera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } // Câmera frontal
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro na câmera", err);
    }
  };

  // Pegar GPS e Câmera ao chegar no passo 2
  useEffect(() => {
    if (step === 2) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          (err) => setLocError("Ative a localização para bater o ponto.")
        );
      } else {
        setLocError("GPS não suportado neste navegador.");
      }
      startCamera();
    }
  }, [step]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) setStep(2);
  };

  const handleBaterPonto = async () => {
    if (!location) {
      alert("Aguardando GPS...");
      return;
    }
    
    // Tirar a foto
    let blobPhoto: Blob | null = null;
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = 240;
      canvasRef.current.height = 180;
      context?.drawImage(videoRef.current, 0, 0, 240, 180);
      
      blobPhoto = await new Promise((resolve) => 
        canvasRef.current?.toBlob(resolve, 'image/jpeg', 0.6)
      );
    }

    if (!blobPhoto) {
       alert("Não foi possível capturar a foto.");
       return;
    }

    const formData = new FormData();
    formData.append('employeeId', employeeId!);
    formData.append('pin', pin);
    formData.append('latitude', location.lat.toString());
    formData.append('longitude', location.lon.toString());
    formData.append('photo', blobPhoto, `ponto_${Date.now()}.jpg`);

    try {
      const res = await fetch('/api/punch', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("Ponto registrado com sucesso: " + data.punch.type);
        router.push('/');
      } else {
        alert("Erro: " + data.error);
      }
    } catch (e) {
      alert("Erro de conexão ao salvar ponto.");
    }
  };

  if (step === 1) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <form onSubmit={handlePinSubmit} className="w-full max-w-sm bg-white rounded-xl shadow p-8 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4">Digite seu PIN</h2>
          <input 
            type="tel" 
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="text-center text-4xl tracking-widest p-4 border-2 border-gray-300 rounded-lg w-full mb-6 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <button type="submit" disabled={pin.length !== 4} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg disabled:opacity-50">
            Avançar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col p-4">
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        
        {locError && (
          <div className="bg-red-500/20 text-red-200 p-4 rounded-lg text-center w-full max-w-sm border border-red-500">
            {locError}
          </div>
        )}

        <div className="text-5xl font-bold tracking-tighter">
          {new Date().toLocaleTimeString('pt-BR', {timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit'})}
        </div>

        <div className="relative w-full max-w-sm aspect-video bg-black rounded-xl overflow-hidden border-2 border-gray-700 shadow-lg">
           <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
           <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        <button 
          onClick={handleBaterPonto}
          className="w-full max-w-sm bg-green-600 active:bg-green-700 text-white font-bold text-xl py-5 rounded-xl shadow-[0_4px_0_0_rgb(22,101,52)] active:shadow-none active:translate-y-1 transition-all"
        >
          BATER PONTO AGORA
        </button>
      </div>
    </main>
  );
}

export default function PontoScreen() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <PontoContent />
    </Suspense>
  );
}
