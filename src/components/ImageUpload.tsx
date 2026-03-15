'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  defaultImage?: string;
  bucket?: string;
}

export function ImageUpload({ onUploadSuccess, defaultImage, bucket = 'materiais' }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(defaultImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultImage !== undefined) {
      setImageUrl(defaultImage);
    }
  }, [defaultImage]);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
      onUploadSuccess(data.publicUrl);
    } catch (error: any) {
      alert('Erro ao fazer upload da imagem: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        uploadFile(e.clipboardData.files[0]);
      } else if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          if (e.clipboardData.items[i].type.indexOf('image') !== -1) {
            const file = e.clipboardData.items[i].getAsFile();
            if (file) uploadFile(file);
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        capture="environment" 
      />

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`w-full aspect-video md:h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 transition-all cursor-pointer relative overflow-hidden group ${
          isDragOver
            ? 'border-[#D4AF37] bg-[#D4AF37]/5'
            : imageUrl 
              ? 'border-white/5 bg-[#121212]' 
              : 'border-white/10 bg-[#121212] hover:border-[#D4AF37]/50 hover:bg-[#1A1A1A]'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
            <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Enviando...</span>
          </div>
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt="Uploaded" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <UploadCloud size={16} /> Trocar Foto
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-[#D4AF37] transition-colors text-center">
            <UploadCloud size={40} />
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Clique ou Arraste</p>
              <p className="text-[9px] mt-1 font-bold">Aceita Ctrl+V, Câmera e Arquivos</p>
            </div>
          </div>
        )}
      </div>
      {(imageUrl || isUploading) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setImageUrl(null);
            onUploadSuccess('');
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          className="mt-2 text-[10px] uppercase font-black tracking-widest text-rose-500 hover:text-rose-400 flex items-center gap-1 justify-center w-full transition-colors"
        >
          <X size={12} /> Remover Foto
        </button>
      )}
    </div>
  );
}
