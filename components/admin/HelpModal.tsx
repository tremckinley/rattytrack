"use client";

import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faQuestionCircle, faDatabase, faArrowsRotate, faMicrochip, faMicrophone, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

export default function HelpModal() {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors"
                title="Help & Documentation"
            >
                <FontAwesomeIcon icon={faQuestionCircle} className="text-lg" />
                Documentation
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-rose-950 text-white">
                    <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faShieldHalved} className="text-2xl" />
                        <h2 className="text-xl font-bold border-none">Admin Guide</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-rose-900 rounded-lg transition-colors"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-2xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 text-black">
                    <section>
                        <h3 className="text-lg font-bold text-rose-950 mb-3 flex items-center gap-2 border-none">
                            <FontAwesomeIcon icon={faDatabase} className="text-xl" />
                            Automation Center
                        </h3>
                        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                            <p>
                                <strong className="text-gray-900">Populate Meetings:</strong> This script scans official city sources and RSS feeds to find new meetings. It creates new entries in the database with video links and metadata.
                            </p>
                            <p>
                                <strong className="text-gray-900">Update Statistics:</strong> Recomputes legislator performance data (e.g. participation rates) and issue frequencies. Run this after bulk additions or transcription sessions.
                            </p>
                            <p>
                                <strong className="text-gray-900">Analyze Transcripts:</strong> Runs the AI intelligence pipeline. This extracts topics, sentiment, and key quotes from transcripts that haven't been processed yet.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-rose-950 mb-3 flex items-center gap-2 border-none">
                            <FontAwesomeIcon icon={faMicrophone} className="text-xl" />
                            Transcription Hub
                        </h3>
                        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                            <p>
                                This tool lists all meetings that have a video recorded but no text transcript. Click <span className="font-bold text-rose-950">"Transcribe"</span> to trigger the Whisper AI pipeline for that specific video.
                            </p>
                            <p>
                                <span className="italic">Note: Transcription can take 5-15 minutes depending on the meeting length. You can leave the page; the status will update automatically.</span>
                            </p>
                        </div>
                    </section>

                    <section className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                        <h3 className="text-sm font-bold text-rose-950 mb-2 border-none uppercase tracking-wider">Pro Tip</h3>
                        <p className="text-sm text-rose-800 leading-relaxed">
                            For a new meeting, follow this workflow:
                            <span className="block mt-2 font-medium">1. Populate → 2. Transcribe → 3. Analyze → 4. Update Stats</span>
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-6 py-2 bg-rose-950 text-white rounded-lg font-bold hover:bg-rose-900 transition-colors shadow-md"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
}
