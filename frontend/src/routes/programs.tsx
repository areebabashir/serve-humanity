import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Utensils, GraduationCap, Stethoscope, LifeBuoy, Baby, Heart, Droplets, Lightbulb } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

const PROGRAM_ICONS = [Utensils, GraduationCap, Stethoscope, LifeBuoy, Baby, Heart, Droplets, Lightbulb];

type ProgramsSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  items?: { title: string; body: string; stat: string }[];
};

export default function Page() {
  const { sections } = useWebsitePage<ProgramsSections>("programs");
  const hero = sections.hero ?? {};
  const programs = sections.items ?? [];

  return (
    <>
      <Helmet>
        <title>Programs & Projects — Serve Humanity</title>
        <meta name="description" content="Eight core programs: food, education, healthcare, emergency relief, orphan care and more." />
        <meta property="og:title" content="Programs & Projects — Serve Humanity" />
        <meta property="og:url" content="/programs" />
        <link rel="canonical" href="/programs" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "Programs"}
          title={highlightTitle(hero.title || "Every program tells a story", hero.titleHighlight)}
          description={hero.description}
        />
        <section className="container-page pb-24 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {programs.map((p, i) => {
            const Icon = PROGRAM_ICONS[i % PROGRAM_ICONS.length];
            return (
              <Reveal key={p.title} delay={i}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-warm opacity-0 transition-opacity duration-500 group-hover:opacity-[0.04]" />
                  <div className="relative">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-brand-accent transition-transform group-hover:rotate-6 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
                      {p.stat}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </section>
      </SiteLayout>
    </>
  );
}
