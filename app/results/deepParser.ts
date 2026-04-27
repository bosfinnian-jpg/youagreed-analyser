// ============================================================================
// DEEP PARSER v2 - behavioural inference from conversation exports
// Extracts genuine signal, not keyword counts.
// ============================================================================

export interface RawMessage {
  text: string;
  timestamp: number;
  conversationTitle: string;
  conversationId: string;
}

export interface ScoredMessage extends RawMessage {
  hour: number;
  dayOfWeek: number;
  weekKey: string;
  monthKey: string;
  charCount: number;
  wordCount: number;
  intimacyScore: number;
  anxietyScore: number;
  validationScore: number;
  confessionalScore: number;
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
    confidence: number;
    evidence: string;
    adCategories: string[];
  }[];
  overallValue: 'standard' | 'elevated' | 'premium';
  primaryDriver: string;
  vulnerabilityIndex: number;
}

export interface DependencyProfile {
  firstMessageDate: Date;
  daysSinceFirst: number;
  messagesPerWeekEarly: number;
  messagesPerWeekRecent: number;
  trajectory: 'increasing' | 'stable' | 'decreasing';
  avgLengthEarly: number;
  avgLengthRecent: number;
  intimacyTrajectory: 'increasing' | 'stable' | 'decreasing';
  dependencyScore: number;
}

export interface EmotionalTimeline {
  weeks: WeekStats[];
  peakAnxietyWeek: WeekStats | null;
  highVolumeWeeks: WeekStats[];
  emotionalTrend: 'improving' | 'worsening' | 'stable' | 'volatile';
  crisisPeriods: { start: string; end: string; peakWeek: string }[];
}

// Psychological portrait - the new addition
export interface PsychologicalPortrait {
  attachmentStyle: string | null;           // anxious / avoidant / secure / disorganised
  communicationPattern: string | null;      // descriptor phrase
  primaryCopingMechanism: string | null;
  emotionalBaselineLabel: string;           // "Chronically anxious", "Emotionally stable" etc
  selfPerceptionThemes: string[];           // ["imposter syndrome", "perfectionism"] etc
  relationshipDynamics: string | null;      // brief inference
  dominantNarrative: string | null;         // what story they tell about themselves
  writingVoice: string | null;              // how they write - terse/verbose/analytical etc
  generatedAt: number;
}

export interface DeepAnalysis {
  messages: ScoredMessage[];
  totalUserMessages: number;
  timespan: { first: Date; last: Date; days: number };

  hourDistribution: number[];
  dayDistribution: number[];
  peakHour: number;
  nighttimeRatio: number;

  emotionalTimeline: EmotionalTimeline;
  avgIntimacy: number;
  avgAnxiety: number;
  mostVulnerableHour: number;
  mostVulnerablePeriod: string;

  lifeEvents: LifeEvent[];
  typeBreakdown: Record<string, number>;
  dependency: DependencyProfile;
  commercialProfile: CommercialProfile;
  psychologicalPortrait: PsychologicalPortrait;

  topicsByPeriod: { early: string[]; mid: string[]; recent: string[] };

  rawStats: {
    totalMessages: number;
    userMessages: number;
    timeSpan: string;
    avgMessageLength: number;
  };

  privacyScore: number;
  findings: any;
  juiciestMoments: any[];
  synthesis?: {
    characterSummary: string;
    demographicPredictions: Array<{ attribute: string; value: string; confidence: number; evidence: string }>;
    verbalTells: Array<{ tell: string; meaning: string; frequency: string }>;
    predictedBehaviours: Array<{ behaviour: string; likelihood: string; evidence: string }>;
    commercialTargets: Array<{ brand: string; category: string; why: string }>;
    recurringConcerns: Array<{ concern: string; evidence: string }>;
    unintentionalDisclosures: Array<{ disclosure: string; via: string }>;
    inferredCoreBeliefs: string[];
    generatedAt: number;
  };
}

// ============================================================================
// LEXICONS - expanded and more precise
// ============================================================================

const ANXIETY_LEXICON = [
  'worried', 'worry', 'worrying', 'anxious', 'anxiety', 'scared', 'afraid', 'fear', 'panic',
  'overwhelmed', 'stressed', 'stress', "can't cope", "can't deal", "don't know what to do",
  "don't know what to think", 'helpless', 'hopeless', 'desperate', 'terrified',
  'nervous', 'dread', 'dreading', 'freaking out', 'losing it', 'breakdown',
  'spiralling', 'spiraling', 'intrusive thoughts', 'obsessing', 'cant stop thinking',
  'heart racing', 'chest tight', 'cant breathe', 'shaking', 'dissociat',
  'triggered', 'having a panic', 'freezing up', 'shutting down',
];

const VALIDATION_LEXICON = [
  'is it okay', 'is that okay', 'am i wrong', 'am i being', 'do you think i should',
  'what do you think', 'should i be', 'is it normal', 'is this normal', 'does that make sense',
  'am i overreacting', 'am i overthinking', 'tell me honestly', 'be honest with me',
  'what would you do', 'what should i do', "i don't know if", 'do i have a right',
  'am i a bad', 'am i terrible', "i hope that's okay", 'is that weird', 'do i seem',
  'am i crazy', 'am i being unreasonable', 'would you say i', 'does this make me',
  'is it bad that', 'please be honest', 'honestly though',
];

