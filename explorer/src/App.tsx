import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Moon, Search, Sun } from 'lucide-react';
import { GithubIcon, Logo } from './components/Logo';
import { MessageCard } from './components/MessageCard';
import { RecentMessages } from './components/RecentMessages';
import {
  recentMessages,
  search,
  type RecentRow,
  type SearchResult,
} from './lib/explorer';
import { GITHUB, WEBSITE, docs } from './lib/links';
import { isHash } from './lib/message';

type Theme = 'dark' | 'light';
const POLL_MS = 10_000;

function queryFromUrl(): string {
  return new URLSearchParams(window.location.search).get('q') ?? '';
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  );
  const [input, setInput] = useState(queryFromUrl);
  const [query, setQuery] = useState(queryFromUrl);
  const [result, setResult] = useState<SearchResult>();
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string>();
  const [recent, setRecent] = useState<RecentRow[]>();
  const [recentLoading, setRecentLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now() / 1000);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('rl-theme', theme);
    } catch {
      // Storage blocked: the theme just isn't remembered.
    }
  }, [theme]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(t);
  }, []);

  const loadRecent = useCallback(() => {
    setRecentLoading(true);
    recentMessages()
      .then((r) => setRecent(r.rows))
      .catch(() => setRecent([]))
      .finally(() => setRecentLoading(false));
  }, []);
  useEffect(loadRecent, [loadRecent]);

  // Run the search for the current query, then keep polling while any message is undelivered.
  useEffect(() => {
    if (query === '') {
      setResult(undefined);
      setError(undefined);
      return;
    }
    if (!isHash(query)) {
      setResult(undefined);
      setError(
        'Enter a message id or a transaction hash: 0x followed by 64 hex characters.',
      );
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = (first: boolean) => {
      if (first) setSearching(true);
      search(query)
        .then((r) => {
          if (cancelled) return;
          setResult(r);
          setError(undefined);
          if (r.messages.some((m) => !m.delivered))
            timer = setTimeout(() => run(false), POLL_MS);
        })
        .catch((e: unknown) => {
          if (!cancelled)
            setError(
              `The search failed: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`,
            );
        })
        .finally(() => {
          if (!cancelled && first) setSearching(false);
        });
    };
    run(true);
    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [query]);

  const open = (q: string) => {
    const trimmed = q.trim();
    setInput(trimmed);
    setQuery(trimmed);
    const url = new URL(window.location.href);
    if (trimmed === '') url.searchParams.delete('q');
    else url.searchParams.set('q', trimmed);
    window.history.pushState(null, '', url);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onPop = () => {
      const q = queryFromUrl();
      setInput(q);
      setQuery(q);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    open(input);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              open('');
            }}
            className="flex items-center gap-3"
            aria-label="Explorer home"
          >
            <Logo />
            <span className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted">
              Explorer
            </span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-4">
            <a
              href={docs('/docs/intro')}
              className="hidden text-sm text-muted hover:text-text sm:block"
            >
              Docs
            </a>
            <a
              href={WEBSITE}
              className="hidden text-sm text-muted hover:text-text sm:block"
            >
              Website
            </a>
            <a
              href={GITHUB}
              aria-label="GitHub"
              className="rounded-lg p-2 text-muted hover:text-text"
            >
              <GithubIcon />
            </a>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="rounded-lg p-2 text-muted hover:text-text"
            >
              {theme === 'dark' ? (
                <Sun className="size-4.5" />
              ) : (
                <Moon className="size-4.5" />
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          /explorer · testnet
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">
          Where is my message?
        </h1>
        <p className="mt-3 text-muted">
          Paste a message id, or the hash of the transaction that sent or
          delivered it.
        </p>

        <form onSubmit={submit} className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0x… message id or transaction hash"
              spellCheck={false}
              className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 font-mono text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-strong"
          >
            Search
          </button>
        </form>

        <div className="mt-8 space-y-4">
          {error && (
            <p className="rounded-xl border border-border p-4 text-sm text-muted">
              {error}
            </p>
          )}
          {searching && (
            <p className="text-sm text-muted">
              Searching Sepolia, Base Sepolia, OP Sepolia and BSC testnet…
            </p>
          )}
          {!searching && result && result.messages.length === 0 && !error && (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">
              No message found. A message sent in the last few seconds may not
              be visible yet. By message id, undelivered messages are found only
              if they were sent in the last 3 hours; search by the sending
              transaction's hash instead.
            </div>
          )}
          {result && result.unreachable.length > 0 && (
            <p className="flex items-center gap-2 text-sm text-amber-500">
              <AlertTriangle className="size-4" /> Could not reach{' '}
              {result.unreachable.join(', ')}; results may be incomplete.
            </p>
          )}
          {!searching &&
            result?.messages.map((m) => (
              <MessageCard key={m.id} view={m} now={now} />
            ))}
        </div>

        <RecentMessages
          rows={recent}
          loading={recentLoading}
          now={now}
          onOpen={open}
          onRefresh={loadRecent}
        />
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-faint">
        Reads Recoil Link's Mailboxes directly from public RPCs; nothing is
        stored. Testnet only.
      </footer>
    </div>
  );
}
