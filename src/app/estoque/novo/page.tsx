'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package, DollarSign, AlertTriangle, Loader2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ImageUpload } from '@/components/ImageUpload';

export default function NovoMaterialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    m2_saldo: '',
    valor_unitario: '',
    limite_minimo: '10',
    foto_url: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('ibs_estoque')
        .insert({
          nome: formData.nome.toUpperCase(),
          m2_saldo: parseFloat(formData.m2_saldo) || 0,
          valor_unitario: parseFloat(formData.valor_unitario.replace(',', '.')) || 0,
          limite_minimo: parseFloat(formData.limite_minimo) || 0,
          foto_url: formData.foto_url
        });

      if (insertError) throw insertError;

      router.back();
      router.refresh();
    } catch (err: any) {
      if (err.code === '23505') {
        setError('Já existe um material com esse nome no estoque.');
      } else {
        setError(err.message || 'Erro ao cadastrar material.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 pt-6">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-3 bg-[#1E1E1E] rounded-2xl text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors shadow-lg">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-[#D4AF37] tracking-tighter uppercase italic">Novo Material</h2>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Cadastre uma nova chapa no estoque IBS</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-[#1E1E1E] p-8 md:p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2">Nome do Material</label>
            <div className="relative">
              <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full bg-[#121212] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all font-bold placeholder:text-gray-800 uppercase"
                placeholder="EX: QUARTZITO WHITE"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2">Custo Unitário p/ M² (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.valor_unitario}
                  onChange={(e) => setFormData({ ...formData, valor_unitario: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all font-bold placeholder:text-gray-800"
                  placeholder="350.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2">Saldo Inicial (m²)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.m2_saldo}
                onChange={(e) => setFormData({ ...formData, m2_saldo: e.target.value })}
                 className="w-full bg-[#121212] border border-white/5 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all font-bold placeholder:text-gray-800 text-center"
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2">Limite Mínimo p/ Alerta (m²)</label>
              <div className="relative">
                <AlertTriangle className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-600/50" size={20} />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.limite_minimo}
                  onChange={(e) => setFormData({ ...formData, limite_minimo: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:ring-2 focus:ring-[rose-500]/20 outline-none transition-all font-bold placeholder:text-gray-800"
                  placeholder="10.00"
                />
              </div>
            </div>

            <div className="space-y-4 md:col-span-2 mt-4 pt-6 border-t border-white/5">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 ml-2 flex items-center gap-2">
                  <ImageIcon size={14} /> Foto da Chapa (Opcional)
                </label>
                <div className="mt-4">
                   <ImageUpload 
                     onUploadSuccess={(url) => setFormData({ ...formData, foto_url: url })}
                     defaultImage={formData.foto_url}
                   />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-black p-4 rounded-2xl text-center uppercase tracking-widest animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D4AF37] text-[#121212] font-black py-5 rounded-2xl hover:bg-[#B8860B] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 text-base tracking-widest uppercase mt-4"
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : (
            <>
              <Save size={24} />
              Confirmar Cadastro
            </>
          )}
        </button>
      </form>
    </div>
  );
}
