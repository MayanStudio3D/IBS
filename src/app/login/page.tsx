'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Fingerprint, Loader2, ShieldCheck, ChevronRight, AlertCircle, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [sistemaSubtitulo, setSistemaSubtitulo] = useState('');
  const router = useRouter();
  
  useEffect(() => {
    // Carregar cache inicial se houver para evitar tela vazia
    const cachedLogo = localStorage.getItem('ibs_logo_url');
    const cachedSub = localStorage.getItem('ibs_sistema_subtitulo');
    if (cachedLogo) setLogoUrl(cachedLogo);
    if (cachedSub) setSistemaSubtitulo(cachedSub);

    async function fetchConfig() {
      try {
        const { data } = await supabase.from('ibs_configuracoes').select('*').eq('id', 1).single();
        if (data) {
          // Corrigir porta se necessário (caso o banco tenha o valor errado da migração)
          const newLogo = (data.logo_url || '').replace(':54321', ':55321');
          const newSub = data.sistema_subtitulo || '';
          setLogoUrl(newLogo);
          setSistemaSubtitulo(newSub);
          
          // Persistir para quando o banco estiver offline
          localStorage.setItem('ibs_logo_url', newLogo);
          localStorage.setItem('ibs_sistema_subtitulo', newSub);
        }
      } catch (e) {
        console.error('Erro ao buscar config. Usando cache local if exists.');
      }
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    // Verificar se o dispositivo suporta biometria (WebAuthn API)
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      setBiometricAvailable(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError('Acesso negado. Verifique suas credenciais.');
        setLoading(false);
      } else if (user) {
        // Verificar aprovação do ADMIN
        const { data: perfil, error: perfilError } = await supabase
          .from('ibs_perfis')
          .select('aprovado')
          .eq('id', user.id)
          .single();

        // Se for o Thiago, vamos deixar passar mesmo que o perfil falhe momentaneamente
        const isThiago = email.toLowerCase() === 'thiagomayan@gmail.com';

        if (!isThiago && (!perfil || !perfil.aprovado)) {
          console.log('Perfil não aprovado:', perfil, perfilError);
          setError('Conta aguardando aprovação do administrador.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Redirecionar para o dashboard com recarregamento total
        window.location.replace('/dashboard');
      }
    } catch (err) {
      setError('Erro de comunicação com o servidor.');
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    // Simulação de login biométrico para PWA
    // Na prática, usaria WebAuthn ou integração com o app nativo via SecureStore
    alert('Autenticação Biométrica iniciada. (Funcionalidade exclusiva para o App Nativo)');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, informe seu e-mail para recuperar a senha.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError('Erro ao enviar e-mail de recuperação.');
    } else {
      alert('E-mail de recuperação enviado com sucesso!');
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#0a0a0a] p-6 lg:p-12 relative overflow-hidden font-sans">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[70%] h-[70%] bg-[#D4AF37]/5 rounded-full blur-[180px] animate-pulse duration-[10s]" />
      <div className="absolute bottom-[-15%] left-[-5%] w-[60%] h-[60%] bg-white/[0.01] rounded-full blur-[150px]" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />

      <div className="w-full max-w-[500px] relative z-10 animate-in fade-in zoom-in duration-1000">
        <div className="glass border-white/10 p-10 lg:p-14 rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden flex flex-col items-center">
            <div className="flex flex-col items-center mb-8 relative w-full">
               <img 
                src={logoUrl || "/logo-ibs.png"} 
                alt="Logo" 
                className="w-72 h-72 lg:w-[450px] lg:h-[450px] object-contain relative animate-in zoom-in slide-in-from-top-12 duration-1000 ease-out py-4" 
              />
              {sistemaSubtitulo && sistemaSubtitulo !== '' && (
                <h2 className="text-xl lg:text-3xl font-black text-[#D4AF37] tracking-[0.3em] uppercase mt-4 text-center">
                  {sistemaSubtitulo}
                </h2>
              )}
            </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 ml-4 opacity-70">Acesso Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#D4AF37] transition-all duration-500" size={18} />
                <input
                  type="email"
                  placeholder="E-mail profissional"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 text-white pl-16 pr-7 py-6 rounded-3xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 focus:bg-white/[0.05] transition-all font-medium placeholder:text-gray-800 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-4 text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 opacity-70">
                <label>Chave de Segurança</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="hover:text-[#D4AF37] transition-colors lowercase tracking-normal font-bold"
                >
                  esqueci a senha
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#D4AF37] transition-all duration-500" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 text-white pl-16 pr-7 py-6 rounded-3xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 focus:bg-white/[0.05] transition-all font-medium placeholder:text-gray-800 text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-black p-4 rounded-2xl text-center uppercase tracking-widest animate-shake flex items-center justify-center gap-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#121212] font-black py-6 rounded-3xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-[0_15px_40px_-10px_rgba(212,175,55,0.4)] disabled:opacity-50 text-sm lg:text-base tracking-[0.1em] uppercase mt-10 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span className="flex-1 text-center pl-6">AUTENTICAR NO PORTAL</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform mr-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-16 flex flex-col items-center gap-10 w-full animate-in fade-in duration-1000 delay-500">
            <div className="flex items-center gap-10 w-full opacity-60">
              <div className="h-px bg-white/40 flex-1" />
              <span className="text-[12px] text-gray-100 uppercase tracking-[0.4em] font-black text-nowrap px-4">ACESSO RÁPIDO</span>
              <div className="h-px bg-white/40 flex-1" />
            </div>

            <div className="flex items-center justify-center gap-12 w-full">
              {biometricAvailable && (
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  className="group flex flex-col items-center gap-4 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="w-20 h-20 bg-white/[0.05] border border-white/20 rounded-full flex items-center justify-center group-hover:bg-[#D4AF37]/20 group-hover:border-[#D4AF37]/60 transition-all text-gray-400 group-hover:text-[#D4AF37] shadow-xl">
                    <Fingerprint size={36} strokeWidth={1} />
                  </div>
                  <span className="text-[10px] text-gray-300 uppercase tracking-widest font-black group-hover:text-[#D4AF37]">BIOMETRIA</span>
                </button>
              )}

              <a
                href="/register"
                className="group flex flex-col items-center gap-4 transition-all active:scale-95 cursor-pointer"
              >
                <div className="w-20 h-20 bg-white/[0.05] border border-white/20 rounded-full flex items-center justify-center group-hover:bg-[#D4AF37]/20 group-hover:border-[#D4AF37]/60 transition-all text-gray-400 group-hover:text-[#D4AF37] shadow-xl">
                  <UserPlus size={36} strokeWidth={1} />
                </div>
                <span className="text-[10px] text-gray-300 uppercase tracking-widest font-black group-hover:text-[#D4AF37]">CRIAR CONTA</span>
              </a>
            </div>
          </div>
          
          <p className="mt-20 text-center text-[10px] text-gray-500 uppercase tracking-[0.4em] font-bold opacity-80">
            &copy; {new Date().getFullYear()} IMPERIAL BARRA STONE
          </p>
        </div>
      </div>
    </div>
  );
}
