// Recoil mark (from RecoilPay) with a "Recoil Link" wordmark. Placeholder
// until Recoil Link has its own logo.
export function Mark({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 22"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4.1 12.945v8.11h13v-8.11h-13Zm1.63 6.49v-4.9h9.7v4.87l-9.7.03Z"
        fill="#07DFFF"
      />
      <path
        d="M.9.945v17.49h8.11V.945H.9Zm1.62 15.86V2.565h4.87v14.24H2.52Z"
        fill="#0334F2"
      />
      <path
        d="m9.01 12.945-1.652.079v1.65l1.759-.147-.107-1.582Z"
        fill="#07DFFF"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <Mark />
      <span className="text-[17px] font-semibold tracking-tight">
        Recoil <span className="font-normal text-muted">Link</span>
      </span>
    </span>
  );
}

export function GithubIcon({ className = 'size-4.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