const CONFESSIONAL_LEXICON = [
  "i've never told", "i haven't told", 'nobody knows', 'no one knows', 'i keep this',
  "i haven't spoken", "i've been hiding", 'ashamed', 'embarrassed to admit',
  'i feel guilty', 'i feel shame', "don't judge", 'judge me',
  "i know this sounds", "i shouldn't say", 'between us', "i've been lying",
  'i pretend', 'imposter', 'fraud', 'i act like', 'the truth is', 'honestly though',
  "i've never admitted", 'i can finally say', 'telling you this', 'hard to say',
  'difficult to admit', "haven't told anyone", 'confess', 'confession',
];

const INTIMACY_MARKERS = [
  'i feel', 'i felt', "i'm feeling", 'i think', 'i believe', 'i want', 'i need',
  'i love', 'i hate', 'i miss', 'i wish', 'i hope', 'i fear', 'i regret',
  'my girlfriend', 'my boyfriend', 'my partner', 'my ex', 'my mum', 'my mom',
  'my dad', 'my father', 'my mother', 'my friend', 'my boss', 'my family',
  'my brother', 'my sister', 'my son', 'my daughter', 'my therapist', 'my doctor',
  'relationship', 'breakup', 'broke up', 'argument', 'fight', 'crying', 'cried',
  'in love', 'falling for', 'attachment',
];

// Psychological pattern markers - new
const ATTACHMENT_ANXIOUS = [
  'they haven\'t replied', 'why aren\'t they texting', 'are they ignoring me',
  'do they still like me', 'i keep checking', 'i messaged again', 'read receipt',
  'left me on read', 'reassure me', 'are we okay', 'did i do something wrong',
  'they seem distant', 'clingy', 'desperate', 'they\'ll leave',
];

const ATTACHMENT_AVOIDANT = [
  'i need space', 'feeling smothered', 'too intense', 'back off',
  'i don\'t want to talk about it', 'i shut down', 'i pull away',
  'commitment scares me', 'i push people away', 'i go quiet',
  'i don\'t open up', 'i find it hard to connect',
];

const PERFECTIONISM_MARKERS = [
  'not good enough', 'should have done better', 'why can\'t i',
  'everyone else can', 'i always mess up', 'i\'m terrible at',
  'i hate myself for', 'i\'m so stupid', 'i keep failing',
  'i never get it right', 'i disappoint', 'ashamed of myself',
  'i expect too much of myself', 'my own worst enemy',
];

const IMPOSTER_MARKERS = [
  'don\'t deserve', 'feel like a fraud', 'feel like a fake',
  'people will find out', 'i got lucky', 'not as good as they think',
  'i\'m out of my depth', 'i don\'t belong', 'shouldn\'t be here',
  'punching above my weight', 'waiting to be found out',
];

const RUMINATION_MARKERS = [
  'keep thinking about', 'can\'t stop thinking', 'playing it over',
  'going round in my head', 'replaying', 'obsessing over',
  'can\'t let it go', 'it\'s all i think about', 'stuck on this',
  'thought about this for', 'weeks now', 'months now',
];

