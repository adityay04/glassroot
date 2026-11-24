import { motion } from 'framer-motion';

interface AboutProps {
  onBack: () => void;
}

export default function About({ onBack }: AboutProps) {
  return (
    <div className="relative min-h-[100dvh] bg-[#f4f4f4] text-black overflow-x-clip font-sans selection:bg-black selection:text-white">
      <div className="absolute inset-0 pointer-events-none flex justify-between px-8 md:px-24">
        <div className="w-px h-full bg-black/10" />
        <div className="w-px h-full bg-black/10 hidden md:block" />
        <div className="w-px h-full bg-black/10" />
      </div>

      <div 
        className="absolute inset-0 pointer-events-none bg-contain bg-center bg-no-repeat opacity-80 grayscale blur-[6px] mix-blend-multiply scale-110"
        style={{ backgroundImage: `url('/statue4.png')` }}
      />

      <header className="relative z-10 flex justify-between items-center p-4 sm:p-8 md:p-12 font-mono text-xs md:text-sm uppercase tracking-widest">
        <div className="font-bold cursor-pointer" onClick={onBack}>
          GLASS//ROOT
        </div>
        <button 
          onClick={onBack}
          className="hover:text-black/60 transition-colors duration-300 uppercase tracking-widest border border-black/20 px-4 py-1.5"
        >
          [ Back_to_Home ]
        </button>
      </header>

      <main className="relative z-10 px-4 sm:px-8 md:px-24 mt-8 md:mt-20 pb-20 md:pb-32">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-[10vw] sm:text-[12vw] md:text-[8vw] leading-[0.85] font-bold tracking-tighter mb-10 md:mb-16"
        >
          About.
        </motion.h1>

        <div className="max-w-3xl font-mono text-sm md:text-lg leading-relaxed space-y-8">
          <p className="text-black/80 font-medium">
            Modern software development relies heavily on third-party packages. Developers frequently install dependencies without thoroughly checking whether they are legitimate, vulnerable, or hallucinated by AI.
          </p>
          <p className="text-black/80 font-medium">
            GLASS//ROOT is a browser-based dependency intelligence tool. It helps you identify suspicious, vulnerable, or unverified packages before they become part of your software supply chain.
          </p>
          <p className="text-black/80 font-medium">
            Built to feel like a developer's security instrument, it transforms raw metadata into a clear, actionable overview.
          </p>

          <div className="pt-12 mt-12 border-t border-black/20">
            <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">Created By</h2>
            <div className="flex flex-col gap-4 font-mono text-sm md:text-base">
              <p className="font-bold text-2xl tracking-tight">Aditya Yadav</p>
              <div className="flex flex-wrap gap-6 mt-2">
                <a 
                  href="https://github.com/adityay04" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="border-b border-black pb-1 hover:text-black/60 hover:border-black/60 transition-colors uppercase tracking-wider font-bold"
                >
                  GitHub ↗
                </a>
                <a 
                  href="https://x.com/AdityaYada76111" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="border-b border-black pb-1 hover:text-black/60 hover:border-black/60 transition-colors uppercase tracking-wider font-bold"
                >
                  X / Twitter ↗
                </a>
                <a 
                  href="https://www.linkedin.com/in/aditya-yadav2005/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="border-b border-black pb-1 hover:text-black/60 hover:border-black/60 transition-colors uppercase tracking-wider font-bold"
                >
                  LinkedIn ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}