import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { requireAdmin } from '../utils/permissions';
import type { AuthRequest } from '../utils/auth';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Fallback file path for JSON storage
const LINKS_FILE_PATH = path.join(process.cwd(), 'public', 'links.json');

/**
 * Helper function to read links from fallback JSON file
 */
const readLinksFromFile = async () => {
  try {
    const data = await fs.readFile(LINKS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

/**
 * Helper function to write links to fallback JSON file
 */
const writeLinksToFile = async (links: any[]) => {
  try {
    await fs.writeFile(LINKS_FILE_PATH, JSON.stringify(links, null, 2));
  } catch (error) {
    console.error('Error writing links file:', error);
  }
};

/**
 * Validation function
 */
const validateLink = (link: any) => {
  const errors: string[] = [];

  if (!link.title || typeof link.title !== 'string' || link.title.trim() === '') {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!link.url || typeof link.url !== 'string') {
    errors.push('URL is required');
  } else {
    try {
      new URL(link.url);
    } catch {
      errors.push('Invalid URL format');
    }
  }

  if (link.description && typeof link.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (link.category && typeof link.category !== 'string') {
    errors.push('Category must be a string');
  }

  return errors;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - List all links
    if (req.method === 'GET') {
      const { category, limit = '100', offset = '0' } = req.query;
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      // Try to fetch from Supabase first
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          let query = supabase.from('important_links').select('*');

          if (category) {
            query = query.eq('category', category);
          }

          const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(offsetNum, offsetNum + limitNum - 1);

          if (!error && data !== null) {
            return res.status(200).json({
              links: data,
              total: data.length,
              source: 'supabase'
            });
          } else if (error) {
            console.warn('Supabase error:', error.message);
          }
        } catch (supabaseError: any) {
          console.warn('Supabase unavailable, falling back to JSON file:', supabaseError.message);
        }
      }

      // Fallback to JSON file
      let links = await readLinksFromFile();

      if (category) {
        links = links.filter((link: any) => link.category === category);
      }

      const paginatedLinks = links
        .slice(offsetNum, offsetNum + limitNum)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return res.status(200).json({
        links: paginatedLinks,
        total: links.length,
        source: 'json'
      });
    }

    // POST - Create a new link (admin only)
    if (req.method === 'POST') {
      return requireAdmin()(handlePost)(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Links handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: AuthRequest, res: VercelResponse) {
  const { title, url, description, category } = req.body;

  // Validate input
  const link = { title, url, description, category };
  const validationErrors = validateLink(link);

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const newLink = {
    id: randomUUID(),
    title: title.trim(),
    url: url.trim(),
    description: description ? description.trim() : null,
    category: category ? category.trim() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Try to save to Supabase first
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data, error } = await supabase
        .from('important_links')
        .insert([newLink])
        .select()
        .single();

      if (!error && data) {
        return res.status(201).json({
          link: data,
          message: 'Link created successfully',
          source: 'supabase'
        });
      }
    } catch (supabaseError: any) {
      console.warn('Supabase unavailable, saving to JSON file:', supabaseError.message);
    }
  }

  // Fallback to JSON file
  const links = await readLinksFromFile();
  links.push(newLink);
  await writeLinksToFile(links);

  return res.status(201).json({
    link: newLink,
    message: 'Link created successfully',
    source: 'json'
  });
}
