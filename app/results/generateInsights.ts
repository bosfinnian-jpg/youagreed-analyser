// ============================================================================
// GENERATE INSIGHTS — personalised summary + score breakdown
// Score breakdown delegates to deepParser's computeScoreFactors so the
// displayed breakdown always matches the actual privacy score.
// ============================================================================

import type { DeepAnalysis } from './deepParser';
import { computeScoreFactors } from './deepParser';

// ============================================================================
// PERSONALISED SUMMARY
// Uses AI synthesis characterSummary if available (always better).
// Falls back to data-driven prose only if synthesis hasn't run.
// ============================================================================

export function generateSummary(analysis: DeepAnalysis): string {
  // Prefer AI-generated character summary
  const synthesis = (analysis as any).synthesis;
  if (synthesis?.characterSummary && synthesis.characterSummary.length > 80) {
    return synthesis.characterSummary;
  }

  // Fallback: data-driven prose (not template assembly)
  const {
    totalUserMessages,
    timespan,
    lifeEvents,
    nighttimeRatio,
    dependency,
    commercialProfile,
    emotionalTimeline,
    typeBreakdown,
    avgAnxiety,
    avgIntimacy,
    psychologicalPortrait,
  } = analysis;

  const months = Math.round(timespan.days / 30);
  const confessionalCount = typeBreakdown['confessional'] || 0;
  const highSeverityEvents = lifeEvents.filter(e => e.severity === 'high');
  const topSegment = commercialProfile.segments[0];
  const crisisCount = emotionalTimeline.crisisPeriods.length;

  // Build a genuine prose summary, not a list of facts
  const timePhrse = months > 24
    ? `Over ${Math.round(months / 12)} years`
    : months > 12
    ? `Over a year`
    : `Over ${months} month${months !== 1 ? 's' : ''}`;

  let para = `${timePhrse}, you sent ${totalUserMessages.toLocaleString()} messages to a system that retains everything. `;

  // Characterise the emotional texture
  if (avgAnxiety > 4) {
    para += `The corpus is characterised by elevated and sustained anxiety — an average of ${avgAnxiety.toFixed(1)}/10 across all messages, indicating that distress is not episodic but structural. `;
  } else if (confessionalCount > 5) {
    para += `The corpus contains ${confessionalCount} confessional disclosures — messages in which you shared something private that you had not told others. `;
  } else if (avgIntimacy > 4) {
    para += `The writing is consistently personal: first-person, emotionally present, and self-referential at a level that exceeds typical tool usage. `;
  }

  // Life events
  if (highSeverityEvents.length > 0) {
    const eventLabels = highSeverityEvents.slice(0, 2).map(e => e.label.toLowerCase()).join(' and ');
    para += `The history includes ${eventLabels} — periods during which people disclose more, think less carefully about what they are sharing, and produce the most commercially valuable training data. `;
  }

  // Dependency
  if (dependency.trajectory === 'increasing' && dependency.intimacyTrajectory === 'increasing') {
    para += `Both usage volume and intimacy have increased over time: you are not using this tool less as familiarity grows. The relationship is deepening. `;
  } else if (crisisCount > 1) {
    para += `${crisisCount} distinct crisis periods are visible in the timeline — weeks of sharply elevated volume and emotional intensity followed by relative quiet. `;
  }

  // Commercial consequence
  if (topSegment && topSegment.confidence >= 50) {
    para += `This data is sufficient to classify you as "${topSegment.label.toLowerCase()}" with ${topSegment.confidence}% confidence. That classification has a market price. The conversations cannot be deleted.`;
  } else {
    para += `The data exists. It cannot be deleted. Under OpenAI's terms of service — which you agreed to — it may be used to train future models indefinitely.`;
  }

  return para.trim();
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
