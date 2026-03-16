'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Loader2, ShieldCheck, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [sistemaSubtitulo, setSistemaSubtitulo] = useState('');
  const router = useRouter();

  React.useEffect(() => {
    // Carregar cache inicial se houver
    const cachedLogo = localStorage.getItem('ibs_logo_url');
    const cachedSub = localStorage.getItem('ibs_sistema_subtitulo');
    if (cachedLogo) setLogoUrl(cachedLogo);
    if (cachedSub) setSistemaSubtitulo(cachedSub);

    async function fetchConfig() {
      try {
        const { data } = await supabase.from('ibs_configuracoes').select('*').eq('id', 1).single();
        if (data) {
          const newLogo = (data.logo_url || '').replace(':54321', ':55321');
          const newSub = data.sistema_subtitulo || '';
          setLogoUrl(newLogo);
          setSistemaSubtitulo(newSub);
          
          localStorage.setItem('ibs_logo_url', newLogo);
          localStorage.setItem('ibs_sistema_subtitulo', newSub);
        }
      } catch (err) {
        console.error('Erro ao buscar config no registro. Usando cache.');
      }
    }
    fetchConfig();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nome,
          }
        }
      });

      // Se o erro for que o usuário já existe, e for o email do Thiago, 
      // podemos tentar prosseguir para a criação do perfil caso ele não exista.
      const isAdmin = email.toLowerCase() === 'thiagomayan@gmail.com';
      
      if (authError) {
        if (authError.message.includes('User already registered') && isAdmin) {
          // Tentar forçar o login ou apenas avisar que o perfil será recriado se possível
          // Como não temos a senha aqui para signIn, vamos tentar apenas inserir o perfil.
          // O Supabase Auth não retorna o UID do usuário existente por segurança no signUp.
          // Mas podemos tentar buscar o perfil pelo email se tivermos uma função RPC ou trigger.
          // Para simplificar: avisar o usuário para tentar o login e, se falhar, usaremos SQL.
          throw new Error('Este usuário já possui cadastro. Se não consegue logar, entre em contato.');
        }
        throw authError;
      }

      if (authData.user) {
        // 2. Criar perfil na tabela ibs_perfis (O trigger poderia fazer isso, mas faremos manual para garantir)
        const { error: profileError } = await supabase
          .from('ibs_perfis')
          .insert({
            id: authData.user.id,
            nome_completo: nome,
            cargo: isAdmin ? 'ADMIN' : 'VENDEDOR',
            aprovado: isAdmin ? true : false
          });

        if (profileError) throw profileError;

        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
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
          <button 
            onClick={() => window.location.href = '/login'} 
            className="absolute top-8 left-8 p-2 text-gray-500 hover:text-[#D4AF37] transition-colors cursor-pointer z-20"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex flex-col items-center mb-12 relative w-full">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl opacity-40" />
            <img 
              src={logoUrl || "/logo-ibs.png"} 
              alt="Logo" 
              className="w-64 h-64 lg:w-80 lg:h-80 object-contain relative animate-in zoom-in slide-in-from-top-12 duration-1000 ease-out py-6" 
            />
          </div>

          {success ? (
            <div className="text-center space-y-8 py-10 animate-in zoom-in duration-500 w-full">
              <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                <ShieldCheck size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Solicitação Enviada!</h2>
                <p className="text-gray-400 text-sm font-bold leading-relaxed px-6">
                  Sua conta foi criada com sucesso. <br/>
                  <span className="text-[#D4AF37]">Aguarde a aprovação</span> de um administrador.
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/login'}
                className="w-full bg-white/[0.03] border border-white/5 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-white/10 transition-all active:scale-[0.98]"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-7 w-full">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 ml-4 opacity-70">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#D4AF37] transition-all duration-500" size={18} />
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 text-white pl-16 pr-7 py-6 rounded-3xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 focus:bg-white/[0.05] transition-all font-medium placeholder:text-gray-800 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 ml-4 opacity-70">E-mail Corporativo</label>
                <div className="relative group">
                  <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#D4AF37] transition-all duration-500" size={18} />
                  <input
                    type="email"
                    placeholder="usuario@ibstone.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 text-white pl-16 pr-7 py-6 rounded-3xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 focus:bg-white/[0.05] transition-all font-medium placeholder:text-gray-800 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500 ml-4 opacity-70">Senha de Acesso</label>
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
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#121212] font-black py-6 rounded-3xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-[0_15px_40px_-10px_rgba(212,175,55,0.4)] disabled:opacity-50 text-sm lg:text-base tracking-[0.1em] uppercase mt-4 group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <span className="flex-1 text-center pl-6">CRIAR CONTA AGORA</span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform mr-2" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-12 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
            Já possui acesso? <a href="/login" className="text-[#D4AF37] hover:underline cursor-pointer font-black ml-2">Entre aqui</a>
          </p>

          <p className="mt-20 text-center text-[10px] text-gray-500 uppercase tracking-[0.4em] font-bold opacity-80">
            &copy; {new Date().getFullYear()} IMPERIAL BARRA STONE
          </p>
        </div>
      </div>
    </div>
  );
}
