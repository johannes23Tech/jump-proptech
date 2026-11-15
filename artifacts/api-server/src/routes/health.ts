import { Router, type IRouter } from 'express';
import { pool } from '@workspace/db';
import { asyncHandler } from '../lib/http';

const router: IRouter = Router();

router.get(
  '/healthz',
  asyncHandler(async (_req, res) => {
    try {
      await pool.query('select 1');
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  }),
);

export default router;
