// ============================================================================
// DEEP PARSER — proper inference from ChatGPT export
// Not keyword counting. Actual behavioural analysis.
// ============================================================================

export interface RawMessage {
  text: string;
  timestamp: number; // unix seconds
  conversationTitle: string;
  conversationId: string;
}

export interface ScoredMessage extends RawMessage {
  hour: number;
  dayOfWeek: number;
  weekKey: string; // "2024-W12"
  monthKey: string; // "2024-03"
  charCount: number;
  wordCount: number;
  intimacyScore: number;    // 0-10: how personal is this message?
  anxietyScore: number;     // 0-10: how much distress is expressed?
  validationScore: number;  // 0-10: seeking reassurance?
  confessionalScore: number; // 0-10: disclosing something private?
  messageType: 'factual' | 'practical' | 'validation' | 'emotional' | 'confessional';
  detectedSegments: string[];
  lifeEventSignals: string[];
}

export interface WeekStats {
  weekKey: string;
  startDate: Date;
  messageCount: number;
  avgIntimacy: number;
  avgAnxiety: number;
  lateNightCount: number;
  dominantTopic: string;
  crisisFlag: boolean;
}

export interface LifeEvent {
  type: string;
  label: string;
  approximateDate: string;
  evidence: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface CommercialProfile {
  segments: {
    id: string;
    label: string;
    description: string;
    confidence: number; // 0-100
    evidence: string;
    adCategories: string[];
  }[];
  overallValue: 'standard' | 'elevated' | 'premium';
  primaryDriver: string;
  vulnerabilityIndex: number; // 0-100
}

export interface DependencyProfile {
  firstMessageDate: Date;
  daysSinceFirst: number;
  messagesPerWeekEarly: number; // first 25%
  messagesPerWeekRecent: number; // last 25%
  trajectory: 'increasing' | 'stable' | 'decreasing';
  avgLengthEarly: number;
  avgLengthRecent: number;
  intimacyTrajectory: 'increasing' | 'stable' | 'decreasing';
  dependencyScore: number; // 0-100
}

export interface EmotionalTimeline {
  weeks: WeekStats[];
  peakAnxietyWeek: WeekStats | null;
  highVolumeWeeks: WeekStats[];
  emotionalTrend: 'improving' | 'worsening' | 'stable' | 'volatile';
  crisisPeriods: { start: string; end: string; peakWeek: string }[];
}

export interface DeepAnalysis {
  messages: ScoredMessage[];
  totalUserMessages: number;
  timespan: { first: Date; last: Date; days: number };

  // Temporal
  hourDistribution: number[]; // 24 values
  dayDistribution: number[]; // 7 values
  peakHour: number;
  nighttimeRatio: number; // proportion midnight-5am

  // Emotional
  emotionalTimeline: EmotionalTimeline;
  avgIntimacy: number;
  avgAnxiety: number;
  mostVulnerableHour: number;
  mostVulnerablePeriod: string;

  // Life events
  lifeEvents: LifeEvent[];

  // Message types
  typeBreakdown: Record<string, number>;

  // Dependency
  dependency: DependencyProfile;

  // Commercial
  commercialProfile: CommercialProfile;

  // Topic clusters with temporal context
  topicsByPeriod: {
    early: string[];
    mid: string[];
    recent: string[];
  };

  // The raw data for other components
  rawStats: {
    totalMessages: number;
    userMessages: number;
    timeSpan: string;
    avgMessageLength: number;
  };

