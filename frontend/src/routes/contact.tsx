import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

const DETAIL_ICONS = [Mail, Phone, MapPin, Clock];

type ContactSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  details?: { label: string; value: string }[];
};

export default function Page() {
  const { sections } = useWebsitePage<ContactSections>("contact");
  const hero = sections.hero ?? {};
  const details = sections.details ?? [];

  return (
    <>
      <Helmet>
        <title>Contact — Serve Humanity</title>
        <meta name="description" content="Get in touch with Serve Humanity. Email, phone or visit any of our 36 chapter offices." />
        <meta property="og:title" content="Contact — Serve Humanity" />
        <meta property="og:url" content="/contact" />
        <link rel="canonical" href="/contact" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "Contact"}
          title={highlightTitle(hero.title || "Let's talk", hero.titleHighlight)}
          description={hero.description}
        />
        <section className="page-section grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div className="space-y-4">
              {details.map((c, i) => {
                const Icon = DETAIL_ICONS[i % DETAIL_ICONS.length];
                return (
                  <div key={c.label} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-brand-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue">{c.label}</div>
                      <div className="mt-0.5 font-medium">{c.value}</div>
                    </div>
                  </div>
                );
              })}
              <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
                <div className="relative aspect-[4/3] bg-gradient-cool">
                  <div className="absolute inset-0 bg-mesh opacity-40" />
                  <div className="absolute inset-0 grid place-items-center text-white">
                    <div className="text-center">
                      <MapPin className="mx-auto h-10 w-10" />
                      <p className="mt-2 font-display text-lg font-bold">Serve Humanity HQ</p>
                      <p className="text-sm text-white/70">Karachi · Pakistan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <form onSubmit={(e) => e.preventDefault()} className="rounded-3xl border border-border bg-card p-6 shadow-elevated md:p-8">
              <h3 className="font-display text-2xl font-bold">Send us a message</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { l: "Name", t: "text" },
                  { l: "Email", t: "email" },
                  { l: "Subject", t: "text", span: true },
                ].map((f) => (
                  <label key={f.l} className={`block ${f.span ? "sm:col-span-2" : ""}`}>
                    <span className="text-xs font-medium text-muted-foreground">{f.l}</span>
                    <input required type={f.t} className="peer mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-brand-orange" />
                  </label>
                ))}
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-muted-foreground">Message</span>
                  <textarea rows={5} required className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-brand-orange" />
                </label>
              </div>
              <button className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-warm py-3.5 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5">
                Send message <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          </Reveal>
        </section>
      </SiteLayout>
    </>
  );
}
