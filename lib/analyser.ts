// FINAL CLEAN Analysis Engine for "YOU AGREED"
// Ultra-strict, context-aware, business-filtering

export interface AnalysisResult {
  privacyScore: number;
  findings: {
    personalInfo: PersonalInfo;
    sensitiveTopics: SensitiveTopic[];
    vulnerabilityPatterns: VulnerabilityPattern[];
    temporalInsights: TemporalInsight[];
    repetitiveThemes: RepetitiveTheme[];
  };
  juiciestMoments: JuicyMoment[];
  stats: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    timeSpan: string;
    avgMessageLength: number;
  };
}

interface PersonalInfo {
  names: NameMention[];
  locations: LocationMention[];
  ages: string[];
  emails: string[];
  phoneNumbers: string[];
  relationships: string[];
  workInfo: string[];
}

interface NameMention {
  name: string;
  mentions: number;
  contexts: string[];
  relationship?: string;
}

interface LocationMention {
  location: string;
  mentions: number;
  type: 'lives' | 'works' | 'visits' | 'mentions';
}

interface SensitiveTopic {
  category: 'health' | 'mental_health' | 'financial' | 'relationship' | 'personal_struggle' | 'secret';
  excerpt: string;
  timestamp: string;
  severity: number;
}

interface VulnerabilityPattern {
  timeOfDay: string;
  frequency: number;
  commonThemes: string[];
  emotionalTone: 'desperate' | 'anxious' | 'confessional' | 'seeking_help';
}

interface TemporalInsight {
  hour: number;
  messageCount: number;
  vulnerability: number;
  topTopics: string[];
}

interface RepetitiveTheme {
  theme: string;
  mentions: number;
  relatedExcerpts: string[];
  obsessionLevel: number;
}

