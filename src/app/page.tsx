'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, 
  ChevronRight, 
  User, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Search,
  Maximize2,
  Compass,
  Menu
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// --- UTILS & COMPONENTS ---

const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] overflow-hidden">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </div>
);

const MagneticButton = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.25, y: y * 0.25, duration: 0.6, ease: "power3.out" });
    };

    const onMouseLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
    };

    btn.addEventListener("mousemove", onMouseMove);
    btn.addEventListener("mouseleave", onMouseLeave);
    return () => {
      btn.removeEventListener("mousemove", onMouseMove);
      btn.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <button 
      ref={btnRef} 
      onClick={onClick}
      className={`relative overflow-hidden group rounded-full transition-transform active:scale-95 ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

// --- NAVIGATION ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    async function fetchLogo() {
      const { data } = await supabase.from('ibs_configuracoes').select('logo_url').eq('id', 1).single();
      if (data?.logo_url) setLogoUrl(data.logo_url);
    }
    fetchLogo();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-700 px-6 md:px-12 py-10 ${
      scrolled ? 'bg-[#0D0D12]/98 backdrop-blur-2xl border-b border-white/5 py-4 shadow-2xl' : 'bg-transparent'
    }`}>
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        
        {/* Esquerda: Menu Parte 1 (3 itens para equilibrar o peso) */}
        <div className="hidden lg:flex items-center gap-10 flex-1 justify-end">
          {['Materiais', 'Processo', 'Empresa'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-[10px] font-bold uppercase tracking-[0.4em] transition-colors text-gray-400 hover:text-white"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Centro: Logo Imperial (Estrela da Página) */}
        <Link href="/dashboard" className="flex items-center justify-center px-16 lg:px-24 group">
          <img 
            src={logoUrl || "https://ovfpxfshmizmsidvjkgb.supabase.co/storage/v1/object/public/ibs-assets/logo-ibs.png"} 
            alt="IBS Logo" 
            className={`w-auto object-contain transition-all duration-700 group-hover:scale-105 ${
              scrolled ? 'h-18 md:h-20' : 'h-28 md:h-32 lg:h-36'
            }`}
          />
        </Link>

        {/* Direita: Menu Parte 2 + Acesso Restrito */}
        <div className="hidden lg:flex items-center gap-10 flex-1 justify-start">
          <a 
            href="#contato"
            className="text-[10px] font-bold uppercase tracking-[0.4em] transition-colors text-gray-400 hover:text-white"
          >
            Contato
          </a>
          <a 
            href="/login" 
            className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-8 py-3.5 rounded-full border border-white/10 text-white bg-white/5 hover:bg-[#C9A84C] hover:text-[#0D0D12] hover:border-[#C9A84C] transition-all ml-4 z-[1000] cursor-pointer"
          >
            <User size={14} /> Área Restrita
          </a>
        </div>

        {/* Mobile Menu Icon (Simple toggle could be added) */}
        <div className="lg:hidden">
          <Menu className="text-white cursor-pointer" size={28} />
        </div>
      </div>
    </nav>
  );
};

// --- HERO ---

const Hero = () => {
  const container = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from(".hero-line", {
        y: 80,
        opacity: 0,
        duration: 1.4,
        stagger: 0.15,
        ease: "power4.out"
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative h-[100dvh] flex items-center justify-center bg-[#0D0D12] overflow-hidden">
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1628155259418-f686ca079c67?q=80&w=2000&auto=format&fit=crop")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black" />
      </div>

      <div className="relative z-10 text-center px-8">
        <span className="hero-line inline-block text-[11px] font-bold uppercase tracking-[0.6em] text-[#C9A84C] mb-8">Pedras Nobres • Marcenaria em Rocha</span>
        <h1 className="hero-line text-5xl md:text-8xl lg:text-9xl font-extrabold text-white uppercase tracking-tighter leading-[0.9] mb-12">
          A Evolução do <br/>
          <span className="text-[#C9A84C]">Acabamento.</span>
        </h1>
        <div className="hero-line flex flex-col md:flex-row items-center justify-center gap-8 mt-12">
          <MagneticButton className="bg-[#C9A84C] text-[#0D0D12] px-12 py-5 text-[11px] font-black uppercase tracking-widest">
            Falar com um Especialista
          </MagneticButton>
          <p className="text-gray-400 text-sm max-w-[300px] leading-relaxed md:text-left border-l border-white/10 pl-6">
            Projetos residenciais e comerciais de luxo com execução técnica precisa e materiais exclusivos.
          </p>
        </div>
      </div>
    </section>
  );
};

// --- FEATURES ---

const Materials = () => {
  const cards = [
    {
      title: "Mármores Exclusivos",
      desc: "Curadoria de placas nobres importadas diretamente das jazidas mais prestigiadas do mundo.",
      img: "https://images.unsplash.com/photo-1628155259418-f686ca079c67?q=80&w=800&auto=format&fit=crop",
      icon: <Sparkles className="text-[#C9A84C]" size={24} />
    },
    {
      title: "Granitos de Luxo",
      desc: "Resistência e beleza natural em cores selecionadas para projetos que exigem durabilidade extrema.",
      img: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=800&auto=format&fit=crop",
      icon: <Search className="text-[#C9A84C]" size={24} />
    },
    {
      title: "Quartzitos Raros",
      desc: "O equilíbrio perfeito entre a estética do mármore e a dureza suprema do granito.",
      img: "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?q=80&w=800&auto=format&fit=crop",
      icon: <Compass className="text-[#C9A84C]" size={24} />
    }
  ];

  return (
    <section id="materiais" className="py-32 bg-white px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-24">
          <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#C9A84C] block mb-4">Catálogo Signature</span>
          <h2 className="text-4xl md:text-6xl font-black text-[#0D0D12] uppercase tracking-tighter">Materiais de <br/>Alta Fidelidade</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {cards.map((card, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-8 border border-gray-100">
                <img src={card.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={card.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-10 left-10">{card.icon}</div>
              </div>
              <h3 className="text-2xl font-black text-[#0D0D12] uppercase tracking-tighter mb-4">{card.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- PROCESS / STACKING CARDS ---

const Process = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.process-card') as any[];
      
      cards.forEach((card, i) => {
        // Pin individual cards with spacing
        ScrollTrigger.create({
          trigger: card,
          start: "top 120px",
          pin: true,
          pinSpacing: false,
          endTrigger: sectionRef.current,
          end: "bottom bottom",
        });

        // Effect for previous cards as the new one enters
        if (i < cards.length - 1) {
          gsap.to(card, {
            scale: 0.92,
            opacity: 0.6,
            filter: "blur(2px)",
            scrollTrigger: {
              trigger: cards[i + 1],
              start: "top 80%",
              end: "top 150px",
              scrub: true
            }
          });
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="processo" ref={sectionRef} className="bg-[#0D0D12] pb-[10vh]">
      <div className="h-[20vh] flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-[#C9A84C] mb-4">Metodologia Imperial</span>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">Nosso Processo de Execução</h2>
      </div>

      <div className="max-w-6xl mx-auto px-6 space-y-[20vh]">
        {[
          {
            step: "01",
            title: "Medição a Laser",
            desc: "Utilizamos escaneamento digital 3D para capturar as dimensões do ambiente com precisão técnica. Isso garante que cada peça seja fabricada no tamanho exato para a instalação.",
            img: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1200&auto=format&fit=crop"
          },
          {
            step: "02",
            title: "Projetamento",
            desc: "Nossa equipe técnica mapeia os veios e padrões da pedra no software de CAD, permitindo que você visualize como o material ficará após os cortes e junções.",
            img: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1200&auto=format&fit=crop"
          },
          {
            step: "03",
            title: "Corte e Lapidação",
            desc: "Processamento automatizado em máquinas de 5 eixos. Acabamentos rigorosos que realçam a sofisticação da pedra e garantem a longevidade da obra.",
            img: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1200&auto=format&fit=crop"
          }
        ].map((item, i) => (
          <div key={i} className="process-card w-full flex items-center justify-center">
             <div className="bg-[#111111] rounded-[3.5rem] border border-white/5 p-12 md:p-24 w-full flex flex-col md:flex-row gap-16 items-center shadow-2xl">
                <div className="flex-1 space-y-8">
                  <span className="text-[10px] font-black text-[#C9A84C] uppercase tracking-[0.4em]">{item.step} // Fase</span>
                  <h3 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter">{item.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex-1 w-full aspect-square rounded-[2.5rem] overflow-hidden border border-white/5 relative bg-black/40">
                  <img src={item.img} className="w-full h-full object-cover opacity-60 grayscale" alt={item.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-40" />
                </div>
             </div>
          </div>
        ))}
      </div>
      {/* Spacer to allow the last card to pin and scroll past */}
      <div className="h-[20vh]" />
    </section>
  );
};

// --- CONTACT / GET STARTED ---

const Contact = () => {
  return (
    <section id="contato" className="py-48 bg-[#FAF8F5] px-8 text-[#0D0D12]">
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#C9A84C] mb-8 block">Solicite um Orçamento</span>
        <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-12">Vamos iniciar seu <br/>novo projeto?</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
           <MagneticButton className="bg-[#0D0D12] text-white px-12 py-5 text-[11px] font-black uppercase tracking-widest transition-transform hover:scale-105 active:scale-95">
              Enviar WhatsApp
           </MagneticButton>
           <button className="px-12 py-5 text-[11px] font-black uppercase tracking-widest border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
              Baixar Catálogo
           </button>
        </div>
      </div>
    </section>
  );
};

// --- FOOTER ---

const Footer = () => {
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    async function fetchLogo() {
      const { data } = await supabase.from('ibs_configuracoes').select('logo_url').eq('id', 1).single();
      if (data?.logo_url) setLogoUrl(data.logo_url);
    }
    fetchLogo();
  }, []);

  return (
    <footer className="bg-[#000000] text-white pt-32 pb-12 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20 mb-32 items-start">
        <div className="md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left space-y-12">
          <img 
            src={logoUrl || "https://ovfpxfshmizmsidvjkgb.supabase.co/storage/v1/object/public/ibs-assets/logo-ibs.png"} 
            alt="IBS Logo" 
            className="h-28 md:h-36 w-auto object-contain"
          />
          <p className="text-gray-500 text-lg leading-relaxed max-w-sm">
            Especialistas em processamento e instalação de mármores e granitos de alto padrão. Tradição e tecnologia para projetos exclusivos.
          </p>
        </div>
        
        <div className="space-y-8 flex flex-col items-center md:items-start">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#C9A84C]">Links</span>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-gray-500 text-center md:text-left">
            <li><a href="#materiais" className="hover:text-white transition-colors">Materiais</a></li>
            <li><a href="#processo" className="hover:text-white transition-colors">Processo Especializado</a></li>
            <li><Link href="/login" className="text-[#C9A84C] hover:brightness-125 transition-all">Acesso Restrito</Link></li>
          </ul>
        </div>

        <div className="space-y-8 flex flex-col items-center md:items-start">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#C9A84C]">Sede</span>
          <div className="text-center md:text-left space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest leading-relaxed text-gray-500">
              Av. Oceânica nº 91, Centro <br/>
              Barra dos Coqueiros - SE
            </p>
            <p className="text-sm font-bold text-white">(79) 3014-0499</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">© 2026 Imperial Barra Stones. All Rights Reserved.</p>
        <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-gray-400">
           <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-pulse shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
           Sistema em Operação
        </div>
      </div>
    </footer>
  );
};

export default function LandingPage() {
  return (
    <main className="bg-[#0D0D12] min-h-screen selection:bg-[#C9A84C] selection:text-black font-sans scroll-smooth overflow-x-hidden">
      <NoiseOverlay />
      <Navbar />
      <Hero />
      <Materials />
      <Process />
      <Contact />
      <Footer />
      
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0% }
          100% { top: 100% }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </main>
  );
}
