'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faSpinner, faCheckCircle, faExclamationCircle, faLink } from '@fortawesome/free-solid-svg-icons';

export default function ScraperTool() {
    const [url, setUrl] = useState('');
    const [prompt, setPrompt] = useState('Find the most recent City Council or County Commission meeting. Extract its video, agenda, and minutes URLs.');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!url) {
            setError('Please enter a target URL');
            return;
        }
        
        // Basic URL validation
        try {
            new URL(url.startsWith('http') ? url : `https://${url}`);
        } catch (_) {
            setError('Please enter a valid URL');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
            const res = await fetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUrl: formattedUrl, prompt }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to run scraper');
            }

            setResult(data.data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#121111] border border-zinc-800 rounded-xl overflow-hidden mt-6">
            <div className="bg-[#1E1C1A] px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                <FontAwesomeIcon icon={faRobot} className="text-[#EE6C4D]" />
                <h2 className="text-xl font-medium tracking-tight text-white m-0">AI Scraper Tool</h2>
            </div>
            
            <div className="p-6">
                <p className="text-zinc-400 text-sm mb-6">
                    Test the AI extraction pipeline against any city or county website. It will navigate the DOM to find the most recent meeting assets.
                </p>

                <form onSubmit={handleScrape} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Target URL</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon icon={faLink} className="text-zinc-500" />
                            </div>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://shelbycountytn.gov/agenda..."
                                className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#EE6C4D] focus:ring-1 focus:ring-[#EE6C4D] transition-colors"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Custom Prompt <span className="text-zinc-500 font-normal">(Optional)</span></label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-[#0A0A0A] border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#EE6C4D] focus:ring-1 focus:ring-[#EE6C4D] transition-colors resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-[#EE6C4D] text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                Scraping & Analyzing (takes up to 60s)...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faRobot} />
                                Run Extraction Agent
                            </>
                        )}
                    </button>
                </form>

                {/* Error State */}
                {error && (
                    <div className="mt-6 p-4 bg-red-950/30 border border-red-900 rounded-lg flex gap-3 text-red-500">
                        <FontAwesomeIcon icon={faExclamationCircle} className="mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">Failed to extract data</p>
                            <p className="text-xs text-red-400/80 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Results */}
                {result && (
                    <div className="mt-6 border border-zinc-800 rounded-lg overflow-hidden">
                        <div className="bg-[#1E1C1A] px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-500">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <span className="font-medium text-sm">Extraction Complete</span>
                            </div>
                            <div className="text-xs text-zinc-500">
                                Confidence: <span className="text-white font-medium">{result.confidence}%</span>
                            </div>
                        </div>
                        
                        <div className="p-4 space-y-4 bg-zinc-900/30">
                            {result.hasMeeting ? (
                                <>
                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Meeting Identified</div>
                                        <div className="text-white text-lg font-medium">{result.meetingTitle || 'Unnamed Meeting'}</div>
                                        <div className="text-zinc-400 text-sm mt-0.5">{result.meetingDate || 'Unknown Date'}</div>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                                        <div className="flex items-start justify-between">
                                            <span className="text-sm font-medium text-zinc-400 w-24">Video URL</span>
                                            {result.videoUrl ? (
                                                <a href={result.videoUrl} target="_blank" rel="noreferrer" className="text-sm text-[#EE6C4D] hover:underline break-all">
                                                    {result.videoUrl}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-zinc-600">Not found</span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-start justify-between">
                                            <span className="text-sm font-medium text-zinc-400 w-24">Agenda URL</span>
                                            {result.agendaUrl ? (
                                                <a href={result.agendaUrl} target="_blank" rel="noreferrer" className="text-sm text-[#EE6C4D] hover:underline break-all">
                                                    {result.agendaUrl}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-zinc-600">Not found</span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-start justify-between">
                                            <span className="text-sm font-medium text-zinc-400 w-24">Minutes URL</span>
                                            {result.minutesUrl ? (
                                                <a href={result.minutesUrl} target="_blank" rel="noreferrer" className="text-sm text-[#EE6C4D] hover:underline break-all">
                                                    {result.minutesUrl}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-zinc-600">Not found</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-zinc-800 text-sm text-zinc-500 italic">
                                        Agent Note: {result.explanation}
                                    </div>
                                </>
                            ) : (
                                <div className="text-zinc-400 text-sm text-center py-4">
                                    No relevant meetings found on this page.
                                    <div className="text-zinc-500 italic mt-2 text-xs">Reason: {result.explanation}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
