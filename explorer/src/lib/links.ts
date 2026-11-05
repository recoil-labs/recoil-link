// Production domains by default; VITE_DOCS_URL / VITE_WEBSITE_URL override them at build time.
const DOCS = (
  import.meta.env.VITE_DOCS_URL ?? 'https://docs.link.recoilpay.com'
).replace(/\/$/, '');
export const WEBSITE =
  import.meta.env.VITE_WEBSITE_URL ?? 'https://link.recoilpay.com';
export const docs = (path = '') => `${DOCS}${path}`;
export const GITHUB = 'https://github.com/recoil-labs/recoil-link';
