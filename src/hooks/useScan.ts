import { useRef, useState } from 'react';
import { ScanResult } from '../types';
import { fetchNpmMetadata, checkVulnerabilities } from '../core/api/registry';
import { calculateRisk } from '../core/risk/scoring';
import { parseManifestInput, resolveManifestVersion } from '../core/scanner/manifest';

export function useScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetScan = () => {
    setResults([]);
    setError(null);
    setProgress(0);
  };

  const cancelScan = () => {
    abortControllerRef.current?.abort();
  };

  const scanManifest = async (jsonString: string) => {
    const abortController = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = abortController;
    setIsScanning(true);
    setProgress(0);
    setError(null);
    setResults([]);

    try {
      const dependencies = parseManifestInput(jsonString);

      const scanResults: ScanResult[] = [];
      const chunkSize = 5; 
      
      for (let i = 0; i < dependencies.length; i += chunkSize) {
        const chunk = dependencies.slice(i, i + chunkSize);
        
        const chunkPromises = chunk.map(async (dependency) => {
          const { name, versionRange } = dependency;
          const metadata = await fetchNpmMetadata(name, abortController.signal);

          const resolvedVersion = dependency.resolvedVersion ?? (metadata
            ? resolveManifestVersion(
              versionRange,
              Object.keys(metadata.versions ?? {}),
              metadata['dist-tags'],
            )
            : null);
          const vulns = resolvedVersion
            ? await checkVulnerabilities(name, resolvedVersion, abortController.signal)
            : [];
          const risk = calculateRisk(metadata, vulns, Boolean(resolvedVersion), name);

          return {
            name,
            versionRange,
            resolvedVersion,
            metadata,
            vulnerabilities: vulns,
            riskScore: risk.score,
            riskLabel: risk.label,
            signals: risk.signals,
            riskFactors: risk.riskFactors,
          };
        });

        const chunkResults = await Promise.all(chunkPromises);
        scanResults.push(...chunkResults);
        
        setProgress(Math.round((Math.min(i + chunkSize, dependencies.length) / dependencies.length) * 100));
      }

      scanResults.sort((a, b) => b.riskScore - a.riskScore);
      setResults(scanResults);
    } catch (err) {
      if (abortController.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
        setResults([]);
        setProgress(0);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to parse dependency input.');
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  return { 
    isScanning, 
    progress, 
    results, 
    error, 
    scanManifest, 
    cancelScan,
    resetScan,
    setScanResults: setResults 
  };
}