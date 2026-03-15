'use client';

import React, { useEffect, useState } from 'react';
import { Home, FileText, Package, Settings, LogOut, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserRole, type UserRole } from '@/lib/auth-utils';

const navItems = [
  { name: 'Início', href: '/dashboard', icon: Home, adminOnly: false },
  { name: 'Orçamentos', href: '/orcamento', icon: FileText, adminOnly: false },
  { name: 'Estoque', href: '/estoque', icon: Package, adminOnly: true },
  { name: 'Clientes', href: '/clientes', icon: Users, adminOnly: false },
  { name: 'Relatórios', href: '/reports', icon: BarChart3, adminOnly: true },
  { name: 'Ajustes', href: '/settings', icon: Settings, adminOnly: false },
];

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('VENDEDOR');
  const [nome, setNome] = useState('Usuário');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('ibs_logo_url') || '' : ''));
  const [sistemaSubtitulo, setSistemaSubtitulo] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('ibs_sistema_subtitulo') || '' : ''));
  const [sistemaCorSubtitulo, setSistemaCorSubtitulo] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('ibs_sistema_cor_subtitulo') || '#6b7280' : '#6b7280'));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function fetchRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: perfil } = await supabase
            .from('ibs_perfis')
            .select('cargo, nome_completo, avatar_url')
            .eq('id', user.id)
            .single();
          
          if (perfil) {
            setRole(perfil.cargo as UserRole);
            setNome(perfil.nome_completo || 'Thiago');
            if (perfil.avatar_url) setAvatarUrl(perfil.avatar_url);
          }

          const { data: config } = await supabase
             .from('ibs_configuracoes')
             .select('*')
             .eq('id', 1)
             .single();
          if (config) {
             const newLogo = config.logo_url || '';
             const newSub = config.sistema_subtitulo || '';
             const newColor = config.sistema_cor_subtitulo || '#6b7280';
             
             setLogoUrl(newLogo);
             setSistemaSubtitulo(newSub);
             setSistemaCorSubtitulo(newColor);

             localStorage.setItem('ibs_logo_url', newLogo);
             localStorage.setItem('ibs_sistema_subtitulo', newSub);
             localStorage.setItem('ibs_sistema_cor_subtitulo', newColor);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
      }
      setReady(true);
    }
    fetchRole();
  }, []);

  const handleLogout = async () => {
    try {
      // 1. Sign out do Supabase (limpa cookies e session)
      await supabase.auth.signOut();
      
      // 2. Limpar qualquer resquício no localStorage (para garantir)
      localStorage.clear();
      
      // 3. Forçar redirecionamento via reload para limpar cache do Next.js
      window.location.replace('/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
      window.location.replace('/login');
    }
  };

  if (!ready || pathname === '/' || pathname === '/login' || pathname === '/register') return null;

  const filteredItems = navItems.filter(item => !item.adminOnly || role === 'ADMIN');

  return (
    <>
      {/* Desktop Sidebar - Premium Style */}
      <aside className="hidden lg:flex flex-col w-72 h-screen bg-[#121212] text-white fixed left-0 top-0 border-r border-white/5 shadow-2xl z-50">
        <div className="p-8 flex flex-col justify-center min-h-[140px] items-center text-center gap-1">
            <img 
              src={logoUrl || "/logo-ibs.png"} 
              alt="Logo" 
              className="max-w-full h-auto max-h-32 object-contain" 
            />
          {sistemaSubtitulo && sistemaSubtitulo !== '' && (
            <p 
              className="text-xs uppercase tracking-[0.2em] font-bold w-full" 
              title={sistemaSubtitulo}
              style={{ color: sistemaCorSubtitulo }}
            >
              {sistemaSubtitulo}
            </p>
          )}
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] shadow-lg shadow-[#D4AF37]/5' 
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Icon size={22} className={isActive ? 'text-[#D4AF37]' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-8 border-t border-white/5 space-y-6">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] p-0.5 shadow-lg shadow-[#D4AF37]/20 flex-shrink-0 order-last lg:order-first">
               <div className="w-full h-full rounded-2xl bg-[#121212] flex items-center justify-center">
                 <img 
                   src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nome.replace(/\s+/g, '')}`} 
                   alt="Profile" 
                   className="w-full h-full object-cover rounded-2xl opacity-90"
                 />
               </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black text-white truncate">{nome}</span>
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-black opacity-80">
                {role === 'ADMIN' ? 'ADMIN' : role}
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-5 py-4 w-full rounded-2xl text-rose-500 hover:bg-rose-500/5 transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-rose-500/10"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tabs - Matching THEME */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-2xl border-t border-white/5 px-8 pt-4 pb-8 flex justify-between items-center z-50 rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
        {filteredItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-2 transition-all ${
                isActive ? 'text-[#D4AF37] scale-110' : 'text-gray-600'
              }`}
            >
              <div className={isActive ? 'p-2 bg-[#D4AF37]/10 rounded-xl' : ''}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
            </Link>
          );
        })}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-2 text-rose-700/80 active:scale-95 transition-transform"
        >
          <div className="p-2">
            <LogOut size={24} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Sair</span>
        </button>
      </nav>
    </>
  );
};
