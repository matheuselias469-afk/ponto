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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    if (isSubmitting) return; // Evita duplo clique
    setIsSubmitting(true);
    
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
        setIsSubmitting(false);
      }
    } catch (e) {
      alert("Erro de conexão ao salvar ponto.");
      setIsSubmitting(false);
    }
  };

  if (successPunch) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0d394e] to-[#041620] flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#cca158]/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="animate-fade-in-up flex flex-col items-center relative z-10 w-full max-w-md">
          <div className="w-28 h-28 bg-gradient-to-br from-[#cca158] to-[#99763d] rounded-full flex items-center justify-center text-6xl mb-8 shadow-[0_0_50px_rgba(204,161,88,0.4)] border-4 border-white/10">
            <span className="drop-shadow-md">✓</span>
          </div>
          
          <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">Ponto Registrado</h1>
          <p className="text-[#cca158] text-lg mb-10 font-medium tracking-wide">
            {successPunch.type.replace('_', ' ')}
          </p>
          
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] w-full border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#cca158] to-transparent opacity-50"></div>
            <p className="text-sm text-white/50 uppercase tracking-[0.2em] mb-2 font-bold">Horário Oficial</p>
            <p className="text-5xl font-light font-mono text-white drop-shadow-md">
              {new Date(successPunch.timestamp).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })}
            </p>
          </div>

          <button 
            onClick={() => router.push('/')}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-lg py-5 rounded-2xl shadow-xl active:scale-95 transition-all duration-300 mt-12 backdrop-blur-sm"
          >
            FECHAR TELA
          </button>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />
      </main>
    );
  }

  if (step === 1) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0d394e] to-[#041620] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-[#cca158]/5 rounded-full blur-3xl pointer-events-none"></div>

        <form onSubmit={handlePinSubmit} className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-8 flex flex-col items-center animate-fade-in-up relative z-10">
          
          <div className="w-16 h-16 bg-[#cca158]/10 rounded-full flex items-center justify-center mb-6 border border-[#cca158]/30">
            <span className="text-2xl">🔒</span>
          </div>
          
          <h2 className="text-xl font-medium text-white mb-2 tracking-wide">Digite seu PIN</h2>
          <p className="text-[#cca158] text-sm mb-8 text-center opacity-80">Senha de 4 dígitos cadastrada</p>
          
          <input 
            type="password" 
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="text-center text-5xl tracking-[0.5em] p-4 bg-black/20 border-b-2 border-white/20 w-full mb-10 focus:border-[#cca158] focus:outline-none text-white font-light transition-colors placeholder-white/10"
            autoFocus
            placeholder="••••"
          />
          
          <button 
            type="submit" 
            disabled={pin.length !== 4 || loadingPin} 
            className="w-full bg-gradient-to-r from-[#cca158] to-[#aa8343] text-[#0d394e] font-black text-lg py-4 rounded-xl disabled:opacity-50 disabled:grayscale transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_8px_20px_rgb(204,161,88,0.3)] flex justify-center items-center gap-2"
          >
            {loadingPin ? 'VERIFICANDO...' : 'ENTRAR'}
          </button>
        </form>

        <button onClick={() => router.push('/')} className="mt-8 text-white/50 hover:text-white text-sm transition-colors relative z-10 flex items-center gap-2">
          <span>←</span> Voltar
        </button>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0d394e] to-[#041620] text-white flex flex-col p-4 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[120%] h-[120%] bg-[#cca158]/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6 relative z-10 animate-fade-in-up">
        
        {/* Voltar e Logo Reduzida no Topo */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
           <button onClick={() => setStep(1)} className="text-white/60 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-md">
             ←
           </button>
           <img src="/decor-logo.png" alt="Decor" className="w-10 h-10 object-contain opacity-80" />
        </div>

        {locError && (
          <div className="bg-red-500/20 text-red-200 p-4 rounded-2xl text-center w-full max-w-sm border border-red-500/50 backdrop-blur-sm text-sm">
            {locError}
          </div>
        )}

        <div className="text-5xl font-black tracking-tighter text-[#cca158] drop-shadow-[0_0_15px_rgba(204,161,88,0.3)] mt-8">
          {new Date().toLocaleTimeString('pt-BR', {timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit'})}
        </div>

        <div className="text-center w-full flex flex-col items-center">
          {pendingPunch && (
            <div className="bg-gradient-to-r from-purple-900/80 to-purple-800/80 p-5 rounded-2xl mb-6 w-full max-w-sm border border-purple-500/50 shadow-xl backdrop-blur-md animate-pulse">
              <p className="text-purple-200 text-xs uppercase font-bold tracking-widest mb-1 flex items-center justify-center gap-2"><span>⚠️</span> Confirmação Requerida</p>
              <p className="font-medium text-sm text-purple-50">O Gestor solicitou o registro retroativo de:</p>
              <p className="text-2xl font-black text-white mt-1 uppercase tracking-wide">{pendingPunch.type.replace('_', ' ')} <span className="text-purple-300 opacity-80">às</span> {new Date(pendingPunch.timestamp).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })}</p>
            </div>
          )}

          <p className="text-[#cca158] text-xs uppercase tracking-[0.2em] mb-4 font-bold">Enquadre seu Rosto</p>
          
          <div className="relative w-full aspect-[9/16] max-h-[55vh] bg-black rounded-[2.5rem] overflow-hidden border-2 border-[#cca158]/50 shadow-[0_0_40px_rgba(204,161,88,0.15)] ring-4 ring-black/20">
             <video ref={videoRef} autoPlay playsInline muted className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"></video>
             <canvas ref={canvasRef} className="hidden"></canvas>
             
             {/* Overlay escuro com furo oval */}
             <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 50%, transparent 40%, rgba(13,57,78,0.85) 100%)' }}></div>
             
             {/* Guia Oval Tracejada Dourada */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[65%] h-[55%] border-[3px] border-dashed border-[#cca158] rounded-[120px] opacity-60 pointer-events-none z-20 shadow-[0_0_15px_rgba(204,161,88,0.5)]"></div>
             
             {/* Scanner line animado */}
             <div className="absolute top-1/4 left-1/4 right-1/4 h-[2px] bg-[#cca158] shadow-[0_0_10px_#cca158] z-30 opacity-50 scanner-animation"></div>
          </div>
        </div>

        <button 
          onClick={handleBaterPonto}
          disabled={isSubmitting}
          className={`w-full max-w-sm text-[#0d394e] font-black text-xl py-5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all duration-300 mt-4 
            ${pendingPunch 
              ? 'bg-gradient-to-r from-purple-400 to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
              : 'bg-gradient-to-r from-[#cca158] to-[#aa8343] hover:shadow-[0_0_25px_rgba(204,161,88,0.4)]'} 
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? 'ENVIANDO FOTO...' : (pendingPunch ? 'CONFIRMAR PONTO' : 'BATER PONTO')}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 25%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 75%; opacity: 0; }
        }
        .scanner-animation {
          animation: scan 3s infinite linear;
        }
      `}} />
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
