import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
  onStart: () => void;
  onNavigate: (page: 'docs' | 'about') => void;
}

const STATUS_MESSAGES = [
  "SCANNING_NPM_REGISTRY...",
  "CHECKING_OSV_DATABASE...",
  "VERIFYING_PACKAGE_HASHES...",
  "ANALYZING_METADATA_SIGNALS...",
  "DETECTING_TYPOSQUATTING...",
  "AI_INTELLIGENCE_STANDBY..."
];

export default function Hero({ onStart, onNavigate }: HeroProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-[#f4f4f4] text-black overflow-x-clip font-sans selection:bg-black selection:text-white flex flex-col">
      <div className="absolute inset-0 pointer-events-none flex justify-between px-8 md:px-24">
        <div className="w-px h-full bg-black/10" />
        <div className="w-px h-full bg-black/10 hidden md:block" />
        <div className="w-px h-full bg-black/10" />
      </div>

      <div 
        className="absolute inset-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-60 grayscale blur-[4px] mix-blend-multiply scale-110"
        style={{ backgroundImage: `url('/statue.png')` }}
      />

      <header className="relative z-10 flex justify-between items-center p-4 sm:p-6 md:p-8 font-mono text-xs md:text-sm uppercase tracking-widest shrink-0">
        <div className="font-bold">
          GLASS//ROOT
        </div>
        
        <div className="flex items-center gap-3 sm:gap-8">
          <nav className="flex gap-3 sm:gap-6 items-center">
            <button 
              onClick={onStart} 
              className="relative group cursor-pointer hover:text-black/60 transition-colors duration-300"
            >
              [ scan ]
            </button>
            <button 
              onClick={() => onNavigate('docs')}
              className="relative group cursor-pointer hover:text-black/60 transition-colors duration-300"
            >
              docs
              <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out"></span>
            </button>
            <button 
              onClick={() => onNavigate('about')}
              className="relative group cursor-pointer hover:text-black/60 transition-colors duration-300"
            >
              about
              <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-black scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out"></span>
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 px-4 sm:px-8 md:px-24 flex-1 flex flex-col justify-start pt-4 md:pt-12 pb-16">
        <div className="relative">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-[13vw] md:text-[10vw] lg:text-[8.5vw] leading-[0.85] font-bold tracking-tighter"
          >
            some<br />
            <span className="ml-[18vw] md:ml-[20vw]">packages</span><br />
            <span className="ml-[8vw] md:ml-[10vw]">aren't</span><br />
            real.
          </motion.h1>

          <div className="absolute top-0 right-0 md:right-12 h-full flex items-center justify-end pointer-events-none hidden md:flex">
            <div className="w-64 border-l border-black/20 pl-6 py-4 flex flex-col justify-center h-32">
              <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest mb-2">System_Log</span>
              <div className="h-6 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="font-mono text-sm font-bold text-black/80 absolute w-full"
                  >
                    {STATUS_MESSAGES[index]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-5 max-w-[280px] font-mono text-xs md:text-sm leading-relaxed">
            <p className="border-l-[1.5px] border-black pl-4">
              Dependency intelligence for the packages your software depends on. 
              Find the signals before you install.
            </p>
            <button 
              onClick={onStart}
              className="mt-6 px-5 py-2.5 bg-[#111] text-white font-mono text-xs md:text-sm border border-black transition-all duration-300 ease-out flex items-center gap-3 group hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:-translate-y-[1px] cursor-pointer"
            >
              inspect dependencies 
              <span className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 ease-out">
                ↗
              </span>
            </button>
          </div>
          
          <div className="hidden md:block md:col-span-4 border-l border-black/20 h-24 mb-2"></div>

          <div className="md:col-span-3 flex flex-col items-start font-mono text-[10px] md:text-xs space-y-4">
            <div className="space-y-1">
              <p className="text-black/40 text-[9px] mb-1 uppercase tracking-widest">Sys_Status</p>
              <p>STATUS: <span className="text-black font-bold">ACTIVE</span></p>
              <p>DB_NODE: <span className="text-black font-bold">OSV//NPM</span></p>
              <p>AGENT: <span className="text-black font-bold">STANDBY</span></p>
            </div>
            
            <div className="space-y-1">
              <span className="inline-block border border-black/30 px-2 py-1 bg-white/50 backdrop-blur-sm mb-1">[ 0x47 ]</span>
              <div className="text-black/60 space-y-1 flex flex-col">
                <p className="hover:text-black transition-colors cursor-default flex items-center gap-2">
                  <span className="text-black/30">├─</span> /ROOT
                </p>
                <p className="hover:text-black transition-colors cursor-default flex items-center gap-2">
                  <span className="text-black/30">├─</span> /SCAN
                </p>
                <p className="hover:text-black transition-colors cursor-default flex items-center gap-2">
                  <span className="text-black/30">├─</span> /ANALYZE
                </p>
                <p className="hover:text-black transition-colors cursor-default flex items-center gap-2">
                  <span className="text-black/30">└─</span> /SECURE
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 z-30 w-full overflow-hidden bg-black py-3 pointer-events-none">
        <div className="animate-marquee whitespace-nowrap font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/80">
          <span className="mx-4">GLASS//ROOT v0.1.0</span>
          <span className="mx-4">///</span>
          <span className="mx-4">DEPENDENCY INTELLIGENCE</span>
          <span className="mx-4">///</span>
          <span className="mx-4">SECURE YOUR SUPPLY CHAIN</span>
          <span className="mx-4">///</span>
          <span className="mx-4">NO HALLUCINATED PACKAGES</span>
          <span className="mx-4">///</span>
          <span className="mx-4">OSV + NPM REGISTRY</span>
          <span className="mx-4">///</span>
          <span className="mx-4">GLASS//ROOT v0.1.0</span>
          <span className="mx-4">///</span>
          <span className="mx-4">DEPENDENCY INTELLIGENCE</span>
          <span className="mx-4">///</span>
          <span className="mx-4">SECURE YOUR SUPPLY CHAIN</span>
          <span className="mx-4">///</span>
          <span className="mx-4">NO HALLUCINATED PACKAGES</span>
          <span className="mx-4">///</span>
          <span className="mx-4">OSV + NPM REGISTRY</span>
          <span className="mx-4">///</span>
        </div>
      </div>
    </div>
  );
}