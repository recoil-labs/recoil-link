// The docs site's domain is not decided yet; set VITE_DOCS_URL at build time.
const DOCS = (import.meta.env.VITE_DOCS_URL ?? 'http://localhost:3001').replace(
  /\/$/,
  '',
);

export const docs = (path = '') => `${DOCS}${path}`;
export const GITHUB = 'https://github.com/recoil-labs/recoil-link';
// The explorer's domain is not decided yet either; set VITE_EXPLORER_URL at build time.
export const EXPLORER =
  import.meta.env.VITE_EXPLORER_URL ?? 'http://localhost:5174';
export const EXAMPLES = 'https://github.com/recoil-labs/recoil-link-examples';
export const REGISTRY = 'https://github.com/recoil-labs/recoil-link-registry';
export const RECOILPAY = 'https://v2.recoilpay.com';
