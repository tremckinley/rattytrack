// Test script for the Intelligence Pipeline
// Run with: npx tsx scripts/test-intelligence-pipeline.ts

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

// Now import after env vars are loaded (due to supabase-admin initialization)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    console.error('\nMake sure .env.local exists and contains these variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('🔍 Finding a video with transcription segments...\n');

    // Find a video that has transcription segments
    const { data: videos, error: videosError } = await supabase
        .from('video_transcriptions')
        .select('video_id, title, status')
        .eq('status', 'completed')
        .limit(5);

    if (videosError) {
        console.error('❌ Error fetching videos:', videosError.message);
        process.exit(1);
    }

    if (!videos || videos.length === 0) {
        console.log('⚠️  No completed transcriptions found.');
        console.log('   Make sure you have at least one video with status="completed"');
        process.exit(0);
    }

    console.log('📹 Found videos:');
    for (const v of videos) {
        console.log(`   - ${v.video_id}: ${v.title}`);
    }

    // Get the first video with segments
    let selectedVideo = null;
    let segments = null;

    for (const video of videos) {
        const { data: segmentData, error: segError } = await supabase
            .from('transcription_segments')
            .select('id, text, start_time, end_time, speaker_id, speaker_name')
            .eq('video_id', video.video_id)
            .order('start_time')
            .limit(500);  // Limit for testing

        if (!segError && segmentData && segmentData.length > 0) {
            selectedVideo = video;
            segments = segmentData;
            break;
        }
    }

    if (!selectedVideo || !segments) {
        console.log('⚠️  No videos with segments found.');
        process.exit(0);
    }

    console.log(`\n✅ Selected video: ${selectedVideo.title}`);
    console.log(`   Video ID: ${selectedVideo.video_id}`);
    console.log(`   Segments: ${segments.length}`);

    // Dynamically import the pipeline module AFTER env vars are set
    const { runIntelligencePipeline } = await import('../lib/ai/intelligence-pipeline');

    // Run the pipeline
    console.log('\n🚀 Running Intelligence Pipeline...\n');

    const startTime = Date.now();

    const result = await runIntelligencePipeline(
        {
            videoId: selectedVideo.video_id,
            segments: segments.map(s => ({
                id: s.id,
                text: s.text,
                start_time: Number(s.start_time),
                end_time: Number(s.end_time),
                speaker_id: s.speaker_id,
                speaker_name: s.speaker_name
            }))
        },
        (step, current, total) => {
            process.stdout.write(`\r   ${step}: ${current}/${total}`);
        }
    );

    console.log('\n');

    // Report results
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    PIPELINE RESULTS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Processing time:     ${result.processingTimeMs}ms`);
    console.log(`   Segments processed:  ${result.segmentsProcessed}`);
    console.log('');
    console.log('   📋 Robert\'s Rules Events:');
    console.log(`      Detected:         ${result.eventsDetected.length}`);
    console.log(`      Agenda items:     ${result.savedAgendaItems}`);
    console.log('');
    console.log('   🗳️  Votes:');
    console.log(`      Extracted:        ${result.votesExtracted.length}`);
    console.log('');
    console.log('   💬 Quotes:');
    console.log(`      Detected:         ${result.quotesDetected.length}`);
    console.log(`      Saved:            ${result.savedQuotes}`);
    console.log('');
    console.log('   📊 Positions:');
    console.log(`      Aggregated:       ${result.positionsAggregated.length}`);
    console.log(`      Saved:            ${result.savedPositions}`);
    console.log('═══════════════════════════════════════════════════════════════');

    if (result.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        for (const err of result.errors) {
            console.log(`   - ${err}`);
        }
    }

    // Show sample detected events
    if (result.eventsDetected.length > 0) {
        console.log('\n📋 Sample Detected Events (first 5):');
        for (const event of result.eventsDetected.slice(0, 5)) {
            console.log(`   [${event.type}] "${event.triggerPhrase.substring(0, 50)}..." @ ${event.timestampSeconds.toFixed(1)}s`);
        }
    }

    // Show sample quotes
    if (result.quotesDetected.length > 0) {
        console.log('\n💬 Sample Quotes (first 3):');
        for (const quote of result.quotesDetected.slice(0, 3)) {
            const preview = quote.quoteText.length > 80
                ? quote.quoteText.substring(0, 80) + '...'
                : quote.quoteText;
            console.log(`   [${quote.impactLevel}] "${preview}"`);
        }
    }

    console.log('\n✅ Pipeline test complete!');
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
