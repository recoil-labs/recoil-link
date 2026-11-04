import { CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import type { RecentRow } from '../lib/explorer';
import { ago, short } from '../lib/format';

export function RecentMessages({
  rows,
  loading,
  now,
  onOpen,
  onRefresh,
}: {
  rows: RecentRow[] | undefined;
  loading: boolean;
  now: number;
  onOpen: (id: string) => void;
  onRefresh: () => void;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Latest messages</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />{' '}
          Refresh
        </button>
      </div>
      <p className="mt-1 text-sm text-faint">
        Sent on any Recoil Link network in the last 3 hours.
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-faint">
            <tr>
              <th className="px-4 py-3 font-normal">Message</th>
              <th className="px-4 py-3 font-normal">Route</th>
              <th className="px-4 py-3 font-normal">Sent</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows === undefined && (
              <tr>
                <td
                  colSpan={4}
                  className="border-t border-border px-4 py-6 text-center text-muted"
                >
                  Reading the chains…
                </td>
              </tr>
            )}
            {rows?.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="border-t border-border px-4 py-6 text-center text-muted"
                >
                  No messages in the last 3 hours.
                </td>
              </tr>
            )}
            {rows?.map((r) => (
              <tr
                key={r.id}
                className="border-t border-border hover:bg-surface-alt"
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onOpen(r.id)}
                    className="font-mono text-primary hover:underline"
                  >
                    {short(r.id)}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {r.origin.displayName} →{' '}
                  {r.destination?.displayName ??
                    `Domain ${r.destinationDomain}`}
                </td>
                <td className="px-4 py-3 text-muted">
                  {ago(r.timestamp, now)}
                </td>
                <td className="px-4 py-3">
                  {r.delivered ? (
                    <span className="inline-flex items-center gap-1 text-mint">
                      <CheckCircle2 className="size-4" /> Delivered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-500">
                      <Clock className="size-4" /> Waiting
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
