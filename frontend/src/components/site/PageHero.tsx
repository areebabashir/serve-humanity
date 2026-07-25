import { motion } from "motion/react";
import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-brand-orange/25 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute right-0 top-56 h-80 w-80 rounded-full bg-brand-blue/25 blur-3xl animate-blob" />

      <div className="container-page relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-blue backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse" />
            {eyebrow}
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </motion.div>
      </div>
    </section>
  );
}
