import { Header } from './components/Header';
import { GithubIcon, Mark } from './components/Logo';
import { Button, Section, SectionHeading, TextLink } from './components/ui';
import { EXAMPLES, EXPLORER, GITHUB, RECOILPAY, REGISTRY, docs } from './links';

const chains = [
  { name: 'Sepolia', domain: '11155111', x: 90, y: 80 },
  { name: 'Base Sepolia', domain: '84532', x: 430, y: 80 },
  { name: 'OP Sepolia', domain: '11155420', x: 90, y: 320 },
  { name: 'BSC testnet', domain: '97', x: 430, y: 320 },
];

// Routes measured with RecoilPay: Base Sepolia → Sepolia, BSC testnet → OP Sepolia.
const routes = ['M430 80 L260 200 L90 80', 'M430 320 L260 200 L90 320'];

function HeroDiagram() {
  return (
    <svg
      viewBox="0 0 520 400"
      className="w-full max-w-lg"
      role="img"
      aria-label="Messages travelling between four testnets through Recoil Link"
    >
      {chains.map((c) => (
        <line
          key={c.name}
          x1={c.x}
          y1={c.y}
          x2={260}
          y2={200}
          stroke="var(--border)"
          strokeDasharray="4 6"
        />
      ))}
      {routes.map((d, i) => (
        <circle key={d} r="6" fill="var(--cyan)">
          <animateMotion
            dur="3.2s"
            begin={`${i * 1.6}s`}
            repeatCount="indefinite"
            path={d}
          />
        </circle>
      ))}
      <circle
        cx="260"
        cy="200"
        r="44"
        fill="var(--surface)"
        stroke="var(--primary)"
      />
      <g transform="translate(246 182)">
        <Mark className="h-9 w-auto" />
      </g>
      {chains.map((c) => (
        <g key={c.name}>
          <rect
            x={c.x - 70}
            y={c.y - 26}
            width="140"
            height="52"
            rx="10"
            fill="var(--surface)"
            stroke="var(--border)"
          />
          <text
            x={c.x}
            y={c.y - 3}
            textAnchor="middle"
            fill="var(--text)"
            fontSize="14"
          >
            {c.name}
          </text>
          <text
            x={c.x}
            y={c.y + 15}
            textAnchor="middle"
            fill="var(--faint)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            {c.domain}
          </text>
        </g>
      ))}
    </svg>
  );
}

const stats = [
  ['4', 'testnets live'],
  ['21 s', 'fastest RecoilPay swap, order to finalised'],
  ['0', 'protocol fee: you pay delivery gas plus a margin'],
  ['Apache-2.0', 'open source, contracts to agents'],
];

const useCases = [
  {
    title: 'Cross-chain messages',
    body: 'Send bytes from a contract on one chain to a contract on another. Two calls: quoteDispatch, then dispatch.',
    href: docs('/docs/build/send-messages'),
    cta: 'Send messages',
  },
  {
    title: 'Intent fill proofs',
    body: 'RecoilLinkOracle proves a solver delivered on the destination before an Open Intents Framework escrow pays them.',
    href: docs('/docs/build/prove-intent-fills'),
    cta: 'Prove fills',
  },
  {
    title: 'Cross-chain control',
    body: 'Keep state in sync or trigger actions on other chains from one place, with your own security module if you want one.',
    href: docs('/docs/learn/security-modules'),
    cta: 'Security modules',
  },
];

const steps = [
  [
    'Dispatch',
    'Your contract calls Mailbox.dispatch on the origin chain and pays the quoted fee, which covers delivery gas.',
  ],
  [
    'Attest',
    'After the origin chain is final, validators sign a checkpoint of the Mailbox’s Merkle tree.',
  ],
  [
    'Deliver',
    'The relayer calls Mailbox.process on the destination. The security module checks the signatures, then your handle runs.',
  ],
];

const snippet = `bytes32 to = bytes32(uint256(uint160(recipient)));
uint256 fee = mailbox.quoteDispatch(84532, to, body);
bytes32 id = mailbox.dispatch{value: fee}(84532, to, body);

// On Base Sepolia, the Mailbox calls your recipient:
function handle(uint32 origin, bytes32 sender, bytes calldata body)
    external payable onlyMailbox { /* ... */ }`;