const LIFE_EVENT_SIGNALS: Record<string, { keywords: string[]; label: string; severity: 'low' | 'medium' | 'high' }> = {
  job_loss: {
    keywords: ['fired', 'made redundant', 'lost my job', 'laid off', 'let go', 'got sacked', 'dismissal', 'unemployed', 'out of work', 'lost my position'],
    label: 'Possible job loss', severity: 'high',
  },
  job_search: {
    keywords: ['job application', 'interview', 'cv', 'cover letter', 'job hunting', 'applying for', 'job search', 'looking for work', 'applications out'],
    label: 'Job seeking period', severity: 'medium',
  },
  relationship_end: {
    keywords: ['broke up', 'breakup', 'she left', 'he left', 'ended things', 'split up', 'separation', 'divorce', 'blocked me', 'ghosted', 'we\'re done', 'we broke up'],
    label: 'Relationship breakdown', severity: 'high',
  },
  financial_distress: {
    keywords: ['debt', 'loan', 'overdraft', "can't pay", "can't afford", 'credit card', 'bailiff', 'eviction', 'going broke', 'in debt', 'owe money', 'broke', 'no money', 'running out of money'],
    label: 'Financial distress', severity: 'high',
  },
  mental_health: {
    keywords: ['depression', 'depressed', 'antidepressant', 'therapy', 'therapist', 'counselling', 'mental health', 'suicidal', 'self harm', 'breakdown', 'psychiatric', 'medication for', 'on medication', 'seeing a therapist', 'started therapy'],
    label: 'Mental health disclosure', severity: 'high',
  },
  health_concern: {
    keywords: ['diagnosis', 'diagnosed with', 'symptoms', 'test results', 'scan', 'operation', 'hospital appointment', 'specialist', 'chronic', 'condition', 'ill', 'sick'],
    label: 'Health concern', severity: 'medium',
  },
  bereavement: {
    keywords: ['died', 'death', 'funeral', 'passed away', 'grieving', 'grief', 'lost someone', 'bereavement', 'lost my', 'he died', 'she died'],
    label: 'Bereavement or loss', severity: 'high',
  },
  identity_crisis: {
    keywords: ['who am i', 'what do i want', 'lost myself', 'dont know who i am', 'existential', 'meaning', 'pointless', 'what is the point', 'purpose in life', 'no direction'],
    label: 'Identity questioning', severity: 'medium',
  },
  moving_home: {
    keywords: ['moving house', 'moving flat', 'new place', 'flat hunting', 'landlord', 'eviction', 'new city', 'relocating', 'just moved'],
    label: 'Relocation or housing change', severity: 'low',
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
    description: 'High-propensity target for financial product advertising: payday lending, debt consolidation, BNPL.',
    adCategories: ['Payday loans', 'Debt consolidation', 'Buy now pay later', 'Bad credit mortgages', 'Gambling'],
    test: (msgs) => {
      const hits = msgs.filter(m => m.detectedSegments.includes('financial_distress'));
      const confidence = Math.min(95, hits.length * 12);
      return { confidence, evidence: hits.length > 0 ? `${hits.length} messages contain financial distress signals` : '' };
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
      return { confidence, evidence: confidence > 10 ? `${hits.length} mental health disclosures, ${highAnxiety} high-anxiety messages` : '' };
    },
  },
  {
    id: 'relationship_unstable',
    label: 'Relationship instability signal',
    description: 'Pattern of relationship processing. High-value for dating apps, relationship counselling platforms.',
    adCategories: ['Dating apps', 'Relationship coaching', 'Self-help books', 'Therapy platforms'],
    test: (msgs) => {
      const hits = msgs.filter(m =>
        m.detectedSegments.includes('relationship_end') ||
        m.text.toLowerCase().includes('my ex') ||
        ATTACHMENT_ANXIOUS.some(k => m.text.toLowerCase().includes(k))
      );
      const confidence = Math.min(90, hits.length * 5);
      return { confidence, evidence: hits.length > 3 ? `${hits.length} relationship-related messages detected` : '' };
    },
  },
  {
    id: 'career_transition',
    label: 'Career transition / job seeker',
    description: 'Active job search signals. High-value for LinkedIn Premium, recruiter platforms, career coaching.',
    adCategories: ['LinkedIn Premium', 'Indeed', 'CV writing services', 'Career coaching', 'Online courses'],
    test: (msgs) => {
      const hits = msgs.filter(m => m.detectedSegments.includes('job_search') || m.detectedSegments.includes('job_loss'));
      const confidence = Math.min(90, hits.length * 10);
      return { confidence, evidence: hits.length > 2 ? `${hits.length} career/employment signals detected` : '' };
    },
  },
  {
    id: 'night_owl_high_value',
    label: 'Late-night high-engagement user',
    description: 'Disproportionate activity between midnight and 5am. Impulse purchase susceptibility elevated.',
    adCategories: ['Subscription services', 'Food delivery', 'Gaming', 'Gambling', 'Alcohol delivery'],
    test: (msgs) => {
      const lateNight = msgs.filter(m => m.hour >= 0 && m.hour <= 5).length;
      const ratio = lateNight / msgs.length;
      const confidence = Math.min(95, Math.round(ratio * 300));
      return { confidence, evidence: lateNight > 20 ? `${lateNight} messages sent between midnight and 5am` : '' };
    },
  },
  {
    id: 'validation_dependent',
    label: 'Validation-dependent personality',
    description: 'Consistent pattern of seeking external approval. High susceptibility to social proof marketing.',
    adCategories: ['Fashion/beauty', 'Social media premium', 'Self-improvement', 'Status products'],
    test: (msgs) => {
      const hits = msgs.filter(m => m.validationScore > 5);
      const confidence = Math.min(90, hits.length * 4);
      return { confidence, evidence: hits.length > 5 ? `${hits.length} messages show validation-seeking patterns` : '' };
    },
  },
];

// ============================================================================
// MESSAGE EXTRACTION
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
      messages.push({ text, timestamp: ts, conversationTitle: title, conversationId });
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

  // Intimacy
  let intimacy = INTIMACY_MARKERS.filter(m => text.includes(m)).length;
  const firstPerson = (text.match(/\b(i|i'm|i've|i'd|i'll|my|me|myself)\b/g) || []).length;
  intimacy += Math.min(3, firstPerson * 0.3);
  if (wordCount > 50) intimacy += 1;
  if (wordCount > 120) intimacy += 1;
  intimacy = Math.min(10, intimacy);

  // Anxiety
  let anxiety = ANXIETY_LEXICON.filter(w => text.includes(w)).length * 1.5;
  if ((text.match(/\?/g) || []).length > 3) anxiety += 0.5;
  if (text.includes('!!!') || text.includes('...')) anxiety += 0.5;
  if (hour >= 1 && hour <= 4) anxiety += 1;
  anxiety = Math.min(10, anxiety);

  // Validation
  let validation = VALIDATION_LEXICON.filter(p => text.includes(p)).length * 2;
  if (text.includes('should i') || text.includes('would you')) validation += 1;
  validation = Math.min(10, validation);

  // Confessional
  let confessional = CONFESSIONAL_LEXICON.filter(p => text.includes(p)).length * 2;
  confessional = Math.min(10, confessional);

  // Type
  let messageType: ScoredMessage['messageType'] = 'factual';
  if (confessional > 3) messageType = 'confessional';
  else if (anxiety > 4 && intimacy > 3) messageType = 'emotional';
  else if (validation > 3) messageType = 'validation';
  else if (intimacy > 2 || firstPerson > 5) messageType = 'practical';

  // Life events
  const detectedSegments: string[] = [];
  for (const [eventId, config] of Object.entries(LIFE_EVENT_SIGNALS)) {
    if (config.keywords.some(k => text.includes(k)) && !detectedSegments.includes(eventId)) {
      detectedSegments.push(eventId);
    }
  }

  return {
    ...msg,
    hour, dayOfWeek, weekKey, monthKey,
    charCount: msg.text.length,
    wordCount,
    intimacyScore: Math.round(intimacy * 10) / 10,
    anxietyScore: Math.round(anxiety * 10) / 10,
    validationScore: Math.round(validation * 10) / 10,
    confessionalScore: Math.round(confessional * 10) / 10,
    messageType,
    detectedSegments,
    lifeEventSignals: [...detectedSegments],
  };
}

