import { ReactNode } from 'react';
import { ScanResult } from '../../types';
import AIAssistant from '../../core/ai/AIAssistant';

interface DashboardLayoutProps {
  children: ReactNode;
  onHome: () => void;
  scanResults: ScanResult[];
  onOpenHistory: () => void;
}

export default function DashboardLayout({ children, onHome, scanResults, onOpenHistory }: DashboardLayoutProps) {
  return (
    <div className="h-screen bg-[#f4f4f4] text-black font-sans relative overflow-hidden flex flex-col selection:bg-black selection:text-white">
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />
      
      <div 
        className="absolute top-2 right-[-18%] h-full w-screen md:w-[65vw] pointer-events-none bg-cover bg-center bg-no-repeat opacity-50 grayscale mix-blend-multiply scale-x-[-1]"
        style={{ backgroundImage: `url('/statue2.png')` }}
      />

      <div className="absolute top-0 bottom-0 left-[75%] w-px bg-black/10 hidden lg:block pointer-events-none z-10" />

      <nav className="relative z-30 p-6 flex justify-between items-center border-b border-black/10 shrink-0 bg-[#f4f4f4]/80 backdrop-blur-sm">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-2xl tracking-tighter uppercase">GLASS//ROOT</span>
        </div>
        
        <div className="flex flex-col items-start md:flex-row md:items-center gap-6 text-xs uppercase tracking-wider text-black/60 font-bold">
          <div className="hidden md:block leading-relaxed">
            <p>SYSTEM_STATUS: <span className="text-black animate-pulse">ONLINE</span></p>
            <p>ENGINE: OSV + NPM</p>
          </div>
          
          <button 
            onClick={onOpenHistory}
            className="text-black hover:text-white hover:bg-black border border-black/20 hover:border-black px-5 py-2 transition-all duration-300 uppercase tracking-wider bg-[#f4f4f4]"
          >
            [ History ]
          </button>

          <button 
            onClick={onHome}
            className="text-black hover:text-white hover:bg-black border border-black/20 hover:border-black px-5 py-2 transition-all duration-300 uppercase tracking-wider bg-[#f4f4f4]"
          >
            [ Return_to_Root ]
          </button>
        </div>
      </nav>

      <main className="relative z-20 flex-1 overflow-y-auto custom-scrollbar px-6 py-8 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col pr-0 lg:pr-8 min-h-full">
          {children}
        </div>
        
        <div className="lg:col-span-4 flex flex-col justify-end pl-0 lg:pl-8 h-full sticky top-0">
          <div className="border-t border-black/20 pt-6 flex-1 flex flex-col overflow-visible">
            <AIAssistant results={scanResults} />
          </div>
        </div>
      </main>
    </div>
  );
}