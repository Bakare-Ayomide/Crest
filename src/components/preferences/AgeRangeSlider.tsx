import React, { useState, useEffect, useRef } from 'react';
import { triggerHaptic } from '../../lib/capacitor';
import { Sparkles } from 'lucide-react';

interface AgeRangeSliderProps {
  minAge: number;
  maxAge: number;
  onChange: (min: number, max: number) => void;
}

const MIN_LIMIT = 18;
const MAX_LIMIT = 80;

export const AgeRangeSlider: React.FC<AgeRangeSliderProps> = ({ minAge, maxAge, onChange }) => {
  const [localMin, setLocalMin] = useState(minAge);
  const [localMax, setLocalMax] = useState(maxAge);

  useEffect(() => {
    setLocalMin(minAge);
    setLocalMax(maxAge);
  }, [minAge, maxAge]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), localMax - 1);
    const clamped = Math.max(MIN_LIMIT, val);
    setLocalMin(clamped);
    onChange(clamped, localMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), localMin + 1);
    const clamped = Math.min(MAX_LIMIT, val);
    setLocalMax(clamped);
    onChange(localMin, clamped);
  };

  const minPercent = ((localMin - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100;
  const maxPercent = ((localMax - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100;

  const presets = [
    { label: '18–25', min: 18, max: 25 },
    { label: '22–32', min: 22, max: 32 },
    { label: '26–38', min: 26, max: 38 },
    { label: '35–55', min: 35, max: 55 },
    { label: '18–80 (All)', min: 18, max: 80 },
  ];

  return (
    <div className="space-y-4">
      {/* Header Readout */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-300">Age Range</span>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 text-xs font-extrabold text-[#E98BD0] shadow-sm">
          <span>{localMin} — {localMax}</span>
          <span className="text-gray-400 font-normal text-[11px]">years old</span>
        </div>
      </div>

      {/* Dual Range Track */}
      <div className="relative pt-2 pb-3 px-1">
        {/* Background track */}
        <div className="w-full h-2 rounded-full bg-white/10 relative">
          {/* Active Highlight Range */}
          <div
            className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-[#FF4058] to-[#E98BD0] shadow-sm"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(0, maxPercent - minPercent)}%`,
            }}
          />
        </div>

        {/* Min Thumb Input */}
        <input
          type="range"
          min={MIN_LIMIT}
          max={MAX_LIMIT}
          value={localMin}
          onChange={handleMinChange}
          className="absolute inset-x-0 top-1 w-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#FF4058] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,64,88,0.5)] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:transition-transform"
        />

        {/* Max Thumb Input */}
        <input
          type="range"
          min={MIN_LIMIT}
          max={MAX_LIMIT}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute inset-x-0 top-1 w-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#E98BD0] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(233,139,208,0.5)] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:transition-transform"
        />

        {/* Scale labels */}
        <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-4">
          <span>{MIN_LIMIT}</span>
          <span>35</span>
          <span>50</span>
          <span>65</span>
          <span>{MAX_LIMIT}+</span>
        </div>
      </div>

      {/* Quick Age Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-medium text-gray-400 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#E98BD0]" />
          Presets:
        </span>
        {presets.map((p) => {
          const isSelected = localMin === p.min && localMax === p.max;
          return (
            <button
              key={p.label}
              onClick={() => {
                triggerHaptic('light');
                setLocalMin(p.min);
                setLocalMax(p.max);
                onChange(p.min, p.max);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                isSelected
                  ? 'bg-[#E98BD0] text-[#101112] shadow-sm scale-105'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