interface JuicyMoment {
  excerpt: string;
  timestamp: string;
  juiceScore: number;
  reason: string;
  category: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// ============================================================================
// COMMON FIRST NAMES DATABASE (expanded)
// ============================================================================
const COMMON_FIRST_NAMES = new Set([
  // Male names (must be capitalized to match)
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Paul',
  'Steven', 'Andrew', 'Kenneth', 'Joshua', 'Kevin', 'Brian', 'George', 'Edward',
  'Ryan', 'Jacob', 'Nicholas', 'Tyler', 'Alexander', 'Jonathan', 'Nathan',
  'Aaron', 'Eric', 'Christian', 'Benjamin', 'Samuel', 'Dylan', 'Logan', 'Brandon',
  'Jack', 'Luke', 'Henry', 'Adam', 'Connor', 'Evan', 'Max', 'Oliver', 'Liam',
  'Noah', 'Ethan', 'Mason', 'Lucas', 'Jackson', 'Aiden', 'Sebastian', 'Finn',
  'Oscar', 'Theo', 'Leo', 'Harry', 'Charlie', 'Archie', 'Freddie', 'Arthur',
  'Alfie', 'Tommy', 'Isaac', 'Toby', 'Jude', 'Reuben', 'Albie', 'Roman',
  'Jake', 'Sam', 'Tom', 'Ben', 'Dan', 'Alex', 'Chris', 'Matt', 'Josh', 'Nick',
  
  // Female names
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan',
  'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra',
  'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol', 'Amanda',
  'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
  'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma',
  'Nicole', 'Helen', 'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel',
  'Catherine', 'Carolyn', 'Janet', 'Ruth', 'Maria', 'Heather', 'Diane', 'Virginia',
  'Julie', 'Joyce', 'Victoria', 'Olivia', 'Kelly', 'Christina', 'Lauren', 'Joan',
  'Evelyn', 'Judith', 'Megan', 'Cheryl', 'Andrea', 'Hannah', 'Martha', 'Jacqueline',
  'Frances', 'Gloria', 'Ann', 'Teresa', 'Kathryn', 'Sara', 'Janice', 'Jean',
  'Alice', 'Madison', 'Doris', 'Abigail', 'Julia', 'Judy', 'Grace', 'Denise',
  'Amber', 'Sophie', 'Chloe', 'Lucy', 'Ella', 'Mia', 'Amelia', 'Lily', 'Isla',
  'Ava', 'Evie', 'Charlotte', 'Poppy', 'Isabelle', 'Freya', 'Daisy',
  'Phoebe', 'Scarlett', 'Holly', 'Millie', 'Rosie', 'Leah', 'Maya', 'Milly',
  'Zoe', 'Molly', 'Ellie', 'Ruby', 'Florence', 'Ivy', 'Sophia', 'Imogen',
  'Kate', 'Katie', 'Lizzie', 'Beth', 'Annie', 'Bella',
  
  // Unisex names
  'Jordan', 'Taylor', 'Alexis', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery',
  'Cameron', 'Quinn', 'Parker', 'Drew', 'Jesse', 'Skylar', 'Rowan',
]);

// Expanded exclusion list
const COMMON_WORDS_EXCLUDE = new Set([
  // Common verbs
  'Getting', 'Doing', 'Being', 'Having', 'Making', 'Taking', 'Going', 'Seeing',
  'Looking', 'Feeling', 'Thinking', 'Trying', 'Working', 'Starting', 'Running',
  'Eating', 'Drinking', 'Sleeping', 'Watching', 'Reading', 'Writing', 'Speaking',
  'Calling', 'Selling', 'Buying', 'Asking', 'Telling', 'Showing', 'Moving',
  'Living', 'Dying', 'Crying', 'Laughing', 'Smiling', 'Walking', 'Talking',
  'Sitting', 'Standing', 'Lying', 'Falling', 'Rising', 'Growing', 'Changing',
  'Helping', 'Learning', 'Teaching', 'Building', 'Breaking', 'Fixing', 'Cleaning',
  'Cooking', 'Playing', 'Fighting', 'Loving', 'Hating', 'Wanting', 'Needing',
  'Knowing', 'Believing', 'Understanding', 'Remembering', 'Forgetting', 'Hoping',
  'Wishing', 'Dreaming', 'Planning', 'Deciding', 'Choosing', 'Preferring',
  'Struggling', 'Checking', 'Offering', 'Tackling', 'Following', 'Applying',
  'Missing', 'Hitting', 'Smoking', 'Scraping', 'Noticing', 'Facing', 'Expecting',
  
  // Adjectives/Adverbs
  'Already', 'Also', 'Only', 'Really', 'Very', 'Quite', 'Just', 'Still', 'Even',
  'Almost', 'Nearly', 'Hardly', 'Barely', 'Actually', 'Basically', 'Completely',
  'Totally', 'Fully', 'Partly', 'Slightly', 'Extremely', 'Incredibly', 'Absolutely',
  'Definitely', 'Certainly', 'Probably', 'Possibly', 'Maybe', 'Perhaps',
  'Ready', 'Eager', 'Fascinated', 'Sorry', 'Happy', 'Worried', 'Desperate',
  'Unable', 'Capable', 'Constant', 'Constantly', 'Current', 'Currently',
  'Physical', 'Physically', 'Terrified', 'Ungrateful', 'Genuinely',
  
  // Prepositions/Conjunctions
  'About', 'Above', 'Across', 'After', 'Against', 'Along', 'Among', 'Around',
  'Before', 'Behind', 'Below', 'Beneath', 'Beside', 'Between', 'Beyond',
  'During', 'Except', 'Inside', 'Outside', 'Through', 'Toward', 'Under',
  'Until', 'Within', 'Without', 'Right', 'Using', 'Offering', 'Than',
  
  // Other
  'Something', 'Anything', 'Nothing', 'Everything', 'Someone', 'Anyone',
  'Everyone', 'Number', 'Half', 'Free', 'Wright', 'YouTuber',
]);

// Business/marketing indicators
const BUSINESS_INDICATORS = [
  'script', 'email script', 'cold call', 'marketing', 'strategy', 'client', 
  'customer', 'sales', 'business', 'service', 'offer', 'prospect', 'gatekeeper',
  'campaign', 'conversion', 'funnel', 'roi', 'lead', 'pipeline', 'CompanyName',
  '{{Name}}', 'Hi {{', 'Dear {{', 'template', 'roofing companies', 'cv',
  'application', 'Good afternoon, Finnian', 'Thank you for sharing your CV',
];

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function analyseChatHistory(jsonData: any): AnalysisResult {
  const messages = extractMessages(jsonData);
  
  return {
    privacyScore: calculatePrivacyScore(messages),
    findings: {
      personalInfo: extractPersonalInfo(messages),
      sensitiveTopics: extractSensitiveTopics(messages),
      vulnerabilityPatterns: analyseVulnerabilityPatterns(messages),
      temporalInsights: analyseTemporalPatterns(messages),
      repetitiveThemes: findRepetitiveThemes(messages),
    },
    juiciestMoments: findJuiciestMoments(messages),
    stats: calculateStats(messages),
  };
}

function extractMessages(jsonData: any): Message[] {
  const messages: Message[] = [];
  
  try {
    if (Array.isArray(jsonData)) {
      jsonData.forEach((conversation: any) => {
        if (conversation.mapping) {
          Object.values(conversation.mapping).forEach((node: any) => {
            if (node.message && node.message.content && node.message.content.parts) {
              messages.push({
                role: node.message.author.role,
                content: node.message.content.parts.join(' '),
                timestamp: node.message.create_time ? new Date(node.message.create_time * 1000) : new Date(),
              });
            }
          });
        }
      });
    } else if (jsonData.mapping) {
      Object.values(jsonData.mapping).forEach((node: any) => {
        if (node.message && node.message.content && node.message.content.parts) {
          messages.push({
            role: node.message.author.role,
            content: node.message.content.parts.join(' '),
            timestamp: node.message.create_time ? new Date(node.message.create_time * 1000) : new Date(),
          });
        }
      });
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
  
  return messages;
}

// ============================================================================
// ULTRA-CLEAN NAME EXTRACTION
// ============================================================================

function extractPersonalInfo(messages: Message[]): PersonalInfo {
  const userMessages = messages.filter(m => m.role === 'user');
  const allText = userMessages.map(m => m.content).join(' ');
  
  return {
    names: extractNamesUltraClean(userMessages),
    locations: extractLocationsUltraClean(userMessages),
    ages: extractAges(allText),
    emails: extractEmails(allText),
    phoneNumbers: extractPhoneNumbers(allText),
    relationships: extractRelationships(allText),
    workInfo: extractWorkInfo(allText),
  };
}

function isBusinessContext(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BUSINESS_INDICATORS.some(indicator => lowerText.includes(indicator.toLowerCase()));
}

function extractNamesUltraClean(messages: Message[]): NameMention[] {
  const nameMap = new Map<string, { mentions: number; contexts: string[]; relationship?: string }>();
  
  // Patterns for name extraction
  const relationshipPattern = /\bmy\s+(friend|girlfriend|boyfriend|wife|husband|partner|brother|sister|son|daughter|mother|father|mom|dad|mum|boss|colleague|ex|roommate|flatmate)\s+([A-Z][a-z]{2,12})\b/g;
  const possessivePattern = /\b([A-Z][a-z]{2,12})'s\b/g;
  const withPattern = /\b(?:with|to|from|met|saw|called|texted)\s+([A-Z][a-z]{2,12})\b/g;
  
  messages.forEach(msg => {
    const content = msg.content;
    
    // Skip if business content
    if (isBusinessContext(content)) {
      return;
    }
    
    // Skip if message is too long (likely business/template)
    if (content.length > 800) {
      return;
    }
    
    // Pattern 1: Relationship names (HIGHEST PRIORITY)
    let matches = content.matchAll(relationshipPattern);
    for (const match of matches) {
      const relationship = match[1].toLowerCase();
      const name = match[2];
      
      // Validate: Must be in common names, not in exclude list, and properly capitalized
      if (COMMON_FIRST_NAMES.has(name) && !COMMON_WORDS_EXCLUDE.has(name)) {
        if (!nameMap.has(name)) {
          nameMap.set(name, { mentions: 0, contexts: [], relationship });
        }
        const entry = nameMap.get(name)!;
        entry.mentions += 2; // Higher weight for relationship context
        entry.relationship = entry.relationship || relationship;
        if (entry.contexts.length < 2) {
          // Get a clean excerpt without business jargon
          const cleanExcerpt = content.substring(0, 150).replace(/{{.*?}}/g, '[name]');
          if (!isBusinessContext(cleanExcerpt)) {
            entry.contexts.push(cleanExcerpt);
          }
        }
      }
    }
    
    // Pattern 2: Possessive (only for already-known names)
    matches = content.matchAll(possessivePattern);
    for (const match of matches) {
      const name = match[1];
      if (nameMap.has(name)) {
        const entry = nameMap.get(name)!;
        entry.mentions++;
        if (entry.contexts.length < 2) {
          const cleanExcerpt = content.substring(0, 150);
          if (!isBusinessContext(cleanExcerpt)) {
            entry.contexts.push(cleanExcerpt);
          }
        }
      }
    }
    
    // Pattern 3: "with Name" (only for already-known names)
    matches = content.matchAll(withPattern);
    for (const match of matches) {
      const name = match[1];
      if (nameMap.has(name)) {
        const entry = nameMap.get(name)!;
        entry.mentions++;
      }
    }
  });
  
  // Filter: Only return names with:
  // - At least 3 mentions OR has a relationship
  // - Has at least one clean context
  return Array.from(nameMap.entries())
    .filter(([_, data]) => (data.mentions >= 3 || data.relationship) && data.contexts.length > 0)
    .map(([name, data]) => ({
      name,
      mentions: data.mentions,
      contexts: data.contexts,
      relationship: data.relationship,
    }))
    .sort((a, b) => {
      // Sort by: relationship first, then mentions
      if (a.relationship && !b.relationship) return -1;
      if (!a.relationship && b.relationship) return 1;
      return b.mentions - a.mentions;
    });
}

// ============================================================================
// ULTRA-CLEAN LOCATION EXTRACTION
// ============================================================================

function extractLocationsUltraClean(messages: Message[]): LocationMention[] {
  const locationMap = new Map<string, { mentions: number; type: 'lives' | 'works' | 'visits' | 'mentions'; contexts: string[] }>();
  
  const KNOWN_CITIES = [
    'London', 'Paris', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Toronto', 'Vancouver',
    'Montreal', 'Leeds', 'Manchester', 'Birmingham', 'Liverpool', 'Brighton',
    'Bristol', 'Edinburgh', 'Glasgow', 'Dublin', 'Belfast', 'Cardiff', 'Sheffield',
    'Newcastle', 'Nottingham', 'Leicester', 'Cambridge', 'Oxford', 'York',
    'Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Rome', 'Milan', 'Venice',
    'Madrid', 'Barcelona', 'Seville', 'Lisbon', 'Porto', 'Amsterdam', 'Rotterdam',
    'Brussels', 'Vienna', 'Prague', 'Copenhagen', 'Stockholm', 'Oslo', 'Helsinki',
    'Athens', 'Budapest', 'Warsaw', 'Moscow',
  ];
  
  const allText = messages.map(m => m.content).join(' ').toLowerCase();
  
  // Super specific patterns for actual residence/work
  messages.forEach(msg => {
    const content = msg.content;
    const lower = content.toLowerCase();
    
    // Skip business content
    if (isBusinessContext(content)) return;
    
    // Pattern 1: "I live in X" / "I'm based in X" - HIGHEST CONFIDENCE
    const livesPatterns = [
      /\b(?:i live in|i'm living in|i'm based in|based in|living in|moved to|relocating to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
      /\b(?:my home is in|home in|resident of|renting in)\s+([A-Z][a-z]+)\b/g,
    ];
    
    livesPatterns.forEach(pattern => {
      let matches = content.matchAll(pattern);
      for (const match of matches) {
        const location = match[1];
        if (KNOWN_CITIES.includes(location)) {
          if (!locationMap.has(location)) {
            locationMap.set(location, { mentions: 0, type: 'lives', contexts: [] });
          }
          const entry = locationMap.get(location)!;
          entry.mentions += 5; // Very high weight
          entry.type = 'lives';
          if (entry.contexts.length < 2) {
            entry.contexts.push(content.substring(0, 100));
          }
        }
      }
    });
    
    // Pattern 2: "I work in X" - HIGH CONFIDENCE  
    const worksPatterns = [
      /\b(?:i work in|working in|my office is in|office in|job in|employed in)\s+([A-Z][a-z]+)\b/g,
    ];
    
    worksPatterns.forEach(pattern => {
      let matches = content.matchAll(pattern);
      for (const match of matches) {
        const location = match[1];
        if (KNOWN_CITIES.includes(location)) {
          if (!locationMap.has(location)) {
            locationMap.set(location, { mentions: 0, type: 'works', contexts: [] });
          }
          const entry = locationMap.get(location)!;
          if (entry.type !== 'lives') { // Lives takes precedence
            entry.mentions += 3;
            entry.type = 'works';
          }
        }
      }
    });
    
    // Pattern 3: "visited X", "trip to X" - MEDIUM CONFIDENCE
    const visitsPatterns = [
      /\b(?:visited|visiting|went to|going to|trip to|traveled to|holiday in|vacation in)\s+([A-Z][a-z]+)\b/g,
    ];
    
    visitsPatterns.forEach(pattern => {
      let matches = content.matchAll(pattern);
      for (const match of matches) {
        const location = match[1];
        if (KNOWN_CITIES.includes(location)) {
          if (!locationMap.has(location)) {
            locationMap.set(location, { mentions: 0, type: 'visits', contexts: [] });
          }
          const entry = locationMap.get(location)!;
          if (entry.type !== 'lives' && entry.type !== 'works') {
            entry.mentions += 1;
            entry.type = 'visits';
          }
        }
      }
    });
  });
  
  // Pattern 4: Just mentioned (LOWEST - and very conservative)
  KNOWN_CITIES.forEach(city => {
    const count = (allText.match(new RegExp(`\\b${city.toLowerCase()}\\b`, 'g')) || []).length;
    if (count >= 5) { // Only if mentioned 5+ times
      if (!locationMap.has(city)) {
        locationMap.set(city, { mentions: count, type: 'mentions', contexts: [] });
      }
    }
  });
  
  // Return locations, sorted by type priority and mentions
  return Array.from(locationMap.entries())
    .filter(([_, data]) => data.mentions >= 1)
    .map(([location, data]) => ({
      location,
      mentions: Math.floor(data.mentions),
      type: data.type,
    }))
    .sort((a, b) => {
      const typeOrder = { lives: 4, works: 3, visits: 2, mentions: 1 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[b.type] - typeOrder[a.type];
      }
      return b.mentions - a.mentions;
    })
    .slice(0, 8); // Top 8 only
}

// ============================================================================
// OTHER EXTRACTION FUNCTIONS
// ============================================================================

function extractAges(text: string): string[] {
  const ages = new Set<string>();
  const agePatterns = [
    /\b(?:I'm|I am|age|aged)\s+(\d{1,2})\s*(?:years old|year old|yo)?\b/gi,
  ];
  
  agePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const age = parseInt(match[1]);
      if (age >= 16 && age <= 80) {
        ages.add(match[1]);
      }
    }
  });
  
  return Array.from(ages);
}

function extractEmails(text: string): string[] {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return Array.from(new Set(text.match(emailPattern) || []));
}

function extractPhoneNumbers(text: string): string[] {
  const phonePattern = /\b\d{10}\b/g;
  return Array.from(new Set(text.match(phonePattern) || []));
}

function extractRelationships(text: string): string[] {
  const relationships = new Set<string>();
  const relationshipPatterns = [
    /\bmy\s+(wife|husband|partner|boyfriend|girlfriend|fiancé|fiancee|mother|father|mom|dad|mum|son|daughter|brother|sister|friend|boss|colleague|ex)\b/gi,
  ];
  
  relationshipPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        relationships.add(match[1].toLowerCase());
      }
    }
  });
  
  return Array.from(relationships);
}

