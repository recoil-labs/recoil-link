// Production domains by default; VITE_DOCS_URL / VITE_EXPLORER_URL override them at build time.
const DOCS = (
  import.meta.env.VITE_DOCS_URL ?? 'https://docs.link.recoilpay.com'
).replace(/\/$/, '');

export const docs = (path = '') => `${DOCS}${path}`;
export const GITHUB = 'https://github.com/recoil-labs/recoil-link';
export const EXPLORER =
  import.meta.env.VITE_EXPLORER_URL ??
  'https://recoil-link-explorer.vercel.app';
export const EXAMPLES = 'https://github.com/recoil-labs/recoil-link-examples';
export const REGISTRY = 'https://github.com/recoil-labs/recoil-link-registry';
export const RECOILPAY = 'https://v2.recoilpay.com';