// ============================================================================
// PSYCHOLOGICAL PORTRAIT - inferred from the corpus
// ============================================================================

function buildPsychologicalPortrait(messages: ScoredMessage[]): PsychologicalPortrait {
  const totalMsgs = messages.length;
  if (totalMsgs === 0) {
    return { attachmentStyle: null, communicationPattern: null, primaryCopingMechanism: null, emotionalBaselineLabel: 'Unknown', selfPerceptionThemes: [], relationshipDynamics: null, dominantNarrative: null, writingVoice: null, generatedAt: Date.now() };
  }

  const text = messages.map(m => m.text.toLowerCase()).join(' ');

  // Attachment style
  const anxiousScore = ATTACHMENT_ANXIOUS.filter(k => text.includes(k)).length;
  const avoidantScore = ATTACHMENT_AVOIDANT.filter(k => text.includes(k)).length;
  let attachmentStyle: string | null = null;
  if (anxiousScore > avoidantScore && anxiousScore >= 3) attachmentStyle = 'Anxious attachment pattern - preoccupied with others\' responses and availability';
  else if (avoidantScore > anxiousScore && avoidantScore >= 2) attachmentStyle = 'Avoidant attachment pattern - discomfort with emotional closeness and dependency';
  else if (anxiousScore >= 2 && avoidantScore >= 2) attachmentStyle = 'Disorganised attachment - oscillating between pursuit and withdrawal';

  // Self-perception
  const selfPerceptionThemes: string[] = [];
  if (PERFECTIONISM_MARKERS.filter(k => text.includes(k)).length >= 3) selfPerceptionThemes.push('Perfectionism / self-criticism');
  if (IMPOSTER_MARKERS.filter(k => text.includes(k)).length >= 2) selfPerceptionThemes.push('Imposter syndrome');
  if (RUMINATION_MARKERS.filter(k => text.includes(k)).length >= 3) selfPerceptionThemes.push('Chronic rumination');

  const validationRatio = messages.filter(m => m.validationScore > 3).length / totalMsgs;
  if (validationRatio > 0.12) selfPerceptionThemes.push('External validation dependency');

  // Emotional baseline
  const avgAnxiety = messages.reduce((s, m) => s + m.anxietyScore, 0) / totalMsgs;
  const avgIntimacy = messages.reduce((s, m) => s + m.intimacyScore, 0) / totalMsgs;
  const emotionalCount = messages.filter(m => m.messageType === 'emotional' || m.messageType === 'confessional').length;
  const emotionalRatio = emotionalCount / totalMsgs;

  let emotionalBaselineLabel = 'Emotionally stable';
  if (avgAnxiety > 4) emotionalBaselineLabel = 'Chronically elevated anxiety';
  else if (avgAnxiety > 2.5) emotionalBaselineLabel = 'Mild persistent anxiety';
  else if (emotionalRatio > 0.25) emotionalBaselineLabel = 'High emotional expressivity';
  else if (avgIntimacy < 1.5 && emotionalRatio < 0.05) emotionalBaselineLabel = 'Emotionally guarded - minimal personal disclosure';

  // Coping mechanism
  let primaryCopingMechanism: string | null = null;
  const confessionalCount = messages.filter(m => m.messageType === 'confessional').length;
  const validationCount = messages.filter(m => m.messageType === 'validation').length;
  const practicalCount = messages.filter(m => m.messageType === 'practical').length;
  if (confessionalCount > validationCount && confessionalCount > practicalCount) {
    primaryCopingMechanism = 'Disclosure and externalisation - processes distress by articulating it to an external entity';
  } else if (validationCount > practicalCount) {
    primaryCopingMechanism = 'Reassurance-seeking - manages uncertainty by soliciting external approval';
  } else if (practicalCount > totalMsgs * 0.4) {
    primaryCopingMechanism = 'Action-orientation - converts anxiety into task-focused problem solving';
  }

  // Relationship dynamics
  const relationshipMsgs = messages.filter(m =>
    m.text.toLowerCase().includes('my partner') || m.text.toLowerCase().includes('my girlfriend') ||
    m.text.toLowerCase().includes('my boyfriend') || m.text.toLowerCase().includes('my ex') ||
    m.detectedSegments.includes('relationship_end')
  );
  let relationshipDynamics: string | null = null;
  if (relationshipMsgs.length > 5) {
    const hasConflict = relationshipMsgs.some(m => /argument|fight|shouting|screaming|didn't|doesn't|won't|angry|upset/.test(m.text.toLowerCase()));
    const hasLoss = relationshipMsgs.some(m => m.detectedSegments.includes('relationship_end'));
    if (hasLoss) relationshipDynamics = 'Processing a relationship breakdown - significant emotional weight in this area';
    else if (hasConflict) relationshipDynamics = 'Navigating relationship conflict - recurring tension with a primary partner';
    else relationshipDynamics = 'Relationship is a significant topic - thinking through dynamics frequently';
  }

  // Dominant narrative
  let dominantNarrative: string | null = null;
  const lifeEventTypes = new Set(messages.flatMap(m => m.detectedSegments));
  if (lifeEventTypes.has('mental_health') && lifeEventTypes.has('job_loss')) {
    dominantNarrative = 'Navigating simultaneous mental health and professional crisis';
  } else if (lifeEventTypes.has('relationship_end') && avgAnxiety > 3) {
    dominantNarrative = 'Processing loss and rebuilding sense of self after relationship breakdown';
  } else if (selfPerceptionThemes.includes('Perfectionism / self-criticism') && lifeEventTypes.has('job_search')) {
    dominantNarrative = 'High-achieving individual experiencing impostor syndrome during career uncertainty';
  } else if (avgAnxiety > 3 && validationRatio > 0.1) {
    dominantNarrative = 'Recurring pattern of anxiety and reassurance-seeking across multiple life domains';
  }

  // Writing voice
  const avgWordCount = messages.reduce((s, m) => s + m.wordCount, 0) / totalMsgs;
  const avgCharCount = messages.reduce((s, m) => s + m.charCount, 0) / totalMsgs;
  let writingVoice: string | null = null;
  if (avgWordCount > 120) writingVoice = 'Verbose and exploratory - writes at length to think things through';
  else if (avgWordCount > 50) writingVoice = 'Moderate length - comfortable articulating thoughts in paragraphs';
  else if (avgWordCount < 15) writingVoice = 'Terse and transactional - brief messages, task-focused';
  else writingVoice = 'Concise - communicates efficiently without extended elaboration';

  return {
    attachmentStyle,
    communicationPattern: writingVoice,
    primaryCopingMechanism,
    emotionalBaselineLabel,
    selfPerceptionThemes,
    relationshipDynamics,
    dominantNarrative,
    writingVoice,
    generatedAt: Date.now(),
  };
}

// ============================================================================
// EMOTIONAL TIMELINE
// ============================================================================

function buildEmotionalTimeline(messages: ScoredMessage[]): EmotionalTimeline {
  const weekMap = new Map<string, ScoredMessage[]>();
  for (const msg of messages) {
    const existing = weekMap.get(msg.weekKey) || [];
    existing.push(msg);
    weekMap.set(msg.weekKey, existing);
  }

  const allWeekKeys = Array.from(weekMap.keys()).sort();
  const globalAvg = messages.length / Math.max(allWeekKeys.length, 1);

  const weeks: WeekStats[] = allWeekKeys.map(weekKey => {
    const weekMsgs = weekMap.get(weekKey)!;
    const lateNight = weekMsgs.filter(m => m.hour >= 0 && m.hour <= 4).length;
    const avgIntimacy = weekMsgs.reduce((s, m) => s + m.intimacyScore, 0) / weekMsgs.length;
    const avgAnxiety = weekMsgs.reduce((s, m) => s + m.anxietyScore, 0) / weekMsgs.length;

    const titleWords = weekMsgs.flatMap(m =>
      m.conversationTitle.toLowerCase().split(/\s+/)
        .filter(w => w.length > 4 && !['with', 'from', 'that', 'this', 'what', 'when', 'where', 'about', 'help', 'like', 'just', 'have', 'your'].includes(w))
    );
    const wordFreq = titleWords.reduce((acc, w) => { acc[w] = (acc[w] || 0) + 1; return acc; }, {} as Record<string, number>);
    const dominantTopic = Object.entries(wordFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const crisisFlag = weekMsgs.length > globalAvg * 2.5 && (avgAnxiety > 3 || lateNight > weekMsgs.length * 0.3);

    return { weekKey, startDate: getWeekStart(weekKey), messageCount: weekMsgs.length, avgIntimacy, avgAnxiety, lateNightCount: lateNight, dominantTopic, crisisFlag };
  });

  const crisisPeriods: { start: string; end: string; peakWeek: string }[] = [];
  let inCrisis = false, crisisStart = '', peakWeek = '', peakCount = 0;
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
  const highVolumeWeeks = weeks.filter(w => w.messageCount > globalAvg * 2).sort((a, b) => b.messageCount - a.messageCount).slice(0, 5);

  const quarter = Math.floor(weeks.length / 4);
  const earlyWeeks = weeks.slice(0, Math.max(quarter, 1));
  const recentWeeks = weeks.slice(-Math.max(quarter, 1));
  const earlyAvg = earlyWeeks.reduce((s, w) => s + w.avgAnxiety, 0) / earlyWeeks.length;
  const recentAvg = recentWeeks.reduce((s, w) => s + w.avgAnxiety, 0) / recentWeeks.length;
  const diff = recentAvg - earlyAvg;

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
    const sorted = hits.sort((a, b) => a.timestamp - b.timestamp);
    const median = sorted[Math.floor(sorted.length / 2)];
    const approxDate = new Date(median.timestamp * 1000).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    events.push({ type: eventId, label: config.label, approximateDate: approxDate, evidence: sorted.slice(0, 3).map(m => `"${m.text.substring(0, 80)}..."`), severity: config.severity });
  }
  return events.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]));
}

