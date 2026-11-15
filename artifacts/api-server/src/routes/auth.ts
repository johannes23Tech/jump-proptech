import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { db, users, type UserRow } from '@workspace/db';
import { loginSchema, registerSchema } from '@workspace/contracts';
import { asyncHandler, conflict, parseBody, userId } from '../lib/http';
import { supabaseAdmin } from '../lib/supabase';
import { loadWorkspace } from '../lib/workspace';
import { requireUser } from '../middleware/auth';

const router = Router();

router.post(
  '/auth/register',
  asyncHandler(async (req, res) => {
    const input = parseBody(registerSchema, req.body);
    const email = input.email.toLowerCase();

    // Check if user already exists in our table
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) conflict('An account with this email already exists.');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        company: input.company,
        role: 'landlord',
      },
    });

    if (authError || !authData?.user) {
      throw new Error(authError?.message ?? 'Failed to create account.');
    }

    // Create row in our users table
    const [user] = await db
      .insert(users)
      .values({
        id: authData.user.id,
        email,
        passwordHash: '', // Supabase handles password hashing
        fullName: input.fullName,
        company: input.company,
        role: 'landlord',
      })
      .returning();

    // Sign in to get a session token
    const { data: sessionData } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: input.password,
    });

    res.status(201).json({
      user: await loadWorkspace(user.id),
      accessToken: sessionData?.session?.access_token ?? null,
    });
  }),
);

router.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const input = parseBody(loginSchema, req.body);

    // Sign in with Supabase Auth
    const { data: sessionData, error } = await supabaseAdmin.auth.signInWithPassword({
      email: input.email.toLowerCase(),
      password: input.password,
    });

    if (error || !sessionData?.session?.access_token) {
      throw new Error('Incorrect email or password.');
    }

    // Look up our internal user record
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
      })
      .from(users)
      .where(eq(users.id, sessionData.session.user.id))
      .limit(1);

    if (!user) {
      throw new Error('Account not found in workspace.');
    }

    res.json({
      user: await loadWorkspace(user.id),
      accessToken: sessionData.session.access_token,
    });
  }),
);

router.post(
  '/auth/logout',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      await supabaseAdmin.auth.signOut();
    }
    res.status(204).end();
  }),
);

router.get(
  '/auth/me',
  requireUser,
  asyncHandler(async (req, res) => {
    res.json(await loadWorkspace(userId(req)));
  }),
);

export default router;
