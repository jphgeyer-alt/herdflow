# HerdFlow Desktop

Native Windows wrapper (Electron) around the HerdFlow marketplace at
[www.herdflow.co.za](https://www.herdflow.co.za). Auth, routing and data all
live on the website — this app just gives farmers a dedicated taskbar/desktop
icon instead of a browser tab.

## Develop

```bash
npm install
npm run dev     # points at http://localhost:3000 — run `npm run dev` in herdflow-web first
npm start        # points at the production site
```

## Build a Windows installer

```bash
npm run build     # outputs dist/HerdFlow Setup <version>.exe
```

## Cut a release

Bump `version` in `package.json`, then:

```bash
npm run release   # builds and uploads the installer to a GitHub Release
```

Requires a `GH_TOKEN` environment variable with `repo` scope (electron-builder
reads this to publish to `jphgeyer-alt/herdflow` releases). The website's
`/download` page links to the latest GitHub Release asset.
