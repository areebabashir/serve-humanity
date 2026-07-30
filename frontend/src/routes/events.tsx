import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

type EventsSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  items?: { title: string; date: string; location: string; days?: number; capacity?: string }[];
};

export default function Page() {
  const { sections } = useWebsitePage<EventsSections>("events");
  const hero = sections.hero ?? {};
  const events = sections.items ?? [];

  return (
    <>
      <Helmet>
        <title>Events — Serve Humanity</title>
        <meta name="description" content="Upcoming humanitarian events, drives and camps you can join or support." />
        <meta property="og:title" content="Events — Serve Humanity" />
        <meta property="og:url" content="/events" />
        <link rel="canonical" href="/events" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "Events"}
          title={highlightTitle(hero.title || "Show up. Change lives.", hero.titleHighlight)}
          description={hero.description}
        />
        <section className="page-section grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e, i) => (
            <Reveal key={e.title} delay={i}>
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/20 blur-3xl transition-all group-hover:scale-125" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-accent">
                    <Calendar className="h-3.5 w-3.5" /> {e.date}
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold">{e.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {e.location}
                  </p>
                  <div className="mt-5 flex gap-2">
                    <div className="flex-1 rounded-2xl bg-secondary p-3">
                      <Clock className="h-3.5 w-3.5 text-brand-blue" />
                      <div className="mt-1 font-display font-bold">{e.days ?? 0}d</div>
                      <div className="text-[10px] uppercase text-muted-foreground">to go</div>
                    </div>
                    <div className="flex-1 rounded-2xl bg-secondary p-3">
                      <Users className="h-3.5 w-3.5 text-brand-accent" />
                      <div className="mt-1 font-display text-xs font-bold">{e.capacity || "—"}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">capacity</div>
                    </div>
                  </div>
                  <button className="mt-4 w-full rounded-full bg-gradient-warm py-2.5 text-sm font-semibold text-white shadow-warm transition hover:-translate-y-0.5">
                    Register
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </section>
      </SiteLayout>
    </>
  );
}
