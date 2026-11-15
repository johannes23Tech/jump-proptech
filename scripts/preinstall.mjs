import { rmSync } from 'node:fs';

// This project is a pnpm workspace. Mixing lockfiles causes duplicate trees.
rmSync('package-lock.json', { force: true });
rmSync('yarn.lock', { force: true });

const userAgent = process.env.npm_config_user_agent ?? '';

if (!userAgent.startsWith('pnpm/')) {
  console.error(
    '\nThis workspace must be installed with pnpm.\nRun: pnpm install\n',
  );
  process.exit(1);
}
