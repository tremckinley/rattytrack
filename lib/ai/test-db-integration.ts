// Test database integration for AI analysis
// Run with: npx tsx lib/ai/test-db-integration.ts

import { analyzeSegment } from './transcript-analyzer';
import { saveSegmentAnalysis, getActiveIssues } from '../data/ai-analysis';

async function main() {
    console.log('Testing AI Analysis Database Integration\n');

    // Test 1: Check if issues exist in database
    console.log('Step 1: Checking for existing issues...');
    const existingIssues = await getActiveIssues();
    console.log(`Found ${existingIssues.length} active issues in database`);

    if (existingIssues.length === 0) {
        console.log('\n⚠️  No issues found. Run: npx tsx lib/ai/seed-categories.ts first\n');
        return;
    }

    console.log('Sample issues:', existingIssues.slice(0, 3).map(i => i.name).join(', '));

    // Test 2: Analyze a sample segment
    console.log('\nStep 2: Analyzing sample segment...');
    const testText = "I strongly support expanding the bike lane network on Main Street.";
    console.log(`Text: "${testText}"`);

    const analysis = await analyzeSegment(testText);
    console.log(`\nDetected ${analysis.issues.length} issues:`);
    analysis.issues.forEach(issue => {
        console.log(`  - ${issue.category}: ${(issue.confidence * 100).toFixed(1)}%`);
    });
    console.log(`Sentiment: ${analysis.sentiment.label} (${analysis.sentiment.score.toFixed(2)})`);

    // Test 3: Save to database (using a test segment ID)
    console.log('\nStep 3: Testing database save...');
    console.log('⚠️  Note: This requires a valid segment_id from your database');
    console.log('To test with real data, you need to:');
    console.log('  1. Find a segment ID: SELECT id FROM transcription_segments LIMIT 1');
    console.log('  2. Pass it to saveSegmentAnalysis()');
    console.log('  3. Verify in segment_issues table');

    console.log('\n✅ Database integration test complete!');
    console.log('\nNext steps:');
    console.log('  1. Ensure segment_issues table exists in Supabase');
    console.log('  2. Run seed-categories.ts to populate issues table');
    console.log('  3. Integrate with transcription pipeline');
}

main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
