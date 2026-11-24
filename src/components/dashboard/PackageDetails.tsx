import { motion } from 'framer-motion';
import { ScanResult } from '../../types';
import { getAffectedRangeDescriptions, getFixedVersions, getSafeExternalUrl } from '../../core/osv';

interface PackageDetailsProps {
  pkg: ScanResult;
  onClose: () => void;
}

export default function PackageDetails({ pkg, onClose }: PackageDetailsProps) {
  const isHighRisk = pkg.riskLabel === 'High' || pkg.riskLabel === 'Critical';
  const knownFixes = pkg.vulnerabilities.flatMap(vulnerability =>
    getFixedVersions(vulnerability, pkg.resolvedVersion ?? '', pkg.name),
  );
  const uniqueFixes = [...new Set(knownFixes)];
  const registryUrl = `https://registry.npmjs.org/${pkg.name.split('/').map(encodeURIComponent).join('/')}`;
  const repositoryUrl = getSafeExternalUrl(pkg.metadata?.repository?.url);
  const latestVersion = pkg.metadata?.['dist-tags']?.latest;
  const latestPublished = latestVersion ? pkg.metadata?.time?.[latestVersion] : undefined;

  const getRiskColor = (label: string) => {
    switch (label) {
      case 'Critical': return 'text-white bg-red-600 border-red-700';
      case 'High': return 'text-red-700 bg-red-100 border-red-500';
      case 'Medium': return 'text-orange-700 bg-orange-100 border-orange-500';
      case 'Low': return 'text-green-700 bg-green-100 border-green-500';
      default: return 'text-gray-600 bg-gray-100 border-gray-400';
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#f4f4f4] border-l border-black/20 z-50 flex flex-col shadow-2xl overflow-y-auto custom-scrollbar"
      >
        <div         className="sticky top-0 bg-[#f4f4f4]/90 backdrop-blur-md p-4 sm:p-6 border-b border-black/20 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter uppercase break-all pr-4">{pkg.name}</h2>
            <p className="text-sm font-mono text-black/50 mt-1">
              Requested: {pkg.versionRange}
              <br />
              Resolved: {pkg.resolvedVersion || 'Unavailable'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-xs font-bold uppercase tracking-wider border border-black/20 px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
          >
            [ CLOSE ]
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black/50 mb-3 border-b border-black/10 pb-1">Status</h3>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-1.5 border text-xs font-bold tracking-wider uppercase ${getRiskColor(pkg.riskLabel)}`}>
                {pkg.riskLabel} RISK
              </div>
              <span className="text-sm font-mono text-black/60">Score: {pkg.riskScore}</span>
            </div>
          </div>

          <section aria-labelledby="evidence-heading">
            <h3 id="evidence-heading" className="text-xs font-bold uppercase tracking-wider text-black/50 mb-3 border-b border-black/10 pb-1">
              Evidence &amp; Score Breakdown
            </h3>
            <p className="text-xs text-black/60 leading-relaxed mb-4">
              Risk score {pkg.riskScore} is the sum of the weighted factors below. Signals are indicators, not proof of malicious intent.
            </p>
            {pkg.riskFactors && pkg.riskFactors.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pkg.riskFactors.map(factor => {
                  const sourceUrl = getSafeExternalUrl(factor.sourceUrl);
                  return (
                    <div key={factor.id} className="bg-white border border-black/10 p-3 text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-black">{factor.title}</p>
                        <span className="shrink-0 font-mono font-bold">
                          {factor.points > 0 ? `+${factor.points}` : '0 pts'}
                        </span>
                      </div>
                      <p className="mt-1 text-black/70 leading-relaxed">{factor.detail}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-black/45">
                        Source:{' '}
                        {sourceUrl ? (
                          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-black">
                            {factor.source} ↗
                          </a>
                        ) : factor.source}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="bg-white border border-black/10 p-3 text-xs text-black/60">
                {pkg.riskFactors
                  ? 'No weighted risk factors were triggered. This does not guarantee that the package is safe.'
                  : 'This saved scan does not contain a score breakdown. Rescan the package to record its evidence.'}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2 text-xs text-black/70">
              <p>
                npm metadata:{' '}
                <a href={registryUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-black">
                  Open registry record ↗
                </a>
              </p>
              <p>
                {pkg.resolvedVersion
                  ? `OSV query target: ${pkg.name}@${pkg.resolvedVersion}`
                  : `OSV check not run: no exact version resolved for "${pkg.versionRange}"`}
              </p>
              {latestPublished && (
                <p>Latest release {latestVersion} published: {latestPublished}</p>
              )}
              {repositoryUrl && (
                <p>
                  Repository:{' '}
                  <a href={repositoryUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-black">
                    {repositoryUrl} ↗
                  </a>
                </p>
              )}
              {pkg.resolvedVersion && pkg.vulnerabilities.length === 0 && (
                <p className="border-l-2 border-black/20 pl-2">
                  OSV returned no advisories for this exact version. This is not a guarantee that the package is vulnerability-free.
                </p>
              )}
            </div>
          </section>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black/50 mb-3 border-b border-black/10 pb-1">Description</h3>
            <p className="text-sm text-black/80 leading-relaxed">
              {pkg.metadata?.description || "No description provided by the npm registry for this package."}
            </p>
          </div>

          {pkg.vulnerabilities.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 mb-3 border-b border-red-600/20 pb-1">
                Vulnerabilities ({pkg.vulnerabilities.length})
              </h3>
              <div className="flex flex-col gap-3">
                {pkg.vulnerabilities.map(vuln => {
                  const fixedVersions = getFixedVersions(vuln, pkg.resolvedVersion ?? '', pkg.name);
                  const affectedRanges = getAffectedRangeDescriptions(vuln, pkg.name);
                  const references = (vuln.references ?? [])
                    .flatMap(reference => {
                      const safeUrl = getSafeExternalUrl(reference.url);
                      return safeUrl ? [{ ...reference, safeUrl }] : [];
                    })
                    .slice(0, 3);
                  return (
                    <div key={vuln.id} className="bg-white border border-black/10 p-3 text-sm">
                      <a
                        href={`https://osv.dev/vulnerability/${encodeURIComponent(vuln.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-red-600 mb-1 inline-block hover:underline"
                      >
                        {vuln.id} ↗
                      </a>
                      <p className="text-black/70 leading-relaxed">
                        {vuln.summary || 'No summary provided by OSV.'}
                      </p>
                      {vuln.severity && vuln.severity.length > 0 && (
                        <div className="mt-2 text-xs font-mono text-black/60">
                          {vuln.severity.map(severity => (
                            <p key={`${severity.type}-${severity.score}`}>
                              {severity.type.replace('_', ' ')}: {severity.baseScore !== undefined
                                ? `${severity.baseScore.toFixed(1)} / 10`
                                : 'score unavailable'}
                            </p>
                          ))}
                        </div>
                      )}
                      {vuln.aliases && vuln.aliases.length > 0 && (
                        <p className="mt-2 text-xs text-black/50">
                          Also known as: {vuln.aliases.join(', ')}
                        </p>
                      )}
                      {affectedRanges.length > 0 && (
                        <div className="mt-2 text-xs font-mono text-black/60">
                          <p className="font-bold uppercase tracking-wider">OSV affected range</p>
                          {affectedRanges.map(range => <p key={range}>{range}</p>)}
                        </div>
                      )}
                      {references.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          {references.map(reference => (
                            <a
                              key={reference.safeUrl}
                              href={reference.safeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-black/60 hover:text-black"
                            >
                              {reference.type} · {new URL(reference.safeUrl).hostname.replace(/^www\./, '')} ↗
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="mt-3 border-l-2 border-green-700 pl-2 text-xs font-bold text-green-800">
                        {fixedVersions.length > 0
                          ? `Fixed version${fixedVersions.length > 1 ? 's' : ''}: ${fixedVersions.join(', ')}`
                          : pkg.resolvedVersion
                            ? 'No fixed version is listed for this affected range.'
                            : 'Resolve the package version to identify applicable fixes.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isHighRisk && (
            <div className="bg-black text-white p-5 mt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3 border-b border-white/20 pb-1">Suggested Action</h3>
              {pkg.vulnerabilities.length === 0 ? (
                <p className="text-sm leading-relaxed mb-4">
                  The risk rating is based on package metadata signals; OSV returned no confirmed vulnerabilities for this resolved version.
                </p>
              ) : uniqueFixes.length > 0 ? (
                <p className="text-sm leading-relaxed mb-4">
                  Upgrade to a release that fixes each advisory. OSV lists these fixed versions: {uniqueFixes.join(', ')}. Verify the affected range for each finding, then rescan.
                </p>
              ) : (
                <p className="text-sm leading-relaxed mb-4">
                  This package has confirmed vulnerabilities or high-risk signals, and OSV lists no applicable fixed version. Review the advisories and consider a maintained alternative.
                </p>
              )}
              {uniqueFixes.length === 0 && (
                <div className="bg-white/10 p-3 text-xs font-mono border-l-2 border-white">
                  <p className="mb-1 text-white/50">ALTERNATIVE_STRATEGY:</p>
                  <p>Search for actively maintained forks or lighter-weight packages that perform the same function. Ensure the replacement has no open CVEs.</p>
                </div>
              )}
            </div>
          )}

          {pkg.signals.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-black/50 mb-3 border-b border-black/10 pb-1">Signals Detected</h3>
              <div className="flex flex-wrap gap-2">
                {pkg.signals.map(sig => (
                  <span key={sig} className="text-xs text-black/70 tracking-wider uppercase font-medium bg-black/5 px-2 py-1">
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}