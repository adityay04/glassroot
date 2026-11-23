export type RiskLabel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Unknown';

export type RiskSignal = 
  | 'CRITICAL_VULN' 
  | 'HIGH_VULN' 
  | 'NOT_FOUND' 
  | 'RECENT_PUBLISH' 
  | 'MISSING_REPO' 
  | 'TYPO_SUSPECT';

export interface PackageMetadata {
  name: string;
  version: string;
  description?: string;
  repository?: { url: string };
  time: Record<string, string>;
  'dist-tags': { latest: string };
}

export interface Vulnerability {
  id: string;
  summary: string;
  details: string;
  severity?: { type: string; score: string }[];
  references: { type: string; url: string }[];
}

export interface ScanResult {
  name: string;
  versionRange: string;
  metadata: PackageMetadata | null;
  vulnerabilities: Vulnerability[];
  riskScore: number;
  riskLabel: RiskLabel;
  signals: RiskSignal[];
}