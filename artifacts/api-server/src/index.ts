import { pool } from '@workspace/db';
import app from './app';
import { logger } from './lib/logger';

const port = Number(process.env.PORT ?? 8080);

if (!Number.isFinite(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const server = app.listen(port, (error) => {
  if (error) {
    logger.error({ error }, 'Error listening on port');
    process.exit(1);
  }

  logger.info({ port }, 'API server listening');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
