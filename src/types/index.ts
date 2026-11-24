export type RiskLabel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Unknown';

export type RiskSignal = 
  | 'CRITICAL_VULN' 
  | 'HIGH_VULN' 
  | 'NOT_FOUND' 
  | 'RECENT_PUBLISH' 
  | 'MISSING_REPO' 
  | 'TYPO_SUSPECT'
  | 'VERSION_UNRESOLVED'
  | 'KNOWN_VULN';

export interface PackageMetadata {
  name: string;
  version: string;
  description?: string;
  repository?: { url: string };
  time: Record<string, string>;
  'dist-tags': { latest: string };
  versions?: Record<string, unknown>;
}

export interface Vulnerability {
  id: string;
  summary?: string;
  details?: string;
  aliases?: string[];
  severity?: VulnerabilitySeverity[];
  affected?: VulnerabilityAffected[];
  references?: { type: string; url: string }[];
  published?: string;
  modified?: string;
}

export interface VulnerabilitySeverity {
  type: string;
  score: string;
  baseScore?: number;
}

export interface VulnerabilityAffected {
  severity?: VulnerabilitySeverity[];
  package?: {
    ecosystem?: string;
    name?: string;
  };
  ranges?: {
    type: string;
    events: Array<{
      introduced?: string;
      fixed?: string;
      last_affected?: string;
      limit?: string;
    }>;
  }[];
  versions?: string[];
}

export interface RiskFactor {
  id: string;
  title: string;
  detail: string;
  points: number;
  source: string;
  sourceUrl?: string;
}

export interface ScanResult {
  name: string;
  versionRange: string;
  resolvedVersion?: string | null;
  metadata: PackageMetadata | null;
  vulnerabilities: Vulnerability[];
  riskScore: number;
  riskLabel: RiskLabel;
  signals: RiskSignal[];
  riskFactors?: RiskFactor[];
}