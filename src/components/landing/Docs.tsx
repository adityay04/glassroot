import { motion } from 'framer-motion';

interface DocsProps {
  onBack: () => void;
}

export default function Docs({ onBack }: DocsProps) {
  return (
    <div className="relative min-h-screen bg-[#f4f4f4] text-black overflow-hidden font-sans selection:bg-black selection:text-white">
      <div className="absolute inset-0 pointer-events-none flex justify-between px-8 md:px-24">
        <div className="w-px h-full bg-black/10" />
        <div className="w-px h-full bg-black/10 hidden md:block" />
        <div className="w-px h-full bg-black/10" />
      </div>

      <div 
        className="absolute inset-0 pointer-events-none bg-contain bg-center bg-no-repeat opacity-80 grayscale blur-[6px] mix-blend-multiply scale-110"
        style={{ backgroundImage: `url('/statue3.png')` }}
      />

      <header className="relative z-10 flex justify-between items-center p-8 md:p-12 font-mono text-xs md:text-sm uppercase tracking-widest">
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

      <main className="relative z-10 px-8 md:px-24 mt-12 md:mt-20 pb-32">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-[12vw] md:text-[8vw] leading-[0.85] font-bold tracking-tighter mb-16"
        >
          Documentation.
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl">
          <div className="font-mono text-sm md:text-base leading-relaxed space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 uppercase tracking-tighter">1. Import Manifest</h2>
              <p className="text-black/70">
                Paste your `package.json` contents into the terminal input or drag and drop the file directly. The parser extracts all dependencies and devDependencies.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4 uppercase tracking-tighter">2. Scan Engine</h2>
              <p className="text-black/70">
                The tool queries the npm registry for metadata and the OSV database for known vulnerabilities. It calculates a heuristic risk score based on missing repos, recent publication dates, and confirmed CVEs.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4 uppercase tracking-tighter">3. AI Analysis</h2>
              <p className="text-black/70">
                Provide a Groq API key to generate a prioritized remediation report. The AI will explain findings in simple terms and distinguish between confirmed vulnerabilities and suspicious signals.
              </p>
            </div>
          </div>

          <div className="font-mono text-sm md:text-base leading-relaxed space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 uppercase tracking-tighter">4. Dependency Radar</h2>
              <p className="text-black/70">
                Switch to the Radar view to visualize your dependency tree. Nodes are color-coded by risk level. Critical vulnerabilities will animate and draw your attention.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4 uppercase tracking-tighter">5. Export</h2>
              <p className="text-black/70">
                Copy a summary to your clipboard or export the raw JSON data for further analysis or to share with your team.
              </p>
            </div>
            <div className="border-l-2 border-black pl-4 py-2 mt-8">
              <p className="text-black font-bold">
                Note: No data is sent to our servers. All API calls happen directly from your browser. Your API key is stored locally.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}