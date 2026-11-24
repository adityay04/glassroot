# GLASS//ROOT

GLASS//ROOT is a browser-based npm dependency scanner. It reads a project manifest or lockfile, resolves the package versions to check, looks up package metadata from the npm registry, and queries OSV for advisories affecting each exact version. Results combine confirmed advisory data with clearly identified package metadata signals.

It is a triage aid, not a complete security audit or a guarantee that a package is safe.

## What it does

1. Accepts dependency files by pasting text, dropping a file, or choosing a file. Choosing a file starts the scan immediately; pasted text is scanned with **Initialize Scan**.
2. Extracts package names and requested or resolved versions.
3. Looks up package metadata at the [npm registry](https://registry.npmjs.org/) and checks resolved versions against [OSV](https://osv.dev/).
4. Calculates a risk score, then displays package-level evidence, advisories, and any fixed versions OSV lists.
5. Saves completed scans in the browser so they can be revisited later.

You can cancel an active scan; this aborts its in-flight registry and OSV requests and discards partial results.

The app also has an optional Groq-powered analysis, a dependency risk map, and controls to filter, copy, and export results.

## Supported inputs and version handling

| Input | What GLASS//ROOT reads |
| --- | --- |
| `package.json` | `dependencies` and `devDependencies`. Exact versions are checked directly; ranges and npm dist-tags are resolved against versions published to npm. |
| `package-lock.json` | Resolved npm package versions, including packages recorded in the lockfile's package or dependency tree. |
| `npm-shrinkwrap.json` | Resolved npm package versions, using the npm lockfile structure. |
| Yarn Classic `yarn.lock` | Resolved package versions from Yarn v1 lock entries. |
| Modern Yarn `yarn.lock` | Resolved package versions from modern Yarn lock entries; workspace links are skipped. |
| `pnpm-lock.yaml` | Resolved package versions from pnpm package and snapshot entries. |

Lockfiles are preferred when you want to scan the exact installed dependency tree, including transitive dependencies. If a version range from `package.json` cannot be matched to an npm version, GLASS//ROOT marks it unresolved and cannot query OSV for that package. Peer and optional dependencies declared only in `package.json` are not currently included.

The parser keeps distinct resolved versions of the same package separate. Unsupported or empty lockfile data produces an error rather than a successful-looking empty scan.

## Understanding results

### Risk score

The score is an additive heuristic, not a CVSS score and not proof of malicious intent. Its current weighted factors are:

| Evidence | Points |
| --- | ---: |
| Highest supported OSV CVSS score is 9.0 or above | +60 |
| Highest supported OSV CVSS score is 7.0 to 8.9 | +40 |
| Highest supported OSV CVSS score is 4.0 to 6.9 | +20 |
| Highest supported OSV CVSS score is below 4.0 | +10 |
| OSV advisory has no supported CVSS score | +20 |
| npm reports the latest release was published less than 30 days ago | +20 |
| npm metadata has no repository field | +15 |
| npm reports that the package name does not exist | +40 |
| No exact version could be resolved | +0, with an unresolved signal |

Supported CVSS vectors are parsed for CVSS v2, v3.0/v3.1, and v4. Risk labels use the total score: **Critical** (60+), **High** (40-59), **Medium** (20-39), and **Low** (below 20). A package with no registry metadata or no resolved version and no OSV findings is labeled **Unknown** rather than treated as safe.

The recent-release check uses the publish date of the package's latest npm version, not necessarily the version being scanned. Metadata signals are indicators for review; OSV advisories are reported separately as vulnerability findings.

### Results page

- **Executive summary:** full-scan package and advisory totals, high/critical package count, unresolved version count, and counts by risk label. Filtering changes the visible list, not these full-scan totals.
- **Search and filters:** search by package name or requested/resolved version; filter by risk level, OSV advisory presence, or unresolved version status.
- **List view:** see each package's version, signals, risk label, and suggested next action.
- **Radar view:** see the project root and scanned packages arranged as a risk-colored map. This is a visualization of scan results, not a reconstructed dependency-edge graph.
- **Package details:** inspect the score breakdown and its sources, npm metadata, OSV IDs and aliases, CVSS scores, affected-range events, references, and applicable fixed versions when OSV provides them.
- **Copy and export:** copy a text summary or export the currently visible, filtered package results as JSON.
- **Scan history:** reopen or clear completed scans saved in this browser.

Fixed versions are derived from OSV affected-range events for the matching npm package and resolved version. They are advisory data, not an automatic upgrade; verify the affected range and test any upgrade in your project.

## Optional AI analysis

After a scan, you can enter a Groq API key and request a concise remediation analysis. GLASS//ROOT sends the scan's package, risk, and finding data to Groq for that request. The prompt asks the model to use only the supplied findings and to distinguish OSV-confirmed vulnerabilities from metadata signals, but AI output should still be reviewed against the cited sources.

The key is saved in this browser's `localStorage` as `glassroot_groq_key` for convenience. Remove it from the browser's local storage when you no longer want it saved. A key is not needed for scanning, viewing results, or using the history.

## Data and privacy

- There is no GLASS//ROOT application server in this project. The browser contacts the npm registry and OSV directly during scans.
- Completed scan records are stored in browser IndexedDB (`glassroot_db`). They remain local to the browser profile unless you export or otherwise share them.
- If you use AI analysis, scan data and the API key are sent directly to Groq's API. Do not enter a key you are not authorized to use.
- Clearing scan history removes the saved records from this browser; it does not affect exports or data already sent to external services.

## Run locally

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create and serve a production build:

```sh
npm run build
npm run preview
```

The available lint command is:

```sh
npm run lint
```

There is no automated test script defined in `package.json` at this time. The production build can be used to verify that the app bundles successfully.

## Included sample fixtures

The `test-fixtures/lockfiles/` directory contains small sample projects for trying each supported lockfile format:

- `npm/` - `package.json` and `package-lock.json`
- `npm-shrinkwrap/` - `package.json` and `npm-shrinkwrap.json`
- `yarn-v1/` - `package.json` and a Yarn Classic `yarn.lock`
- `yarn-modern/` - `package.json` and a modern Yarn `yarn.lock`
- `pnpm/` - `package.json` and `pnpm-lock.yaml`

Paste or upload a fixture file in the scanner to try it. Scans still use live npm and OSV data, so results can change as registry metadata and advisories change.

## Project structure

```text
index.html                         HTML shell loaded by Vite
package.json                       Runtime and development dependencies plus npm scripts
package-lock.json                  Locked npm dependency tree for this app
vite.config.js                     React and Tailwind Vite plugins
eslint.config.js                   ESLint configuration
src/
  App.tsx                           App views, scan flow, and history state
  main.jsx                          React entry point
  index.css                         Tailwind styles and marquee animation
  types/index.ts                    Shared TypeScript data types
  hooks/useScan.ts                  Scan progress, batching, and result state
  components/
    landing/
      Hero.tsx                       Landing page
      Docs.tsx                       In-app usage documentation
      About.tsx                      Project information and creator links
    scanner/
      ManifestInput.tsx              Paste, drag-and-drop, and file input
    dashboard/
      DashboardLayout.tsx            Dashboard shell and AI panel layout
      ScanResults.tsx                Summary, filters, list, and export controls
      PackageDetails.tsx             Evidence and advisory details
      HistoryDrawer.tsx              Locally saved scan history
      DependencyRadar.tsx            Risk-colored package map
  core/
    scanner/manifest.ts              Manifest/lockfile parsing and version resolution
    api/registry.ts                   npm metadata and OSV requests
    osv.ts                            OSV normalization, ranges, and fixed versions
    risk/scoring.ts                   Evidence-based weighted risk calculation
    db/history.ts                     Browser IndexedDB scan history
    ai/
      AIAssistant.tsx                 Optional AI interface and saved-key handling
      groq.ts                         Groq API request and analysis prompt
  assets/                             Images and starter SVG assets
public/                               Favicon, icons, and statue artwork
test-fixtures/lockfiles/              Sample npm, shrinkwrap, Yarn, and pnpm projects
```

The frontend is built with React, TypeScript, and Vite. Tailwind CSS handles styling; Framer Motion provides transitions; React Flow renders the radar. Semver and YAML libraries parse dependency data, and IndexedDB is accessed through `idb`.
