import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { requireAdmin } from '../utils/permissions';
import type { AuthRequest } from '../utils/auth';

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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  try {
    if (req.method === 'GET') {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { data, error } = await supabase
            .from('important_contacts')
            .select('*')
            .eq('id', id)
            .single();

          if (!error && data) {
            return res.status(200).json({ contact: data, source: 'supabase' });
          }

          console.warn('Supabase get contact error:', error?.message);
        } catch (supabaseError: any) {
          console.warn('Supabase unavailable, falling back to file store:', supabaseError.message);
        }
      }

      const contacts = await readContactsFromFile();
      const contact = contacts.find((item) => item.id === id);

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      return res.status(200).json({ contact, source: 'json' });
    }

    if (req.method === 'PUT') {
      return requireAdmin()(handlePut)(req, res);
    }

    if (req.method === 'DELETE') {
      return requireAdmin()(handleDelete)(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Contact handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePut(req: AuthRequest, res: VercelResponse) {
  const { id } = req.query;
  const { name, email, role } = req.body;
  const contactPayload = { name, email, role };
  const validationErrors = validateContact(contactPayload);

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const updatedContact = {
    name: name.trim(),
    email: email.trim(),
    role: role.trim(),
    updated_at: new Date().toISOString()
  };

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data, error } = await supabase
        .from('important_contacts')
        .update(updatedContact)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return res.status(200).json({ contact: data, message: 'Contact updated', source: 'supabase' });
      }

      console.warn('Supabase update contact error:', error?.message);
    } catch (supabaseError: any) {
      console.warn('Supabase unavailable, updating file store:', supabaseError.message);
    }
  }

  const contacts = await readContactsFromFile();
  const index = contacts.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  const updated = { ...contacts[index], ...updatedContact };
  contacts[index] = updated;
  await writeContactsToFile(contacts);

  return res.status(200).json({ contact: updated, message: 'Contact updated', source: 'json' });
}

async function handleDelete(req: AuthRequest, res: VercelResponse) {
  const { id } = req.query;

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { error } = await supabase
        .from('important_contacts')
        .delete()
        .eq('id', id);

      if (!error) {
        return res.status(200).json({ message: 'Contact deleted', source: 'supabase' });
      }

      console.warn('Supabase delete contact error:', error?.message);
    } catch (supabaseError: any) {
      console.warn('Supabase unavailable, deleting from file store:', supabaseError.message);
    }
  }

  const contacts = await readContactsFromFile();
  const filtered = contacts.filter((item) => item.id !== id);

  if (filtered.length === contacts.length) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  await writeContactsToFile(filtered);
  return res.status(200).json({ message: 'Contact deleted', source: 'json' });
}
