import { formatEther, type Hex } from 'viem';

export function short(hex: string, keep = 6): string {
  return hex.length > 2 * keep + 4
    ? `${hex.slice(0, keep + 2)}…${hex.slice(-keep)}`
    : hex;
}

export function duration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min ${seconds % 60} s`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export function ago(timestamp: number, now: number): string {
  const s = Math.max(0, Math.floor(now - timestamp));
  if (s < 60) return `${s} s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export function localTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function amount(wei: bigint, symbol: string): string {
  // Three significant digits, written out in full (0.00000263, not 2.63e-6).
  const v = Number(formatEther(wei));
  const digits = v === 0 ? 0 : Math.max(0, 2 - Math.floor(Math.log10(v)));
  return `${v.toFixed(Math.min(digits, 18))} ${symbol}`;
}

export type { Hex };
