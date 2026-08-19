import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sql } from "drizzle-orm";
import { db } from "./index.ts";

const currentDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : typeof import.meta !== "undefined" && import.meta.url
      ? path.dirname(fileURLToPath(import.meta.url))
      : process.cwd();

const drizzleCandidates = [
  path.resolve(process.cwd(), "backend/drizzle"),
  path.resolve(process.cwd(), "drizzle"),
  path.resolve(currentDir, "../../drizzle"),
  path.resolve(currentDir, "../drizzle"),
  path.resolve(currentDir, "./drizzle"),
];
const drizzleDir = drizzleCandidates.find((dir) => fs.existsSync(dir)) || path.resolve(process.cwd(), "backend/drizzle");

const orderedSqlMigrations = fs
  .readdirSync(drizzleDir)
  .filter((fileName) => fileName.endsWith(".sql") && !fileName.startsWith("meta"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const shouldIgnoreStatementError = (statement: string, error: any): boolean => {
  const code = error?.code;
  const normalizedStatement = statement.trim();
  const isMissingRelation = code === '42P01';
  const isDuplicateObject = code === '42P07' || code === '42710';

  if (!normalizedStatement) {
    return false;
  }

  if (isMissingRelation && normalizedStatement.includes('DISABLE ROW LEVEL SECURITY')) {
    return true;
  }

  if (isDuplicateObject && (
    normalizedStatement.startsWith('CREATE TABLE') ||
    normalizedStatement.startsWith('CREATE INDEX') ||
    normalizedStatement.startsWith('CREATE UNIQUE INDEX') ||
    normalizedStatement.startsWith('ALTER TABLE')
  )) {
    return true;
  }

  if (isMissingRelation && normalizedStatement.startsWith('ALTER TABLE') && normalizedStatement.includes('ADD COLUMN')) {
    return true;
  }

  return false;
};

export async function runMigrations(retries = 3, delayMs = 2000): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS app_migrations (
          name VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        )
      `);

      const appliedRows = await db.execute(sql`SELECT name FROM app_migrations`);
      const applied = new Set(
        appliedRows.rows
          .map((row: any) => row?.name)
          .filter((name: unknown): name is string => typeof name === "string"),
      );

      for (const migrationFile of orderedSqlMigrations) {
        if (applied.has(migrationFile)) {
          continue;
        }

        const migrationPath = path.join(drizzleDir, migrationFile);
        const migrationSql = fs.readFileSync(migrationPath, "utf8");
        const statements = migrationSql
          .split("--> statement-breakpoint")
          .map((statement) => statement.trim())
          .filter(Boolean);

        await db.transaction(async (tx) => {
          for (const statement of statements) {
            try {
              await tx.execute(sql.raw(statement));
            } catch (error: any) {
              if (!shouldIgnoreStatementError(statement, error)) {
                throw error;
              }
              console.warn(`[Migrations] Ignoring safe no-op statement in ${migrationFile}: ${statement.split('\n')[0].slice(0, 120)}`);
            }
          }

          await tx.execute(
            sql`INSERT INTO app_migrations (name) VALUES (${migrationFile}) ON CONFLICT (name) DO NOTHING`,
          );
        });
      }
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `[Migrations] Attempt ${attempt}/${retries} failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      if (attempt < retries) {
        console.log(`[Migrations] Retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

if (process.argv[1]?.endsWith("migrate.ts") || process.argv[1]?.endsWith("migrate.js")) {
  runMigrations()
    .then(() => {
      console.log("Drizzle migrations completed successfully.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Drizzle migrations failed:", error);
      process.exit(1);
    });
}
