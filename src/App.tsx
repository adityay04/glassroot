import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from './components/landing/Hero';
import Docs from './components/landing/Docs';
import About from './components/landing/About';
import DashboardLayout from './components/dashboard/DashboardLayout';
import ManifestInput from './components/scanner/ManifestInput';
import ScanResults from './components/dashboard/ScanResults';
import HistoryDrawer from './components/dashboard/HistoryDrawer';
import { useScan } from './hooks/useScan';
import { saveScan, getScans, clearHistory, ScanRecord } from './core/db/history';

type ViewState = 'landing' | 'dashboard' | 'docs' | 'about';

function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPackageDetailsOpen, setIsPackageDetailsOpen] = useState(false);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  
  const { isScanning, progress, results, error, scanManifest, cancelScan, resetScan, setScanResults } = useScan();

  useEffect(() => {
    getScans().then(setHistory);
  }, []);

  const handleScan = async (json: string) => {
    await scanManifest(json);
  };

  useEffect(() => {
    if (results.length > 0 && !isScanning) {
      const newRecord: ScanRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        projectName: results[0]?.metadata?.name || 'Imported_Project',
        results: results
      };
      
      saveScan(newRecord).then(() => {
        getScans().then(setHistory);
      });
    }
  }, [results, isScanning]);

  const handleLoadHistory = (record: ScanRecord) => {
    setScanResults(record.results);
    setIsHistoryOpen(false);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
    setIsHistoryOpen(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(12px)', scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen"
          >
            <Hero 
              onStart={() => setView('dashboard')} 
              onNavigate={(page) => setView(page)} 
            />
          </motion.div>
        )}

        {view === 'docs' && (
          <motion.div
            key="docs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: 'blur(12px)', scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen"
          >
            <Docs onBack={() => setView('landing')} />
          </motion.div>
        )}

        {view === 'about' && (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: 'blur(12px)', scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen"
          >
            <About onBack={() => setView('landing')} />
          </motion.div>
        )}

        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 min-h-screen"
          >
            <DashboardLayout 
              onHome={() => setView('landing')} 
              scanResults={results}
              onOpenHistory={() => setIsHistoryOpen(true)}
              isPackageDetailsOpen={isPackageDetailsOpen}
            >
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-10">
                    <h1 className="text-6xl font-black text-black uppercase tracking-tighter mb-4">Error.</h1>
                    <p className="text-sm text-black/80 border-l-2 border-black pl-4 font-mono">{error}</p>
                    <button onClick={resetScan} className="mt-8 border border-black/20 text-black font-bold text-sm px-6 py-2 hover:bg-black hover:text-white transition-colors uppercase tracking-wider">
                      [ TRY_AGAIN ]
                    </button>
                  </motion.div>
                )}

                {isScanning && (
                  <motion.div 
                    key="scanning" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="flex flex-col w-full h-full pt-10 relative overflow-hidden"
                  >
                    <motion.div 
                      animate={{ 
                        y: ['0%', '100%', '0%'],
                        opacity: [0, 0.1, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute inset-0 bg-black pointer-events-none z-0"
                      style={{ height: '20%' }}
                    />

                    <div className="relative z-10">
                      <h1 className="text-5xl md:text-7xl leading-[0.9] font-bold tracking-tighter uppercase mb-8 flex items-center gap-4">
                        Scanning
                        <motion.span 
                          animate={{ opacity: [1, 0, 1] }} 
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        >
                          _
                        </motion.span>
                      </h1>
                      
                      <div className="border-t border-black/20 pt-8 w-full max-w-2xl">
                        <div className="flex flex-col gap-3 text-sm tracking-wider text-black mb-3 font-bold uppercase sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                            <span>FETCHING_REGISTRY_AND_VULN_DATA</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <span className="font-mono text-lg">{progress}%</span>
                            <button
                              onClick={cancelScan}
                              className="min-h-11 border border-black/30 px-4 py-2 text-xs font-bold tracking-wider hover:bg-black hover:text-white transition-colors"
                            >
                              [ CANCEL SCAN ]
                            </button>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-black/10 overflow-hidden relative">
                          <motion.div 
                            className="h-full bg-black absolute top-0 left-0"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          />
                          <motion.div
                            className="absolute top-0 bottom-0 w-8 bg-white/30 blur-sm"
                            animate={{ left: [`calc(${progress}% - 2rem)`, `${progress}%`] }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50 font-mono text-[10px] uppercase tracking-widest">
                           <div className="flex flex-col gap-1">
                             <span>STATUS</span>
                             <span className="text-black font-bold">PROCESSING</span>
                           </div>
                           <div className="flex flex-col gap-1">
                             <span>NODE</span>
                             <span className="text-black font-bold">OSV.DEV</span>
                           </div>
                           <div className="flex flex-col gap-1">
                             <span>REGISTRY</span>
                             <span className="text-black font-bold">NPM.ORG</span>
                           </div>
                           <div className="flex flex-col gap-1">
                             <span>THREADS</span>
                             <span className="text-black font-bold">05_ACTIVE</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {!isScanning && results.length > 0 && (
                  <motion.div 
                    key="results" 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <ScanResults
                      results={results}
                      onReset={resetScan}
                      onPackageDetailsOpenChange={setIsPackageDetailsOpen}
                    />
                  </motion.div>
                )}

                {!isScanning && results.length === 0 && !error && (
                  <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
                    <ManifestInput onScan={handleScan} isScanning={isScanning} />
                  </motion.div>
                )}
              </AnimatePresence>
            </DashboardLayout>
          </motion.div>
        )}
      </AnimatePresence>

      <HistoryDrawer 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoad={handleLoadHistory}
        onClear={handleClearHistory}
      />
    </>
  );
}

export default App;