import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { GithubIcon, Logo } from './Logo';
import { EXAMPLES, GITHUB, docs } from '../links';

const nav = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Use cases', href: '#use-cases' },
  { label: 'Networks', href: '#networks' },
  { label: 'Security', href: '#security' },
  { label: 'Examples', href: EXAMPLES },
  { label: 'Docs', href: docs('/docs/intro') },
];

type Theme = 'dark' | 'light';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('rl-theme', theme);
    } catch {
      // Storage blocked (private window): the theme just isn't remembered.
    }
  }, [theme]);

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-[var(--header)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" aria-label="Recoil Link home">
          <Logo />
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="text-sm text-muted hover:text-text"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggle}
            aria-label={
              theme === 'dark'
                ? 'Switch to light theme'
                : 'Switch to dark theme'
            }
            className="rounded-lg p-2 text-muted hover:text-text"
          >
            {theme === 'dark' ? (
              <Sun className="size-4.5" />
            ) : (
              <Moon className="size-4.5" />
            )}
          </button>
          <a
            href={GITHUB}
            aria-label="GitHub"
            className="hidden rounded-lg p-2 text-muted hover:text-text sm:block"
          >
            <GithubIcon />
          </a>
          <a
            href={docs('/docs/quickstart')}
            className="ml-2 hidden rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-strong sm:block"
          >
            Start building
          </a>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
            className="rounded-lg p-2 text-muted hover:text-text md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border/60 px-4 pb-4 md:hidden">
          {[
            ...nav,
            { label: 'GitHub', href: GITHUB },
            { label: 'Start building', href: docs('/docs/quickstart') },
          ].map((n) => (
            <a
              key={n.label}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-muted hover:text-text"
            >
              {n.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
