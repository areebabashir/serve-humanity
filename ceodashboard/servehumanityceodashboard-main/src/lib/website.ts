/**
 * Website CMS — key pages (CEO + bog_media).
 */

export const WEBSITE_PAGES = [
  { key: "home", title: "Home", description: "Hero, measured impact, our story, principles, eight ways, and partners" },
  { key: "about", title: "About", description: "Story, founder & CEO messages, values, and programs" },
  { key: "chapters", title: "Chapters", description: "Page header only — chapter cards load from Chapters DB" },
  { key: "mission", title: "Mission & Vision", description: "Mission and vision cards" },
  { key: "leadership", title: "Team", description: "Team page — groups, photos, phone, email, Instagram, LinkedIn, Facebook" },
  { key: "gallery", title: "Gallery", description: "Photos and captions" },
  { key: "donate", title: "Donate", description: "Donation causes and note" },
  { key: "contact", title: "Contact", description: "Email, phone, and office details" },
  { key: "faq", title: "FAQ", description: "Common questions and answers" },
  { key: "footer", title: "Footer", description: "Newsletter text and social links" },
] as const;

export type WebsitePageKey = (typeof WEBSITE_PAGES)[number]["key"];

export function websitePageLabel(key: string) {
  return WEBSITE_PAGES.find((p) => p.key === key)?.title ?? key;
}
