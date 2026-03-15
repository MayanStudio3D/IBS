'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  UserPlus,
  Loader2,
  Calendar,
  DollarSign,
  Calculator,
  CreditCard,
  Clock,
  Users,
  ChevronDown,
  Eye,
  X
} from 'lucide-react';
import { maskCPFCNPJ } from '@/lib/masks';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Item {
  id: string;
  descricao: string;
  vol: number; // Quantidade/Volume
  comp: number; // Comprimento
  alt: number; // Altura
  preco_unitario: number;
}

interface Parcela {
  vencimento: string;
  valor: number;
}

const MaterialSelect = ({ 
  item, 
  materiais, 
  onChange 
}: { 
  item: any, 
  materiais: any[], 
  onChange: (val: string, material: any) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedMat = materiais.find(m => m.nome === item.descricao);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1A1A1A] border border-[#1A1A1A] rounded-xl p-[5px] pr-3 flex items-center gap-3 cursor-pointer focus-within:border-[#D4AF37]/30 transition-all shadow-inner h-[52px]"
      >
        <div className="w-[4.5rem] h-full rounded-xl overflow-hidden shrink-0 shadow-sm border border-white/5 bg-[#121212] flex items-center justify-center">
          {selectedMat?.foto_url ? (
            <img src={selectedMat.foto_url} className="w-full h-full object-cover" alt="preview" />
          ) : (
            <span className="text-[8px] font-black uppercase text-gray-700 tracking-[0.2em] leading-tight text-center">SEM<br/>FOTO</span>
          )}
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-[14px] md:text-sm font-black text-white leading-tight break-words pr-2">
            {selectedMat ? selectedMat.nome : 'Selecione o Material'}
          </p>
        </div>
        <div className="text-gray-600 shrink-0">
          <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full md:w-[350px] lg:w-[400px] z-50 bg-[#1A1A1A] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[350px] flex flex-col p-2 space-y-1 animate-in zoom-in-95 duration-200">
           <div className="sticky top-0 bg-[#1A1A1A] z-10 px-2 pb-2 mb-1 border-b border-white/5 pt-2 flex items-center justify-center">
             <span className="text-[9px] uppercase tracking-widest font-black text-gray-500">Materiais (Estoque)</span>
           </div>
           
           <div className="overflow-y-auto space-y-1 pr-1 pb-2">
             <div 
               onClick={() => { onChange('', null); setIsOpen(false); }}
               className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:bg-white/5 border border-transparent hover:border-white/5 ${!item.descricao ? 'bg-white/5 border-white/10' : ''}`}
             >
                <div className="flex-1 text-center">
                  <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Limpar Seleção</p>
                </div>
             </div>

             {materiais.map(m => (
               <div 
                 key={m.id}
                 onClick={() => { onChange(m.nome, m); setIsOpen(false); }}
                 className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all group hover:bg-[#D4AF37]/5 border border-transparent hover:border-[#D4AF37]/20 ${item.descricao === m.nome ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' : ''}`}
               >
                 <div className="w-[6.5rem] h-[4rem] rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 bg-[#121212] flex items-center justify-center">
                   {m.foto_url ? (
                     <img src={m.foto_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={m.nome} />
                   ) : (
                     <span className="text-[8px] font-black uppercase text-gray-700 tracking-[0.2em] leading-tight text-center">SEM<br/>FOTO</span>
                   )}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className={`text-[15px] font-black truncate tracking-tight transition-colors ${item.descricao === m.nome ? 'text-[#D4AF37]' : 'text-gray-200 group-hover:text-white'}`}>{m.nome}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">R$ {Number(m.valor_unitario).toFixed(2)} / m²</p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default function NovoOrcamentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [items, setItems] = useState<Item[]>([
    { id: Math.random().toString(), descricao: '', vol: 1, comp: 1, alt: 1, preco_unitario: 0 }
  ]);
  const [condicaoPgto, setCondicaoPgto] = useState<'A VISTA' | 'PARCELADO'>('A VISTA');
  const [qtdParcelas, setQtdParcelas] = useState<number>(3);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [validade, setValidade] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [areaInputs, setAreaInputs] = useState<{[key: string]: string}>({});
  const [showPreview, setShowPreview] = useState(false);
  const [empresaConfig, setEmpresaConfig] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      // Clientes
      const { data: cliData } = await supabase.from('ibs_clientes').select('id, nome, cpf_cnpj, endereco').order('nome');
      if (cliData) setClientes(cliData);
      
      // Materiais (Estoque)
      const { data: matData } = await supabase.from('ibs_estoque').select('id, nome, valor_unitario, foto_url').order('nome');
      if (matData) setMateriais(matData);

      // Configurações da Empresa
      const { data: config } = await supabase.from('ibs_configuracoes').select('*').eq('id', 1).single();
      if (config) setEmpresaConfig(config);
    }
    loadData();
    
    // Set default validity (today + 3 days)
    const date = new Date();
    date.setDate(date.getDate() + 3);
    setValidade(date.toISOString().split('T')[0]);
  }, []);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), descricao: '', vol: 1, comp: 1, alt: 1, preco_unitario: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof Item, value: any) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const parseNum = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(String(val).replace(',', '.')) || 0;
  };

  // Cálculos $M^2$ e Totais
  const calculateM2 = (item: Item) => parseNum(item.vol) * parseNum(item.comp) * parseNum(item.alt);
  const calculateItemTotal = (item: Item) => calculateM2(item) * parseNum(item.preco_unitario);

  const totalM2 = items.reduce((acc, item) => acc + calculateM2(item), 0);
  const totalValor = items.reduce((acc, item) => acc + calculateItemTotal(item), 0);

  // Atualizar parcelas automaticamente quando o total ou a condição ou a qtde parcelas muda
  useEffect(() => {
    if (condicaoPgto === 'PARCELADO') {
      const valorParcela = totalValor / qtdParcelas;
      const novasParcelas: Parcela[] = Array.from({ length: qtdParcelas }).map((_, index) => {
        const days = (index + 1) * 30;
        const d = new Date();
        d.setDate(d.getDate() + days);
        return {
          vencimento: d.toISOString().split('T')[0],
          valor: parseFloat(valorParcela.toFixed(2))
        };
      });
      setParcelas(novasParcelas);
    } else {
      setParcelas([]);
    }
  }, [totalValor, condicaoPgto, qtdParcelas]);

  const handleSave = async () => {
    if (!selectedCliente) {
      setError('Selecione um cliente para continuar.');
      return;
    }

    if (items.some(i => !i.descricao || i.preco_unitario <= 0)) {
      setError('Verifique os itens: descrição e preço são obrigatórios.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Criar o orçamento
      const { data: pedido, error: pedidoErr } = await supabase
        .from('ibs_pedidos')
        .insert({
          cliente_id: selectedCliente,
          valor_total: totalValor,
          status: 'ORCAMENTO',
          vendedor_id: user?.id,
          validade_data: validade,
          condicao_pagamento: condicaoPgto,
          parcelas: parcelas
        })
        .select()
        .single();

      if (pedidoErr) throw pedidoErr;

      // 2. Criar os itens com lógica M2
      const itemsToInsert = items.map(item => ({
        pedido_id: pedido.id,
        descricao: item.descricao,
        quantidade: calculateM2(item), // A quantidade medida cobrada ($M^2$)
        volume: parseNum(item.vol),    // O volume em peças
        comprimento: parseNum(item.comp),
        altura: parseNum(item.alt),
        m2_total: calculateM2(item),
        preco_unitario: parseNum(item.preco_unitario)
      }));

      const { error: itemsErr } = await supabase
        .from('ibs_pedido_itens')
        .insert(itemsToInsert);

      if (itemsErr) throw itemsErr;

      router.push('/orcamento');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar orçamento.');
      setLoading(false);
    }
  };

  const PreviewModal = () => {
    if (!showPreview) return null;
    const cliente = clientes.find((c: any) => c.id === selectedCliente);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-[#1A1A1A] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col">
          <header className="p-6 border-b border-white/5 flex items-center justify-between bg-[#121212]">
            <div className="flex items-center gap-3">
              <Eye className="text-[#D4AF37]" size={24} />
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Pré-visualização</h3>
            </div>
            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors">
              <X size={24} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white text-black font-sans">
            {/* CABEÇALHO PREVIEW - ESTILO INK-SAVING */}
            <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 text-black">
              <div className="space-y-1">
                <h1 className="text-2xl font-black leading-tight uppercase tracking-tighter italic">
                  {empresaConfig?.sistema_subtitulo || 'Imperial Barra Stone'}
                </h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Marmoraria de Luxo</p>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                   <p className="text-sm font-bold">Orçamento #PREVIEW</p>
                   <p className="text-xs text-gray-500">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                {empresaConfig?.empresa_pix ? (
                  <div className="w-20 h-20 bg-white rounded border border-gray-200 p-1 flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(empresaConfig.empresa_pix)}`}
                      alt="PIX QR"
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                    <p className="text-[8px] text-gray-400 font-black uppercase text-center">QR-CODE<br/>PIX</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-sm text-black">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1 text-left">Cliente</p>
                <p className="font-bold text-lg text-left">{cliente?.nome || 'Não selecionado'}</p>
                {cliente?.cpf_cnpj && (
                   <p className="text-[10px] text-gray-500 font-mono mt-1 text-left">{maskCPFCNPJ(cliente.cpf_cnpj)}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Validade</p>
                <p className="font-bold">{validade ? new Date(validade).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</p>
                <div className="mt-4">
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Forma de Pagamento</p>
                  <p className="font-bold uppercase italic">{condicaoPgto}</p>
                </div>
              </div>
            </div>

            <table className="w-full text-left border rounded-xl overflow-hidden shadow-sm border-gray-100">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] uppercase font-black text-gray-400">Material / Descrição</th>
                  <th className="px-4 py-3 text-[10px] uppercase font-black text-gray-400 text-center">Área (m²)</th>
                  <th className="px-4 py-3 text-[10px] uppercase font-black text-gray-400 text-right">Preço Unit.</th>
                  <th className="px-4 py-3 text-[10px] uppercase font-black text-gray-400 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-black">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4 font-bold text-sm uppercase">{item.descricao}</td>
                    <td className="px-4 py-4 text-center text-sm">{calculateM2(item).toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-sm">R$ {parseNum(item.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-4 text-right text-sm font-black">R$ {calculateItemTotal(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col gap-4 pt-6 mt-4 border-t border-gray-100">
               <div className="flex justify-between items-end text-black">
                  <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                    <p className="text-[10px] uppercase font-black text-gray-400 text-left">Dados Bancários / PIX</p>
                    <p className="text-xs font-bold text-left">{empresaConfig?.empresa_banco || 'Configure nas preferências'}</p>
                    <p className="text-[10px] font-mono text-gray-500 text-left">Chave: {empresaConfig?.empresa_pix || '-'}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] uppercase font-black text-[#D4AF37] mb-1">Total a Pagar</p>
                     <p className="text-4xl font-black">R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
               </div>
            </div>
          </div>

          <footer className="p-6 bg-[#121212] flex gap-4">
             <button onClick={() => setShowPreview(false)} className="flex-1 py-4 border border-white/10 rounded-xl text-gray-400 font-black uppercase text-[10px]">Voltar</button>
             <button onClick={() => { setShowPreview(false); handleSave(); }} className="flex-[2] py-4 bg-[#D4AF37] text-black rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-3">
                <Save size={18} /> Confirmar e Salvar
             </button>
          </footer>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-700 pb-24">
      <PreviewModal />
      
      {/* HEADER DINÂMICO - ESTILO DESKTOP */}
      <header className="bg-[#1A1A1A] p-6 rounded-3xl border border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-5">
          <Link href="/orcamento" className="p-3 bg-[#121212] rounded-2xl text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all border border-white/5">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Novo Orçamento</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Modo de Edição Ativo</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
             onClick={() => setShowPreview(true)}
             className="px-6 h-12 bg-white/5 text-gray-400 rounded-xl font-black uppercase text-[10px] tracking-widest border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center gap-3"
          >
            <Eye size={16} /> Visualizar
          </button>
          <button 
             onClick={handleSave}
             disabled={loading}
             className="px-8 h-12 bg-[#D4AF37] text-black rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#D4AF37]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar Registro
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* COLUNA PRINCIPAL - DADOS E ITENS */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* GRID DE INFORMAÇÕES SUPERIORES */}
          <section className="bg-[#1A1A1A] p-6 rounded-3xl border border-white/5 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2 flex items-center gap-2">
                <Users size={14} className="text-[#D4AF37]" /> Cliente
              </label>
              <div className="relative group">
                <select
                  value={selectedCliente}
                  onChange={(e) => setSelectedCliente(e.target.value)}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl px-5 py-6 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 transition-all appearance-none cursor-pointer h-[64px]"
                >
                  <option value="">Selecione o comprador...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2 flex items-center gap-2">
                <Calendar size={14} className="text-[#D4AF37]" /> Data Emissão
              </label>
              <div className="bg-[#121212] rounded-2xl px-5 py-6 font-black text-white border border-white/5 text-center h-[64px] flex items-center justify-center">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2 flex items-center gap-2">
                <Clock size={14} className="text-[#D4AF37]" /> Protocolo
              </label>
              <div className="bg-[#D4AF37]/5 border-2 border-dashed border-[#D4AF37]/20 rounded-2xl px-5 py-6 font-black text-[#D4AF37] text-center h-[64px] flex items-center justify-center">
                AUTO-GERADO
              </div>
            </div>
          </section>

          {/* LISTA DE MATERIAIS - GRID OTIMIZADO (SEM OVERFLOW CONFINADO) */}
          <section className="bg-[#121212] rounded-3xl border border-white/5 shadow-xl">
            <header className="p-6 bg-[#1A1A1A] border-b border-white/5 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <Calculator className="text-[#D4AF37]" size={20} />
                <h3 className="font-black text-white uppercase tracking-tight">Itens de Material</h3>
              </div>
              <button 
                onClick={addItem}
                className="flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-2 rounded-xl border border-[#D4AF37]/20 hover:bg-[#D4AF37] hover:text-black transition-all font-black text-[10px] uppercase tracking-widest"
              >
                <Plus size={16} /> Adicionar Item
              </button>
            </header>

            <div className="p-4 space-y-4">
              {/* Header do Grid (Desktop) */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[9px] uppercase font-black text-gray-500 tracking-widest border-b border-white/5 pb-4">
                <div className="col-span-5">Material / Item</div>
                <div className="col-span-1 text-center">Peças</div>
                <div className="col-span-2 text-center">Medidas (m)</div>
                <div className="col-span-1 text-center">Área (m²)</div>
                <div className="col-span-1 text-right pr-4">Unitário</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>

              {/* Itens */}
              <div className="space-y-3 min-h-[300px]">
                {items.map((item) => (
                  <div key={item.id} className="group relative bg-[#1A1A1A]/40 hover:bg-[#1A1A1A] border border-white/[0.03] hover:border-[#D4AF37]/20 p-4 rounded-2xl transition-all md:grid md:grid-cols-12 md:items-center md:gap-4">
                    
                    {/* Material Selector */}
                    <div className="col-span-5 mb-4 md:mb-0">
                      <MaterialSelect 
                        item={item} 
                        materiais={materiais} 
                        onChange={(val, mat) => {
                          if (mat) {
                            setItems(items.map(i => i.id === item.id ? { ...i, descricao: val, preco_unitario: Number(mat.valor_unitario), foto_url: mat.foto_url } : i));
                          } else {
                            setItems(items.map(i => i.id === item.id ? { ...i, descricao: val, preco_unitario: 0, foto_url: null } : i));
                          }
                        }}
                      />
                    </div>

                    {/* Peças (Volume) */}
                    <div className="col-span-1 mb-4 md:mb-0">
                      <label className="md:hidden text-[9px] uppercase font-black text-gray-600 mb-1 block">Peças</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.vol ?? ''}
                        onChange={(e) => updateItem(item.id, 'vol', e.target.value)}
                        className="w-full bg-[#121212] border border-white/5 rounded-xl py-3 text-center text-sm font-bold text-white focus:border-[#D4AF37]/30 transition-all"
                      />
                    </div>

                    {/* Medidas (C x A) */}
                    <div className="col-span-2 mb-4 md:mb-0">
                      <label className="md:hidden text-[9px] uppercase font-black text-gray-600 mb-1 block">Medidas (m)</label>
                      <div className="flex items-center gap-2">
                         <input
                          type="text"
                          inputMode="decimal"
                          value={item.comp ?? ''}
                          onChange={(e) => updateItem(item.id, 'comp', e.target.value)}
                          placeholder="C"
                          className="w-1/2 bg-[#121212] border border-white/5 rounded-xl py-3 text-center text-xs font-bold text-white focus:border-[#D4AF37]/30 transition-all"
                        />
                        <span className="text-gray-700 text-[10px]">x</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.alt ?? ''}
                          onChange={(e) => updateItem(item.id, 'alt', e.target.value)}
                          placeholder="A"
                          className="w-1/2 bg-[#121212] border border-white/5 rounded-xl py-3 text-center text-xs font-bold text-white focus:border-[#D4AF37]/30 transition-all"
                        />
                      </div>
                    </div>

                    {/* Área Calculada */}
                    <div className="col-span-1 mb-4 md:mb-0 text-center">
                      <label className="md:hidden text-[9px] uppercase font-black text-gray-600 mb-1 block">Área</label>
                      <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1.5 rounded-lg font-black text-[10px] inline-block">
                        {calculateM2(item).toFixed(2)} m²
                      </span>
                    </div>

                    {/* Preço Unitário */}
                    <div className="col-span-1 mb-4 md:mb-0 text-right pr-4">
                      <label className="md:hidden text-[9px] uppercase font-black text-gray-600 mb-1 block pr-4">Unitário</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.preco_unitario ?? ''}
                        onChange={(e) => updateItem(item.id, 'preco_unitario', e.target.value)}
                        className="w-full bg-transparent border-none text-right text-[11px] font-black text-gray-400 focus:text-white transition-all p-0"
                      />
                    </div>

                    {/* Subtotal e Remover */}
                    <div className="col-span-2 flex items-center justify-between md:justify-end gap-4">
                      <div className="text-right">
                        <label className="md:hidden text-[9px] uppercase font-black text-gray-600 mb-1 block">Subtotal</label>
                        <p className="text-sm font-black text-white">
                          R$ {calculateItemTotal(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ÁREA DE OBSERVAÇÕES */}
          <section className="bg-[#1A1A1A] p-6 rounded-3xl border border-white/5 space-y-3">
             <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2 flex items-center gap-2">
                Observações do Orçamento
             </label>
             <textarea 
               placeholder="Ex: Prazo de entrega diferenciado, detalhes da medição..."
               className="w-full bg-[#121212] border border-white/5 rounded-2xl p-5 text-sm font-medium text-white outline-none focus:border-[#D4AF37]/30 min-h-[100px] transition-all"
             />
          </section>
        </div>

        {/* COLUNA LATERAL - PAGAMENTO E RESUMO */}
        <div className="space-y-6">
          <section className="bg-[#1A1A1A] p-6 rounded-3xl border border-white/5 space-y-6 shadow-xl sticky top-6">
            <div className="space-y-4">
              <h3 className="text-lg font-black text-[#D4AF37] flex items-center gap-3 italic uppercase tracking-tighter">
                Pagamento
              </h3>
              <div className="grid grid-cols-2 bg-[#121212] p-1.5 rounded-xl border border-white/5 items-center">
                <button 
                  onClick={() => setCondicaoPgto('A VISTA')}
                  className={`py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${condicaoPgto === 'A VISTA' ? 'bg-[#D4AF37] text-black shadow-lg scale-[1.05]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  À Vista
                </button>
                <button 
                  onClick={() => setCondicaoPgto('PARCELADO')}
                  className={`py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${condicaoPgto === 'PARCELADO' ? 'bg-[#D4AF37] text-black shadow-lg scale-[1.05]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Parcelado
                </button>
              </div>

              {condicaoPgto === 'PARCELADO' && (
                <select 
                  value={qtdParcelas}
                  onChange={(e) => setQtdParcelas(Number(e.target.value))}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-[#D4AF37]/30 h-[48px]"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n}x s/ Juros</option>
                  ))}
                </select>
              )}

              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-[9px] uppercase tracking-widest font-black text-gray-500 ml-2">Validade</label>
                <input 
                  type="date"
                  value={validade}
                  onChange={(e) => setValidade(e.target.value)}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none h-[48px]"
                />
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* RESUMO DE VALORES */}
            <div className="space-y-5">
               <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Área Total</span>
                    <span className="text-xl font-black text-white">{totalM2.toFixed(2)} <small className="text-[10px] text-gray-500 italic">m²</small></span>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest opacity-80">Total Geral</span>
                    <span className="text-3xl font-black text-[#D4AF37] tracking-tighter leading-none">R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
               </div>
            </div>
          </section>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl text-[10px] uppercase font-black text-center tracking-widest animate-shake">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
