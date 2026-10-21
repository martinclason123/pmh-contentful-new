# PMH Node 24 upgrade

Date: October 21, 2026. Status: local verification complete; approved for commit and push.
Vercel deployment verification is pending; customer follow-ups remain disabled.

## Change

- `package.json`: declare `engines.node` as `24.x`.
- `package-lock.json`: synchronize the root package's Node engine metadata.
- `.nvmrc`: select the Node 24 release line for local development.
- Existing dependency versions and resolutions are unchanged by this upgrade.
  The package files already contained uncommitted Milestone 1 additions; those
  and all other local changes were preserved.

Installed and selected Node **24.22.1** with npm **11.19.1** through the existing
nvm-windows installation. The final checks used that installation explicitly,
including its Node/npm executables and Node 24 first in the child-process PATH.
Earlier exploratory checks also passed on bundled Node 24.19.0.

Vercel uses `engines.node` to select Node 24 for future builds/functions,
overriding the older dashboard selection. It may use a newer Node 24 patch.
The existing deployment has not been changed. Verify the deployed Node version
and smoke-test the preview when this commit is deployed.
[Official Vercel version selection documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Verification on Node 24.22.1

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; existing image and React Hook warnings remain |
| `npm run test:follow-up` | 14 passed, zero failures or skips |
| `npm run test:follow-up:database` | Passed against the isolated test branch; two seed/read/reset cycles; zero synthetic fixture rows remain |
| Production build with reachable PMH origin | Passed; application/compiler/dependency warnings remain |
| Production-server HTTP checks | `/`, `/puppies` and `/our-standards` returned 200 with PMH branding; temporary server stopped |

The initial plain build failed during page generation because local `ORIGIN_URL`
pointed to an unavailable localhost server. The passing builds and production
smoke check supplied `https://www.pmhpuppies.com` as a process-only origin to
read existing content. Saved environment files were not edited. This is a local
build configuration dependency, not a change to page-fetching behavior.

The passing build still logs existing `sendSMS` export mismatch, CSS prefixing,
image/Hook and Browserslist warnings, plus dependency `url.parse` deprecation and
caught Next.js dynamic-rendering notices. These were recorded, not suppressed or
fixed as part of the runtime change. No framework/dependency upgrade is included.

## Local use

The tested runtime is available through nvm-windows:

```powershell
nvm use 24.22.1
node --version
npm --version
npm run lint
npm run test:follow-up
npm run test:follow-up:database
$env:ORIGIN_URL = 'https://www.pmhpuppies.com'
npm run build
```

Set the origin only in the build shell, or use a reachable local content server
when working with local data. The database check requires the existing ignored
`.env.follow-up-test.local`; never put its credentials in this document.

nvm-windows uses a shared local Node selection rather than automatically
switching when entering a repository. Other projects can select their required
version with `nvm use`; Node 20.19.6 remains installed if needed elsewhere.

This runtime change is committed separately from the customer follow-up foundation.
Milestone 1's joint review is still awaiting Martin's recorded decision; this
runtime verification does not mark that gate passed or begin Milestone 2.
