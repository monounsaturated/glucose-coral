"use client";

interface BrandProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  size?: "sm" | "md" | "lg";
}

export function Brand({ className, iconClassName, textClassName, size = "md" }: BrandProps) {
  const iconSize = size === "sm" ? 22 : size === "lg" ? 36 : 28;
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span
        className={`inline-flex items-center justify-center rounded-xl flex-shrink-0 ${iconClassName ?? ""}`}
        style={{ width: iconSize, height: iconSize, background: "var(--color-brand)" }}
        aria-hidden
      >
        <svg
          width={iconSize * 0.65}
          height={iconSize * 0.65}
          viewBox="0 0 18 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glucose wave curve */}
          <path
            d="M1 9 C3 9 3 5 5 5 C6.5 5 6.5 10 8 10 C9.5 10 10 6 11.5 3 C13 0 13.5 1 14.5 2 C15.5 3 16 5 17 5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Meal dot */}
          <circle cx="8" cy="10" r="1.5" fill="rgba(255,255,255,0.9)" />
        </svg>
      </span>
      <span
        className={`font-semibold tracking-tight ${textSize} ${textClassName ?? ""}`}
        style={{ color: "var(--color-brand-ink)", fontFamily: "var(--font-display)" }}
      >
        Glucose Coral
      </span>
    </span>
  );
}
