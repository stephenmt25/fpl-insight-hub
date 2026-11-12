import { cn } from "@/lib/utils";

/** Symmetric thorned flourish used as a section divider. */
export function SigilDivider({ className }: { className?: string }) {
  const half =
    "M0 12 H70 M70 12 C82 12 86 3 96 3 C90 8 90 16 96 21 C86 21 82 12 70 12 M96 12 H128 M104 12 l6 -7 l2 7 l-2 7 z M128 12 C136 12 138 6 146 6 C142 10 142 14 146 18 C138 18 136 12 128 12";
  return (
    <svg viewBox="0 0 340 24" className={cn("mx-auto h-6 w-full max-w-md text-chrome/70", className)} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <path d={half} />
      <path d={half} transform="translate(340 0) scale(-1 1)" />
      <path d="M170 2 l5 10 l-5 10 l-5 -10 z" fill="hsl(var(--blood))" stroke="hsl(var(--blood))" />
      <path d="M150 12 h12 M178 12 h12" />
    </svg>
  );
}

/** Logo mark: a football panel inside a four-pointed thorn star. */
export function Sigil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-8 w-8", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <circle cx="32" cy="32" r="14" />
      <path d="M32 23l8.6 6.2-3.3 10.1H26.7l-3.3-10.1z" fill="hsl(var(--blood))" stroke="hsl(var(--blood))" />
      <path d="M32 1v17M32 46v17M1 32h17M46 32h17" />
      <path d="M32 1l-4 8M32 1l4 8M32 63l-4-8M32 63l4-8M1 32l8-4M1 32l8 4M63 32l-8-4M63 32l-8 4" />
    </svg>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="animate-rise space-y-3 pb-2 pt-2 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="h-display text-title text-4xl sm:text-5xl">{title}</h1>
      {children && <p className="mx-auto max-w-xl text-sm text-muted-foreground">{children}</p>}
      <SigilDivider />
    </header>
  );
}
