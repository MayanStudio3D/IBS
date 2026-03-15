'use client';

import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Menu, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Package, 
  Users, 
  Plus, 
  ClipboardList,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Loader2,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserRole, type UserRole } from '@/lib/auth-utils';

export default function Dashboard() {
  const [role, setRole] = useState<UserRole>('VENDEDOR');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { name: 'Faturamento Bruto', value: 'R$ 0,00', change: '+12.5%', icon: DollarSign, color: 'text-emerald-400', adminOnly: true },
    { name: 'Clientes Ativos', value: '0', change: '+3', icon: Users, color: 'text-blue-400', adminOnly: false },
    { name: 'Orçamentos Ativos', value: '0', change: '+4%', icon: FileText, color: 'text-amber-400', adminOnly: false },
    { name: 'Alertas de Estoque', value: '0', change: '-2%', icon: AlertTriangle, color: 'text-rose-500', adminOnly: false },
  ]);
  const [atividades, setAtividades] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('Usuário');
  
  // UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userRole = await getUserRole(user.id);
          setRole(userRole);
          
          const { data: perfil } = await supabase.from('ibs_perfis').select('nome_completo, avatar_url').eq('id', user.id).single();
          if (perfil) {
            setNomeUsuario(perfil.nome_completo || 'Usuário');
            setAvatarUrl(perfil.avatar_url || '');
          }

          // Buscar Alertas de Estoque Baixo
          const { data: mats } = await supabase
            .from('ibs_estoque')
            .select('nome, m2_saldo, limite_minimo');
          
          const alertasCount = mats?.filter(m => Number(m.m2_saldo) < Number(m.limite_minimo)).length || 0;
          const estoqueBaixoItens = mats?.filter(m => Number(m.m2_saldo) < Number(m.limite_minimo)) || [];

          // Buscar Faturamento Real
          const { data: faturamentoData } = await supabase
            .from('ibs_pedidos')
            .select('valor_total')
            .in('status', ['PEDIDO', 'APROVADO']);
          
          const totalFaturamento = faturamentoData?.reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;

          // Buscar Clientes
          const { count: clientCount } = await supabase
            .from('ibs_clientes')
            .select('*', { count: 'exact', head: true });
          
          // Buscar Orçamentos
          const { count: orcamentosCount } = await supabase
            .from('ibs_pedidos')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ORCAMENTO');

          setStats([
            { name: 'Faturamento Bruto', value: `R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: '+0%', icon: DollarSign, color: 'text-emerald-400', adminOnly: true },
            { name: 'Clientes Ativos', value: String(clientCount || 0), change: '+0', icon: Users, color: 'text-blue-400', adminOnly: false },
            { name: 'Orçamentos Ativos', value: String(orcamentosCount || 0), change: '+0%', icon: FileText, color: 'text-[#D4AF37]', adminOnly: false },
            { name: 'Alertas de Estoque', value: String(alertasCount), change: '-0%', icon: AlertTriangle, color: 'text-rose-500', adminOnly: false },
          ]);

          // Formatar Atividades Recentes baseadas em estoque baixo
          setAtividades(estoqueBaixoItens.map(item => ({
            titulo: `Estoque Baixo: ${item.nome}`,
            info: `Apenas ${Number(item.m2_saldo).toFixed(3)} $m^2$ restantes`,
            tipo: 'ESTOQUE'
          })).slice(0, 3));
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212]">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-24 font-sans selection:bg-[#D4AF37]/30">
      {/* Header Mobile Style */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#1A1A1A]/95 backdrop-blur-md z-40">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-2 -ml-2 text-gray-400 hover:text-[#D4AF37] transition-colors lg:hidden"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-2xl font-black tracking-tighter text-[#D4AF37] lg:hidden">IBS</h1>
        
        {/* Espaçador na versão desktop para manter a direita */}
        <div className="hidden lg:block flex-1"></div>

        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-gray-400 hover:text-[#D4AF37] transition-colors focus:outline-none"
          >
            <Bell size={24} />
            {stats[3].value !== '0' && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#121212]"></span>}
          </button>

          {/* Dropdown de Notificações */}
          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Bell size={16} className="text-[#D4AF37]" />
                Notificações
              </h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {atividades.length > 0 ? (
                  atividades.map((ativ, i) => (
                    <div key={i} className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                      <p className="text-xs font-bold text-rose-400">{ativ.titulo}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{ativ.info}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">Nenhuma nova notificação</p>
                )}
              </div>
            </div>
          )}

          <Link href="/settings" className="block focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 rounded-full">
            <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/30 hover:border-[#D4AF37] transition-colors overflow-hidden bg-gray-800 shadow-lg cursor-pointer">
              <img 
                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nomeUsuario.replace(/\s+/g, '')}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-72 bg-[#121212] border-r border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h1 className="text-3xl font-black tracking-tighter text-[#D4AF37] uppercase flex items-center gap-3">
                IBS
              </h1>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-500 hover:text-white bg-white/5 rounded-xl">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center space-y-4">
               {/* As opções de navegação já estão na barra inferior, mas podemos colocar atalhos aqui */}
               <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 text-gray-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-2xl transition-colors font-bold uppercase tracking-widest text-xs">
                 <Users size={20} /> Meu Perfil
               </Link>
               <Link href="/orcamento/novo" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 text-gray-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-2xl transition-colors font-bold uppercase tracking-widest text-xs">
                 <Plus size={20} /> Novo Orçamento
               </Link>
               
               <div className="mt-auto pt-8 border-t border-white/5">
                 <button 
                   onClick={async () => {
                     await supabase.auth.signOut();
                     localStorage.clear();
                     window.location.replace('/login');
                   }}
                   className="flex items-center gap-4 p-4 w-full text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-colors font-bold uppercase tracking-widest text-xs"
                 >
                   Sair do Sistema
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <main className="px-6 py-8 space-y-8 max-w-lg mx-auto lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start lg:space-y-0">
        <div className="space-y-8">
          <section className="space-y-1">
            <h2 className="text-3xl font-black text-[#D4AF37] tracking-tighter uppercase italic">Visão Geral do Painel</h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Dados em tempo real da Imperial Barra Stone</p>
          </section>

          <section className="grid grid-cols-1 gap-4">
            {stats.filter(s => !s.adminOnly || role === 'ADMIN').map((stat, i) => (
              <div key={i} className="bg-[#1E1E1E] p-7 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden group">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${stat.color} bg-white/5`}>
                    <stat.icon size={28} />
                  </div>
                  <div className={`flex items-center gap-1 font-bold text-sm ${stat.color}`}>
                    {stat.change}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px]">{stat.name}</p>
                  <p className="text-4xl font-bold text-white tracking-tighter">{stat.value}</p>
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-[#D4AF37]">
              <TrendingUp size={22} className="rotate-45" />
              Ações Rápidas
            </h3>
            <div className="flex flex-col gap-3">
              <Link href="/orcamento/novo" className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all group text-[#D4AF37]">
                <Plus size={24} />
                <span className="font-bold text-lg">Novo Orçamento</span>
              </Link>
              <Link href="/estoque" className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all group text-[#D4AF37]">
                <ClipboardList size={24} />
                <span className="font-bold text-lg">Relatório de Estoque</span>
              </Link>
              <Link href="/clientes" className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all group text-[#D4AF37]">
                <Users size={24} />
                <span className="font-bold text-lg">Gerenciar Clientes</span>
              </Link>
              {role === 'ADMIN' && (
                <Link href="/reports" className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all group text-[#D4AF37]">
                  <BarChart3 size={24} />
                  <span className="font-bold text-lg">Relatórios de Vendas</span>
                </Link>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-[#D4AF37]">Atividade Recente</h3>
            <div className="bg-[#1E1E1E] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
              {atividades.length > 0 ? atividades.map((atv, idx) => (
                <div key={idx} className={`p-6 flex items-center justify-between gap-4 ${idx !== 0 ? 'border-t border-white/5' : ''}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
                      {atv.tipo === 'ESTOQUE' ? <Package size={20} /> : <FileText size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{atv.titulo}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{atv.info}</p>
                    </div>
                  </div>
                  <Link href="/estoque" className="text-[10px] font-black uppercase text-[#D4AF37] border-b border-[#D4AF37]/30 pb-0.5">
                    Ver
                  </Link>
                </div>
              )) : (
                <div className="p-12 text-center">
                  <p className="text-gray-600 font-bold uppercase text-xs tracking-widest text-balance">Nenhuma atividade crítica no momento.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
