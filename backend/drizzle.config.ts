import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { resolveSslConfig, decodePassword } from "./src/db/ssl.ts";

const currentDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : typeof import.meta !== "undefined" && import.meta.url
      ? path.dirname(fileURLToPath(import.meta.url))
      : process.cwd();

// Load environment variables from .env
dotenv.config();
dotenv.config({ path: path.resolve(currentDir, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Verify connection parameters or fallback to connection string
const connectionUrl = process.env.DATABASE_URL;
const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_USER;
const password = decodePassword(process.env.SQL_PASSWORD);
const port = Number(process.env.SQL_PORT) || 5432;

if (!connectionUrl && (!sqlHost || !sqlDbName || !user || !password)) {
  throw new Error(
    "Missing database credentials! Provide either DATABASE_URL or individual SQL_* environment variables in your .env file."
  );
}

const sslConfig = resolveSslConfig(connectionUrl);
const isSslRequired = Boolean(sslConfig);

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
        ssl: isSslRequired ? "require" : false,
      },
  verbose: true,
});
