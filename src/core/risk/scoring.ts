import { PackageMetadata, Vulnerability, RiskLabel, RiskSignal } from '../../types';

export const calculateRisk = (metadata: PackageMetadata | null, vulns: Vulnerability[]) => {
  let score = 0;
  const signals: RiskSignal[] = [];
  const now = new Date();

  if (vulns.length > 0) {
    const hasCritical = vulns.some(v => v.severity?.some(s => parseFloat(s.score) >= 9.0));
    const hasHigh = vulns.some(v => v.severity?.some(s => parseFloat(s.score) >= 7.0 && parseFloat(s.score) < 9.0));
    
    if (hasCritical) { score += 50; signals.push('CRITICAL_VULN'); }
    else if (hasHigh) { score += 30; signals.push('HIGH_VULN'); }
  }

  if (!metadata) {
    score += 40; 
    signals.push('NOT_FOUND');
    return { score, label: 'Unknown' as RiskLabel, signals };
  }

  const latestVersion = metadata['dist-tags'].latest;
  const publishDate = new Date(metadata.time[latestVersion]);
  const daysSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 3600 * 24);
  
  if (daysSincePublish < 30) { score += 20; signals.push('RECENT_PUBLISH'); }
  if (!metadata.repository) { score += 15; signals.push('MISSING_REPO'); }

  let label: RiskLabel = 'Low';
  if (score >= 60) label = 'Critical';
  else if (score >= 40) label = 'High';
  else if (score >= 20) label = 'Medium';

  return { score, label, signals };
};