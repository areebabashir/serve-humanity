import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { HandHeart, Users, Sparkles, Trophy, ArrowRight } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

const PERK_ICONS = [Users, Sparkles, Trophy];

type VolunteerSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  perks?: { title: string; body: string }[];
};

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Become a Volunteer — Serve Humanity</title>
        <meta name="description" content="Join 12,500+ volunteers turning empathy into action. Apply today." />
        <meta property="og:title" content="Become a Volunteer — Serve Humanity" />
        <meta property="og:url" content="/volunteer" />
        <link rel="canonical" href="/volunteer" />
      </Helmet>
      <VolunteerPage />
    </>
  );
}

function VolunteerPage() {
  const { sections } = useWebsitePage<VolunteerSections>("volunteer");
  const hero = sections.hero ?? {};
  const perks = sections.perks ?? [];

  return (
    <SiteLayout>
      <PageHero
        eyebrow={hero.eyebrow || "Volunteer"}
        title={highlightTitle(hero.title || "Join the mission", hero.titleHighlight)}
        description={hero.description}
      />
      <section className="container-page pb-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-warm p-8 md:p-10 text-white shadow-warm">
            <div className="absolute inset-0 bg-mesh opacity-30" />
            <div className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-white/20 blur-3xl animate-blob" />
            <div className="relative">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <HandHeart className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-display text-3xl font-bold md:text-4xl">Why volunteer with us?</h2>
              <div className="mt-8 space-y-5">
                {perks.map((p, i) => {
                  const Icon = PERK_ICONS[i % PERK_ICONS.length];
                  return (
                    <div key={p.title} className="flex gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-display font-bold">{p.title}</div>
                        <div className="text-sm text-white/80">{p.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <form className="rounded-3xl border border-border bg-card p-6 shadow-elevated md:p-8" onSubmit={(e) => e.preventDefault()}>
              <h3 className="font-display text-2xl font-bold">Apply now</h3>
              <p className="mt-1 text-sm text-muted-foreground">Takes 60 seconds. We'll reach out within 48 hours.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {["Full name", "Email", "Phone", "City"].map((l) => (
                  <label key={l} className="block">
                    <span className="text-xs font-medium text-muted-foreground">{l}</span>
                    <input required className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-brand-orange" />
                  </label>
                ))}
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-muted-foreground">Which program interests you?</span>
                  <select className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-brand-orange">
                    {["Food Security", "Education", "Healthcare", "Emergency Relief", "Orphan Care", "Women Empowerment", "Wherever I'm needed"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-muted-foreground">Why do you want to join?</span>
                  <textarea rows={3} className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-brand-orange" />
                </label>
              </div>
              <button className="mt-6 group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-warm py-3.5 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5">
                Submit application <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
