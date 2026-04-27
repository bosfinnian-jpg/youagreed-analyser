// ============================================================================
// analyzeExport.ts
// Runs deep parser, then AI enrichment, stores final result.
// Supports ChatGPT and Claude exports, and merging multiple sources.
// ============================================================================

import { analyzeDeep, type DeepAnalysis } from './deepParser';
import { enrichAnalysisWithAI, type EnrichmentProgress } from './aiEnrichment';
import { isClaudeExport, normaliseClaude } from './claudeParser';

export interface AnalyzeProgress {
  phase: 'parsing' | 'ai_enriching' | 'storing' | 'done';
  aiProgress?: EnrichmentProgress;
}

export type SourceType = 'chatgpt' | 'claude';

export function detectSourceType(jsonData: any[]): SourceType {
  return isClaudeExport(jsonData) ? 'claude' : 'chatgpt';
}

// Normalise any supported export format into ChatGPT-compatible format
function normaliseToGPTFormat(jsonData: any[], sourceType: SourceType): any[] {
  if (sourceType === 'claude') {
    return normaliseClaude(jsonData);
  }
  return jsonData; // ChatGPT is already the native format
}

export interface RevealData {
  name?: string;
  location?: string;
  vulnerabilityWindow?: string;
  emotionalTone?: string;
  revealingMoment?: { timestamp: string; content: string };
  messageCount: number;
  topTopic?: string;
  lateNightCount: number;
  lifeEventCount: number;
  crisisPeriods: number;
  dependencyScore: number;
  topSegment?: string;
  firstMessageDate: string;
  confessionalCount: number;
}

export async function analyzeExport(
  jsonData: any[],
  onProgress?: (p: AnalyzeProgress) => void,
  sourceType?: SourceType
): Promise<{
  analysis: DeepAnalysis;
  revealData: RevealData;
}> {
  const detectedType = sourceType ?? detectSourceType(jsonData);
  const normalised = normaliseToGPTFormat(jsonData, detectedType);

  onProgress?.({ phase: 'parsing' });

  let analysis = analyzeDeep(normalised);
  storeAnalysis(analysis);

  onProgress?.({ phase: 'ai_enriching' });

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
// MERGE - combine two source analyses
// Used when a second source (e.g. Claude) is added to an existing ChatGPT analysis
// ============================================================================

export async function mergeAndReanalyze(
  existingJsonKey: string,
  newJsonData: any[],
  newSourceType: SourceType,
  onProgress?: (p: AnalyzeProgress) => void
): Promise<{
  analysis: DeepAnalysis;
  revealData: RevealData;
}> {
  // Get the raw JSON for the existing source if stored
  const existingRaw = sessionStorage.getItem('rawJson_' + existingJsonKey);

  let combined: any[];
  const newNormalised = normaliseToGPTFormat(newJsonData, newSourceType);

  if (existingRaw) {
    const existingParsed = JSON.parse(existingRaw);
    combined = [...existingParsed, ...newNormalised];
  } else {
    // Can't get original - just analyse the new source alone
    combined = newNormalised;
  }

  return analyzeExport(combined, onProgress, 'chatgpt');
}

// Store raw JSON for later merging
export function storeRawJson(sourceId: string, jsonData: any[], sourceType: SourceType): void {
  const normalised = normaliseToGPTFormat(jsonData, sourceType);
  try {
    sessionStorage.setItem('rawJson_' + sourceId, JSON.stringify(normalised));
  } catch {
    // sessionStorage full - skip, analysis will still work
  }
}

// ============================================================================
// STORAGE
// ============================================================================

function storeAnalysis(analysis: DeepAnalysis): void {
  const storableAnalysis = {
    ...analysis,
    messages: undefined,
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
    psychologicalPortrait: analysis.psychologicalPortrait,
    synthesis: (analysis as any).synthesis,
    scoreBreakdown: (analysis as any).scoreBreakdown,
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

function buildRevealData(analysis: DeepAnalysis): RevealData {
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
