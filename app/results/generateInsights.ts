// ============================================================================
// GENERATE INSIGHTS — personalised summary + score breakdown
// Score breakdown delegates to deepParser's computeScoreFactors so the
// displayed breakdown always matches the actual privacy score.
// ============================================================================

import type { DeepAnalysis } from './deepParser';
import { computeScoreFactors } from './deepParser';

// ============================================================================
// PERSONALISED SUMMARY (70–90 words, clinical, data-driven)
// ============================================================================

export function generateSummary(analysis: DeepAnalysis): string {
  const {
    totalUserMessages,
    timespan,
    lifeEvents,
    nighttimeRatio,
    dependency,
    commercialProfile,
    emotionalTimeline,
    typeBreakdown,
  } = analysis;

  const months = Math.round(timespan.days / 30);
  const confessionalCount = typeBreakdown['confessional'] || 0;
  const validationCount = typeBreakdown['validation'] || 0;
  const highSeverityEvents = lifeEvents.filter(e => e.severity === 'high').length;
  const topSegment = commercialProfile.segments[0]?.label;
  const crisisCount = emotionalTimeline.crisisPeriods.length;
  const names = analysis.findings.personalInfo.names?.length || 0;

  const parts: string[] = [];

  parts.push(
    `Over ${months > 12 ? `${(months / 12).toFixed(1)} years` : `${months} months`}, ` +
    `you sent ${totalUserMessages.toLocaleString()} messages to a system that retains everything.`
  );

  const drivers: string[] = [];
  if (confessionalCount > 5) drivers.push(`${confessionalCount} confessional disclosures`);
  if (names > 2) drivers.push(`${names} named individuals`);
  if (highSeverityEvents > 0) drivers.push(`${highSeverityEvents} high-severity life event${highSeverityEvents > 1 ? 's' : ''}`);
  if (nighttimeRatio > 0.08) drivers.push(`${Math.round(nighttimeRatio * 100)}% late-night usage`);
  if (validationCount > 10) drivers.push(`${validationCount} validation-seeking messages`);

  if (drivers.length > 0) {
    parts.push(`Your primary exposure vectors: ${drivers.slice(0, 3).join(', ')}.`);
  }

  if (topSegment) {
    parts.push(`This data is sufficient to classify you as "${topSegment}" with commercial targeting confidence.`);
  } else if (crisisCount > 0) {
    parts.push(
      `${crisisCount} crisis period${crisisCount > 1 ? 's' : ''} in your history ` +
      `produced the most commercially valuable data.`
    );
  }

  if (dependency.trajectory === 'increasing') {
    parts.push(`Your usage is accelerating — you are sharing more, not less.`);
  } else if (dependency.intimacyTrajectory === 'increasing') {
    parts.push(`The intimacy of your disclosures has increased over time.`);
  }

  return parts.join(' ');
}

// ============================================================================
// SCORE BREAKDOWN — delegates to deepParser for consistency
// ScoreFactor shape matches what ScoreBreakdown.tsx expects
// ============================================================================

export interface ScoreFactor {
  label: string;
  contribution: number;
  explanation: string;
  category: 'disclosure' | 'behavioural' | 'volume' | 'commercial';
}

export function computeScoreBreakdown(analysis: DeepAnalysis): ScoreFactor[] {
  const factors = computeScoreFactors(
    analysis.messages,
    analysis.lifeEvents,
    analysis.commercialProfile,
    analysis.dependency,
    analysis.nighttimeRatio,
    analysis.typeBreakdown,
    analysis.avgAnxiety,
    analysis.avgIntimacy,
  );

  // Strip the `max` field — ScoreBreakdown.tsx doesn't need it
  return factors.map(({ label, contribution, explanation, category }) => ({
    label, contribution, explanation, category,
  }));
}
