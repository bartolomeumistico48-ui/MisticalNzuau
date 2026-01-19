
import React, { useState, useEffect } from 'react';
import { SpiritualLevel, Lesson, StudentProgress } from '../types';
import { generateAncestralLesson, evaluateResponse } from '../services/geminiService';
import { AudioResonator } from './AudioResonator';

const PROGRESS_KEY = 'aeon_spiritual_progress';

export const AncestralSchool: React.FC = () => {
  const [progress, setProgress] = useState<StudentProgress>(() => {
    const saved = localStorage.getItem(PROGRESS_KEY);
    return saved ? JSON.parse(saved) : { level: 'Kizola', experience: 0, lessonsCompleted: [] };
  });

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studentResponse, setStudentResponse] = useState('');
  const [feedback, setFeedback] = useState<{ score: number, feedback: string } | null>(null);

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const fetchLesson = async () => {
    setIsLoading(true);
    setFeedback(null);
    setStudentResponse('');
    try {
      const lesson = await generateAncestralLesson(progress.level, progress.lessonsCompleted, progress.linkedSeed);
      setCurrentLesson(lesson);
      if (progress.linkedSeed) {
        setProgress(prev => ({ ...prev, linkedSeed: undefined }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadLessonPDF = () => {
    if (!currentLesson) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><body style="font-family:serif; padding:50px;"><h1>${currentLesson.title}</h1><p>${currentLesson.content}</p></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSubmitResponse = async () => {
    if (!currentLesson || !studentResponse.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await evaluateResponse(progress.level, currentLesson.title, studentResponse);
      setFeedback(result);
      const newExp = progress.experience + result.score;
      let newLevel = progress.level;
      let finalExp = newExp;
      if (newExp >= 100) {
        if (progress.level === 'Kizola') newLevel = 'Ngangu';
        else if (progress.level === 'Ngangu') newLevel = 'Ngolo';
        else if (progress.level === 'Ngolo') newLevel = 'Kimuntu';
        finalExp = 0;
      }
      setProgress(prev => ({
        ...prev,
        level: newLevel,
        experience: finalExp,
        lessonsCompleted: [...prev.lessonsCompleted, currentLesson.title]
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (lvl: SpiritualLevel) => {
    switch(lvl) {
      case 'Kizola': return 'text-emerald-400';
      case 'Ngangu': return 'text-[#d4af37]';
      case 'Ngolo': return 'text-emerald-600';
      case 'Kimuntu': return 'text-amber-300';
      default: return 'text-white';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-10 animate-in fade-in duration-1000">
      <header className="text-center space-y-6">
        <h2 className="cinzel text-6xl text-white tracking-[0.2em] esoteric-glow">ACADEMIA DE NGOLO</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-10">
          <div className="text-center">
            <span className="text-[10px] text-emerald-900 uppercase tracking-[0.4em] block mb-2 font-black">Status do Muntu</span>
            <span className={`cinzel text-3xl font-black ${getLevelColor(progress.level)} drop-shadow-lg`}>{progress.level}</span>
          </div>
          <div className="w-full max-w-lg h-3 bg-emerald-950/40 rounded-full overflow-hidden border border-[#d4af37]/20 relative shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-[#d4af37] to-emerald-500 transition-all duration-1000" 
              style={{ width: `${progress.experience}%` }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white/50 uppercase tracking-[0.5em]">
              Sincronia: {progress.experience}%
            </div>
          </div>
        </div>
      </header>

      {!currentLesson ? (
        <div className="text-center py-28 bg-emerald-950/5 border-2 border-dashed border-emerald-500/20 rounded-[50px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-[#d4af37]/5"></div>
          {progress.linkedSeed && (
            <div className="mb-10 inline-block px-6 py-3 bg-[#d4af37]/10 border border-[#d4af37]/50 rounded-full animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <span className="text-[11px] text-[#d4af37] font-black uppercase tracking-[0.3em]">Semente Estelar Detectada</span>
            </div>
          )}
          <p className="text-2xl text-emerald-100/60 italic mb-12 font-serif">"A luz que você busca é a luz que já emana do seu vácuo interno."</p>
          <button 
            onClick={fetchLesson}
            disabled={isLoading}
            className="px-16 py-6 bg-[#d4af37] text-black cinzel font-black tracking-[0.4em] rounded-3xl hover:bg-[#c19b2e] transition-all transform hover:scale-110 shadow-[0_15px_40px_rgba(212,175,55,0.3)]"
          >
            {isLoading ? "CONVOCANDO MWALIMU..." : "INICIAR APRENDIZADO"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10 animate-in slide-in-from-left-12 duration-700">
            <article className="bg-black/70 border border-emerald-500/20 p-12 rounded-[50px] space-y-8 relative shadow-2xl">
              <div className="absolute top-8 right-8">
                 <button onClick={downloadLessonPDF} className="p-4 bg-emerald-500/5 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-3xl text-[#d4af37] transition-all" title="Selar Lição">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                 </button>
              </div>
              
              <div className="flex flex-col gap-4">
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.6em]">{progress.level} • LIÇÃO ATUAL</span>
                <h3 className="cinzel text-5xl text-white pr-16 leading-tight">{currentLesson.title}</h3>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {currentLesson.kikongoTerms.map(term => (
                  <span key={term} className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full uppercase font-mono font-bold tracking-wider">{term}</span>
                ))}
              </div>

              <div className="text-emerald-50/80 leading-relaxed text-2xl font-serif italic py-6 border-y border-white/5">
                {currentLesson.content}
              </div>

              <AudioResonator text={currentLesson.content} frequency={currentLesson.frequency} />

              <div className="pt-8">
                <h4 className="text-[11px] text-[#d4af37] uppercase font-black tracking-[0.5em] mb-6 flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
                  Exercício de Manifestação
                </h4>
                <p className="text-xl text-emerald-200/70 italic bg-emerald-500/5 p-8 rounded-[35px] border border-emerald-500/20 shadow-inner">
                  {currentLesson.practice}
                </p>
              </div>
            </article>

            <div className="bg-black/40 p-10 rounded-[40px] border border-[#d4af37]/20 shadow-xl">
              <h4 className="text-[11px] text-gray-500 uppercase tracking-[0.5em] mb-6 font-black">Depoimento de Ngolo (Sua Percepção)</h4>
              <textarea 
                value={studentResponse}
                onChange={(e) => setStudentResponse(e.target.value)}
                placeholder="Como a frequência desta lição colapsou em sua consciência?"
                className="w-full h-48 bg-emerald-950/20 border border-emerald-500/20 rounded-[30px] p-8 outline-none focus:border-[#d4af37] text-white transition-all resize-none font-serif text-xl placeholder:text-emerald-900/30"
              />
              <button 
                onClick={handleSubmitResponse}
                disabled={!studentResponse.trim() || isLoading}
                className="mt-8 w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-black font-black tracking-[0.5em] rounded-2xl transition-all shadow-lg hover:translate-y-[-2px]"
              >
                {isLoading ? "ANALISANDO VIBRAÇÃO..." : "SUBMETER AO CONSELHO MWALIMU"}
              </button>
            </div>
          </div>

          <div className="space-y-10">
            {feedback && (
              <div className="p-10 bg-black/80 border-4 border-[#d4af37]/40 rounded-[50px] animate-in zoom-in duration-500 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="text-center mb-8">
                  <div className="text-7xl font-black text-[#d4af37] mb-3 drop-shadow-md">+{feedback.score}</div>
                  <div className="text-[11px] text-emerald-400 uppercase tracking-[0.4em] font-black">Avanço Espiritual</div>
                </div>
                <p className="text-lg text-emerald-100 italic leading-relaxed border-t border-white/5 pt-8 text-center">
                  "{feedback.feedback}"
                </p>
                <button onClick={fetchLesson} className="mt-12 w-full py-5 border-2 border-[#d4af37] text-[#d4af37] text-[11px] font-black uppercase tracking-[0.4em] rounded-3xl hover:bg-[#d4af37] hover:text-black transition-all shadow-md">
                  Nova Canalização
                </button>
              </div>
            )}

            <div className="p-10 bg-emerald-950/10 border border-emerald-500/20 rounded-[40px] shadow-sm">
              <h4 className="cinzel text-[10px] text-[#d4af37] uppercase tracking-[0.4em] border-b border-white/5 pb-6 mb-8 font-black">Ancestros Contatados</h4>
              <div className="space-y-4">
                {progress.lessonsCompleted.slice(-8).map((l, i) => (
                  <div key={i} className="flex items-center gap-4 text-[11px] text-emerald-500/60 group">
                    <div className="w-2 h-2 bg-[#d4af37] rounded-full group-hover:scale-150 transition-all"></div>
                    <span className="truncate group-hover:text-white transition-all">{l}</span>
                  </div>
                ))}
                {progress.lessonsCompleted.length === 0 && <p className="text-[11px] text-emerald-900 italic">Sua linhagem aguarda o despertar.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
