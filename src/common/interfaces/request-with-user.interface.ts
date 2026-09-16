import type { Request } from 'express';

// Define a strict type for the Request that includes our JWT payload
export interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}
