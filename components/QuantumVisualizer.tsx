
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { time: number; torsion: number; coherence: number }[];
}

export const QuantumVisualizer: React.FC<Props> = ({ data }) => {
  return (
    <div className="h-72 w-full bg-black/60 border border-emerald-900/30 rounded-[30px] p-8 shadow-2xl backdrop-blur-md">
      <h3 className="text-[10px] uppercase text-[#d4af37] mb-6 tracking-[0.5em] font-black flex items-center gap-3">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
        Monitor de Coerência Ngolo / Torção Áurea
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTorsion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorCoherence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#064e3b" opacity={0.3} />
          <XAxis dataKey="time" hide />
          <YAxis hide domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#010a08', border: '1px solid #d4af37', fontSize: '10px', borderRadius: '15px', color: '#fff' }}
            itemStyle={{ color: '#d4af37' }}
          />
          <Area type="monotone" dataKey="torsion" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTorsion)" />
          <Area type="monotone" dataKey="coherence" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorCoherence)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