// ============================================================================
// DEPENDENCY
// ============================================================================

function analyseDependency(messages: ScoredMessage[]): DependencyProfile {
  if (messages.length < 4) {
    return { firstMessageDate: new Date(), daysSinceFirst: 0, messagesPerWeekEarly: 0, messagesPerWeekRecent: 0, trajectory: 'stable', avgLengthEarly: 0, avgLengthRecent: 0, intimacyTrajectory: 'stable', dependencyScore: 0 };
  }
  const firstDate = new Date(messages[0].timestamp * 1000);
  const lastDate = new Date(messages[messages.length - 1].timestamp * 1000);
  const daysSinceFirst = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  const quarter = Math.floor(messages.length / 4);
  const early = messages.slice(0, quarter);
  const recent = messages.slice(-quarter);

  const earlyDays = Math.max(1, (new Date(early[early.length - 1].timestamp * 1000).getTime() - new Date(early[0].timestamp * 1000).getTime()) / (1000 * 60 * 60 * 24));
  const recentDays = Math.max(1, (new Date(recent[recent.length - 1].timestamp * 1000).getTime() - new Date(recent[0].timestamp * 1000).getTime()) / (1000 * 60 * 60 * 24));
  const mpwEarly = (early.length / earlyDays) * 7;
  const mpwRecent = (recent.length / recentDays) * 7;
  const trajectory: DependencyProfile['trajectory'] = mpwRecent > mpwEarly * 1.5 ? 'increasing' : mpwRecent < mpwEarly * 0.6 ? 'decreasing' : 'stable';
  const avgLenEarly = early.reduce((s, m) => s + m.charCount, 0) / early.length;
  const avgLenRecent = recent.reduce((s, m) => s + m.charCount, 0) / recent.length;
  const intimacyEarly = early.reduce((s, m) => s + m.intimacyScore, 0) / early.length;
  const intimacyRecent = recent.reduce((s, m) => s + m.intimacyScore, 0) / recent.length;
  const intimacyTrajectory: DependencyProfile['intimacyTrajectory'] = intimacyRecent > intimacyEarly + 1 ? 'increasing' : intimacyRecent < intimacyEarly - 1 ? 'decreasing' : 'stable';

  let score = 0;
  score += Math.min(30, daysSinceFirst / 12);
  if (trajectory === 'increasing') score += 30;
  else if (trajectory === 'stable') score += 15;
  if (intimacyTrajectory === 'increasing') score += 25;
  else if (intimacyTrajectory === 'stable') score += 10;
  score += Math.min(15, (avgLenRecent - avgLenEarly) / 30);

  return { firstMessageDate: firstDate, daysSinceFirst, messagesPerWeekEarly: Math.round(mpwEarly * 10) / 10, messagesPerWeekRecent: Math.round(mpwRecent * 10) / 10, trajectory, avgLengthEarly: Math.round(avgLenEarly), avgLengthRecent: Math.round(avgLenRecent), intimacyTrajectory, dependencyScore: Math.round(Math.min(100, Math.max(0, score))) };
}

