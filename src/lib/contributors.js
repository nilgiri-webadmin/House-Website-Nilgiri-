import yaml from 'js-yaml';

export const TENURE_ORDER = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25', '2025-26', '2026-27'];

export const slugify = (name = '') =>
    String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const tenureStartYear = (tenure = '') => {
    const match = /^(\d{4})/.exec(tenure);
    return match ? parseInt(match[1], 10) : -1;
};

// Newest tenure groups first; unknown tenures sink to the bottom.
export const compareTenures = (a, b) => {
    const yb = tenureStartYear(b);
    const ya = tenureStartYear(a);
    if (yb !== ya) return yb - ya;
    return TENURE_ORDER.indexOf(a) - TENURE_ORDER.indexOf(b);
};

// Normalizes any contributor shape (YAML, API, legacy JSON) into one canonical form.
export const normalizeContributor = (c = {}) => {
    const socials = Array.isArray(c.socials) ? c.socials.map((s) => ({ ...s })) : [];

    ['github', 'linkedin', 'portfolio', 'instagram', 'twitter'].forEach((key) => {
        if (c[key]) socials.push({ platform: key, url: c[key] });
    });

    return {
        id: c.id || slugify(c.name),
        slug: c.slug || c.id || slugify(c.name),
        name: c.name,
        tenure: c.tenure || 'General',
        role: c.role || '',
        image: c.image || c.image_url || '',
        bio: c.bio || c.description || '',
        socials: socials.filter((s) => s && s.url)
    };
};

let cache = null;

export const loadContributors = async (force = false) => {
    if (cache && !force) return cache;

    const res = await fetch('/contributors.yml');
    if (!res.ok) throw new Error('Failed to load contributors.yml');

    const raw = yaml.load(await res.text());
    const list = Array.isArray(raw) ? raw : raw?.contributors || [];

    cache = list.map(normalizeContributor);
    return cache;
};