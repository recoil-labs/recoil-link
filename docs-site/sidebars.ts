import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Introduction',
      collapsed: false,
      items: ['intro', 'how-it-works'],
    },
    {
      type: 'category',
      label: 'Getting started',
      collapsed: false,
      items: ['quickstart', 'getting-started/local-development'],
    },
    {
      type: 'category',
      label: 'Build',
      collapsed: false,
      items: [
        'build/send-messages',
        'build/receive-messages',
        'build/gas-and-fees',
        'build/developer-tools',
        'build/testing',
        'build/prove-intent-fills',
      ],
    },
    {
      type: 'category',
      label: 'Protocol',
      items: ['learn/security-modules', 'learn/hooks', 'learn/agents'],
    },
    {
      type: 'category',
      label: 'Use cases',
      items: ['use-cases/recoilpay'],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/networks',
        'reference/validators',
        'reference/contracts',
        'reference/message-format',
        'reference/cli',
        'reference/registry',
      ],
    },
    {
      type: 'category',
      label: 'Operate',
      items: ['operate/security', 'operate/run-agents'],
    },
    {
      type: 'category',
      label: 'Resources',
      items: ['resources/message-debugging', 'resources/glossary', 'faq'],
    },
  ],
};

export default sidebars;
