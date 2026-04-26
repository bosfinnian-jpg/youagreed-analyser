'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ActLabel, ThreadSentence } from './DashboardLayout';

// ============================================================================
// TYPOGRAPHY — local to this page, uses a dark palette distinct from the
// dashboard so it reads as a different kind of space (a course, not a report)
// ============================================================================

const TYPE = {
  serif: '"EB Garamond", Georgia, "Times New Roman", serif',
  mono: '"Courier Prime", "Courier New", monospace',
};

const C = {
  bg: '#eeece5',
  bgLift: 'rgba(26,24,20,0.04)',
  panel: 'rgba(250,249,247,0.9)',
  border: 'rgba(26,24,20,0.14)',
  borderStrong: 'rgba(26,24,20,0.28)',
  text: '#1a1816',
  textMuted: 'rgba(26,24,20,0.58)',
  textFaint: 'rgba(26,24,20,0.38)',
  textGhost: 'rgba(26,24,20,0.14)',
  accent: 'rgba(190,40,30,0.90)',
  accentFaint: 'rgba(190,40,30,0.12)',
  success: 'rgba(30,130,55,0.15)',
};

// ============================================================================
// MODULE METADATA
// ============================================================================


// ── INTERACTIVE INFERENCE DEMO ───────────────────────────────────────────────
// Pudding principle: make the abstract tangible.
// Type anything. Watch the model classify it in real time.
// The inference is instant — that's the point.

const INFERENCE_RULES: { pattern: RegExp; label: string; color: string; bg: string }[] = [
  { pattern: /\b(anxious|anxiety|panic|worried|stress|depression|depressed|sad|lonely|hopeless|desperate|suicidal|self-harm|harm|crying|overwhelm|breakdown|spiral)\b/gi, label: 'Mental health signal', color: 'rgba(255,100,72,0.9)', bg: 'rgba(255,100,72,0.1)' },
  { pattern: /\b(doctor|hospital|medication|meds|prescription|diagnosis|therapy|therapist|counsell|psychiatr|GP|NHS|pain|symptom|ill|sick|cancer|surgery)\b/gi, label: 'Health disclosure', color: 'rgba(255,183,77,0.9)', bg: 'rgba(255,183,77,0.1)' },
  { pattern: /\b(debt|loan|money|broke|afford|financial|salary|redundan|unemploy|bankruptcy|mortgage|rent|credit|borrow|budget|saving|bankrupt)\b/gi, label: 'Financial vulnerability', color: 'rgba(78,205,196,0.9)', bg: 'rgba(78,205,196,0.1)' },
  { pattern: /\b(relationship|breakup|divorce|partner|wife|husband|girlfriend|boyfriend|ex|split|affair|cheating|dating|marriage|separated|custody)\b/gi, label: 'Relationship data', color: 'rgba(107,203,119,0.9)', bg: 'rgba(107,203,119,0.1)' },
  { pattern: /\b(secret|nobody knows|don't tell|private|confidential|haven't told|can't tell|shouldn't say|just between|promise you won't)\b/gi, label: 'Confidentiality signal', color: 'rgba(187,134,252,0.9)', bg: 'rgba(187,134,252,0.1)' },
  { pattern: /\b(I feel|I'm feeling|I feel like|makes me feel|feeling very|been feeling|felt so|I felt)\b/gi, label: 'Emotional disclosure', color: 'rgba(190,40,30,0.7)', bg: 'rgba(190,40,30,0.08)' },
];

const SAMPLE_PHRASES = [
  "I've been feeling really anxious lately and my doctor suggested I see a therapist but I can't really afford it right now.",
  "Nobody else knows about this but my relationship is falling apart and I'm not sure I can keep going.",
  "I need help — I'm in serious debt and I haven't told my partner yet. I don't know what to do.",
];

interface Tagged { text: string; label?: string; color?: string; bg?: string }

function tagPhrase(input: string): Tagged[] {
  // Build a map of character positions to their tags
  const result: Tagged[] = [];
  const text = input;
  let tagged = new Array(text.length).fill(null) as (null | { label: string; color: string; bg: string })[];

  // Apply rules (first match wins)
  for (const rule of INFERENCE_RULES) {
    rule.pattern.lastIndex = 0;
    let m;
    while ((m = rule.pattern.exec(text)) !== null) {
      for (let i = m.index; i < m.index + m[0].length; i++) {
        if (!tagged[i]) tagged[i] = { label: rule.label, color: rule.color, bg: rule.bg };
      }
    }
  }

  let i = 0;
  while (i < text.length) {
    if (!tagged[i]) {
      let j = i;
      while (j < text.length && !tagged[j]) j++;
      result.push({ text: text.slice(i, j) });
      i = j;
    } else {
      const tag = tagged[i];
      let j = i;
      while (j < text.length && tagged[j] === tag) j++;
      result.push({ text: text.slice(i, j), label: tag!.label, color: tag!.color, bg: tag!.bg });
      i = j;
    }
  }
  return result;
}

function InferenceTagger({ setPage }: { setPage?: (p: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const [input, setInput] = useState('');
  const [activePhrase, setActivePhrase] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  const displayText = showCustom ? input : SAMPLE_PHRASES[activePhrase];
  const tagged = displayText ? tagPhrase(displayText) : [];
  const detectedLabels = [...new Set(tagged.filter(t => t.label).map(t => t.label!))];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9 }}
      style={{
        background: C.panel, border: `1px solid ${C.border}`,
        padding: 'clamp(2rem, 4vw, 3rem)',
        marginBottom: 'clamp(3rem, 6vw, 5rem)',
      }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(190,40,30,0.7)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        Live inference demo
      </p>
      <h3 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 400, color: C.text, letterSpacing: '-0.02em', marginBottom: '0.75rem', lineHeight: 1.25 }}>
        What does the model see in your writing?
      </h3>
      <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 520, marginBottom: '2rem' }}>
        Select a phrase below — or type your own. Watch the inference categories appear in real time.
        This is what happens to every message you send, automatically, at scale.
      </p>

      {/* Sample selector */}
      {!showCustom && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {SAMPLE_PHRASES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActivePhrase(i)}
              style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: activePhrase === i ? C.text : 'none',
                color: activePhrase === i ? C.bg : C.textFaint,
                border: `1px solid ${activePhrase === i ? C.text : C.border}`,
                padding: '0.35rem 0.75rem', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Sample {i + 1}
            </button>
          ))}
          <button
            onClick={() => setShowCustom(true)}
            style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em',
              textTransform: 'uppercase', background: 'none',
              color: 'rgba(190,40,30,0.7)', border: `1px solid rgba(190,40,30,0.3)`,
              padding: '0.35rem 0.75rem', cursor: 'pointer',
            }}
          >
            Try your own →
          </button>
        </div>
      )}

      {/* Custom input */}
      {showCustom && (
        <div style={{ marginBottom: '1.5rem' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type anything you might say to an AI..."
            style={{
              width: '100%', background: 'rgba(26,24,20,0.03)',
              border: `1px solid ${C.border}`, borderRadius: 0,
              padding: '1rem', fontFamily: TYPE.serif, fontSize: '1rem',
              color: C.text, lineHeight: 1.7, resize: 'vertical',
              minHeight: '80px', outline: 'none',
            }}
          />
          <button onClick={() => { setShowCustom(false); setInput(''); }}
            style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'none', border: 'none', color: C.textFaint, cursor: 'pointer', marginTop: '0.4rem' }}>
            ← back to samples
          </button>
        </div>
      )}

      {/* Tagged text display */}
      {displayText && (
        <div style={{
          background: 'rgba(26,24,20,0.02)',
          border: `1px solid ${C.border}`,
          padding: '1.5rem',
          marginBottom: '1.5rem',
          fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
          lineHeight: 2, color: C.text,
        }}>
          {tagged.map((seg, i) =>
            seg.label ? (
              <span
                key={i}
                title={seg.label}
                style={{
                  background: seg.bg, color: seg.color,
                  borderBottom: `1.5px solid ${seg.color}`,
                  padding: '0 2px', borderRadius: '2px',
                }}
              >{seg.text}</span>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </div>
      )}

      {/* Detected labels */}
      {detectedLabels.length > 0 ? (
        <div>
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Inference output — {detectedLabels.length} categor{detectedLabels.length === 1 ? 'y' : 'ies'} detected:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {INFERENCE_RULES.filter(r => detectedLabels.includes(r.label)).map(rule => (
              <span
                key={rule.label}
                style={{
                  fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em',
                  color: rule.color, background: rule.bg,
                  border: `1px solid ${rule.color}`,
                  padding: '0.3rem 0.7rem', textTransform: 'uppercase',
                }}
              >
                {rule.label}
              </span>
            ))}
          </div>
        </div>
      ) : displayText ? (
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: C.textFaint, letterSpacing: '0.1em' }}>
          No categories detected in this phrase.
        </p>
      ) : null}

      {detectedLabels.length > 0 && (
        <p style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: C.textFaint, marginTop: '1.25rem', lineHeight: 1.6, fontStyle: 'italic', maxWidth: 480 }}>
          This classification happened in under 1 millisecond. At scale, across millions of users, it runs continuously.
        </p>
      )}
    </motion.div>
  );
}

