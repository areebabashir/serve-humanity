/**
 * Website CMS — key pages (CEO + bog_media).
 */

export const WEBSITE_PAGES = [
  {
    key: "home",
    title: "Home",
    description:
      "Hero, impact, story, principles, chapters map, eight ways, partners, voices, and donate account",
  },
  { key: "about", title: "About", description: "Story, founder & CEO messages, values, and programs" },
  { key: "chapters", title: "Chapters", description: "Page header only — chapter cards load from Chapters DB" },
  { key: "mission", title: "Mission & Vision", description: "Mission and vision cards" },
  { key: "leadership", title: "Team", description: "Team page — groups, photos, phone, email, Instagram, LinkedIn, Facebook" },
  {
    key: "events",
    title: "Events",
    description: "Upcoming events list shown on the Events page and home preview",
  },
  { key: "gallery", title: "Gallery", description: "Photos and captions" },
  {
    key: "donate",
    title: "Donate",
    description: "Donate page copy, causes, and shared bank account number",
  },
  { key: "contact", title: "Contact", description: "Email, phone, and office details" },
  { key: "faq", title: "FAQ", description: "Common questions and answers" },
  { key: "footer", title: "Footer", description: "Newsletter text, social links, and WhatsApp" },
] as const;

export type WebsitePageKey = (typeof WEBSITE_PAGES)[number]["key"];

export function websitePageLabel(key: string) {
  return WEBSITE_PAGES.find((p) => p.key === key)?.title ?? key;
}
