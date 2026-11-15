import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

// Minimal SQL console for the local PostgreSQL database.
// Usage: pnpm db:sql "select id, email from users;"
//        pnpm db:sql            (interactive prompt via stdin, one statement at a time)

const envPath = path.resolve(".env");
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  try {
    const env = readFileSync(envPath, "utf8");
    const match = env.match(/^DATABASE_URL=(.+)$/m);
    if (match) connectionString = match[1].trim();
  } catch {
    // fall through to the default below
  }
}

connectionString ??=
  "postgresql://postgres:postgres@localhost:55432/jump_proptech";

const sql = process.argv.slice(2).join(" ").trim();

const client = new pg.Client({ connectionString });
try {
  await client.connect();
} catch (error) {
  console.error(
    `Could not connect to ${connectionString.replace(/:[^:@/]+@/, ":****@")}.`,
  );
  console.error("Start the database first with: pnpm dev:db");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

async function run(statement) {
  const result = await client.query(statement);
  if (Array.isArray(result.rows) && result.rows.length > 0) {
    console.table(result.rows);
    console.log(`${result.rows.length} row(s)`);
  } else {
    console.log(
      `OK — ${result.command ?? "done"} ${result.rowCount ?? ""}`.trim(),
    );
  }
}

try {
  if (sql) {
    await run(sql);
  } else {
    const statements = readFileSync(0, "utf8");
    for (const statement of statements.split(/;\s*\n/)) {
      if (statement.trim().replace(/;$/, "").trim()) {
        await run(statement);
      }
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
