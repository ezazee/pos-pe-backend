import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/mongo';
import { User, TokenResponse } from '../types/models';
import { signToken } from '../utils/jwt';
import { AuthedRequest, auth } from '../middleware/auth';

const router = Router();

/** POST /api/auth/login */
router.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const db = getDb();
  const userDoc = await db.collection<User>('users').findOne(
    { email },
    { projection: { _id: 0 } }
  );

  if (!userDoc) return res.status(401).json({ message: 'Invalid email or password' });
  if (!userDoc.password_hash) return res.status(500).json({ message: 'User missing password hash' });

  const ok = await bcrypt.compare(password, userDoc.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });
  if (userDoc.active === false) return res.status(403).json({ message: 'User is inactive' });

  const token = signToken(userDoc.email);
  const { password_hash, ...userSafe } = userDoc;

  const resp: TokenResponse = {
    access_token: token,
    token_type: 'bearer',
    user: userSafe
  };

  return res.json(resp);
});

/** GET /api/me */
router.get('/me', auth, async (req: AuthedRequest, res: Response) => {
  return res.json(req.user);
});

export default router;