function extractWorkInfo(text: string): string[] {
  const workInfo = new Set<string>();
  const workPatterns = [
    /\b(?:I work as a|working as a|I'm a|job as a)\s+([a-z\s]{4,30}?)(?:\.|,|\s+at|\s+for|\s+in)/gi,
  ];
  
  const excludeWords = new Set(['the', 'this', 'that', 'work', 'job']);
  
  workPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const info = match[1].trim();
        if (!excludeWords.has(info.toLowerCase()) && info.length >= 4) {
          workInfo.add(info);
        }
      }
    }
  });
  
  return Array.from(workInfo).slice(0, 3);
}

// ============================================================================
// REMAINING FUNCTIONS (keeping the good ones from before)
// ============================================================================

function extractSensitiveTopics(messages: Message[]): SensitiveTopic[] {
  const topics: SensitiveTopic[] = [];
  const userMessages = messages.filter(m => m.role === 'user');
  
  const sensitiveKeywords = {
    health: ['diagnosed with', 'my diagnosis', 'doctor said', 'hospital for', 'surgery on', 'blood test', 'medical condition'],
    mental_health: ['my therapist', 'therapy session', 'diagnosed with anxiety', 'diagnosed with depression', 'suicidal thoughts', 'panic attack', 'mental breakdown', 'tried to kill', 'kill myself'],
    financial: ['in debt', 'debt free', 'credit card', 'credit score', 'loan', 'overdraft', 'can\'t afford', 'bankruptcy', 'balance obscured'],
    relationship: ['we broke up', 'broke up with', 'my divorce', 'cheated on', 'ex girlfriend', 'ex boyfriend', 'relationship ended'],
    personal_struggle: ['struggling with', 'can\'t cope', 'i\'m struggling', 'feel like a failure'],
    secret: ['don\'t tell anyone', 'never told anyone', 'nobody knows', 'keeping secret'],
  };
  
  userMessages.forEach(msg => {
    if (isBusinessContext(msg.content) && msg.content.length > 500) return;
    
    const lowerContent = msg.content.toLowerCase();
    
    Object.entries(sensitiveKeywords).forEach(([category, keywords]) => {
      const matchedKeywords = keywords.filter(kw => lowerContent.includes(kw));
      
      if (matchedKeywords.length > 0) {
        const sentences = msg.content.split(/[.!?]+/);
        sentences.forEach(sentence => {
          if (matchedKeywords.some(kw => sentence.toLowerCase().includes(kw))) {
            const trimmed = sentence.trim();
            if (trimmed.length > 30 && trimmed.length < 300 && !isBusinessContext(trimmed)) {
              topics.push({
                category: category as any,
                excerpt: trimmed.substring(0, 200),
                timestamp: msg.timestamp.toISOString(),
                severity: matchedKeywords.length + (category === 'mental_health' || category === 'secret' ? 3 : 0),
              });
            }
          }
        });
      }
    });
  });
  
  return topics.sort((a, b) => b.severity - a.severity).slice(0, 15);
}

