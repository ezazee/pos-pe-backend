import { NextFunction, Request, Response } from 'express';
import { getDb } from '../db/mongo';
import { User } from '../types/models';
import { verifyToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

export interface AuthedRequest extends Request {
  user?: Omit<User, 'password_hash'>;
}

export async function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const hdr = req.headers.authorization || '';
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ message: 'Unauthorized' });

    const token = m[1];
    const payload = verifyToken(token);
    if (!payload?.sub) return res.status(401).json({ message: 'Invalid token' });

    const db = getDb();
    const userDoc = await db.collection<User>('users').findOne(
      { email: payload.sub },
      { projection: { _id: 0 } }
    );

    if (!userDoc) return res.status(401).json({ message: 'User not found' });
    if (userDoc.active === false) return res.status(403).json({ message: 'User inactive' });

    const { password_hash, ...safeUser } = userDoc;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