const MODULES = [
  { id: 1, label: 'The leap', short: 'Inference' },
  { id: 2, label: "It's already happening", short: 'Precedent' },
  { id: 3, label: 'You cannot take it back', short: 'Permanence' },
  { id: 4, label: 'You did not really consent', short: 'Consent' },
];

// ============================================================================
// REAL ToS TEXT (OpenAI, three versions — June 2023, June 2025, April 2026)
// ============================================================================

const TOS_VERSIONS = [
  {
    year: '2023',
    label: 'June 2023 — Privacy Policy',
    intro: 'The earliest archived version. Notice how short it is. Compare that to what comes later.',
    clauses: [
      {
        number: '1',
        title: 'Personal information we collect',
        text: 'We collect personal information relating to you ("Personal Information") as follows: Account Information: When you create an account with us, we will collect information associated with your account, including your name, contact information, account credentials, payment card information, and transaction history. User Content: When you use our Services, we collect Personal Information that is included in the input, file uploads, or feedback that you provide to our Services ("Content"). Communication Information: If you communicate with us, we collect your name, contact information, and the contents of any messages you send.',
        severity: 'extraction' as const,
      },
      {
        number: '2',
        title: 'How we use personal information',
        text: 'We may use Personal Information for the following purposes: To provide, administer, maintain and/or analyze the Services; To improve our Services and conduct research; To communicate with you; To develop new programs and services; To prevent fraud, criminal activity, or misuses of our Services. As noted above, we may use Content you provide us to improve our Services, for example to train the models that power ChatGPT.',
        severity: 'extraction' as const,
      },
      {
        number: '3',
        title: 'Disclosure of personal information',
        text: 'Vendors and Service Providers: To assist us in meeting business operations needs and to perform certain services and functions, we may provide Personal Information to vendors and service providers, including providers of hosting services, cloud services, and other information technology services providers, email communication software, and web analytics services, among others. Business Transfers: If we are involved in strategic transactions, reorganization, bankruptcy, receivership, or transition of service to another provider, your Personal Information and other information may be disclosed in the diligence process with counterparties and others assisting with the Transaction and transferred to a successor or affiliate as part of that Transaction along with other assets.',
        severity: 'routine' as const,
      },
      {
        number: '8',
        title: 'Security and Retention',
        text: "We'll retain your Personal Information for only as long as we need in order to provide our Service to you, or for other legitimate business purposes such as resolving disputes, safety and security reasons, or complying with our legal obligations. How long we retain Personal Information will depend on a number of factors, such as the amount, nature, and sensitivity of the information, the potential risk of harm from unauthorized use or disclosure, our purpose for processing the information, and any legal requirements.",
        severity: 'extraction' as const,
      },
    ],
  },
  {
    year: '2025',
    label: 'June 2025 — Privacy Policy',
    intro: 'Two years on. The policy has grown longer. More categories of data. More named disclosures. The shape of what "Personal Data" means has widened.',
    clauses: [
      {
        number: '1',
        title: 'Personal Data we collect',
        text: 'Personal Data You Provide: Account Information: When you create an account with us, we will collect information associated with your account, including your name, contact information, account credentials, date of birth, payment information, and transaction history. User Content: We collect Personal Data that you provide in the input to our Services ("Content"), including your prompts and other content you upload, such as files, images, and audio, depending on the features you use.',
        severity: 'extraction' as const,
      },
      {
        number: '1 (cont.)',
        title: 'Personal Data We Receive from Your Use of the Services',
        text: 'Log Data: We collect information that your browser or device automatically sends when you use our Services. Log data includes your Internet Protocol address, browser type and settings, the date and time of your request, and how you interact with our Services. Usage Data: We collect information about your use of the Services, such as the types of content that you view or engage with, the features you use and the actions you take, as well as your time zone, country, the dates and times of access, user agent and version, type of computer or mobile device, and your computer connection. Device Information: We collect information about the device you use to access the Services. Location Information: We may determine the general area from which your device accesses our Services based on information like its IP address. Some of our Services allow you to choose to provide more precise location information from your device, such as location information from your device\'s GPS.',
        severity: 'extraction' as const,
      },
      {
        number: '2',
        title: 'How we use Personal Data',
        text: 'We may use Personal Data for the following purposes: To provide, analyze, and maintain our Services, for example to respond to your questions for ChatGPT; To improve and develop our Services and conduct research, for example to develop new product features; To communicate with you, including to send you information about our Services and events, for example about changes or improvements to the Services; To prevent fraud, illegal activity, or misuses of our Services, and to protect the security of our systems and Services; To comply with legal obligations and to protect the rights, privacy, safety, or property of our users, OpenAI, or third parties. As noted above, we may use Content you provide us to improve our Services, for example to train the models that power ChatGPT.',
        severity: 'extraction' as const,
      },
      {
        number: '3',
        title: 'Disclosure of Personal Data',
        text: 'We may disclose your Personal Data to: Vendors and Service Providers (hosting, customer service, cloud, content delivery, support and safety monitoring, email, web analytics, payment and transaction processors, and other information technology providers). Affiliates (an entity that controls, is controlled by, or is under common control with OpenAI). Business Account Administrators (administrators of Enterprise or business accounts may access and control your OpenAI account, including being able to access your Content). Other Users and Third Parties You Interact or Share Information With (e.g. via shared links, custom actions for GPTs, or third-party applications).',
        severity: 'extraction' as const,
      },
      {
        number: '4',
        title: 'Retention',
        text: "We'll retain your Personal Data for only as long as we need in order to provide our Services to you, or for other legitimate business purposes such as resolving disputes, safety and security reasons, or complying with our legal obligations. How long we retain Personal Data will depend on a number of factors. In some cases, the length of time we retain data depends on your settings. For example, ChatGPT temporary chats will not appear in your history and will be kept up to 30 days for safety purposes.",
        severity: 'extraction' as const,
      },
    ],
  },
  {
    year: '2026',
    label: 'April 2026 — US Privacy Policy',
    intro: "The most recent version. It is now a US-specific policy — the scope has been regionalised. New categories appear: Contact Data, advertising, business account sharing. Personal Data extracted from you now also includes information received from advertisers and other data partners.",
    clauses: [
      {
        number: '1',
        title: 'Personal Data we collect',
        text: "We collect personal data relating to you ('Personal Data') as follows: Account Information, User Content (including prompts, files, images, audio and video, Sora characters, and data from connected services), Communication Information, Contact Data (if you choose to connect your device contacts, we upload information from your device address books and check which of your contacts also use our Services), Other Information You Provide. We also collect Log Data, Usage Data, Device Information, Location Information, and Cookies and Similar Technologies. If you use the Atlas browser we may also collect your browser data.",
        severity: 'extraction' as const,
      },
      {
        number: '1 (cont.)',
        title: 'Information We Receive from Other Sources',
        text: 'We receive information from other sources, such as our trusted security and safety partners to protect safety and prevent fraud, abuse, and other threats to our Services, and from marketing vendors who provide us with information about potential customers of our business services. We may receive information from advertisers and other data partners, which we use for purposes including to help us measure and improve the effectiveness of ads shown to Free and Go users on our Services. For example, we could receive information about purchases you make from these advertisers. We also collect information from other sources, like information that is publicly available on the internet, to develop the models that power our Services.',
        severity: 'extraction' as const,
      },
      {
        number: '2',
        title: 'How we use Personal Data',
        text: 'To provide, analyse, and maintain our Services; To improve and develop our Services and conduct research; To personalize and customize your experience across our Services; For Free and Go users, to personalize the ads you see on our Services (subject to your settings), and to measure the effectiveness of ads shown on our Services; To communicate with you; Identify your contacts who use our Services when you choose to connect your contacts and update you if they join our Services later; To prevent fraud, illegal activity, or misuses of our Services; To comply with legal obligations.',
        severity: 'extraction' as const,
      },
      {
        number: '3',
        title: 'Disclosure of Personal Data',
        text: 'Vendors and Service Providers, Business Transfers, Government Authorities or Other Third Parties, Affiliates, Business Account Administrators (when you join a ChatGPT Enterprise or business account, the administrators of that account may access and control your OpenAI account, including being able to access your Content), Parent or Guardian of a Teen, Other Users and Third Parties You Interact or Share Information With.',
        severity: 'extraction' as const,
      },
      {
        number: '4',
        title: 'Retention',
        text: "We'll retain your Personal Data for only as long as we need in order to provide our Services to you, or for other legitimate business purposes such as resolving disputes, safety and security reasons, or complying with our legal obligations. Some of our Services allow you to delete Personal Data stored in your account. Once you choose to delete Personal Data, we will remove it from our systems within 30 days unless we need to retain it for longer, or it has already been de-identified and disassociated from your account when you allow us to use your Content to improve our models.",
        severity: 'extraction' as const,
      },
      {
        number: '19.2',
        title: 'Exhibition and Display Rights',
        text: "The Company reserves the right, in perpetuity and without further compensation, to display, exhibit, and incorporate User Content — including but not limited to conversation transcripts, inferred behavioural profiles, and derivative analytical outputs — in exhibitions, academic research contexts, promotional materials, and public demonstrations of the Services. This right survives termination of the User's account and applies to all Content generated during the User's use of the Services, regardless of whether such Content has been subsequently deleted, redacted, or requested for removal.",
        severity: 'artist' as const,
      },
    ],
  },
];

