/**
 * Org roles that can access the CEO / Board dashboard.
 *
 * Chapter roles (president, finance_head, etc.) belong to the chapter dashboard — not this one.
 */

export type OrgRole =
  | "ceo"
  | "bog_verification"
  | "bog_operations"
  | "bog_media"
  | "bog_finance"
  | "bog_documentation";

export const ORG_ROLE_LABEL: Record<OrgRole, string> = {
  ceo: "Chief Executive",
  bog_verification: "BOG — Verification",
  bog_operations: "BOG — Operations",
  bog_media: "BOG — Media & Website",
  bog_finance: "BOG — Finance",
  bog_documentation: "BOG — Documentation",
};

export const CEO_DASHBOARD_ROLES: OrgRole[] = [
  "ceo",
  "bog_verification",
  "bog_operations",
  "bog_media",
  "bog_finance",
  "bog_documentation",
];

export function isCeoDashboardRole(role: string | undefined | null): role is OrgRole {
  return !!role && (CEO_DASHBOARD_ROLES as string[]).includes(role);
}

/** Modules a role can open. CEO gets everything. */
export const ROLE_MODULES: Record<OrgRole, string[]> = {
  ceo: ["*"],
  bog_verification: ["overview", "ops", "board"],
  bog_operations: ["overview", "ops", "board"],
  bog_media: ["overview", "media", "website", "board"],
  bog_finance: ["overview", "finance", "board"],
  bog_documentation: ["overview", "documentation", "board"],
};

export function canAccessModule(role: OrgRole, module: string): boolean {
  const mods = ROLE_MODULES[role] ?? [];
  return mods.includes("*") || mods.includes(module);
}

/** Default home path after login for each role */
export const ROLE_HOME: Record<OrgRole, string> = {
  ceo: "/",
  bog_verification: "/verification",
  bog_operations: "/operations",
  bog_media: "/website",
  bog_finance: "/finance",
  bog_documentation: "/documentation",
};

export function moduleFromPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "overview";
  if (pathname.startsWith("/documentation")) return "documentation";
  if (pathname.startsWith("/verification") || pathname.startsWith("/operations")) return "ops";
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  return seg || "overview";
}
