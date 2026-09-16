import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so that any thrown error or rejected promise
 * is automatically forwarded to Express's next() — no try/catch in controllers.
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export default asyncHandler;
