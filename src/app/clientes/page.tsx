'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Users, Search, Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { maskCPFCNPJ, maskPhone } from '@/lib/masks';

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchClientes() {
      const { data } = await supabase
        .from('ibs_clientes')
        .select('*')
        .order('nome');
      if (data) setClientes(data);
      setLoading(false);
    }
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf_cnpj?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 p-6 lg:p-12 space-y-8 animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 w-full">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-[#D4AF37] tracking-tighter uppercase italic">Clientes</h2>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Gerencie sua base de clientes da Imperial Barra Stone</p>
        </div>
        <Link 
          href="/clientes/novo"
          className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#121212] font-black py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#D4AF37]/20 active:scale-95 text-lg"
        >
          <Plus size={24} />
          Novo Cliente
        </Link>
      </header>

      <div className="relative z-10 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]/50" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nome, e-mail ou CPF/CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bold placeholder:text-gray-600 shadow-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 w-full">
        {filteredClientes.map((c) => (
          <div key={c.id} className="bg-[#1A1A1A] p-6 lg:p-8 rounded-[2.5rem] border border-white/5 hover:border-[#D4AF37]/30 transition-all shadow-xl group flex flex-col justify-between">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-14 h-14 bg-[#121212] border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] font-black text-xl shadow-inner shrink-0 group-hover:bg-[#D4AF37]/10 transition-colors">
                {c.nome.substring(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-xl text-white truncate tracking-tight">{c.nome}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{c.cpf_cnpj ? maskCPFCNPJ(c.cpf_cnpj) : 'Sem CPF/CNPJ'}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {c.email && (
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Mail size={16} className="text-gray-600" />
                  <span className="truncate">{c.email}</span>
                </div>
              )}
              {c.telefone && (
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Phone size={16} className="text-gray-600" />
                  <span>{maskPhone(c.telefone)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full">
              <button className="flex-1 py-3.5 rounded-2xl bg-[#121212] text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-[#D4AF37] transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-[#D4AF37]/30 shadow-md">
                Ver Histórico <ArrowRight size={14} />
              </button>
              <Link href={`/clientes/${c.id}/editar`} className="w-12 h-12 flex items-center justify-center bg-[#121212] text-gray-400 font-black rounded-2xl hover:text-white transition-all border border-white/5 hover:border-white/20 shadow-md shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit-2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500">Nenhum cliente encontrado.</p>
        </div>
      )}
    </div>
  );
}
