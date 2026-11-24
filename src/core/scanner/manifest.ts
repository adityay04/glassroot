import { maxSatisfying, valid } from 'semver';
import { parseAllDocuments } from 'yaml';

export interface ParsedDependency {
  name: string;
  versionRange: string;
  resolvedVersion: string | null;
}

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const uniqueDependencies = (dependencies: ParsedDependency[]) => {
  const unique = new Map<string, ParsedDependency>();
  for (const dependency of dependencies) {
    const key = `${dependency.name}\u0000${dependency.resolvedVersion ?? dependency.versionRange}`;
    if (!unique.has(key)) unique.set(key, dependency);
  }
  return [...unique.values()];
};

const packageNameFromNpmPath = (path: string) => {
  const marker = 'node_modules/';
  const markerIndex = path.lastIndexOf(marker);
  if (markerIndex < 0) return null;

  const parts = path.slice(markerIndex + marker.length).split('/');
  if (parts[0]?.startsWith('@')) {
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
  }
  return parts[0] || null;
};

const parseNpmLock = (lock: RecordValue): ParsedDependency[] => {
  const dependencies: ParsedDependency[] = [];
  const packages = lock.packages;

  if (isRecord(packages)) {
    for (const [path, value] of Object.entries(packages)) {
      if (!path || !isRecord(value) || value.link === true || typeof value.version !== 'string') continue;
      const name = typeof value.name === 'string' ? value.name : packageNameFromNpmPath(path);
      if (!name) continue;
      dependencies.push({
        name,
        versionRange: value.version,
        resolvedVersion: value.version,
      });
    }
  } else if (isRecord(lock.dependencies)) {
    const visit = (entries: RecordValue) => {
      for (const [name, value] of Object.entries(entries)) {
        if (!isRecord(value)) continue;
        const version = typeof value.version === 'string' ? value.version : null;
        if (version) dependencies.push({ name, versionRange: version, resolvedVersion: version });
        if (isRecord(value.dependencies)) visit(value.dependencies);
      }
    };
    visit(lock.dependencies);
  }

  if (!dependencies.length) throw new Error('No resolved packages found in the npm lockfile.');
  return uniqueDependencies(dependencies);
};

const yarnNameFromDescriptor = (descriptor: string) => {
  const clean = descriptor.trim().replace(/^["']|["']$/g, '');
  const npmMarker = clean.indexOf('@npm:');
  if (npmMarker >= 0) return clean.slice(0, npmMarker) || null;

  const separator = clean.startsWith('@') ? clean.indexOf('@', 1) : clean.indexOf('@');
  return separator > 0 ? clean.slice(0, separator) : null;
};

const parseYarnLockData = (lock: RecordValue): ParsedDependency[] => {
  const dependencies: ParsedDependency[] = [];

  for (const [descriptorGroup, value] of Object.entries(lock)) {
    if (descriptorGroup === '__metadata' || !isRecord(value) || typeof value.version !== 'string') continue;
    const resolution = typeof value.resolution === 'string' ? value.resolution : '';
    if (value.linkType === 'soft' || resolution.includes('@workspace:')) continue;
    const resolvedName = yarnNameFromDescriptor(resolution);
    const descriptors = descriptorGroup.split(/,\s*(?=(?:@?[^,]))/);
    const name = resolvedName || descriptors.map(yarnNameFromDescriptor).find(Boolean);
    if (!name) continue;

    dependencies.push({
      name,
      versionRange: value.version,
      resolvedVersion: value.version,
    });
  }

  if (!dependencies.length) throw new Error('No resolved packages found in the Yarn lockfile.');
  return uniqueDependencies(dependencies);
};

const parseYarnClassicLock = (text: string): ParsedDependency[] => {
  const dependencies: ParsedDependency[] = [];
  let descriptorGroup = '';

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line) && line.endsWith(':')) {
      descriptorGroup = line.slice(0, -1);
      continue;
    }

    const versionMatch = line.match(/^\s{2}version\s+"?([^"\s]+)"?\s*$/);
    if (!versionMatch || !descriptorGroup) continue;

    const descriptors = descriptorGroup.split(/,\s*(?=(?:@?[^,]))/);
    const name = descriptors.map(yarnNameFromDescriptor).find(Boolean);
    if (name) {
      dependencies.push({
        name,
        versionRange: versionMatch[1],
        resolvedVersion: versionMatch[1],
      });
    }
    descriptorGroup = '';
  }

  if (!dependencies.length) throw new Error('No resolved packages found in the Yarn lockfile.');
  return uniqueDependencies(dependencies);
};

