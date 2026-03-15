'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  FileText, 
  Search, 
  Loader2, 
  ArrowRight, 
  DollarSign, 
  Download, 
  CheckCircle,
  Truck,
  X,
  Save,
  Trash2,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUserRole, type UserRole } from '@/lib/auth-utils';
import { generatePDF } from '@/lib/pdf-generator';
import { processarBaixaEstoque, estornarBaixaEstoque } from '@/lib/stock-utils';

export default function OrcamentosPage() {
  const [loading, setLoading] = useState(true);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [role, setRole] = useState<UserRole>('VENDEDOR');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  
  // Form para conversão em pedido
  const [orderForm, setOrderForm] = useState({
    motorista: '',
    placa: '',
    data_carregamento: ''
  });
  
  // Confirmação de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<any>(null);

  const fetchOrcamentos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRole = await getUserRole(user.id);
        setRole(userRole);

        let query = supabase
          .from('ibs_pedidos')
          .select('*, ibs_clientes(nome, cpf_cnpj, endereco), ibs_pedido_itens(*), vendedor:vendedor_id(nome_completo)')
          .is('excluido_em', null)
          .order('criado_em', { ascending: false });

        if (userRole === 'VENDEDOR') {
          query = query.eq('vendedor_id', user.id);
        }

        const { data } = await query;
        if (data) setOrcamentos(data);
      }
    } catch (err) {
      console.error('Erro ao buscar orçamentos:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrcamentos();
  }, []);

  const handleDownloadPDF = async (o: any) => {
    // Buscar configurações da empresa para o PDF
    const { data: config } = await supabase.from('ibs_configuracoes').select('*').eq('id', 1).single();

    generatePDF({
      id: o.id,
      cliente_nome: o.ibs_clientes?.nome,
      cliente_documento: o.ibs_clientes?.cpf_cnpj,
      cliente_endereco: o.ibs_clientes?.endereco,
      vendedor_nome: o.vendedor?.nome_completo || role, 
      data: new Date(o.criado_em).toLocaleDateString('pt-BR'),
      validade: new Date(o.validade_data).toLocaleDateString('pt-BR'),
      items: o.ibs_pedido_itens || [],
      total_m2: o.ibs_pedido_itens?.reduce((acc: number, item: any) => acc + Number(item.m2_total), 0) || 0,
      total_valor: o.valor_total,
      condicao_pgto: o.condicao_pagamento,
      parcelas: o.parcelas || [],
      empresa: {
        logo_url: config?.logo_url,
        subtitulo: config?.sistema_subtitulo,
        cnpj: config?.empresa_cnpj,
        ie: config?.empresa_ie,
        endereco: config?.empresa_endereco,
        telefone: config?.empresa_telefone,
        email: config?.empresa_email,
        empresa_pix: config?.empresa_pix,
        empresa_banco: config?.empresa_banco
      }
    });
  };

  const approveBudget = async (id: string) => {
    const { error } = await supabase
      .from('ibs_pedidos')
      .update({ status: 'APROVADO' })
      .eq('id', id);
    
    if (!error) fetchOrcamentos();
  };

  const revertToOrcamento = async (o: any) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Se estava como pedido contábil, devolvemos o estoque do material
    if (o.status === 'PEDIDO') {
      await estornarBaixaEstoque(o.id);
    }

    const { error } = await supabase
      .from('ibs_pedidos')
      .update({ 
         status: 'ORCAMENTO',
         auditoria: [...(o.auditoria || []), { acao: `Reverteu de ${o.status} para ORCAMENTO`, usuario_id: user?.id, data: new Date().toISOString() }]
      })
      .eq('id', o.id);

    if (!error) {
       fetchOrcamentos();
    }
  };

  const openOrderModal = (o: any) => {
    setSelectedBudget(o);
    setShowOrderModal(true);
  };

  const handleCreateOrder = async () => {
    if (!orderForm.motorista || !orderForm.placa) {
      alert('Preencha os dados logísticos para gerar o pedido.');
      return;
    }

    const { error } = await supabase
      .from('ibs_pedidos')
      .update({
        status: 'PEDIDO',
        motorista_nome: orderForm.motorista,
        placa_veiculo: orderForm.placa,
        data_carregamento: orderForm.data_carregamento
      })
      .eq('id', selectedBudget.id);

    if (!error) {
       // Executar baixa de estoque
       await processarBaixaEstoque(selectedBudget.id);
       
       setShowOrderModal(false);
       fetchOrcamentos();
    }
  };

  const confirmDelete = (orcamento: any) => {
    setBudgetToDelete(orcamento);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!budgetToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (budgetToDelete.status === 'PEDIDO') {
        await estornarBaixaEstoque(budgetToDelete.id);
      }

      const { error } = await supabase
        .from('ibs_pedidos')
        .update({
          status: 'EXCLUIDO',
          status_old: budgetToDelete.status, // Guarda o antigo caso precisemos
          excluido_por: user?.id,
          excluido_em: new Date().toISOString(),
          auditoria: [...(budgetToDelete.auditoria || []), { acao: `Excluiu o registro que estava como ${budgetToDelete.status}`, usuario_id: user?.id, data: new Date().toISOString() }]
        })
        .eq('id', budgetToDelete.id);

      if (error) throw error;

      setDeleteModalOpen(false);
      setBudgetToDelete(null);
      fetchOrcamentos(); // Recarrega a lista sem o orçamento excluído
    } catch (err) {
      console.error('Erro ao excluir orçamento:', err);
    }
  };

  const filteredOrcamentos = orcamentos.filter(o => 
    o.ibs_clientes?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212]">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6 lg:p-12 space-y-12 animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#D4AF37] tracking-tighter uppercase italic">Gestão Comercial</h2>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Orçamentos, Pedidos e Logística IBS</p>
        </div>
        <Link 
          href="/orcamento/novo"
          className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#121212] font-black py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#D4AF37]/20 active:scale-95 text-lg"
        >
          <Plus size={24} />
          Novo Orçamento
        </Link>
      </header>

      {/* Busca */}
      <div className="relative w-full">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input 
          type="text"
          placeholder="Pesquisar orçamento ou pedido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-white/5 rounded-3xl pl-14 pr-6 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all placeholder:text-gray-600 shadow-md"
        />
      </div>

      {/* Grid de Orçamentos */}
      <div className="grid grid-cols-1 gap-6">
        {filteredOrcamentos.map((o) => (
          <div key={o.id} className="bg-[#1A1A1A] p-6 sm:p-8 rounded-[2rem] border border-white/5 hover:border-[#D4AF37]/20 transition-all shadow-xl flex flex-col gap-6">
            <div className="flex items-start gap-4 sm:gap-6 w-full">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-[1.25rem] flex items-center justify-center shadow-inner ${
                o.status === 'ORCAMENTO' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 
                o.status === 'APROVADO' ? 'bg-emerald-500/10 text-emerald-500' : 
                'bg-blue-500/10 text-blue-500'
              }`}>
                {o.status === 'PEDIDO' ? <Truck size={28} /> : <FileText size={28} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-1 border-b border-transparent">
                  <h3 className="font-black text-2xl text-white tracking-tight truncate leading-none pt-1">
                    {o.ibs_clientes?.nome || 'Cliente Indefinido'}
                  </h3>
                  <span className={`self-start sm:self-auto text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shrink-0 ${
                    o.status === 'ORCAMENTO' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 
                    o.status === 'APROVADO' ? 'bg-emerald-500/10 text-emerald-500' : 
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {o.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest bg-[#121212] border border-white/5 px-3 py-1.5 rounded-lg">#{o.id.substring(0, 8).toUpperCase()}</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(o.criado_em).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
               {(role === 'ADMIN' || o.valor_total) && (
                 <p className="text-[1.75rem] font-black text-white tracking-tighter">
                   R$ {Number(o.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </p>
               )}
               
               <div className="flex items-center gap-2">
                 {(o.status === 'ORCAMENTO' || o.status === 'APROVADO' || o.status === 'PEDIDO') && (
                   <div className="flex items-center gap-2">
                     <Link 
                       href={`/orcamento/${o.id}/editar`}
                       className="w-12 h-12 flex items-center justify-center bg-[#121212] border border-white/5 rounded-2xl text-amber-500 hover:bg-amber-500/10 transition-all shadow-md active:scale-95 shrink-0"
                       title="Editar"
                     >
                       <FileText size={20} />
                     </Link>
                     <button
                       onClick={() => confirmDelete(o)}
                       className="w-12 h-12 flex items-center justify-center bg-[#121212] border border-white/5 rounded-2xl text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 transition-all shadow-md active:scale-95 shrink-0"
                       title="Excluir"
                     >
                       <Trash2 size={20} />
                     </button>
                   </div>
                 )}
                 <button 
                   onClick={() => handleDownloadPDF(o)}
                   className="w-12 h-12 flex items-center justify-center bg-[#121212] border border-white/5 rounded-2xl text-gray-400 hover:text-white transition-all shadow-md active:scale-95 shrink-0"
                   title="Baixar PDF"
                 >
                   <Download size={20} />
                 </button>
               </div>
            </div>

            <div className="w-full mt-2 border-t border-white/5 pt-6">
               {o.status === 'ORCAMENTO' && (
                 <button 
                   onClick={() => approveBudget(o.id)}
                   className="w-full flex items-center justify-center gap-2 bg-[#121212] hover:bg-[#1A261E] border border-emerald-500/20 text-emerald-500 h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                 >
                   <CheckCircle size={18} /> Aprovar Orçamento
                 </button>
               )}

               {(o.status === 'APROVADO' || o.status === 'PEDIDO') && (
                 <div className="flex flex-col sm:flex-row items-center gap-3">
                   <button 
                     onClick={() => revertToOrcamento(o)}
                     className="w-full sm:w-auto px-6 flex items-center justify-center gap-2 bg-[#121212] hover:bg-[#2A2315] border border-amber-500/20 text-amber-500 h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                     title="Reverter status para Orçamento"
                   >
                     <RotateCcw size={18} /> Reverter
                   </button>
                   {o.status === 'APROVADO' && (
                     <button 
                       onClick={() => openOrderModal(o)}
                       className="w-full flex-1 flex items-center justify-center gap-2 bg-[#121212] hover:bg-[#151D2A] border border-blue-500/20 text-blue-500 h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                     >
                       <Truck size={18} /> Gerar Pedido Logístico
                     </button>
                   )}
                 </div>
               )}
            </div>

            {/* Se for pedido, mostrar dados logísticos */}
            {o.status === 'PEDIDO' && (
              <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-[8px] uppercase font-black text-gray-600 tracking-[0.2em] mb-1">Motorista</p>
                  <p className="text-white font-bold">{o.motorista_nome || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase font-black text-gray-600 tracking-[0.2em] mb-1">Placa</p>
                  <p className="text-white font-bold uppercase">{o.placa_veiculo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase font-black text-gray-600 tracking-[0.2em] mb-1">Carregamento</p>
                  <p className="text-white font-bold">{o.data_carregamento ? new Date(o.data_carregamento).toLocaleDateString('pt-BR') : 'A definir'}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL PARA GERAR PEDIDO */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#121212]/90 backdrop-blur-md">
          <div className="bg-[#1E1E1E] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[#D4AF37] tracking-tighter">DADOS LOGÍSTICOS</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2 text-center block">Nome do Motorista</label>
                <input
                  type="text"
                  value={orderForm.motorista}
                  onChange={(e) => setOrderForm({ ...orderForm, motorista: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#D4AF37]/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2 text-center block">Placa do Caminhão</label>
                <input
                  type="text"
                  value={orderForm.placa}
                  onChange={(e) => setOrderForm({ ...orderForm, placa: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#D4AF37]/30 uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2 text-center block">Data de Carregamento</label>
                <input
                  type="date"
                  value={orderForm.data_carregamento}
                  onChange={(e) => setOrderForm({ ...orderForm, data_carregamento: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#D4AF37]/30"
                />
              </div>

              <button 
                onClick={handleCreateOrder}
                className="w-full bg-[#D4AF37] text-[#121212] py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
              >
                <Save size={20} /> Finalizar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deleteModalOpen && budgetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl w-full max-w-sm p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none" />
            
            <div className="flex items-center gap-4 text-rose-500">
              <div className="w-12 h-12 rounded-full border border-rose-500/20 flex items-center justify-center bg-[#121212]">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Apagar Registro?</h3>
                <p className="text-[10px] text-rose-500/80 uppercase tracking-widest font-bold">Ação irreversível</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              Tem certeza que deseja apagar o registro de <span className="font-bold text-white">{budgetToDelete.ibs_clientes?.nome}</span>? 
            </p>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 bg-[#121212] text-gray-400 border border-white/5 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)] py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
