import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Linkedin, Twitter, Mail } from "lucide-react";
import { highlightTitle, useWebsitePage } from "@/lib/websiteContent";

type Member = { name: string; role: string; bio?: string };
type LeadershipSections = {
  hero?: { eyebrow?: string; title?: string; titleHighlight?: string; description?: string };
  groups?: { title: string; members: Member[] }[];
};

function Card({ name, role, bio }: Member) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/20 blur-3xl transition-all duration-500 group-hover:scale-125" />
      <div className="relative">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-warm font-display text-2xl font-bold text-white shadow-warm">
          {initials}
        </div>
        <h3 className="mt-5 font-display text-lg font-bold">{name}</h3>
        <p className="text-sm text-brand-blue">{role}</p>
        {bio && <p className="mt-2 text-xs text-muted-foreground">{bio}</p>}
        <div className="mt-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {[Linkedin, Twitter, Mail].map((I, i) => (
            <a
              key={i}
              href="#"
              className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:bg-brand-orange hover:text-white"
            >
              <I className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Group({ title, items }: { title: string; items: Member[] }) {
  return (
    <div>
      <Reveal>
        <h2 className="font-display text-2xl font-bold md:text-3xl">{title}</h2>
      </Reveal>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((m, i) => (
          <Reveal key={m.name} delay={i}>
            <Card {...m} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const { sections } = useWebsitePage<LeadershipSections>("leadership");
  const hero = sections.hero ?? {};
  const groups = sections.groups ?? [];

  return (
    <>
      <Helmet>
        <title>Leadership — Serve Humanity</title>
        <meta name="description" content="Meet the founders, board, chapter presidents and executive team leading Serve Humanity." />
        <meta property="og:title" content="Leadership — Serve Humanity" />
        <meta property="og:url" content="/leadership" />
        <link rel="canonical" href="/leadership" />
      </Helmet>
      <SiteLayout>
        <PageHero
          eyebrow={hero.eyebrow || "Leadership"}
          title={highlightTitle(hero.title || "The people behind the mission", hero.titleHighlight)}
          description={hero.description}
        />
        <section className="container-page pb-24 space-y-16">
          {groups.map((g) => (
            <Group key={g.title} title={g.title} items={g.members || []} />
          ))}
        </section>
      </SiteLayout>
    </>
  );
}
