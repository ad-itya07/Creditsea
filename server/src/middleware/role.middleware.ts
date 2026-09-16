import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Role } from '../constants/roles';
import { AuthenticationError, AuthorizationError } from '../errors';

/**
 * Factory middleware — restricts a route to one or more allowed roles.
 *
 * Usage:
 *   router.get('/sanction', authMiddleware, requireRoles(Role.SANCTION, Role.ADMIN), handler)
 */
const requireRoles = (...allowedRoles: Role[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(
        `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

export default requireRoles;
