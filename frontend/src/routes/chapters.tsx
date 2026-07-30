import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { MapPin, Users, Package, Heart, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

type ChaptersSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
};

type PublicChapter = {
  id: string;
  name: string;
  city: string;
  president: string;
  members: number;
  projects: number;
  events: number;
  fundsRaised: number;
};

function formatFunds(amount: number) {
  if (!amount || amount <= 0) return "—";
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `Rs. ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return `Rs. ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `Rs. ${amount.toLocaleString()}`;
}

export default function Page() {
  const { sections, loading: heroLoading } = useWebsitePage<ChaptersSections>("chapters", {
    dbOnly: true,
  });
  const hero = sections.hero ?? {};
  const [chapters, setChapters] = useState<PublicChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<{ success: true; data: PublicChapter[] }>("/chapters/public")
      .then((res) => {
        if (!cancelled) setChapters(res.data ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load chapters");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const busy = loading || heroLoading;

  return (
    <>
      <Helmet>
        <title>City Chapters — Serve Humanity</title>
        <meta
          name="description"
          content="Local chapters delivering humanitarian work across the globe. Find yours."
        />
        <meta property="og:title" content="City Chapters — Serve Humanity" />
        <meta property="og:url" content="/chapters" />
        <link rel="canonical" href="/chapters" />
      </Helmet>
      <SiteLayout>
        {heroLoading ? (
          <section className="relative overflow-hidden pt-32 pb-10 md:pt-40">
            <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
            <div className="container-page relative mx-auto max-w-3xl animate-pulse text-center">
              <div className="mx-auto h-7 w-32 rounded-full bg-brand-orange/15" />
              <div className="mx-auto mt-6 h-14 w-72 rounded-2xl bg-black/10" />
            </div>
          </section>
        ) : (
          <PageHero
            eyebrow={hero.eyebrow || "City chapters"}
            title={highlightTitle(hero.title || "Local roots, global reach", hero.titleHighlight)}
            description={
              hero.description ||
              (chapters.length
                ? `${chapters.length} active chapter${chapters.length === 1 ? "" : "s"} — each led by a local president and driven by community volunteers.`
                : undefined)
            }
          />
        )}

        <section className="page-section">
          {busy ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading chapters…
            </div>
          ) : error ? (
            <p className="py-16 text-center text-sm text-destructive">{error}</p>
          ) : chapters.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No active chapters yet. Chapters created in the CEO dashboard will appear here.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {chapters.map((c, i) => (
                <Reveal key={c.id} delay={i % 6}>
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/20 blur-3xl transition-all group-hover:scale-125" />
                    <div className="relative">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-accent">
                        <MapPin className="h-3.5 w-3.5" /> Chapter
                      </div>
                      <h3 className="mt-2 font-display text-2xl font-bold">{c.city}</h3>
                      {c.name && c.name !== c.city ? (
                        <p className="text-xs text-muted-foreground">{c.name}</p>
                      ) : null}
                      <p className="mt-1 text-sm text-muted-foreground">
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
                          <div className="text-[10px] uppercase text-muted-foreground">Cases</div>
                        </div>
                        <div className="rounded-xl bg-secondary p-2.5">
                          <Heart className="mx-auto h-4 w-4 text-brand-orange" />
                          <div className="mt-1 font-display text-xs font-bold">
                            {formatFunds(c.fundsRaised)}
                          </div>
                          <div className="text-[10px] uppercase text-muted-foreground">Raised</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </SiteLayout>
    </>
  );
}
