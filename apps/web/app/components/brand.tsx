import { Activity } from "lucide-react";

interface BrandProps {
  compact?: boolean;
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-[var(--color-logo-bg)] flex items-center justify-center border border-[var(--color-border)]">
        <Activity className="w-4 h-4 text-[var(--color-logo)]" />
      </div>
      <span className={`font-bold ${compact ? "text-sm" : "text-base"}`}>Glucose Coral</span>
    </div>
  );
}
