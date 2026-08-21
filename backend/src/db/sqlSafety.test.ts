import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STUDENT_SORT_ALLOWLIST,
  clientSafeDbError,
  escapeIlikePattern,
  looksLikeInterpolatedSql,
  resolveStudentSortField,
  resolveStudentSortOrder,
  toIlikeContainsPattern,
} from "./sqlSafety.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("escapeIlikePattern / toIlikeContainsPattern", () => {
  it("escapes LIKE metacharacters so % and _ are literal", () => {
    assert.equal(escapeIlikePattern("100%_pass\\x"), "100\\%\\_pass\\\\x");
  });

  it("builds a contains pattern with escaped metacharacters", () => {
    assert.equal(toIlikeContainsPattern("a%b_c"), "%a\\%b\\_c%");
  });

  it("trims input for contains patterns", () => {
    assert.equal(toIlikeContainsPattern("  alice  "), "%alice%");
  });

  it("does not treat injection payloads as SQL — only as literal search text", () => {
    const payload = "'; DROP TABLE students; --";
    const pattern = toIlikeContainsPattern(payload);
    assert.equal(pattern, `%${escapeIlikePattern(payload.trim())}%`);
    assert.ok(pattern.includes("DROP TABLE"));
    assert.ok(pattern.startsWith("%"));
    assert.ok(pattern.endsWith("%"));
  });
});

describe("resolveStudentSortField allowlist", () => {
  it("maps known aliases to canonical fields", () => {
    assert.equal(resolveStudentSortField("fullName"), "name");
    assert.equal(resolveStudentSortField("status"), "accountStatus");
    assert.equal(resolveStudentSortField("units"), "registeredUnits");
    assert.equal(resolveStudentSortField("dateRegistered"), "createdAt");
  });

  it("rejects unknown / injectable sort identifiers by falling back", () => {
    assert.equal(resolveStudentSortField("name; DROP TABLE students"), "admissionNo");
    assert.equal(resolveStudentSortField("password_hash"), "admissionNo");
    assert.equal(resolveStudentSortField("(SELECT 1)"), "admissionNo");
    assert.equal(resolveStudentSortField(undefined), "admissionNo");
  });

  it("only allows sortOrder asc|desc", () => {
    assert.equal(resolveStudentSortOrder("DESC"), "desc");
    assert.equal(resolveStudentSortOrder("asc"), "asc");
    assert.equal(resolveStudentSortOrder("asc; delete"), "asc");
  });

  it("documents the public allowlist", () => {
    assert.ok(STUDENT_SORT_ALLOWLIST.includes("admissionNo"));
    assert.ok(STUDENT_SORT_ALLOWLIST.includes("name"));
  });
});

describe("looksLikeInterpolatedSql", () => {
  it("flags classic string-concat and untagged template SQL", () => {
    assert.equal(
      looksLikeInterpolatedSql(`const q = "SELECT * FROM users WHERE id = '" + userId`),
      true
    );
    assert.equal(
      looksLikeInterpolatedSql("const q = `SELECT * FROM users WHERE id = ${userId}`"),
      true
    );
  });

  it("allows drizzle parameterized sql templates", () => {
    assert.equal(
      looksLikeInterpolatedSql("await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`)"),
      false
    );
    assert.equal(
      looksLikeInterpolatedSql(
        "const q = sql<number>`(SELECT COUNT(*) FROM student_enrollments WHERE student_id = ${students.id})`"
      ),
      false
    );
  });
});

describe("clientSafeDbError", () => {
  it("never returns raw database / driver error text", () => {
    const leaked = new Error('syntax error at or near "DROP"');
    assert.equal(clientSafeDbError("Authentication failed.", leaked), "Authentication failed.");
    assert.equal(
      clientSafeDbError("Unable to update application.", {
        message: 'duplicate key value violates unique constraint "users_email_key"',
      }),
      "Unable to update application."
    );
  });
});

describe("source audit: no string-built SQL with user interpolation", () => {
  const backendRoot = resolve(__dirname, "../..");
  const files = [
    resolve(backendRoot, "server.ts"),
    resolve(backendRoot, "src/auth.ts"),
  ];

  for (const file of files) {
    it(`${file.split("/").slice(-2).join("/")} uses parameterized drizzle sql templates`, () => {
      const source = readFileSync(file, "utf8");
      // Forbid classic string-concat SQL (not drizzle sql``).
      assert.equal(looksLikeInterpolatedSql(source), false);
      assert.equal(/\bpool\.query\s*\(\s*[`'"]/.test(source), false);
      assert.equal(/\bsql\.raw\s*\(\s*[^)]*req\./.test(source), false);
      assert.equal(/\bsql\.unsafe\s*\(/.test(source), false);
      // ORDER BY must not interpolate request params into SQL text
      assert.equal(/ORDER\s+BY\s*\$\{/.test(source), false);
      assert.equal(/order by\s*['"`]\s*\+/.test(source.toLowerCase()), false);
    });
  }

  it("student list search uses escaped ILIKE patterns", () => {
    const source = readFileSync(resolve(backendRoot, "server.ts"), "utf8");
    assert.ok(source.includes("toIlikeContainsPattern"));
    assert.ok(source.includes("resolveStudentSortField"));
    assert.ok(source.includes("ILIKE ${searchPattern} ESCAPE"));
  });
});
