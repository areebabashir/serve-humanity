import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Check, Heart } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";
import { DonateAccountButton } from "@/components/site/DonateAccountButton";

type DonateSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  causes?: string[];
  note?: string;
  cta?: string;
};

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Donate — Serve Humanity</title>
        <meta
          name="description"
          content="Donate to Serve Humanity via bank transfer. Every rupee is tracked and 92% goes directly to families in need."
        />
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
  const causes = sections.causes?.length
    ? sections.causes
    : ["General", "Food", "Education", "Healthcare", "Orphans", "Water"];

  return (
    <SiteLayout>
      <PageHero
        eyebrow={hero.eyebrow || "Donate"}
        title={highlightTitle(hero.title || "Your gift, multiplied", hero.titleHighlight)}
        description={hero.description}
      />
      <section className="page-section">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated md:p-8">
              <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue">
                How your gift helps
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Transfer to our official account — the same details shown when you click Donate on
                the home page.
              </p>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue">
                  Causes we support
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {causes.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <DonateAccountButton
                  label={sections.cta || "Donate now"}
                  className="w-full max-w-sm py-4"
                />
              </div>

              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                {sections.note || "92¢ direct to families"} · Tax-deductible receipt available on
                request
              </p>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-cool p-8 text-white shadow-cool">
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
                <div className="mt-8 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                  <Heart className="h-4 w-4 fill-brand-orange text-brand-orange" />
                  Account number is managed from Website → Donate in the CEO dashboard.
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