function analyseVulnerabilityPatterns(messages: Message[]): VulnerabilityPattern[] {
  const patterns: Map<string, { messages: Message[] }> = new Map();
  
  messages.filter(m => m.role === 'user').forEach(msg => {
    const hour = msg.timestamp.getHours();
    let timeBlock: string;
    
    if (hour >= 0 && hour < 6) timeBlock = 'Late Night (12am-6am)';
    else if (hour >= 6 && hour < 12) timeBlock = 'Morning (6am-12pm)';
    else if (hour >= 12 && hour < 18) timeBlock = 'Afternoon (12pm-6pm)';
    else timeBlock = 'Evening (6pm-12am)';
    
    if (!patterns.has(timeBlock)) {
      patterns.set(timeBlock, { messages: [] });
    }
    patterns.get(timeBlock)!.messages.push(msg);
  });
  
  return Array.from(patterns.entries()).map(([timeOfDay, data]) => {
    const emotionalWords = {
      desperate: ['help me', 'please help', 'desperate', 'urgent'],
      anxious: ['worried', 'anxious', 'nervous', 'scared', 'afraid'],
      confessional: ['honestly', 'confession', 'truth is', 'i have to admit'],
      seeking_help: ['advice', 'guidance', 'what should', 'how do i'],
    };
    
    let dominantTone: any = 'seeking_help';
    let maxScore = 0;
    
    Object.entries(emotionalWords).forEach(([tone, words]) => {
      const score = data.messages.reduce((sum, msg) => {
        return sum + words.filter(w => msg.content.toLowerCase().includes(w)).length;
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        dominantTone = tone;
      }
    });
    
    return {
      timeOfDay,
      frequency: data.messages.length,
      commonThemes: ['support seeking', 'problem solving'],
      emotionalTone: dominantTone,
    };
  });
}

function analyseTemporalPatterns(messages: Message[]): TemporalInsight[] {
  const hourlyData: Map<number, Message[]> = new Map();
  
  messages.filter(m => m.role === 'user').forEach(msg => {
    const hour = msg.timestamp.getHours();
    if (!hourlyData.has(hour)) hourlyData.set(hour, []);
    hourlyData.get(hour)!.push(msg);
  });
  
  return Array.from(hourlyData.entries()).map(([hour, msgs]) => ({
    hour,
    messageCount: msgs.length,
    vulnerability: hour >= 22 || hour <= 4 ? 8 : hour >= 5 && hour <= 7 ? 6 : 4,
    topTopics: [],
  }));
}

function findRepetitiveThemes(messages: Message[]): RepetitiveTheme[] {
  const themes: Map<string, string[]> = new Map();
  const userMessages = messages.filter(m => m.role === 'user');
  
  const commonThemes = [
    'work', 'job', 'career', 'relationship', 'dating', 'family', 'health',
    'anxiety', 'stress', 'money', 'finance', 'coding', 'programming',
    'write', 'writing', 'project', 'study'
  ];
  
  userMessages.forEach(msg => {
    const lowerContent = msg.content.toLowerCase();
    commonThemes.forEach(theme => {
      if (lowerContent.includes(theme)) {
        if (!themes.has(theme)) themes.set(theme, []);
        themes.get(theme)!.push(msg.content.substring(0, 150));
      }
    });
  });
  
  return Array.from(themes.entries())
    .map(([theme, excerpts]) => ({
      theme,
      mentions: excerpts.length,
      relatedExcerpts: excerpts.slice(0, 3),
      obsessionLevel: Math.min(10, Math.floor(excerpts.length / 3)),
    }))
    .filter(t => t.mentions >= 5)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 8);
}

