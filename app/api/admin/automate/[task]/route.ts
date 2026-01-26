import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth-utils";
import { runScript } from "@/lib/utils/script-runner";

const TASK_MAP: Record<string, string> = {
    "populate-meetings": "scripts/populate-meetings.ts",
    "update-stats": "scripts/update_stats.ts",
    "analyze-transcripts": "scripts/analyze_transcripts.ts",
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ task: string }> }
) {
    try {
        await requireAdmin();
        const { task } = await params;

        const scriptPath = TASK_MAP[task];

        if (!scriptPath) {
            return NextResponse.json({ error: "Invalid task" }, { status: 400 });
        }

        console.log(`Executing admin task: ${task} (${scriptPath})`);

        // Run the script asynchronously but wait for it to return a basic response
        // In a real serverless env, this would need to be a background job.
        // For local dev, we can wait for it.
        const result = await runScript(scriptPath);

        if (result.success) {
            return NextResponse.json({
                message: `${task} completed successfully`,
                output: result.stdout,
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
