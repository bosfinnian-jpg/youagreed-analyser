// ============================================================================
// GENERATE INSIGHTS — personalised summary + score breakdown
// ============================================================================

import type { DeepAnalysis } from './deepParser';

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

  // Opening: volume + timespan
  parts.push(
    `Over ${months > 12 ? `${(months / 12).toFixed(1)} years` : `${months} months`}, ` +
    `you sent ${totalUserMessages.toLocaleString()} messages to a system that retains everything.`
  );

  // Exposure drivers
  const drivers: string[] = [];
  if (confessionalCount > 5) drivers.push(`${confessionalCount} confessional disclosures`);
  if (names > 2) drivers.push(`${names} named individuals`);
  if (highSeverityEvents > 0) drivers.push(`${highSeverityEvents} high-severity life event${highSeverityEvents > 1 ? 's' : ''}`);
  if (nighttimeRatio > 0.08) drivers.push(`${Math.round(nighttimeRatio * 100)}% late-night usage`);
  if (validationCount > 10) drivers.push(`${validationCount} validation-seeking messages`);

  if (drivers.length > 0) {
    parts.push(
      `Your primary exposure vectors: ${drivers.slice(0, 3).join(', ')}.`
    );
  }

  // Consequence
  if (topSegment) {
    parts.push(
      `This data is sufficient to classify you as "${topSegment}" with commercial targeting confidence.`
    );
  } else if (crisisCount > 0) {
    parts.push(
      `${crisisCount} crisis period${crisisCount > 1 ? 's' : ''} in your history ` +
      `produced the most commercially valuable data.`
    );
  }

  // Dependency trajectory
  if (dependency.trajectory === 'increasing') {
    parts.push(`Your usage is accelerating — you are sharing more, not less.`);
  } else if (dependency.intimacyTrajectory === 'increasing') {
    parts.push(`The intimacy of your disclosures has increased over time.`);
  }

  return parts.join(' ');
}

// ============================================================================
// SCORE BREAKDOWN — explainable privacy score
// ============================================================================

export interface ScoreFactor {
  label: string;
  contribution: number;
  explanation: string;
  category: 'disclosure' | 'behavioural' | 'volume' | 'commercial';
}

export function computeScoreBreakdown(analysis: DeepAnalysis): ScoreFactor[] {
  const {
    totalUserMessages,
    lifeEvents,
    commercialProfile,
    dependency,
    nighttimeRatio,
    typeBreakdown,
    avgAnxiety,
    findings,
  } = analysis;

  const factors: ScoreFactor[] = [];

  // Life events — high severity
  const highEvents = lifeEvents.filter(e => e.severity === 'high').length;
  if (highEvents > 0) {
    factors.push({
      label: 'High-severity life events',
      contribution: Math.min(36, highEvents * 12),
      explanation: `${highEvents} event${highEvents > 1 ? 's' : ''} detected: ${lifeEvents.filter(e => e.severity === 'high').slice(0, 2).map(e => e.label.toLowerCase()).join(', ')}`,
      category: 'disclosure',
    });
  }

  // Life events — medium severity
  const medEvents = lifeEvents.filter(e => e.severity === 'medium').length;
  if (medEvents > 0) {
    factors.push({
      label: 'Medium-severity life events',
      contribution: Math.min(18, medEvents * 6),
      explanation: `${medEvents} event${medEvents > 1 ? 's' : ''}: ${lifeEvents.filter(e => e.severity === 'medium').slice(0, 2).map(e => e.label.toLowerCase()).join(', ')}`,
      category: 'disclosure',
    });
  }

  // Commercial segments
  const segmentScore = Math.min(30, commercialProfile.segments.reduce((s, seg) => s + seg.confidence / 10, 0));
  if (segmentScore > 5) {
    factors.push({
      label: 'Commercial profiling confidence',
      contribution: Math.round(segmentScore),
      explanation: `${commercialProfile.segments.length} segment${commercialProfile.segments.length > 1 ? 's' : ''} assigned, primary: ${commercialProfile.primaryDriver.toLowerCase()}`,
      category: 'commercial',
    });
  }

  // Dependency
  const depScore = Math.round(dependency.dependencyScore * 0.25);
  if (depScore > 3) {
    factors.push({
      label: 'Dependency pattern',
      contribution: depScore,
      explanation: `Dependency score ${dependency.dependencyScore}/100, trajectory: ${dependency.trajectory}`,
      category: 'behavioural',
    });
  }

  // Confessional messages
  const confessionalCount = typeBreakdown['confessional'] || 0;
  if (confessionalCount > 0) {
    factors.push({
      label: 'Confessional disclosures',
      contribution: Math.min(10, confessionalCount * 2),
      explanation: `${confessionalCount} message${confessionalCount > 1 ? 's' : ''} containing private admissions or secrets`,
      category: 'disclosure',
    });
  }

  // High anxiety
  const anxietyContribution = Math.min(10, Math.round(avgAnxiety * 3));
  if (anxietyContribution > 2) {
    factors.push({
      label: 'Emotional distress signals',
      contribution: anxietyContribution,
      explanation: `Average anxiety signal: ${avgAnxiety.toFixed(1)}/10 across your history`,
      category: 'behavioural',
    });
  }

  // Volume
  if (totalUserMessages > 2000) {
    factors.push({
      label: 'Message volume',
      contribution: totalUserMessages > 5000 ? 15 : 10,
      explanation: `${totalUserMessages.toLocaleString()} messages over ${Math.round(analysis.timespan.days / 30)} months — cumulative profiling risk`,
      category: 'volume',
    });
  }

  // Late night
  if (nighttimeRatio > 0.05) {
    factors.push({
      label: 'Late-night vulnerability',
      contribution: Math.min(8, Math.round(nighttimeRatio * 60)),
      explanation: `${Math.round(nighttimeRatio * 100)}% of messages sent between midnight and 5am`,
      category: 'behavioural',
    });
  }

  // Named individuals
  const nameCount = findings.personalInfo.names?.length || 0;
  if (nameCount > 0) {
    factors.push({
      label: 'Named individuals exposed',
      contribution: Math.min(8, nameCount * 2),
      explanation: `${nameCount} people identified by name — their data is now linked to yours`,
      category: 'disclosure',
    });
  }

  return factors.sort((a, b) => b.contribution - a.contribution);
}
