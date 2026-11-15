import type { Response } from 'express';
import { SESSION_COOKIE } from '../middleware/auth';

const isProduction = process.env.NODE_ENV === 'production';

export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    expires: expiresAt,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export function sessionTtlDays(): number {
  const value = Number(process.env.SESSION_TTL_DAYS ?? 30);
  return Number.isFinite(value) && value > 0 ? value : 30;
}
