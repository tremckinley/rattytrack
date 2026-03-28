// Issue category definitions for civic meeting transcript analysis

export const ISSUE_CATEGORIES = [
    'Transportation',
    'Housing & Development',
    'Budget & Finance',
    'Public Safety',
    'Parks & Recreation',
    'Infrastructure',
    'Education',
    'Health & Social Services',
    'Environment & Sustainability',
    'Economic Development',
    'Government Operations',
    'Irrelevant / Intermission'
] as const;

export type IssueCategory = typeof ISSUE_CATEGORIES[number];

/**
 * Category descriptions to improve classification accuracy
 * These are used as context for the zero-shot classifier
 */
export const CATEGORY_DESCRIPTIONS: Record<IssueCategory, string> = {
    'Transportation': 'Roads, highways, public transit, buses, bike lanes, pedestrian infrastructure, traffic management, parking',
    'Housing & Development': 'Zoning regulations, affordable housing, residential development, ADUs, construction permits, housing policy',
    'Budget & Finance': 'City budget, appropriations, taxes, revenue, financial planning, fiscal policy, expenditures',
    'Public Safety': 'Police, fire department, emergency services, crime prevention, public security, law enforcement',
    'Parks & Recreation': 'Public parks, recreational facilities, community centers, playgrounds, green spaces, sports facilities',
    'Infrastructure': 'Water systems, sewage, utilities, public works, bridges, street maintenance, infrastructure projects',
    'Education': 'Schools, libraries, educational programs, literacy, youth services, educational funding',
    'Health & Social Services': 'Public health, healthcare access, social programs, mental health, community services, welfare',
    'Environment & Sustainability': 'Environmental protection, climate action, sustainability initiatives, pollution, conservation, green energy',
    'Economic Development': 'Business development, job creation, economic growth, commercial projects, workforce development',
    'Government Operations': 'Administrative procedures, governance, policy making, council procedures, government efficiency, transparency',
    'Irrelevant / Intermission': 'Dead air, roll call, breaks, public broadcasting commercials, unrelated chit-chat, meeting adjourned'
};

/**
 * Get category description for better classification
 */
export function getCategoryDescription(category: IssueCategory): string {
    return CATEGORY_DESCRIPTIONS[category];
}

/**
 * Get all categories with descriptions for zero-shot classification
 */
export function getCategoriesWithDescriptions(): Array<{ category: IssueCategory; description: string }> {
    return ISSUE_CATEGORIES.map(category => ({
        category,
        description: CATEGORY_DESCRIPTIONS[category]
    }));
}
