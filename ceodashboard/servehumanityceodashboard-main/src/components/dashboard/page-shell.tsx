import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6 p-6">{children}</div>;
}

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "blue",
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "blue" | "orange" | "green" | "gradient";
}) {
  const accentStyle: Record<string, string> = {
    blue: "bg-primary/10 text-primary",
    orange: "bg-accent/15 text-accent",
    green: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    gradient: "text-white",
  };
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
        </div>
        {Icon && (
          <div
            className={`grid h-10 w-10 place-items-center rounded-lg ${accentStyle[accent]}`}
            style={accent === "gradient" ? { background: "var(--gradient-brand)" } : undefined}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}