'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { EmotionalTimeline, WeekStats } from './deepParser';

// Dates lose their type through sessionStorage — reconvert
const toDate = (d: any): Date => d instanceof Date ? d : new Date(d);

interface EmotionalTimelineChartProps {
  timeline: EmotionalTimeline;
  totalMessages: number;
}

export default function EmotionalTimelineChart({ timeline, totalMessages }: EmotionalTimelineChartProps) {
  const ref = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-5%' });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; week: WeekStats } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => setRevealed(true), 400);
      return () => clearTimeout(t);
    }
  }, [isInView]);

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width || 800);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const { weeks } = timeline;
  if (!weeks || weeks.length === 0) return null;

  const HEIGHT = 180;
  const PADDING = { top: 20, right: 16, bottom: 40, left: 40 };
  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const maxMessages = Math.max(...weeks.map(w => w.messageCount), 1);
  const barWidth = Math.max(1, (chartWidth / weeks.length) - 1);

  // Format date label
  const formatWeekLabel = (w: WeekStats) => {
    return toDate(w.startDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  };

  // Only show ~6 date labels
  const labelInterval = Math.ceil(weeks.length / 6);

  // Smoothed anxiety line (5-week moving average)
  const smoothAnxiety = weeks.map((_, i) => {
    const window = weeks.slice(Math.max(0, i - 2), Math.min(weeks.length, i + 3));
    return window.reduce((s, w) => s + w.avgAnxiety, 0) / window.length;
  });

  const maxAnxiety = Math.max(...smoothAnxiety, 0.1);

  // Build anxiety line path
  const anxietyPoints = smoothAnxiety.map((val, i) => {
    const x = PADDING.left + (i / Math.max(weeks.length - 1, 1)) * chartWidth;
    const y = PADDING.top + chartHeight - (val / maxAnxiety) * chartHeight;
    return `${x},${y}`;
  });
  const anxietyPath = `M ${anxietyPoints.join(' L ')}`;

  return (
    <div ref={containerRef}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Emotional timeline
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: '1.05rem', color: PALETTE.ink }}>
            {weeks.length} weeks of recorded activity
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 20, height: 2, background: 'rgba(240,237,232,0.2)' }} />
            <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Volume</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 20, height: 2, background: PALETTE.red }} />
            <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Anxiety</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE.red }} />
            <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Crisis</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: 'relative', width: '100%' }}>
        <svg
          ref={ref}
          width="100%"
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          style={{ overflow: 'visible' }}
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map(frac => (
            <line
              key={frac}
              x1={PADDING.left}
              y1={PADDING.top + chartHeight * (1 - frac)}
              x2={PADDING.left + chartWidth}
              y2={PADDING.top + chartHeight * (1 - frac)}
              stroke={PALETTE.border}
              strokeWidth={0.5}
              strokeDasharray="2 4"
            />
          ))}

          {/* Bars */}
          {weeks.map((week, i) => {
            const barHeight = (week.messageCount / maxMessages) * chartHeight;
            const x = PADDING.left + (i / Math.max(weeks.length - 1, 1)) * chartWidth - barWidth / 2;
            const y = PADDING.top + chartHeight - barHeight;

            // Color: crisis = red, high anxiety = amber, normal = muted
            const barColor = week.crisisFlag
              ? 'rgba(220,60,50,0.45)'
              : week.avgAnxiety > 4
              ? 'rgba(255,179,0,0.25)'
              : 'rgba(240,237,232,0.12)';

            return (
              <motion.rect
                key={week.weekKey}
                x={x}
                y={y}
                width={Math.max(barWidth - 0.5, 1)}
                height={barHeight}
                fill={barColor}
                initial={{ scaleY: 0, transformOrigin: `${x + barWidth / 2}px ${PADDING.top + chartHeight}px` }}
                animate={revealed ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: 0.8, delay: (i / weeks.length) * 0.6, ease: [0.4, 0, 0.2, 1] }}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGElement).getBoundingClientRect();
                  const container = containerRef.current?.getBoundingClientRect();
                  if (container) {
                    setTooltip({
                      x: rect.left - container.left + barWidth / 2,
                      y: rect.top - container.top,
                      week,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'crosshair' }}
              />
            );
          })}

          {/* Crisis period overlays */}
          {timeline.crisisPeriods.map((period, i) => {
            const startIdx = weeks.findIndex(w => w.weekKey === period.start);
            const endIdx = weeks.findIndex(w => w.weekKey === period.end);
            if (startIdx < 0) return null;
            const x1 = PADDING.left + (startIdx / Math.max(weeks.length - 1, 1)) * chartWidth;
            const x2 = PADDING.left + (Math.min(endIdx > 0 ? endIdx : startIdx + 1, weeks.length - 1) / Math.max(weeks.length - 1, 1)) * chartWidth;
            return (
              <motion.rect
                key={`crisis-${i}`}
                x={x1}
                y={PADDING.top}
                width={Math.max(x2 - x1, 4)}
                height={chartHeight}
                fill="rgba(220,60,50,0.06)"
                stroke="rgba(220,60,50,0.15)"
                strokeWidth={0.5}
                initial={{ opacity: 0 }}
                animate={revealed ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.8 }}
              />
            );
          })}

          {/* Anxiety line */}
          <motion.path
            d={anxietyPath}
            fill="none"
            stroke={PALETTE.red}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={revealed ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 1.8, delay: 0.4, ease: 'easeInOut' }}
          />

          {/* Peak anxiety dot */}
          {timeline.peakAnxietyWeek && (() => {
            const idx = weeks.findIndex(w => w.weekKey === timeline.peakAnxietyWeek!.weekKey);
            if (idx < 0) return null;
            const x = PADDING.left + (idx / Math.max(weeks.length - 1, 1)) * chartWidth;
            const anxiety = smoothAnxiety[idx] || 0;
            const y = PADDING.top + chartHeight - (anxiety / maxAnxiety) * chartHeight;
            return (
              <motion.circle
                cx={x} cy={y} r={4}
                fill={PALETTE.red}
                initial={{ scale: 0 }}
                animate={revealed ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: 1.6 }}
              />
            );
          })()}

          {/* X axis date labels */}
          {weeks.map((week, i) => {
            if (i % labelInterval !== 0) return null;
            const x = PADDING.left + (i / Math.max(weeks.length - 1, 1)) * chartWidth;
            return (
              <text
                key={`label-${i}`}
                x={x}
                y={PADDING.top + chartHeight + 16}
                textAnchor="middle"
                style={{ fontFamily: TYPE.mono, fontSize: '11px', fill: 'rgba(240,237,232,0.45)', letterSpacing: '0.08em' }}
              >
                {formatWeekLabel(week)}
              </text>
            );
          })}

          {/* Y axis */}
          <line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={PADDING.top + chartHeight}
            stroke={PALETTE.border}
            strokeWidth={0.5}
          />
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(tooltip.x, width - 180),
              top: Math.max(0, tooltip.y - 80),
              background: PALETTE.bgElevated,
              border: `1px solid ${tooltip.week.crisisFlag ? PALETTE.red : PALETTE.border}`,
              padding: '0.75rem',
              pointerEvents: 'none',
              zIndex: 10,
              minWidth: 160,
            }}
          >
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, letterSpacing: '0.12em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              {toDate(tooltip.week.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.ink, marginBottom: '2px' }}>
              {tooltip.week.messageCount} messages
            </p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: tooltip.week.avgAnxiety > 3 ? PALETTE.red : PALETTE.inkMuted }}>
              Anxiety: {tooltip.week.avgAnxiety.toFixed(1)}/10
            </p>
            {tooltip.week.lateNightCount > 0 && (
              <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, marginTop: '2px' }}>
                {tooltip.week.lateNightCount} late-night
              </p>
            )}
            {tooltip.week.crisisFlag && (
              <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.red, marginTop: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Crisis period
              </p>
            )}
            {tooltip.week.dominantTopic && (
              <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, marginTop: '2px', textTransform: 'capitalize' }}>
                {tooltip.week.dominantTopic}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Summary stats below chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: PALETTE.border, marginTop: '1px' }}>
        {[
          {
            label: 'Emotional trend',
            value: timeline.emotionalTrend.charAt(0).toUpperCase() + timeline.emotionalTrend.slice(1),
            color: timeline.emotionalTrend === 'worsening' ? PALETTE.red : timeline.emotionalTrend === 'improving' ? PALETTE.green : PALETTE.inkMuted,
          },
          {
            label: 'Crisis periods',
            value: timeline.crisisPeriods.length.toString(),
            color: timeline.crisisPeriods.length > 0 ? PALETTE.red : PALETTE.inkMuted,
          },
          {
            label: 'Peak anxiety week',
            value: timeline.peakAnxietyWeek
              ? toDate(timeline.peakAnxietyWeek.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
              : 'N/A',
            color: PALETTE.inkMuted,
          },
          {
            label: 'Highest volume week',
            value: timeline.highVolumeWeeks[0]
              ? `${timeline.highVolumeWeeks[0].messageCount} messages`
              : 'N/A',
            color: PALETTE.inkMuted,
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1 + i * 0.1 }}
            style={{ background: PALETTE.bgPanel, padding: '0.8rem 1rem' }}
          >
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: stat.color, letterSpacing: '0.04em' }}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* If there are crisis periods, name them */}
      {timeline.crisisPeriods.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.4 }}
          style={{ marginTop: '1px', padding: '1rem', background: PALETTE.bgPanel, borderLeft: `2px solid ${PALETTE.red}` }}
        >
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Crisis periods detected
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {timeline.crisisPeriods.map((period, i) => {
              const peakWeek = timeline.weeks.find(w => w.weekKey === period.peakWeek);
              return (
                <div key={i}>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.ink }}>
                    {peakWeek ? toDate(peakWeek.startDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : period.start}
                  </p>
                  {peakWeek && (
                    <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint }}>
                      Peak: {peakWeek.messageCount} messages/week
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', fontStyle: 'italic', color: PALETTE.inkFaint, marginTop: '0.6rem', lineHeight: 1.6 }}>
            These are the weeks when you needed help most. They are also the weeks that produced the most valuable data.
          </p>
        </motion.div>
      )}
    </div>
  );
}
