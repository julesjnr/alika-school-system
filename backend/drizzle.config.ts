import fs from "fs";
import path from "path";
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

const resolveProjectEnvPath = () => {
  const cwd = process.cwd();
  const candidates = [
    process.env.DOTENV_PATH,
    path.resolve(cwd, ".env"),
    path.resolve(cwd, "..", ".env"),
    path.resolve(cwd, "..", "..", ".env"),
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
};

const projectEnvPath = resolveProjectEnvPath();
if (projectEnvPath) {
  dotenv.config({ path: projectEnvPath, override: true });
}

const normalizeSqlValue = (value: string | undefined) => {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// Verify connection parameters or fallback to connection string
const connectionUrl = process.env.DATABASE_URL;
const sqlHost = normalizeSqlValue(process.env.SQL_HOST);
const sqlDbName = normalizeSqlValue(process.env.SQL_DB_NAME);
const user = normalizeSqlValue(process.env.SQL_USER);
const password = normalizeSqlValue(process.env.SQL_PASSWORD);
const port = Number(normalizeSqlValue(process.env.SQL_PORT) || 5432) || 5432;

if (!connectionUrl && (!sqlHost || !sqlDbName || !user || !password)) {
  throw new Error(
    "Missing database credentials! Provide either DATABASE_URL or individual SQL_* environment variables in your .env file."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["public"],
  dbCredentials: connectionUrl
    ? {
        url: connectionUrl,
      }
    : {
        host: sqlHost!,
        port,
        user: user!,
        password: password!,
        database: sqlDbName!,
        ssl: false,
      },
  verbose: true,
});
