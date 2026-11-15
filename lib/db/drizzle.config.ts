import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

// pnpm runs this from the lib/db workspace directory.
const workspaceDir = process.cwd();
const envFile = path.resolve(workspaceDir, "../../.env");

if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set before running drizzle-kit. See .env.example.",
  );
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