function findJuiciestMoments(messages: Message[]): JuicyMoment[] {
  const juicy: JuicyMoment[] = [];
  const userMessages = messages.filter(m => m.role === 'user');
  
  const juiceIndicators = {
    'late_night': { hourCheck: (h: number) => h >= 0 && h <= 4, score: 10 },
    'emotional': { keywords: ['i feel', 'i\'m feeling', 'makes me feel', 'heartbroken', 'crying'], score: 9 },
    'confessional': { keywords: ['honestly i', 'truth is', 'i have to admit', 'confession', 'never told'], score: 10 },
    'desperate': { keywords: ['i\'m desperate', 'please help me', 'don\'t know what to do'], score: 10 },
    'intimate': { keywords: ['i love', 'in love with', 'slept with'], score: 9 },
    'vulnerable': { keywords: ['i\'m scared', 'i\'m afraid', 'terrified', 'worried that'], score: 8 },
    'relationship': { keywords: ['my ex', 'broke up', 'breakup', 'mental breakdown', 'ex girlfriend', 'ex boyfriend'], score: 8 },
    'personal_failure': { keywords: ['i failed', 'i messed up', 'i fucked up', 'i\'m ashamed'], score: 8 },
  };
  
  userMessages.forEach(msg => {
    if (isBusinessContext(msg.content) || msg.content.length > 600) return;
    
    const lowerContent = msg.content.toLowerCase();
    const hour = msg.timestamp.getHours();
    let totalScore = 0;
    const matchedCategories: string[] = [];
    
    Object.entries(juiceIndicators).forEach(([category, indicator]) => {
      if (indicator.keywords) {
        const matches = indicator.keywords.filter(kw => lowerContent.includes(kw)).length;
        if (matches > 0) {
          totalScore += indicator.score * matches;
          matchedCategories.push(category);
        }
      }
      if (indicator.hourCheck && indicator.hourCheck(hour)) {
        totalScore += indicator.score;
        matchedCategories.push(category);
      }
    });
    
    if (totalScore >= 10 && msg.content.length < 500) {
      juicy.push({
        excerpt: msg.content.substring(0, 300),
        timestamp: msg.timestamp.toISOString(),
        juiceScore: Math.min(10, Math.floor(totalScore / 7)),
        reason: matchedCategories.slice(0, 3).join(', '),
        category: matchedCategories[0] || 'personal',
      });
    }
  });
  
  return juicy.sort((a, b) => b.juiceScore - a.juiceScore).slice(0, 12);
}

function calculatePrivacyScore(messages: Message[]): number {
  const userMessages = messages.filter(m => m.role === 'user');
  const allText = userMessages.map(m => m.content).join(' ');
  
  let score = 0;
  score += Math.min(30, userMessages.length / 10);
  
  const names = extractNamesUltraClean(userMessages);
  score += names.length * 8;
  
  const locations = extractLocationsUltraClean(userMessages);
  score += locations.filter(l => l.type === 'lives').length * 10;
  score += locations.filter(l => l.type === 'works').length * 6;
  
  score += extractEmails(allText).length * 8;
  score += extractPhoneNumbers(allText).length * 12;
  
  return Math.min(100, Math.floor(score));
}

function calculateStats(messages: Message[]) {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  const timestamps = messages.map(m => m.timestamp.getTime());
  const timeSpan = timestamps.length > 0 
    ? `${Math.floor((Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24))} days`
    : '0 days';
  
  const avgLength = userMessages.length > 0
    ? Math.floor(userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length)
    : 0;
  
  return {
    totalMessages: messages.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    timeSpan,
    avgMessageLength: avgLength,
  };
}
