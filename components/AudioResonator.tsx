
import React, { useState, useRef, useEffect } from 'react';
import { synthesizePrayer } from '../services/audioService';

interface Props {
  text: string;
  frequency: string;
}

export const AudioResonator: React.FC<Props> = ({ text, frequency }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    if (lfoRef.current) {
      try {
        lfoRef.current.stop();
      } catch (e) {}
      lfoRef.current = null;
    }
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

    // 1. Peaking Filter for Resonance at the esoteric frequency
    const peakingFilter = ctx.createBiquadFilter();
    peakingFilter.type = 'peaking';
    peakingFilter.frequency.value = targetFreq;
    peakingFilter.Q.value = 10.0; // High Q for sharp resonance
    peakingFilter.gain.value = 12.0; // Boost at target frequency

    // 2. Subtle Frequency Modulation (LFO) for "shimmering" effect
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.8; // Very slow modulation (0.8Hz)
    lfoGain.gain.value = 20; // Modulate resonance center by 20Hz
    
    lfo.connect(lfoGain);
    lfoGain.connect(peakingFilter.frequency);
    lfo.start();
    lfoRef.current = lfo;

    // 3. Compressor for density
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-20, ctx.currentTime);
    compressor.ratio.setValueAtTime(8, ctx.currentTime);

    // Chain: Source -> Peaking -> Compressor -> Destination
    source.connect(peakingFilter);
    peakingFilter.connect(compressor);
    compressor.connect(ctx.destination);
    
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
    <div className="mt-6 p-4 border border-cyan-500/30 bg-cyan-950/10 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleResonance}
            disabled={isLoading}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isPlaying 
              ? 'bg-red-500/20 text-red-500 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
              : 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/50 hover:bg-cyan-500 hover:text-black shadow-[0_0_10px_rgba(6,182,212,0.2)]'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Ativação de Ngolo</h4>
            <p className="text-[9px] text-gray-500 font-mono italic">Frequência de Ressonância: {frequency}</p>
          </div>
        </div>
        <div className="text-[10px] font-mono text-cyan-500/50">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      <input
        type="range"
        min="0"
        max={duration || 100}
        step="0.1"
        value={currentTime}
        onChange={handleSeek}
        disabled={!audioBuffer || isLoading}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  );
};
