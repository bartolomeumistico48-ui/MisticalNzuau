
import React, { useState, useRef, useEffect } from 'react';
import { OracleMessage, RitualPhase, OracleSettings } from '../types';
import { consultOracle } from '../services/geminiService';
import { synthesizePrayer, audioBufferToWav } from '../services/audioService';
import JSZip from 'jszip';

const STORAGE_KEY = 'aeon_oracle_history';
const PHASE_KEY = 'aeon_ritual_phase';
const SETTINGS_KEY = 'aeon_oracle_settings';

const PHASE_FREQUENCIES: Record<RitualPhase, number> = {
  [RitualPhase.INITIATION]: 432,
  [RitualPhase.PURIFICATION]: 528,
  [RitualPhase.ILLUMINATION]: 639,
  [RitualPhase.ASCENSION]: 741,
  [RitualPhase.HOLY_DOMAIN]: 852
};

export const OracleAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<OracleMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [currentPhase, setCurrentPhase] = useState<RitualPhase>(RitualPhase.INITIATION);
  const [settings, setSettings] = useState<OracleSettings>({
    voice: 'Charon',
    rate: 1.0,
    autoPlay: true
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const uiAudioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const droneRef = useRef<{ nodes: AudioNode[] } | null>(null);
  const prevPhaseRef = useRef<RitualPhase>(currentPhase);
  const hasMounted = useRef(false);

  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    const savedPhase = localStorage.getItem(PHASE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    
    if (savedMessages) {
      try { setMessages(JSON.parse(savedMessages)); } catch (e) {}
    }
    if (savedPhase) {
      setCurrentPhase(savedPhase as RitualPhase);
      prevPhaseRef.current = savedPhase as RitualPhase;
    }
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) {}
    }
    hasMounted.current = true;
  }, []);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    localStorage.setItem(PHASE_KEY, currentPhase);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [messages, currentPhase, settings]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  const startBackgroundDrone = (frequency: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const nodes: AudioNode[] = [];
    const now = ctx.currentTime;
    
    const masterDroneGain = ctx.createGain();
    masterDroneGain.gain.setValueAtTime(0, now);
    masterDroneGain.gain.linearRampToValueAtTime(0.04, now + 2.0);
    masterDroneGain.connect(ctx.destination);
    nodes.push(masterDroneGain);

    // Multi-layered harmonic drone
    [1, 1.5, 2, 0.5, 4.02].forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(frequency * mult, now);
      
      // Detune slightly for chorusing effect
      osc.detune.setValueAtTime((Math.random() - 0.5) * 10, now);
      
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime((Math.random() - 0.5), now);
      
      gain.gain.setValueAtTime(0.15 / (i + 1), now);
      
      osc.connect(panner);
      panner.connect(gain);
      gain.connect(masterDroneGain);
      osc.start();
      nodes.push(osc, gain, panner);
    });

    // Zen Noise Layer (Deep wind)
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) output[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    noise.connect(filter);
    filter.connect(masterDroneGain);
    noise.start();
    nodes.push(noise, filter);

    droneRef.current = { nodes };
  };

  const stopBackgroundDrone = () => {
    if (droneRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      droneRef.current.nodes.forEach(node => {
        if (node instanceof GainNode) {
          node.gain.cancelScheduledValues(now);
          node.gain.linearRampToValueAtTime(0, now + 2.0);
        }
      });
      setTimeout(() => {
        droneRef.current?.nodes.forEach(node => {
          try {
            if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) node.stop();
            node.disconnect();
          } catch(e) {}
        });
        droneRef.current = null;
      }, 2100);
    }
  };

  const playUISound = async (type: 'open' | 'close' | 'phase') => {
    try {
      if (!uiAudioCtxRef.current) {
        uiAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = uiAudioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.1, now + 0.05);

      if (type === 'open') {
        [220, 277.18, 329.63, 440].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + i * 0.05 + 0.3);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, now + i * 0.05);
          g.gain.linearRampToValueAtTime(0.3, now + i * 0.05 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.4);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.5);
        });
      } else if (type === 'close') {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(82.41, now + 0.5);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'phase') {
        const fundamental = 174.61;
        [1, 2.76, 5.4, 8.93, 11.34].forEach((harmonic, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(fundamental * harmonic, now);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.08 / (i + 1), now + 0.2);
          g.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(now);
          osc.stop(now + 3.0);
        });
      }
    } catch (e) {
      console.warn("Audio UI error:", e);
    }
  };

  useEffect(() => {
    if (!hasMounted.current) return;
    playUISound(isOpen ? 'open' : 'close');
  }, [isOpen]);

  useEffect(() => {
    if (!hasMounted.current) return;
    if (currentPhase !== prevPhaseRef.current) {
      playUISound('phase');
      prevPhaseRef.current = currentPhase;
    }
  }, [currentPhase]);

  const playOracleVoice = async (text: string) => {
    try {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
        audioSourceRef.current = null;
      }
      const buffer = await synthesizePrayer(text, settings.voice);
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = settings.rate;
      source.connect(ctx.destination);
      const freq = PHASE_FREQUENCIES[currentPhase] || 432;
      startBackgroundDrone(freq);
      source.start(0);
      audioSourceRef.current = source;
      source.onended = () => {
        stopBackgroundDrone();
        audioSourceRef.current = null;
      };
    } catch (err: any) {
      console.error("Oracle voice error:", err);
      stopBackgroundDrone();
    }
  };

  const handleDownloadMessageAudio = async (text: string, index: number) => {
    try {
      const buffer = await synthesizePrayer(text, settings.voice);
      const wavBlob = audioBufferToWav(buffer);
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pneuma_Manifestation_${index + 1}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download audio error:", err);
      alert(`Falha na manifestação sonora: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = messages.map(m => `
      <div class="message ${m.role}">
        <div class="role">${m.role === 'user' ? 'MUNTU' : 'ORÁCULO'}</div>
        <div class="text">${m.text.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Pneuma Oracle Registry</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          body { 
            font-family: 'Cinzel', serif; 
            background: radial-gradient(circle at center, #D4AF37 0%, #ffd700 10%, #008000 70%, #004d00 100%) !important;
            color: #ffffff;
            margin: 0;
            padding: 0;
            min-height: 297mm;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80pt;
            color: rgba(255, 255, 255, 0.08);
            text-shadow: 0 0 25px rgba(212, 175, 55, 0.2), 0 0 10px rgba(0, 255, 0, 0.1);
            white-space: nowrap;
            pointer-events: none;
            z-index: 1;
            text-transform: uppercase;
            letter-spacing: 30px;
            font-weight: bold;
          }
          .dikenga-symbol {
            position: absolute;
            top: 20mm;
            right: 20mm;
            width: 35mm;
            height: 35mm;
            opacity: 0.8;
            filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.8));
          }
          .container {
            position: relative;
            z-index: 2;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 30mm 25mm;
            box-sizing: border-box;
          }
          .overlay {
            position: absolute;
            top: 15mm;
            left: 15mm;
            right: 15mm;
            bottom: 15mm;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(12px);
            border: 2px solid #D4AF37;
            border-radius: 6px;
            z-index: -1;
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.9);
          }
          h1 { 
            text-align: center; 
            color: #D4AF37 !important; 
            font-size: 28pt; 
            border-bottom: 2px solid #D4AF37;
            padding-bottom: 20px;
            margin-bottom: 40px;
            letter-spacing: 10px;
            text-transform: uppercase;
            text-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
          }
          .message { 
            margin-bottom: 25px; 
            padding: 20px; 
            border-left: 3px solid rgba(255, 255, 255, 0.2);
            background: rgba(255, 255, 255, 0.05);
            border-radius: 0 4px 4px 0;
          }
          .oracle { border-left-color: #d4af37; background: rgba(212, 175, 55, 0.03); }
          .role { 
            font-weight: bold; 
            font-size: 10pt; 
            text-transform: uppercase; 
            margin-bottom: 10px; 
            color: #D4AF37;
            letter-spacing: 3px;
          }
          .text { font-size: 12pt; line-height: 1.7; text-align: justify; }
          .footer {
            margin-top: auto;
            text-align: center;
            font-size: 9pt;
            color: #D4AF37 !important;
            border-top: 1px solid rgba(212, 175, 55, 0.4);
            padding-top: 25px;
            text-transform: uppercase;
            letter-spacing: 5px;
          }
        </style>
      </head>
      <body>
        <div class="watermark">PNEUMA ORACLE</div>
        <div class="dikenga-symbol">
          <svg viewBox="0 0 100 100">
            <line x1="10" y1="50" x2="90" y2="50" stroke="#D4AF37" stroke-width="2" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="#D4AF37" stroke-width="2" />
            <circle cx="50" cy="50" r="5" fill="#D4AF37" />
            <circle cx="10" cy="50" r="3" fill="#D4AF37" />
            <circle cx="90" cy="50" r="3" fill="#D4AF37" />
            <circle cx="50" cy="10" r="3" fill="#D4AF37" />
            <circle cx="50" cy="90" r="3" fill="#D4AF37" />
          </svg>
        </div>
        <div class="container">
          <div class="overlay"></div>
          <h1>MANIFESTAÇÃO DE PNEUMA</h1>
          ${content}
          <div class="footer">SINTETIZADO VIA AEON PIPELINE • REGISTRO DE NGOLO • © ${new Date().getFullYear()}</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  const handleExportAllAudioZip = async () => {
    if (isExporting) return;
    const oracleMessages = messages.filter(m => m.role === 'oracle');
    if (oracleMessages.length === 0) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: oracleMessages.length });
    try {
      const zip = new JSZip();
      const folder = zip.folder("Ngolo_Resonances");
      for (let i = 0; i < oracleMessages.length; i++) {
        setExportProgress({ current: i + 1, total: oracleMessages.length });
        try {
          const buffer = await synthesizePrayer(oracleMessages[i].text, settings.voice);
          const wavBlob = audioBufferToWav(buffer);
          folder?.file(`ngolo_manifest_${i + 1}.wav`, wavBlob);
        } catch (err) {
          console.warn(`Pular mensagem ${i + 1} devido a erro de síntese`);
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url; link.download = `Pneuma_Session_Ngolo.zip`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export ZIP error:", err);
      alert(`Erro ao exportar arquivo ZIP: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: OracleMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      const response = await consultOracle(input, newMessages, currentPhase);
      const oracleMsg: OracleMessage = { role: 'oracle', text: response };
      setMessages(prev => [...prev, oracleMsg]);
      if (settings.autoPlay) playOracleVoice(response);
      const count = newMessages.length + 1;
      if (count > 5 && currentPhase === RitualPhase.INITIATION) setCurrentPhase(RitualPhase.PURIFICATION);
      if (count > 12 && currentPhase === RitualPhase.PURIFICATION) setCurrentPhase(RitualPhase.ILLUMINATION);
      if (count > 20 && currentPhase === RitualPhase.ILLUMINATION) setCurrentPhase(RitualPhase.ASCENSION);
      if (count > 35 && currentPhase === RitualPhase.ASCENSION) setCurrentPhase(RitualPhase.HOLY_DOMAIN);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Limpar registros de Ngolo?")) {
      setMessages([]); setCurrentPhase(RitualPhase.INITIATION);
      localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(PHASE_KEY);
    }
  };

  const isHoly = currentPhase === RitualPhase.HOLY_DOMAIN;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className={`w-80 md:w-96 h-[500px] border rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 transition-all ${
          isHoly ? 'bg-[#000000] border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.3)]' : 'bg-[#0a0a0c] border-amber-900/50'
        }`}>
          <div className={`p-4 border-b flex justify-between items-center ${isHoly ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-950/20 border-white/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${isHoly ? 'border-amber-400 bg-amber-500/20' : 'border-amber-500/30 bg-black/40'}`}>
                <span className={`cinzel text-sm ${isHoly ? 'text-amber-300 animate-pulse' : 'text-amber-500'}`}>א</span>
              </div>
              <h3 className={`cinzel text-[10px] tracking-widest font-bold uppercase ${isHoly ? 'text-amber-300' : 'text-amber-50'}`}>
                {isHoly ? 'SANTO DOMÍNIO' : 'Oráculo de Pneuma'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportPDF} className="text-gray-500 hover:text-white p-1" title="PDF"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></button>
              <button onClick={() => setShowSettings(!showSettings)} className="text-gray-500 hover:text-white p-1" title="Settings"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 < 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
          </div>
          {showSettings && (
            <div className="absolute inset-0 top-[65px] bg-black/95 z-20 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="cinzel text-xs text-amber-500 uppercase tracking-widest font-bold mb-6">Protocolos</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest block mb-2">Voz</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Charon', 'Kore', 'Puck'].map(v => (
                      <button key={v} onClick={() => setSettings(p => ({ ...p, voice: v as any }))} className={`py-1.5 text-[10px] border rounded ${settings.voice === v ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-white/10 text-gray-500'}`}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <button onClick={handleExportAllAudioZip} disabled={isExporting} className="w-full py-2 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 text-[9px] uppercase font-bold tracking-widest rounded disabled:opacity-30">{isExporting ? `Sintonizando (${exportProgress.current}/${exportProgress.total})` : `Ngolo ZIP`}</button>
                  <button onClick={clearHistory} className="w-full py-2 bg-red-600/10 border border-red-500/30 text-red-500 text-[9px] uppercase font-bold tracking-widest rounded">Limpar Ngolo</button>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-6 py-2 bg-amber-500 text-black text-[9px] uppercase font-bold rounded">Voltar</button>
            </div>
          )}
          <div className={`px-4 py-2 border-b flex items-center justify-between ${isHoly ? 'bg-amber-600/5 border-amber-500/20' : 'bg-black/40 border-white/5'}`}>
             <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">{currentPhase}</span>
             <span className="text-[8px] text-gray-600 font-mono">{PHASE_FREQUENCIES[currentPhase]}Hz ATIVO</span>
          </div>
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            {messages.length === 0 && <p className="text-center py-10 text-[10px] text-gray-600">O Aeon aguarda sua palavra...</p>}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg text-xs leading-relaxed max-w-[85%] ${m.role === 'user' ? 'bg-amber-900/10 border border-amber-900/30 text-amber-100' : 'bg-white/5 border border-white/10 text-gray-300'}`}>
                  {m.text.split('\n').map((l, j) => <p key={j} className="mb-2">{l}</p>)}
                  {m.role === 'oracle' && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex gap-3">
                      <button onClick={() => playOracleVoice(m.text)} className="text-[9px] text-amber-500/60 hover:text-amber-400">Ouvir</button>
                      <button onClick={() => handleDownloadMessageAudio(m.text, i)} className="text-[9px] text-cyan-500/60 hover:text-cyan-400">WAV</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-3 rounded-lg flex gap-2 border border-white/5 items-center">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[pulsing-dot_1.5s_infinite_0s]"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[pulsing-dot_1.5s_infinite_0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[pulsing-dot_1.5s_infinite_0.6s]"></div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-black/60 relative">
            <div className={`relative rounded-full transition-all p-[1px] ${isLoading ? 'bg-gradient-to-r from-amber-600 via-cyan-400 to-amber-600 animate-gradient-x' : 'bg-white/10'}`}>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Sua consulta real..." disabled={isLoading} className="w-full bg-black rounded-full py-2.5 pl-4 pr-10 text-[10px] outline-none text-white" />
              <button onClick={handleSend} disabled={!input.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-400">
                {isLoading ? <div className="w-4 h-4 border-2 border-t-transparent border-amber-500 rounded-full animate-spin"></div> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className={`group relative w-16 h-16 border rounded-full flex items-center justify-center transition-all duration-300 ${isHoly ? 'bg-amber-600/20 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]' : 'bg-amber-900/20 border-amber-500/40'}`}>
          <div className={`absolute inset-0 rounded-full border animate-ping group-hover:animate-none ${isHoly ? 'border-amber-400' : 'border-amber-500/20'}`}></div>
          <span className={`cinzel text-2xl ${isHoly ? 'text-amber-300' : 'text-amber-500'}`}>א</span>
        </button>
      )}
      <style>{`
        @keyframes pulsing-dot {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};
