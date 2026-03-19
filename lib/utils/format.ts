/**
 * Shared formatting utilities used across the application.
 * Consolidates duplicated formatIssueName, formatDate, and formatTime functions.
 */

/**
 * Converts snake_case issue names to Title Case display names.
 * e.g. "public_safety" → "Public Safety"
 */
export function formatIssueName(name: string): string {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Formats a date string to a short readable format.
 * e.g. "2024-01-15T00:00:00Z" → "Jan 15, 2024"
 */
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Formats seconds into a readable timestamp.
 * e.g. 125 → "2:05", 3661 → "1:01:01"
 */
export function formatTime(seconds: number | null | undefined): string {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Formats a duration in seconds to a human-readable string.
 * e.g. 5580 → "1h 33m", 300 → "5m"
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}
