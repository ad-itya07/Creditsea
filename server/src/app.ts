import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { errorHandler } from './middleware/error.middleware';
import authRouter from './routes/auth.routes';
import borrowerRouter from './routes/borrower.routes';
import dashboardRouter from './routes/dashboard.routes';

const app: Application = express();

// Middleware 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'LMS API is running' });
});

// Routes 
app.use('/api/auth', authRouter);
app.use('/api/borrower', borrowerRouter);
app.use('/api/dashboard', dashboardRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
