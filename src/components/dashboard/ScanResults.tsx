import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanResult } from '../../types';
import DependencyRadar from './DependencyRadar';

interface ScanResultsProps {
  results: ScanResult[];
  onReset: () => void;
}

export default function ScanResults({ results, onReset }: ScanResultsProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [copied, setCopied] = useState(false);

  const getRiskStyle = (label: string) => {
    switch (label) {
      case 'Critical': return 'text-white bg-red-600 border-red-700';
      case 'High': return 'text-red-700 bg-red-100 border-red-500';
      case 'Medium': return 'text-orange-700 bg-orange-100 border-orange-500';
      case 'Low': return 'text-green-700 bg-green-100 border-green-500';
      default: return 'text-gray-600 bg-gray-100 border-gray-400';
    }
  };

  const getRemediation = (pkg: ScanResult) => {
    if (pkg.riskLabel === 'Critical') return '[REMOVE]';
    if (pkg.riskLabel === 'High') return '[UPDATE]';
    if (pkg.riskLabel === 'Medium') return '[REVIEW]';
    if (pkg.riskLabel === 'Unknown') return '[VERIFY]';
    return '[KEEP]';
  };

  const handleCopy = () => {
    const summary = results.map(pkg => 
      `- ${pkg.name} (${pkg.versionRange}): ${pkg.riskLabel} risk. Action: ${getRemediation(pkg)}`
    ).join('\n');
    
    const text = `GLASS//ROOT SCAN RESULTS\n\n${summary}\n\nTotal Packages: ${results.length}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `glassroot-scan-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full pt-4 flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 border-b border-black/20 pb-4 shrink-0">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">Analysis_Results</h2>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="flex border border-black/20">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode('graph')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'graph' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
            >
              Radar
            </button>
          </div>
          
          <button 
            onClick={handleCopy}
            className="text-sm border border-black/40 px-4 py-2 hover:bg-black hover:text-white transition-colors uppercase tracking-wider font-bold"
          >
            {copied ? '[ COPIED! ]' : '[ COPY_SUMMARY ]'}
          </button>
          
          <button 
            onClick={handleExport}
            className="text-sm border border-black/40 px-4 py-2 hover:bg-black hover:text-white transition-colors uppercase tracking-wider font-bold"
          >
            [ EXPORT_JSON ]
          </button>

          <button 
            onClick={onReset}
            className="text-sm border border-black/40 px-4 py-2 hover:bg-black hover:text-white transition-colors uppercase tracking-wider font-bold"
          >
            [ RESTART ]
          </button>
        </div>
      </div>
      
      <div className="w-full">
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="hidden md:grid grid-cols-12 gap-2 pb-3 text-xs tracking-wider text-black/50 uppercase font-bold border-b border-black/10 mb-2">
                <div className="col-span-4">Package</div>
                <div className="col-span-2">Version</div>
                <div className="col-span-3">Signals</div>
                <div className="col-span-3 text-right">Risk / Action</div>
              </div>
              
              <div className="flex flex-col">
                {results.map((pkg) => (
                  <div key={pkg.name} className="flex flex-col md:grid md:grid-cols-12 gap-2 py-4 border-b border-black/10 md:items-center hover:bg-black/5 transition-colors cursor-pointer group">
                    <div className="md:col-span-4 text-lg font-bold truncate pr-2 text-black group-hover:text-black/60 transition-colors tracking-tight flex justify-between items-center">
                      {pkg.name}
                      <span className="md:hidden text-sm font-normal text-black/50">{pkg.versionRange}</span>
                    </div>
                    <div className="hidden md:block md:col-span-2 text-sm text-black/60 font-medium">
                      {pkg.versionRange}
                    </div>
                    <div className="md:col-span-3 flex flex-wrap gap-x-2 gap-y-1 mt-2 md:mt-0">
                      {pkg.signals.length > 0 ? (
                        pkg.signals.map(s => (
                          <span key={s} className="text-[10px] md:text-xs text-black/70 tracking-wider uppercase font-medium bg-black/5 md:bg-transparent px-2 py-0.5 md:p-0">
                            [{s}]
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] md:text-xs text-black/30 tracking-wider uppercase font-medium">
                          [ NO_SIGNALS ]
                        </span>
                      )}
                    </div>
                    <div className="md:col-span-3 flex justify-between md:justify-end items-center gap-3 mt-3 md:mt-0 pt-3 md:pt-0 border-t border-black/5 md:border-0">
                      <div className={`px-3 py-1 border text-xs tracking-wider uppercase font-bold ${getRiskStyle(pkg.riskLabel)}`}>
                        {pkg.riskLabel}
                      </div>
                      <span className="text-xs font-bold tracking-wider text-black/60 w-16 text-right">
                        {getRemediation(pkg)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="graph"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full h-150 border border-black/20 bg-white/40 relative"
            >
              <DependencyRadar results={results} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}