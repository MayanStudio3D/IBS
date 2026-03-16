'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  Package, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  PlusCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserRole, type UserRole } from '@/lib/auth-utils';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('VENDEDOR');
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({
    totalOrcamentos: 0,
    totalClientes: 0,
    totalEstoque: 0,
    itensCriticos: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [criticalStock, setCriticalStock] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userRole = await getUserRole(user.id);
          setRole(userRole);
          setUserName(user.user_metadata?.full_name || 'Usuário');

          // 1. Stats
          const { count: orcamentosCount } = await supabase
            .from('ibs_pedidos')
            .select('*', { count: 'exact', head: true })
            .is('excluido_em', null);

          const { count: clientesCount } = await supabase
            .from('ibs_clientes')
            .select('*', { count: 'exact', head: true });

          const { count: estoqueCount } = await supabase
            .from('ibs_estoque')
            .select('*', { count: 'exact', head: true });

          setStats({
            totalOrcamentos: orcamentosCount || 0,
            totalClientes: clientesCount || 0,
            totalEstoque: estoqueCount || 0,
            itensCriticos: 0 // Será atualizado abaixo
          });

          // 2. Recent Orders
          const { data: orders } = await supabase
            .from('ibs_pedidos')
            .select('*, ibs_clientes(nome)')
            .is('excluido_em', null)
            .order('criado_em', { ascending: false })
            .limit(5);

          if (orders) setRecentOrders(orders);

          // 3. Critical Stock
          const { data: allStock } = await supabase.from('ibs_estoque').select('*');
          if (allStock) {
            const filtered = allStock.filter(m => Number(m.m2_saldo) < Number(m.limite_minimo));
            setCriticalStock(filtered);
            setStats(prev => ({ ...prev, itensCriticos: filtered.length }));
          }
        }
      } catch (err) {
        console.error('Erro no dashboard:', err);
      }
      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Olá, <span className="text-[#D4AF37]">{userName}</span>
          </h1>
          <p className="text-gray-500 font-medium">Bem-vindo(a) ao painel de controle Imperial.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/orcamento/novo" className="flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-2xl font-bold uppercase text-xs hover:brightness-110 transition-all shadow-lg shadow-[#D4AF37]/20">
            <PlusCircle size={18} /> Novo Orçamento
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<FileText className="text-[#D4AF37]" />} 
          label="Orçamentos" 
          value={stats.totalOrcamentos} 
          sub="Total cadastrado"
        />
        <StatCard 
          icon={<Users className="text-blue-500" />} 
          label="Clientes" 
          value={stats.totalClientes} 
          sub="Base de dados"
        />
        <StatCard 
          icon={<Package className="text-emerald-500" />} 
          label="Itens Estoque" 
          value={stats.totalEstoque} 
          sub="Disponível"
        />
        <StatCard 
          icon={<AlertTriangle className="text-rose-500" />} 
          label="Estoque Crítico" 
          value={stats.itensCriticos} 
          sub="Itens p/ reposição"
          isCritical={stats.itensCriticos > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Clock size={20} className="text-[#D4AF37]" /> Últimos Orçamentos
            </h3>
            <Link href="/orcamento" className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest hover:underline">
              Ver todos
            </Link>
          </div>

          <div className="space-y-4">
            {recentOrders.length > 0 ? recentOrders.map((order) => (
              <Link 
                key={order.id} 
                href={`/orcamento/${order.id}/editar`}
                className="group flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] hover:border-[#D4AF37]/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="w-24 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center text-[#D4AF37] font-black text-[10px] shrink-0 border border-[#D4AF37]/20 shadow-inner">
                    #{order.id.toString().substring(0, 8).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-white uppercase text-xs tracking-tight">{order.ibs_clientes?.nome || 'Cliente não identificado'}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {new Date(order.criado_em).toLocaleDateString('pt-BR')} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.valor_total || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    order.status === 'APROVADO' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  }`}>
                    {order.status || 'Orçamento'}
                  </span>
                  <ChevronRight size={16} className="text-gray-700 group-hover:text-white transition-colors" />
                </div>
              </Link>
            )) : (
              <p className="text-center py-10 text-gray-600 font-medium">Nenhum orçamento encontrado.</p>
            )}
          </div>
        </div>

        {/* Shortcuts / Quick Actions */}
        <div className="space-y-8">
          <div className="bg-[#1A1A1A] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8">Acesso Rápido</h3>
            <div className="grid grid-cols-2 gap-4">
              <QuickLink href="/clientes/novo" icon={<Users size={20} />} label="Add Cliente" />
              <QuickLink href="/estoque/novo" icon={<Package size={20} />} label="Add Estoque" />
              <QuickLink href="/reports" icon={<TrendingUp size={20} />} label="Relatórios" />
              <QuickLink href="/settings" icon={<Clock size={20} />} label="Ajustes" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-[2.5rem] p-8 shadow-2xl shadow-[#D4AF37]/10">
            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Suporte Imperial</h3>
            <p className="text-black/70 text-xs font-bold mb-6">Precisa de ajuda com o sistema ou dúvidas técnicas?</p>
            <button className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-neutral-900 transition-all">
              Abrir Chamado
            </button>
          </div>

          {/* Critical Stock Alerts */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-2">
              <AlertTriangle size={20} className="text-rose-500" /> Alerta de Estoque
            </h3>
            <div className="space-y-4">
              {criticalStock.length > 0 ? criticalStock.map((item) => (
                <Link 
                  key={item.id} 
                  href="/estoque"
                  className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex justify-between items-center group hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                >
                  <div>
                    <p className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">{item.nome}</p>
                    <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">Reposição Necessária</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-rose-500">{Number(item.m2_saldo).toFixed(2)} m²</p>
                    <p className="text-[8px] text-gray-500 uppercase">Mín: {item.limite_minimo} m²</p>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-6">
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Tudo em conformidade</p>
                  <p className="text-gray-600 text-[8px] font-bold uppercase mt-1">Estoque atualizado</p>
                </div>
              )}
              <Link href="/estoque" className="block w-full text-center py-3 bg-white/5 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all mt-4">
                Gerenciar Estoque
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, isCritical }: { icon: any, label: string, value: any, sub: string, isCritical?: boolean }) {
  return (
    <div className={`bg-[#1A1A1A] border p-8 rounded-[2.5rem] shadow-2xl group transition-all ${isCritical ? 'border-rose-500/30' : 'border-white/5 hover:border-[#D4AF37]/20'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform ${isCritical ? 'bg-rose-500/10' : 'bg-white/[0.03]'}`}>
          {icon}
        </div>
        <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full w-2/3 ${isCritical ? 'bg-rose-500' : 'bg-[#D4AF37]'}`} />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{label}</h3>
        <p className={`text-3xl font-black ${isCritical ? 'text-rose-500' : 'text-white'}`}>{value}</p>
        <p className="text-[10px] text-gray-700 font-bold uppercase tracking-tight">{sub}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-[#D4AF37] hover:text-black transition-all group gap-3 text-center">
      <div className="text-gray-500 group-hover:text-black transition-colors">{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">{label}</span>
    </Link>
  );
}
