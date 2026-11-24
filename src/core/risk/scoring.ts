import { PackageMetadata, RiskFactor, RiskLabel, RiskSignal, Vulnerability } from '../../types';

const npmRegistryUrl = (packageName: string) =>
  `https://registry.npmjs.org/${packageName.split('/').map(encodeURIComponent).join('/')}`;

export const calculateRisk = (
  metadata: PackageMetadata | null,
  vulns: Vulnerability[],
  versionResolved = true,
  packageName = metadata?.name ?? '',
) => {
  let score = 0;
  const signals: RiskSignal[] = [];
  const riskFactors: RiskFactor[] = [];
  const now = new Date();
  const addFactor = (factor: RiskFactor) => {
    riskFactors.push(factor);
    score += factor.points;
  };

  if (vulns.length > 0) {
    signals.push('KNOWN_VULN');
    const cvssScores = vulns.flatMap(vulnerability =>
      vulnerability.severity?.flatMap(severity =>
        typeof severity.baseScore === 'number' ? [{ severity, vulnerability }] : [],
      ) ?? [],
    );
    let highest: typeof cvssScores[number] | undefined;
    for (const entry of cvssScores) {
      if (!highest || entry.severity.baseScore! > highest.severity.baseScore!) highest = entry;
    }
    const highestCvssScore = highest?.severity.baseScore ?? 0;
    let points: number;
    let title: string;

    if (highestCvssScore >= 9) {
      points = 60;
      title = 'Critical-severity OSV finding';
      signals.push('CRITICAL_VULN');
    } else if (highestCvssScore >= 7) {
      points = 40;
      title = 'High-severity OSV finding';
      signals.push('HIGH_VULN');
    } else if (highestCvssScore >= 4) {
      points = 20;
      title = 'Medium-severity OSV finding';
    } else if (cvssScores.length === 0) {
      points = 20;
      title = 'OSV finding without a supported CVSS score';
    } else {
      points = 10;
      title = 'Low-severity OSV finding';
    }

    addFactor({
      id: 'osv-vulnerabilities',
      title,
      detail: highest
        ? `${vulns.length} ${vulns.length === 1 ? 'advisory affects' : 'advisories affect'} the resolved version. Highest supported CVSS score: ${highestCvssScore.toFixed(1)} (${highest.severity.type}).`
        : `${vulns.length} ${vulns.length === 1 ? 'advisory affects' : 'advisories affect'} the resolved version, but OSV provided no supported CVSS base score.`,
      points,
      source: 'OSV',
      sourceUrl: `https://osv.dev/vulnerability/${encodeURIComponent((highest?.vulnerability ?? vulns[0]).id)}`,
    });
  }

  if (!metadata) {
    signals.push('NOT_FOUND');
    addFactor({
      id: 'package-not-found',
      title: 'Package not found in npm registry',
      detail: 'The npm registry returned not found for this package name.',
      points: 40,
      source: 'npm registry',
      sourceUrl: npmRegistryUrl(packageName),
    });
    if (vulns.length === 0) {
      return { score, label: 'Unknown' as RiskLabel, signals, riskFactors };
    }
  }

  if (!versionResolved) {
    signals.push('VERSION_UNRESOLVED');
    addFactor({
      id: 'version-unresolved',
      title: 'Version could not be resolved',
      detail: 'No exact version was available, so the OSV vulnerability check could not be run for this dependency.',
      points: 0,
      source: 'Manifest',
    });
    if (vulns.length === 0) {
      return { score, label: 'Unknown' as RiskLabel, signals, riskFactors };
    }
  }

  if (metadata) {
    const latestVersion = metadata['dist-tags'].latest;
    const publishedAt = metadata.time[latestVersion];
    const publishDate = new Date(publishedAt);
    const daysSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 3600 * 24);

    if (Number.isFinite(daysSincePublish) && daysSincePublish >= 0 && daysSincePublish < 30) {
      signals.push('RECENT_PUBLISH');
      addFactor({
        id: 'recent-publish',
        title: 'Recent npm release',
        detail: `Latest version ${latestVersion} was published ${Math.floor(daysSincePublish)} days ago (${publishedAt}).`,
        points: 20,
        source: 'npm registry',
        sourceUrl: npmRegistryUrl(metadata.name),
      });
    }
    if (!metadata.repository) {
      signals.push('MISSING_REPO');
      addFactor({
        id: 'missing-repository',
        title: 'Repository metadata missing',
        detail: 'The npm registry metadata does not list a source repository for this package.',
        points: 15,
        source: 'npm registry',
        sourceUrl: npmRegistryUrl(metadata.name),
      });
    }
  }

  let label: RiskLabel = 'Low';
  if (score >= 60) label = 'Critical';
  else if (score >= 40) label = 'High';
  else if (score >= 20) label = 'Medium';

  return { score, label, signals, riskFactors };
};