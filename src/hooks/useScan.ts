import { useState } from 'react';
import { ScanResult } from '../types';
import { fetchNpmMetadata, checkVulnerabilities } from '../core/api/registry';
import { calculateRisk } from '../core/risk/scoring';

export function useScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const resetScan = () => {
    setResults([]);
    setError(null);
    setProgress(0);
  };

  const scanManifest = async (jsonString: string) => {
    setIsScanning(true);
    setProgress(0);
    setError(null);
    setResults([]);

    try {
      const parsed = JSON.parse(jsonString);
      const deps = { ...parsed.dependencies, ...parsed.devDependencies };
      const depNames = Object.keys(deps);

      if (depNames.length === 0) {
        throw new Error('No dependencies found in manifest.');
      }

      const scanResults: ScanResult[] = [];
      const chunkSize = 5; 
      
      for (let i = 0; i < depNames.length; i += chunkSize) {
        const chunk = depNames.slice(i, i + chunkSize);
        
        const chunkPromises = chunk.map(async (name) => {
          const versionRange = deps[name];
          const metadata = await fetchNpmMetadata(name);
          
          let vulns = [];
          if (metadata) {
            const cleanVersion = versionRange.replace(/[\^~>=<]/g, '').split(' ')[0];
            const queryVersion = cleanVersion || metadata['dist-tags'].latest;
            vulns = await checkVulnerabilities(name, queryVersion);
          }

          const risk = calculateRisk(metadata, vulns);

          return {
            name,
            versionRange,
            metadata,
            vulnerabilities: vulns,
            riskScore: risk.score,
            riskLabel: risk.label,
            signals: risk.signals,
          } as ScanResult;
        });

        const chunkResults = await Promise.all(chunkPromises);
        scanResults.push(...chunkResults);
        
        setProgress(Math.round(((i + chunkSize) / depNames.length) * 100));
      }

      scanResults.sort((a, b) => b.riskScore - a.riskScore);
      setResults(scanResults);
    } catch (err: any) {
      setError(err.message || 'Failed to parse package.json');
    } finally {
      setIsScanning(false);
    }
  };

  return { 
    isScanning, 
    progress, 
    results, 
    error, 
    scanManifest, 
    resetScan,
    setScanResults: setResults 
  };
}