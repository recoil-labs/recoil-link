# Recoil Link website

The marketing site for Recoil Link: one static page built with Vite, React and Tailwind v4. Its colours and type follow RecoilPay's website (`recoil-pay-v2/recoil-website-v2`).

The developer docs are a separate site in [`../docs-site`](../docs-site).

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then writes dist/
npm run preview    # serves dist/
```

## Configuration

| Variable            | Used at    | Purpose                                                                   |
| ------------------- | ---------- | ------------------------------------------------------------------------- |
| `VITE_DOCS_URL`     | build time | Base URL of the docs site. Defaults to `https://docs.link.recoilpay.com`. |
| `VITE_EXPLORER_URL` | build time | Explorer URL. Defaults to `https://recoil-link-explorer.vercel.app`.      |

The defaults are the production domains; set these only to point a build elsewhere (for example a local docs server at `http://localhost:3001`).

## Deploy

The Dockerfile builds the site, then serves `dist/` with nginx on `$PORT` (default 8080), the same way RecoilPay's website runs on Cloud Run.

```bash
docker build -t recoil-link-website .   # production links by default
docker run -p 8080:8080 recoil-link-website
```

## Layout

| Path                  | What                                                                    |
| --------------------- | ----------------------------------------------------------------------- |
| `src/App.tsx`         | The page: hero, use cases, how it works, case study, networks, security |
| `src/components/`     | Header, logo, shared UI pieces                                          |
| `src/index.css`       | Theme tokens (dark and light) and Tailwind setup                        |
| `src/links.ts`        | Docs, GitHub and registry URLs                                          |
| `nginx.conf.template` | nginx config used by the Docker image                                   |

## Open items

- The logo is the Recoil mark with a "Recoil Link" wordmark, a placeholder until Recoil Link has its own.
- The site and docs domains are not decided yet.
- Network figures (testnets, timings) are copied from the docs; update both together.
