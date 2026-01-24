'use client';

/**
 * AttendanceHeatmap - GitHub-style contribution heatmap for meeting attendance
 * Shows legislator's attendance patterns over time
 */

import { useMemo } from 'react';

interface AttendanceRecord {
    date: string; // ISO date string
    attended: boolean;
    meetingType?: string;
    meetingTitle?: string;
}

interface AttendanceHeatmapProps {
    attendanceData: AttendanceRecord[];
    weeks?: number; // Number of weeks to display (default 52)
}

// Color intensity based on activity level
const getAttendanceColor = (attended: boolean | undefined) => {
    if (attended === undefined) return 'bg-gray-100 dark:bg-gray-800';
    if (attended) return 'bg-green-500 dark:bg-green-600';
    return 'bg-red-400 dark:bg-red-500';
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Generate mock attendance data for the past year
function generateMockAttendance(): AttendanceRecord[] {
    const records: AttendanceRecord[] = [];
    const today = new Date();
    const meetingTypes = ['Regular Session', 'Special Session', 'Committee Meeting', 'Public Hearing'];

    // Go back ~12 months
    for (let i = 365; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // City council typically meets on Tuesdays
        const dayOfWeek = date.getDay();

        // Only create records for Tuesdays (regular meetings) and occasional other days
        if (dayOfWeek === 2) { // Tuesday
            // 90% attendance rate
            const attended = Math.random() > 0.1;
            records.push({
                date: date.toISOString().split('T')[0],
                attended,
                meetingType: 'Regular Session',
                meetingTitle: `City Council Meeting - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            });
        } else if (dayOfWeek === 4 && Math.random() > 0.7) {
            // Occasional Thursday committee meetings
            const attended = Math.random() > 0.15;
            records.push({
                date: date.toISOString().split('T')[0],
                attended,
                meetingType: meetingTypes[Math.floor(Math.random() * meetingTypes.length)],
                meetingTitle: `Committee Meeting - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            });
        }
    }

    return records;
}

export default function AttendanceHeatmap({
    attendanceData,
    weeks = 52
}: AttendanceHeatmapProps) {
    // Use mock data if none provided
    const data = useMemo(() => {
        return attendanceData.length > 0 ? attendanceData : generateMockAttendance();
    }, [attendanceData]);

    // Build the grid data
    const gridData = useMemo(() => {
        const today = new Date();
        const grid: Array<Array<{ date: string; record?: AttendanceRecord }>> = [];

        // Create a map for quick lookup
        const recordMap = new Map<string, AttendanceRecord>();
        data.forEach(record => {
            recordMap.set(record.date, record);
        });

        // Start from (weeks) weeks ago, on Sunday
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (weeks * 7) - startDate.getDay());

        // Build week columns
        for (let week = 0; week <= weeks; week++) {
            const weekData: Array<{ date: string; record?: AttendanceRecord }> = [];

            for (let day = 0; day < 7; day++) {
                const cellDate = new Date(startDate);
                cellDate.setDate(cellDate.getDate() + (week * 7) + day);
                const dateStr = cellDate.toISOString().split('T')[0];

                // Don't show future dates
                if (cellDate > today) {
                    weekData.push({ date: dateStr, record: undefined });
                } else {
                    weekData.push({
                        date: dateStr,
                        record: recordMap.get(dateStr)
                    });
                }
            }

            grid.push(weekData);
        }

        return grid;
    }, [data, weeks]);

    // Calculate stats
    const stats = useMemo(() => {
        const attended = data.filter(r => r.attended).length;
        const missed = data.filter(r => !r.attended).length;
        const total = data.length;
        const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

        return { attended, missed, total, rate };
    }, [data]);

    // Get month labels
    const monthLabels = useMemo(() => {
        const labels: Array<{ month: string; weekIndex: number }> = [];
        let lastMonth = -1;

        gridData.forEach((week, weekIndex) => {
            const firstDay = new Date(week[0].date);
            const month = firstDay.getMonth();

            if (month !== lastMonth) {
                labels.push({ month: MONTHS[month], weekIndex });
                lastMonth = month;
            }
        });

        return labels;
    }, [gridData]);

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Meeting Attendance</h2>
                <div className="flex gap-4 text-sm">
                    <span className="text-green-600 dark:text-green-400">
                        {stats.attended} attended
                    </span>
                    <span className="text-red-500 dark:text-red-400">
                        {stats.missed} missed
                    </span>
                    <span className="font-semibold">
                        {stats.rate}% rate
                    </span>
                </div>
            </div>

            {/* Month labels */}
            <div className="flex mb-1 text-xs text-gray-500 pl-8">
                {monthLabels.map((label, idx) => (
                    <div
                        key={idx}
                        className="absolute"
                        style={{
                            left: `${32 + label.weekIndex * 14}px`,
                            position: 'relative',
                            width: '28px'
                        }}
                    >
                        {label.month}
                    </div>
                ))}
            </div>

            <div className="flex">
                {/* Day labels */}
                <div className="flex flex-col text-xs text-gray-500 mr-2 justify-between py-0.5">
                    {DAYS.filter((_, i) => i % 2 === 1).map(day => (
                        <span key={day} className="h-3 leading-3">{day}</span>
                    ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-0.5 overflow-x-auto pb-2">
                    {gridData.map((week, weekIdx) => (
                        <div key={weekIdx} className="flex flex-col gap-0.5">
                            {week.map((cell, dayIdx) => {
                                const hasRecord = cell.record !== undefined;
                                const bgColor = hasRecord
                                    ? getAttendanceColor(cell.record?.attended)
                                    : 'bg-gray-50 dark:bg-gray-900';

                                return (
                                    <div
                                        key={dayIdx}
                                        className={`w-3 h-3 rounded-sm ${bgColor} ${hasRecord ? 'cursor-pointer' : ''}`}
                                        title={
                                            cell.record
                                                ? `${cell.record.meetingTitle}\n${cell.record.attended ? '✓ Attended' : '✗ Missed'}`
                                                : cell.date
                                        }
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
                <span>Missed</span>
                <div className="w-3 h-3 rounded-sm bg-red-400 dark:bg-red-500" />
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
                <span>Attended</span>
            </div>
        </div>
    );
}
