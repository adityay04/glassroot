import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { ScanResult } from '../../types';
import { generateAIAnalysis } from '../../core/ai/groq';

interface AIAssistantProps {
  results: ScanResult[];
  isPackageDetailsOpen: boolean;
}

export default function AIAssistant({ results, isPackageDetailsOpen }: AIAssistantProps) {
  const [apiKey, setApiKey] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('glassroot_groq_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleAnalyze = async () => {
    if (!apiKey.trim()) {
      setError('API_KEY_REQUIRED');
      return;
    }
    
    localStorage.setItem('glassroot_groq_key', apiKey);
    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
      const response = await generateAIAnalysis(apiKey, results);
      setAnalysis(response || 'NO_ANALYSIS_RETURNED');
    } catch (err: any) {
      setError(err.message || 'API_ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div className="flex flex-col relative">
      {results.length > 0 && !analysis && !isPackageDetailsOpen && (
        <>
          {createPortal(
            <div className="hidden lg:flex fixed top-[32%] right-[12%] z-[70] items-center justify-center">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="GROQ_API_KEY"
                className="w-[240px] bg-black text-white placeholder:text-white/40 text-center font-mono text-xs tracking-[0.2em] px-4 py-2 border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-sm focus:outline-none focus:border-white transition-all backdrop-blur-md"
              />
            </div>,
            document.body,
          )}
          <label className="lg:hidden flex flex-col gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-black/60">
            Groq API key
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="GROQ_API_KEY"
              className="w-full min-h-11 bg-black text-white placeholder:text-white/40 text-center font-mono text-xs tracking-[0.2em] px-4 py-2 border border-black/20 rounded-sm focus:outline-none focus:border-black"
            />
          </label>
        </>
      )}

      <h3 className="text-sm tracking-wider text-black/50 mb-3 uppercase font-bold">AI_Intelligence_Module</h3>
      
      {!results.length ? (
        <p className="text-base text-black/80 leading-relaxed mb-6 font-medium">
          Awaiting manifest input. Once dependencies are parsed, the AI module will analyze vulnerabilities, assess risk scores, and generate remediation suggestions based on the scanned data.
        </p>
      ) : !analysis ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-black/70 leading-relaxed font-medium">
            Scanner data ready. Enter your Groq API key to initialize the analysis.
          </p>
          
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="mt-8 lg:mt-20 w-full py-3 bg-black text-white font-bold text-sm uppercase tracking-wider hover:bg-black/80 transition-all duration-300 disabled:opacity-50 relative overflow-hidden group"
          >
            <span className="relative z-10">{isLoading ? 'ANALYZING_DATA...' : 'GENERATE_ANALYSIS'}</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </button>
          
          {error && (
            <p className="text-xs text-red-600 font-bold uppercase tracking-wider mt-2 border-l-2 border-red-600 pl-2">
              [{error}]
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col bg-[#0a0a0a] border border-white/20 shadow-2xl relative z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
            <span className="text-[10px] font-mono text-white/50 tracking-widest">TERMINAL_OUTPUT.SYS</span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white/20"></div>
              <div className="w-2 h-2 rounded-full bg-white/20"></div>
              <div className="w-2 h-2 rounded-full bg-white/40"></div>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

          <div className="p-5 relative z-10">
            <ReactMarkdown 
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mt-6 mb-3 uppercase tracking-tight" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-6 mb-3 uppercase tracking-wide border-b border-white/20 pb-1" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-md font-bold text-white/90 mt-4 mb-2 uppercase" {...props} />,
                strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                p: ({node, ...props}) => <p className="text-sm text-white/70 leading-relaxed mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside text-sm text-white/70 mb-4 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside text-sm text-white/70 mb-4 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="pl-2" {...props} />,
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-left border-collapse text-sm" {...props} />
                  </div>
                ),
                th: ({node, ...props}) => <th className="border-b border-white/30 p-2 text-white font-bold uppercase tracking-wider" {...props} />,
                td: ({node, ...props}) => <td className="border-b border-white/10 p-2 text-white/70 font-mono" {...props} />,
                code: ({node, ...props}) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-xs" {...props} />
              }}
            >
              {analysis}
            </ReactMarkdown>
            <div className="w-2 h-4 bg-white/50 inline-block animate-pulse mt-2 ml-1" />
          </div>

          <div className="p-3 border-t border-white/10 bg-[#050505] relative z-10">
            <button
              onClick={() => setAnalysis('')}
              className="w-full border border-white/20 text-white/70 hover:text-black font-bold text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-white transition-all duration-300"
            >
              [ CLEAR_TERMINAL ]
            </button>
          </div>
        </div>
      )}

      {analysis && (
        <div className="mt-4 flex justify-between items-center text-[10px] text-black/40 uppercase tracking-widest font-bold font-mono">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            ANALYSIS_COMPLETE
          </span>
          <span>[ 0x47 ]</span>
        </div>
      )}
    </div>
  );
}