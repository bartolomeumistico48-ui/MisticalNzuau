
import React, { useState } from 'react';
import { generateRitualQuestionnaire, generateRitualAdvice } from '../services/geminiService';
import { RitualQuestion, RitualAdvice } from '../types';

export const RitualZone: React.FC = () => {
  const [task, setTask] = useState('');
  const [questions, setQuestions] = useState<RitualQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [advice, setAdvice] = useState<RitualAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'diagnostic' | 'result'>('input');

  const handleStartDiagnostic = async () => {
    if (!task.trim()) return;
    setLoading(true);
    try {
      const q = await generateRitualQuestionnaire(task);
      setQuestions(q);
      setStep('diagnostic');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishDiagnostic = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Por favor, sintonize todas as respostas.");
      return;
    }
    setLoading(true);
    try {
      const formattedAnswers = questions.map(q => ({
        question: q.question,
        answer: answers[q.id]
      }));
      const res = await generateRitualAdvice(task, formattedAnswers);
      setAdvice(res);
      setStep('result');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadRitualPDF = () => {
    if (!advice) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor, permita pop-ups para exportar o rito.");
      return;
    }

    const htmlContent = `
      <html>
      <head>
        <title>Rito de Manifestação: ${advice.ritualName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Space+Mono&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 0; }
          body { 
            margin: 0; padding: 0; 
            background: #011a12; 
            font-family: 'Cinzel', serif;
            color: #d4af37;
          }
          .page {
            position: relative; 
            padding: 30mm 25mm; 
            min-height: 297mm; 
            box-sizing: border-box;
            border: 15px solid #d4af37;
            background: radial-gradient(circle at center, #022b1e 0%, #011a12 100%);
            overflow: hidden;
          }
          .header { text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 20px; margin-bottom: 40px; }
          .header h1 { font-size: 28pt; margin: 0; letter-spacing: 5px; text-transform: uppercase; }
          
          .status { 
            text-align: center; margin-bottom: 40px; 
            padding: 10px; border: 1px solid ${advice.isOptimal ? '#10b981' : '#d4af37'};
            color: ${advice.isOptimal ? '#10b981' : '#d4af37'};
            font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;
          }

          .section-title { 
            font-size: 12pt; text-transform: uppercase; letter-spacing: 3px; border-left: 4px solid #d4af37; 
            padding-left: 15px; margin-bottom: 15px; font-weight: bold;
          }

          .element-item { 
            display: inline-block; padding: 5px 15px; border: 1px solid rgba(212, 175, 55, 0.3); 
            border-radius: 20px; font-size: 9pt; color: #fff; margin: 5px;
          }

          .instruction-step { margin-bottom: 10px; padding: 10px; border-left: 2px solid #10b981; background: rgba(16, 185, 129, 0.05); }

          .footer { 
            position: absolute; bottom: 15mm; left: 0; right: 0; text-align: center; 
            font-size: 7pt; color: #d4af37; opacity: 0.5; text-transform: uppercase; letter-spacing: 5px;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1>${advice.ritualName}</h1>
          </div>
          <div class="status">DIAGNÓSTICO: ${advice.isOptimal ? 'HARMONIA TOTAL' : 'AJUSTE NECESSÁRIO'}</div>
          <p style="font-style: italic; text-align: center;">${advice.explanation}</p>
          <div class="section-title">ELEMENTOS</div>
          <div>${advice.elements.map(el => `<span class="element-item">${el}</span>`).join('')}</div>
          <div class="section-title" style="margin-top: 20px;">CAMINHO DO RITO</div>
          ${advice.instructions.map((inst, i) => `<div class="instruction-step">${i+1}. ${inst}</div>`).join('')}
          <div class="footer">AEON PIPELINE • PROTOCOLO ESMERALDA</div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const reset = () => {
    setTask('');
    setQuestions([]);
    setAnswers({});
    setAdvice(null);
    setStep('input');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in duration-700">
      <header className="text-center space-y-4">
        <h2 className="cinzel text-5xl text-emerald-500 tracking-[0.1em] drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">ZONA DE RITUAIS</h2>
        <p className="text-[10px] text-amber-500/60 uppercase tracking-[0.4em] font-bold">A Alquimia da Cozinha e do Vácuo</p>
      </header>

      <div className="bg-[#021a12] border-2 border-amber-500/30 rounded-[40px] p-8 md:p-12 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
        {/* Sacred Geometry Overlays */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/sacred-geometry.png')]"></div>

        {step === 'input' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="space-y-4">
              <label className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold ml-2">Intencione sua Manifestação</label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Qual portal você deseja abrir hoje?"
                className="w-full h-32 bg-black/40 border border-emerald-900/40 rounded-3xl p-6 outline-none focus:border-emerald-500 text-emerald-50 font-serif italic transition-all resize-none shadow-inner"
              />
            </div>
            <button
              onClick={handleStartDiagnostic}
              disabled={loading || !task.trim()}
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-[0.4em] rounded-2xl transition-all disabled:opacity-30 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              {loading ? "INVOCANDO PROTOCOLO..." : "SINTONIZAR REALIDADE"}
            </button>
          </div>
        )}

        {step === 'diagnostic' && (
          <div className="space-y-10 animate-in fade-in">
            <div className="space-y-8">
              {questions.map((q) => (
                <div key={q.id} className="space-y-4 border-b border-emerald-900/30 pb-8">
                  <h4 className="text-emerald-100 font-serif italic text-xl">{q.question}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        className={`p-4 rounded-xl border text-left text-xs transition-all ${
                          answers[q.id] === opt 
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)]' 
                          : 'border-emerald-900/50 bg-black/40 text-emerald-700 hover:border-emerald-700 hover:text-emerald-500'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleFinishDiagnostic}
              disabled={loading}
              className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.4em] rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              {loading ? "COLAPSANDO ONDA..." : "REVELAR RITO SAGRADO"}
            </button>
          </div>
        )}

        {step === 'result' && advice && (
          <div className="space-y-12 animate-in zoom-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-center gap-10">
              {advice.imageUrl && (
                <div className="w-64 h-64 shrink-0 rounded-3xl border-4 border-amber-500/50 overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                  <img src={advice.imageUrl} alt="Sacred Manifestation" className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-1000" />
                </div>
              )}
              <div className="space-y-4 text-center lg:text-left">
                <div className={`inline-block px-4 py-1 rounded-full border text-[9px] font-bold uppercase tracking-[0.2em] mb-2 ${advice.isOptimal ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-amber-500 text-amber-400 bg-amber-500/10'}`}>
                   Diagnóstico: {advice.isOptimal ? 'Sincronia Perfeita' : 'Ajuste Vibracional'}
                </div>
                <h3 className="cinzel text-5xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{advice.ritualName}</h3>
                <p className="text-emerald-100/60 italic text-lg leading-relaxed max-w-xl">"{advice.explanation}"</p>
              </div>
            </div>

            {/* Elements & Warning */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-amber-500 font-bold border-l-2 border-amber-500 pl-3">Catalisadores de Cozinha</h4>
                <div className="flex flex-wrap gap-2">
                  {advice.elements.map(el => (
                    <span key={el} className="px-4 py-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-200 font-mono shadow-sm">
                      {el}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-red-950/10 border border-red-900/30 rounded-3xl space-y-2">
                <h4 className="text-[10px] uppercase text-red-500 font-bold">Guarda do Vácuo</h4>
                <p className="text-[11px] text-red-200/70 italic leading-relaxed">{advice.warning}</p>
              </div>
            </div>

            {/* Summarized Instructions Flow */}
            <div className="space-y-8 relative">
              <h4 className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold border-l-2 border-emerald-500 pl-3">Fluxo de Manifestação</h4>
              <div className="flex flex-col items-center gap-6">
                {advice.instructions.map((inst, i) => (
                  <React.Fragment key={i}>
                    <div className="w-full group">
                      <div className="relative p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all duration-300 transform hover:-translate-y-1">
                        <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-amber-600 text-black flex items-center justify-center font-bold cinzel text-sm shadow-[0_0_10px_rgba(217,119,6,0.5)]">
                          {i + 1}
                        </span>
                        <p className="text-emerald-50 text-xl font-serif text-center">{inst}</p>
                      </div>
                    </div>
                    {i < advice.instructions.length - 1 && (
                      <div className="animate-bounce">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-10 flex flex-col md:flex-row gap-4 border-t border-emerald-900/30">
               <button onClick={reset} className="flex-1 py-5 border border-emerald-800 text-emerald-700 hover:text-emerald-400 hover:border-emerald-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">Novo Ciclo</button>
               <button onClick={downloadRitualPDF} className="flex-1 py-5 bg-amber-600/10 border border-amber-600/50 text-amber-500 hover:bg-amber-600/30 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                 Selar em PDF
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
