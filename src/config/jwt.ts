import { config } from 'dotenv';

config();

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';