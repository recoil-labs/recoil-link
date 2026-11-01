import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

const cards = [
  {
    title: 'Send a message',
    body: 'Dispatch arbitrary bytes from a contract on one chain to a contract on another, in a few lines of Solidity.',
    to: '/docs/build/send-messages',
    cta: 'Send messages',
  },
  {
    title: 'Prove intent fills',
    body: 'Use RecoilLinkOracle as the oracle for Open Intents Framework settlers, instead of a development-only oracle.',
    to: '/docs/build/prove-intent-fills',
    cta: 'Prove fills',
  },
  {
    title: 'Look up addresses',
    body: 'Mailboxes, gas paymasters and oracles on every supported network, with domain ids.',
    to: '/docs/reference/networks',
    cta: 'Networks',
  },
];

export default function Home(): React.JSX.Element {
  return (
    <Layout
      title="Cross-chain messaging and proofs"
      description="Recoil Link lets a contract on one chain act on proof that something happened on another."
    >
      <main>
        <section className="hero-rl">
          <h1>Cross-chain messaging and proofs</h1>
          <p>
            Recoil Link lets a contract on one chain act on proof that something
            happened on another. Send a message, and Recoil Link&apos;s
            validators attest to it while its relayer delivers it.
          </p>
          <div className="buttons">
            <Link
              className="button button--primary button--lg"
              to="/docs/quickstart"
            >
              Send your first message
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="/docs/how-it-works"
            >
              How it works
            </Link>
          </div>
        </section>
        <div className="stats">
          <div>
            <strong>4</strong>testnets live
          </div>
          <div>
            <strong>~20–140 s</strong>delivery on testnet
          </div>
          <div>
            <strong>EVM</strong>today, more VMs to follow
          </div>
        </div>
        <section className="cards">
          {cards.map((c) => (
            <div className="card-rl" key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
              <Link to={c.to}>{c.cta} →</Link>
            </div>
          ))}
        </section>
      </main>
    </Layout>
  );
}
