// Seed issue categories into database
// Run with: npx tsx lib/ai/seed-categories.ts

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables BEFORE importing any other modules
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    // Dynamic imports to ensure env vars are loaded first
    const { seedIssueCategories } = await import('../data/ai-analysis');
    const { ISSUE_CATEGORIES } = await import('./issue-categories');

    console.log('Seeding issue categories into database...\n');
    console.log(`Categories to seed: ${ISSUE_CATEGORIES.length}`);
    console.log(ISSUE_CATEGORIES.map((cat, i) => `  ${i + 1}. ${cat}`).join('\n'));
    console.log();

    const created = await seedIssueCategories(Array.from(ISSUE_CATEGORIES));

    console.log(`\n✅ Successfully seeded ${created} categories!`);
}

main().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
