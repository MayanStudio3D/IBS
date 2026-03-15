'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Shield, User, Save, Loader2, CheckCircle2, LayoutDashboard, Users, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ImageUpload } from '@/components/ImageUpload';
import { maskPhone, maskCNPJ } from '@/lib/masks';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguranca' | 'sistema' | 'usuarios'>('perfil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Perfil State
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Segurança State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sistema State
  const [logoUrl, setLogoUrl] = useState('');
  const [sistemaSubtitulo, setSistemaSubtitulo] = useState('');
  const [sistemaCorSubtitulo, setSistemaCorSubtitulo] = useState('#6b7280');
  const [empresaCnpj, setEmpresaCnpj] = useState('');
  const [empresaIe, setEmpresaIe] = useState('');
  const [empresaEndereco, setEmpresaEndereco] = useState('');
  const [empresaTelefone, setEmpresaTelefone] = useState('');
  const [empresaEmail, setEmpresaEmail] = useState('');
  const [empresaPix, setEmpresaPix] = useState('');
  const [empresaBanco, setEmpresaBanco] = useState('');

  // Usuários State
  const [perfis, setPerfis] = useState<any[]>([]);
  const [loadingPerfis, setLoadingPerfis] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || '');
          
          const { data: perfil } = await supabase
            .from('ibs_perfis')
            .select('*')
            .eq('id', user.id)
            .single();

          if (perfil) {
            setNomeCompleto(perfil.nome_completo || '');
            setTelefone(perfil.telefone || '');
            setCargo(perfil.cargo || '');
            setAvatarUrl(perfil.avatar_url || '');
          }

          if (perfil?.cargo === 'ADMIN') {
             const { data: config } = await supabase.from('ibs_configuracoes').select('*').eq('id', 1).single();
             if (config) {
               setLogoUrl(config.logo_url || '');
               setSistemaSubtitulo(config.sistema_subtitulo || '');
               setSistemaCorSubtitulo(config.sistema_cor_subtitulo || '#6b7280');
               setEmpresaCnpj(config.empresa_cnpj || '');
               setEmpresaIe(config.empresa_ie || '');
               setEmpresaEndereco(config.empresa_endereco || '');
                setEmpresaTelefone(config.empresa_telefone || '');
                setEmpresaEmail(config.empresa_email || '');
                setEmpresaPix(config.empresa_pix || '');
                setEmpresaBanco(config.empresa_banco || '');
              }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'usuarios' && perfis.length === 0) {
      setLoadingPerfis(true);
      supabase.from('ibs_perfis').select('*').order('nome_completo')
        .then(({ data }) => {
          if (data) setPerfis(data);
          setLoadingPerfis(false);
        });
    }
  }, [activeTab]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // apply phone mask function locally for formatting before saving
      const { error: updateError } = await supabase
        .from('ibs_perfis')
        .update({
          nome_completo: nomeCompleto,
          telefone: telefone,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao atualizar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess('Senha atualizada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSistema = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('ibs_configuracoes')
        .upsert({
          id: 1,
          logo_url: logoUrl,
          sistema_subtitulo: sistemaSubtitulo,
          sistema_cor_subtitulo: sistemaCorSubtitulo,
          empresa_cnpj: empresaCnpj,
          empresa_ie: empresaIe,
          empresa_endereco: empresaEndereco,
          empresa_telefone: empresaTelefone,
          empresa_email: empresaEmail,
          empresa_pix: empresaPix,
          empresa_banco: empresaBanco
        });

      if (updateError) throw updateError;
      
      setSuccess('Configurações do sistema atualizadas!');
      setTimeout(() => {
        setSuccess('');
        window.location.reload(); // Reload to reflect logo changes
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao atualizar o sistema.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUserCargo = async (userId: string, novoCargo: string) => {
    try {
      const { error: updateError } = await supabase.from('ibs_perfis').update({ cargo: novoCargo }).eq('id', userId);
      if (updateError) throw updateError;
      setPerfis(p => p.map(user => user.id === userId ? { ...user, cargo: novoCargo } : user));
      setSuccess('Nível de acesso do usuário atualizado!');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao atualizar nível de acesso.');
    }
  };

  const handleToggleUserApproval = async (userId: string, statusAtual: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('ibs_perfis')
        .update({ aprovado: !statusAtual })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      
      setPerfis(p => p.map(user => user.id === userId ? { ...user, aprovado: !statusAtual } : user));
      setSuccess(`Usuário ${!statusAtual ? 'aprovado' : 'desativado'} com sucesso!`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao alterar status de aprovação.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 p-6 lg:p-12 space-y-8 animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 w-full mb-8">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-[#D4AF37] tracking-tighter uppercase italic flex items-center gap-4">
            <Settings size={36} />
            Ajustes
          </h2>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">
            Configure seu perfil e preferências no sistema
          </p>
        </div>
      </header>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm">
          <CheckCircle2 size={20} />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="col-span-1 lg:col-span-3 space-y-3">
          <button
            onClick={() => setActiveTab('perfil')}
            className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-sm tracking-tight transition-all duration-300 ${
              activeTab === 'perfil' 
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 scale-[1.02]' 
                : 'bg-[#1A1A1A] text-gray-500 hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            <User size={20} />
            MEU PERFIL
          </button>
          
          <button
            onClick={() => setActiveTab('seguranca')}
            className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-sm tracking-tight transition-all duration-300 ${
              activeTab === 'seguranca' 
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 scale-[1.02]' 
                : 'bg-[#1A1A1A] text-gray-500 hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            <Shield size={20} />
            SEGURANÇA
          </button>

          {cargo === 'ADMIN' && (
            <>
              <button
                onClick={() => setActiveTab('sistema')}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-sm tracking-tight transition-all duration-300 ${
                  activeTab === 'sistema' 
                    ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 scale-[1.02]' 
                    : 'bg-[#1A1A1A] text-gray-500 hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                <LayoutDashboard size={20} />
                SISTEMA
              </button>

              <button
                onClick={() => setActiveTab('usuarios')}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-sm tracking-tight transition-all duration-300 ${
                  activeTab === 'usuarios' 
                    ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 scale-[1.02]' 
                    : 'bg-[#1A1A1A] text-gray-500 hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                <Users size={20} />
                USUÁRIOS
              </button>
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="col-span-1 lg:col-span-9">
          <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 lg:p-10 border border-white/5 shadow-2xl relative overflow-hidden">
            {/* Elemento Decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-5 blur-[100px] rounded-full pointer-events-none" />

            {activeTab === 'perfil' && (
              <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="border-b border-white/5 pb-6">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                    <User className="text-[#D4AF37]" size={28} />
                    Informações Pessoais
                  </h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Atualize seus dados de cadastro</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Nome Completo</label>
                    <input
                      type="text"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">E-mail de Acesso</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-gray-500 outline-none h-[60px] opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Telefone</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(maskPhone(e.target.value))}
                      className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Nível de Acesso (Cargo)</label>
                    <div className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-black text-[#D4AF37] outline-none h-[60px] flex items-center">
                      {cargo === 'ADMIN' ? 'ADMIN' : (cargo || 'Vendedor')}
                    </div>
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2 w-full">Foto de Perfil</label>
                    <ImageUpload 
                      bucket="materiais" 
                      defaultImage={avatarUrl} 
                      onUploadSuccess={(url) => setAvatarUrl(url || '')} 
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-[#D4AF37] hover:bg-[#B8860B] disabled:opacity-50 text-[#121212] font-black py-4 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#D4AF37]/20 active:scale-95 text-sm uppercase tracking-wider"
                  >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="border-b border-white/5 pb-6">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                    <Shield className="text-[#D4AF37]" size={28} />
                    Trocar Senha
                  </h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Mantenha sua conta segura</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Nova Senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button 
                    onClick={handleSavePassword}
                    disabled={saving || !newPassword || !confirmPassword}
                    className="bg-[#D4AF37] hover:bg-[#B8860B] disabled:opacity-50 text-[#121212] font-black py-4 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#D4AF37]/20 active:scale-95 text-sm uppercase tracking-wider"
                  >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Atualizar Senha
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'sistema' && cargo === 'ADMIN' && (
              <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="border-b border-white/5 pb-6">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                    <LayoutDashboard className="text-[#D4AF37]" size={28} />
                    Configurações do Sistema
                  </h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Personalize a identidade da plataforma</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 aspect-video flex flex-col items-center">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2 w-full">Logo da Barra Lateral (Opcional)</label>
                    <ImageUpload 
                      bucket="materiais" 
                      defaultImage={logoUrl} 
                      onUploadSuccess={(url) => setLogoUrl(url || '')} 
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Subtítulo (Sidebar)</label>
                      <input
                        type="text"
                        value={sistemaSubtitulo}
                        onChange={(e) => setSistemaSubtitulo(e.target.value)}
                        className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                        placeholder="Ex: Imperial Barra Stone"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Cor do Subtítulo</label>
                      <div className="flex items-center gap-4 bg-[#121212] border border-[#121212] rounded-2xl px-5 py-3 h-[60px]">
                        <input
                          type="color"
                          value={sistemaCorSubtitulo}
                          onChange={(e) => setSistemaCorSubtitulo(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                        />
                        <span className="text-sm font-bold text-white uppercase">{sistemaCorSubtitulo}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-8">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <FileText size={18} className="text-[#D4AF37]" />
                    Dados da Empresa (Cabeçalho/Rodapé)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">CNPJ</label>
                      <input
                        type="text"
                        value={empresaCnpj}
                        onChange={(e) => setEmpresaCnpj(maskCNPJ(e.target.value))}
                        className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">IE (Inscrição Estadual)</label>
                      <input
                        type="text"
                        value={empresaIe}
                        onChange={(e) => setEmpresaIe(e.target.value)}
                        className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                        placeholder="Inscrição Estadual"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Endereço Completo</label>
                      <input
                        type="text"
                        value={empresaEndereco}
                        onChange={(e) => setEmpresaEndereco(e.target.value)}
                        className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                        placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Telefone Comercial</label>
                      <input
                        type="text"
                        value={empresaTelefone}
                        onChange={(e) => setEmpresaTelefone(maskPhone(e.target.value))}
                        className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                        placeholder="(00) 0000-0000"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">E-mail Comercial</label>
                      <input
                        type="email"
                        value={empresaEmail}
                        onChange={(e) => setEmpresaEmail(e.target.value)}
                        className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                        placeholder="contato@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Chave PIX (Para QR-Code)</label>
                       <input
                         type="text"
                         value={empresaPix}
                         onChange={(e) => setEmpresaPix(e.target.value)}
                         className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-[#D4AF37] outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                         placeholder="CNPJ, E-mail ou Aleatória"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-2">Dados Bancários (Opcional)</label>
                       <input
                         type="text"
                         value={empresaBanco}
                         onChange={(e) => setEmpresaBanco(e.target.value)}
                         className="w-full bg-[#121212] border border-[#121212] rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/30 focus:shadow-inner transition-all h-[60px]"
                         placeholder="Banco, Ag, Conta..."
                       />
                     </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button 
                    onClick={handleSaveSistema}
                    disabled={saving}
                    className="bg-[#D4AF37] hover:bg-[#B8860B] disabled:opacity-50 text-[#121212] font-black py-4 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#D4AF37]/20 active:scale-95 text-sm uppercase tracking-wider"
                  >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Salvar Sistema
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'usuarios' && cargo === 'ADMIN' && (
              <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="border-b border-white/5 pb-6">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                    <Users className="text-[#D4AF37]" size={28} />
                    Gerenciar Usuários
                  </h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Altere o nível de acesso (cargo) da equipe</p>
                </div>

                {loadingPerfis ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {perfis.map((u) => (
                      <div key={u.id} className="bg-[#121212] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-white">{u.nome_completo || 'Sem Nome'}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{u.telefone || 'Sem telefone'}</p>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                          <button
                            onClick={() => handleToggleUserApproval(u.id, u.aprovado)}
                            className={`w-full md:w-32 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center border ${
                              u.aprovado 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                            }`}
                          >
                            {u.aprovado ? 'Aprovado' : 'Pendente'}
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateUserCargo(u.id, 'ADMIN')}
                              className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all ${u.cargo === 'ADMIN' ? 'bg-[#D4AF37] text-black' : 'bg-[#1A1A1A] text-gray-500'}`}
                            >
                              ADMIN
                            </button>
                            <button
                              onClick={() => handleUpdateUserCargo(u.id, 'VENDEDOR')}
                              className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all ${u.cargo === 'VENDEDOR' ? 'bg-[#D4AF37] text-black' : 'bg-[#1A1A1A] text-gray-500'}`}
                            >
                              VENDEDOR
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
