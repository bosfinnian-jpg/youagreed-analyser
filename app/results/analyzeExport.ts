// ============================================================================
// analyzeExport.ts
// Runs deep parser, then AI enrichment, stores final result.
// ============================================================================

import { analyzeDeep, type DeepAnalysis } from './deepParser';
import { enrichAnalysisWithAI, type EnrichmentProgress } from './aiEnrichment';

export interface AnalyzeProgress {
  phase: 'parsing' | 'ai_enriching' | 'storing' | 'done';
  aiProgress?: EnrichmentProgress;
}

export async function analyzeExport(
  jsonData: any[],
  onProgress?: (p: AnalyzeProgress) => void
): Promise<{
  analysis: DeepAnalysis;
  revealData: import('./CountdownReveal').RevealData;
}> {
  onProgress?.({ phase: 'parsing' });

  // Run the regex-based deep parser first
  let analysis = analyzeDeep(jsonData);

  // Store a regex-only snapshot immediately so the dashboard can load
  // even if AI enrichment is slow or fails
  storeAnalysis(analysis);

  onProgress?.({ phase: 'ai_enriching' });

  // Run AI enrichment — this can take 20-40 seconds
  try {
    analysis = await enrichAnalysisWithAI(analysis, (aiProgress) => {
      onProgress?.({ phase: 'ai_enriching', aiProgress });
    });
  } catch (err) {
    console.error('AI enrichment threw, keeping regex analysis:', err);
  }

  onProgress?.({ phase: 'storing' });

  storeAnalysis(analysis);

  const revealData = buildRevealData(analysis);
  sessionStorage.setItem('revealData', JSON.stringify(revealData));

  onProgress?.({ phase: 'done' });

  return { analysis, revealData };
}

// ============================================================================
// STORAGE
// ============================================================================

function storeAnalysis(analysis: DeepAnalysis): void {
  const storableAnalysis = {
    ...analysis,
    messages: undefined, // drop raw messages — they're large
    privacyScore: analysis.privacyScore,
    stats: analysis.rawStats,
    findings: analysis.findings,
    juiciestMoments: analysis.juiciestMoments,
    emotionalTimeline: analysis.emotionalTimeline,
    commercialProfile: analysis.commercialProfile,
    dependency: analysis.dependency,
    lifeEvents: analysis.lifeEvents,
    topicsByPeriod: analysis.topicsByPeriod,
    hourDistribution: analysis.hourDistribution,
    dayDistribution: analysis.dayDistribution,
    nighttimeRatio: analysis.nighttimeRatio,
    avgIntimacy: analysis.avgIntimacy,
    avgAnxiety: analysis.avgAnxiety,
    mostVulnerablePeriod: analysis.mostVulnerablePeriod,
    totalUserMessages: analysis.totalUserMessages,
    timespan: {
      first: analysis.timespan.first.toISOString(),
      last: analysis.timespan.last.toISOString(),
      days: analysis.timespan.days,
    },
    typeBreakdown: analysis.typeBreakdown,
    aiEnriched: true,
  };

  try {
    sessionStorage.setItem('analysisResults', JSON.stringify(storableAnalysis));
  } catch (err) {
    console.error('Failed to store analysis in sessionStorage:', err);
  }
}

// ============================================================================
// REVEAL DATA
// ============================================================================

function buildRevealData(analysis: DeepAnalysis): import('./CountdownReveal').RevealData {
  const topSegment = analysis.commercialProfile.segments[0];
  const firstDate = analysis.timespan.first.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
  const lateNightMsgs = analysis.messages.filter(m => m.hour >= 0 && m.hour <= 4);
  const confessionalMsgs = analysis.messages.filter(m => m.confessionalScore > 3);

  return {
    name: analysis.findings.personalInfo.names[0]?.name,
    location: analysis.findings.personalInfo.locations[0]?.location,
    vulnerabilityWindow: analysis.findings.vulnerabilityPatterns[0]?.timeOfDay,
    emotionalTone: analysis.findings.vulnerabilityPatterns[0]?.emotionalTone,
    revealingMoment: analysis.juiciestMoments[0]
      ? {
          timestamp: new Date(analysis.juiciestMoments[0].timestamp).toLocaleString('en-GB'),
          content: analysis.juiciestMoments[0].excerpt?.substring(0, 180) || '',
        }
      : undefined,
    messageCount: analysis.totalUserMessages,
    topTopic: analysis.findings.repetitiveThemes[0]?.theme,
    lateNightCount: lateNightMsgs.length,
    lifeEventCount: analysis.lifeEvents.length,
    crisisPeriods: analysis.emotionalTimeline.crisisPeriods.length,
    dependencyScore: analysis.dependency.dependencyScore,
    topSegment: topSegment?.label,
    firstMessageDate: firstDate,
    confessionalCount: confessionalMsgs.length,
  };
}
