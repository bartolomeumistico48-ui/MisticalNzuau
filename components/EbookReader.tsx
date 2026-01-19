
import React, { useState, useEffect } from 'react';
import { Ebook, Chapter, StudentProgress } from '../types';
import { AudioResonator } from './AudioResonator';

interface Props {
  ebook: Ebook;
}

const SIDEBAR_STORAGE_KEY = 'aeon_sidebar_open';
const PROGRESS_KEY = 'aeon_spiritual_progress';

export const EbookReader: React.FC<Props> = ({ ebook }) => {
  const [activeChapter, setActiveChapter] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isBinding, setIsBinding] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved !== null ? saved === 'true' : true;
  });
  
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  const chapter: Chapter = ebook.chapters[activeChapter];

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBindToSchool = () => {
    setIsBinding(true);
    setTimeout(() => {
      const saved = localStorage.getItem(PROGRESS_KEY);
      const progress: StudentProgress = saved ? JSON.parse(saved) : { level: 'Kizola', experience: 0, lessonsCompleted: [] };
      progress.linkedSeed = `Capítulo: ${chapter.title}. Contexto: ${chapter.objective}. Conteúdo: ${chapter.content.slice(0, 300)}...`;
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      setIsBinding(false);
      alert(`CONEXÃO ESTABELECIDA!\n\nA semente de "${chapter.title}" foi enviada para o vácuo da Escola Ancestral.`);
    }, 1200);
  };

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor, permita pop-ups para exportar o PDF.");
      return;
    }
    // PDF content logic...
    printWindow.document.write(`<html><body><h1>${ebook.title}</h1><p>${chapter.content}</p></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 animate-in fade-in duration-700 relative">
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-8 z-[90] w-14 h-14 bg-[#d4af37] text-black rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center hover:scale-110 transition-all"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m18 15-6-6-6 6"/></svg>
        </button>
      )}

      <aside className={`lg:flex-shrink-0 transition-all duration-700 ${sidebarOpen ? 'lg:w-96 w-full' : 'lg:w-20 w-full'}`}>
        <div className="border border-[#d4af37]/20 rounded-[40px] bg-black/60 backdrop-blur-3xl sticky top-32 overflow-hidden flex flex-col h-[calc(100vh-180px)] shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            {sidebarOpen && <h2 className="cinzel text-[#d4af37] truncate text-xs font-black tracking-widest">Câmara de Leitura</h2>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 hover:bg-emerald-500/10 rounded-2xl text-emerald-500 transition-all">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={sidebarOpen ? "M18 6 6 18M6 6l12 12" : "M3 12h18M3 6h18M3 18h18"}/></svg>
            </button>
          </div>

          {sidebarOpen && (
            <div className="p-8 space-y-8 flex-grow overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <button onClick={downloadPDF} className="w-full flex items-center justify-between p-5 rounded-2xl border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-all text-[11px] font-black uppercase tracking-widest group">
                   <span>EXPORTAR REGISTRO</span>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                
                <button 
                  onClick={handleBindToSchool}
                  disabled={isBinding}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-widest group ${
                    isBinding 
                    ? 'border-[#d4af37]/50 bg-[#d4af37]/20 text-[#d4af37] animate-pulse' 
                    : 'border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10'
                  }`}
                >
                   <span>{isBinding ? 'ENTRELAÇANDO...' : 'VINCULAR À ESCOLA'}</span>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isBinding ? 'animate-spin' : ''}>
                     <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                     <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                   </svg>
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-emerald-900 uppercase tracking-widest block mb-4 px-2 font-black">Segmentos Disponíveis</span>
                {ebook.chapters.map((ch, idx) => (
                  <button key={idx} onClick={() => setActiveChapter(idx)} className={`w-full text-left p-4 rounded-2xl text-[11px] border-l-4 transition-all ${activeChapter === idx ? 'border-[#d4af37] bg-emerald-500/5 text-[#d4af37] font-black' : 'border-transparent text-gray-500 hover:text-emerald-300'}`}>
                    {idx+1}. {ch.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-grow pb-24 max-w-5xl">
        <div key={activeChapter} className="animate-in fade-in slide-in-from-top-12 duration-700">
           <div className="mb-14 border-b border-emerald-900/20 pb-10">
              <span className="text-[11px] text-[#d4af37] uppercase font-black tracking-[0.5em]">{chapter.objective}</span>
              <h1 className="cinzel text-7xl text-white mt-6 leading-tight drop-shadow-[0_0_10px_rgba(212,175,55,0.1)]">{chapter.title}</h1>
              <div className="mt-6 flex gap-8 text-[11px] text-emerald-500/50 font-mono">
                <span>RESONÂNCIA: {chapter.frequency}</span>
                <span>ORIGEM: {ebook.title}</span>
              </div>
           </div>
           
           <AudioResonator text={chapter.content} frequency={chapter.frequency} />

           <div className="text-emerald-50/90 leading-[1.9] space-y-10 font-serif text-2xl mt-16 whitespace-pre-wrap first-letter:text-7xl first-letter:font-black first-letter:text-[#d4af37] first-letter:mr-4 first-letter:float-left first-letter:drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">
              {chapter.content}
           </div>

           <div className="mt-24 p-12 border border-[#d4af37]/30 bg-emerald-950/5 rounded-[50px] relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-[#d4af37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <h4 className="text-[11px] uppercase text-[#d4af37] mb-6 font-black tracking-[0.5em] flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/></svg>
                Nota de Torção Quântica
              </h4>
              <p className="text-2xl text-emerald-100/80 italic leading-relaxed relative z-10">{chapter.quantumNote}</p>
           </div>
        </div>
      </main>
    </div>
  );
};
