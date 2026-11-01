import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
      /{children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-[44px] sm:leading-[1.1]">
        {title}
      </h2>
      {body && (
        <p className="mt-5 text-lg leading-relaxed text-muted">{body}</p>
      )}
    </div>
  );
}

export function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 ${className}`}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function Button({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const base =
    'inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
  const styles =
    variant === 'primary'
      ? 'bg-primary text-on-primary hover:bg-primary-strong'
      : 'border border-border text-text hover:border-primary hover:text-primary';
  return (
    <a href={href} className={`${base} ${styles}`}>
      {children}
      {variant === 'primary' && <ArrowRight className="size-4" />}
    </a>
  );
}

export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary"
    >
      {children}
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}
