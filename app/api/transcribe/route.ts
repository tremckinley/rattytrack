import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { requireAdminApi } from '@/lib/utils/api-auth';
import { submitBufferToAssemblyAI } from '@/lib/utils/assemblyai-client';

export async function POST(req: NextRequest) {
  let meetingId: string | null = null;

  try {
    // Verify admin session
    await requireAdminApi();

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check file size (25MB limit for Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit. Please upload a smaller file.' },
        { status: 400 }
      );
    }

    // Save initial upload record to database (using service role client)
    const { data: uploadedMeeting, error: insertError } = await supabaseAdmin
      .from('uploaded_meetings')
      .insert({
        title: title || audioFile.name,
        description: description,
        video_filename: audioFile.name,
        video_size_bytes: audioFile.size,
        transcription_status: 'processing'
      })
      .select()
      .single();

    if (insertError || !uploadedMeeting) {
      console.error('Error saving upload to database:', insertError);
      return NextResponse.json({ error: 'Failed to save to database' }, { status: 500 });
    }
    
    meetingId = uploadedMeeting.id;

    if (!meetingId) {
        throw new Error("Failed to secure a database insertion ID");
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe with AssemblyAI in the background queue
    await submitBufferToAssemblyAI({
        buffer,
        videoId: meetingId,
        type: 'upload'
    });

    return NextResponse.json({
        success: true,
        message: 'File uploaded and transcription queued successfully in the background queue.',
        meetingId
    });
  } catch (error: any) {
    console.error('Transcription error:', error);

    // Update meeting status to failed if we created a record
    if (meetingId) {
      await supabaseAdmin
        .from('uploaded_meetings')
        .update({
          transcription_status: 'failed',
          transcription_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', meetingId);
    }

    if (error instanceof Error) {
      return NextResponse.json({
        error: 'Transcription failed',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
