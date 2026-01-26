import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execPromise = promisify(exec);

/**
 * Runs a backend script using tsx.
 * @param scriptPath Path to the script relative to the project root.
 * @returns Object with success status and output.
 */
export async function runScript(scriptPath: string) {
    const rootDir = process.cwd();
    const absolutePath = path.join(rootDir, scriptPath);

    try {
        // We use npx tsx to run the script. 
        // We also set the CWD to ensure relative paths in scripts work.
        const { stdout, stderr } = await execPromise(`npx tsx "${absolutePath}"`, {
            cwd: rootDir,
            env: { ...process.env },
        });

        return {
            success: true,
            stdout,
            stderr,
        };
    } catch (error: any) {
        console.error(`Script execution failed: ${scriptPath}`, error);
        return {
            success: false,
            error: error.message,
            stdout: error.stdout,
            stderr: error.stderr,
        };
    }
}
