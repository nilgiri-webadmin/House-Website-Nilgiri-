import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../utils/supabase';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { user_email, user_name } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    if (!user_email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, title')
      .eq('id', id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Insert registration (will fail if duplicate due to UNIQUE constraint)
    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        event_id: id,
        user_email: user_email.toLowerCase(),
        user_name: user_name || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Already registered for this event' });
      }
      throw error;
    }

    return res.status(201).json({ registration: data });
  } catch (error: any) {
    console.error('Error registering for event:', error);
    return res.status(500).json({ error: error.message || 'Failed to register for event' });
  }
}