// ============================================================================
// COMMERCIAL PROFILE
// ============================================================================

function buildCommercialProfile(messages: ScoredMessage[]): CommercialProfile {
  const segments = COMMERCIAL_SEGMENT_RULES.map(rule => {
    const result = rule.test(messages);
    if (result.confidence < 15) return null;
    return { id: rule.id, label: rule.label, description: rule.description, confidence: result.confidence, evidence: result.evidence, adCategories: rule.adCategories };
  }).filter(Boolean).sort((a, b) => b!.confidence - a!.confidence) as CommercialProfile['segments'];

  const topScore = segments[0]?.confidence || 0;
  const overallValue: CommercialProfile['overallValue'] = topScore >= 70 ? 'premium' : topScore >= 40 ? 'elevated' : 'standard';
  const primaryDriver = segments[0]?.label || 'General consumer';
  const vulnerabilityIndex = Math.round(Math.min(100, segments.reduce((s, seg) => s + seg.confidence / 10, 0) * 1.2));

  return { segments, overallValue, primaryDriver, vulnerabilityIndex };
}

// ============================================================================
// TOPICS
// ============================================================================

function analyseTopicsByPeriod(messages: ScoredMessage[]): { early: string[]; mid: string[]; recent: string[] } {
  const third = Math.floor(messages.length / 3);
  const stopwords = /^(that|this|what|when|where|about|help|like|just|have|your|would|could|should|don't|can't|won't|i've|i'm|i'll|i'd|there|their|these|those|which|while|being|been|will|from|with|into|than|then|them|they|some|here|more|also|does|well|very|much|said|such|only|over|most|even|both|back|time|know|need|feel|want|make|come|good|think|really|right|still|ever|going|first|after|before|again|always|never|every|something|anything|nothing|everyone|someone|somewhere|because|really|though|maybe|maybe|little|great|things|thing|people|person|actually|basically|literally)$/;
  const topTopics = (msgs: ScoredMessage[]) => {
    const words = msgs.flatMap(m => m.text.toLowerCase().split(/\s+/).filter(w => w.length > 4 && !stopwords.test(w)));
    const freq = words.reduce((acc, w) => { acc[w] = (acc[w] || 0) + 1; return acc; }, {} as Record<string, number>);
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w);
  };
  return { early: topTopics(messages.slice(0, third)), mid: topTopics(messages.slice(third, third * 2)), recent: topTopics(messages.slice(third * 2)) };
}

// ============================================================================
// COMPATIBILITY LAYER
// ============================================================================

