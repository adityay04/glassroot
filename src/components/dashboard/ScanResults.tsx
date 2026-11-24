import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanResult } from '../../types';
import DependencyRadar from './DependencyRadar';
import PackageDetails from './PackageDetails';
import { getFixedVersions } from '../../core/osv';

interface ScanResultsProps {
  results: ScanResult[];
  onReset: () => void;
  onPackageDetailsOpenChange: (isOpen: boolean) => void;
}

export default function ScanResults({ results, onReset, onPackageDetailsOpenChange }: ScanResultsProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [copied, setCopied] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ScanResult | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | ScanResult['riskLabel']>('All');
  const [findingFilter, setFindingFilter] = useState<'All' | 'Advisories' | 'No_Advisories' | 'Unresolved'>('All');

  const summary = useMemo(() => ({
    total: results.length,
    withAdvisories: results.filter(pkg => pkg.vulnerabilities.length > 0).length,
    advisoryCount: results.reduce((count, pkg) => count + pkg.vulnerabilities.length, 0),
    highPriority: results.filter(pkg => pkg.riskLabel === 'Critical' || pkg.riskLabel === 'High').length,
    unresolved: results.filter(pkg => !pkg.resolvedVersion).length,
    riskCounts: results.reduce<Record<ScanResult['riskLabel'], number>>((counts, pkg) => {
      counts[pkg.riskLabel] += 1;
      return counts;
    }, { Critical: 0, High: 0, Medium: 0, Low: 0, Unknown: 0 }),
  }), [results]);

  const visibleResults = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return results.filter(pkg => {
      const matchesSearch = !normalizedSearch ||
        pkg.name.toLowerCase().includes(normalizedSearch) ||
        pkg.versionRange.toLowerCase().includes(normalizedSearch) ||
        (pkg.resolvedVersion ?? '').toLowerCase().includes(normalizedSearch);
      const matchesRisk = riskFilter === 'All' || pkg.riskLabel === riskFilter;
      const matchesFinding = findingFilter === 'All' ||
        (findingFilter === 'Advisories' && pkg.vulnerabilities.length > 0) ||
        (findingFilter === 'No_Advisories' && Boolean(pkg.resolvedVersion) && pkg.vulnerabilities.length === 0) ||
        (findingFilter === 'Unresolved' && !pkg.resolvedVersion);
      return matchesSearch && matchesRisk && matchesFinding;
    });
  }, [results, search, riskFilter, findingFilter]);

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
    const hasKnownFix = pkg.resolvedVersion && pkg.vulnerabilities.some(vulnerability =>
      getFixedVersions(vulnerability, pkg.resolvedVersion ?? '', pkg.name).length > 0,
    );
    if (hasKnownFix) return '[UPDATE_TO_FIXED]';
    if (pkg.vulnerabilities.length > 0) return '[REVIEW_NO_FIX]';
    if (pkg.riskLabel === 'Critical' || pkg.riskLabel === 'High') return '[REVIEW_SIGNALS]';
    if (pkg.riskLabel === 'Medium') return '[REVIEW]';
    if (pkg.riskLabel === 'Unknown') return '[VERIFY]';
    return '[KEEP]';
  };

  const handleCopy = () => {
    const copiedSummary = visibleResults.map(pkg =>
      `- ${pkg.name} (${pkg.versionRange}${pkg.resolvedVersion ? ` → ${pkg.resolvedVersion}` : ''}): ${pkg.riskLabel} risk. Action: ${getRemediation(pkg)}`
    ).join('\n');
    
    const text = `GLASS//ROOT VISIBLE SCAN RESULTS\n\n${copiedSummary}\n\nVisible Packages: ${visibleResults.length} of ${results.length}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(visibleResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `glassroot-scan-visible-${Date.now()}.json`;
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
              className={`min-h-11 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode('graph')}
              className={`min-h-11 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'graph' ? 'bg-black text-white' : 'hover:bg-black/5'}`}
            >
              Radar
            </button>
          </div>
          
          <button 
            onClick={handleCopy}
            className="min-h-11 text-sm border border-black/40 px-4 py-2 hover:bg-black hover:text-white transition-colors uppercase tracking-wider font-bold"
          >
            {copied ? '[ COPIED! ]' : '[ COPY_VISIBLE_SUMMARY ]'}
          </button>
          
          <button 
            onClick={handleExport}
            className="min-h-11 text-sm border border-black/40 px-4 py-2 hover:bg-black hover:text-white transition-colors uppercase tracking-wider font-bold"
          >
            [ EXPORT_VISIBLE_JSON ]
          </button>

          <button 
            onClick={onReset}
            className="min-h-11 text-sm border border-black/40 px-4 py-2 hover:bg-black hover:text-white transition-colors uppercase tracking-wider font-bold"
          >
            [ RESTART ]
          </button>
        </div>
      </div>

      <section aria-labelledby="scan-summary-heading" className="mb-8 border border-black/15 bg-white/50 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
          <div>
            <h3 id="scan-summary-heading" className="text-xl md:text-2xl font-bold uppercase tracking-tighter">
              Executive_Summary
            </h3>
            <p className="text-xs text-black/50 mt-1">Totals for the full scan; filters below only change the results list.</p>
          </div>
          <p className="text-xs font-mono text-black/60">
            SHOWING {visibleResults.length} OF {summary.total} PACKAGES
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="border border-black/10 bg-white p-3">
            <p className="text-[10px] uppercase tracking-wider text-black/50">Packages scanned</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="border border-black/10 bg-white p-3">
            <p className="text-[10px] uppercase tracking-wider text-black/50">Packages with OSV advisories</p>
            <p className="text-2xl font-bold">{summary.withAdvisories}</p>
            <p className="text-[10px] text-black/50">{summary.advisoryCount} advisory records</p>
          </div>
          <div className="border border-black/10 bg-white p-3">
            <p className="text-[10px] uppercase tracking-wider text-black/50">High / Critical risk</p>
            <p className="text-2xl font-bold">{summary.highPriority}</p>
          </div>
          <div className="border border-black/10 bg-white p-3">
            <p className="text-[10px] uppercase tracking-wider text-black/50">Unresolved versions</p>
            <p className="text-2xl font-bold">{summary.unresolved}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider">
          {(['Critical', 'High', 'Medium', 'Low', 'Unknown'] as const).map(label => (
            <span key={label} className={`border px-2 py-1 ${getRiskStyle(label)}`}>
              {label}: {summary.riskCounts[label]}
            </span>
          ))}
        </div>
      </section>

      <section aria-label="Filter scan results" className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-black/60">
          Search package or version
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="e.g. lodash or 1.2.3"
            className="min-h-11 border border-black/20 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-black placeholder:text-black/35 focus:outline-none focus:border-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-black/60">
          Risk level
          <select
            value={riskFilter}
            onChange={event => setRiskFilter(event.target.value as typeof riskFilter)}
            className="min-h-11 border border-black/20 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-black focus:outline-none focus:border-black"
          >
            <option value="All">All risk levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Unknown">Unknown</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-black/60">
          OSV / version status
          <select
            value={findingFilter}
            onChange={event => setFindingFilter(event.target.value as typeof findingFilter)}
            className="min-h-11 border border-black/20 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-black focus:outline-none focus:border-black"
          >
            <option value="All">All package states</option>
            <option value="Advisories">Has OSV advisories</option>
            <option value="No_Advisories">No advisories for resolved version</option>
            <option value="Unresolved">Version unresolved</option>
          </select>
        </label>
      </section>
      
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
              
              {visibleResults.length === 0 ? (
                <p className="border border-dashed border-black/20 p-8 text-center text-sm text-black/50">
                  No packages match the current search and filters.
                </p>
              ) : (
                <div className="flex flex-col">
                  {visibleResults.map((pkg) => (
                    <div
                      key={`${pkg.name}@${pkg.resolvedVersion ?? pkg.versionRange}`}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        onPackageDetailsOpenChange(true);
                      }}
                      className="flex flex-col md:grid md:grid-cols-12 gap-2 py-4 border-b border-black/10 md:items-center hover:bg-black/5 transition-colors cursor-pointer group"
                    >
                      <div className="md:col-span-4 text-lg font-bold truncate pr-2 text-black group-hover:text-black/60 transition-colors tracking-tight flex justify-between items-center">
                        {pkg.name}
                        <span className="md:hidden text-sm font-normal text-black/50">
                          {pkg.resolvedVersion ? `v${pkg.resolvedVersion}` : pkg.versionRange}
                        </span>
                      </div>
                      <div className="hidden md:block md:col-span-2 text-sm text-black/60 font-medium">
                        {pkg.resolvedVersion
                          ? <>{pkg.versionRange} <span className="text-black/40">→ v{pkg.resolvedVersion}</span></>
                          : <>{pkg.versionRange} <span className="text-amber-700">[ VERSION_UNRESOLVED ]</span></>}
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
                      <div className="md:col-span-3 min-w-0 flex flex-wrap justify-between md:justify-end items-center gap-2 md:gap-3 mt-3 md:mt-0 pt-3 md:pt-0 border-t border-black/5 md:border-0">
                        <div className={`shrink-0 px-3 py-1 border text-xs tracking-wider uppercase font-bold ${getRiskStyle(pkg.riskLabel)}`}>
                          {pkg.riskLabel}
                        </div>
                        <span className="min-w-0 max-w-full text-[10px] md:text-xs font-bold tracking-wider text-black/60 text-right [overflow-wrap:anywhere]">
                          {getRemediation(pkg)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="graph"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full h-[600px] border border-black/20 bg-white/40 relative"
            >
              {visibleResults.length > 0 ? (
                <DependencyRadar results={visibleResults} />
              ) : (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-black/50">
                  No packages match the current search and filters.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedPackage && (
          <PackageDetails
            pkg={selectedPackage}
            onClose={() => {
              setSelectedPackage(null);
              onPackageDetailsOpenChange(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}