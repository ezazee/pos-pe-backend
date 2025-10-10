import { Response, NextFunction } from 'express';
import { AuthedRequest } from './auth.js';
import { Role } from '../types/models.js';

export function allowRoles(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const r = req.user?.role;
    if (!r || !roles.includes(r)) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    next();
  };
}