function buildCompatibilityLayer(messages: ScoredMessage[]) {
  const STOP_NAMES = new Set(['The', 'This', 'That', 'What', 'When', 'Where', 'How', 'Why', 'Can', 'Could', 'Would', 'Should', 'Have', 'Has', 'Does', 'Did', 'Will', 'Was', 'Were', 'Are', 'Is', 'It', 'He', 'She', 'We', 'You', 'They', 'But', 'And', 'For', 'Not', 'So', 'Do', 'To', 'In', 'On', 'At', 'By', 'Or', 'If', 'Up', 'Out', 'My', 'Me', 'Be', 'As', 'An', 'A', 'I', 'ChatGPT', 'Claude', 'AI', 'Ok', 'Yes', 'No', 'Just', 'Also', 'Now', 'Then', 'Here', 'There', 'Still', 'Even']);

  const namePattern = /\b([A-Z][a-z]{2,})\b/g;
  const nameCounts: Record<string, number> = {};
  const nameContexts: Record<string, string[]> = {};
  for (const msg of messages.slice(0, 300)) {
    const matches = [...msg.text.matchAll(namePattern)].map(m => m[1]);
    for (const name of matches) {
      if (STOP_NAMES.has(name)) continue;
      nameCounts[name] = (nameCounts[name] || 0) + 1;
      if (!nameContexts[name]) nameContexts[name] = [];
      if (nameContexts[name].length < 2) nameContexts[name].push(msg.text.substring(0, 120));
    }
  }
  const names = Object.entries(nameCounts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, mentions]) => ({ name, mentions, relationship: inferRelationship(name, messages), contexts: nameContexts[name] || [] }));

  // Location - improved: scan for any capitalised place-like words near location context
  const locationContextWords = /\b(in|at|from|near|around|visiting|live|lived|living|moved to|moving to|based in|grew up in|went to|come from|originally from)\s+([A-Z][a-zA-Z\s]{2,20})\b/g;
  const locationCounts: Record<string, number> = {};
  for (const msg of messages) {
    let match;
    while ((match = locationContextWords.exec(msg.text)) !== null) {
      const loc = match[2].trim();
      if (loc.length > 2 && loc.length < 25 && !STOP_NAMES.has(loc.split(' ')[0])) {
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }
    }
  }
  const locations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([location, mentions]) => ({ location, mentions, type: mentions > 8 ? 'lives' as const : 'mentions' as const }));

  const sensitiveMessages = messages
    .filter(m => m.confessionalScore > 2 || m.anxietyScore > 5 || m.detectedSegments.length > 0)
    .slice(0, 15)
    .map(m => ({
      topic: m.messageType,
      category: m.detectedSegments[0] || (m.anxietyScore > 5 ? 'mental_health' : 'personal'),
      timestamp: new Date(m.timestamp * 1000).toISOString(),
      excerpt: m.text.substring(0, 200),
    }));

  const hourBuckets = [
    { timeOfDay: 'Late Night (12am-6am)', range: [0, 5] },
    { timeOfDay: 'Morning (6am-12pm)', range: [6, 11] },
    { timeOfDay: 'Afternoon (12pm-6pm)', range: [12, 17] },
    { timeOfDay: 'Evening (6pm-12am)', range: [18, 23] },
  ];
  const vulnerabilityPatterns = hourBuckets.map(bucket => {
    const bMsgs = messages.filter(m => m.hour >= bucket.range[0] && m.hour <= bucket.range[1]);
    const avgAnxiety = bMsgs.reduce((s, m) => s + m.anxietyScore, 0) / Math.max(bMsgs.length, 1);
    const avgIntimacy = bMsgs.reduce((s, m) => s + m.intimacyScore, 0) / Math.max(bMsgs.length, 1);
    const confessionalCount = bMsgs.filter(m => m.messageType === 'confessional').length;
    return {
      timeOfDay: bucket.timeOfDay,
      messageCount: bMsgs.length,
      frequency: bMsgs.length,
      avgAnxiety,
      avgIntimacy,
      confessionalCount,
      emotionalTone: avgAnxiety > 5 ? 'acute distress' : avgAnxiety > 3 ? 'elevated anxiety' : avgIntimacy > 4 ? 'emotional processing' : confessionalCount > 3 ? 'confessional mode' : 'routine queries',
    };
  }).sort((a, b) => b.messageCount - a.messageCount);

  const themeKeywords = ['work', 'job', 'project', 'money', 'relationship', 'health', 'study', 'family', 'anxiety', 'future', 'friend', 'help', 'life', 'love', 'time', 'problem'];
  const repetitiveThemes = themeKeywords.map(theme => {
    const count = messages.filter(m => m.text.toLowerCase().includes(theme)).length;
    return { theme, mentions: count, count, obsessionLevel: Math.min(10, count / 10) };
  }).filter(t => t.count > 5).sort((a, b) => b.count - a.count).slice(0, 8);

  const juiciestMoments = messages
    .filter(m => m.confessionalScore > 0 || m.anxietyScore > 4 || m.intimacyScore > 5)
    .sort((a, b) => (b.confessionalScore + b.anxietyScore + b.intimacyScore) - (a.confessionalScore + a.anxietyScore + a.intimacyScore))
    .slice(0, 10)
    .map(m => ({
      timestamp: new Date(m.timestamp * 1000).toISOString(),
      excerpt: m.text.substring(0, 300),
      juiceScore: Math.min(10, Math.round((m.confessionalScore + m.anxietyScore + m.intimacyScore) / 3)),
      reason: [m.hour >= 0 && m.hour <= 4 ? 'late_night' : null, m.anxietyScore > 4 ? 'emotional' : null, m.confessionalScore > 3 ? 'intimate' : null, m.detectedSegments.includes('relationship_end') ? 'relationship' : null, m.detectedSegments.includes('mental_health') ? 'mental_health' : null].filter(Boolean).join(', '),
    }));

  return { names, locations, sensitiveMessages, vulnerabilityPatterns, repetitiveThemes, juiciestMoments };
}

function inferRelationship(name: string, messages: ScoredMessage[]): string | undefined {
  const ctx = messages.filter(m => m.text.includes(name)).map(m => m.text.toLowerCase()).join(' ');
  if (ctx.includes(`my girlfriend`) && ctx.includes(name.toLowerCase())) return 'girlfriend';
  if (ctx.includes(`my boyfriend`) && ctx.includes(name.toLowerCase())) return 'boyfriend';
  if (ctx.includes(`my ex`) && ctx.includes(name.toLowerCase())) return 'ex';
  if (ctx.includes(`my partner`) && ctx.includes(name.toLowerCase())) return 'partner';
  if (ctx.includes(`my mum`) || ctx.includes(`my mom`) || ctx.includes(`my mother`)) return 'mother';
  if (ctx.includes(`my dad`) || ctx.includes(`my father`)) return 'father';
  if (ctx.includes(`my boss`) && ctx.includes(name.toLowerCase())) return 'boss';
  if (ctx.includes(`my friend`) && ctx.includes(name.toLowerCase())) return 'friend';
  return undefined;
}

