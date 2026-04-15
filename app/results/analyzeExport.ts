// ============================================================================
// UPLOAD ANALYSER — integrates deep parser
// Drop this into your upload page's handleAnalyze function
// ============================================================================

import { analyzeDeep, type DeepAnalysis } from './deepParser';

export async function analyzeExport(jsonData: any[]): Promise<{
  analysis: DeepAnalysis;
  revealData: import('./CountdownReveal').RevealData;
}> {
  const analysis = analyzeDeep(jsonData);

  // Build the RevealData shape for CountdownReveal — now with real deep fields
  const topSegment = analysis.commercialProfile.segments[0];
  const firstDate = analysis.timespan.first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const lateNightMsgs = analysis.messages.filter(m => m.hour >= 0 && m.hour <= 4);
  const confessionalMsgs = analysis.messages.filter(m => m.confessionalScore > 3);

  const revealData = {
    name: analysis.findings.personalInfo.names[0]?.name,
    location: analysis.findings.personalInfo.locations[0]?.location,
    vulnerabilityWindow: analysis.findings.vulnerabilityPatterns[0]?.timeOfDay,
    emotionalTone: analysis.findings.vulnerabilityPatterns[0]?.emotionalTone,
    revealingMoment: analysis.juiciestMoments[0] ? {
      timestamp: new Date(analysis.juiciestMoments[0].timestamp).toLocaleString('en-GB'),
      content: analysis.juiciestMoments[0].excerpt?.substring(0, 180) || '',
    } : undefined,
    messageCount: analysis.totalUserMessages,
    topTopic: analysis.findings.repetitiveThemes[0]?.theme,
    // New deep fields
    lateNightCount: lateNightMsgs.length,
    lifeEventCount: analysis.lifeEvents.length,
    crisisPeriods: analysis.emotionalTimeline.crisisPeriods.length,
    dependencyScore: analysis.dependency.dependencyScore,
    topSegment: topSegment?.label,
    firstMessageDate: firstDate,
    confessionalCount: confessionalMsgs.length,
  };

  // Store full analysis in sessionStorage
  // We store the serialisable parts (not the full messages array to save space)
  const storableAnalysis = {
    ...analysis,
    messages: undefined, // drop raw messages — they're large
    privacyScore: analysis.privacyScore,
    stats: analysis.rawStats,
    // Keep the compatibility layer
    findings: analysis.findings,
    juiciestMoments: analysis.juiciestMoments,
    // Deep fields
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
  };

  sessionStorage.setItem('analysisResults', JSON.stringify(storableAnalysis));
  sessionStorage.setItem('revealData', JSON.stringify(revealData));

  return { analysis, revealData };
}

// ============================================================================
// USAGE IN YOUR UPLOAD PAGE:
// ============================================================================
// 
// import { analyzeExport } from './analyzeExport';
//
// const handleFile = async (file: File) => {
//   setLoading(true);
//   try {
//     const text = await file.text();
//     const json = JSON.parse(text);
//     await analyzeExport(json);
//     router.push('/results');
//   } catch (e) {
//     setError('Could not parse this file. Make sure you uploaded conversations.json from your ChatGPT export.');
//   }
//   setLoading(false);
// };
