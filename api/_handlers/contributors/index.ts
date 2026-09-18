import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { requireAdmin } from '../utils/permissions';
import type { AuthRequest } from '../utils/auth';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const CONTRIBUTORS_FILE_PATH = path.join(process.cwd(), 'public', 'contributors.json');

const readContributorsFromFile = async () => {
  try {
    const data = await fs.readFile(CONTRIBUTORS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeContributorsToFile = async (contributors: any[]) => {
  try {
    await fs.writeFile(CONTRIBUTORS_FILE_PATH, JSON.stringify(contributors, null, 2));
  } catch (error) {
    console.error('Error writing contributors file:', error);
  }
};

const sortContributors = (contributors: any[]) =>
  [...contributors].sort((a, b) => {
    const tsA = new Date(a.created_at || 0).getTime();
    const tsB = new Date(b.created_at || 0).getTime();
    if (tsA !== tsB) return tsB - tsA;
    return (b.priority || 0) - (a.priority || 0);
  });

const validateContributor = (contributor: any) => {
  const errors: string[] = [];

  if (!contributor.name || typeof contributor.name !== 'string' || contributor.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!contributor.tenure || typeof contributor.tenure !== 'string' || contributor.tenure.trim() === '') {
    errors.push('Tenure is required');
  }

  return errors;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      let contributors = [];

      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { data, error } = await supabase
            .from('contributors')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data !== null) {
            return res.status(200).json({
              contributors: sortContributors(data),
              source: 'supabase'
            });
          }

          console.warn('Supabase fetch contributors error:', error?.message);
        } catch (supabaseError: any) {
          console.warn('Supabase unavailable, falling back to file store:', supabaseError.message);
        }
      }

      contributors = sortContributors(await readContributorsFromFile());
      return res.status(200).json({ contributors, source: 'json' });
    }

    if (req.method === 'POST') {
      return requireAdmin()(handlePost)(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Contributors handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: AuthRequest, res: VercelResponse) {
  const { name, tenure, image_url, github, linkedin, portfolio, role, description, priority } = req.body;

  const contributor = { name, tenure };
  const validationErrors = validateContributor(contributor);

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
      const { data, error } = await supabase
        .from('contributors')
        .insert([newContributor])
        .select()
        .single();

      if (!error && data) {
        return res.status(201).json({ contributor: data, message: 'Contributor added', source: 'supabase' });
      }

      console.error('Supabase create contributor error:', error?.message);
    } catch (supabaseError: any) {
      console.warn('Supabase unavailable, saving contributor to file:', supabaseError.message);
    }
  }

  const contributors = await readContributorsFromFile();
  contributors.unshift(newContributor);
  await writeContributorsToFile(contributors);

  return res.status(201).json({ contributor: newContributor, message: 'Contributor added', source: 'json' });
}