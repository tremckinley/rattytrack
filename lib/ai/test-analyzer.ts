// Test script for AI transcript analyzer
// Run with: npx tsx lib/ai/test-analyzer.ts

import { analyzeSegment, analyzeSegments } from './transcript-analyzer';

// Sample civic meeting transcript segments for testing
const TEST_SEGMENTS = [
    // Transportation - Positive
    "I strongly support expanding the bike lane network on Main Street. This will make our city safer for cyclists and reduce traffic congestion.",

    // Housing - Negative
    "I have serious concerns about the proposed affordable housing development. The zoning changes could negatively impact property values in the neighborhood.",

    // Budget - Neutral
    "Let me ask a clarifying question about the budget allocation for this fiscal year. Can you provide more details on the revenue projections?",

    // Public Safety - Positive
    "We need to increase funding for our fire department. The response times have improved significantly, and we should continue supporting this vital service.",

    // Parks - Mixed
    "While I appreciate the new park proposal, I'm worried about the maintenance costs. We need to ensure long-term sustainability.",

    // Infrastructure - Negative
    "The water main breaks are unacceptable. We've delayed infrastructure repairs for too long, and residents are suffering.",

    // Multiple issues - Transportation + Environment
    "Expanding public transit is crucial for both reducing emissions and improving accessibility. I fully support the bus rapid transit proposal.",

    // Government Operations - Neutral
    "I move to table this discussion until the next meeting when we have more information from the city attorney."
];

/**
 * Format confidence as percentage
 */
function formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(1)}%`;
}

/**
 * Format sentiment score with color
 */
function formatSentiment(score: number): string {
    if (score > 0.2) return `+${score.toFixed(2)} (positive)`;
    if (score < -0.2) return `${score.toFixed(2)} (negative)`;
    return `${score.toFixed(2)} (neutral)`;
}

/**
 * Test single segment analysis
 */
async function testSingleSegment() {
    console.log('\n=== Testing Single Segment Analysis ===\n');

    const testText = TEST_SEGMENTS[0];
    console.log(`Text: "${testText}"\n`);

    const result = await analyzeSegment(testText);

    console.log('Issues Detected:');
    if (result.issues.length === 0) {
        console.log('  (none above confidence threshold)');
    } else {
        result.issues.forEach((issue, i) => {
            console.log(`  ${i + 1}. ${issue.category} - ${formatConfidence(issue.confidence)}`);
        });
    }

    console.log('\nSentiment Analysis:');
    console.log(`  Label: ${result.sentiment.label}`);
    console.log(`  Score: ${formatSentiment(result.sentiment.score)}`);
    console.log(`  Confidence: ${formatConfidence(result.sentiment.confidence)}`);

    console.log(`\nProcessing Time: ${result.processingTimeMs}ms`);
}

/**
 * Test batch analysis with all segments
 */
async function testBatchAnalysis() {
    console.log('\n=== Testing Batch Analysis ===\n');
    console.log(`Analyzing ${TEST_SEGMENTS.length} segments...\n`);

    const startTime = Date.now();

    const results = await analyzeSegments(TEST_SEGMENTS.map(text => ({ text })), (current, total) => {
        console.log(`Progress: ${current}/${total} segments analyzed`);
    });

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / results.length;

    console.log('\n--- Results Summary ---\n');

    results.forEach((result, i) => {
        console.log(`\nSegment ${i + 1}:`);
        console.log(`Text: "${result.text.substring(0, 60)}..."`);

        if (result.issues.length > 0) {
            console.log(`Issues: ${result.issues.map(issue =>
                `${issue.category} (${formatConfidence(issue.confidence)})`
            ).join(', ')}`);
        } else {
            console.log('Issues: (none detected)');
        }

        console.log(`Sentiment: ${result.sentiment.label} (${formatSentiment(result.sentiment.score)})`);
        console.log(`Time: ${result.processingTimeMs}ms`);
    });

    console.log('\n--- Performance Metrics ---\n');
    console.log(`Total segments: ${results.length}`);
    console.log(`Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);
    console.log(`Average time per segment: ${avgTime.toFixed(0)}ms`);

    // Calculate accuracy metrics
    const issuesDetected = results.filter(r => r.issues.length > 0).length;
    const sentimentsDetected = results.filter(r => r.sentiment.label !== 'neutral').length;

    console.log(`\nSegments with issues detected: ${issuesDetected}/${results.length} (${(issuesDetected / results.length * 100).toFixed(0)}%)`);
    console.log(`Segments with sentiment detected: ${sentimentsDetected}/${results.length} (${(sentimentsDetected / results.length * 100).toFixed(0)}%)`);
}

/**
 * Test accuracy by manually reviewing results
 */
async function testAccuracy() {
    console.log('\n=== Manual Accuracy Review ===\n');
    console.log('Review these results and assess if categorization is correct:\n');

    const testCases = [
        { text: TEST_SEGMENTS[0], expectedIssue: 'Transportation', expectedSentiment: 'positive' },
        { text: TEST_SEGMENTS[1], expectedIssue: 'Housing & Development', expectedSentiment: 'negative' },
        { text: TEST_SEGMENTS[2], expectedIssue: 'Budget & Finance', expectedSentiment: 'neutral' },
        { text: TEST_SEGMENTS[3], expectedIssue: 'Public Safety', expectedSentiment: 'positive' },
    ];

    let correctIssues = 0;
    let correctSentiment = 0;

    for (const testCase of testCases) {
        const result = await analyzeSegment(testCase.text);

        const topIssue = result.issues[0]?.category || 'none';
        const issueCorrect = topIssue === testCase.expectedIssue;
        const sentimentCorrect = result.sentiment.label === testCase.expectedSentiment;

        if (issueCorrect) correctIssues++;
        if (sentimentCorrect) correctSentiment++;

        console.log(`Text: "${testCase.text.substring(0, 50)}..."`);
        console.log(`  Expected: ${testCase.expectedIssue} / ${testCase.expectedSentiment}`);
        console.log(`  Detected: ${topIssue} / ${result.sentiment.label}`);
        console.log(`  Result: ${issueCorrect ? '✓' : '✗'} Issue, ${sentimentCorrect ? '✓' : '✗'} Sentiment\n`);
    }

    console.log('--- Accuracy Metrics ---');
    console.log(`Issue Categorization: ${correctIssues}/${testCases.length} (${(correctIssues / testCases.length * 100).toFixed(0)}%)`);
    console.log(`Sentiment Analysis: ${correctSentiment}/${testCases.length} (${(correctSentiment / testCases.length * 100).toFixed(0)}%)`);
}

/**
 * Main test runner
 */
async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   AI Transcript Analyzer - Proof of Concept Test Suite   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    try {
        // Test 1: Single segment
        await testSingleSegment();

        // Test 2: Batch analysis
        await testBatchAnalysis();

        // Test 3: Accuracy review
        await testAccuracy();

        console.log('\n✅ All tests completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
main();
