import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Mail, ArrowUpRight, Heart } from "lucide-react";
import { Logo } from "./Logo";
import { useWebsitePage } from "@/lib/websiteContent";

const cols = [
  {
    title: "Organization",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Mission & Vision", to: "/mission" },
      { label: "Team", to: "/team" },
      { label: "City Chapters", to: "/chapters" },
    ],
  },
  {
    title: "Get Involved",
    links: [
      { label: "Donate", to: "/donate" },
      { label: "Volunteer", to: "/volunteer" },
      { label: "Events", to: "/events" },
      { label: "Gallery", to: "/gallery" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Programs", to: "/about#programs" },
      { label: "FAQ", to: "/faq" },
      { label: "Contact", to: "/contact" },
      { label: "Login", to: "/login" },
    ],
  },
] as const;

const SOCIAL = [
  { Icon: Facebook, key: "facebook" as const },
  { Icon: Instagram, key: "instagram" as const },
  { Icon: Twitter, key: "twitter" as const },
  { Icon: Youtube, key: "youtube" as const },
];

type FooterSections = {
  tagline?: string;
  newsletterTitle?: string;
  newsletterBody?: string;
  copyright?: string;
  social?: Partial<Record<"facebook" | "instagram" | "twitter" | "youtube", string>>;
};

export function Footer() {
  const { sections } = useWebsitePage<FooterSections>("footer");
  const social = sections.social ?? {};

  return (
    <footer className="relative mt-24 overflow-hidden bg-gradient-cool text-white">
      <svg
        className="absolute inset-x-0 top-0 -translate-y-px w-full text-background"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,42.7C840,32,960,32,1080,37.3C1200,43,1320,53,1380,58.7L1440,64L1440,0L0,0Z"
        />
      </svg>

      <div className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-brand-orange/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-brand-accent/20 blur-3xl animate-blob" />

      <div className="container-page relative pt-32 pb-10">
        <div className="mb-16 grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md md:grid-cols-[1.2fr_1fr] md:items-center md:p-10">
          <div>
            <h3 className="font-display text-2xl font-bold md:text-3xl">
              {sections.newsletterTitle || "Stay part of the mission"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-white/70">
              {sections.newsletterBody ||
                "Monthly stories from the field, upcoming events and how your support is shaping lives. No spam — ever."}
            </p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-full border border-white/10 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-brand-orange focus:bg-white/15"
              />
            </div>
            <button className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-warm px-5 py-3 text-sm font-semibold shadow-warm transition hover:-translate-y-0.5">
              Subscribe
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
            </button>
          </form>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="[&_span]:!text-white [&_.text-muted-foreground]:!text-white/60 [&_.text-foreground]:!text-white">
              <Logo />
            </div>
            <p className="mt-5 max-w-sm text-sm text-white/70">
              {sections.tagline ||
                "A humanitarian welfare organization uniting volunteers and donors to deliver compassion, dignity and lasting change to communities everywhere."}
            </p>
            <div className="mt-6 flex gap-2">
              {SOCIAL.map(({ Icon, key }) => (
                <a
                  key={key}
                  href={social[key] || "#"}
                  aria-label={key}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:-translate-y-0.5 hover:border-brand-orange hover:bg-brand-orange hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/90">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-white/70 transition hover:text-brand-orange">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {sections.copyright || "Serve Humanity. All rights reserved."}
          </p>
          <p className="inline-flex items-center gap-1.5">
            Made with <Heart className="h-3 w-3 fill-brand-orange text-brand-orange animate-heartbeat" /> for humanity
          </p>
        </div>
      </div>
    </footer>
  );
}
