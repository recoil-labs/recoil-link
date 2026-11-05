import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'Recoil Link Docs',
  tagline: 'Cross-chain messaging and proof layer by Recoil Labs.',
  favicon: 'img/favicon.svg',

  // Placeholder: set to the real domain once hosting is decided (used for
  // sitemaps and canonical links only; the site works without it).
  url: 'https://docs.link.recoilpay.com',
  baseUrl: '/',

  organizationName: 'recoil-labs',
  projectName: 'recoil-link',

  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
      type: 'text/css',
    },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/docs',
          editUrl:
            'https://github.com/recoil-labs/recoil-link/edit/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    announcementBar: {
      id: 'testnet',
      content:
        'Recoil Link is live on testnets (Sepolia, Base Sepolia, OP Sepolia, BSC testnet). Mainnet follows a security audit. <a href="/docs/operate/security">Security status</a>',
      isCloseable: true,
    },
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Recoil Link',
      logo: {
        alt: 'Recoil Link',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        { to: '/docs/quickstart', label: 'Quickstart', position: 'left' },
        { to: '/docs/reference/networks', label: 'Networks', position: 'left' },
        {
          href: 'https://recoil-link-explorer.vercel.app',
          label: 'Explorer',
          position: 'right',
        },
        {
          href: 'https://github.com/recoil-labs/recoil-link-registry',
          label: 'Registry',
          position: 'right',
        },
        {
          href: 'https://github.com/recoil-labs/recoil-link',
          label: 'GitHub',
          position: 'right',
          className: 'navbar-cta',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            { label: 'What is Recoil Link', to: '/docs/intro' },
            { label: 'How it works', to: '/docs/how-it-works' },
            { label: 'Security', to: '/docs/operate/security' },
            {
              label: 'Message debugging',
              to: '/docs/resources/message-debugging',
            },
          ],
        },
        {
          title: 'Build',
          items: [
            { label: 'Quickstart', to: '/docs/quickstart' },
            { label: 'Send messages', to: '/docs/build/send-messages' },
            {
              label: 'Prove intent fills',
              to: '/docs/build/prove-intent-fills',
            },
            {
              label: 'Local development',
              to: '/docs/getting-started/local-development',
            },
          ],
        },
        {
          title: 'Reference',
          items: [
            { label: 'Networks and addresses', to: '/docs/reference/networks' },
            {
              label: 'Registry',
              href: 'https://github.com/recoil-labs/recoil-link-registry',
            },
            { label: 'RecoilPay', href: 'https://v2.recoilpay.com' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Recoil Labs. Recoil Link is a fork of Hyperlane (Apache-2.0). Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['solidity', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