const pnpmNameAndVersion = (locator: string, value: RecordValue) => {
  const normalized = locator.replace(/^\/+/, '').replace(/\([^)]*\)$/, '');
  const separator = normalized.startsWith('@')
    ? normalized.indexOf('@', 1 + normalized.indexOf('/'))
    : normalized.indexOf('@');
  if (separator <= 0) return null;

  const name = normalized.slice(0, separator);
  const locatorVersion = normalized.slice(separator + 1);
  const version = typeof value.version === 'string'
    ? value.version
    : locatorVersion;
  return name && version ? { name, version } : null;
};

const parsePnpmLock = (lock: RecordValue): ParsedDependency[] => {
  const dependencies: ParsedDependency[] = [];
  for (const field of ['packages', 'snapshots']) {
    const entries = lock[field];
    if (!isRecord(entries)) continue;
    for (const [locator, value] of Object.entries(entries)) {
      if (!isRecord(value)) continue;
      const resolved = pnpmNameAndVersion(locator, value);
      if (!resolved) continue;
      dependencies.push({
        name: resolved.name,
        versionRange: resolved.version,
        resolvedVersion: resolved.version,
      });
    }
  }

  if (!dependencies.length) throw new Error('No resolved packages found in the pnpm lockfile.');
  return uniqueDependencies(dependencies);
};

const parsePackageManifest = (manifest: RecordValue): ParsedDependency[] => {
  const dependencies = [
    isRecord(manifest.dependencies) ? manifest.dependencies : {},
    isRecord(manifest.devDependencies) ? manifest.devDependencies : {},
  ];
  const parsed: ParsedDependency[] = [];

  for (const group of dependencies) {
    for (const [name, version] of Object.entries(group)) {
      if (typeof version !== 'string') {
        throw new Error(`Invalid version requirement for "${name}".`);
      }
      parsed.push({
        name,
        versionRange: version,
        resolvedVersion: valid(version),
      });
    }
  }

  if (!parsed.length) throw new Error('No dependencies found in manifest.');
  return uniqueDependencies(parsed);
};

export const parseManifestInput = (text: string): ParsedDependency[] => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (isRecord(json)) {
    if (typeof json.lockfileVersion === 'number') return parseNpmLock(json);
    return parsePackageManifest(json);
  }

  let yamlDocuments: unknown[];
  try {
    yamlDocuments = parseAllDocuments(text)
      .filter(document => document.errors.length === 0)
      .map(document => document.toJSON());
  } catch {
    return parseYarnClassicLock(text);
  }

  const yarnLock = yamlDocuments.find(isRecord);
  if (isRecord(yarnLock) && '__metadata' in yarnLock) return parseYarnLockData(yarnLock);

  const pnpmLocks = yamlDocuments.filter((document): document is RecordValue =>
    isRecord(document) && ('lockfileVersion' in document || 'importers' in document),
  );
  const projectLock = pnpmLocks.find((lock) =>
    isRecord(lock.importers) &&
    Object.values(lock.importers).some((importer) =>
      isRecord(importer) && ['dependencies', 'devDependencies', 'optionalDependencies']
        .some(field => isRecord(importer[field])),
    ),
  ) ?? pnpmLocks[pnpmLocks.length - 1];
  if (projectLock) return parsePnpmLock(projectLock);

  return parseYarnClassicLock(text);
};

export const resolveManifestVersion = (
  versionRange: string,
  versions: string[],
  distTags: Record<string, string>,
) => {
  if (valid(versionRange)) return valid(versionRange);
  if (distTags[versionRange]) return distTags[versionRange];
  return maxSatisfying(versions, versionRange);
};
