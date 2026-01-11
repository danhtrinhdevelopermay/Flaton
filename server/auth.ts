import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from './db';

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-2024';
const SALT_ROUNDS = 10;

export interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number): string {
  const idString = String(userId);
  console.log('[JWT] Generating token for user:', idString);
  const token = jwt.sign({ userId: idString }, JWT_SECRET, { expiresIn: '7d' });
  console.log('[JWT] Token generated successfully');
  return token;
}

export function verifyToken(token: string): any {
  try {
    console.log('[JWT] Verifying token... Token:', token.substring(0, 20) + '...');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('[JWT] Token verified successfully:', { userId: decoded?.userId, iat: decoded?.iat });
    return decoded;
  } catch (error: any) {
    console.error('[JWT] Token verification failed:', { error: error.message, name: error.name });
    return null;
  }
}

export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    
    if (!token) {
      console.log('[AdminAuthMiddleware] No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      console.log('[AdminAuthMiddleware] Not an admin:', decoded);
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('[AdminAuthMiddleware] Auth error:', error);
    res.status(401).json({ error: 'Invalid admin token' });
  }
};

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token || (req.query.token as string);
    
    if (!token) {
      console.log('[AuthMiddleware] No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('[AuthMiddleware] Token received:', token.substring(0, 20) + '...');
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      console.log('[AuthMiddleware] Invalid token or no userId:', decoded);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;
    console.log('[AuthMiddleware] Looking up user:', userId);
    const result = await pool.query('SELECT id, email, name, is_pro FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      console.log('[AuthMiddleware] User not found in DB:', userId);
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('[AuthMiddleware] Auth successful for:', result.rows[0].email);
    req.userId = result.rows[0].id;
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        const userId = decoded.userId;
        const result = await pool.query('SELECT id, email, name, is_pro FROM users WHERE id = $1', [userId]);
        if (result.rows.length > 0) {
          req.userId = result.rows[0].id;
          req.user = result.rows[0];
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
}
