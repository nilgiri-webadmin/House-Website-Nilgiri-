import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONTACTS_FILE_PATH = path.join(__dirname, '../../public/important-contacts.json');

const readContactsFromFile = async () => {
  try {
    const data = await fs.readFile(CONTACTS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeContactsToFile = async (contacts) => {
  try {
    await fs.writeFile(CONTACTS_FILE_PATH, JSON.stringify(contacts, null, 2));
  } catch (error) {
    console.error('Error writing contacts file:', error);
  }
};

const validateContact = (contact) => {
  const errors = [];
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

const isAdminRole = requireRole('secretary', 'depsec', 'webadmin', 'admin');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data, error } = await supabase
          .from('important_contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error) {
          return res.json({ contacts: data, source: 'supabase' });
        }

        console.warn('Supabase contacts fetch failed:', error.message);
      } catch (supabaseError) {
        console.warn('Supabase unavailable, falling back to file store:', supabaseError.message);
      }
    }

    const contacts = await readContactsFromFile();
    res.json({ contacts, source: 'json' });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.post('/', authenticateToken, isAdminRole, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const validationErrors = validateContact({ name, email, role });
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
        const { data, error } = await supabase.from('important_contacts').insert([newContact]).select().single();
        if (!error && data) {
          return res.status(201).json({ contact: data, source: 'supabase' });
        }
        console.error('Supabase create contact error:', error.message);
      } catch (supabaseError) {
        console.warn('Supabase unavailable, saving contact to file:', supabaseError.message);
      }
    }

    const contacts = await readContactsFromFile();
    contacts.unshift(newContact);
    await writeContactsToFile(contacts);
    res.status(201).json({ contact: newContact, source: 'json' });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

router.put('/:id', authenticateToken, isAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const validationErrors = validateContact({ name, email, role });
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
        const { data, error } = await supabase.from('important_contacts').update(updatedContact).eq('id', id).select().single();
        if (!error && data) {
          return res.json({ contact: data, source: 'supabase' });
        }
        console.error('Supabase update contact error:', error.message);
      } catch (supabaseError) {
        console.warn('Supabase unavailable, updating file store:', supabaseError.message);
      }
    }

    const contacts = await readContactsFromFile();
    const index = contacts.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    contacts[index] = { ...contacts[index], ...updatedContact };
    await writeContactsToFile(contacts);
    res.json({ contact: contacts[index], source: 'json' });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

router.delete('/:id', authenticateToken, isAdminRole, async (req, res) => {
  try {
    const { id } = req.params;

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { error } = await supabase.from('important_contacts').delete().eq('id', id);
        if (!error) {
          return res.json({ message: 'Contact deleted', source: 'supabase' });
        }
        console.error('Supabase delete contact error:', error.message);
      } catch (supabaseError) {
        console.warn('Supabase unavailable, deleting from file store:', supabaseError.message);
      }
    }

    const contacts = await readContactsFromFile();
    const filtered = contacts.filter((item) => item.id !== id);
    if (filtered.length === contacts.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    await writeContactsToFile(filtered);
    res.json({ message: 'Contact deleted', source: 'json' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
