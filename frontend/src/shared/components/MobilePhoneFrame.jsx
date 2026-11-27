import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Smartphone, Maximize2, RotateCcw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const MobilePhoneFrame = ({ children }) => {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  const [device, setDevice] = useState('responsive');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const dimensions = {
    iphone: { width: '400px', height: '840px', radius: 'rounded-[50px]', notch: 'dynamic-island' },
    pixel: { width: '412px', height: '860px', radius: 'rounded-[44px]', notch: 'punch-hole' },
  };

  if (isNative || device === 'responsive') {
    return (
      <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-kisan-bg flex flex-col">
        {/* On non-native desktop browsers, show a small subtle preview bar if developer wants to test mobile hardware frames */}
        {!isNative && (
          <div className="hidden lg:flex items-center justify-end px-4 py-1 bg-slate-900 text-white text-[11px] font-semibold space-x-2 border-b border-slate-800">
            <span className="text-emerald-400 font-bold flex items-center mr-2">
              <Smartphone className="w-3.5 h-3.5 mr-1" /> Viewport: Responsive
            </span>
            <button
              onClick={() => setDevice('iphone')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Simulate iPhone
            </button>
            <button
              onClick={() => setDevice('pixel')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Simulate Pixel
            </button>
          </div>
        )}
        <div className="flex-1 flex flex-col w-full max-w-full min-w-0 overflow-x-hidden">{children}</div>
      </div>
    );
  }

  const current = dimensions[device] || dimensions.iphone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-2 sm:p-6 select-none">
      {/* Device Switcher Bar on Desktop */}
      <div className="mb-4 flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-xs font-bold text-white shadow-xl">
        <span className="text-emerald-300 font-extrabold flex items-center space-x-1">
          <Smartphone className="w-4 h-4 mr-1 text-emerald-400" />
          KisanDirect Mobile App
        </span>
        <div className="h-4 w-px bg-white/20" />
        <button
          onClick={() => setDevice('iphone')}
          className={`px-2.5 py-1 rounded-xl transition-all ${device === 'iphone' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
        >
          iPhone 15
        </button>
        <button
          onClick={() => setDevice('pixel')}
          className={`px-2.5 py-1 rounded-xl transition-all ${device === 'pixel' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
        >
          Pixel 8
        </button>
        <button
          onClick={() => setDevice('responsive')}
          className={`px-2.5 py-1 rounded-xl transition-all ${device === 'responsive' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
          title="Responsive View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Phone Hardware Mockup */}
      <div
        style={{ width: current.width, height: current.height }}
        className={`relative ${current.radius} bg-black p-3.5 shadow-mobile-phone transition-all duration-300 border-[3px] border-slate-700/80 flex flex-col overflow-hidden ring-1 ring-white/10`}
      >
        {/* Side Hardware Buttons */}
        <div className="absolute -left-[6px] top-24 w-[3px] h-10 bg-slate-600 rounded-l-md" />
        <div className="absolute -left-[6px] top-38 w-[3px] h-12 bg-slate-600 rounded-l-md" />
        <div className="absolute -right-[6px] top-28 w-[3px] h-16 bg-slate-600 rounded-r-md" />

        {/* Screen Bezel & Container */}
        <div className="relative flex-1 bg-kisan-bg rounded-[38px] overflow-hidden flex flex-col shadow-inner">
          {/* Native Status Bar */}
          <div className="h-10 bg-white/70 backdrop-blur-md px-6 flex items-center justify-between text-[11px] font-extrabold text-slate-800 z-50 flex-shrink-0">
            <span className="tracking-tight">{currentTime || '9:41'}</span>
            
            {/* Dynamic Island / Punch Hole */}
            {current.notch === 'dynamic-island' && (
              <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 space-x-1 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
                <div className="w-2 h-2 rounded-full bg-blue-950/80" />
              </div>
            )}
            {current.notch === 'punch-hole' && (
              <div className="w-3.5 h-3.5 rounded-full bg-black shadow-inner" />
            )}

            <div className="flex items-center space-x-1.5 text-slate-700">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <div className="flex items-center space-x-0.5">
                <span className="text-[9px]">100%</span>
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* App Viewport (Scrollable Screen Content) */}
          <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col bg-kisan-bg">
            {children}
          </div>

          {/* iOS / Android Home Swipe Indicator Bar */}
          <div className="h-5 bg-white/40 backdrop-blur-md flex items-center justify-center flex-shrink-0 z-50">
            <div className="w-32 h-1 bg-slate-800/60 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePhoneFrame;
