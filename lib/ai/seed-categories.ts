// Seed issue categories into database
// Run with: npx tsx lib/ai/seed-categories.ts

import { seedIssueCategories } from '../data/ai-analysis';
import { ISSUE_CATEGORIES } from './issue-categories';

async function main() {
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
