import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';

const port = Number(process.env.PGPORT ?? 55432);
const database = process.env.PGDATABASE_NAME ?? 'jump_proptech';
const user = 'postgres';
const password = 'postgres';
const databaseDir = path.resolve('.local/pgdata');
const readyFile = path.resolve('.local/db-ready');

mkdirSync(path.dirname(databaseDir), { recursive: true });
rmSync(readyFile, { force: true });

const server = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
  autoRehydrateSymlinks: true,
  onLog: () => {},
  onError: (error) => console.error('[db]', error),
});

const initialised = existsSync(path.join(databaseDir, 'PG_VERSION'));

if (!initialised) {
  console.log('[db] initialising local PostgreSQL cluster (first run only)…');
  await server.initialise();
}

await server.start();
console.log(`[db] PostgreSQL listening on localhost:${port}`);

const connection = `postgresql://${user}:${password}@localhost:${port}/${database}`;

async function ensureDatabase() {
  const admin = new pg.Client({
    host: 'localhost',
    port,
    user,
    password,
    database: 'postgres',
  });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      'select 1 from pg_database where datname = $1',
      [database],
    );
    if (!rowCount) {
      await admin.query(`create database "${database}"`);
      console.log(`[db] created database "${database}"`);
    }
  } finally {
    await admin.end();
  }
}

async function hasTables() {
  const client = new pg.Client({ connectionString: connection });
  await client.connect();
  try {
    const { rows } = await client.query(
      "select count(*)::int as count from information_schema.tables where table_schema = 'public'",
    );
    return rows[0].count > 0;
  } finally {
    await client.end();
  }
}

let shuttingDown = false;

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  rmSync(readyFile, { force: true });
  try {
    await server.stop();
  } catch {
    // already stopped
  }
  process.exit(code);
}

process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));

await ensureDatabase();

if (!(await hasTables())) {
  console.log('[db] applying schema…');
  const result = spawnSync(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ['--filter', '@workspace/db', 'run', 'push'],
    {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: connection },
      shell: process.platform === 'win32',
    },
  );
  if (result.status !== 0) {
    console.error('[db] schema push failed. Run "pnpm db:push" manually.');
    await shutdown(1);
  }
}

writeFileSync(
  readyFile,
  JSON.stringify({ connection, startedAt: new Date().toISOString() }),
);
console.log(`[db] ready → ${connection}`);

// Keep the cluster alive until the process is stopped.
await new Promise(() => {});
