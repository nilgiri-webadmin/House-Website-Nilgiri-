import type { VercelRequest, VercelResponse } from '@vercel/node';

const FORM_ID_TO_COMMUNITY: Record<string, string> = {
  '1FAIpQLScGdGnwxm8HQTMVHYFD2nQFDDeAHWU6wbOb5dzPCQtw77taYg': 'technicals',
  '1FAIpQLScaM2V41DUPuc_k-PGv_r4RrVccmRELMbe2vhZBidQfysDDrw': 'statistic',
  '1FAIpQLSexkgd1LSPg30abrMbdE11MnR8y6WQ37alQxWPImwraSSwcWQ': 'sports',
  '1FAIpQLSdOX_L4iDTUKkb__VPlHFz_ddWjfHP7-q0w4bD5bV0vbKHicw': 'quiz',
  '1FAIpQLSfcfZCP2r4o4elWZydlmW9om_bHUdTcjf1ZnhMAoe2DOX33yw': 'esport',
  '1FAIpQLSclWlpbCVugdFar6TkBtJfYQ_w8owmpQq-zL4VpDOWlQKWDuQ': 'culturals',
  '1FAIpQLScO2WWuZZ4zZfFVv9IZOf3xBpBOiT5-YefZ3n3hSLvjBDvgug': 'chess'

};

const COMMUNITY_APPS_SCRIPT_INDEX: Record<string, number> = {
  chess: 1
};

function getAppsScriptUrlForCommunity(communityKey: string): string {
  const urls = String(process.env.APPS_SCRIPT_WEBAPP_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  const index = COMMUNITY_APPS_SCRIPT_INDEX[communityKey] || 0;
  let url = urls[index];
  if (!url) {
    // Fallback to index 0 if the specific index is not available
    url = urls[0];
    if (!url) {
      throw new Error(`No Apps Script deployment configured for "${communityKey}" (no valid URLs found)`);
    }
    console.warn(`Apps Script URL for community "${communityKey}" at index ${index} not found, falling back to index 0`);
  }
  return url;
}

function extractFormId(formUrl: string): string | null {
  const match = formUrl.match(/\/forms\/d\/e\/([^\/]+)\//);
  return match ? match[1] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { formUrl, answers } = req.body || {};

    if (!formUrl || !answers) {
      return res.status(400).json({ error: 'Missing formUrl or answers' });
    }

    const formId = extractFormId(formUrl);
    const communityKey = formId ? FORM_ID_TO_COMMUNITY[formId] : null;

    if (!communityKey) {
      return res.status(400).json({ error: 'Unknown community form' });
    }

    let appsScriptUrl: string;
    try {
      appsScriptUrl = getAppsScriptUrlForCommunity(communityKey);
    } catch (configError: any) {
      console.error(`Apps Script configuration error for community '${communityKey}':`, configError.message);
      return res.status(500).json({
        error: 'Server configuration error: Missing or invalid APPS_SCRIPT_WEBAPP_URL environment variable. Please check your deployment settings.'
      });
    }

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communityKey, answers })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Apps Script submission failed');
    }

    return res.status(200).json({
      success: true,
      confirmationMessage: result.data?.confirmationMessage,
      responseId: result.data?.responseId
    });
  } catch (error: any) {
    console.error('Google Form submit error:', error);
    return res.status(400).json({ error: error.message || 'Unable to submit form' });
  }
}