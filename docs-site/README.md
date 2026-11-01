# Recoil Link docs

Developer documentation for Recoil Link, built with [Docusaurus](https://docusaurus.io/). Mirrors the setup of RecoilPay's docs (`recoil-pay-v2/recoil-core/docs-site`).

```sh
npm install
npm run dev        # local preview with hot reload on :3000
npm run build      # static site in build/; fails on broken links
npm start          # serve build/ on $PORT (default 8080), as on Cloud Run
```

Pages live in `docs/`; the sidebar is `sidebars.ts`. Contract addresses in `docs/reference/networks.md` mirror recoil-labs/recoil-link-registry: update both when a chain is deployed.
