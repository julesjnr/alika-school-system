/**
 * SQL safety helpers for drizzle-orm / PostgreSQL.
 *
 * Values passed through drizzle `sql\`...\${value}\``, `eq`, `ilike`, etc. are
 * bound as parameters. Identifiers (ORDER BY columns) cannot be parameterized —
 * they must come from an allowlist of schema column references.
 */

/** Escape LIKE/ILIKE metacharacters so user input is matched literally. */
export function escapeIlikePattern(raw: string): string {
  return String(raw ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/** Build a contains-pattern (`%term%`) safe for ILIKE ... ESCAPE '\'. */
export function toIlikeContainsPattern(raw: string): string {
  return `%${escapeIlikePattern(raw.trim())}%`;
}

/** Allowlisted student list sort keys (query `sortBy` values). */
export const STUDENT_SORT_ALLOWLIST = [
  "name",
  "fullName",
  "studentName",
  "cohort",
  "accountStatus",
  "status",
  "createdAt",
  "dateRegistered",
  "registrationDate",
  "date",
  "registeredUnits",
  "enrolledUnits",
  "units",
  "admissionNo",
] as const;

export type StudentSortKey = (typeof STUDENT_SORT_ALLOWLIST)[number];

export type StudentSortField =
  | "name"
  | "cohort"
  | "accountStatus"
  | "createdAt"
  | "registeredUnits"
  | "admissionNo";

/**
 * Map a client sortBy value to a canonical allowlisted field.
 * Unknown values fall back to admissionNo (never use raw input as SQL identifier).
 */
export function resolveStudentSortField(sortBy: string | undefined | null): StudentSortField {
  const key = String(sortBy ?? "").trim();
  switch (key) {
    case "name":
    case "fullName":
    case "studentName":
      return "name";
    case "cohort":
      return "cohort";
    case "accountStatus":
    case "status":
      return "accountStatus";
    case "createdAt":
    case "dateRegistered":
    case "registrationDate":
    case "date":
      return "createdAt";
    case "registeredUnits":
    case "enrolledUnits":
    case "units":
      return "registeredUnits";
    case "admissionNo":
    default:
      return "admissionNo";
  }
}

export function resolveStudentSortOrder(sortOrder: string | undefined | null): "asc" | "desc" {
  return String(sortOrder ?? "asc").toLowerCase() === "desc" ? "desc" : "asc";
}

/**
 * Never return raw driver/Postgres errors to API clients — they can leak
 * schema, constraint names, or SQL fragments. Log the real error at the call site.
 */
export function clientSafeDbError(fallback: string, _err?: unknown): string {
  return fallback;
}

/**
 * Detect classic unsafe patterns: SQL inside a normal template literal or
 * string concatenation (not drizzle's parameterized `sql\`...\`` / `sql<T>\`...\``).
 */
export function looksLikeInterpolatedSql(source: string): boolean {
  // Template literals containing SQL keywords + ${...} that are NOT tagged with sql / sql<...>
  const untaggedSqlTemplate =
    /(?<!sql(?:<[^>]*>)?)`(?:[^`]*\b(?:SELECT|INSERT|UPDATE|DELETE)\b[^`]*)\$\{[^`]*`/;
  // Classic concatenation: "SELECT ... '" + userInput
  const concatSql =
    /\b(?:SELECT|INSERT|UPDATE|DELETE)\b[^;{\n]{0,200}['"`]\s*\+/;
  return untaggedSqlTemplate.test(source) || concatSql.test(source);
}
