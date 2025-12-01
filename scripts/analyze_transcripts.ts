#!/usr/bin/env tsx
/**
 * Batch Analyze Transcripts
 * 
 * Analyzes all transcript segments that haven't been tagged to issues yet.
 * Uses AI to detect issues and sentiment, then saves to segment_issues table.
 * 
 * Usage:
 *   npm run analyze:transcripts
 *   or
 *   tsx scripts/analyze_transcripts.ts
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { supabaseAdmin } from '../lib/utils/supabase-admin';
import { analyzeSegment } from '../lib/ai/transcript-analyzer';
import { saveSegmentAnalysis } from '../lib/data/ai-analysis';

async function analyzeUntaggedSegments() {
    console.log('🔍 Finding untagged transcript segments...\n');

    try {
        // Get segments that haven't been analyzed yet
        // We check which segments don't have entries in segment_issues
        const { data: allSegments, error: fetchError } = await supabaseAdmin
            .from('transcription_segments')
            .select('id, text, speaker_id')
            .not('text', 'is', null)
            .limit(100); // Process in batches of 100

        if (fetchError) {
            console.error('Error fetching segments:', fetchError);
            process.exit(1);
        }

        if (!allSegments || allSegments.length === 0) {
            console.log('No segments found to analyze.');
            process.exit(0);
        }

        console.log(`Found ${allSegments.length} segments total`);

        // Get segments that already have analysis
        const { data: analyzedSegments } = await supabaseAdmin
            .from('segment_issues')
            .select('segment_id');

        const analyzedIds = new Set(
            analyzedSegments?.map(s => s.segment_id.toString()) || []
        );

        // Filter to only unanalyzed segments
        const unanalyzedSegments = allSegments.filter(
            seg => !analyzedIds.has(seg.id.toString())
        );

        console.log(`${unanalyzedSegments.length} segments need analysis\n`);

        if (unanalyzedSegments.length === 0) {
            console.log('✅ All segments are already analyzed!');
            process.exit(0);
        }

        // Process each segment
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < unanalyzedSegments.length; i++) {
            const segment = unanalyzedSegments[i];
            const progress = `[${i + 1}/${unanalyzedSegments.length}]`;

            console.log(`${progress} Analyzing segment ${segment.id}...`);
            console.log(`  Text: "${segment.text.substring(0, 80)}..."`);

            try {
                // Run AI analysis
                const analysis = await analyzeSegment(segment.text);

                console.log(`  Issues found: ${analysis.issues.length}`);
                if (analysis.issues.length > 0) {
                    analysis.issues.forEach(issue => {
                        console.log(`    - ${issue.category} (${(issue.confidence * 100).toFixed(1)}%)`);
                    });
                }
                console.log(`  Sentiment: ${analysis.sentiment.label} (score: ${analysis.sentiment.score.toFixed(2)})`);
                console.log(`  Processing time: ${analysis.processingTimeMs}ms`);

                // Save to database
                const result = await saveSegmentAnalysis(
                    segment.id.toString(),
                    analysis.issues,
                    analysis.sentiment
                );

                if (result.success) {
                    console.log(`  ✅ Saved ${result.issuesSaved} issue tags\n`);
                    successCount++;
                } else {
                    console.log(`  ❌ Failed to save: ${result.error}\n`);
                    failCount++;
                }

            } catch (error) {
                console.error(`  ❌ Error analyzing segment:`, error);
                failCount++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Analysis Complete!');
        console.log('='.repeat(50));
        console.log(`✅ Successfully analyzed: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`📈 Total processed: ${successCount + failCount}`);

        process.exit(0);

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

analyzeUntaggedSegments();
