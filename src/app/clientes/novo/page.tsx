'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { maskCPFCNPJ, maskCEP, maskPhone } from '@/lib/masks';

export default function NovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  const formatName = (text: string) => {
    const lowers = ['de', 'da', 'do', 'das', 'dos', 'e'];
    return text.toLowerCase().split(' ').map((word, index) => {
      if (index !== 0 && lowers.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const enderecoJSON = JSON.stringify({
        cep: formData.cep,
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado
      });

      const { error: insertError } = await supabase
        .from('ibs_clientes')
        .insert({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          cpf_cnpj: formData.cpf_cnpj,
          endereco: enderecoJSON,
          vendedor_id: user?.id
        });

      if (insertError) throw insertError;

      router.back();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar cliente.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-6 lg:p-12 pb-32">
      <header className="flex items-center gap-6">
        <Link href="/clientes" className="p-3 bg-[#1E1E1E] rounded-2xl text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors shadow-lg">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-[#D4AF37] tracking-tighter uppercase italic">Novo Cliente</h2>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Cadastre um novo cliente no sistema IBS</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-[#1A1A1A] p-8 md:p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Nome Completo / Razão Social</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: formatName(e.target.value) })}
                className="w-full bg-[#121212] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bold focus:outline-none"
                placeholder="Ex: João Silva ou Construtora Imperial"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-sans focus:outline-none"
                  placeholder="cliente@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-sans focus:outline-none"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">CPF ou CNPJ</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input
                type="text"
                value={formData.cpf_cnpj}
                onChange={(e) => setFormData({ ...formData, cpf_cnpj: maskCPFCNPJ(e.target.value) })}
                className="w-full bg-[#121212] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-sans focus:outline-none"
                placeholder="000.000.000-00"
                maxLength={18}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <h3 className="text-xl font-black text-[#D4AF37] flex items-center gap-2 tracking-tight">
              <MapPin size={20} />
              Endereço Completo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1 flex items-center gap-2">
                  CEP {loadingCep && <Loader2 size={12} className="animate-spin text-[#D4AF37]" />}
                </label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: maskCEP(e.target.value) })}
                  onBlur={(e) => buscarCep(e.target.value)}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bold placeholder:text-gray-600"
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Logradouro</label>
                <input
                  type="text"
                  value={formData.logradouro}
                  onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bold placeholder:text-gray-600"
                  placeholder="Av. Principal, Rua das Flores..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Número</label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bold placeholder:text-gray-600"
                  placeholder="Número ou S/N"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Complemento</label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bold placeholder:text-gray-600"
                  placeholder="Apto, Sala, Bloco..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Bairro</label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bold placeholder:text-gray-600"
                  placeholder="Seu Bairro"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Cidade</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bold placeholder:text-gray-600"
                  placeholder="Sua Cidade"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-gray-500 ml-1">Estado</label>
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bold placeholder:text-gray-600"
                  placeholder="UF"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-center text-sm font-bold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D4AF37] text-black font-black uppercase tracking-widest py-5 rounded-[1.25rem] hover:bg-[#B8860B] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#D4AF37]/20"
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : (
            <>
              <Save size={24} strokeWidth={2.5} />
              Salvar Cliente
            </>
          )}
        </button>
      </form>
    </div>
  );
}
