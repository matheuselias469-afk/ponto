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
        video: { 
          facingMode: 'user',
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        } 
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

  const [successPunch, setSuccessPunch] = useState<any>(null);
  const [pendingPunch, setPendingPunch] = useState<any>(null);
  const [loadingPin, setLoadingPin] = useState(false);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    
    setLoadingPin(true);
    try {
      const res = await fetch('/api/employees/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, pin })
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.pendingPunches && data.pendingPunches.length > 0) {
          setPendingPunch(data.pendingPunches[0]);
        }
        setStep(2);
      } else {
        alert("Erro: " + data.error);
      }
    } catch (e) {
      alert("Erro ao verificar o PIN.");
    } finally {
      setLoadingPin(false);
    }
  };

  const handleBaterPonto = async () => {
    if (!location) {
      alert("Aguardando GPS...");
      return;
    }
    
    let blobPhoto: Blob | null = null;
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Usa a resolução real da câmera (ex: 1080x1920) em vez de 240x180
      canvas.width = video.videoWidth || 1080;
      canvas.height = video.videoHeight || 1920;
      
      // Espelhar a imagem no canvas para não ficar invertida (já que a câmera frontal é espelhada no CSS)
      context?.translate(canvas.width, 0);
      context?.scale(-1, 1);
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      blobPhoto = await new Promise((resolve) => 
        canvas.toBlob(resolve, 'image/jpeg', 1.0) // Qualidade 100%
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
    
    if (pendingPunch) {
      formData.append('pendingPunchId', pendingPunch.id);
    }

    try {
      const res = await fetch('/api/punch', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccessPunch(data.punch);
      } else {
        alert("Erro: " + data.error);
      }
    } catch (e) {
      alert("Erro de conexão ao salvar ponto.");
    }
  };

  if (successPunch) {
    return (
      <main className="min-h-screen bg-green-600 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-24 h-24 bg-white text-green-600 rounded-full flex items-center justify-center text-5xl mb-6 shadow-xl">
          ✓
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Ponto Concluído!</h1>
        <p className="text-green-100 text-lg mb-8">
          Registro de <strong className="uppercase bg-green-800 px-2 py-1 rounded">{successPunch.type.replace('_', ' ')}</strong> salvo com sucesso.
        </p>
        
        <div className="bg-green-700 p-6 rounded-2xl w-full max-w-sm mb-12 shadow-inner">
          <p className="text-sm text-green-200 uppercase tracking-widest mb-1">Horário Registrado</p>
          <p className="text-4xl font-bold font-mono">
            {new Date(successPunch.timestamp).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })}
          </p>
        </div>

        <button 
          onClick={() => router.push('/')}
          className="w-full max-w-sm bg-white text-green-700 font-extrabold text-xl py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          FECHAR
        </button>
      </main>
    );
  }

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
            className="text-center text-4xl tracking-widest p-4 border-2 border-gray-300 rounded-lg w-full mb-6 focus:border-blue-500 focus:outline-none text-black"
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

        <div className="text-center w-full flex flex-col items-center">
          {pendingPunch && (
            <div className="bg-purple-600 p-4 rounded-xl mb-4 w-full max-w-sm border-2 border-purple-400 shadow-lg animate-pulse">
              <p className="text-purple-100 text-xs uppercase font-bold tracking-widest mb-1">Solicitação Pendente</p>
              <p className="font-bold">O Gestor solicitou confirmar:</p>
              <p className="text-xl font-black bg-purple-800 rounded px-2 py-1 mt-1 uppercase">{pendingPunch.type.replace('_', ' ')} às {new Date(pendingPunch.timestamp).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })}</p>
            </div>
          )}

          <p className="text-gray-400 text-sm uppercase tracking-widest mb-4">Enquadre seu rosto</p>
          
          <div className="relative w-64 h-80 bg-gray-900 rounded-[120px] overflow-hidden border-4 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
             <video ref={videoRef} autoPlay playsInline muted className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"></video>
             <canvas ref={canvasRef} className="hidden"></canvas>
             
             {/* Efeito de Scanner de Banco */}
             <div className="absolute inset-0 border-[6px] border-black/40 rounded-[120px] pointer-events-none z-10"></div>
          </div>
        </div>

        <button 
          onClick={handleBaterPonto}
          className={`w-full max-w-sm text-white font-bold text-xl py-5 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all mt-4 ${pendingPunch ? 'bg-purple-600 active:bg-purple-700' : 'bg-green-600 active:bg-green-700'}`}
        >
          {pendingPunch ? 'CONFIRMAR PONTO ATRASADO' : 'BATER PONTO AGORA'}
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
