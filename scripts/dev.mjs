import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const readyFile = path.resolve('.local/db-ready');
rmSync(readyFile, { force: true });

const isWindows = process.platform === 'win32';
const children = new Set();
let stopping = false;

function run(label, args) {
  const child = spawn(isWindows ? 'pnpm.cmd' : 'pnpm', args, {
    stdio: 'inherit',
    env: process.env,
    shell: isWindows,
  });
  children.add(child);
  child.on('exit', (code) => {
    children.delete(child);
    if (!stopping && code !== 0) {
      console.error(`[dev] ${label} exited with code ${code}`);
      stop(code ?? 1);
    }
  });
  return child;
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (isWindows) {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
    } else {
      child.kill('SIGTERM');
    }
  }
  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

run('database', ['run', 'dev:db']);

console.log('[dev] waiting for the local database…');
const deadline = Date.now() + 120_000;
while (!existsSync(readyFile)) {
  if (Date.now() > deadline) {
    console.error('[dev] database did not become ready in time.');
    stop(1);
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

if (!stopping) {
  run('api', ['run', 'dev:api']);
  run('web', ['run', 'dev:web']);
}
