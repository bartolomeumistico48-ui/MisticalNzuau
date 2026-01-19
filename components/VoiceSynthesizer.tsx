
import React, { useState, useRef, useMemo } from 'react';
import { synthesizePrayer, synthesizeChant, audioBufferToWav } from '../services/audioService';
import { Ebook } from '../types';

interface Props {
  ebook: Ebook | null;
}

export const VoiceSynthesizer: React.FC<Props> = ({ ebook }) => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<'Charon' | 'Kore' | 'Puck'>('Charon');
  const [isLoading, setIsLoading] = useState(false);
  const [genType, setGenType] = useState<'speech' | 'chant'>('speech');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<{ text: string, url: string, date: Date, type: string }[]>([]);
  
  // Frequency derived from ebook or default
  const targetFrequency = useMemo(() => {
    if (!ebook || ebook.chapters.length === 0) return "432Hz";
    return ebook.chapters[0].frequency || "432Hz";
  }, [ebook]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleSynthesize = async (type: 'speech' | 'chant') => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setGenType(type);
    
    try {
      const buffer = type === 'speech' 
        ? await synthesizePrayer(text, voice)
        : await synthesizeChant(text, voice);
      
      // Add a simple frequency enhancement if it's a chant
      if (type === 'chant' && targetFrequency) {
        const freqValue = parseInt(targetFrequency) || 432;
        // Logic for frequency harmonization could be added here during playback
        // For now we rely on the prompt's ritual instructions
      }

      const wavBlob = audioBufferToWav(buffer);
      const url = URL.createObjectURL(wavBlob);
      
      setAudioUrl(url);
      setHistory(prev => [{ text, url, date: new Date(), type }, ...prev.slice(0, 4)]);
    } catch (err) {
      console.error("Erro na síntese de voz:", err);
      alert("A canalização de áudio falhou. A rede do Aeon pode estar instável.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAudio = (url: string, content: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aeon_${genType}_${content.slice(0, 10).replace(/\s+/g, '_')}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-12">
        <h2 className="cinzel text-4xl mb-4 tracking-widest text-white">Laboratório de Voz</h2>
        <p className="text-sm italic text-gray-400">
          "Transforme palavras profanas em vibrações sagradas de Ngolo."
        </p>
        {ebook && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <span className="text-[8px] text-amber-500 uppercase font-mono tracking-widest">Sintonizado com o Codex:</span>
            <span className="text-[10px] text-amber-400 font-bold font-mono">{targetFrequency}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative group">
            <label className="block text-left text-[9px] text-amber-500/50 uppercase tracking-widest mb-2 ml-1 font-mono">Manuscrito para Transmutação</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite um texto curto para ser transformado em voz ou canto ritualístico..."
              maxLength={200}
              className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-6 text-amber-50 outline-none focus:border-amber-500 transition-all font-serif text-lg custom-scrollbar resize-none shadow-inner"
            />
            <div className="absolute bottom-4 right-4 text-[9px] font-mono text-gray-600">
              {text.length} / 200
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6 border border-white/5 bg-white/5 rounded-2xl">
            <div>
              <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-3 font-mono">Selecione a Entidade Vocal</label>
              <div className="grid grid-cols-3 gap-3">
                {(['Charon', 'Kore', 'Puck'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setVoice(v)}
                    className={`py-3 px-4 border rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${
                      voice === v 
                      ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                      : 'border-white/10 text-gray-500 hover:border-white/30'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => handleSynthesize('speech')}
                disabled={!text.trim() || isLoading}
                className={`flex-1 px-6 py-5 font-bold tracking-[0.2em] uppercase transition-all transform hover:scale-[1.02] rounded-2xl flex items-center justify-center gap-3 ${
                  !text.trim() || (isLoading && genType === 'chant')
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                  : (isLoading && genType === 'speech') ? 'bg-cyan-600/50 text-white animate-pulse' : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-lg shadow-cyan-900/40'
                }`}
              >
                {isLoading && genType === 'speech' ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                )}
                SINTETIZAR VOZ
              </button>

              <button 
                onClick={() => handleSynthesize('chant')}
                disabled={!text.trim() || isLoading}
                className={`flex-1 px-6 py-5 font-bold tracking-[0.2em] uppercase transition-all transform hover:scale-[1.02] rounded-2xl flex items-center justify-center gap-3 ${
                  !text.trim() || (isLoading && genType === 'speech')
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                  : (isLoading && genType === 'chant') ? 'bg-purple-600/50 text-white animate-pulse' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40'
                }`}
              >
                {isLoading && genType === 'chant' ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                )}
                GERAR CANTO
              </button>
            </div>
          </div>

          {audioUrl && (
            <div className="p-6 border border-cyan-500/30 bg-cyan-950/10 rounded-2xl animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-[0.2em]">
                  {genType === 'chant' ? 'Ressonância Melódica Ativa' : 'Canalização Vocal Ativa'}
                </span>
                <button 
                  onClick={() => downloadAudio(audioUrl, text)}
                  className="text-[9px] text-cyan-500 hover:text-cyan-300 flex items-center gap-2 uppercase font-bold transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Exportar .wav
                </button>
              </div>
              <audio ref={audioRef} src={audioUrl} controls className="w-full accent-cyan-500" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 border border-white/5 bg-black/20 rounded-2xl h-full flex flex-col">
            <h3 className="cinzel text-sm text-amber-500 mb-6 uppercase tracking-widest border-b border-white/5 pb-4">Registros de Ngolo</h3>
            {history.length === 0 ? (
              <div className="text-center py-20 opacity-20 flex-grow flex flex-col justify-center">
                <p className="text-[10px] uppercase tracking-widest">Nenhum eco registrado</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
                {history.map((item, idx) => (
                  <div key={idx} className="p-4 border border-white/5 bg-white/5 rounded-xl hover:border-amber-500/30 transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[7px] px-1.5 py-0.5 rounded uppercase font-bold ${item.type === 'chant' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 italic line-clamp-2 mb-3">"{item.text}"</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-gray-600 font-mono">{item.date.toLocaleTimeString()}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setAudioUrl(item.url);
                            setGenType(item.type as any);
                          }}
                          className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded transition-all"
                          title="Recuperar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </button>
                        <button 
                          onClick={() => downloadAudio(item.url, item.text)}
                          className="p-1.5 text-cyan-500 hover:bg-cyan-500/10 rounded transition-all"
                          title="Baixar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-auto pt-6 border-t border-white/5 opacity-30">
               <p className="text-[8px] text-center uppercase tracking-[0.2em]">O silêncio é a primeira nota da criação.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
