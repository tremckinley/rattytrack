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

export async function analyzeUntaggedSegments() {
    let output = '';
    const log = (msg: string) => { console.log(msg); output += msg + '\n'; };
    
    log('🔍 Finding untagged transcript segments...\n');

    try {
        // Dynamic imports are still fine, or we could lift them up
        const { supabaseAdmin } = await import('../lib/utils/supabase-admin');
        const { analyzeSegment } = await import('../lib/ai/transcript-analyzer');
        const { saveSegmentAnalysis } = await import('../lib/data/ai-analysis');

        // Get segments that haven't been analyzed yet
        // We check which segments don't have entries in segment_issues
        const { data: allSegments, error: fetchError } = await supabaseAdmin
            .from('transcription_segments')
            .select('id, text, speaker_id')
            .not('text', 'is', null)
            .limit(10); // Reduce batch limit for serverless timeout safety

        if (fetchError) {
            console.error('Error fetching segments:', fetchError);
            return { success: false, error: 'Error fetching segments', stderr: fetchError.message };
        }

        if (!allSegments || allSegments.length === 0) {
            log('No segments found to analyze.');
            return { success: true, stdout: output };
        }

        log(`Found ${allSegments.length} segments total`);

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

        log(`${unanalyzedSegments.length} segments need analysis\n`);

        if (unanalyzedSegments.length === 0) {
            log('✅ All segments are already analyzed!');
            return { success: true, stdout: output };
        }

        // Process each segment
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < unanalyzedSegments.length; i++) {
            const segment = unanalyzedSegments[i];
            const progress = `[${i + 1}/${unanalyzedSegments.length}]`;

            log(`${progress} Analyzing segment ${segment.id}...`);
            log(`  Text: "${segment.text.substring(0, 80)}..."`);

            try {
                // Run AI analysis
                const analysis = await analyzeSegment(segment.text);

                log(`  Issues found: ${analysis.issues.length}`);
                if (analysis.issues.length > 0) {
                    analysis.issues.forEach(issue => {
                        log(`    - ${issue.category} (${(issue.confidence * 100).toFixed(1)}%)`);
                    });
                }
                log(`  Sentiment: ${analysis.sentiment.label} (score: ${analysis.sentiment.score.toFixed(2)})`);
                log(`  Processing time: ${analysis.processingTimeMs}ms`);

                // Save to database
                const result = await saveSegmentAnalysis(
                    segment.id.toString(),
                    analysis.issues,
                    analysis.sentiment
                );

                if (result.success) {
                    log(`  ✅ Saved ${result.issuesSaved} issue tags\n`);
                    successCount++;
                } else {
                    log(`  ❌ Failed to save: ${result.error}\n`);
                    failCount++;
                }

            } catch (error) {
                console.error(`  ❌ Error analyzing segment:`, error);
                failCount++;
            }
        }

        log('\n' + '='.repeat(50));
        log('📊 Analysis Complete!');
        log('='.repeat(50));
        log(`✅ Successfully analyzed: ${successCount}`);
        log(`❌ Failed: ${failCount}`);
        log(`📈 Total processed: ${successCount + failCount}`);

        return { success: true, stdout: output };

    } catch (error: any) {
        console.error('Fatal error:', error);
        return { success: false, error: 'Fatal error', stderr: error.message };
    }
}
