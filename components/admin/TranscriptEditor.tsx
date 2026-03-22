'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPen, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface Segment {
    id: number;
    start_time: number;
    end_time: number;
    text: string;
    speaker_name: string | null;
    speaker_id: string | null;
    is_reviewed?: boolean;
}

interface TranscriptEditorProps {
    segments: Segment[];
    legislators: { id: string; display_name: string }[];
}

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TranscriptEditor({ segments: initialSegments, legislators }: TranscriptEditorProps) {
    const [segments, setSegments] = useState<Segment[]>(initialSegments);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [editSpeaker, setEditSpeaker] = useState('');
    const [saving, setSaving] = useState<number | null>(null);

    function startEdit(segment: Segment) {
        setEditingId(segment.id);
        setEditText(segment.text);
        setEditSpeaker(segment.speaker_id || '');
    }

    function cancelEdit() {
        setEditingId(null);
        setEditText('');
        setEditSpeaker('');
    }

    async function saveEdit(segmentId: number) {
        setSaving(segmentId);
        try {
            const speakerName = legislators.find(l => l.id === editSpeaker)?.display_name || null;

            const res = await fetch('/api/admin/qa', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    segmentId,
                    text: editText,
                    speakerId: editSpeaker || null,
                    speakerName,
                }),
            });

            if (!res.ok) throw new Error('Failed to save');

            // Update local state
            setSegments(prev =>
                prev.map(s =>
                    s.id === segmentId
                        ? { ...s, text: editText, speaker_id: editSpeaker || null, speaker_name: speakerName }
                        : s
                )
            );
            setEditingId(null);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save changes');
        } finally {
            setSaving(null);
        }
    }

    async function toggleReviewed(segmentId: number, currentValue: boolean) {
        setSaving(segmentId);
        try {
            const res = await fetch('/api/admin/qa', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ segmentId, isReviewed: !currentValue }),
            });

            if (!res.ok) throw new Error('Failed to update');

            setSegments(prev =>
                prev.map(s =>
                    s.id === segmentId ? { ...s, is_reviewed: !currentValue } : s
                )
            );
        } catch (err) {
            console.error('Review toggle error:', err);
        } finally {
            setSaving(null);
        }
    }

    return (
        <div className="space-y-2">
            {segments.map((segment) => {
                const isEditing = editingId === segment.id;
                const isSaving = saving === segment.id;

                return (
                    <div
                        key={segment.id}
                        className={`bg-white rounded-lg border p-4 transition-all ${
                            segment.is_reviewed
                                ? 'border-green-200 bg-green-50/30'
                                : 'border-gray-100'
                        } ${isEditing ? 'ring-2 ring-capyred/30' : ''}`}
                    >
                        <div className="flex items-start gap-3">
                            {/* Timestamp */}
                            <div className="text-xs text-gray-400 font-mono pt-1 whitespace-nowrap w-16 flex-shrink-0">
                                {formatTimestamp(segment.start_time)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Speaker */}
                                {isEditing ? (
                                    <select
                                        value={editSpeaker}
                                        onChange={(e) => setEditSpeaker(e.target.value)}
                                        className="text-xs font-bold text-capyred mb-2 border border-gray-200 rounded px-2 py-1"
                                    >
                                        <option value="">Unknown Speaker</option>
                                        {legislators.map((leg) => (
                                            <option key={leg.id} value={leg.id}>
                                                {leg.display_name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-xs font-bold text-capyred mb-1">
                                        {segment.speaker_name || 'Unknown Speaker'}
                                    </p>
                                )}

                                {/* Text */}
                                {isEditing ? (
                                    <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        rows={3}
                                        className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg p-2 focus:ring-capyred focus:border-capyred"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-800 leading-relaxed">
                                        {segment.text}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => saveEdit(segment.id)}
                                            disabled={isSaving}
                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                            title="Save"
                                        >
                                            {isSaving ? (
                                                <FontAwesomeIcon icon={faSpinner} className="text-sm animate-spin" />
                                            ) : (
                                                <FontAwesomeIcon icon={faCheck} className="text-sm" />
                                            )}
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="Cancel"
                                        >
                                            <FontAwesomeIcon icon={faXmark} className="text-sm" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => startEdit(segment)}
                                            className="p-1.5 text-gray-400 hover:text-capyred hover:bg-rose-50 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <FontAwesomeIcon icon={faPen} className="text-xs" />
                                        </button>
                                        <button
                                            onClick={() => toggleReviewed(segment.id, !!segment.is_reviewed)}
                                            disabled={isSaving}
                                            className={`p-1.5 rounded transition-colors ${
                                                segment.is_reviewed
                                                    ? 'text-green-600 bg-green-50'
                                                    : 'text-gray-300 hover:text-green-500 hover:bg-green-50'
                                            }`}
                                            title={segment.is_reviewed ? 'Reviewed' : 'Mark as reviewed'}
                                        >
                                            <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
