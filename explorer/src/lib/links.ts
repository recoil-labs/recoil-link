// The docs and website domains are not decided yet; set these at build time.
const DOCS = (import.meta.env.VITE_DOCS_URL ?? 'http://localhost:3001').replace(
  /\/$/,
  '',
);
export const WEBSITE =
  import.meta.env.VITE_WEBSITE_URL ?? 'http://localhost:5173';
export const docs = (path = '') => `${DOCS}${path}`;
export const GITHUB = 'https://github.com/recoil-labs/recoil-link';
