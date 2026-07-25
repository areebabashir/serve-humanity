import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";
// @ts-ignore
const CountUpComponent = (CountUp.default || CountUp) as any;
import {
  Heart, Users, MapPin, Package, HandHeart, Play, ArrowRight, Sparkles,
  Shield, Eye, Handshake, Globe2, Lightbulb, Utensils, GraduationCap,
  Stethoscope, LifeBuoy, Baby, Droplets, Star, ChevronRight, Quote,
  Calendar, Clock, CheckCircle2, FileCheck, PackageCheck, PhoneCall,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import logoAsset from "@/assets/logo.png";
import { useWebsitePage } from "@/lib/websiteContent";

type HomeSections = {
  hero?: {
    eyebrow?: string;
    titlePrefix?: string;
    titleHighlight?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryCtaLink?: string;
    secondaryCta?: string;
    secondaryCtaLink?: string;
  };
  stats?: { label: string; value: string }[];
};

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Serve Humanity — Together We Build Hope</title>
        <meta name="description" content="Join Serve Humanity \u2014 a global humanitarian movement delivering food, education, healthcare and hope to communities in need. Donate, volunteer, transform lives." />
        <meta property="og:title" content="Serve Humanity \u2014 Together We Build Hope" />
        <meta property="og:url" content="/" />
        <link rel="canonical" href="/" />
      </Helmet>
      <HomePage />
    </>
  );
}


