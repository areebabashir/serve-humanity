/**
 * Chapter dashboard roles (chapterRole on User).
 * Heads = Directors (only they have team collection).
 * President / VP have their own collection only — no team.
 */

export type ChapterRole =
  | "president"
  | "vice_president"
  | "finance_head"
  | "operations_head"
  | "verification_head"
  | "documentation_head"
  | "hr_head"
  | "media_head"
  | "it_head"
  | "fundraising_head"
  | "event_head"
  | "director"
  | "assistant_director"
  | "member";

export const CHAPTER_ROLE_LABEL: Record<ChapterRole, string> = {
  president: "President",
  vice_president: "Vice President",
  finance_head: "Finance Director",
  operations_head: "Operations Director",
  verification_head: "Verification Director",
  documentation_head: "Documentation Director",
  hr_head: "Member",
  media_head: "Media & Graphics Director",
  it_head: "Member",
  fundraising_head: "Member",
  event_head: "Member",
  director: "Director",
  assistant_director: "Assistant Director",
  member: "Member",
};

/** Head roles = team directors (have a team collection). Not president/VP. */
export const TEAM_HEAD_ROLES: ChapterRole[] = [
  "operations_head",
  "verification_head",
  "media_head",
  "finance_head",
  "documentation_head",
];

/** Roles president / VP can assign (VP + directors). */
export const DIRECTOR_ASSIGNABLE_ROLES: ChapterRole[] = [
  "vice_president",
  ...TEAM_HEAD_ROLES,
];
/** @deprecated alias */
export const PRESIDENT_ASSIGNABLE_ROLES = DIRECTOR_ASSIGNABLE_ROLES;

export function isTeamHeadRole(role: string | null | undefined): boolean {
  return Boolean(role && (TEAM_HEAD_ROLES as string[]).includes(role));
}

/** President / VP — personal donations only, no director team. */
export function isOwnCollectionRole(role: string | null | undefined): boolean {
  return role === "president" || role === "vice_president";
}

export function canAssignChapterRoles(user: {
  systemRole?: string;
  chapterRole?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  if (user.systemRole === "president" || user.chapterRole === "president") return true;
  return user.chapterRole === "vice_president";
}

const LEADERSHIP_MODULES = [
  "overview",
  "my-donation",
  "director-donations",
  "team",
  "finance",
  "ops",
  "verification",
  "operations",
  "media",
  "documentation",
  "reports",
  "profile",
] as const;

/** Modules a role can open (read). Only directors get team-collection. */
export const CHAPTER_MODULES: Record<ChapterRole, string[]> = {
  president: [...LEADERSHIP_MODULES],
  vice_president: [...LEADERSHIP_MODULES],
  director: ["overview", "team-collection", "profile"],
  finance_head: [
    "overview",
    "finance",
    "director-donations",
    "team-collection",
    "profile",
  ],
  operations_head: ["overview", "ops", "operations", "team-collection", "profile"],
  verification_head: ["overview", "ops", "verification", "team-collection", "profile"],
  documentation_head: ["overview", "documentation", "team-collection", "profile"],
  media_head: ["overview", "media", "team-collection", "profile"],
  // Unused legacy roles — treat like plain members
  it_head: ["my-donation", "profile"],
  hr_head: ["my-donation", "profile"],
  fundraising_head: ["my-donation", "profile"],
  event_head: ["my-donation", "profile"],
  assistant_director: ["my-donation", "profile"],
  member: ["my-donation", "profile"],
};

/** Modules a role can write. */
export const CHAPTER_WRITE: Record<ChapterRole, string[]> = {
  president: [...LEADERSHIP_MODULES],
  vice_president: [...LEADERSHIP_MODULES],
  director: ["team-collection"],
  finance_head: ["finance", "director-donations", "team-collection"],
  operations_head: ["operations", "ops", "team-collection"],
  verification_head: ["verification", "ops", "team-collection"],
  documentation_head: ["documentation", "team-collection"],
  media_head: ["media", "team-collection"],
  it_head: ["my-donation"],
  hr_head: ["my-donation"],
  fundraising_head: ["my-donation"],
  event_head: ["my-donation"],
  assistant_director: ["my-donation"],
  member: ["my-donation"],
};

export function resolveChapterRole(user: {
  systemRole?: string;
  chapterRole?: string | null;
}): ChapterRole {
  const cr = user.chapterRole as ChapterRole | undefined;
  if (cr && cr in CHAPTER_ROLE_LABEL) return cr;
  if (user.systemRole === "president") return "president";
  return "member";
}

export function isChapterPresident(user: {
  systemRole?: string;
  chapterRole?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  return user.systemRole === "president" || user.chapterRole === "president";
}

export function canAccessChapterModule(role: ChapterRole, module: string): boolean {
  const mods = CHAPTER_MODULES[role] ?? [];
  return mods.includes("*") || mods.includes(module);
}

export function canWriteChapterModule(role: ChapterRole, module: string): boolean {
  const mods = CHAPTER_WRITE[role] ?? [];
  return mods.includes("*") || mods.includes(module);
}

export function isChapterLeadership(role: ChapterRole): boolean {
  return role === "president" || role === "vice_president" || isTeamHeadRole(role);
}

export function isChapterAppUser(systemRole: string | undefined | null): boolean {
  return systemRole === "president" || systemRole === "member";
}

export function isPlainMember(role: ChapterRole): boolean {
  return (
    role === "member" ||
    role === "assistant_director" ||
    role === "hr_head" ||
    role === "fundraising_head" ||
    role === "event_head" ||
    role === "it_head"
  );
}

/** Home path after login inside /chapter */
export const CHAPTER_ROLE_HOME: Record<ChapterRole, string> = {
  president: "/chapter",
  vice_president: "/chapter",
  director: "/chapter/team-collection",
  finance_head: "/chapter/director-donations",
  operations_head: "/chapter/operations",
  verification_head: "/chapter/verification",
  documentation_head: "/chapter/documentation",
  media_head: "/chapter/media-cases",
  it_head: "/chapter/my-donation",
  hr_head: "/chapter/my-donation",
  fundraising_head: "/chapter/my-donation",
  event_head: "/chapter/my-donation",
  assistant_director: "/chapter/my-donation",
  member: "/chapter/my-donation",
};

export function chapterHomeForUser(user: {
  systemRole?: string;
  chapterRole?: string | null;
}): string {
  return CHAPTER_ROLE_HOME[resolveChapterRole(user)];
}