export default function App() {
  return (
    <div id="top" className="min-h-screen">
      <Header />
      <main>
        <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
          <div className="grid-bg pointer-events-none absolute inset-0" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
                /testnet live
              </p>
              <h1 className="mt-5 text-5xl font-light tracking-tight sm:text-7xl sm:leading-[1.02]">
                Proof across chains.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                Recoil Link lets a contract on one chain act on proof that
                something happened on another. Open source cross-chain messaging
                from Recoil Labs.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button href={docs('/docs/quickstart')}>
                  Send your first message
                </Button>
                <Button href={docs('/docs/how-it-works')} variant="secondary">
                  How it works
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <HeroDiagram />
            </div>
          </div>
        </section>

        <div className="border-y border-border bg-bg-deep px-4 sm:px-6">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
            {stats.map(([v, l]) => (
              <div key={l} className="px-2 py-8 sm:px-6">
                <dt className="text-3xl font-light">{v}</dt>
                <dd className="mt-2 text-sm text-faint">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Section id="use-cases">
          <SectionHeading
            eyebrow="build"
            title="What you can build"
            body="One Mailbox per chain. Your contracts send and receive; Recoil Link carries and proves."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {useCases.map((u) => (
              <div
                key={u.title}
                className="flex flex-col rounded-2xl border border-border bg-surface p-7"
              >
                <h3 className="text-lg font-medium">{u.title}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-muted">
                  {u.body}
                </p>
                <div className="mt-6">
                  <TextLink href={u.href}>{u.cta}</TextLink>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="how-it-works" className="bg-bg-deep">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="how it works"
                title="Dispatch, attest, deliver"
              />
              <ol className="mt-10 space-y-8">
                {steps.map(([t, b], i) => (
                  <li key={t} className="flex gap-5">
                    <span className="font-mono text-sm text-cyan">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="font-medium">{t}</h3>
                      <p className="mt-1.5 leading-relaxed text-muted">{b}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="self-center overflow-x-auto rounded-2xl border border-border bg-code-bg p-6">
              <p className="mb-4 font-mono text-xs text-faint">
                Sender.sol: Sepolia → Base Sepolia
              </p>
              <pre className="font-mono text-[13px] leading-relaxed text-[#e9e9ed]">
                <code>{snippet}</code>
              </pre>
            </div>
          </div>
        </Section>

        <Section id="case-study">
          <SectionHeading
            eyebrow="case study"
            title="RecoilPay proves every fill"
            body="RecoilPay turns a sentence into a cross-chain swap. A solver delivers first, then Recoil Link proves the delivery to the origin escrow, which only then pays the solver."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {[
              ['Base Sepolia → Sepolia', '72 s', '31 s'],
              ['BSC testnet → OP Sepolia', '21 s', '10 s'],
            ].map(([r, total, proof]) => (
              <div
                key={r}
                className="rounded-2xl border border-border bg-surface p-7"
              >
                <p className="font-mono text-sm text-faint">{r}</p>
                <p className="mt-4 text-4xl font-light">{total}</p>
                <p className="mt-1 text-sm text-muted">
                  order to finalised, of which {proof} was the proof
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-6">
            <TextLink href={docs('/docs/use-cases/recoilpay')}>
              Read the case study
            </TextLink>
            <TextLink href={RECOILPAY}>Try RecoilPay</TextLink>
          </div>
        </Section>

        <Section id="networks" className="bg-bg-deep">
          <SectionHeading
            eyebrow="networks"
            title="Live on four testnets"
            body="EVM today. Polygon Amoy and Solana next, then Move chains: Aptos-family and Sui-family."
          />
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {chains.map((c) => (
              <div
                key={c.name}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <p className="font-medium">{c.name}</p>
                <p className="mt-1 font-mono text-xs text-faint">
                  domain {c.domain}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-6">
            <TextLink href={docs('/docs/reference/networks')}>
              Addresses
            </TextLink>
            <TextLink href={REGISTRY}>Registry</TextLink>
          </div>
        </Section>

        <Section id="security">
          <SectionHeading eyebrow="security" title="Where it stands, plainly" />
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [
                'Testnet only',
                'Each chain is secured by one Recoil Labs validator today. Do not move real value yet.',
              ],
              [
                'Audit before mainnet',
                'Validator sets grow to several independent operators, and the code is audited, before launch.',
              ],
              [
                'Your own rules',
                'Any recipient can choose its own security module instead of the default one.',
              ],
            ].map(([t, b]) => (
              <li
                key={t}
                className="rounded-2xl border border-border bg-surface p-7"
              >
                <h3 className="font-medium">{t}</h3>
                <p className="mt-2 leading-relaxed text-muted">{b}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <TextLink href={docs('/docs/operate/security')}>
              Security model
            </TextLink>
          </div>
        </Section>

        <section className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-surface px-8 py-14 text-center">
            <h2 className="text-3xl font-light tracking-tight sm:text-5xl">
              Send your first message in minutes.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href={docs('/docs/quickstart')}>Start building</Button>
              <Button href={GITHUB} variant="secondary">
                View on GitHub
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-bg-deep px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Recoil Labs. Apache-2.0.</p>
          <div className="flex flex-wrap items-center gap-6">
            <a href={docs('/docs/intro')} className="hover:text-text">
              Docs
            </a>
            <a href={EXAMPLES} className="hover:text-text">
              Examples
            </a>
            <a href={EXPLORER} className="hover:text-text">
              Explorer
            </a>
            <a href={REGISTRY} className="hover:text-text">
              Registry
            </a>
            <a href={RECOILPAY} className="hover:text-text">
              RecoilPay
            </a>
            <a href={GITHUB} aria-label="GitHub" className="hover:text-text">
              <GithubIcon />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
