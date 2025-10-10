import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export function signToken(sub: string, minutes = 480) {
  const exp = Math.floor(Date.now() / 1000) + minutes * 60;
  return jwt.sign({ sub, exp }, ENV.JWT_SECRET_KEY, { algorithm: 'HS256' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, ENV.JWT_SECRET_KEY) as { sub?: string; exp?: number };
}
