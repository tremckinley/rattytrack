import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth-utils";

type TaskResult = {
    success: boolean;
    stdout?: string;
    stderr?: string;
    error?: string;
    stats?: any;
};

type TaskRunner = () => Promise<TaskResult>;

const TASK_RUNNERS: Record<string, TaskRunner> = {
    "populate-meetings": async () => {
        const { populateMeetings } = await import("@/scripts/populate-meetings");
        return await populateMeetings();
    },
    "update-stats": async () => {
        const { updateStatistics } = await import("@/scripts/update_stats");
        return await updateStatistics();
    },
    "analyze-transcripts": async () => {
        const { analyzeUntaggedSegments } = await import("@/scripts/analyze_transcripts");
        return await analyzeUntaggedSegments();
    },
    "sync-transcriptions": async () => {
        const { transcribePendingMeetings } = await import("@/scripts/transcribe-pending-meetings");
        return await transcribePendingMeetings();
    },
    "stop-transcriptions": async () => {
        const { stopTranscriptions } = await import("@/scripts/stop-transcriptions");
        return await stopTranscriptions();
    },
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ task: string }> }
) {
    try {
        await requireAdmin();
        const { task } = await params;

        const runFn = TASK_RUNNERS[task];

        if (!runFn) {
            return NextResponse.json({ error: "Invalid task" }, { status: 400 });
        }

        console.log(`Executing admin native task: ${task}`);

        const result = await runFn();

        if (result.success) {
            return NextResponse.json({
                message: `${task} completed successfully`,
                output: result.stdout || JSON.stringify(result.stats || {}),
            });
        } else {
            return NextResponse.json(
                {
                    error: `${task} failed`,
                    details: result.error,
                    stderr: result.stderr,
                    stdout: result.stdout
                },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error(`Error in automation API for task:`, error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: error.message?.includes("Unauthorized") ? 403 : 500 }
        );
    }
}
