import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { MapPin, Users, Package, Heart } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

type ChaptersSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  items?: { city: string; president: string; members: number; projects: number; donations: string }[];
};

export default function Page() {
  const { sections } = useWebsitePage<ChaptersSections>("chapters");
  const hero = sections.hero ?? {};
  const chapters = sections.items ?? [];

  return (
    <>
      <Helmet>
        <title>City Chapters — Serve Humanity</title>
        <meta name="description" content="36 local chapters delivering humanitarian work across the globe. Find yours." />
        <meta property="og:title" content="City Chapters — Serve Humanity" />
        <meta property="og:url" content="/chapters" />
        <link rel="canonical" href="/chapters" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "City chapters"}
          title={highlightTitle(hero.title || "Local roots, global reach", hero.titleHighlight)}
          description={hero.description}
        />
        <section className="container-page pb-24 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((c, i) => (
            <Reveal key={c.city} delay={i}>
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/20 blur-3xl transition-all group-hover:scale-125" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-accent">
                    <MapPin className="h-3.5 w-3.5" /> Chapter
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-bold">{c.city}</h3>
                  <p className="text-sm text-muted-foreground">
                    Led by <b className="text-foreground">{c.president}</b>
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-secondary p-2.5">
                      <Users className="mx-auto h-4 w-4 text-brand-blue" />
                      <div className="mt-1 font-display font-bold">{c.members}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">Members</div>
                    </div>
                    <div className="rounded-xl bg-secondary p-2.5">
                      <Package className="mx-auto h-4 w-4 text-brand-accent" />
                      <div className="mt-1 font-display font-bold">{c.projects}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">Projects</div>
                    </div>
                    <div className="rounded-xl bg-secondary p-2.5">
                      <Heart className="mx-auto h-4 w-4 text-brand-orange" />
                      <div className="mt-1 font-display text-xs font-bold">{c.donations}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">Raised</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </section>
      </SiteLayout>
    </>
  );
}
