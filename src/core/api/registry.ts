import { PackageMetadata, Vulnerability } from '../../types';
import { parseOsvResponse } from '../osv';

export const fetchNpmMetadata = async (
  packageName: string,
  signal?: AbortSignal,
): Promise<PackageMetadata | null> => {
  const packagePath = packageName.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`https://registry.npmjs.org/${packagePath}`, { signal });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`npm registry lookup failed for "${packageName}" (${response.status} ${response.statusText}).`);
  }
  return await response.json();
};

export const checkVulnerabilities = async (
  packageName: string,
  version: string,
  signal?: AbortSignal,
): Promise<Vulnerability[]> => {
  const response = await fetch('https://api.osv.dev/v1/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      package: { name: packageName, ecosystem: 'npm' },
      version,
    }),
  });
  if (!response.ok) {
    throw new Error(`OSV vulnerability query failed (${response.status} ${response.statusText}).`);
  }
  return parseOsvResponse(await response.json());
};