const FORM_URL_PATTERN = /https:\/\/docs\.google\.com\/forms\/d\/e\/([^/]+)\//;

type GoogleFormField = {
  id: string;
  entryId?: string;
  title: string;
  type: string;
  required: boolean;
  options: string[];
};

export function normalizeGoogleFormUrl(formUrl: string) {
  const match = formUrl.match(FORM_URL_PATTERN);
  if (!match) return null;

  const formId = match[1];
  return {
    formId,
    viewUrl: `https://docs.google.com/forms/d/e/${formId}/viewform`,
    submitUrl: `https://docs.google.com/forms/d/e/${formId}/formResponse`
  };
}

function extractPublicLoadData(html: string) {
  const marker = 'var FB_PUBLIC_LOAD_DATA_ = ';
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error('Google Form data was not found');
  }

  const dataStart = start + marker.length;
  const dataEnd = html.indexOf(';</script>', dataStart);
  if (dataEnd === -1) {
    throw new Error('Google Form data was incomplete');
  }

  return JSON.parse(html.slice(dataStart, dataEnd));
}

function findQuestionArrays(value: any, results: any[] = []) {
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

function fieldTypeFromCode(code: number) {
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

function extractOptions(entry: any) {
  const optionRows = Array.isArray(entry?.[1]) ? entry[1] : [];
  return optionRows
    .map((option: any) => option?.[0])
    .filter((option: any) => typeof option === 'string' && option.trim() !== '');
}

function normalizeQuestion(question: any): GoogleFormField | null {
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

function findFormTitle(data: any) {
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

export async function fetchGoogleFormSchema(formUrl: string) {
  const normalized = normalizeGoogleFormUrl(formUrl);
  if (!normalized) {
    throw new Error('Invalid Google Form URL');
  }

  const response = await fetch(normalized.viewUrl);
  if (!response.ok) {
    throw new Error('Unable to load Google Form');
  }

  const html = await response.text();
  const data = extractPublicLoadData(html);
  const meta = findFormTitle(data);
  const fields = findQuestionArrays(data)
    .map(normalizeQuestion)
    .filter(Boolean) as GoogleFormField[];

  return {
    formId: normalized.formId,
    title: meta.title,
    description: meta.description,
    fields,
    submitUrl: normalized.submitUrl
  };
}

export async function submitGoogleFormResponse(formUrl: string, answers: Record<string, any>) {
  const normalized = normalizeGoogleFormUrl(formUrl);
  if (!normalized) {
    throw new Error('Invalid Google Form URL');
  }

  const body = new URLSearchParams();
  Object.entries(answers || {}).forEach(([entryId, value]) => {
    const key = `entry.${entryId}`;
    if (Array.isArray(value)) {
      value.forEach((item) => body.append(key, String(item)));
    } else if (value !== undefined && value !== null) {
      body.append(key, String(value));
    }
  });

  const response = await fetch(normalized.submitUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok && response.status !== 0) {
    throw new Error('Google Form rejected the response');
  }

  return { ok: true };
}
