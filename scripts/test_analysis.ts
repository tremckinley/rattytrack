#!/usr/bin/env tsx
/**
 * Test AI Analysis on One Segment
 * 
 * Tests the AI analysis on a single transcript segment to verify everything works.
 * Run this first before batch processing.
 * 
 * Usage:
 *   npm run test:analysis
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function testAnalysis() {
    console.log('🧪 Testing AI Analysis...\n');

    try {
        // Dynamic imports after env is loaded
        const { supabaseAdmin } = await import('../lib/utils/supabase-admin');
        const { analyzeSegment } = await import('../lib/ai/transcript-analyzer');
        const { saveSegmentAnalysis } = await import('../lib/data/ai-analysis');

        // Get one segment to test
        const { data: segment, error } = await supabaseAdmin
            .from('transcription_segments')
            .select('id, text')
            .not('text', 'is', null)
            .limit(1)
            .single();

        if (error || !segment) {
            console.error('Error fetching segment:', error);
            process.exit(1);
        }

        console.log(`Testing with segment: ${segment.id}`);
        console.log(`Text: "${segment.text.substring(0, 100)}..."\n`);

        // Run AI analysis
        console.log('Running AI analysis (this may take a minute on first run)...');
        const analysis = await analyzeSegment(segment.text);

        console.log('\n✅ Analysis complete!');
        console.log(`Processing time: ${analysis.processingTimeMs}ms\n`);

        console.log(`Issues detected: ${analysis.issues.length}`);
        analysis.issues.forEach(issue => {
            console.log(`  - ${issue.category}: ${(issue.confidence * 100).toFixed(1)}% confidence`);
        });

        console.log(`\nSentiment: ${analysis.sentiment.label}`);
        console.log(`  Score: ${analysis.sentiment.score.toFixed(2)}`);
        console.log(`  Confidence: ${(analysis.sentiment.confidence * 100).toFixed(1)}%`);

        // Save to database
        console.log('\nSaving to database...');
        const result = await saveSegmentAnalysis(
            segment.id.toString(),
            analysis.issues,
            analysis.sentiment
        );

        if (result.success) {
            console.log(`✅ Saved ${result.issuesSaved} issue tags to segment_issues table`);
        } else {
            console.log(`❌ Failed to save: ${result.error}`);
        }

        console.log('\n🎉 Test complete! AI analysis is working.');
        console.log('You can now run: npm run analyze:transcripts');

        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testAnalysis();