// ============================================================================
// PRIVACY SCORE
// ============================================================================

function computePrivacyScore(messages: ScoredMessage[], lifeEvents: LifeEvent[], commercial: CommercialProfile, dependency: DependencyProfile): number {
  let score = 0;
  score += lifeEvents.filter(e => e.severity === 'high').length * 12;
  score += lifeEvents.filter(e => e.severity === 'medium').length * 6;
  score += Math.min(30, commercial.segments.reduce((s, seg) => s + seg.confidence / 10, 0));
  score += dependency.dependencyScore * 0.25;
  score += Math.min(20, messages.filter(m => m.confessionalScore > 3).length * 2 + messages.filter(m => m.anxietyScore > 6).length);
  if (messages.length > 2000) score += 10;
  if (messages.length > 5000) score += 5;
  return Math.round(Math.min(100, Math.max(0, score)));
}

// ============================================================================
// MAIN
// ============================================================================

export function analyzeDeep(rawJson: any[]): DeepAnalysis {
  const rawMessages = extractMessages(rawJson);
  const messages = rawMessages.map(scoreMessage);
  if (messages.length === 0) throw new Error('No user messages found in export');

  const firstDate = new Date(messages[0].timestamp * 1000);
  const lastDate = new Date(messages[messages.length - 1].timestamp * 1000);
  const days = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

  const hourDistribution = Array(24).fill(0);
  const dayDistribution = Array(7).fill(0);
  for (const msg of messages) { hourDistribution[msg.hour]++; dayDistribution[msg.dayOfWeek]++; }

  const peakHour = hourDistribution.indexOf(Math.max(...hourDistribution));
  const nighttimeRatio = messages.filter(m => m.hour >= 0 && m.hour <= 4).length / messages.length;
  const avgIntimacy = messages.reduce((s, m) => s + m.intimacyScore, 0) / messages.length;
  const avgAnxiety = messages.reduce((s, m) => s + m.anxietyScore, 0) / messages.length;

  const emotionalTimeline = buildEmotionalTimeline(messages);
  const lifeEvents = detectLifeEvents(messages);
  const dependency = analyseDependency(messages);
  const commercialProfile = buildCommercialProfile(messages);
  const topicsByPeriod = analyseTopicsByPeriod(messages);
  const psychologicalPortrait = buildPsychologicalPortrait(messages);

  const typeBreakdown = messages.reduce((acc, m) => { acc[m.messageType] = (acc[m.messageType] || 0) + 1; return acc; }, {} as Record<string, number>);
  const privacyScore = computePrivacyScore(messages, lifeEvents, commercialProfile, dependency);
  const compat = buildCompatibilityLayer(messages);

  const hourAnxiety = Array(24).fill(0);
  messages.forEach(m => { if (m.anxietyScore > 4) hourAnxiety[m.hour]++; });
  const mostVulnerableHour = hourAnxiety.indexOf(Math.max(...hourAnxiety));

  const periodLabels = ['Late night (12am-4am)', 'Early morning (5am-8am)', 'Evening (6pm-10pm)', 'Afternoon (12pm-5pm)'];
  const periodRanges = [[0, 4], [5, 8], [18, 22], [12, 17]];
  const periodScores = periodRanges.map(([s, e]) => messages.filter(m => m.hour >= s && m.hour <= e).reduce((sum, m) => sum + m.anxietyScore, 0));
  const mostVulnerablePeriod = periodLabels[periodScores.indexOf(Math.max(...periodScores))] || 'Evening';

  return {
    messages,
    totalUserMessages: messages.length,
    timespan: { first: firstDate, last: lastDate, days },
    hourDistribution, dayDistribution, peakHour, nighttimeRatio,
    emotionalTimeline,
    avgIntimacy: Math.round(avgIntimacy * 10) / 10,
    avgAnxiety: Math.round(avgAnxiety * 10) / 10,
    mostVulnerableHour,
    mostVulnerablePeriod,
    lifeEvents,
    typeBreakdown,
    dependency,
    commercialProfile,
    psychologicalPortrait,
    topicsByPeriod,
    privacyScore,
    findings: {
      personalInfo: {
        names: compat.names,
        locations: compat.locations,
        ages: [], emails: [], phoneNumbers: [],
        relationships: Array.from(new Set(messages.flatMap(m => {
          const t = m.text.toLowerCase();
          return ['girlfriend', 'boyfriend', 'partner', 'ex', 'mum', 'dad', 'brother', 'sister', 'boss', 'friend', 'son', 'daughter'].filter(r => t.includes(r));
        }))).slice(0, 8),
        workInfo: [],
      },
      sensitiveTopics: compat.sensitiveMessages,
      vulnerabilityPatterns: compat.vulnerabilityPatterns,
      temporalInsights: [],
      repetitiveThemes: compat.repetitiveThemes,
    },
    juiciestMoments: compat.juiciestMoments,
    rawStats: {
      totalMessages: rawMessages.length * 2,
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
  const dow = d.getDay();
  return new Date(d.setDate(d.getDate() - dow + (dow === 0 ? -6 : 1)));
}
