
import React, { useState, useRef, useEffect } from 'react';
import { synthesizePrayer } from '../services/audioService';

interface Props {
  text: string;
  frequency: string;
}

export const AudioResonator: React.FC<Props> = ({ text, frequency }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isZenMode, setIsZenMode] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const zenNodesRef = useRef<AudioNode[]>([]);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const createZenEngine = (ctx: AudioContext, targetFreq: number) => {
    const masterZenGain = ctx.createGain();
    masterZenGain.gain.setValueAtTime(0, ctx.currentTime);
    masterZenGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2);
    masterZenGain.connect(ctx.destination);

    // 1. Deep Earth Drone (Brown Noise)
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < noiseBuffer.length; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(120, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1, ctx.currentTime);

    const noiseLFO = ctx.createOscillator();
    const noiseLFOGain = ctx.createGain();
    noiseLFO.frequency.value = 0.05; // Very slow wind-like shift
    noiseLFOGain.gain.value = 50;
    noiseLFO.connect(noiseLFOGain);
    noiseLFOGain.connect(noiseFilter.frequency);
    noiseLFO.start();

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(masterZenGain);
    noiseSource.start();

    // 2. Harmonic Resonance Layer (Singing Bowl Simulation)
    const harmonics = [1, 1.5, 2, 2.61];
    harmonics.forEach((h, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(targetFreq * h, ctx.currentTime);
      
      // Slow pulsing
      const p = ctx.createGain();
      const pulse = ctx.createOscillator();
      pulse.frequency.value = 0.1 + (i * 0.05);
      pulse.connect(p.gain);
      p.gain.setValueAtTime(0.02, ctx.currentTime);
      
      osc.connect(p);
      p.connect(masterZenGain);
      osc.start();
      zenNodesRef.current.push(osc, pulse);
    });

    zenNodesRef.current.push(noiseSource, noiseLFO, masterZenGain);
  };

  const updateProgress = () => {
    if (audioCtxRef.current && isPlaying) {
      const playedTime = audioCtxRef.current.currentTime - startTimeRef.current + offsetRef.current;
      setCurrentTime(playedTime);
      
      if (playedTime >= duration) {
        stopPlayback();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const stopPlayback = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    zenNodesRef.current.forEach(node => {
      try {
        if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    zenNodesRef.current = [];
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
  };

  const startPlayback = (offset: number, buffer: AudioBuffer) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const safeOffset = Math.max(0, Math.min(offset, buffer.duration - 0.1));
    offsetRef.current = safeOffset;
    startTimeRef.current = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const targetFreq = parseInt(frequency) || 432;

    // Peaking Filter for Resonance at the esoteric frequency
    const peakingFilter = ctx.createBiquadFilter();
    peakingFilter.type = 'peaking';
    peakingFilter.frequency.value = targetFreq;
    peakingFilter.Q.value = 12.0;
    peakingFilter.gain.value = 15.0;

    // Subtle Frequency Modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);
    lfoGain.connect(peakingFilter.frequency);
    lfo.start();
    zenNodesRef.current.push(lfo);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-15, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);

    source.connect(peakingFilter);
    peakingFilter.connect(compressor);
    compressor.connect(ctx.destination);

    if (isZenMode) {
      createZenEngine(ctx, targetFreq);
    }
    
    source.start(0, safeOffset);
    audioSourceRef.current = source;
    setIsPlaying(true);
    
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const toggleResonance = async () => {
    if (isPlaying) {
      offsetRef.current = audioCtxRef.current!.currentTime - startTimeRef.current + offsetRef.current;
      stopPlayback();
      return;
    }

    if (audioBuffer) {
      if (offsetRef.current >= audioBuffer.duration) offsetRef.current = 0;
      startPlayback(offsetRef.current, audioBuffer);
      return;
    }

    try {
      setIsLoading(true);
      const buffer = await synthesizePrayer(text, 'Charon');
      setAudioBuffer(buffer);
      setDuration(buffer.duration);
      startPlayback(0, buffer);
    } catch (err) {
      console.error("Resonance error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioBuffer) return;
    const newOffset = parseFloat(e.target.value);
    const wasPlaying = isPlaying;
    if (isPlaying) stopPlayback();
    offsetRef.current = newOffset;
    setCurrentTime(newOffset);
    if (wasPlaying) startPlayback(newOffset, audioBuffer);
  };

  useEffect(() => {
    return () => stopPlayback();
  }, []);

  return (
    <div className="mt-8 p-6 border-2 border-emerald-500/30 bg-black/40 rounded-[30px] space-y-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={toggleResonance}
            disabled={isLoading}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
              isPlaying 
              ? 'bg-red-500/20 text-red-500 border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)]' 
              : 'bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500/50 hover:bg-emerald-500 hover:text-black shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-t-transparent border-current rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 font-black">Sintonizador de Ngolo</h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[9px] text-amber-500 font-mono font-bold uppercase">{frequency} ATIVO</span>
              {isZenMode && <span className="text-[8px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse font-black">ORIGINAL ZEN FLOW</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              setIsZenMode(!isZenMode);
              if (isPlaying) {
                const currentOffset = audioCtxRef.current!.currentTime - startTimeRef.current + offsetRef.current;
                stopPlayback();
                setTimeout(() => startPlayback(currentOffset, audioBuffer!), 100);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black tracking-widest transition-all ${isZenMode ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]' : 'border-emerald-900/50 text-emerald-900'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            ZEN ENGINE {isZenMode ? 'ON' : 'OFF'}
          </button>
          <div className="text-[11px] font-mono text-emerald-500/50 bg-black/40 px-3 py-1 rounded-lg border border-emerald-900/20">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
      
      <div className="relative pt-2">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          disabled={!audioBuffer || isLoading}
          className="w-full h-1.5 bg-emerald-950/40 rounded-full appearance-none cursor-pointer accent-[#d4af37] hover:accent-emerald-400 transition-all"
        />
        <div className="absolute top-0 left-0 h-1.5 bg-emerald-500/20 rounded-full pointer-events-none" style={{ width: `${(currentTime/(duration||100))*100}%` }}></div>
      </div>
    </div>
  );
};
