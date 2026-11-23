import { PackageMetadata, Vulnerability } from '../../types';

export const fetchNpmMetadata = async (packageName: string): Promise<PackageMetadata | null> => {
  try {
    const res = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const checkVulnerabilities = async (packageName: string, version: string): Promise<Vulnerability[]> => {
  try {
    const res = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { name: packageName, ecosystem: 'npm' },
        version: version
      }),
    });
    const data = await res.json();
    return data.vulns || [];
  } catch {
    return [];
  }
};