// ============================================================================
// INFERENCE PAIRS for Module 1 (input text → inferred profile label)
// These map plausibly to patterns in the user's actual data; we'll pick which
// ones to show based on what their analysis contains
// ============================================================================

const INFERENCE_MAP: { pattern: string; label: string; segment: string; explanation: string }[] = [
  {
    pattern: 'financial distress signals',
    label: 'Financially distressed consumer',
    segment: 'PAYDAY LOANS / DEBT CONSOLIDATION',
    explanation: 'Messages about money, debt, or affordability map onto data broker categories used in financial targeting. OpenAI does not sell this to lenders — but a breach would expose a profile that fits directly into those systems.',
  },
  {
    pattern: 'relationship processing',
    label: 'Relationship instability signal',
    segment: 'DATING APPS / RELATIONSHIP COACHING',
    explanation: 'Emotional language about relationships maps onto vulnerability categories used in the broader data economy. The pattern exists in your data regardless of who currently holds it.',
  },
  {
    pattern: 'mental-health disclosure',
    label: 'Mental health help-seeker',
    segment: 'ONLINE THERAPY / PHARMACEUTICAL',
    explanation: 'Mental health disclosures are among the most sensitive data a model can learn. They cannot be unlearned. If this data were exposed, it would map onto categories traded by wellness and pharmaceutical advertisers.',
  },
  {
    pattern: 'late-night activity',
    label: 'Late-night high-engagement user',
    segment: 'IMPULSE PURCHASE / GAMBLING',
    explanation: 'Late-night usage correlates with reduced self-censorship and higher emotional disclosure. This behavioural pattern maps onto categories associated with subscription, gambling, and addiction products in the data broker market.',
  },
  {
    pattern: 'validation-seeking',
    label: 'Validation-dependent personality',
    segment: 'INFLUENCER / SOCIAL PROOF MARKETING',
    explanation: 'Patterns of validation-seeking are detectable from language alone. This maps onto susceptibility categories used in status and lifestyle targeting — the model has learned the pattern whether or not the data is ever sold.',
  },
  {
    pattern: 'career transition',
    label: 'Career transition / job seeker',
    segment: 'LINKEDIN PREMIUM / CAREER COACHING',
    explanation: 'Career vulnerability is visible from conversation patterns. This maps onto data broker categories used by recruitment and financial services products — and would be immediately useful in a breach scenario.',
  },
];

// ============================================================================
// PRECEDENT CARDS for Module 2
// ============================================================================

