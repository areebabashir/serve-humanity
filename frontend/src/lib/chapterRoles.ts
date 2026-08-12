/**
 * Chapter dashboard hierarchy:
 * President (Male) / Vice President (Female)
 *   → Cabinet Members (Finance, Ops, Verification, Documentation, Media)
 *     → Directors (team collection)
 *       → Members
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
  president: "President (Male)",
  vice_president: "Vice President (Female)",
  finance_head: "Cabinet — Finance",
  operations_head: "Cabinet — Operations",
  verification_head: "Cabinet — Verification",
  documentation_head: "Cabinet — Documentation",
  media_head: "Cabinet — Media & Graphics",
  hr_head: "Member",
  it_head: "Member",
  fundraising_head: "Member",
  event_head: "Member",
  director: "Director",
  assistant_director: "Assistant Director",
  member: "Member",
};

/** Cabinet seats under President / VP */
export const CABINET_ROLES: ChapterRole[] = [
  "operations_head",
  "verification_head",
  "media_head",
  "finance_head",
  "documentation_head",
];

/** @deprecated alias for CABINET_ROLES */
export const TEAM_HEAD_ROLES = CABINET_ROLES;

/** Roles president / VP can create (VP + cabinet seats). */
export const CABINET_ASSIGNABLE_ROLES: ChapterRole[] = [
  "vice_president",
  ...CABINET_ROLES,
];

/** @deprecated use CABINET_ASSIGNABLE_ROLES */
export const DIRECTOR_ASSIGNABLE_ROLES = CABINET_ASSIGNABLE_ROLES;
/** @deprecated */
export const PRESIDENT_ASSIGNABLE_ROLES = CABINET_ASSIGNABLE_ROLES;

export function isCabinetRole(role: string | null | undefined): boolean {
  return Boolean(role && (CABINET_ROLES as string[]).includes(role));
}

/** @deprecated use isCabinetRole */
export function isTeamHeadRole(role: string | null | undefined): boolean {
  return isCabinetRole(role);
}

export function isTeamDirectorRole(role: string | null | undefined): boolean {
  return role === "director";
}

export function isValidTeamLeadRole(role: string | null | undefined): boolean {
  return isTeamDirectorRole(role) || isCabinetRole(role);
}

/** President / VP — personal donations only, no team. */
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

export function canManageCabinetTeam(user: {
  systemRole?: string;
  chapterRole?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  return isCabinetRole(user.chapterRole);
}

const LEADERSHIP_MODULES = [
  "overview",
  "my-donation",
  "director-donations",
  "team",
  "events",
  "finance",
  "ops",
  "verification",
  "operations",
  "media",
  "documentation",
  "reports",
  "notifications",
  "profile",
] as const;

const CABINET_BASE = ["overview", "team", "notifications", "profile"] as const;

/** Modules a role can open (read). Directors get team-collection. */
export const CHAPTER_MODULES: Record<ChapterRole, string[]> = {
  president: [...LEADERSHIP_MODULES],
  vice_president: [...LEADERSHIP_MODULES],
  director: ["overview", "team-collection", "notifications", "profile"],
  finance_head: [
    ...CABINET_BASE,
    "finance",
    "director-donations",
  ],
  operations_head: [...CABINET_BASE, "ops", "operations", "director-donations"],
  verification_head: [...CABINET_BASE, "ops", "verification", "director-donations"],
  documentation_head: [...CABINET_BASE, "documentation", "director-donations"],
  media_head: [...CABINET_BASE, "media", "director-donations"],
  it_head: ["my-donation", "notifications", "profile"],
  hr_head: ["my-donation", "notifications", "profile"],
  fundraising_head: ["my-donation", "notifications", "profile"],
  event_head: ["my-donation", "notifications", "profile"],
  assistant_director: ["my-donation", "notifications", "profile"],
  member: ["my-donation", "notifications", "profile"],
};

/** Modules a role can write. */
export const CHAPTER_WRITE: Record<ChapterRole, string[]> = {
  president: [...LEADERSHIP_MODULES],
  vice_president: [...LEADERSHIP_MODULES],
  director: ["team-collection"],
  finance_head: ["team", "finance", "director-donations"],
  operations_head: ["team", "operations", "ops"],
  verification_head: ["team", "verification", "ops"],
  documentation_head: ["team", "documentation"],
  media_head: ["team", "media"],
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

export const MODULE_FOR_CABINET_ROLE: Record<string, string> = {
  finance_head: "finance",
  operations_head: "operations",
  verification_head: "verification",
  documentation_head: "documentation",
  media_head: "media",
};

export const MODULE_CHAPTER_ROUTE: Record<string, string> = {
  finance: "finance",
  operations: "operations",
  verification: "verification",
  documentation: "documentation",
  media: "media",
};

/** Team module a user belongs to (cabinet seat or assigned cabinet). */
export function teamModuleForUser(user: {
  chapterRole?: string | null;
  cabinetMember?: string | { _id?: string; chapterRole?: string } | null;
} | null | undefined): string | null {
  if (!user) return null;
  const fromRole = MODULE_FOR_CABINET_ROLE[user.chapterRole || ""];
  if (fromRole) return fromRole;
  const cm = user.cabinetMember;
  if (cm && typeof cm === "object" && cm.chapterRole) {
    return MODULE_FOR_CABINET_ROLE[cm.chapterRole] || null;
  }
  return null;
}

export function isCabinetForModuleUser(
  user: { chapterRole?: string | null } | null | undefined,
  module: string,
): boolean {
  if (!user?.chapterRole) return false;
  return MODULE_FOR_CABINET_ROLE[user.chapterRole] === module;
}

export function chapterHomeForUser(user: {
  systemRole?: string;
  chapterRole?: string | null;
  cabinetMember?: string | { _id?: string; chapterRole?: string } | null;
}): string {
  const teamMod = teamModuleForUser(user);
  if (teamMod && MODULE_CHAPTER_ROUTE[teamMod]) {
    return `/chapter/${MODULE_CHAPTER_ROUTE[teamMod]}`;
  }
  return CHAPTER_ROLE_HOME[resolveChapterRole(user)];
}

export function canAccessChapterModuleForUser(
  user: {
    systemRole?: string;
    chapterRole?: string | null;
    cabinetMember?: string | { _id?: string; chapterRole?: string } | null;
  } | null | undefined,
  module: string,
): boolean {
  if (!user) return false;
  const role = resolveChapterRole(user);
  if (canAccessChapterModule(role, module)) return true;
  return teamModuleForUser(user) === module;
}

export function canWriteChapterModuleForUser(
  user: {
    systemRole?: string;
    chapterRole?: string | null;
    cabinetMember?: string | { _id?: string; chapterRole?: string } | null;
  } | null | undefined,
  module: string,
): boolean {
  if (!user) return false;
  const role = resolveChapterRole(user);
  if (canWriteChapterModule(role, module)) return true;
  return teamModuleForUser(user) === module;
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
  return role === "president" || role === "vice_president" || isCabinetRole(role);
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

export function chapterHomeForUserLegacy(role: ChapterRole): string {
  return CHAPTER_ROLE_HOME[role];
}

/** @deprecated use chapterHomeForUser with full user object */
export function chapterHomeForRole(user: {
  systemRole?: string;
  chapterRole?: string | null;
}): string {
  return CHAPTER_ROLE_HOME[resolveChapterRole(user)];
}

export function idOfRef(
  ref?: string | { _id?: string } | null,
): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  return ref._id || null;
}
