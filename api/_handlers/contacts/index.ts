import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { requireAdmin } from '../utils/permissions';
import type { AuthRequest } from '../utils/auth';
import { sortByLeadershipPriority } from '../utils/councilPriority';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const CONTACTS_FILE_PATH = path.join(process.cwd(), 'public', 'important-contacts.json');

const readContactsFromFile = async () => {
  try {
    const data = await fs.readFile(CONTACTS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeContactsToFile = async (contacts: any[]) => {
  try {
    await fs.writeFile(CONTACTS_FILE_PATH, JSON.stringify(contacts, null, 2));
  } catch (error) {
    console.error('Error writing contacts file:', error);
  }
};

const validateContact = (contact: any) => {
  const errors: string[] = [];

  if (!contact.name || typeof contact.name !== 'string' || contact.name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!contact.email || typeof contact.email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)) {
    errors.push('A valid email address is required');
  }

  if (!contact.role || typeof contact.role !== 'string' || contact.role.trim() === '') {
    errors.push('Role is required');
  }

  return errors;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      let contacts = [];

      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { data, error } = await supabase
            .from('important_contacts')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data !== null) {
            return res.status(200).json({
              contacts: sortByLeadershipPriority(data, (contact) => contact.role),
              source: 'supabase'
            });
          }

          console.warn('Supabase fetch contacts error:', error?.message);
        } catch (supabaseError: any) {
          console.warn('Supabase unavailable, falling back to file store:', supabaseError.message);
        }
      }

      contacts = sortByLeadershipPriority(await readContactsFromFile(), (contact) => contact.role);
      return res.status(200).json({ contacts, source: 'json' });
    }

    if (req.method === 'POST') {
      return requireAdmin()(handlePost)(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Contacts handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: AuthRequest, res: VercelResponse) {
  const { name, email, role } = req.body;
  const contact = { name, email, role };
  const validationErrors = validateContact(contact);

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const newContact = {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim(),
    role: role.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data, error } = await supabase
        .from('important_contacts')
        .insert([newContact])
        .select()
        .single();

      if (!error && data) {
        return res.status(201).json({ contact: data, message: 'Contact created', source: 'supabase' });
      }

      console.error('Supabase create contact error:', error?.message);
    } catch (supabaseError: any) {
      console.warn('Supabase unavailable, saving contact to file:', supabaseError.message);
    }
  }

  const contacts = await readContactsFromFile();
  contacts.unshift(newContact);
  await writeContactsToFile(contacts);

  return res.status(201).json({ contact: newContact, message: 'Contact created', source: 'json' });
}
