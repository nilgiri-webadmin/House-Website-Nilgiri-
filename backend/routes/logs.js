import express from 'express';
import { google } from 'googleapis';

const router = express.Router();

// Load your API key or credentials
const API_KEY = process.env.GSHEETS_API_KEY || 'YOUR_API_KEY';
const SHEET_ID = process.env.GSHEETS_SHEET_ID || 'YOUR_SHEET_ID';

// Google Sheets API setup
const sheets = google.sheets({ version: 'v4', auth: API_KEY });

// Append a log entry to Google Sheets
router.post('/log', async (req, res) => {
  const { action, entity, user, details, timestamp } = req.body;
  if (!action || !entity || !user || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[action, entity, user, details || '', timestamp]],
      },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Optional) Get logs (last 50 rows)
router.get('/log', async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:E',
    });
    const rows = result.data.values || [];
    res.json({ logs: rows.slice(-50) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
