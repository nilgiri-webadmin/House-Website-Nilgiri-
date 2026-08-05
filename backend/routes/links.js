import express from 'express';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { authenticateToken, requireClubAdmin } from '../middleware/auth.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fallback file path for JSON storage
const LINKS_FILE_PATH = path.join(__dirname, '../../public/links.json');

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
const writeLinksToFile = async (links) => {
  try {
    await fs.writeFile(LINKS_FILE_PATH, JSON.stringify(links, null, 2));
  } catch (error) {
    console.error('Error writing links file:', error);
  }
};

/**
 * Validation function
 */
const validateLink = (link) => {
  const errors = [];

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

/**
 * GET /api/links - List all links
 */
router.get('/', async (req, res) => {
  try {
    const { category, limit = 100, offset = 0 } = req.query;
    let useSupabase = false;

    // Try to fetch from Supabase first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        let query = supabase.from('important_links').select('*');

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && data !== null) {
          useSupabase = true;
          return res.json({
            links: data,
            total: data.length,
            source: 'supabase'
          });
        } else if (error) {
          console.warn('Supabase error:', error.message);
        }
      } catch (supabaseError) {
        console.warn('Supabase unavailable, falling back to JSON file:', supabaseError.message);
      }
    }

    // Fallback to JSON file
    let links = await readLinksFromFile();

    if (category) {
      links = links.filter(link => link.category === category);
    }

    const paginatedLinks = links
      .slice(offset, offset + limit)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      links: paginatedLinks,
      total: links.length,
      source: 'json'
    });
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

/**
 * POST /api/links - Create a new link
 */
router.post('/', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Create link request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
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

      if (error) {
        console.error('Supabase create link error:', error);
      }
    } catch (supabaseError) {
      console.warn('Supabase unavailable, saving to JSON file:', supabaseError.message);
    }

    // Fallback to JSON file
    const links = await readLinksFromFile();
    links.push(newLink);
    await writeLinksToFile(links);

    res.status(201).json({
      link: newLink,
      message: 'Link created successfully',
      source: 'json'
    });
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

/**
 * PUT /api/links/:id - Update a link
 */
router.put('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Update link request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
    const { id } = req.params;
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
    try {
      const { data, error } = await supabase
        .from('important_links')
        .update(updatedLink)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return res.json({
          link: data,
          message: 'Link updated successfully',
          source: 'supabase'
        });
      }

      if (error) {
        console.error('Supabase update link error:', error);
      }
    } catch (supabaseError) {
      console.warn('Supabase unavailable, updating JSON file:', supabaseError.message);
    }

    // Fallback to JSON file
    const links = await readLinksFromFile();
    const index = links.findIndex(link => link.id === id);

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

    res.json({
      link: updatedLinkData,
      message: 'Link updated successfully',
      source: 'json'
    });
  } catch (error) {
    console.error('Update link error:', error);
    res.status(500).json({ error: 'Failed to update link' });
  }
});

/**
 * DELETE /api/links/:id - Delete a link
 */
router.delete('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Try to delete from Supabase first
    try {
      const { error } = await supabase
        .from('important_links')
        .delete()
        .eq('id', id);

      if (!error) {
        return res.json({
          message: 'Link deleted successfully',
          source: 'supabase'
        });
      }
    } catch (supabaseError) {
      console.warn('Supabase unavailable, deleting from JSON file:', supabaseError.message);
    }

    // Fallback to JSON file
    const links = await readLinksFromFile();
    const index = links.findIndex(link => link.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Link not found' });
    }

    links.splice(index, 1);
    await writeLinksToFile(links);

    res.json({
      message: 'Link deleted successfully',
      source: 'json'
    });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

export default router;
