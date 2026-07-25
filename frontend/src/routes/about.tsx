import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Heart, Shield, Eye, Handshake, Lightbulb, Globe2, ArrowRight } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

const VALUE_ICONS = [Heart, Shield, Eye, Handshake, Lightbulb, Globe2];

type AboutSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  story?: { title?: string; paragraphs?: string[]; cta?: string; ctaLink?: string };
  values?: { title: string; body: string }[];
};

export default function Page() {
  const { sections } = useWebsitePage<AboutSections>("about");
  const hero = sections.hero ?? {};
  const story = sections.story ?? {};
  const values = sections.values ?? [];

  return (
    <>
      <Helmet>
        <title>About Us — Serve Humanity</title>
        <meta name="description" content="A decade of humanitarian work — our story, principles and the people behind Serve Humanity." />
        <meta property="og:title" content="About Us — Serve Humanity" />
        <meta property="og:url" content="/about" />
        <link rel="canonical" href="/about" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "About us"}
          title={highlightTitle(hero.title || "Ten years of showing up", hero.titleHighlight)}
          description={hero.description}
        />
        <section className="container-page pb-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <h2 className="font-display text-3xl font-bold md:text-4xl">{story.title || "Our story"}</h2>
              {(story.paragraphs ?? []).map((p) => (
                <p key={p.slice(0, 40)} className="mt-4 text-muted-foreground">
                  {p}
                </p>
              ))}
              <Link
                to={story.ctaLink || "/leadership"}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue"
              >
                {story.cta || "Meet our leadership"} <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
            <Reveal delay={1}>
              <div className="grid grid-cols-2 gap-4">
                {values.map((c, i) => {
                  const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
                  return (
                    <Reveal key={c.title} delay={i} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                      <Icon className="h-6 w-6 text-brand-accent" />
                      <div className="mt-3 font-display text-lg font-bold">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.body}</div>
                    </Reveal>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>
      </SiteLayout>
    </>
  );
}
