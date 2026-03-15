'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Registro do Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('SW registrado com sucesso:', registration.scope);
        },
        (err) => {
          console.log('SW falhou:', err);
        }
      );
    }

    // Captura o evento de instalação
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    });

    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('IBS Instalado com sucesso!');
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-24 left-6 right-6 lg:left-auto lg:right-12 lg:bottom-12 z-[100] animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] p-[1px] rounded-[2rem] shadow-2xl">
        <div className="bg-[#121212] rounded-[2rem] p-6 flex items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#D4AF37] rounded-xl flex items-center justify-center text-[#121212] shadow-lg shadow-[#D4AF37]/20">
              <Download size={24} />
            </div>
            <div>
              <h4 className="text-white font-black text-sm uppercase tracking-tighter">Instalar IBS Portal</h4>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Acesso rápido e offline</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstall}
              className="bg-[#D4AF37] text-[#121212] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95"
            >
              Instalar
            </button>
            <button 
              onClick={() => setShowBanner(false)}
              className="p-2 text-gray-700 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
