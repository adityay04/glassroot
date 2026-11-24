import { CVSS20, CVSS30, CVSS31, CVSS40 } from '@pandatix/js-cvss';
import { compare, gt, gte, lt, valid } from 'semver';
import { Vulnerability, VulnerabilityAffected, VulnerabilitySeverity } from '../types';

const getCvssBaseScore = (severity: VulnerabilitySeverity) => {
  try {
    switch (severity.type) {
      case 'CVSS_V2':
        return new CVSS20(severity.score).BaseScore();
      case 'CVSS_V3':
        return severity.score.startsWith('CVSS:3.0/')
          ? new CVSS30(severity.score).BaseScore()
          : new CVSS31(severity.score).BaseScore();
      case 'CVSS_V4':
        return new CVSS40(severity.score).Score();
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeSeverity = (value: unknown): VulnerabilitySeverity[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.type !== 'string' || typeof item.score !== 'string') return [];
    const entry: VulnerabilitySeverity = { type: item.type, score: item.score };
    const baseScore = getCvssBaseScore(entry);
    if (baseScore !== undefined) entry.baseScore = baseScore;
    return [entry];
  });
};

const normalizeAffected = (value: unknown): VulnerabilityAffected[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const packageData = isRecord(item.package) ? item.package : undefined;
    const ranges = Array.isArray(item.ranges)
      ? item.ranges.flatMap((range) => {
        if (!isRecord(range) || typeof range.type !== 'string' || !Array.isArray(range.events)) return [];
        return [{
          type: range.type,
          events: range.events.flatMap((event) => {
            if (!isRecord(event)) return [];
            const normalizedEvent: NonNullable<VulnerabilityAffected['ranges']>[number]['events'][number] = {};
            for (const key of ['introduced', 'fixed', 'last_affected', 'limit'] as const) {
              if (typeof event[key] === 'string') normalizedEvent[key] = event[key];
            }
            return [normalizedEvent];
          }),
        }];
      })
      : undefined;

    return [{
      package: packageData ? {
        ecosystem: typeof packageData.ecosystem === 'string' ? packageData.ecosystem : undefined,
        name: typeof packageData.name === 'string' ? packageData.name : undefined,
      } : undefined,
      severity: normalizeSeverity(item.severity),
      ranges,
      versions: Array.isArray(item.versions)
        ? item.versions.filter((version): version is string => typeof version === 'string')
        : undefined,
    }];
  });
};

const normalizeVulnerability = (value: unknown): Vulnerability | null => {
  if (!isRecord(value) || typeof value.id !== 'string') return null;

  const affected = normalizeAffected(value.affected);
  const allSeverity = [
    ...(normalizeSeverity(value.severity) ?? []),
    ...(affected?.flatMap(item => item.severity ?? []) ?? []),
  ];
  const severity = [...new Map(
    allSeverity.map(entry => [`${entry.type}:${entry.score}`, entry]),
  ).values()];

  return {
    id: value.id,
    summary: typeof value.summary === 'string' ? value.summary : undefined,
    details: typeof value.details === 'string' ? value.details : undefined,
    aliases: Array.isArray(value.aliases)
      ? value.aliases.filter((alias): alias is string => typeof alias === 'string')
      : undefined,
    severity: severity.length ? severity : undefined,
    affected,
    references: Array.isArray(value.references)
      ? value.references.filter((reference): reference is { type: string; url: string } =>
        isRecord(reference) && typeof reference.type === 'string' && typeof reference.url === 'string',
      )
      : undefined,
    published: typeof value.published === 'string' ? value.published : undefined,
    modified: typeof value.modified === 'string' ? value.modified : undefined,
  };
};

export const parseOsvResponse = (value: unknown): Vulnerability[] => {
  if (!isRecord(value) || !Array.isArray(value.vulns)) {
    if (isRecord(value) && value.vulns === undefined) return [];
    throw new Error('OSV returned an invalid vulnerability response.');
  }

  return value.vulns.map((item) => {
    const vulnerability = normalizeVulnerability(item);
    if (!vulnerability) {
      throw new Error('OSV returned a vulnerability without a valid ID.');
    }
    return vulnerability;
  });
};

export const getAffectedRangeDescriptions = (vulnerability: Vulnerability, packageName: string) =>
  (vulnerability.affected ?? [])
    .filter(affected =>
      (!affected.package?.ecosystem || affected.package.ecosystem === 'npm') &&
      (!affected.package?.name || affected.package.name === packageName),
    )
    .flatMap(affected => (affected.ranges ?? []).map(range => {
      const events = range.events.flatMap(event => {
        if (event.introduced !== undefined) return `introduced ${event.introduced}`;
        if (event.fixed !== undefined) return [`fixed ${event.fixed}`];
        if (event.last_affected !== undefined) return [`last affected ${event.last_affected}`];
        if (event.limit !== undefined) return [`limit ${event.limit}`];
        return [];
      });
      return `${range.type}: ${events.join(' → ')}`;
    }))
    .filter(description => !description.endsWith(': '));

export const getSafeExternalUrl = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.trim()
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '');
  try {
    const url = new URL(normalized);
    return url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
};

const fixedVersionsForRange = (
  events: NonNullable<NonNullable<Vulnerability['affected']>[number]['ranges']>[number]['events'],
  version: string,
) => {
  let introduced: string | null = null;
  const fixedVersions: string[] = [];
  for (const event of events) {
    if (event.introduced !== undefined) {
      introduced = event.introduced;
    } else if (event.fixed !== undefined) {
      const startsBeforeFix = introduced === '0' ||
        (introduced !== null && valid(introduced) !== null && gte(version, introduced));
      if (valid(event.fixed) && startsBeforeFix && lt(version, event.fixed)) {
        fixedVersions.push(event.fixed);
      }
      introduced = null;
    } else if (event.last_affected !== undefined) {
      introduced = null;
    } else if (event.limit !== undefined) {
      introduced = null;
    }
  }
  return fixedVersions;
};

const lteVersion = (left: string, right: string) => left === right || lt(left, right);

export const getFixedVersions = (
  vulnerability: Vulnerability,
  currentVersion: string,
  packageName?: string,
) => {
  if (!valid(currentVersion)) return [];

  const fixedVersions = new Set<string>();
  for (const affected of vulnerability.affected ?? []) {
    if (affected.package?.ecosystem && affected.package.ecosystem !== 'npm') continue;
    if (packageName && affected.package?.name && affected.package.name !== packageName) continue;
    for (const range of affected.ranges ?? []) {
      if (range.type !== 'SEMVER' && range.type !== 'ECOSYSTEM') continue;
      for (const fixedVersion of fixedVersionsForRange(range.events, currentVersion)) {
        if (gt(fixedVersion, currentVersion)) fixedVersions.add(fixedVersion);
      }
    }
  }

  return [...fixedVersions].sort(compare);
};
