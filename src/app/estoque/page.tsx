'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Package, 
  Search, 
  Loader2, 
  AlertTriangle, 
  TrendingUp, 
  History,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Save,
  Trash2,
  Edit2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { adicionarMateriaPrima } from '@/lib/stock-utils';
import Link from 'next/link';
import { ImageUpload } from '@/components/ImageUpload';


export default function EstoquePage() {
  const [loading, setLoading] = useState(true);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  
  // Form para entrada de matéria-prima
  const [addForm, setAddForm] = useState({
    quantidade: '',
    observacao: ''
  });

  // Modal e Form para edição de material
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '',
    valor_unitario: '',
    limite_minimo: '',
    foto_url: ''
  });

  const fetchData = async () => {
    try {
      // Buscar Materiais
      const { data: mats } = await supabase
        .from('ibs_estoque')
        .select('*')
        .order('nome');
      
      // Buscar últimas Movimentações
      const { data: movs } = await supabase
        .from('ibs_estoque_movimentos')
        .select('*, ibs_estoque(nome)')
        .order('criado_em', { ascending: false })
        .limit(10);

      if (mats) setMateriais(mats);
      if (movs) setMovimentacoes(movs);
    } catch (err) {
      console.error('Erro ao buscar dados do estoque:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStock = async () => {
    if (!addForm.quantidade || Number(addForm.quantidade) <= 0) {
      alert('Informe uma quantidade válida.');
      return;
    }

    const { success } = await adicionarMateriaPrima(
      selectedMaterial.id, 
      Number(addForm.quantidade), 
      addForm.observacao || 'Entrada manual de matéria-prima'
    );

    if (success) {
      setShowAddModal(false);
      setAddForm({ quantidade: '', observacao: '' });
      fetchData();
    }
  };

  const handleDeleteMaterial = async (id: string, nome: string) => {
    if (window.confirm(`ATENÇÃO: Deseja realmente excluir o material "${nome}" do estoque e todo o seu histórico de movimentação?\n\nEsta ação não pode ser desfeita.`)) {
      setLoading(true);
      try {
        const { error } = await supabase.from('ibs_estoque').delete().eq('id', id);
        if (error) throw error;
        
        alert('Material excluído com sucesso.');
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir material. Verifique se ele não foi usado em orçamentos.');
        setLoading(false);
      }
    }
  };

  const handleEditMaterial = async () => {
    if (!editForm.nome) return alert('O nome é obrigatório.');
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('ibs_estoque')
        .update({
          nome: editForm.nome.toUpperCase(),
          valor_unitario: parseFloat(editForm.valor_unitario.toString().replace(',', '.')) || 0,
          limite_minimo: parseFloat(editForm.limite_minimo.toString().replace(',', '.')) || 0,
          foto_url: editForm.foto_url
        })
        .eq('id', selectedMaterial.id);

      if (error) throw error;
      
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar material.');
      setLoading(false);
    }
  };

  const filteredMaterials = materiais.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl lg:text-4xl font-black text-[#D4AF37] tracking-tighter uppercase italic">Controle de Estoque</h2>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Metragem em tempo real e alertas de reposição</p>
        </div>
        <Link href="/estoque/novo" className="bg-[#D4AF37] text-[#121212] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-[#B8860B] active:scale-95 transition-all flex items-center justify-center gap-3 whitespace-nowrap">
          <Plus size={20} /> Cadastrar Material
        </Link>
      </header>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
           <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest mb-4">Total em Metragem</p>
           <p className="text-4xl font-black text-white tracking-tighter">
             {materiais.reduce((acc, m) => acc + Number(m.m2_saldo), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} m²
           </p>
        </div>
        <div className="bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
           <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest mb-4">Itens com Alerta</p>
           <p className={`text-4xl font-black tracking-tighter ${materiais.some(m => Number(m.m2_saldo) < Number(m.limite_minimo)) ? 'text-rose-500' : 'text-emerald-500'}`}>
             {materiais.filter(m => Number(m.m2_saldo) < Number(m.limite_minimo)).length}
           </p>
        </div>
        <div className="bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
           <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest mb-4">Valor Estimado (Custo)</p>
           <p className="text-4xl font-black text-[#D4AF37] tracking-tighter">
             R$ {materiais.reduce((acc, m) => acc + (Number(m.m2_saldo) * Number(m.valor_unitario)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Lado Esquerdo: Lista de Materiais */}
        <div className="xl:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={22} />
            <input 
              type="text"
              placeholder="Pesquisar material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-white/5 rounded-[1.5rem] pl-14 pr-6 py-5 text-white font-bold placeholder:text-gray-700 outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredMaterials.map((m) => {
              const matchesMin = Number(m.m2_saldo) >= Number(m.limite_minimo);
              return (
                <div key={m.id} className="bg-[#1A1A1A] p-4 sm:p-5 rounded-3xl border border-white/5 hover:border-[#D4AF37]/30 transition-all shadow-xl flex flex-col xl:flex-row justify-between items-center gap-5 group">
                  <div className="flex flex-col sm:flex-row items-center gap-5 w-full xl:w-auto">
                    <div className={`h-40 w-full sm:h-28 sm:w-44 rounded-[1.5rem] flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner group-hover:ring-2 ring-white/10 transition-all ${matchesMin ? 'bg-[#121212] border border-white/5 text-[#D4AF37]' : 'bg-rose-500/10 text-rose-500 animate-pulse'}`}>
                      {m.foto_url ? (
                        <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover relative z-0" />
                      ) : (
                        matchesMin ? <Package size={32} className="relative z-0" /> : <AlertTriangle size={32} className="relative z-0" />
                      )}
                      
                      {/* Floating actions */}
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedMaterial(m); setEditForm({ nome: m.nome, valor_unitario: m.valor_unitario, limite_minimo: m.limite_minimo, foto_url: m.foto_url || '' }); setShowEditModal(true); }}
                          className="w-8 h-8 flex items-center justify-center bg-[#121212]/90 backdrop-blur border border-white/10 rounded-full text-white hover:bg-white hover:text-amber-500 transition-colors shadow-xl"
                          title="Editar Material"
                        >
                          <Edit2 size={12} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(m.id, m.nome); }}
                          className="w-8 h-8 flex items-center justify-center bg-[#121212]/90 backdrop-blur border border-white/10 rounded-full text-white hover:bg-white hover:text-rose-600 transition-colors shadow-xl"
                          title="Excluir Material"
                        >
                          <Trash2 size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-auto text-center sm:text-left space-y-2.5">
                      <h3 className="font-bold text-xl lg:text-2xl text-white tracking-tight leading-none">{m.nome}</h3>
                      <div className="flex flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4 bg-[#121212] px-4 py-2.5 rounded-full border border-white/5 inline-flex w-fit mx-auto sm:mx-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-[1px]">Saldo</span>
                          <span className={`text-xs font-black tracking-tighter ${matchesMin ? 'text-[#D4AF37]' : 'text-rose-500'}`}>
                            {Number(m.m2_saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} m²
                          </span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] uppercase font-bold text-gray-500 mt-[1px]">Custo</span>
                           <span className="text-white text-xs font-bold tracking-tight">R$ {Number(m.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-center xl:justify-end gap-2.5 w-full xl:w-auto pt-4 xl:pt-0 border-t xl:border-none border-white/5 mt-1 xl:mt-0">
                    <button 
                      onClick={() => { setSelectedMaterial(m); setShowAddModal(true); }}
                      className="bg-[#D4AF37] text-[#121212] w-full xl:w-auto px-8 h-12 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#B8860B] transition-all ml-1 shadow-md hover:shadow-lg active:scale-95"
                    >
                      <Plus size={16} strokeWidth={3} /> Adicionar Material
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lado Direito: Histórico */}
        <div className="space-y-6">
          <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
            <History size={24} className="text-[#D4AF37]" />
            Últimas Movimentações
          </h3>
          
          <div className="bg-[#1E1E1E] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            {movimentacoes.length > 0 ? (
              <div className="divide-y divide-white/5">
                {movimentacoes.map((mov) => (
                  <div key={mov.id} className="p-6 space-y-3 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className={`p-2 rounded-lg ${mov.tipo === 'ENTRADA' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {mov.tipo === 'ENTRADA' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <span className="text-[10px] font-black text-gray-600">{new Date(mov.criado_em).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{mov.ibs_estoque?.nome}</p>
                      <p className="text-xs text-gray-500 mt-1">{mov.observacao || 'Sem observação'}</p>
                    </div>
                    <p className={`text-lg font-black tracking-tighter ${mov.tipo === 'ENTRADA' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {mov.tipo === 'ENTRADA' ? '+' : '-'}{Number(mov.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} m²
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-600 font-bold uppercase text-xs tracking-widest">Sem movimentações recentes.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PARA ENTRADA MATÉRIA-PRIMA */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#121212]/90 backdrop-blur-md">
          <div className="bg-[#1E1E1E] w-full max-w-md rounded-[2.5rem] border border-white/10 p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-[#D4AF37] tracking-tighter">ENTRADA DE CHAPA</h3>
                <p className="text-gray-500 text-sm mt-1">{selectedMaterial?.nome}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2">Quantidade (m²)</label>
                <input
                  type="number"
                  step="0.001"
                  value={addForm.quantidade}
                  onChange={(e) => setAddForm({ ...addForm, quantidade: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl px-6 py-5 text-white text-2xl font-black outline-none focus:border-[#D4AF37]/30 text-center"
                  placeholder="0.000"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2">Observação (Opcional)</label>
                <textarea
                  value={addForm.observacao}
                  onChange={(e) => setAddForm({ ...addForm, observacao: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#D4AF37]/30 h-24 resize-none"
                  placeholder="Ex: Novo lote de chapas importadas..."
                />
              </div>

              <button 
                onClick={handleAddStock}
                className="w-full bg-[#D4AF37] text-[#121212] py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 lg:mt-8"
              >
                <Save size={20} /> Confirmar Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR MATÉRIA-PRIMA */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#121212]/90 backdrop-blur-md">
          <div className="bg-[#1E1E1E] w-full max-w-md rounded-[2.5rem] border border-white/10 p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-[#D4AF37] tracking-tighter">EDITAR MATERIAL</h3>
                <p className="text-gray-500 text-sm mt-1">{selectedMaterial?.nome}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2">Nome do Material</label>
                <input
                  type="text"
                  value={editForm.nome}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#D4AF37]/30 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2">Custo Base (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.valor_unitario}
                    onChange={(e) => setEditForm({ ...editForm, valor_unitario: e.target.value })}
                    className="w-full bg-[#121212] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#D4AF37]/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2">Alerta Min (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.limite_minimo}
                    onChange={(e) => setEditForm({ ...editForm, limite_minimo: e.target.value })}
                    className="w-full bg-[#121212] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#D4AF37]/30"
                  />
                </div>
              </div>

              <div>
                 <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2 mb-2 block">Foto da Chapa (Opcional)</label>
                 <ImageUpload 
                   onUploadSuccess={(url) => setEditForm({ ...editForm, foto_url: url })}
                   defaultImage={editForm.foto_url}
                 />
              </div>

              <button 
                onClick={handleEditMaterial}
                className="w-full bg-white text-[#121212] py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 lg:mt-8"
              >
                <Save size={20} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
