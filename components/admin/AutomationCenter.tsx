"use client";

import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faArrowsRotate, faDatabase, faMicrochip, faCheckCircle, faExclamationCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface AutomationTask {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    endpoint: string;
}

const TASKS: AutomationTask[] = [
    {
        id: "populate-meetings",
        name: "Populate Meetings",
        description: "Scrape council documents and populate the meetings table.",
        icon: <FontAwesomeIcon icon={faDatabase} className="text-lg" />,
        endpoint: "/api/admin/automate/populate-meetings",
    },
    {
        id: "update-stats",
        name: "Update Statistics",
        description: "Recompute legislator statistics and issue frequencies.",
        icon: <FontAwesomeIcon icon={faArrowsRotate} className="text-lg" />,
        endpoint: "/api/admin/automate/update-stats",
    },
    {
        id: "analyze-transcripts",
        name: "Analyze Transcripts",
        description: "Run the intelligence pipeline on all pending transcripts.",
        icon: <FontAwesomeIcon icon={faMicrochip} className="text-lg" />,
        endpoint: "/api/admin/automate/analyze-transcripts",
    },
];

export default function AutomationCenter() {
    const [running, setRunning] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});

    const runTask = async (task: AutomationTask) => {
        setRunning(task.id);
        try {
            const res = await fetch(task.endpoint, { method: "POST" });
            const data = await res.json();
            setResults((prev) => ({
                ...prev,
                [task.id]: { success: res.ok, message: data.message || (res.ok ? "Task completed successfully" : "Task failed") },
            }));
        } catch (err) {
            setResults((prev) => ({
                ...prev,
                [task.id]: { success: false, message: "Network error or script execution failed" },
            }));
        } finally {
            setRunning(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TASKS.map((task) => (
                <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-950 flex items-center justify-center mb-4">
                            {task.icon}
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 border-none">{task.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{task.description}</p>
                    </div>

                    <div className="space-y-3">
                        {results[task.id] && (
                            <div className={`p-2 rounded text-xs flex items-center gap-2 ${results[task.id].success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                {results[task.id].success ? <FontAwesomeIcon icon={faCheckCircle} className="text-sm" /> : <FontAwesomeIcon icon={faExclamationCircle} className="text-sm" />}
                                <span className="truncate">{results[task.id].message}</span>
                            </div>
                        )}

                        <button
                            onClick={() => runTask(task)}
                            disabled={running === task.id}
                            className="w-full py-2 bg-rose-950 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-900 transition-colors disabled:opacity-50"
                        >
                            {running === task.id ? (
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-base" />
                            ) : (
                                <FontAwesomeIcon icon={faPlay} className="text-sm" />
                            )}
                            {running === task.id ? "Running..." : "Run Script"}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
