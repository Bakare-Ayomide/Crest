import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
  enabled: boolean;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children, enabled }) => {
  if (!enabled) {
    return (
      <div className="min-h-screen bg-[#101112] text-white font-sans flex justify-center items-stretch">
        <div className="w-full max-w-md min-h-screen bg-[#101112] relative flex flex-col justify-between shadow-2xl">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080809] py-4 px-2 flex items-center justify-center font-sans antialiased select-none">
      
      {/* Outer Device Chassis */}
      <div className="relative w-full max-w-[410px] h-[850px] bg-[#1A1B1E] rounded-[52px] p-3 shadow-2xl ring-1 ring-white/10 border-4 border-[#25262A] flex flex-col overflow-hidden">
        
        {/* Dynamic Island / Top Notch */}
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-50 w-28 h-7 bg-black rounded-full flex items-center justify-between px-3.5 border border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#101112] ring-1 ring-white/10" />
          <div className="w-3 h-3 rounded-full bg-blue-950/40 border border-blue-900/60" />
        </div>

        {/* Status Bar */}
        <div className="w-full pt-2 pb-1 px-7 flex justify-between items-center text-white text-xs font-bold z-40 select-none bg-[#101112] text-white">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 fill-white text-white" />
          </div>
        </div>

        {/* Device Display Viewport */}
        <div className="flex-1 rounded-[40px] bg-[#101112] overflow-y-auto flex flex-col relative scrollbar-none text-white border border-white/5">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/70 rounded-full z-50 pointer-events-none" />
      </div>
    </div>
  );
};
