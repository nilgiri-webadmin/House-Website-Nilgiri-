import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchGoogleFormSchema } from './utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const formUrl = String(req.query.formUrl || '');
    const schema = await fetchGoogleFormSchema(formUrl);
    return res.status(200).json(schema);
  } catch (error: any) {
    console.error('Google Form schema error:', error);
    return res.status(400).json({ error: error.message || 'Unable to load form schema' });
  }
}
