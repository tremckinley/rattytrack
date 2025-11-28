// Quick test to verify AI models are working
// Run with: npx tsx lib/ai/quick-test.ts

import { analyzeSegment } from './transcript-analyzer';

async function main() {
    console.log('Testing AI Transcript Analyzer...\n');

    const testText = "Reducing the police budget should not be on the table.";
    console.log(`Input: "${testText}"\n`);

    console.log('Analyzing...');
    const result = await analyzeSegment(testText);

    console.log('\n✅ Analysis complete!\n');
    console.log('Issues detected:');
    result.issues.forEach(issue => {
        console.log(`  - ${issue.category}: ${(issue.confidence * 100).toFixed(1)}%`);
    });

    console.log(`\nSentiment: ${result.sentiment.label} (score: ${result.sentiment.score.toFixed(2)})`);
    console.log(`Processing time: ${result.processingTimeMs}ms`);
}

main().catch(console.error);
