import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { motion } from "motion/react";
import { useState } from "react";
import { Heart, Shield, Repeat, Check } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

type DonateSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  causes?: string[];
  note?: string;
};

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Donate — Serve Humanity</title>
        <meta name="description" content="Donate securely to Serve Humanity. Every rupee is tracked and 92% goes directly to families in need." />
        <meta property="og:title" content="Donate — Serve Humanity" />
        <meta property="og:url" content="/donate" />
        <link rel="canonical" href="/donate" />
      </Helmet>
      <DonatePage />
    </>
  );
}

function DonatePage() {
  const { sections } = useWebsitePage<DonateSections>("donate");
  const hero = sections.hero ?? {};
  const causes = sections.causes?.length ? sections.causes : ["General", "Food", "Education", "Healthcare", "Orphans", "Water"];
  const [amount, setAmount] = useState(2500);
  const [freq, setFreq] = useState<"once" | "monthly">("once");
  const [cause, setCause] = useState(causes[0] || "General");
  const presets = [500, 1000, 2500, 5000, 10000, 25000];

  const impact =
    amount >= 10000
      ? { text: "sponsors an orphan for 2 months", icon: "🎓" }
      : amount >= 5000
        ? { text: "supports a child's education for a month", icon: "📚" }
        : amount >= 2500
          ? { text: "provides a family's grocery pack for 2 weeks", icon: "🛒" }
          : amount >= 1000
            ? { text: "delivers medicines to 3 patients", icon: "💊" }
            : { text: "feeds one family a warm meal", icon: "🍲" };

  return (
    <SiteLayout>
      <PageHero
        eyebrow={hero.eyebrow || "Donate"}
        title={highlightTitle(hero.title || "Your gift, multiplied", hero.titleHighlight)}
        description={hero.description}
      />
      <section className="container-page pb-24">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated md:p-8">
              <div className="flex gap-2 rounded-full bg-secondary p-1">
                {(["once", "monthly"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFreq(f)}
                    className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${freq === f ? "bg-white text-foreground shadow-soft" : "text-muted-foreground"}`}
                  >
                    {f === "once" ? "One-time" : "Monthly"}
                    {f === "monthly" && <Repeat className="ml-1.5 inline h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue">Choose cause</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {causes.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCause(c)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${cause === c ? "border-brand-orange bg-brand-orange text-white" : "border-border bg-white text-foreground hover:border-brand-orange"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue">Amount</div>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(p)}
                      className={`rounded-xl border py-2.5 text-sm font-semibold transition ${amount === p ? "border-brand-orange bg-brand-orange text-white shadow-warm" : "border-border bg-secondary hover:border-brand-orange"}`}
                    >
                      {p >= 1000 ? `${p / 1000}k` : p}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="mt-3 w-full rounded-xl border border-border bg-secondary px-4 py-3 font-display text-2xl font-bold outline-none focus:border-brand-orange"
                />
              </div>

              <div className="mt-6 rounded-2xl bg-accent p-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-brand-accent">Your impact</div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="text-3xl">{impact.icon}</div>
                  <p className="text-sm">
                    <b className="font-display">Rs. {amount.toLocaleString()}</b> {impact.text}
                  </p>
                </div>
              </div>

              <button className="mt-6 group relative w-full overflow-hidden rounded-full bg-gradient-warm py-4 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5">
                <span className="relative inline-flex items-center gap-2">
                  <Heart className="h-4 w-4 fill-white/40" />
                  Donate Rs. {amount.toLocaleString()} {freq === "monthly" ? "/mo" : ""}
                </span>
                <motion.span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>

              <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3" /> 256-bit secure
                </span>
                <span>·</span>
                <span>Tax-deductible</span>
                <span>·</span>
                <span>{sections.note || "92¢ direct to families"}</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div className="rounded-3xl border border-border bg-gradient-cool p-8 text-white shadow-cool relative overflow-hidden">
              <div className="absolute inset-0 bg-mesh opacity-30" />
              <div className="relative">
                <h3 className="font-display text-2xl font-bold">Where your money goes</h3>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "92% direct programs — food, medicine, education",
                    "5% operations — chapter coordination & logistics",
                    "3% administration — audit, compliance, reporting",
                    "Audited annually by an independent firm",
                    "Full financial report published every year",
                  ].map((l) => (
                    <li key={l} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-orange text-white">
                        <Check className="h-3 w-3" />
                      </span>
                      {l}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <p className="text-xs uppercase tracking-widest text-white/60">This month goal</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-display text-2xl font-bold">Rs. 3.2M</span>
                    <span className="text-sm text-white/70">/ Rs. 5M</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[64%] rounded-full bg-gradient-warm" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