/* ---------------- HERO ---------------- */
function Hero() {
  const { sections } = useWebsitePage<HomeSections>("home");
  const hero = sections.hero ?? {};
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const tx1 = useTransform(sx, (v) => v * 20);
  const ty1 = useTransform(sy, (v) => v * 20);
  const tx2 = useTransform(sx, (v) => v * -14);
  const ty2 = useTransform(sy, (v) => v * -14);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  const STAT_META = [
    { icon: Users, color: "text-brand-accent" },
    { icon: HandHeart, color: "text-brand-orange" },
    { icon: MapPin, color: "text-brand-blue" },
    { icon: Package, color: "text-success" },
    { icon: Heart, color: "text-brand-accent" },
  ];
  const stats = (sections.stats ?? []).map((s, i) => ({
    ...s,
    icon: STAT_META[i % STAT_META.length].icon,
    color: STAT_META[i % STAT_META.length].color,
  }));

  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      {/* animated mesh */}
      <div className="pointer-events-none absolute inset-0 bg-mesh animate-gradient-shift" />
      {/* blobs */}
      <motion.div
        style={{ x: tx1, y: ty1 }}
        className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-brand-orange/30 blur-3xl"
      />
      <motion.div
        style={{ x: tx2, y: ty2 }}
        className="pointer-events-none absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-brand-blue/25 blur-3xl"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* floating particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-brand-orange/40"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              animation: `float-slow ${6 + (i % 5)}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="container-page relative grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        {/* Left */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-blue backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-orange" />
            {hero.eyebrow || "Humanitarian welfare · Since 2014"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight text-foreground md:text-7xl"
          >
            {hero.titlePrefix || "Together We"}{" "}
            <span className="relative inline-block">
              <span className="text-gradient-warm">{hero.titleHighlight || "Build Hope"}</span>
              <svg
                className="absolute -bottom-2 left-0 w-full text-brand-orange/60"
                viewBox="0 0 200 12"
                fill="none"
              >
                <motion.path
                  d="M2 8 Q 50 2 100 6 T 198 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.4, delay: 0.9 }}
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            {hero.subtitle ||
              "A world where compassion meets action. Join thousands of volunteers creating lasting change in communities that need it most."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to={hero.primaryCtaLink || "/donate"}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-warm px-6 py-3.5 text-sm font-semibold text-white shadow-warm transition-transform hover:-translate-y-0.5"
            >
              <Heart className="h-4 w-4 fill-white/40" />
              {hero.primaryCta || "Donate Now"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <Link
              to={hero.secondaryCtaLink || "/volunteer"}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3.5 text-sm font-semibold text-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-blue hover:text-brand-blue"
            >
              <HandHeart className="h-4 w-4" />
              {hero.secondaryCta || "Become Volunteer"}
            </Link>
            <button
              type="button"
              className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-blue text-white shadow-cool transition-transform group-hover:scale-110">
                <Play className="h-3.5 w-3.5 fill-white" />
              </span>
              Watch our story
            </button>
          </motion.div>

          {/* trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-10 flex items-center gap-6 text-xs text-muted-foreground"
          >
            <div className="flex -space-x-2">
              {["#F89C1B", "#234A8F", "#F45D22", "#3A5DAA"].map((c, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-background"
                  style={{ background: c }}
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-brand-orange">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current" />
                ))}
              </div>
              <p className="mt-0.5"><b className="text-foreground">12,500+</b> volunteers already joined</p>
            </div>
          </motion.div>
        </div>

        {/* Right — glass dashboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* rings */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-[420px] w-[420px] rounded-full border border-dashed border-brand-blue/20" />
          </div>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-[300px] w-[300px] rounded-full border border-dashed border-brand-orange/25" />
          </div>

      

          <div className="relative mt-4 space-y-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.09, duration: 0.6 }}
                style={{
                  marginLeft: `${(i % 2) * 40}px`,
                }}
                className="group flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 pr-5 shadow-elevated backdrop-blur-xl transition-transform hover:-translate-y-0.5"
              >
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="font-display text-lg font-bold text-foreground">{s.value}</div>
                </div>
                <div className="ml-auto text-[10px] font-semibold text-success">● live</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- ABOUT ---------------- */
function About() {
  const points = [
    "Founded in 2014 with a single food drive — now a movement of thousands.",
    "Independently audited. 92¢ of every rupee reaches beneficiaries directly.",
    "Present in 36 cities with local chapters led by trusted community leaders.",
  ];
  return (
    <section className="relative py-24">
      <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Our story
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight md:text-5xl">
            A decade of turning{" "}
            <span className="text-gradient-brand">compassion into action</span>
          </h2>
          <p className="mt-5 text-muted-foreground md:text-lg">
            Serve Humanity began as a small circle of friends who couldn't sit still
            while their neighbours went hungry. Today we're an organized humanitarian
            movement — but the heart remains unchanged: humans, showing up for humans.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((p, i) => (
              <Reveal key={i} as="li" delay={i} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-orange/15 text-brand-accent">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="text-foreground">{p}</span>
              </Reveal>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:gap-2.5 transition-all"
            >
              Read our full story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={1} className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-cool p-8 shadow-cool">
            <div className="absolute inset-0 bg-mesh opacity-40" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-orange/40 blur-3xl animate-blob" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/20 blur-3xl animate-blob" />
            <div className="relative flex h-full flex-col justify-between text-white">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-pulse" />
                  Est. 2014
                </div>
                <blockquote className="mt-8 font-display text-2xl font-medium leading-tight md:text-3xl">
                  "You can't help everyone, but everyone can help someone."
                </blockquote>
                <p className="mt-4 text-sm text-white/70">— Our founding principle</p>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                {[
                  { v: "10+", l: "Years" },
                  { v: "36", l: "Chapters" },
                  { v: "48K", l: "Lives" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="font-display text-3xl font-bold">{s.v}</div>
                    <div className="text-[11px] uppercase tracking-widest text-white/60">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- VALUES ---------------- */
function Values() {
  const values = [
    { icon: Heart, title: "Compassion", desc: "We listen first. Every person we serve is met with dignity, not pity.", color: "from-brand-accent to-brand-orange" },
    { icon: Shield, title: "Trust", desc: "Every rupee is tracked. Every family receipt is verified.", color: "from-brand-blue to-brand-blue-light" },
    { icon: Eye, title: "Transparency", desc: "Public reports. Open books. Audited yearly, without exception.", color: "from-success to-brand-blue" },
    { icon: Handshake, title: "Integrity", desc: "We keep promises. Our word is our foundation.", color: "from-brand-orange to-brand-accent" },
    { icon: Lightbulb, title: "Empowerment", desc: "We teach skills, not just deliver aid. Sustainable change matters.", color: "from-brand-blue-light to-brand-orange" },
    { icon: Globe2, title: "Unity", desc: "Faiths, backgrounds, borders — humanity is one family.", color: "from-brand-accent to-brand-blue" },
  ];
  return (
    <section className="relative py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Core values
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            The principles that <span className="text-gradient-brand">guide every act</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Six commitments we make to every community, every donor, every volunteer.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elevated">
                {/* animated border */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${v.color} opacity-10`} />
                </div>
                <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${v.color} text-white shadow-warm transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="relative mt-5 font-display text-xl font-bold">{v.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
                <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-brand-orange/0 to-brand-orange/0 blur-2xl transition-all duration-500 group-hover:from-brand-orange/30" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- IMPACT ---------------- */
function Impact() {
  const stats = [
    { end: 48200, suffix: "+", label: "Families Helped" },
    { end: 12500, suffix: "", label: "Active Volunteers" },
    { end: 36, suffix: "", label: "City Chapters" },
    { end: 210, suffix: "K", label: "Food Packages" },
  ];
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-gradient-cool" />
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-40" />
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full text-background"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path fill="currentColor" d="M0,80 C240,20 480,120 720,60 C960,0 1200,100 1440,60 L1440,100 L0,100 Z" />
      </svg>
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-brand-orange/30 blur-3xl animate-blob" />

      <div className="container-page relative text-white">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Measured impact
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            Numbers that represent{" "}
            <span className="text-gradient-warm">real people</span>
          </h2>
          <p className="mt-4 text-white/70">
            Every count is a family fed, a child in school, a neighbour who felt seen.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i}>
              <div className="group relative rounded-3xl border border-white/10 bg-white/5 p-7 text-center backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/10">
                <div className="font-display text-5xl font-bold tracking-tight">
                  <CountUpComponent end={s.end} duration={2.4} separator="," enableScrollSpy scrollSpyOnce />
                  {s.suffix}
                </div>
                <div className="mt-2 text-xs font-medium uppercase tracking-widest text-white/70">
                  {s.label}
                </div>
                <div className="pointer-events-none absolute inset-x-6 bottom-2 h-px bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CHAPTERS MAP ---------------- */
function Chapters() {
  const pins = [
    { name: "Karachi", president: "Ahmed Raza", members: 820, projects: 42, x: 22, y: 62 },
    { name: "Lahore", president: "Sana Iqbal", members: 640, projects: 38, x: 32, y: 45 },
    { name: "Islamabad", president: "Bilal Khan", members: 410, projects: 27, x: 35, y: 36 },
    { name: "Peshawar", president: "Zara Ahmad", members: 220, projects: 18, x: 28, y: 30 },
    { name: "Quetta", president: "Faisal Nazir", members: 190, projects: 14, x: 12, y: 52 },
    { name: "Dubai", president: "Hina Malik", members: 150, projects: 12, x: 52, y: 55 },
    { name: "London", president: "Omar Sheikh", members: 320, projects: 22, x: 45, y: 22 },
    { name: "New York", president: "Ayesha Noor", members: 280, projects: 19, x: 18, y: 30 },
  ];
  const [active, setActive] = useState(0);

  return (
    <section className="relative py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Global chapters
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            Local roots, <span className="text-gradient-brand">global reach</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-gradient-cool p-6 shadow-cool">
            <div className="absolute inset-0 bg-mesh opacity-30" />
            {/* stylized world grid */}
            <svg viewBox="0 0 100 60" className="relative h-full w-full">
              <defs>
                <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                  <path d="M4 0 L0 0 0 4" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.2" />
                </pattern>
              </defs>
              <rect width="100" height="60" fill="url(#grid)" />
              {/* soft continent blobs */}
              {[
                "M10,20 Q25,15 35,25 Q40,35 25,42 Q12,40 8,32 Z",
                "M42,18 Q58,12 66,22 Q60,35 48,32 Q42,28 42,18 Z",
                "M70,25 Q85,20 92,32 Q86,45 74,42 Q68,36 70,25 Z",
              ].map((d, i) => (
                <path key={i} d={d} fill="rgba(255,255,255,0.06)" />
              ))}
              {pins.map((p, i) => {
                const isActive = i === active;
                return (
                  <g
                    key={p.name}
                    transform={`translate(${p.x} ${p.y})`}
                    onMouseEnter={() => setActive(i)}
                    className="cursor-pointer"
                  >
                    <circle r={isActive ? 3 : 2} fill="#F89C1B" opacity="0.35">
                      <animate attributeName="r" values="2;5;2" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle r={isActive ? 1.6 : 1.2} fill="#F89C1B" />
                    <text
                      y={-2.5}
                      textAnchor="middle"
                      fontSize="1.6"
                      fill="white"
                      opacity={isActive ? 1 : 0.6}
                      fontWeight={600}
                    >
                      {p.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </Reveal>

          <Reveal delay={1}>
            <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-blue">
                <MapPin className="h-3.5 w-3.5" /> {pins[active].name} Chapter
              </div>
              <h3 className="mt-2 font-display text-2xl font-bold">{pins[active].name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Led by <b className="text-foreground">{pins[active].president}</b>
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-secondary p-4">
                  <div className="text-xs text-muted-foreground">Members</div>
                  <div className="font-display text-2xl font-bold">{pins[active].members}</div>
                </div>
                <div className="rounded-2xl bg-secondary p-4">
                  <div className="text-xs text-muted-foreground">Projects</div>
                  <div className="font-display text-2xl font-bold">{pins[active].projects}</div>
                </div>
              </div>
              <div className="mt-5 space-y-1.5">
                {pins.map((p, i) => (
                  <button
                    key={p.name}
                    onClick={() => setActive(i)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                      i === active
                        ? "bg-accent text-brand-accent"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- PROGRAMS (Bento) ---------------- */
function Programs() {
  const cards = [
    { icon: Utensils, title: "Food Security", desc: "Weekly rations, hot meals & Ramadan drives.", cls: "md:col-span-2 md:row-span-2 bg-gradient-warm text-white", size: "big" },
    { icon: GraduationCap, title: "Education", desc: "Scholarships & school supplies for 8,400 children.", cls: "bg-card" },
    { icon: Stethoscope, title: "Healthcare", desc: "Free clinics, medicines & maternal care.", cls: "bg-card" },
    { icon: LifeBuoy, title: "Emergency Relief", desc: "Floods, quakes, displacement — rapid response.", cls: "md:col-span-2 bg-gradient-cool text-white" },
    { icon: Baby, title: "Orphan Care", desc: "Sponsorship & family support programs.", cls: "bg-card" },
    { icon: Heart, title: "Women Empowerment", desc: "Skills training & micro-grants for women.", cls: "bg-card" },
    { icon: Droplets, title: "Clean Water", desc: "Wells, filters & rural infrastructure.", cls: "bg-card" },
    { icon: Lightbulb, title: "Skills Development", desc: "Free vocational training & job placement.", cls: "bg-card" },
  ];

  return (
    <section className="relative py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Programs
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            Eight ways we show up{" "}
            <span className="text-gradient-brand">every single day</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-3 md:auto-rows-[180px]">
          {cards.map((c, i) => {
            const isBig = c.cls.includes("row-span-2");
            const isDark = c.cls.includes("text-white");
            return (
              <Reveal
                key={c.title}
                delay={i}
                className={`group relative overflow-hidden rounded-3xl border ${isDark ? "border-white/10" : "border-border"} p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elevated ${c.cls}`}
              >
                {isDark && <div className="absolute inset-0 bg-mesh opacity-30" />}
                <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-all duration-500 group-hover:scale-125" />
                <div className="relative flex h-full flex-col">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? "bg-white/10 text-white" : "bg-accent text-brand-accent"} transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-auto pt-6">
                    <h3 className={`font-display font-bold leading-tight ${isBig ? "text-2xl md:text-3xl" : "text-lg"}`}>
                      {c.title}
                    </h3>
                    <p className={`mt-1.5 text-sm ${isDark ? "text-white/80" : "text-muted-foreground"}`}>
                      {c.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- TIMELINE ---------------- */
function Timeline() {
  const steps = [
    { icon: FileCheck, title: "Application", desc: "Family submits a request through our app or a local chapter." },
    { icon: Eye, title: "Verification", desc: "A volunteer visits, confirms need and captures documentation." },
    { icon: CheckCircle2, title: "Approval", desc: "Committee approves within 48 hours based on urgency & scope." },
    { icon: PackageCheck, title: "Distribution", desc: "Aid — food, cash, medicine — is delivered with dignity." },
    { icon: PhoneCall, title: "Follow-up", desc: "We call back in 30 days. Impact is real only if it lasts." },
  ];
  return (
    <section className="relative py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Our process
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            How every donation <span className="text-gradient-brand">reaches a life</span>
          </h2>
        </Reveal>

        <div className="relative mt-16">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent md:block hidden" />
          <div className="grid gap-6 md:gap-10">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i}>
                <div className={`grid gap-4 md:grid-cols-2 md:items-center ${i % 2 ? "md:[direction:rtl]" : ""}`}>
                  <div className={`md:[direction:ltr] ${i % 2 ? "md:pl-12" : "md:pr-12 md:text-right"}`}>
                    <div className="text-xs font-bold uppercase tracking-widest text-brand-orange">
                      Step {i + 1}
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-bold">{s.title}</h3>
                    <p className="mt-1.5 text-muted-foreground">{s.desc}</p>
                  </div>
                  <div className={`md:[direction:ltr] relative ${i % 2 ? "md:justify-self-end md:pr-12" : "md:pl-12"}`}>
                    <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-warm text-white shadow-warm animate-pulse-ring">
                      <s.icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- EVENTS ---------------- */
function Events() {
  const events = [
    { title: "Ramadan Iftar Drive", date: "Mar 12, 2026", city: "Karachi", days: 42 },
    { title: "Winter Warmth Distribution", date: "Dec 20, 2025", city: "Peshawar", days: 8 },
    { title: "Free Medical Camp", date: "Nov 05, 2025", city: "Lahore", days: 3 },
  ];
  return (
    <section className="relative py-24">
      <div className="container-page">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">Upcoming events</span>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
              Show up. <span className="text-gradient-brand">Change lives.</span>
            </h2>
          </div>
          <Link to="/events" className="text-sm font-semibold text-brand-blue hover:underline">
            View all events →
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {events.map((e, i) => (
            <Reveal key={e.title} delay={i}>
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-elevated">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-orange/20 blur-3xl transition-all duration-500 group-hover:scale-125" />
                <div className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-accent">
                  <Calendar className="h-3.5 w-3.5" /> {e.date}
                </div>
                <h3 className="relative mt-3 font-display text-xl font-bold">{e.title}</h3>
                <p className="relative mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {e.city}
                </p>
                <div className="relative mt-6 flex items-center justify-between rounded-2xl bg-secondary p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Starts in
                  </div>
                  <div className="font-display text-lg font-bold text-brand-blue">
                    {e.days} <span className="text-xs font-medium">days</span>
                  </div>
                </div>
                <button className="relative mt-4 w-full rounded-full bg-gradient-warm py-2.5 text-sm font-semibold text-white shadow-warm transition-transform hover:-translate-y-0.5">
                  Register
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
function Testimonials() {
  const t = [
    { name: "Aisha K.", role: "Volunteer, Lahore", text: "Serve Humanity gave me a way to turn empathy into weekly action. Life-changing.", stars: 5 },
    { name: "Dr. Bilal", role: "Medical Camp Lead", text: "The most transparent NGO I've worked with. Every rupee has a receipt.", stars: 5 },
    { name: "Fatima R.", role: "Donor, Dubai", text: "I sponsor two orphans. Their monthly progress reports move me to tears every time.", stars: 5 },
    { name: "Omar S.", role: "Chapter President", text: "This is a family, not a charity. And that's what makes the impact so deep.", stars: 5 },
    { name: "Sana M.", role: "Beneficiary", text: "They didn't just feed us. They restored our dignity. Forever grateful.", stars: 5 },
  ];
  const row = [...t, ...t];
  return (
    <section className="relative overflow-hidden py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Voices
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            Stories from the <span className="text-gradient-brand">people we serve</span>
          </h2>
        </Reveal>
      </div>

      <div className="relative mt-14 group">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max animate-marquee gap-5 group-hover:[animation-play-state:paused]">
          {row.map((r, i) => (
            <article
              key={i}
              className="w-[340px] shrink-0 rounded-3xl border border-border bg-card p-6 shadow-soft"
            >
              <Quote className="h-6 w-6 text-brand-orange/60" />
              <p className="mt-3 text-sm leading-relaxed text-foreground">{r.text}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-warm font-display font-bold text-white">
                  {r.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                </div>
                <div className="ml-auto flex text-brand-orange">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- DONATE ---------------- */
function DonateCTA() {
  const [amount, setAmount] = useState(2500);
  const presets = [500, 1000, 2500, 5000, 10000];
  const impact =
    amount >= 5000
      ? "supports a child's education for a month"
      : amount >= 2500
      ? "provides a family's grocery pack for 2 weeks"
      : amount >= 1000
      ? "delivers medicines to 3 patients"
      : "feeds one family a warm meal";

  const goalPct = Math.min(100, Math.round((amount / 10000) * 100));

  return (
    <section className="relative py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-cool p-6 shadow-cool md:p-14">
          <div className="absolute inset-0 bg-mesh opacity-40" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-brand-orange/30 blur-3xl animate-blob" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-blob" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div className="text-white">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
                Make a difference today
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
                Your donation, <span className="text-gradient-warm">multiplied by love</span>
              </h2>
              <p className="mt-4 max-w-md text-white/70">
                Choose an amount and see exactly what it becomes — a meal, a medicine, a
                lesson. Every rupee is tracked.
              </p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
                  <Heart className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" />
                  Your Rs. {amount.toLocaleString()} {impact}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/95 p-6 shadow-elevated md:p-8">
              <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue">
                Choose amount
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(p)}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                      amount === p
                        ? "border-brand-orange bg-brand-orange text-white shadow-warm"
                        : "border-border bg-secondary text-foreground hover:border-brand-orange"
                    }`}
                  >
                    {p >= 1000 ? `${p / 1000}k` : p}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-xs font-medium text-muted-foreground">
                  Or enter custom amount (Rs.)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-secondary px-4 py-3 font-display text-2xl font-bold outline-none focus:border-brand-orange"
                />
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Toward Rs. 10,000 impact tier</span>
                  <span>{goalPct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    animate={{ width: `${goalPct}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 18 }}
                    className="h-full rounded-full bg-gradient-warm"
                  />
                </div>
              </div>

              <button className="mt-5 w-full rounded-full bg-gradient-warm py-3.5 text-sm font-bold text-white shadow-warm transition-transform hover:-translate-y-0.5">
                Donate Rs. {amount.toLocaleString()}
              </button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Secure payment · Tax-deductible receipt · 92¢ goes directly to families
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- SPONSORS ---------------- */
function Sponsors() {
  const { sections } = useWebsitePage<{
    partners?: {
      title?: string;
      items?: { name?: string; logoUrl?: string }[];
      names?: string[];
    };
  }>("home");
  const partners = sections.partners ?? {};
  const fallback = [
    { name: "UNICEF", logoUrl: "" },
    { name: "Red Crescent", logoUrl: "" },
    { name: "WHO Partners", logoUrl: "" },
    { name: "UNHCR", logoUrl: "" },
    { name: "Save the Children", logoUrl: "" },
    { name: "OXFAM", logoUrl: "" },
    { name: "Care Intl.", logoUrl: "" },
    { name: "Islamic Relief", logoUrl: "" },
  ];
  const items: { name: string; logoUrl: string }[] = (() => {
    if (partners.items?.length) {
      return partners.items
        .map((p) => ({ name: p.name || "", logoUrl: p.logoUrl || "" }))
        .filter((p) => p.name || p.logoUrl);
    }
    if (partners.names?.length) {
      return partners.names.filter(Boolean).map((name) => ({ name, logoUrl: "" }));
    }
    return fallback;
  })();
  const row = [...items, ...items];
  return (
    <section className="py-16 border-y border-border bg-secondary/40">
      <div className="container-page">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {partners.title || "Trusted by partners around the world"}
        </p>
        <div className="mt-8 overflow-hidden group">
          <div className="flex w-max animate-marquee items-center gap-14 group-hover:[animation-play-state:paused]">
            {row.map((p, i) => (
              <span
                key={i}
                className="inline-flex h-12 min-w-[7rem] items-center justify-center grayscale transition-all hover:grayscale-0"
                title={p.name}
              >
                {p.logoUrl ? (
                  <img
                    src={p.logoUrl}
                    alt={p.name || "Partner"}
                    className="max-h-10 max-w-[140px] object-contain opacity-70 transition-opacity hover:opacity-100"
                  />
                ) : (
                  <span className="font-display text-2xl font-bold text-muted-foreground/50 transition-colors hover:text-brand-blue">
                    {p.name}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- BACK-TO-TOP ---------------- */
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-gradient-warm text-white shadow-warm transition-transform hover:-translate-y-1"
    >
      <ArrowRight className="h-5 w-5 -rotate-90" />
    </button>
  );
}

/* ---------------- HOME ---------------- */
function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <Sponsors />
      <About />
      <Values />
      <Impact />
      <Chapters />
      <Programs />
      <Timeline />
      <Events />
      <Testimonials />
      <DonateCTA />
      <BackToTop />
    </SiteLayout>
  );
}
