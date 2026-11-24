import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ScanResult } from '../../types';
import AIAssistant from '../../core/ai/AIAssistant';

interface DashboardLayoutProps {
  children: ReactNode;
  onHome: () => void;
  scanResults: ScanResult[];
  onOpenHistory: () => void;
  isPackageDetailsOpen: boolean;
}

export default function DashboardLayout({ children, onHome, scanResults, onOpenHistory, isPackageDetailsOpen }: DashboardLayoutProps) {
  return (
    <>
      {createPortal(
        <div aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
          />

          <div
            className="absolute top-2 right-[-18%] h-full w-screen md:w-[65vw] bg-cover bg-center bg-no-repeat opacity-50 grayscale mix-blend-multiply scale-x-[-1]"
            style={{ backgroundImage: `url('/statue2.png')` }}
          />

          <div className="absolute top-0 bottom-0 left-[75%] w-px bg-black/10 hidden lg:block" />
        </div>,
        document.body,
      )}

      <div className="relative min-h-[100dvh] bg-transparent text-black font-sans overflow-x-clip flex flex-col selection:bg-black selection:text-white">

      <nav className="relative z-30 px-4 py-4 sm:p-6 flex justify-between items-center border-b border-black/10 shrink-0 bg-[#f4f4f4]/80 backdrop-blur-sm">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-2xl tracking-tighter uppercase">GLASS//ROOT</span>
        </div>
        
        <div className="flex flex-col items-start md:flex-row md:items-center gap-2 sm:gap-3 md:gap-6 text-[10px] sm:text-xs uppercase tracking-wider text-black/60 font-bold">
          <div className="hidden md:block leading-relaxed">
            <p>SYSTEM_STATUS: <span className="text-black animate-pulse">ONLINE</span></p>
            <p>ENGINE: OSV + NPM</p>
          </div>
          
          <button 
            onClick={onOpenHistory}
            className="min-h-11 text-black hover:text-white hover:bg-black border border-black/20 hover:border-black px-3 sm:px-5 py-2 transition-all duration-300 uppercase tracking-wider bg-[#f4f4f4]"
          >
            [ History ]
          </button>

          <button 
            onClick={onHome}
            className="min-h-11 text-black hover:text-white hover:bg-black border border-black/20 hover:border-black px-3 sm:px-5 py-2 transition-all duration-300 uppercase tracking-wider bg-[#f4f4f4]"
          >
            [ Return_to_Root ]
          </button>
        </div>
      </nav>

      <main className="relative z-40 flex flex-1 flex-col px-4 sm:px-6 py-6 md:py-8 w-full max-w-[1600px] mx-auto gap-6 lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col pr-0 lg:pr-8 min-h-max">
          {children}
        </div>
        
        <div className="lg:col-span-4 flex flex-col pl-0 lg:pl-8 lg:sticky lg:top-36 self-start">
          <div className="border-t border-black/20 pt-6 flex flex-col overflow-visible">
            <AIAssistant results={scanResults} isPackageDetailsOpen={isPackageDetailsOpen} />
          </div>
        </div>
      </main>
      </div>
    </>
  );
}