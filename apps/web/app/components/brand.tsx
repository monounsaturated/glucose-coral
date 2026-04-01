"use client";

interface BrandProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function Brand({ className, iconClassName, textClassName }: BrandProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-sm ${iconClassName ?? ""}`}
        aria-hidden
      >
        <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
      </span>
      <span className={`text-sm font-semibold tracking-tight text-[var(--color-brand-ink)] ${textClassName ?? ""}`}>
        Glucose Coral
      </span>
    </span>
  );
}
