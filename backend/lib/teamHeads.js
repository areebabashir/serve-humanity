/**
 * Head roles = team directors (have a team collection members roll into).
 * President and vice president do NOT have a team — only their own collection.
 */
export const TEAM_HEAD_ROLES = [
  "operations_head",
  "verification_head",
  "media_head",
  "finance_head",
  "documentation_head",
];

export function isTeamHeadRole(role) {
  return TEAM_HEAD_ROLES.includes(role);
}

/** Leadership with personal donations only (no director team). */
export function isOwnCollectionRole(role) {
  return role === "president" || role === "vice_president";
}
