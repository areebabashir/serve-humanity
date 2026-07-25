import { createElement, Fragment, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

/** Local fallbacks (same shape as backend defaults) so the site works offline / before seed. */
export const LOCAL_WEBSITE_DEFAULTS: Record<string, Record<string, unknown>> = {
  home: {
    hero: {
      eyebrow: "Humanitarian welfare · Since 2014",
      titlePrefix: "Together We",
      titleHighlight: "Build Hope",
      subtitle:
        "A world where compassion meets action. Join thousands of volunteers creating lasting change in communities that need it most.",
      primaryCta: "Donate Now",
      primaryCtaLink: "/donate",
      secondaryCta: "Become Volunteer",
      secondaryCtaLink: "/volunteer",
    },
    stats: [
      { label: "Families Helped", value: "48,200+" },
      { label: "Volunteers", value: "12,500" },
      { label: "City Chapters", value: "36" },
      { label: "Food Packages", value: "210K" },
      { label: "Donations Raised", value: "Rs. 84M" },
    ],
    partners: {
      title: "Trusted by partners around the world",
      items: [
        { name: "UNICEF", logoUrl: "" },
        { name: "Red Crescent", logoUrl: "" },
        { name: "WHO Partners", logoUrl: "" },
        { name: "UNHCR", logoUrl: "" },
        { name: "Save the Children", logoUrl: "" },
        { name: "OXFAM", logoUrl: "" },
        { name: "Care Intl.", logoUrl: "" },
        { name: "Islamic Relief", logoUrl: "" },
      ],
    },
  },
  about: {
    hero: {
      eyebrow: "About us",
      title: "Ten years of showing up",
      titleHighlight: "showing up",
      description:
        "Serve Humanity started as a single food drive in 2014. Today we're a global movement of volunteers, donors and community leaders.",
    },
    story: {
      title: "Our story",
      paragraphs: [
        "What began with a handful of friends distributing meals in one neighbourhood has become a coordinated humanitarian effort across 36 cities. Along the way, our principles haven't changed: dignity for every person, transparency in every rupee, and community-led action in every chapter.",
        "We measure success not in dollars raised but in lives sustainably changed — children back in school, families back on their feet, women earning their first income, elders no longer forgotten.",
      ],
      cta: "Meet our leadership",
      ctaLink: "/leadership",
    },
    values: [
      { title: "Compassion", body: "48K+ families" },
      { title: "Trust", body: "92¢ per rupee" },
      { title: "Transparency", body: "Audited yearly" },
      { title: "Integrity", body: "10 years, unbroken" },
      { title: "Empowerment", body: "8K+ students" },
      { title: "Unity", body: "36 chapters" },
    ],
  },
  mission: {
    hero: {
      eyebrow: "Mission & Vision",
      title: "Why we exist",
      titleHighlight: "exist",
      description:
        "A clear north star for every act of service — from a single meal to a global response.",
    },
    mission: {
      title: "Our Mission",
      body: "To restore dignity and hope to communities in need — through transparent, sustained humanitarian action that empowers people to rebuild their own lives.",
    },
    vision: {
      title: "Our Vision",
      body: "A world where no child sleeps hungry, no family faces crisis alone, and every community has the resources it needs to thrive.",
    },
  },
  leadership: {
    hero: {
      eyebrow: "Leadership",
      title: "The people behind the mission",
      titleHighlight: "behind the mission",
      description:
        "A dedicated team of volunteers, board members and chapter leaders — united by one purpose.",
    },
    groups: [
      {
        title: "Founder & CEO",
        members: [{ name: "Muhammad Zeeshan", role: "Founder & CEO", bio: "Leading Serve Humanity since 2014." }],
      },
      {
        title: "Board of Directors",
        members: [
          { name: "Dr. Ayesha Malik", role: "Board Chair" },
          { name: "Kamran Siddiqui", role: "Treasurer" },
          { name: "Rukhsana Ahmed", role: "Board Member" },
          { name: "Junaid Iqbal", role: "Board Member" },
        ],
      },
      {
        title: "Chapter Presidents",
        members: [
          { name: "Ahmed Raza", role: "President — Karachi" },
          { name: "Sana Iqbal", role: "President — Lahore" },
          { name: "Bilal Khan", role: "President — Islamabad" },
          { name: "Omar Sheikh", role: "President — London" },
        ],
      },
      {
        title: "Executive Team",
        members: [
          { name: "Zara Ahmad", role: "Programs Director" },
          { name: "Faisal Nazir", role: "Operations Lead" },
          { name: "Hina Malik", role: "Communications" },
          { name: "Bilal Rehman", role: "Finance Head" },
        ],
      },
    ],
  },
  chapters: {
    hero: {
      eyebrow: "City chapters",
      title: "Local roots, global reach",
      titleHighlight: "global reach",
      description:
        "36 chapters, one mission. Each chapter is led by a local president and driven by community volunteers.",
    },
    items: [
      { city: "Karachi", president: "Ahmed Raza", members: 820, projects: 42, donations: "Rs. 18M" },
      { city: "Lahore", president: "Sana Iqbal", members: 640, projects: 38, donations: "Rs. 14M" },
      { city: "Islamabad", president: "Bilal Khan", members: 410, projects: 27, donations: "Rs. 9M" },
      { city: "Peshawar", president: "Zara Ahmad", members: 220, projects: 18, donations: "Rs. 5M" },
      { city: "Quetta", president: "Faisal Nazir", members: 190, projects: 14, donations: "Rs. 4M" },
      { city: "Dubai", president: "Hina Malik", members: 150, projects: 12, donations: "Rs. 6M" },
      { city: "London", president: "Omar Sheikh", members: 320, projects: 22, donations: "Rs. 11M" },
      { city: "New York", president: "Ayesha Noor", members: 280, projects: 19, donations: "Rs. 9M" },
    ],
  },
  programs: {
    hero: {
      eyebrow: "Programs",
      title: "Every program tells a story",
      titleHighlight: "tells a story",
      description:
        "Eight coordinated programs designed to address the root causes of hardship — not just the symptoms.",
    },
    items: [
      { title: "Food Security", body: "Weekly rations, hot meals, Ramadan drives and food banks in every chapter city.", stat: "210K packages" },
      { title: "Education", body: "Scholarships, uniforms, books and mentoring for children who'd otherwise drop out.", stat: "8,400 students" },
      { title: "Healthcare", body: "Free clinics, medicines, maternal care and specialist camps in underserved areas.", stat: "62 clinics" },
      { title: "Emergency Relief", body: "Rapid response for floods, earthquakes and displacement crises within 48 hours.", stat: "12 crises served" },
      { title: "Orphan Care", body: "Sponsorship programs providing food, education and dignity to orphaned children.", stat: "1,240 children" },
      { title: "Women Empowerment", body: "Skills training, micro-grants and safe spaces for women to build livelihoods.", stat: "2,800 women" },
      { title: "Clean Water", body: "Wells, filtration systems and rural water infrastructure that lasts decades.", stat: "148 wells" },
      { title: "Skills Development", body: "Vocational training in tailoring, IT, culinary arts and trades with job placement.", stat: "4,600 graduates" },
    ],
  },
  events: {
    hero: {
      eyebrow: "Events",
      title: "Show up. Change lives.",
      titleHighlight: "Change lives.",
      description:
        "Join drives, camps and community events — every one is an opportunity to give more than a donation.",
    },
    items: [
      { title: "Ramadan Iftar Drive", date: "Mar 12, 2026", location: "Karachi", days: 42, capacity: "3,000 meals" },
      { title: "Winter Warmth Distribution", date: "Dec 20, 2025", location: "Peshawar", days: 8, capacity: "1,200 blankets" },
      { title: "Free Medical Camp", date: "Nov 05, 2025", location: "Lahore", days: 3, capacity: "600 patients" },
      { title: "Back-to-School Supplies", date: "Aug 15, 2026", location: "Islamabad", days: 210, capacity: "1,800 kits" },
      { title: "Clean Water Groundbreak", date: "Oct 01, 2025", location: "Tharparkar", days: 0, capacity: "8 villages" },
      { title: "Women Skills Fair", date: "Feb 22, 2026", location: "Dubai", days: 130, capacity: "400 attendees" },
    ],
  },
  gallery: {
    hero: {
      eyebrow: "Gallery",
      title: "Moments from the field",
      titleHighlight: "the field",
      description: "Every picture is a story of someone showing up for someone else.",
    },
    items: [
      { caption: "Ramadan Iftar 2024 — Karachi", imageUrl: "" },
      { caption: "Medical Camp — Lahore", imageUrl: "" },
      { caption: "Winter Drive — Peshawar", imageUrl: "" },
      { caption: "Orphan Sponsorship Ceremony", imageUrl: "" },
      { caption: "Clean Water Well Inauguration", imageUrl: "" },
      { caption: "Women Skills Graduation", imageUrl: "" },
      { caption: "Emergency Flood Relief 2023", imageUrl: "" },
      { caption: "Back-to-School Distribution", imageUrl: "" },
      { caption: "Volunteer Training — Dubai", imageUrl: "" },
    ],
  },
  faq: {
    hero: {
      eyebrow: "FAQ",
      title: "Common questions",
      titleHighlight: "questions",
      description:
        "Everything you might want to ask before you donate, volunteer or partner with us.",
    },
    items: [
      {
        q: "How much of my donation goes to families?",
        a: "92% of every rupee is delivered directly through programs. The remaining 8% covers operations, audit and compliance.",
      },
      {
        q: "Is my donation tax-deductible?",
        a: "Yes — Serve Humanity is a registered welfare organization. You'll receive a tax-deductible receipt by email immediately.",
      },
      {
        q: "Can I choose which cause I'm funding?",
        a: "Absolutely. On the Donate page you can direct your gift to Food, Education, Healthcare, Orphans, Water or leave it General.",
      },
      {
        q: "How are beneficiaries verified?",
        a: "Every applicant is visited by a local volunteer, documentation is captured, and requests are approved by a chapter committee within 48 hours.",
      },
      {
        q: "Can I volunteer if I only have a few hours a month?",
        a: "Yes — flexible schedules are normal. Fill the volunteer form and we'll match you to opportunities that fit.",
      },
      {
        q: "How do I start a chapter in my city?",
        a: "Contact us via the Contact page with your city and a short introduction. Chapter Development will guide you through the process.",
      },
      {
        q: "Are financials public?",
        a: "Yes. Audited financial statements are published annually and available on request.",
      },
    ],
  },
  contact: {
    hero: {
      eyebrow: "Contact",
      title: "Let's talk",
      titleHighlight: "talk",
      description:
        "Questions, partnerships, media enquiries — we usually reply within one business day.",
    },
    details: [
      { label: "Email", value: "hello@servehumanity.org" },
      { label: "Phone", value: "+92 300 000 0000" },
      { label: "Head office", value: "Karachi, Pakistan" },
      { label: "Hours", value: "Mon – Sat · 9:00 – 18:00" },
    ],
  },
  donate: {
    hero: {
      eyebrow: "Donate",
      title: "Your gift, multiplied",
      titleHighlight: "multiplied",
      description:
        "Choose an amount, pick a cause, and see the exact impact of your donation before you give.",
    },
    causes: ["General", "Food", "Education", "Healthcare", "Orphans", "Water"],
    note: "92% of donations go directly to programs.",
  },
  volunteer: {
    hero: {
      eyebrow: "Volunteer",
      title: "Join the mission",
      titleHighlight: "mission",
      description:
        "12,500 volunteers across 36 cities. There's a place for you — whatever your skills, hours, or background.",
    },
    perks: [
      { title: "Real Community", body: "Meet the most kind-hearted people you'll ever know." },
      { title: "Real Impact", body: "See families you helped return, thriving." },
      { title: "Real Growth", body: "Leadership, project management, communication — skills for life." },
    ],
  },
  footer: {
    tagline:
      "A humanitarian welfare organization uniting volunteers and donors to deliver compassion, dignity and lasting change to communities everywhere.",
    newsletterTitle: "Stay part of the mission",
    newsletterBody:
      "Monthly stories from the field, upcoming events and how your support is shaping lives. No spam — ever.",
    copyright: "Serve Humanity. All rights reserved.",
    social: {
      facebook: "#",
      instagram: "#",
      twitter: "#",
      youtube: "#",
    },
  },
};

export type WebsitePageKey = keyof typeof LOCAL_WEBSITE_DEFAULTS;

export function highlightTitle(title: string, highlight?: string): ReactNode {
  if (!highlight || !title.includes(highlight)) return title;
  const i = title.indexOf(highlight);
  const before = title.slice(0, i);
  const after = title.slice(i + highlight.length);
  return createElement(
    Fragment,
    null,
    before,
    createElement("span", { className: "text-gradient-brand" }, highlight),
    after,
  );
}

function mergeSections(
  fallback: Record<string, unknown>,
  remote?: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!remote || typeof remote !== "object") return fallback;
  return { ...fallback, ...remote };
}

/** Fetch one published page; always returns usable sections (local fallback). */
export function useWebsitePage<T extends Record<string, unknown> = Record<string, unknown>>(
  page: WebsitePageKey,
) {
  const fallback = (LOCAL_WEBSITE_DEFAULTS[page] || {}) as T;
  const [sections, setSections] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<{ success: true; data: { sections?: Record<string, unknown> } }>(
      `/website/public?page=${encodeURIComponent(page)}`,
    )
      .then((res) => {
        if (cancelled) return;
        setSections(mergeSections(fallback, res.data?.sections) as T);
      })
      .catch(() => {
        if (!cancelled) setSections(fallback);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return { sections, loading };
}
