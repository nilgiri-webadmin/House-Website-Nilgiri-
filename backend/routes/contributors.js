import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONTRIBUTORS_FILE_PATH = path.join(import.meta.dirname, '../../public/contributors.json');

const readContributorsFromFile = async () => {
  try {
    const data = await fs.readFile(CONTRIBUTORS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeContributorsToFile = async (contributors) => {
  try {
    await fs.writeFile(CONTRIBUTORS_FILE_PATH, JSON.stringify(contributors, null, 2));
  } catch (error) {
    console.error('Error writing contributors file:', error);
  }
};

// Latest first: newest contributor on top, then by priority
const sortContributors = (contributors) =>
  [...contributors].sort((a, b) => {
    const tsA = new Date(a.created_at || 0).getTime();
    const tsB = new Date(b.created_at || 0).getTime();
    if (tsA !== tsB) return tsB - tsA;
    return (b.priority || 0) - (a.priority || 0);
  });

const validateContributor = (contributor) => {
  const errors = [];
  if (!contributor.name || typeof contributor.name !== 'string' || contributor.name.trim() === '') {
    errors.push('Name is required');
  }
  if (!contributor.tenure || typeof contributor.tenure !== 'string' || contributor.tenure.trim() === '') {
    errors.push('Tenure is required');
  }
  return errors;
};

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data, error } = await supabase
          .from('contributors')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error) {
          return res.json({ contributors: sortContributors(data || []), source: 'supabase' });
        }

        console.warn('Supabase contributors fetch failed:', error.message);
      } catch (supabaseError) {
        console.warn('Supabase unavailable, falling back to file store:', supabaseError.message);
      }
    }

    res.json({ contributors: sortContributors(await readContributorsFromFile()), source: 'json' });
  } catch (error) {
    console.error('Get contributors error:', error);
    res.status(500).json({ error: 'Failed to fetch contributors' });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, tenure, image_url, github, linkedin, portfolio, role, description, priority } = req.body;

    const validationErrors = validateContributor({ name, tenure });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const newContributor = {
      id: randomUUID(),
      name: name.trim(),
      tenure: tenure.trim(),
      image_url: image_url || null,
      github: github || null,
      linkedin: linkedin || null,
      portfolio: portfolio || null,
      role: role || null,
      description: description || null,
      priority: typeof priority === 'number' ? priority : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data, error } = await supabase.from('contributors').insert([newContributor]).select().single();
        if (!error && data) {
          return res.status(201).json({ contributor: data, source: 'supabase' });
        }
        console.error('Supabase create contributor error:', error.message);
      } catch (supabaseError) {
        console.warn('Supabase unavailable, saving contributor to file:', supabaseError.message);
      }
    }

    const contributors = await readContributorsFromFile();
    contributors.unshift(newContributor);
    await writeContributorsToFile(contributors);
    res.status(201).json({ contributor: newContributor, source: 'json' });
  } catch (error) {
    console.error('Create contributor error:', error);
    res.status(500).json({ error: 'Failed to create contributor' });
  }
});

export default router;