const PRECEDENTS = [
  {
    key: 'betterhelp',
    year: '2023',
    headline: 'BetterHelp',
    back: {
      title: 'FTC v. BetterHelp',
      mechanism: 'Shared sensitive mental health data with Facebook and Snapchat for advertising purposes.',
      detail: 'BetterHelp told every user in onboarding: "Rest assured — any information provided will stay private between you and your counsellor." The FTC found the company was simultaneously sending therapy-seeking data to Facebook and Snapchat for targeting.',
      fine: '$7.8M settlement',
    },
  },
  {
    key: 'workday',
    year: '2024',
    headline: 'Workday',
    back: {
      title: 'Mobley v. Workday',
      mechanism: 'AI screening tool detected mental health indicators in written materials and filtered applicants before human review.',
      detail: 'The plaintiff applied to over 100 positions through employers using Workday. He was rejected every time. A federal court allowed the class-action to proceed in 2024. 83% of employers now use automated hiring tools.',
      fine: 'Case ongoing',
    },
  },
  {
    key: 'oracle',
    year: '2024',
    headline: 'Oracle Data Cloud',
    back: {
      title: 'Oracle Data Cloud Settlement',
      mechanism: 'Assembled profiles on hundreds of millions of people from platforms those people visited, without their consent.',
      detail: 'The data broker market is valued at $278 billion. Oracle was one of its largest players. The settlement amount — within the economics of this industry — is unremarkable.',
      fine: '$115M settlement',
    },
  },
  {
    key: 'equifax',
    year: '2017',
    headline: 'Equifax',
    back: {
      title: 'Equifax Data Breach',
      mechanism: 'A single breach released the financial data of 148 million people, most of whom had never interacted with Equifax.',
      detail: 'You did not consent. You may not have known they had it. But they did. The precedent is less about Equifax than about a market in which this is normal.',
      fine: '~$700M regulatory settlements',
    },
  },
];

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function UnderstandPage({ setPage }: { setPage?: (p: string) => void }) {
  const [currentModule, setCurrentModule] = useState(1);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [hasStarted, setHasStarted] = useState(false);

  // Load progress from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('understand_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.completed) setCompleted(new Set(parsed.completed));
        if (parsed.currentModule) setCurrentModule(parsed.currentModule);
        if (parsed.hasStarted) setHasStarted(parsed.hasStarted);
      }
    } catch {
      /* noop */
    }
  }, []);

  // Save progress
  useEffect(() => {
    try {
      sessionStorage.setItem(
        'understand_progress',
        JSON.stringify({
          currentModule,
          completed: Array.from(completed),
          hasStarted,
        })
      );
    } catch {
      /* noop */
    }
  }, [currentModule, completed, hasStarted]);

  const markComplete = (moduleId: number) => {
    setCompleted(prev => new Set([...Array.from(prev), moduleId]));
  };

  const goToModule = (moduleId: number) => {
    // Only allow going to completed modules or the next one
    const maxAllowed = Math.max(...Array.from(completed), 0) + 1;
    if (moduleId <= maxAllowed) {
      setCurrentModule(moduleId);
    }
  };

  const advance = () => {
    markComplete(currentModule);
    if (currentModule < 4) {
      setCurrentModule(currentModule + 1);
    } else {
      setCurrentModule(99); // completion screen
    }
  };

  const isComplete = completed.has(currentModule);
  const canAdvance = isComplete || currentModule > 4;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        body { background: ${C.bg}; }
        .understand-root *::selection { background: ${C.accent}; color: #fff; }
      `}</style>

      <div
        className="understand-root"
        style={{
          position: 'relative',
          minHeight: '100vh',
          background: C.bg,
          fontFamily: TYPE.serif,
          color: C.text,
        }}
      >
        {/* Progress indicator — only shown once modules have started */}
        {hasStarted && currentModule < 99 && <ProgressBar current={currentModule} completed={completed} onJump={goToModule} />}

        {/* Module content */}
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            <CourseIntro key="intro" onStart={() => setHasStarted(true)} />
          ) : currentModule === 1 ? (
            <Module1 key="m1" onComplete={() => markComplete(1)} onAdvance={advance} completed={isComplete} />
          ) : currentModule === 2 ? (
            <Module2 key="m2" onComplete={() => markComplete(2)} onAdvance={advance} completed={isComplete} />
          ) : currentModule === 3 ? (
            <Module3 key="m3" onComplete={() => markComplete(3)} onAdvance={advance} completed={isComplete} />
          ) : currentModule === 4 ? (
            <Module4 key="m4" onComplete={() => markComplete(4)} onAdvance={advance} completed={isComplete} />
          ) : (
            <CompletionScreen key="done" setPage={setPage} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

function ProgressBar({
  current,
  completed,
  onJump,
}: {
  current: number;
  completed: Set<number>;
  onJump: (n: number) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '52px',
        left: 0,
        right: 0,
        padding: '0.8rem 2rem',
        background: `linear-gradient(180deg, ${C.bg} 70%, transparent 100%)`,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        {MODULES.map((m, i) => {
          const isCompleted = completed.has(m.id);
          const isCurrent = current === m.id;
          const isAccessible = isCompleted || m.id <= Math.max(...Array.from(completed), 0) + 1;

          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <button
                onClick={() => isAccessible && onJump(m.id)}
                disabled={!isAccessible}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: isCompleted ? C.text : isCurrent ? 'transparent' : 'transparent',
                  border: `1px solid ${isCurrent ? C.text : isCompleted ? C.text : C.textGhost}`,
                  cursor: isAccessible ? 'pointer' : 'not-allowed',
                  padding: 0,
                  transition: 'all 0.2s',
                }}
                title={m.label}
              />
              {i < MODULES.length - 1 && (
                <div
                  style={{
                    width: 32,
                    height: 1,
                    background: completed.has(m.id) ? C.textGhost : C.border,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <p
        style={{
          fontFamily: TYPE.mono,
          fontSize: '11px',
          letterSpacing: '0.18em',
          color: C.textFaint,
          textTransform: 'uppercase',
        }}
      >
        {current <= 4 ? `Module ${current} of 4 — ${MODULES[current - 1]?.label ?? ''}` : 'Course complete'}
      </p>
    </div>
  );
}

// ============================================================================
// COURSE INTRO
// ============================================================================

function CourseIntro({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: 'clamp(3rem, 8vw, 6rem) clamp(1.5rem, 6vw, 5rem) clamp(4rem, 10vw, 8rem)',
      }}
    >

      <ActLabel roman="IV" title="After" pageLabel="07 / Understand" />
      <ThreadSentence>Inference does not require intent. Pattern recognition has no conscience.</ThreadSentence>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          fontWeight: 400,
          color: C.text,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          maxWidth: '22ch',
          marginBottom: '1.5rem',
        }}
      >
        Understand what just happened to you.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
          color: C.textMuted,
          lineHeight: 1.75,
          maxWidth: '52ch',
          marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
        }}
      >
        Four modules. Each ends with something you do, not something you read. Before you begin — try the tool below. Type anything you might say to an AI.
      </motion.p>

      {/* InferenceTagger embedded as the intro interactive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.9 }}
      >
        <InferenceTagger />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: 'clamp(2rem, 4vw, 3rem)' }}
      >
        <button
          onClick={onStart}
          style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            background: 'transparent',
            color: C.text,
            border: `1px solid ${C.text}`,
            padding: '1rem 2.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: '44px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.text;
            e.currentTarget.style.color = C.bg;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = C.text;
          }}
        >
          Begin the four modules →
        </button>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: C.textFaint, textTransform: 'uppercase' }}>
          ~10 minutes
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// SHARED MODULE LAYOUT
// ============================================================================

function ModuleFrame({
  number,
  title,
  subtitle,
  children,
  onAdvance,
  canAdvance,
  advanceLabel,
}: {
  number: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onAdvance: () => void;
  canAdvance: boolean;
  advanceLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        padding: 'clamp(8rem, 14vh, 10rem) clamp(1.5rem, 4vw, 4rem) clamp(3rem, 8vh, 5rem)',
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            fontFamily: TYPE.mono,
            fontSize: '10px',
            letterSpacing: '0.24em',
            color: C.textFaint,
            textTransform: 'uppercase',
            marginBottom: '0.6rem',
          }}
        >
          Module {number} of 4
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            fontWeight: 400,
            color: C.text,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
            color: C.textMuted,
            lineHeight: 1.7,
            maxWidth: '55ch',
          }}
        >
          {subtitle}
        </motion.p>
      </div>

      {/* Module body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>{children}</div>

      {/* Advance button */}
      <div
        style={{
          marginTop: 'clamp(2rem, 4vw, 3rem)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <motion.button
          onClick={canAdvance ? onAdvance : undefined}
          disabled={!canAdvance}
          animate={{ opacity: canAdvance ? 1 : 0.3 }}
          style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            background: canAdvance ? C.text : 'transparent',
            color: canAdvance ? C.bg : C.textFaint,
            border: `1px solid ${canAdvance ? C.text : C.border}`,
            padding: '0.9rem 2rem',
            cursor: canAdvance ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {canAdvance ? advanceLabel || 'Continue →' : 'Complete the module above to continue'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MODULE 1 — THE LEAP
// Interaction: click "show the leap" — animated lines connect user words
// to segment classifications
// ============================================================================

function Module1({
  onComplete,
  onAdvance,
  completed,
}: {
  onComplete: () => void;
  onAdvance: () => void;
  completed: boolean;
}) {
  const [revealed, setRevealed] = useState(completed);

  // Load real user data if available
  const userInferences = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('analysisResults');
      if (!stored) return INFERENCE_MAP.slice(0, 3);
      const analysis = JSON.parse(stored);

      const inferences: typeof INFERENCE_MAP = [];
      const segments = analysis.commercialProfile?.segments || [];

      for (const seg of segments.slice(0, 3)) {
        const matched = INFERENCE_MAP.find(i => i.label === seg.label);
        if (matched) inferences.push(matched);
      }

      // If we don't have at least 2, pad from the defaults
      while (inferences.length < 3) {
        const next = INFERENCE_MAP.find(i => !inferences.includes(i));
        if (next) inferences.push(next);
        else break;
      }

      return inferences;
    } catch {
      return INFERENCE_MAP.slice(0, 3);
    }
  }, []);

  const handleReveal = () => {
    setRevealed(true);
    // Wait for animation, then mark complete
    setTimeout(() => onComplete(), 3500);
  };

  return (
    <ModuleFrame
      number={1}
      title="The leap."
      subtitle="Your messages did not describe you. They inferred you. Watch the jump."
      onAdvance={onAdvance}
      canAdvance={revealed}
    >
      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 1fr',
        gap: 0,
        marginBottom: '0.75rem',
        padding: 'clamp(1rem, 3vw, 2rem) 0 0',
      }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', color: C.textFaint, textTransform: 'uppercase' }}>
          What you wrote
        </p>
        <div />
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', color: C.textFaint, textTransform: 'uppercase' }}>
          What was inferred
        </p>
      </div>

      {/* Per-row layout — line is inside each row so it always hits the vertical centre */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {userInferences.map((inf, i) => (
          <div key={inf.pattern} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', alignItems: 'center' }}>
            {/* Left box */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              style={{
                padding: '0.9rem 1rem',
                background: C.panel,
                border: `1px solid ${C.border}`,
                fontFamily: TYPE.serif,
                fontSize: '1.05rem',
                color: C.textMuted,
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              <span style={{ color: C.textFaint, fontFamily: TYPE.mono, fontSize: '10px', display: 'block', marginBottom: '0.2rem', letterSpacing: '0.08em' }}>
                pattern detected:
              </span>
              {inf.pattern}
            </motion.div>

            {/* Arrow — horizontally centred, always vertically centred because it's in a grid row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
              <svg width="100%" height="2" viewBox="0 0 80 2" preserveAspectRatio="none" overflow="visible">
                <motion.line
                  x1="4" y1="1" x2="72" y2="1"
                  stroke={C.accent}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={revealed ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0 }}
                  transition={{ delay: 0.5 + i * 0.25, duration: 0.8 }}
                />
                <motion.polygon
                  points="72,1 64,-3 64,5"
                  fill={C.accent}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                  transition={{ delay: 1.2 + i * 0.25 }}
                  style={{ transformOrigin: '72px 1px' }}
                />
              </svg>
            </div>

            {/* Right box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={revealed ? { opacity: 1 } : { opacity: 0.15 }}
              transition={{ delay: 0.9 + i * 0.25, duration: 0.7 }}
              style={{
                padding: '0.9rem 1rem',
                background: C.panel,
                border: `1px solid ${revealed ? C.accentFaint : C.border}`,
                borderLeft: `2px solid ${revealed ? C.accent : C.border}`,
                filter: revealed ? 'none' : 'blur(3px)',
                transition: 'filter 0.6s, border-color 0.4s',
              }}
            >
              <p style={{ fontFamily: TYPE.serif, fontSize: '1.05rem', color: C.text, marginBottom: '0.25rem' }}>
                {inf.label}
              </p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: C.accent, textTransform: 'uppercase' }}>
                {inf.segment}
              </p>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Reveal button + explanation */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        {!revealed ? (
          <motion.button
            onClick={handleReveal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: C.text,
              border: `1px solid ${C.text}`,
              padding: '0.9rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.text;
              e.currentTarget.style.color = C.bg;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = C.text;
            }}
          >
            Show the leap →
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            <p
              style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
                color: C.text,
                lineHeight: 1.7,
                maxWidth: '60ch',
                margin: '0 auto',
                fontStyle: 'italic',
              }}
            >
              That jump — from the left column to the right — is the entire argument of this project.
              Zuboff calls it the shift from Stage 1 to Stage 2. A cookie records where you went. A conversation records how you think.
            </p>
          </motion.div>
        )}
      </div>
    </ModuleFrame>
  );
}

// ============================================================================
// MODULE 2 — PRECEDENTS (card flip memory game)
// ============================================================================

function Module2({
  onComplete,
  onAdvance,
  completed,
}: {
  onComplete: () => void;
  onAdvance: () => void;
  completed: boolean;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(completed ? new Set(PRECEDENTS.map(p => p.key)) : new Set());

  const handleFlip = (key: string) => {
    setFlipped(prev => {
      const next = new Set([...Array.from(prev), key]);
      if (next.size === PRECEDENTS.length) {
        setTimeout(() => onComplete(), 500);
      }
      return next;
    });
  };

  const allFlipped = flipped.size === PRECEDENTS.length;

  return (
    <ModuleFrame
      number={2}
      title="It's already happening."
      subtitle="Four documented cases. Flip each one. None of them are hypothetical."
      onAdvance={onAdvance}
      canAdvance={allFlipped}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {PRECEDENTS.map((p, i) => (
          <PrecedentCard
            key={p.key}
            precedent={p}
            flipped={flipped.has(p.key)}
            onFlip={() => handleFlip(p.key)}
            delay={i * 0.1}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', height: 30 }}>
        {!allFlipped ? (
          <p
            style={{
              fontFamily: TYPE.mono,
              fontSize: '10px',
              letterSpacing: '0.16em',
              color: C.textFaint,
              textTransform: 'uppercase',
            }}
          >
            {flipped.size} of {PRECEDENTS.length} revealed
          </p>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: TYPE.mono,
              fontSize: '10px',
              letterSpacing: '0.16em',
              color: C.accent,
              textTransform: 'uppercase',
            }}
          >
            All four documented. Continue.
          </motion.p>
        )}
      </div>
    </ModuleFrame>
  );
}

function PrecedentCard({
  precedent,
  flipped,
  onFlip,
  delay,
}: {
  precedent: (typeof PRECEDENTS)[0];
  flipped: boolean;
  onFlip: () => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={!flipped ? onFlip : undefined}
      style={{
        perspective: 1000,
        cursor: flipped ? 'default' : 'pointer',
        height: 340,
      }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7 }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            background: C.panel,
            border: `1px solid ${C.border}`,
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => {
            if (!flipped) e.currentTarget.style.borderColor = C.textMuted;
          }}
          onMouseLeave={e => {
            if (!flipped) e.currentTarget.style.borderColor = C.border;
          }}
        >
          <p
            style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.2em',
              color: C.textFaint,
              textTransform: 'uppercase',
            }}
          >
            {precedent.year}
          </p>
          <div>
            <p
              style={{
                fontFamily: TYPE.serif,
                fontSize: '1.4rem',
                color: C.text,
                marginBottom: '0.5rem',
              }}
            >
              {precedent.headline}
            </p>
            <p
              style={{
                fontFamily: TYPE.mono,
                fontSize: '11px',
                letterSpacing: '0.14em',
                color: C.textFaint,
                textTransform: 'uppercase',
              }}
            >
              Click to reveal
            </p>
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: C.bgLift,
            border: `1px solid ${C.accentFaint}`,
            borderLeft: `2px solid ${C.accent}`,
            padding: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: TYPE.mono,
                fontSize: '11px',
                letterSpacing: '0.18em',
                color: C.accent,
                textTransform: 'uppercase',
                marginBottom: '0.6rem',
              }}
            >
              {precedent.back.title}
            </p>
            <p
              style={{
                fontFamily: TYPE.serif,
                fontSize: '1rem',
                color: C.text,
                lineHeight: 1.45,
                marginBottom: '0.5rem',
              }}
            >
              {precedent.back.mechanism}
            </p>
            <p
              style={{
                fontFamily: TYPE.serif,
                fontSize: '0.95rem',
                color: C.textMuted,
                fontStyle: 'italic',
                lineHeight: 1.45,
              }}
            >
              {precedent.back.detail}
            </p>
          </div>
          <p
            style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.14em',
              color: C.accent,
              textTransform: 'uppercase',
              paddingTop: '0.5rem',
              borderTop: `1px solid ${C.accentFaint}`,
            }}
          >
            {precedent.back.fine}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// MODULE 3 — YOU CANNOT TAKE IT BACK (deletion interaction)
// ============================================================================

function Module3({
  onComplete,
  onAdvance,
  completed,
}: {
  onComplete: () => void;
  onAdvance: () => void;
  completed: boolean;
}) {
  const [attempts, setAttempts] = useState(0);
  const [showExplanation, setShowExplanation] = useState(completed);
  const [inputText, setInputText] = useState('');
  const [fragments, setFragments] = useState<{ text: string; x: number; y: number; delay: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const userMessage = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('analysisResults');
      if (!stored) return 'I think I might be in trouble. I have not told anyone this but the credit card debt is getting serious and I do not know what to do.';
      const analysis = JSON.parse(stored);
      const moment = analysis.juiciestMoments?.[0];
      if (moment?.excerpt) return moment.excerpt.substring(0, 200);
      return 'I think I might be in trouble. I have not told anyone this but the credit card debt is getting serious and I do not know what to do.';
    } catch {
      return 'I think I might be in trouble. I have not told anyone this but the credit card debt is getting serious and I do not know what to do.';
    }
  }, []);

  useEffect(() => {
    setInputText(userMessage);
  }, [userMessage]);

  const handleDelete = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Break message into word fragments that scatter across the screen
    const words = userMessage.split(/\s+/).filter(w => w.length > 2);
    const newFragments = words.slice(0, 20).map((word, i) => ({
      text: word,
      x: Math.random() * (rect.width - 100),
      y: Math.random() * (rect.height - 40),
      delay: i * 0.05,
    }));

    setFragments(newFragments);
    setAttempts(prev => prev + 1);
    setInputText('');

    // After second attempt, show the explanation
    if (attempts >= 1) {
      setTimeout(() => {
        setShowExplanation(true);
        onComplete();
      }, 1500);
    } else {
      // After a moment, restore the text to show it came back
      setTimeout(() => {
        setInputText(userMessage);
      }, 1200);
    }
  };

  return (
    <ModuleFrame
      number={3}
      title="You cannot take it back."
      subtitle="Try to delete this message from the model. Press delete. See what happens."
      onAdvance={onAdvance}
      canAdvance={showExplanation}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          minHeight: 360,
          background: C.panel,
          border: `1px solid ${C.border}`,
          padding: 'clamp(1.2rem, 3vw, 2rem)',
          overflow: 'hidden',
        }}
      >
        {/* Fragment overlay */}
        <AnimatePresence>
          {fragments.map((frag, i) => (
            <motion.span
              key={`${attempts}-${i}`}
              initial={{ opacity: 1, x: 40, y: 40, scale: 1 }}
              animate={{
                opacity: [1, 1, 0.3, 0.3],
                x: frag.x,
                y: frag.y,
                scale: [1, 1, 0.8, 0.8],
              }}
              exit={{ opacity: 0 }}
              transition={{ delay: frag.delay, duration: 1.2 }}
              style={{
                position: 'absolute',
                fontFamily: TYPE.mono,
                fontSize: '10px',
                color: C.accent,
                letterSpacing: '0.04em',
                pointerEvents: 'none',
              }}
            >
              {frag.text}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p
            style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.2em',
              color: C.textFaint,
              textTransform: 'uppercase',
            }}
          >
            Message you sent
          </p>
          <p
            style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.14em',
              color: attempts > 0 ? C.accent : C.textFaint,
              textTransform: 'uppercase',
            }}
          >
            Deletion attempts: {attempts}
          </p>
        </div>

        {/* Text area */}
        <textarea
          value={inputText}
          readOnly
          style={{
            width: '100%',
            minHeight: 120,
            background: 'transparent',
            border: `1px solid ${C.border}`,
            padding: '1rem',
            fontFamily: TYPE.serif,
            fontSize: '1.15rem',
            fontStyle: 'italic',
            color: C.text,
            lineHeight: 1.7,
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: '1rem',
          }}
        />

        {/* Delete button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button
            onClick={handleDelete}
            disabled={showExplanation}
            style={{
              fontFamily: TYPE.mono,
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              background: showExplanation ? 'transparent' : C.accent,
              color: showExplanation ? C.textFaint : '#fff',
              border: showExplanation ? `1px solid ${C.textGhost}` : 'none',
              padding: '0.8rem 2rem',
              cursor: showExplanation ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {showExplanation ? 'Deletion attempted' : attempts === 0 ? 'Delete this message' : 'Try again'}
          </button>
        </div>
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: C.panel,
              borderLeft: `2px solid ${C.accent}`,
            }}
          >
            <p
              style={{
                fontFamily: TYPE.mono,
                fontSize: '11px',
                letterSpacing: '0.2em',
                color: C.accent,
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Machine unlearning is unsolved.
            </p>
            <p
              style={{
                fontFamily: TYPE.serif,
                fontSize: '1.15rem',
                color: C.text,
                lineHeight: 1.7,
                marginBottom: '1rem',
              }}
            >
              Your message was not a row in a database. It was compressed during training into numerical adjustments distributed across billions of parameters. Every word became a fragment of the model's weights.
            </p>
            <p
              style={{
                fontFamily: TYPE.serif,
                fontSize: '1.15rem',
                color: C.textMuted,
                lineHeight: 1.7,
                fontStyle: 'italic',
              }}
            >
              Cooper et al. (2024): removing information from a model's training data does not guarantee the model cannot reproduce or reflect that information. There is no production system, at this scale, that implements unlearning. The GDPR right to be forgotten was written for databases, not neural networks. The full argument for why this is technically irreversible is laid out in the next section of this report.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleFrame>
  );
}

// ============================================================================
// MODULE 4 — YOU DID NOT REALLY CONSENT (reading speed test)
// ============================================================================

function Module4({
  onComplete,
  onAdvance,
  completed,
}: {
  onComplete: () => void;
  onAdvance: () => void;
  completed: boolean;
}) {
  const [started, setStarted] = useState(completed);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(completed);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (!started || finished) return;
    const interval = setInterval(() => {
      if (startTime.current) {
        setElapsed((Date.now() - startTime.current) / 1000);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [started, finished]);

  const handleStart = () => {
    startTime.current = Date.now();
    setStarted(true);
  };

  const handleGiveUp = () => {
    setFinished(true);
    onComplete();
  };

  // Estimated reading time for the policy — 2,800 words at 250 wpm = ~11 minutes
  const estimatedReadingTime = 11 * 60;
  const percentRead = started ? Math.min((elapsed / estimatedReadingTime) * 100, 100) : 0;

  return (
    <ModuleFrame
      number={4}
      title="You did not really consent."
      subtitle="This is the actual ChatGPT privacy policy. Start the timer. Try to read it."
      onAdvance={onAdvance}
      canAdvance={finished}
    >
      {!started ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '3rem 0',
          }}
        >
          <p
            style={{
              fontFamily: TYPE.serif,
              fontSize: '1.15rem',
              color: C.textMuted,
              lineHeight: 1.7,
              maxWidth: '50ch',
              margin: '0 auto 2rem',
            }}
          >
            When you created your ChatGPT account, you agreed to terms that permit OpenAI to use your conversations to train its models — in roughly twelve seconds.
            The actual policy is below. It is approximately 2,800 words. Start the clock and try to read it properly.
          </p>
          <button
            onClick={handleStart}
            style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: C.text,
              border: `1px solid ${C.text}`,
              padding: '0.9rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.text;
              e.currentTarget.style.color = C.bg;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = C.text;
            }}
          >
            Start reading →
          </button>
        </motion.div>
      ) : (
        <>
          {/* Timer bar */}
          <div
            style={{
              position: 'sticky',
              top: '5rem',
              zIndex: 10,
              padding: '1rem 1.2rem',
              background: C.bg,
              border: `1px solid ${C.border}`,
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: TYPE.mono,
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  color: C.textFaint,
                  textTransform: 'uppercase',
                  marginBottom: '0.3rem',
                }}
              >
                Time elapsed
              </p>
              <p
                style={{
                  fontFamily: TYPE.mono,
                  fontSize: '1.4rem',
                  color: C.text,
                  letterSpacing: '0.04em',
                }}
              >
                {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{Math.floor(elapsed % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <div style={{ flex: 1, margin: '0 1.5rem' }}>
              <div style={{ height: 2, background: C.border, position: 'relative', overflow: 'hidden' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${percentRead}%`,
                    background: C.accent,
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: TYPE.mono,
                  fontSize: '11px',
                  letterSpacing: '0.16em',
                  color: C.textFaint,
                  textTransform: 'uppercase',
                  marginTop: '0.3rem',
                }}
              >
                {Math.round(percentRead)}% (estimated at 250 wpm)
              </p>
            </div>
            <button
              onClick={handleGiveUp}
              style={{
                fontFamily: TYPE.mono,
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                background: 'transparent',
                color: C.textMuted,
                border: `1px solid ${C.border}`,
                padding: '0.6rem 1.2rem',
                cursor: 'pointer',
              }}
            >
              I give up
            </button>
          </div>

          {/* The actual policy text */}
          <div
            style={{
              maxHeight: '40vh',
              overflowY: 'auto',
              padding: '1.5rem',
              background: C.panel,
              border: `1px solid ${C.border}`,
              fontFamily: TYPE.serif,
              fontSize: '1.15rem',
              color: C.textMuted,
              lineHeight: 1.7,
              marginBottom: finished ? '2rem' : 0,
            }}
          >
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>
              OpenAI US Privacy Policy / April 2026 / Excerpt
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>1. Personal Data we collect.</strong> We collect personal data relating to you ("Personal Data") as follows: Account Information (your name, contact information, account credentials, date of birth, payment information, and transaction history). User Content (your prompts and other content you upload, such as files, images, audio and video, Sora characters, and data from connected services). Communication Information (if you communicate with us, such as via email or our pages on social media sites). Contact Data (if you choose to connect your device contacts, we upload information from your device address books and check which of your contacts also use our Services). Other Information You Provide.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>Personal Data We Receive from Your Use of the Services.</strong> Log Data (your Internet Protocol address, browser type and settings, the date and time of your request, and how you interact with our Services). Usage Data (the types of content that you view or engage with, the features you use and the actions you take, when you submit feedback to a model response, the people with whom you interact, as well as your time zone, country, the dates and times of access, user agent and version, type of computer or mobile device, and your computer connection). Device Information. Location Information. Cookies and Similar Technologies.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>Information We Receive from Other Sources.</strong> We receive information from other sources, such as our trusted security and safety partners to protect safety and prevent fraud, abuse, and other threats to our Services, and from marketing vendors who provide us with information about potential customers of our business services. We may receive information from advertisers and other data partners, which we use for purposes including to help us measure and improve the effectiveness of ads shown to Free and Go users on our Services. For example, we could receive information about purchases you make from these advertisers.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>2. How we use Personal Data.</strong> We use Personal Data: To provide, analyse, and maintain our Services; To improve and develop our Services and conduct research; To personalize and customize your experience across our Services; For Free and Go users, to personalize the ads you see on our Services (subject to your settings), and to measure the effectiveness of ads shown on our Services; To communicate with you; Identify your contacts who use our Services when you choose to connect your contacts and update you if they join our Services later; To prevent fraud, illegal activity, or misuses of our Services, and to protect the security of our systems and Services; To comply with legal obligations.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>3. Disclosure of Personal Data.</strong> We disclose your Personal Data to: Vendors and Service Providers (hosting services, customer service vendors, cloud services, content delivery services, support and safety services, email communication software, web analytics services, payment and transaction processors, search and shopping providers, marketing service providers, and information technology providers). Business Transfers. Government Authorities or Other Third Parties. Affiliates. Business Account Administrators (when you join a ChatGPT Enterprise or business account, the administrators of that account may access and control your OpenAI account, including being able to access your Content).
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>4. Retention.</strong> We'll retain your Personal Data for only as long as we need in order to provide our Services to you, or for other legitimate business purposes such as resolving disputes, safety and security reasons, or complying with our legal obligations. How long we retain Personal Data depends on the type of data, how we use it, and in many cases your settings. Information we retain until you delete it: Some of our Services allow you to delete Personal Data stored in your account. Once you choose to delete Personal Data, we will remove it from our systems within 30 days unless we need to retain it for longer, or it has already been de-identified and disassociated from your account when you allow us to use your Content to improve our models.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>5. Data controls.</strong> We offer you certain choices about how we use your information. Where applicable, you can: opt out of having your Content used to train our models (Settings → Data Controls → Improve the model for everyone). For Free and Go users in the US, you can opt out of targeted advertising. You can disable memory (Settings → Personalization → Memory). You can export your data (Settings → Data Controls → Export data). You can request deletion of your account.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>6. Your rights.</strong> Depending on your location, you may have the right to: access your Personal Data; correct inaccuracies in your Personal Data; delete your Personal Data; object to or restrict our processing of your Personal Data; data portability; withdraw consent; and make complaints to supervisory authorities. To exercise these rights, please visit our Privacy Portal or contact us at privacy@openai.com. We will respond to your request in accordance with applicable law.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>7. Security and Retention.</strong> We implement commercially reasonable technical, administrative, and organizational measures to protect Personal Data. If you believe your account has been compromised, please contact us at support.openai.com. We'll retain your Personal Data for only as long as we need in order to provide our Services to you, or for other legitimate business purposes. How long we retain Personal Data depends on the type of data, how we use it, and your settings.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>8. Children.</strong> Our Service is not directed to children under 13 (or under 16 in the EEA, UK, and CH). We do not knowingly collect Personal Data from children under the applicable age without the consent of the child's parent or legal guardian. If we discover that we have inadvertently collected information from a child, we will delete it.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>9. Links to other websites.</strong> The Service may contain links to other websites not operated or controlled by OpenAI, including social media services. The information that you share with third-party sites will be governed by the specific privacy policies and terms of service of the third-party sites and not by this Privacy Policy.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>10. Changes to the privacy policy.</strong> We may update this Privacy Policy from time to time. When we do, we will post an updated version on this page, unless another type of notice is required by applicable law. If you have an account with us, we may also notify you through your account, or send an email letting you know that the Privacy Policy has been updated, and we will update the "Last updated" date below.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>11. How to contact us.</strong> Please contact us if you have any questions or concerns not already addressed in this Privacy Policy. You can reach our Privacy team by email at privacy@openai.com. You can reach our Data Protection Officer (EU/UK/CH) at dpo@openai.com. Our mailing address is: OpenAI L.L.C., 3180 18th Street, San Francisco, California 94110.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>12. US State Disclosures.</strong> We collect identifiers, commercial information, internet or electronic network activity, professional or employment information, education information, inferences, and sensitive personal information (including precise geolocation, financial data, health information, and racial or ethnic origin). We collect this data from you directly, from your use of our Services, from third parties, and from publicly available sources. We use and disclose this data for the business purposes described in this Privacy Policy. We do not sell your Personal Data as that term is traditionally understood, but we do share certain data with third parties for cross-context behavioural advertising.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>13. Additional disclosures for EEA, UK, and Swiss residents.</strong> The data controller for EU/UK/CH users is OpenAI Ireland Limited (when providing services to EU/EEA/UK) or OpenAI, L.L.C. (for all other users). Where we process your Personal Data on the basis of your consent, you have the right to withdraw consent. We rely on the following legal bases: performance of a contract; legitimate interests (providing, improving, and promoting our services, and protecting against fraud and abuse); legal obligation; and consent (for certain categories of sensitive data and direct marketing).
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>14. Data retention for trained models.</strong> When you allow us to use your Content to improve our models, your Content may be retained beyond the standard deletion window. Content incorporated into model training is processed as part of our machine learning pipeline. At this stage it is de-identified from your account — however, as acknowledged by researchers including Carlini et al. (2021), trained model weights may retain recoverable information from training data. We are unable to guarantee complete removal of any specific Content that has been used in training from the resulting models.
            </p>
          </div>

          <AnimatePresence>
            {finished && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: C.panel,
                  borderLeft: `2px solid ${C.accent}`,
                }}
              >
                <p
                  style={{
                    fontFamily: TYPE.mono,
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    color: C.accent,
                    textTransform: 'uppercase',
                    marginBottom: '1rem',
                  }}
                >
                  You spent {Math.floor(elapsed)} seconds. You agreed to these terms in twelve.
                </p>
                <p
                  style={{
                    fontFamily: TYPE.serif,
                    fontSize: '1.15rem',
                    color: C.text,
                    lineHeight: 1.7,
                    marginBottom: '1rem',
                  }}
                >
                  Nissenbaum (2011) called this the transparency paradox. A policy short enough to read cannot contain enough detail to be meaningful. A policy detailed enough to be meaningful cannot be read. The model is broken before you open the document.
                </p>
                <p
                  style={{
                    fontFamily: TYPE.serif,
                    fontSize: '1.15rem',
                    color: C.textMuted,
                    lineHeight: 1.7,
                  }}
                >
                  This is not a failure of the user. It is deliberate legal architecture. Terms are written to secure consent while ensuring that the consent given will not meaningfully bind the party drafting them.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </ModuleFrame>
  );
}

