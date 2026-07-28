import express from 'express';

const router = express.Router();
const FORM_URL_PATTERN = /https:\/\/docs\.google\.com\/forms\/d\/e\/([^/]+)\//;

const FORM_ID_TO_COMMUNITY = {
  '1FAIpQLScGdGnwxm8HQTMVHYFD2nQFDDeAHWU6wbOb5dzPCQtw77taYg': 'technicals',
  '1FAIpQLScaM2V41DUPuc_k-PGv_r4RrVccmRELMbe2vhZBidQfysDDrw': 'statistic',
  '1FAIpQLSexkgd1LSPg30abrMbdE11MnR8y6WQ37alQxWPImwraSSwcWQ': 'sports',
  '1FAIpQLSdOX_L4iDTUKkb__VPlHFz_ddWjfHP7-q0w4bD5bV0vbKHicw': 'quiz',
  '1FAIpQLSfcfZCP2r4o4elWZydlmW9om_bHUdTcjf1ZnhMAoe2DOX33yw': 'esport',
  '1FAIpQLSclWlpbCVugdFar6TkBtJfYQ_w8owmpQq-zL4VpDOWlQKWDuQ': 'culturals',
  '1FAIpQLScO2WWuZZ4zZfFVv9IZOf3xBpBOiT5-YefZ3n3hSLvjBDvgug': 'chess'
};

const COMMUNITY_APPS_SCRIPT_INDEX = {
  chess: 1
};

function getAppsScriptUrls() {
  return String(process.env.APPS_SCRIPT_WEBAPP_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}

function getAppsScriptUrlForCommunity(communityKey) {
  const urls = getAppsScriptUrls();
  const index = COMMUNITY_APPS_SCRIPT_INDEX[communityKey] ?? 0;
  const url = urls[index];
  if (!url) {
    throw new Error(`No Apps Script deployment configured for "${communityKey}" (expected URL at position ${index + 1} in APPS_SCRIPT_WEBAPP_URL)`);
  }
  return url;
}

function extractFormId(formUrl) {
  const match = formUrl.match(FORM_URL_PATTERN);
  return match ? match[1] : null;
}

function normalizeGoogleFormUrl(formUrl) {
  const match = formUrl.match(FORM_URL_PATTERN);
  if (!match) return null;

  const formId = match[1];
  return {
    formId,
    viewUrl: `https://docs.google.com/forms/d/e/${formId}/viewform`,
    submitUrl: `https://docs.google.com/forms/d/e/${formId}/formResponse`
  };
}

function extractPublicLoadData(html) {
  const marker = 'var FB_PUBLIC_LOAD_DATA_ = ';
  const start = html.indexOf(marker);
  if (start === -1) throw new Error('Google Form data was not found');

  const dataStart = start + marker.length;
  const dataEnd = html.indexOf(';</script>', dataStart);
  if (dataEnd === -1) throw new Error('Google Form data was incomplete');

  return JSON.parse(html.slice(dataStart, dataEnd));
}

function findQuestionArrays(value, results = []) {
  if (!Array.isArray(value)) return results;

  const looksLikeQuestion =
    typeof value[0] === 'number' &&
    typeof value[1] === 'string' &&
    typeof value[3] === 'number' &&
    Array.isArray(value[4]);

  if (looksLikeQuestion) {
    results.push(value);
    return results;
  }

  value.forEach((item) => findQuestionArrays(item, results));
  return results;
}

function fieldTypeFromCode(code) {
  switch (code) {
    case 0:
      return 'short_text';
    case 1:
      return 'paragraph';
    case 2:
      return 'multiple_choice';
    case 3:
      return 'dropdown';
    case 4:
      return 'checkboxes';
    case 5:
      return 'linear_scale';
    case 9:
      return 'date';
    case 10:
      return 'time';
    default:
      return 'unsupported';
  }
}

function extractOptions(entry) {
  const optionRows = Array.isArray(entry?.[1]) ? entry[1] : [];
  return optionRows
    .map((option) => option?.[0])
    .filter((option) => typeof option === 'string' && option.trim() !== '');
}

function normalizeQuestion(question) {
  const entry = question?.[4]?.[0];
  const entryId = entry?.[0];
  const type = fieldTypeFromCode(question[3]);

  if (!entryId || type === 'unsupported') return null;

  return {
    id: String(question[0]),
    entryId: String(entryId),
    title: question[1],
    type,
    required: entry?.[2] === 1,
    options: extractOptions(entry)
  };
}

function findFormTitle(data) {
  const queue = [data];
  while (queue.length) {
    const item = queue.shift();
    if (!Array.isArray(item)) continue;
    if (typeof item[0] === 'string' && typeof item[1] === 'string' && item[0].length < 160) {
      return { title: item[0], description: item[1] };
    }
    item.forEach((child) => queue.push(child));
  }
  return { title: 'Community Application', description: '' };
}

async function fetchGoogleFormSchema(formUrl) {
  const normalized = normalizeGoogleFormUrl(formUrl);
  if (!normalized) throw new Error('Invalid Google Form URL');

  const response = await fetch(normalized.viewUrl);
  if (!response.ok) throw new Error('Unable to load Google Form');

  const html = await response.text();
  const data = extractPublicLoadData(html);
  const meta = findFormTitle(data);
  const fields = findQuestionArrays(data)
    .map(normalizeQuestion)
    .filter(Boolean);

  return {
    formId: normalized.formId,
    title: meta.title,
    description: meta.description,
    fields,
    submitUrl: normalized.submitUrl
  };
}

async function submitGoogleFormResponse(formUrl, answers) {
  const formId = extractFormId(formUrl);
  const communityKey = formId ? FORM_ID_TO_COMMUNITY[formId] : null;

  if (!communityKey) throw new Error('Unknown community form');

  const appsScriptUrl = getAppsScriptUrlForCommunity(communityKey);

  const response = await fetch(appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ communityKey, answers })
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Apps Script submission failed');
  }

  return { ok: true, confirmationMessage: result.data?.confirmationMessage };
}

router.get('/schema', async (req, res) => {
  try {
    const schema = await fetchGoogleFormSchema(String(req.query.formUrl || ''));
    res.json(schema);
  } catch (error) {
    console.error('Google Form schema error:', error);
    res.status(400).json({ error: error.message || 'Unable to load form schema' });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const { formUrl, answers } = req.body || {};
    const result = await submitGoogleFormResponse(String(formUrl || ''), answers || {});
    res.json(result);
  } catch (error) {
    console.error('Google Form submit error:', error);
    res.status(400).json({ error: error.message || 'Unable to submit form' });
  }
});

export default router;