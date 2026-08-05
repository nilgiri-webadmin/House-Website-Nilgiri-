import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Link ID is required' });
  }

  try {
    // GET - Get single link
    if (req.method === 'GET') {
      // Try to fetch from Supabase first
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { data, error } = await supabase
            .from('important_links')
            .select('*')
            .eq('id', id)
            .single();

          if (!error && data) {
            return res.status(200).json({
              link: data,
              source: 'supabase'
            });
          }
        } catch (supabaseError: any) {
          console.warn('Supabase unavailable, falling back to JSON file:', supabaseError.message);
        }
      }

      // Fallback to JSON file
      const links = await readLinksFromFile();
      const link = links.find((l: any) => l.id === id);

      if (!link) {
        return res.status(404).json({ error: 'Link not found' });
      }

      return res.status(200).json({
        link,
        source: 'json'
      });
    }

    // PUT - Update a link (admin only)
    if (req.method === 'PUT') {
      return requireAdmin()(handlePut)(req, res);
    }

    // DELETE - Delete a link (admin only)
    if (req.method === 'DELETE') {
      return requireAdmin()(handleDelete)(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Link handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePut(req: AuthRequest, res: VercelResponse) {
  const { id } = req.query;
  const { title, url, description, category } = req.body;

  // Validate input
  const link = { title, url, description, category };
  const validationErrors = validateLink(link);

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const updatedLink = {
    title: title.trim(),
    url: url.trim(),
    description: description ? description.trim() : null,
    category: category ? category.trim() : null,
    updated_at: new Date().toISOString()
  };

  // Try to update in Supabase first
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data, error } = await supabase
        .from('important_links')
        .update(updatedLink)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return res.status(200).json({
          link: data,
          message: 'Link updated successfully',
          source: 'supabase'
        });
      }
    } catch (supabaseError: any) {
      console.warn('Supabase unavailable, updating JSON file:', supabaseError.message);
    }
  }

  // Fallback to JSON file
  const links = await readLinksFromFile();
  const index = links.findIndex((l: any) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const oldLink = links[index];
  const updatedLinkData = {
    ...oldLink,
    ...updatedLink
  };

  links[index] = updatedLinkData;
  await writeLinksToFile(links);

  return res.status(200).json({
    link: updatedLinkData,
    message: 'Link updated successfully',
    source: 'json'
  });
}

async function handleDelete(req: AuthRequest, res: VercelResponse) {
  const { id } = req.query;
  
  // Try to delete from Supabase first
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { error } = await supabase
        .from('important_links')
        .delete()
        .eq('id', id);

      if (!error) {
        return res.status(200).json({
          message: 'Link deleted successfully',
          source: 'supabase'
        });
      }
    } catch (supabaseError: any) {
      console.warn('Supabase unavailable, deleting from JSON file:', supabaseError.message);
    }
  }

  // Fallback to JSON file
  const links = await readLinksFromFile();
  const index = links.findIndex((l: any) => l.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Link not found' });
  }

  links.splice(index, 1);
  await writeLinksToFile(links);

  return res.status(200).json({
    message: 'Link deleted successfully',
    source: 'json'
  });
}
