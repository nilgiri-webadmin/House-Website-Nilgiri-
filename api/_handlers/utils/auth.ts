// JWT token verification and authentication utilities
import type { VercelRequest } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabase';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthUser {
  id: string;
  email: string;
  // Extended role types to include all admin roles
  role: 'secretary' | 'webadmin' | 'depsec' | 'admin' | 'club';
  clubId?: string;
}

export interface AuthRequest extends VercelRequest {
  user?: AuthUser;
  query: VercelRequest['query'];
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function authenticateRequest(req: VercelRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;

  console.log('🔐 Auth check:', {
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader ? `${authHeader.substring(0, 20)}...` : 'none',
    method: req.method,
    url: req.url
  });

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid auth header');
    return null;
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  if (!user) {
    console.log('❌ Token verification failed');
    return null;
  }

  console.log('✅ Token verified:', { userId: user.id, role: user.role });

  // Verify user still exists in database
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    console.log('❌ Database verification failed:', error?.message);
    return null;
  }

  console.log('✅ User authenticated:', { id: data.id, role: data.role });

  // All admin roles have same role types (secretary, webadmin, depsec, admin) are treated as having full admin privileges
  // No need to map - we will allow all these roles in requireRole checks
  return {
    id: data.id,
    email: data.email,
    role: data.role,
    clubId: data.club_id || undefined
  };
}

export function requireAuth(handler: (req: AuthRequest, res: any) => Promise<any>) {
  return async (req: VercelRequest, res: any) => {
    const user = await authenticateRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    (req as AuthRequest).user = user;
    return handler(req as AuthRequest, res);
  };
}

// Updated to allow all admin roles: secretary, webadmin, depsec, admin
export function requireRole(allowedRoles: Array<'secretary' | 'webadmin' | 'depsec' | 'admin' | 'club'>) {
  return (handler: (req: AuthRequest, res: any) => Promise<any>) => {
    return async (req: VercelRequest, res: any) => {
      const user = await authenticateRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      (req as AuthRequest).user = user;
      return handler(req as AuthRequest, res);
    };
  };
}