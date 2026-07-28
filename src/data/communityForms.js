export const COMMUNITY_FORM_URLS = [
    {
        key: 'technicals',
        names: ['technical', 'technicals', 'tech'],
        label: 'Technicals',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLScGdGnwxm8HQTMVHYFD2nQFDDeAHWU6wbOb5dzPCQtw77taYg/viewform?usp=header'
    },
    {
        key: 'statistic',
        names: ['statistic', 'statistics', 'stats'],
        label: 'Statistic',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLScaM2V41DUPuc_k-PGv_r4RrVccmRELMbe2vhZBidQfysDDrw/viewform?usp=header'
    },
    {
        key: 'sports',
        names: ['sports', 'sport'],
        label: 'Sports',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSexkgd1LSPg30abrMbdE11MnR8y6WQ37alQxWPImwraSSwcWQ/viewform?usp=header'
    },
    {
        key: 'quiz',
        names: ['quiz', 'quizzing'],
        label: 'Quiz',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSdOX_L4iDTUKkb__VPlHFz_ddWjfHP7-q0w4bD5bV0vbKHicw/viewform?usp=header'
    },
    {
        key: 'esport',
        names: ['esport', 'esports', 'e-sport', 'e-sports'],
        label: 'Esport',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSfcfZCP2r4o4elWZydlmW9om_bHUdTcjf1ZnhMAoe2DOX33yw/viewform?usp=header'
    },
    {
        key: 'culturals',
        names: ['cultural', 'culturals', 'culture'],
        label: 'Culturals',
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSclWlpbCVugdFar6TkBtJfYQ_w8owmpQq-zL4VpDOWlQKWDuQ/viewform?usp=header'
    }
];

const normalize = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const getCommunityFormUrl = (communityName = '') => {
    const normalizedName = normalize(communityName);
    const match = COMMUNITY_FORM_URLS.find((form) =>
        form.names.some((name) => normalizedName.includes(normalize(name)))
    );

    return match?.url || '';
};
