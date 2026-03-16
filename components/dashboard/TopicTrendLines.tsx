// TopicTrendLines — SVG sparkline charts showing issue frequency over time
"use client";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import type { IssueTrend } from '@/lib/data/dashboard';

interface TopicTrendLinesProps {
    trends: IssueTrend[];
}

const trendColors = [
    { stroke: '#811749', fill: '#81174920' },  // capyred
    { stroke: '#be123c', fill: '#be123c20' },  // rose-700
    { stroke: '#f43f5e', fill: '#f43f5e20' },  // rose-500
    { stroke: '#fb923c', fill: '#fb923c20' },  // orange-400
];

const formatIssueName = (name: string) => {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

function Sparkline({ dataPoints, color, width = 200, height = 40 }: {
    dataPoints: { date: string; count: number }[];
    color: { stroke: string; fill: string };
    width?: number;
    height?: number;
}) {
    if (dataPoints.length < 2) {
        return (
            <svg width={width} height={height} className="inline-block">
                <text x={width / 2} y={height / 2} textAnchor="middle" className="fill-gray-400 text-xs">
                    Insufficient data
                </text>
            </svg>
        );
    }

    const maxCount = Math.max(...dataPoints.map(d => d.count));
    const minCount = Math.min(...dataPoints.map(d => d.count));
    const range = maxCount - minCount || 1;
    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = dataPoints.map((d, i) => ({
        x: padding + (i / (dataPoints.length - 1)) * chartWidth,
        y: padding + chartHeight - ((d.count - minCount) / range) * chartHeight,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Area fill path
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
        <svg width={width} height={height} className="inline-block">
            <path d={areaPath} fill={color.fill} />
            <path d={linePath} fill="none" stroke={color.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* End dot */}
            <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="3"
                fill={color.stroke}
            />
        </svg>
    );
}

export default function TopicTrendLines({ trends }: TopicTrendLinesProps) {
    if (!trends || trends.length === 0) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faChartLine} className="text-capyred" />
                    <h3 className="text-lg font-bold">Topic Trends</h3>
                </div>
                <p className="text-gray-500 text-sm">Not enough data to show trends yet. Trends will appear as more meetings are analyzed.</p>
            </div>
        );
    }

    return (
        <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faChartLine} className="text-capyred" />
                <h3 className="text-lg font-bold">Topic Trends</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4 uppercase tracking-wide">Issue frequency across analyzed meetings</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trends.map((trend, index) => {
                    const color = trendColors[index % trendColors.length];
                    const firstCount = trend.dataPoints[0]?.count || 0;
                    const lastCount = trend.dataPoints[trend.dataPoints.length - 1]?.count || 0;
                    const change = firstCount > 0 ? Math.round(((lastCount - firstCount) / firstCount) * 100) : 0;

                    return (
                        <div key={trend.issueId} className="border border-gray-200 p-3">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-semibold text-foreground">
                                    {formatIssueName(trend.issueName)}
                                </span>
                                {change !== 0 && (
                                    <span className={`text-xs font-mono font-bold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {change > 0 ? '↑' : '↓'}{Math.abs(change)}%
                                    </span>
                                )}
                            </div>
                            <Sparkline
                                dataPoints={trend.dataPoints}
                                color={color}
                                width={200}
                                height={40}
                            />
                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                {trend.totalMentions} total mentions
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