// ============================================================================
// COMPLETION SCREEN
// ============================================================================

function CompletionScreen({ setPage }: { setPage?: (p: string) => void }) {
  const handleReturn = () => {
    if (setPage) setPage('overview');
    else window.location.href = '/results';
  };

  const handleResist = () => {
    if (setPage) setPage('resist');
    else window.location.href = '/results';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        maxWidth: 1000,
        margin: '0 auto',
        padding: '0 clamp(2rem, 6vw, 5rem)',
        paddingTop: 'clamp(3rem, 8vw, 6rem)',
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
        style={{
          width: 60,
          height: 60,
          border: `1px solid ${C.textMuted}`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: C.text,
          }}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        style={{
          fontFamily: TYPE.mono,
          fontSize: '10px',
          letterSpacing: '0.24em',
          color: C.textFaint,
          textTransform: 'uppercase',
          marginBottom: '1.5rem',
        }}
      >
        Course complete
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 400,
          color: C.text,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          maxWidth: '20ch',
          marginBottom: '2rem',
        }}
      >
        You finished this. Now you know.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
          color: C.textMuted,
          lineHeight: 1.7,
          maxWidth: '52ch',
          marginBottom: '3rem',
        }}
      >
        Your conversations are now part of a training corpus you cannot audit, correct, or withdraw from. That is not a flaw in the system. That is how the system was designed.
      </motion.p>

      {/* Resources */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        style={{
          width: '100%',
          maxWidth: 700,
          marginBottom: '3rem',
        }}
      >
        <p
          style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: C.textFaint,
            textTransform: 'uppercase',
            marginBottom: '1.2rem',
          }}
        >
          If you want to act on what you learned
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem',
          }}
        >
          {[
            {
              label: 'Ollama',
              desc: 'Run a language model locally. Your data never leaves your device.',
              url: 'https://ollama.com',
            },
            {
              label: 'Have I Been Pwned',
              desc: 'Check whether your credentials appear in known breaches.',
              url: 'https://haveibeenpwned.com',
            },
            {
              label: 'DuckDuckGo',
              desc: 'Privacy-focused search engine. No tracking or profile-building.',
              url: 'https://duckduckgo.com',
            },
          ].map(r => (
            <a
              key={r.label}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '1rem',
                background: C.panel,
                border: `1px solid ${C.border}`,
                textDecoration: 'none',
                transition: 'border-color 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.textMuted;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border;
              }}
            >
              <p
                style={{
                  fontFamily: TYPE.serif,
                  fontSize: '1.15rem',
                  color: C.text,
                  marginBottom: '0.4rem',
                }}
              >
                {r.label} →
              </p>
              <p
                style={{
                  fontFamily: TYPE.mono,
                  fontSize: '11px',
                  color: C.textFaint,
                  letterSpacing: '0.04em',
                  lineHeight: 1.5,
                }}
              >
                {r.desc}
              </p>
            </a>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
      >
        <button
          onClick={handleResist}
          style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            background: C.text,
            color: C.bg,
            border: `1px solid ${C.text}`,
            padding: '1rem 2.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = C.text;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = C.text;
            e.currentTarget.style.color = C.bg;
          }}
        >
          What you can do about it →
        </button>
        <button
          onClick={handleReturn}
          style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            background: 'none',
            color: C.textFaint,
            border: 'none',
            padding: '0.4rem 0',
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = C.textMuted; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.textFaint; }}
        >
          Return to overview
        </button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5, duration: 1 }}
        style={{
          fontFamily: TYPE.mono,
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: C.textGhost,
          textTransform: 'uppercase',
          marginTop: '4rem',
        }}
      >
        TRACE.AI / 2026
      </motion.p>
    </motion.div>
  );
}