  // Compatibility with existing analysis shape
  privacyScore: number;
  findings: any;
  juiciestMoments: any[];
}

// ============================================================================
// LEXICONS
// ============================================================================

const ANXIETY_LEXICON = [
  'worried', 'worry', 'anxious', 'anxiety', 'scared', 'afraid', 'fear', 'panic',
  'overwhelmed', 'stressed', 'stress', "can't cope", "can't deal", "don't know what to do",
  "don't know what to think", 'helpless', 'hopeless', 'desperate', 'terrified',
  'nervous', 'dread', 'dreading', 'freaking out', 'losing it', 'breakdown',
  'spiralling', 'spiraling', 'intrusive', 'obsessing', 'obsessed', 'cant stop thinking',
];

const VALIDATION_LEXICON = [
  'is it okay', 'is that okay', 'am i wrong', 'am i being', 'do you think i should',
  'what do you think', 'should i be', 'is it normal', 'is this normal', 'does that make sense',
  'am i overreacting', 'am i overthinking', 'tell me honestly', 'be honest with me',
  'what would you do', 'what should i do', "i don't know if", 'do i have a right',
  'am i a bad', 'am i terrible', "i hope that's okay", 'is that weird', 'do i seem',
];

const CONFESSIONAL_LEXICON = [
  "i've never told", "i haven't told", 'nobody knows', 'no one knows', 'i keep this',
  "i haven't spoken", "i've been hiding", 'secret', 'embarrassed to admit', 'ashamed',
  'i feel guilty', 'i feel shame', "don't judge", 'judge me', 'you probably think',
  'i know this sounds', "i shouldn't say", 'between us', "i've been lying",
  'i pretend', 'fake', 'imposter', 'fraud', 'i act like',
  'i actually', 'honestly', 'truthfully', 'the truth is',
];

const INTIMACY_MARKERS = [
  'i feel', 'i felt', "i'm feeling", 'i think', 'i believe', 'i want', 'i need',
  'i love', 'i hate', 'i miss', 'i wish', 'i hope', 'i fear', 'i regret',
  'my girlfriend', 'my boyfriend', 'my partner', 'my ex', 'my mum', 'my dad',
  'my friend', 'my boss', 'my family', 'my brother', 'my sister',
  'relationship', 'breakup', 'argument', 'fight', 'crying', 'cried',
];

const LIFE_EVENT_SIGNALS: Record<string, { keywords: string[]; label: string; severity: 'low' | 'medium' | 'high' }> = {
  job_loss: {
    keywords: ['fired', 'made redundant', 'lost my job', 'laid off', 'let go', 'got sacked', 'dismissal', 'unemployed'],
    label: 'Possible job loss',
    severity: 'high',
  },
  job_search: {
    keywords: ['job application', 'interview', 'cv', 'cover letter', 'job hunting', 'applying for', 'rejection', 'job search'],
    label: 'Job seeking period',
    severity: 'medium',
  },
  relationship_end: {
    keywords: ['broke up', 'breakup', 'she left', 'he left', 'ended things', 'split up', 'separation', 'divorce', 'blocked me', 'ghosted'],
    label: 'Relationship breakdown',
    severity: 'high',
  },
  financial_distress: {
    keywords: ['debt', 'loan', 'overdraft', "can't pay", "can't afford", 'credit card', 'bailiff', 'eviction', 'going broke', 'in debt', 'owe money'],
    label: 'Financial distress',
    severity: 'high',
  },
  mental_health: {
    keywords: ['depression', 'depressed', 'antidepressant', 'therapy', 'therapist', 'counselling', 'mental health', 'suicidal', 'self harm', 'breakdown', 'psychiatric'],
    label: 'Mental health disclosure',
    severity: 'high',
  },
  health_concern: {
    keywords: ['diagnosis', 'symptoms', 'doctor', 'hospital', 'medication', 'prescription', 'ill', 'sick', 'pain', 'test results', 'scan', 'operation'],
    label: 'Health concern',
    severity: 'medium',
  },
  bereavement: {
    keywords: ['died', 'death', 'funeral', 'passed away', 'grieving', 'grief', 'lost someone', 'bereavement', 'suicide', 'overdose'],
    label: 'Bereavement or loss',
    severity: 'high',
  },
  identity_crisis: {
    keywords: ['who am i', 'what do i want', 'purpose', 'lost myself', 'dont know who i am', 'identity', 'existential', 'meaning', 'pointless', 'what is the point'],
    label: 'Identity questioning',
    severity: 'medium',
  },
};

const COMMERCIAL_SEGMENT_RULES: {
  id: string;
  label: string;
  description: string;
  test: (msgs: ScoredMessage[]) => { confidence: number; evidence: string };
  adCategories: string[];
}[] = [
  {
    id: 'financially_distressed',
    label: 'Financially distressed consumer',
    description: 'High-propensity for financial product advertising. Elevated response to payday lending, debt consolidation, BNPL.',
    adCategories: ['Payday loans', 'Debt consolidation', 'Buy now pay later', 'Bad credit mortgages', 'Gambling'],
    test: (msgs) => {
      const hits = msgs.filter(m => m.detectedSegments.includes('financial_distress'));
      const confidence = Math.min(95, hits.length * 12);
      const evidence = hits.length > 0 ? `${hits.length} messages contain financial distress signals` : '';
      return { confidence, evidence };
    },
  },
  {
    id: 'mental_health_seeker',
    label: 'Mental health help-seeker',
    description: 'Actively seeking emotional support. High-value for therapy platforms, wellness apps, pharmaceutical advertising.',
    adCategories: ['Online therapy', 'Antidepressants', 'Meditation apps', 'Sleep aids', 'Alcohol/substance'],
    test: (msgs) => {
      const hits = msgs.filter(m => m.detectedSegments.includes('mental_health'));
      const highAnxiety = msgs.filter(m => m.anxietyScore > 6).length;
      const confidence = Math.min(95, hits.length * 15 + highAnxiety * 3);
      const evidence = confidence > 10 ? `${hits.length} mental health disclosures, ${highAnxiety} high-anxiety messages` : '';
      return { confidence, evidence };
    },
  },
  {
    id: 'relationship_unstable',
    label: 'Relationship instability signal',
    description: 'Pattern of relationship processing and emotional volatility. High-value for dating apps, relationship counselling.',
    adCategories: ['Dating apps', 'Relationship coaching', 'Self-help books', 'Therapy platforms'],
    test: (msgs) => {
      const hits = msgs.filter(m =>
        m.detectedSegments.includes('relationship_end') ||
        m.text.toLowerCase().includes('ex') ||
        m.text.toLowerCase().includes('relationship')
      );
      const confidence = Math.min(90, hits.length * 5);
      const evidence = hits.length > 3 ? `${hits.length} relationship-related messages detected` : '';
      return { confidence, evidence };
    },
  },
  {
    id: 'career_transition',
    label: 'Career transition / job seeker',
    description: 'Active job search signals. High-value for LinkedIn Premium, recruiter platforms, career coaching.',
    adCategories: ['LinkedIn Premium', 'Indeed', 'CV writing services', 'Career coaching', 'Online courses'],
    test: (msgs) => {
      const hits = msgs.filter(m =>
        m.detectedSegments.includes('job_search') || m.detectedSegments.includes('job_loss')
      );
      const confidence = Math.min(90, hits.length * 10);
      const evidence = hits.length > 2 ? `${hits.length} career/employment signals detected` : '';
      return { confidence, evidence };
    },
  },
  {
    id: 'night_owl_high_value',
    label: 'Late-night high-engagement user',
    description: 'Disproportionate activity between midnight and 5am. Impulse purchase susceptibility elevated. Prime window for subscription conversion.',
    adCategories: ['Subscription services', 'Food delivery', 'Gaming', 'Gambling', 'Alcohol delivery'],
    test: (msgs) => {
      const lateNight = msgs.filter(m => m.hour >= 0 && m.hour <= 5).length;
      const ratio = lateNight / msgs.length;
      const confidence = Math.min(95, Math.round(ratio * 300));
      const evidence = lateNight > 20 ? `${lateNight} messages sent between midnight and 5am` : '';
      return { confidence, evidence };
    },
  },
  {
    id: 'validation_dependent',
    label: 'Validation-dependent personality',
    description: 'Consistent pattern of seeking external approval. High susceptibility to social proof marketing, influencer advertising.',
    adCategories: ['Fashion/beauty', 'Social media premium', 'Self-improvement', 'Status products'],
    test: (msgs) => {
      const hits = msgs.filter(m => m.validationScore > 5);
      const confidence = Math.min(90, hits.length * 4);
      const evidence = hits.length > 5 ? `${hits.length} messages show validation-seeking patterns` : '';
      return { confidence, evidence };
    },
  },
];

// ============================================================================
// CORE EXTRACTION
// ============================================================================

export function extractMessages(rawJson: any[]): RawMessage[] {
  const messages: RawMessage[] = [];

  for (const convo of rawJson) {
    if (!convo.mapping) continue;
    const title = convo.title || 'Untitled';
    const conversationId = convo.conversation_id || convo.id || '';

    for (const nodeId of Object.keys(convo.mapping)) {
      const node = convo.mapping[nodeId];
      if (!node.message) continue;

      const msg = node.message;
      if (msg.author?.role !== 'user') continue;
      if (msg.content?.content_type !== 'text') continue;

      const parts = msg.content?.parts;
      if (!parts || !parts[0]) continue;

      const text = String(parts[0]).trim();
      if (!text || text.length < 3) continue;

      const ts = msg.create_time;
      if (!ts) continue;

      messages.push({
        text,
        timestamp: ts,
        conversationTitle: title,
        conversationId,
      });
    }
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

// ============================================================================
// SCORING
// ============================================================================

function scoreMessage(msg: RawMessage): ScoredMessage {
  const text = msg.text.toLowerCase();
  const wordCount = msg.text.split(/\s+/).length;
  const d = new Date(msg.timestamp * 1000);
  const hour = d.getHours();
  const dayOfWeek = d.getDay();

  const weekNum = getWeekNumber(d);
  const weekKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  // Intimacy score (0-10)
  let intimacy = 0;
  for (const marker of INTIMACY_MARKERS) {
    if (text.includes(marker)) intimacy += 1;
  }
  // First-person usage
  const firstPersonCount = (text.match(/\b(i|i'm|i've|i'd|i'll|my|me|myself)\b/g) || []).length;
  intimacy += Math.min(3, firstPersonCount * 0.3);
  // Length bonus
  if (wordCount > 50) intimacy += 1;
  if (wordCount > 100) intimacy += 1;
  intimacy = Math.min(10, intimacy);

  // Anxiety score (0-10)
  let anxiety = 0;
  for (const word of ANXIETY_LEXICON) {
    if (text.includes(word)) anxiety += 1.5;
  }
  // Punctuation signals
  if ((text.match(/\?/g) || []).length > 3) anxiety += 0.5;
  if (text.includes('!!!') || text.includes('...')) anxiety += 0.5;
  // Hour of day modifier
  if (hour >= 1 && hour <= 4) anxiety += 1;
  anxiety = Math.min(10, anxiety);

  // Validation score (0-10)
  let validation = 0;
  for (const phrase of VALIDATION_LEXICON) {
    if (text.includes(phrase)) validation += 2;
  }
  if (text.includes('should i') || text.includes('would you')) validation += 1;
  validation = Math.min(10, validation);

  // Confessional score (0-10)
  let confessional = 0;
  for (const phrase of CONFESSIONAL_LEXICON) {
    if (text.includes(phrase)) confessional += 2;
  }
  confessional = Math.min(10, confessional);

  // Message type classification
  let messageType: ScoredMessage['messageType'] = 'factual';
  if (confessional > 3) {
    messageType = 'confessional';
  } else if (anxiety > 4 && intimacy > 3) {
    messageType = 'emotional';
  } else if (validation > 3) {
    messageType = 'validation';
  } else if (intimacy > 2 || firstPersonCount > 5) {
    messageType = 'practical';
  }

  // Commercial segments from this message
  const detectedSegments: string[] = [];
  for (const [eventId, config] of Object.entries(LIFE_EVENT_SIGNALS)) {
    for (const keyword of config.keywords) {
      if (text.includes(keyword)) {
        if (!detectedSegments.includes(eventId)) detectedSegments.push(eventId);
        break;
      }
    }
  }

  // Life event signals
  const lifeEventSignals: string[] = [...detectedSegments];

  return {
    ...msg,
    hour,
    dayOfWeek,
    weekKey,
    monthKey,
    charCount: msg.text.length,
    wordCount,
    intimacyScore: Math.round(intimacy * 10) / 10,
    anxietyScore: Math.round(anxiety * 10) / 10,
    validationScore: Math.round(validation * 10) / 10,
    confessionalScore: Math.round(confessional * 10) / 10,
    messageType,
    detectedSegments,
    lifeEventSignals,
  };
}

// ============================================================================
// TIMELINE ANALYSIS
// ============================================================================

function buildEmotionalTimeline(messages: ScoredMessage[]): EmotionalTimeline {
  const weekMap = new Map<string, ScoredMessage[]>();

  for (const msg of messages) {
    const existing = weekMap.get(msg.weekKey) || [];
    existing.push(msg);
    weekMap.set(msg.weekKey, existing);
  }

  const allWeekKeys = Array.from(weekMap.keys()).sort();
  const globalAvgMessages = messages.length / Math.max(allWeekKeys.length, 1);

  const weeks: WeekStats[] = allWeekKeys.map(weekKey => {
    const weekMsgs = weekMap.get(weekKey)!;
    const lateNight = weekMsgs.filter(m => m.hour >= 0 && m.hour <= 4).length;
    const avgIntimacy = weekMsgs.reduce((s, m) => s + m.intimacyScore, 0) / weekMsgs.length;
    const avgAnxiety = weekMsgs.reduce((s, m) => s + m.anxietyScore, 0) / weekMsgs.length;

    // Dominant topic from titles
    const titleWords = weekMsgs.flatMap(m =>
      m.conversationTitle.toLowerCase().split(/\s+/)
        .filter(w => w.length > 4 && !['with', 'from', 'that', 'this', 'what', 'when', 'where', 'about', 'help', 'like', 'just', 'have', 'your'].includes(w))
    );
    const wordFreq = titleWords.reduce((acc, w) => { acc[w] = (acc[w] || 0) + 1; return acc; }, {} as Record<string, number>);
    const dominantTopic = Object.entries(wordFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    // Crisis flag: high volume + high anxiety + late night
    const crisisFlag = weekMsgs.length > globalAvgMessages * 2.5 && (avgAnxiety > 3 || lateNight > weekMsgs.length * 0.3);

    return {
      weekKey,
      startDate: getWeekStart(weekKey),
      messageCount: weekMsgs.length,
      avgIntimacy,
      avgAnxiety,
      lateNightCount: lateNight,
      dominantTopic,
      crisisFlag,
    };
  });

  // Find crisis periods (consecutive crisis weeks)
  const crisisPeriods: { start: string; end: string; peakWeek: string }[] = [];
  let inCrisis = false;
  let crisisStart = '';
  let peakWeek = '';
  let peakCount = 0;

  for (const week of weeks) {
    if (week.crisisFlag) {
      if (!inCrisis) { inCrisis = true; crisisStart = week.weekKey; peakCount = 0; }
      if (week.messageCount > peakCount) { peakCount = week.messageCount; peakWeek = week.weekKey; }
    } else if (inCrisis) {
      crisisPeriods.push({ start: crisisStart, end: week.weekKey, peakWeek });
      inCrisis = false;
    }
  }
  if (inCrisis) crisisPeriods.push({ start: crisisStart, end: weeks[weeks.length - 1]?.weekKey || '', peakWeek });

  const peakAnxietyWeek = weeks.reduce((a, b) => a.avgAnxiety > b.avgAnxiety ? a : b, weeks[0]) || null;
  const highVolumeWeeks = weeks.filter(w => w.messageCount > globalAvgMessages * 2).sort((a, b) => b.messageCount - a.messageCount).slice(0, 5);

  // Trend analysis: compare first and last 25%
  const quarter = Math.floor(weeks.length / 4);
  const earlyWeeks = weeks.slice(0, quarter);
  const recentWeeks = weeks.slice(-quarter);

  const earlyAvgAnxiety = earlyWeeks.reduce((s, w) => s + w.avgAnxiety, 0) / Math.max(earlyWeeks.length, 1);
  const recentAvgAnxiety = recentWeeks.reduce((s, w) => s + w.avgAnxiety, 0) / Math.max(recentWeeks.length, 1);
  const diff = recentAvgAnxiety - earlyAvgAnxiety;

  const emotionalTrend: EmotionalTimeline['emotionalTrend'] =
    crisisPeriods.length > 2 ? 'volatile' :
    diff > 1 ? 'worsening' :
    diff < -1 ? 'improving' : 'stable';

  return { weeks, peakAnxietyWeek, highVolumeWeeks, emotionalTrend, crisisPeriods };
}

// ============================================================================
// LIFE EVENTS
// ============================================================================

function detectLifeEvents(messages: ScoredMessage[]): LifeEvent[] {
  const events: LifeEvent[] = [];

  for (const [eventId, config] of Object.entries(LIFE_EVENT_SIGNALS)) {
    const hits = messages.filter(m => m.detectedSegments.includes(eventId));
    if (hits.length === 0) continue;

    // Find the approximate date (median timestamp of hits)
    const sortedHits = hits.sort((a, b) => a.timestamp - b.timestamp);
    const medianHit = sortedHits[Math.floor(sortedHits.length / 2)];
    const approxDate = new Date(medianHit.timestamp * 1000).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const evidence = sortedHits.slice(0, 3).map(m => `"${m.text.substring(0, 80)}..."` );

    events.push({
      type: eventId,
      label: config.label,
      approximateDate: approxDate,
      evidence,
      severity: config.severity,
    });
  }

  return events.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// ============================================================================
// DEPENDENCY ANALYSIS
// ============================================================================

function analyseDependency(messages: ScoredMessage[]): DependencyProfile {
  if (messages.length < 4) {
    return {
      firstMessageDate: new Date(),
      daysSinceFirst: 0,
      messagesPerWeekEarly: 0,
      messagesPerWeekRecent: 0,
      trajectory: 'stable',
      avgLengthEarly: 0,
      avgLengthRecent: 0,
      intimacyTrajectory: 'stable',
      dependencyScore: 0,
    };
  }

  const firstMessageDate = new Date(messages[0].timestamp * 1000);
  const lastDate = new Date(messages[messages.length - 1].timestamp * 1000);
  const daysSinceFirst = Math.round((lastDate.getTime() - firstMessageDate.getTime()) / (1000 * 60 * 60 * 24));

  const quarter = Math.floor(messages.length / 4);
  const earlyMsgs = messages.slice(0, quarter);
  const recentMsgs = messages.slice(-quarter);

  // Messages per week
  const earlyDays = Math.max(1, (new Date(earlyMsgs[earlyMsgs.length - 1].timestamp * 1000).getTime() - new Date(earlyMsgs[0].timestamp * 1000).getTime()) / (1000 * 60 * 60 * 24));
  const recentDays = Math.max(1, (new Date(recentMsgs[recentMsgs.length - 1].timestamp * 1000).getTime() - new Date(recentMsgs[0].timestamp * 1000).getTime()) / (1000 * 60 * 60 * 24));

  const messagesPerWeekEarly = (earlyMsgs.length / earlyDays) * 7;
  const messagesPerWeekRecent = (recentMsgs.length / recentDays) * 7;

  const trajectory: DependencyProfile['trajectory'] =
    messagesPerWeekRecent > messagesPerWeekEarly * 1.5 ? 'increasing' :
    messagesPerWeekRecent < messagesPerWeekEarly * 0.6 ? 'decreasing' : 'stable';

  const avgLengthEarly = earlyMsgs.reduce((s, m) => s + m.charCount, 0) / earlyMsgs.length;
  const avgLengthRecent = recentMsgs.reduce((s, m) => s + m.charCount, 0) / recentMsgs.length;

  const avgIntimacyEarly = earlyMsgs.reduce((s, m) => s + m.intimacyScore, 0) / earlyMsgs.length;
  const avgIntimacyRecent = recentMsgs.reduce((s, m) => s + m.intimacyScore, 0) / recentMsgs.length;

  const intimacyTrajectory: DependencyProfile['intimacyTrajectory'] =
    avgIntimacyRecent > avgIntimacyEarly + 1 ? 'increasing' :
    avgIntimacyRecent < avgIntimacyEarly - 1 ? 'decreasing' : 'stable';

  // Dependency score: combination of trajectory, duration, intimacy escalation
  let dependencyScore = 0;
  dependencyScore += Math.min(30, daysSinceFirst / 12); // up to 30 for 365+ days
  if (trajectory === 'increasing') dependencyScore += 30;
  else if (trajectory === 'stable') dependencyScore += 15;
  if (intimacyTrajectory === 'increasing') dependencyScore += 25;
  else if (intimacyTrajectory === 'stable') dependencyScore += 10;
  dependencyScore += Math.min(15, (avgLengthRecent - avgLengthEarly) / 30);
  dependencyScore = Math.round(Math.min(100, Math.max(0, dependencyScore)));

  return {
    firstMessageDate,
    daysSinceFirst,
    messagesPerWeekEarly: Math.round(messagesPerWeekEarly * 10) / 10,
    messagesPerWeekRecent: Math.round(messagesPerWeekRecent * 10) / 10,
    trajectory,
    avgLengthEarly: Math.round(avgLengthEarly),
    avgLengthRecent: Math.round(avgLengthRecent),
    intimacyTrajectory,
    dependencyScore,
  };
}

// ============================================================================
// COMMERCIAL PROFILE
// ============================================================================

function buildCommercialProfile(messages: ScoredMessage[]): CommercialProfile {
  const segments = COMMERCIAL_SEGMENT_RULES
    .map(rule => {
      const result = rule.test(messages);
      if (result.confidence < 15) return null;
      return {
        id: rule.id,
        label: rule.label,
        description: rule.description,
        confidence: result.confidence,
        evidence: result.evidence,
        adCategories: rule.adCategories,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.confidence - a!.confidence) as CommercialProfile['segments'];

  const topScore = segments[0]?.confidence || 0;
  const overallValue: CommercialProfile['overallValue'] =
    topScore >= 70 ? 'premium' :
    topScore >= 40 ? 'elevated' : 'standard';

  const primaryDriver = segments[0]?.label || 'General consumer';

  const vulnerabilityIndex = Math.round(
    Math.min(100, segments.reduce((s, seg) => s + seg.confidence, 0) / Math.max(segments.length, 1) * 1.2)
  );

  return { segments, overallValue, primaryDriver, vulnerabilityIndex };
}

// ============================================================================
// TOPIC PERIODS
// ============================================================================

function analyseTopicsByPeriod(messages: ScoredMessage[]): { early: string[]; mid: string[]; recent: string[] } {
  const third = Math.floor(messages.length / 3);
  const early = messages.slice(0, third);
  const mid = messages.slice(third, third * 2);
  const recent = messages.slice(third * 2);

  const topTopics = (msgs: ScoredMessage[]) => {
    const words = msgs.flatMap(m =>
      m.text.toLowerCase().split(/\s+/)
        .filter(w => w.length > 4 && !/^(that|this|what|when|where|about|help|like|just|have|your|would|could|should|don't|can't|won't|i've|i'm|i'll|i'd|there|their|these|those|which|while|being|been|will|from|with|into|than|then|them|they|some|here|more|also|does|well|very|much|said|such|only|over|most|even|both|back|time|know|need|feel|want|make|come|good|think|really|right|still|ever|going|first|after|before|again|always|never|every|something|anything|nothing|everyone|someone|somewhere)$/.test(w))
    );
    const freq = words.reduce((acc, w) => { acc[w] = (acc[w] || 0) + 1; return acc; }, {} as Record<string, number>);
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);
  };

  return {
    early: topTopics(early),
    mid: topTopics(mid),
    recent: topTopics(recent),
  };
}

// ============================================================================
// EXISTING ANALYSIS COMPATIBILITY LAYER
// Keep generating the shape the existing components expect
// ============================================================================

function buildCompatibilityLayer(messages: ScoredMessage[], rawMessages: RawMessage[]) {
  // Names (proper nouns that appear repeatedly)
  const namePattern = /\b([A-Z][a-z]{2,})\b/g;
  const nameCounts: Record<string, number> = {};
  const nameContexts: Record<string, string[]> = {};

  for (const msg of messages.slice(0, 200)) {
    const matches = msg.text.match(namePattern) || [];
    for (const name of matches) {
      if (['The', 'This', 'That', 'What', 'When', 'Where', 'How', 'Why', 'Can', 'Could', 'Would', 'Should', 'Have', 'Has', 'Does', 'Did', 'Will', 'Was', 'Were', 'Are', 'Is', 'It', 'He', 'She', 'We', 'You', 'They', 'But', 'And', 'For', 'Not', 'So', 'Do', 'To', 'In', 'On', 'At', 'By', 'Or', 'If', 'Up', 'Out', 'My', 'Me', 'Be', 'As', 'An', 'A', 'I', 'ChatGPT', 'AI', 'Ok', 'Yes', 'No', 'Ok', 'Just'].includes(name)) continue;
      nameCounts[name] = (nameCounts[name] || 0) + 1;
      if (!nameContexts[name]) nameContexts[name] = [];
      if (nameContexts[name].length < 2) nameContexts[name].push(msg.text.substring(0, 100));
    }
  }

  const names = Object.entries(nameCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, mentions]) => ({
      name,
      mentions,
      contexts: nameContexts[name] || [],
      relationship: inferRelationship(name, messages),
    }));

  // Locations
  const locationKeywords = ['leeds', 'london', 'manchester', 'birmingham', 'sheffield', 'york', 'nottingham', 'liverpool', 'bristol', 'edinburgh', 'glasgow', 'new york', 'paris', 'dubai', 'amsterdam'];
  const locationCounts: Record<string, number> = {};
  for (const msg of messages) {
    const t = msg.text.toLowerCase();
    for (const loc of locationKeywords) {
      if (t.includes(loc)) locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    }
  }
  const locations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([location, mentions]) => ({
      location: location.charAt(0).toUpperCase() + location.slice(1),
      mentions,
      type: mentions > 20 ? 'lives' as const : 'mentions' as const,
    }));

  // Sensitive topics
  const sensitiveMessages = messages
    .filter(m => m.confessionalScore > 2 || m.anxietyScore > 5 || m.detectedSegments.length > 0)
    .slice(0, 15)
    .map(m => ({
      topic: m.messageType,
      category: m.detectedSegments[0] || (m.anxietyScore > 5 ? 'mental_health' : 'personal'),
      timestamp: new Date(m.timestamp * 1000).toISOString(),
      excerpt: m.text.substring(0, 200),
    }));

  // Vulnerability patterns
  const hourBuckets = [
    { timeOfDay: 'Late Night (12am-6am)', range: [0, 5] },
    { timeOfDay: 'Morning (6am-12pm)', range: [6, 11] },
    { timeOfDay: 'Afternoon (12pm-6pm)', range: [12, 17] },
    { timeOfDay: 'Evening (6pm-12am)', range: [18, 23] },
  ];

  const vulnerabilityPatterns = hourBuckets.map(bucket => {
    const bucketMsgs = messages.filter(m => m.hour >= bucket.range[0] && m.hour <= bucket.range[1]);
    const avgAnxiety = bucketMsgs.reduce((s, m) => s + m.anxietyScore, 0) / Math.max(bucketMsgs.length, 1);
    const avgIntimacy = bucketMsgs.reduce((s, m) => s + m.intimacyScore, 0) / Math.max(bucketMsgs.length, 1);
    const confessionalCount = bucketMsgs.filter(m => m.messageType === 'confessional').length;

    return {
      timeOfDay: bucket.timeOfDay,
      messageCount: bucketMsgs.length,
      frequency: bucketMsgs.length,
      avgAnxiety,
      avgIntimacy,
      confessionalCount,
      emotionalTone: avgAnxiety > 5 ? 'acute distress' :
        avgAnxiety > 3 ? 'elevated anxiety' :
        avgIntimacy > 4 ? 'emotional processing' :
        confessionalCount > 3 ? 'confessional mode' :
        bucketMsgs.length > messages.length / 4 ? 'high engagement' : 'routine queries',
    };
  }).sort((a, b) => b.messageCount - a.messageCount);

  // Themes
  const themeKeywords = [
    'work', 'job', 'project', 'money', 'relationship', 'health', 'study', 'family',
    'anxiety', 'future', 'friend', 'help', 'life', 'love', 'time', 'problem',
  ];
  const repetitiveThemes = themeKeywords
    .map(theme => {
      const count = messages.filter(m => m.text.toLowerCase().includes(theme)).length;
      return { theme, mentions: count, count, obsessionLevel: Math.min(10, count / 10) };
    })
    .filter(t => t.count > 5)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Juiciest moments
  const juiciestMoments = messages
    .filter(m => m.confessionalScore > 0 || m.anxietyScore > 4 || m.intimacyScore > 5)
    .sort((a, b) => (b.confessionalScore + b.anxietyScore + b.intimacyScore) - (a.confessionalScore + a.anxietyScore + a.intimacyScore))
    .slice(0, 10)
    .map(m => ({
      timestamp: new Date(m.timestamp * 1000).toISOString(),
      excerpt: m.text.substring(0, 300),
      juiceScore: Math.min(10, Math.round((m.confessionalScore + m.anxietyScore + m.intimacyScore) / 3)),
      reason: [
        m.hour >= 0 && m.hour <= 4 ? 'late_night' : null,
        m.anxietyScore > 4 ? 'emotional' : null,
        m.confessionalScore > 3 ? 'intimate' : null,
        m.detectedSegments.includes('relationship_end') ? 'relationship' : null,
        m.detectedSegments.includes('mental_health') ? 'mental_health' : null,
        m.detectedSegments.includes('financial_distress') ? 'desperate' : null,
      ].filter(Boolean).join(', '),
    }));

  return { names, locations, sensitiveMessages, vulnerabilityPatterns, repetitiveThemes, juiciestMoments };
}

function inferRelationship(name: string, messages: ScoredMessage[]): string | undefined {
  const contexts = messages
    .filter(m => m.text.includes(name))
    .map(m => m.text.toLowerCase())
    .join(' ');

  if (contexts.includes(`my girlfriend ${name.toLowerCase()}`) || contexts.includes(`girlfriend ${name.toLowerCase()}`)) return 'girlfriend';
  if (contexts.includes(`my boyfriend ${name.toLowerCase()}`) || contexts.includes(`boyfriend ${name.toLowerCase()}`)) return 'boyfriend';
  if (contexts.includes(`my ex ${name.toLowerCase()}`) || contexts.includes(`ex ${name.toLowerCase()}`)) return 'ex';
  if (contexts.includes(`my mum`) || contexts.includes(`my mom`) || contexts.includes(`my mother`)) return 'mother';
  if (contexts.includes(`my dad`) || contexts.includes(`my father`)) return 'father';
  if (contexts.includes(`my brother`)) return 'brother';
  if (contexts.includes(`my sister`)) return 'sister';
  if (contexts.includes(`my boss`)) return 'boss';
  if (contexts.includes(`my friend ${name.toLowerCase()}`) || contexts.includes(`friend ${name.toLowerCase()}`)) return 'friend';
  return undefined;
}

// ============================================================================
// PRIVACY SCORE
// ============================================================================

function computePrivacyScore(
  messages: ScoredMessage[],
  lifeEvents: LifeEvent[],
  commercial: CommercialProfile,
  dependency: DependencyProfile,
): number {
  let score = 0;

  // Life events (high severity = high score)
  score += lifeEvents.filter(e => e.severity === 'high').length * 12;
  score += lifeEvents.filter(e => e.severity === 'medium').length * 6;

  // Commercial segments
  score += Math.min(30, commercial.segments.reduce((s, seg) => s + seg.confidence / 10, 0));

  // Dependency
  score += dependency.dependencyScore * 0.25;

  // Sensitive messages
  const confessionalCount = messages.filter(m => m.confessionalScore > 3).length;
  const highAnxietyCount = messages.filter(m => m.anxietyScore > 6).length;
  score += Math.min(20, confessionalCount * 2 + highAnxietyCount);

  // Volume and duration
  if (messages.length > 2000) score += 10;
  if (messages.length > 5000) score += 5;

  return Math.round(Math.min(100, Math.max(0, score)));
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function analyzeDeep(rawJson: any[]): DeepAnalysis {
  const rawMessages = extractMessages(rawJson);
  const messages = rawMessages.map(scoreMessage);

  if (messages.length === 0) {
    throw new Error('No user messages found in export');
  }

  const firstDate = new Date(messages[0].timestamp * 1000);
  const lastDate = new Date(messages[messages.length - 1].timestamp * 1000);
  const days = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

  // Hour distribution
  const hourDistribution = Array(24).fill(0);
  const dayDistribution = Array(7).fill(0);
  for (const msg of messages) {
    hourDistribution[msg.hour]++;
    dayDistribution[msg.dayOfWeek]++;
  }

  const peakHour = hourDistribution.indexOf(Math.max(...hourDistribution));
  const nighttimeCount = messages.filter(m => m.hour >= 0 && m.hour <= 4).length;
  const nighttimeRatio = nighttimeCount / messages.length;

  const mostVulnerableHour = messages
    .filter(m => m.anxietyScore > 4)
    .reduce((acc, m) => {
      acc[m.hour] = (acc[m.hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  const topVulnerableHour = Object.entries(mostVulnerableHour).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  const avgIntimacy = messages.reduce((s, m) => s + m.intimacyScore, 0) / messages.length;
  const avgAnxiety = messages.reduce((s, m) => s + m.anxietyScore, 0) / messages.length;

  const emotionalTimeline = buildEmotionalTimeline(messages);
  const lifeEvents = detectLifeEvents(messages);
  const dependency = analyseDependency(messages);
  const commercialProfile = buildCommercialProfile(messages);
  const topicsByPeriod = analyseTopicsByPeriod(messages);

  const typeBreakdown = messages.reduce((acc, m) => {
    acc[m.messageType] = (acc[m.messageType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const privacyScore = computePrivacyScore(messages, lifeEvents, commercialProfile, dependency);

  const compat = buildCompatibilityLayer(messages, rawMessages);

  const mostVulnerablePeriod = ['Late night (12am-4am)', 'Early morning (5am-8am)', 'Evening (6pm-10pm)', 'Afternoon (12pm-5pm)'][
    [[0, 4], [5, 8], [18, 22], [12, 17]].findIndex(([start, end]) =>
      messages.filter(m => m.hour >= start && m.hour <= end).reduce((s, m) => s + m.anxietyScore, 0) ===
      Math.max(
        ...[[[0, 4], [5, 8], [18, 22], [12, 17]].map(([start, end]) =>
          messages.filter(m => m.hour >= start && m.hour <= end).reduce((s, m) => s + m.anxietyScore, 0)
        )].flat()
      )
    )
  ] || 'Evening';

  return {
    messages,
    totalUserMessages: messages.length,
    timespan: { first: firstDate, last: lastDate, days },
    hourDistribution,
    dayDistribution,
    peakHour,
    nighttimeRatio,
    emotionalTimeline,
    avgIntimacy: Math.round(avgIntimacy * 10) / 10,
    avgAnxiety: Math.round(avgAnxiety * 10) / 10,
    mostVulnerableHour: topVulnerableHour ? Number(topVulnerableHour[0]) : peakHour,
    mostVulnerablePeriod,
    lifeEvents,
    typeBreakdown,
    dependency,
    commercialProfile,
    topicsByPeriod,

    // Compatibility shape for existing components
    privacyScore,
    findings: {
      personalInfo: {
        names: compat.names,
        locations: compat.locations,
        ages: [],
        emails: [],
        phoneNumbers: [],
        relationships: Array.from(new Set(
          messages.flatMap(m => {
            const t = m.text.toLowerCase();
            return ['girlfriend', 'boyfriend', 'partner', 'ex', 'mum', 'dad', 'brother', 'sister', 'boss', 'friend', 'son', 'daughter'].filter(r => t.includes(r));
          })
        )).slice(0, 8),
        workInfo: Array.from(new Set(
          messages.flatMap(m => {
            const t = m.text.toLowerCase();
            return ['youtuber', 'freelancer', 'developer', 'teacher', 'nurse', 'student', 'manager', 'designer'].filter(r => t.includes(r));
          })
        )).slice(0, 4),
      },
      sensitiveTopics: compat.sensitiveMessages,
      vulnerabilityPatterns: compat.vulnerabilityPatterns,
      temporalInsights: [],
      repetitiveThemes: compat.repetitiveThemes,
    },
    juiciestMoments: compat.juiciestMoments,
    rawStats: {
      totalMessages: rawMessages.length * 2, // approx including assistant
      userMessages: messages.length,
      timeSpan: days > 365 ? `${Math.round(days / 365 * 10) / 10} years` : `${days} days`,
      avgMessageLength: Math.round(messages.reduce((s, m) => s + m.charCount, 0) / messages.length),
    },
  };
}

// ============================================================================
// UTILS
// ============================================================================

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekStart(weekKey: string): Date {
  const [year, week] = weekKey.split('-W').map(Number);
  const d = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = d.getDay();
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
