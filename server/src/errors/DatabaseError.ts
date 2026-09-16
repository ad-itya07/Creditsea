import { AppError } from './AppError';

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}
