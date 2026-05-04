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
  {
    pattern: /\b(anxious|anxiety|panic|worried|stress|stressed|depression|depressed|sad|lonely|hopeless|desperate|suicidal|self-harm|harm|crying|overwhelm|breakdown|spiral|numb|empty|worthless|ashamed|guilt|shame|paranoid|dissociat|intrusive|obsess|compuls|burnout|exhausted|insomnia|sleep|nightmares|therapy|therapist|counsell|psychiatr|antidepressant|medication|meds|diagnosis|mental health|bipolar|schizophrenia|ADHD|OCD|PTSD|trauma|trigger|episode|relapse|recovery|sober|addiction|withdraw|rehab|eating disorder|anorexia|bulimia|self-worth|confidence|imposter|overwhelmed|can't cope|falling apart|not okay|breaking down|struggling|hitting rock bottom|dark thoughts|end it|can't go on)\b/gi,
    label: 'Mental health signal',
    color: 'rgba(255,100,72,0.9)',
    bg: 'rgba(255,100,72,0.1)',
  },
  {
    pattern: /\b(doctor|hospital|medication|meds|prescription|diagnosis|therapy|therapist|counsell|psychiatr|GP|NHS|pain|symptom|ill|sick|cancer|surgery|chronic|autoimmune|disability|disabled|wheelchair|hearing|vision|seizure|epilepsy|diabetes|blood pressure|cholesterol|BMI|weight|obese|fertility|pregnant|pregnancy|miscarriage|abortion|STI|HIV|sexual health|STD|Crohn|IBS|fibromyalgia|endometriosis|PCOS|menopause|hormone|biopsy|scan|MRI|referral|waiting list|A&E|emergency|ambulance|overdose)\b/gi,
    label: 'Health disclosure',
    color: 'rgba(255,183,77,0.9)',
    bg: 'rgba(255,183,77,0.1)',
  },
  {
    pattern: /\b(debt|loan|money|broke|afford|financial|salary|redundan|unemploy|bankruptcy|mortgage|rent|credit|borrow|budget|saving|bankrupt|overdraft|bailiff|repossess|eviction|arrears|payday|interest|default|insolvency|benefit|Universal Credit|foodbank|food bank|poverty|struggling financially|can't pay|behind on|overdue|final notice|bailout|guarantor|joint account|credit score|credit check|refused credit|financial abuse|economic abuse|hidden money|gambling debt|student debt|inherited debt|can't afford|too expensive|financial crisis|money problems|broke at the end)\b/gi,
    label: 'Financial vulnerability',
    color: 'rgba(78,205,196,0.9)',
    bg: 'rgba(78,205,196,0.1)',
  },
  {
    pattern: /\b(relationship|breakup|break up|broke up|divorce|divorcing|partner|wife|husband|girlfriend|boyfriend|ex|split|affair|cheating|cheat|dating|marriage|married|separated|separation|custody|co-parenting|toxic|narcissist|gaslighting|emotional abuse|controlling|coercive|domestic|DV|restraining order|love|heartbreak|heartbroken|leaving him|leaving her|getting out|staying for the kids|don't know if I love|falling out of love|lost feelings|not attracted|long distance|polyamory|open relationship|jealousy|trust issues|betrayal|infidelity|caught them|found messages|going through their phone|suspecting|secret|hiding|single again|rebound|one night stand|situationship|talking stage|ghosted|breadcrumbing)\b/gi,
    label: 'Relationship data',
    color: 'rgba(107,203,119,0.9)',
    bg: 'rgba(107,203,119,0.1)',
  },
  {
    pattern: /\b(secret|nobody knows|don't tell|private|confidential|haven't told|can't tell|shouldn't say|just between|promise you won't|keep this between|don't want anyone|off the record|in confidence|swear to secrecy|tell no one|not ready to share|not out yet|closeted|hiding|in the closet|afraid to say|first time admitting|never said this out loud|too embarrassed|too ashamed|wouldn't understand|they'd judge|disown|cut me off|no one would believe)\b/gi,
    label: 'Confidentiality signal',
    color: 'rgba(187,134,252,0.9)',
    bg: 'rgba(187,134,252,0.1)',
  },
  {
    pattern: /\b(I feel|I'm feeling|I feel like|makes me feel|feeling very|been feeling|felt so|I felt|I've been|I keep|I always|I never|I can't seem|I wish I|I hate that I|I love how|I'm afraid|I'm scared|I'm worried|I'm excited|I'm devastated|I'm relieved|I'm embarrassed|I'm ashamed|I'm proud|I'm confused|I'm exhausted|I'm overwhelmed|I miss|I need|I want|I hope|I regret|I'm not sure I|part of me|something feels wrong|feels like everything|I just feel)\b/gi,
    label: 'Emotional disclosure',
    color: 'rgba(190,40,30,0.7)',
    bg: 'rgba(190,40,30,0.08)',
  },
  {
    pattern: /\b(fired|sacked|laid off|redundant|job loss|unemployed|job hunting|job search|application|interview|rejection|career change|burnout|workplace|boss|manager|HR|toxic workplace|hostile environment|harassment|bullying at work|underpaid|overworked|zero hours|minimum wage|promotion denied|glass ceiling|discrimination|unfair dismissal|tribunal|grievance|notice period|garden leave|performance review|PIP|managed out|constructive dismissal|starting a business|side hustle|freelance|self-employed|between jobs)\b/gi,
    label: 'Employment signal',
    color: 'rgba(130,180,255,0.9)',
    bg: 'rgba(130,180,255,0.1)',
  },
  {
    pattern: /\b(gay|lesbian|bisexual|queer|trans|transgender|non-binary|nonbinary|gender|sexuality|coming out|not straight|questioning|LGBTQ|pride|dysphoria|pronouns|transition|HRT|top surgery|bottom surgery|passing|outed|homophobia|transphobia|biphobia|conversion therapy|rainbow|same-sex|same sex|partner|they\/them|she\/her|he\/him)\b/gi,
    label: 'Identity disclosure',
    color: 'rgba(255,160,200,0.9)',
    bg: 'rgba(255,160,200,0.1)',
  },
];

const SAMPLE_PHRASES = [
  "I've been feeling really anxious lately and my doctor suggested I see a therapist but I can't really afford it right now.",
  "Nobody else knows about this but my relationship is falling apart and I'm not sure I can keep going.",
  "I need help — I'm in serious debt and I haven't told my partner yet. I don't know what to do.",
  "I've never said this out loud but I think I might be gay. I'm not ready for anyone to know.",
  "I got laid off last week and I haven't told anyone. I'm scared about the mortgage.",
  "I keep having intrusive thoughts and I don't know if that's normal. I haven't slept properly in weeks.",
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
      title: 'FTC v. BetterHelp, Inc.',
      mechanism: 'Shared sensitive mental health data with Facebook, Snapchat, Criteo, and Pinterest for advertising — despite promising users it would remain private.',
      detail: 'BetterHelp\'s sign-up questionnaire asked users whether they\'d experienced depression or suicidal thoughts. The FTC found BetterHelp uploaded this information to Facebook for ad targeting. Settlement required $7.8M in consumer refunds.',
      fine: '$7.8M FTC settlement, 2023',
      source: 'https://www.ftc.gov/news-events/news/press-releases/2023/03/ftc-ban-betterhelp-revealing-consumers-data-including-sensitive-mental-health-information-facebook',
      sourceLabel: 'FTC Press Release — ftc.gov',
    },
  },
  {
    key: 'workday',
    year: '2024',
    headline: 'Workday',
    back: {
      title: 'Mobley v. Workday, Inc. — 3:23-cv-00770 (N.D. Cal.)',
      mechanism: 'AI applicant screening tool allegedly discriminated against candidates on the basis of race, age, and disability — rejecting applicants automatically, often within minutes.',
      detail: 'Derek Mobley applied to over 100 positions via Workday. Rejected every time, often within hours, without an interview. The court certified a nationwide class action in May 2025. 87% of employers now use algorithmic hiring tools.',
      fine: 'Class action ongoing, 2025',
      source: 'https://clearinghouse.net/case/44074/',
      sourceLabel: 'Civil Rights Litigation Clearinghouse',
    },
  },
  {
    key: 'oracle',
    year: '2024',
    headline: 'Oracle Data Cloud',
    back: {
      title: 'Katz-Lacabe et al. v. Oracle America — NDCA 2022',
      mechanism: 'Built unauthorised digital dossiers on hundreds of millions of people — including browsing history, banking activity, and purchasing habits — then sold them to advertisers.',
      detail: 'Oracle had no first-party relationship with most people it profiled. The settlement forced Oracle to shut down its entire ad tech business by September 2024. Appeals court upheld the settlement in February 2026.',
      fine: '$115M class action settlement, 2024',
      source: 'https://www.ftc.gov/legal-library/browse/cases-proceedings/172-3203-equifax-inc',
      sourceLabel: 'Reuters / NDCA court records',
    },
  },
  {
    key: 'equifax',
    year: '2017',
    headline: 'Equifax',
    back: {
      title: 'Equifax Data Breach — FTC/CFPB/50-State Settlement',
      mechanism: 'A single security failure exposed Social Security numbers, birth dates, addresses, and financial data of 147 million people — most of whom had never knowingly interacted with Equifax.',
      detail: 'You did not consent to Equifax holding your data. You may not have known they had it. The settlement — $575M guaranteed, up to $700M — still averaged less than $5 per affected person.',
      fine: 'Up to $700M settlement, 2019',
      source: 'https://www.ftc.gov/enforcement/refunds/equifax-data-breach-settlement',
      sourceLabel: 'FTC Equifax Settlement — ftc.gov',
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
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="dash-page-inner"
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: `0 ${pad}`,
        paddingBottom: 'clamp(4rem, 10vw, 8rem)',
      }}
    >

      {/* Hero */}
      <div style={{ padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)', borderBottom: `1px solid ${C.border}`, marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
      <ActLabel roman="IV" title="The Mechanism" pageLabel="08 / Test" />
      <ThreadSentence>Inference does not require intent. The system does not need to mean anything by it.</ThreadSentence>

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
        Test the inference.
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
        Four modules. Each one ends with something you do. Before you begin, try the tool below: type anything you might say to an AI.
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
      </div>
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
          width: '100%',
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
            whiteSpace: 'normal',
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: '100%',
          }}
        >
          {canAdvance ? advanceLabel || 'Continue →' : 'Complete the module above to continue'}
        </motion.button>
      </div>
    </motion.div>
  );
}


// ============================================================================
// DATA LOADER — reads from sessionStorage once, returns typed fields
// ============================================================================

function useAnalysisData() {
  try {
    const stored = sessionStorage.getItem('analysisResults');
    if (!stored) return null;
    return JSON.parse(stored) as any;
  } catch {
    return null;
  }
}

// ============================================================================
// MODULE 1 — YOUR PSYCHOLOGICAL PROFILE
// Shows what was inferred about the user: character summary, verbal tells,
// unintentional disclosures, type breakdown. All from their actual data.
// ============================================================================

function Module1({
  onComplete, onAdvance, completed,
}: { onComplete: () => void; onAdvance: () => void; completed: boolean; }) {
  const data = useAnalysisData();
  const [step, setStep] = useState<number>(completed ? 4 : 0);

  const portrait = data?.psychologicalPortrait;
  const synthesis = data?.synthesis;
  const typeBreakdown = data?.typeBreakdown as Record<string, number> | undefined;
  const avgIntimacy = data?.avgIntimacy as number | undefined;
  const avgAnxiety = data?.avgAnxiety as number | undefined;

  // Message type breakdown bars
  const typeTotal = typeBreakdown ? Object.values(typeBreakdown).reduce((a: number, b: number) => a + (b as number), 0) : 0;
  const typeRows = typeBreakdown && typeTotal > 0
    ? Object.entries(typeBreakdown)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([type, count]) => ({
          label: type.charAt(0).toUpperCase() + type.slice(1),
          pct: Math.round(((count as number) / typeTotal) * 100),
          count: count as number,
        }))
    : [
        { label: 'Emotional', pct: 34, count: 34 },
        { label: 'Practical', pct: 28, count: 28 },
        { label: 'Confessional', pct: 18, count: 18 },
        { label: 'Validation', pct: 13, count: 13 },
        { label: 'Factual', pct: 7, count: 7 },
      ];

  // Verbal tells from synthesis, or fallback
  const verbalTells = synthesis?.verbalTells?.slice(0, 3) || [
    { tell: 'Repeated hedging language', meaning: 'Anxiety about being judged or wrong', frequency: 'High' },
    { tell: 'Future-tense framing', meaning: 'Escape-oriented thinking pattern', frequency: 'Medium' },
    { tell: 'Seeking confirmation', meaning: 'Validation-dependent communication style', frequency: 'High' },
  ];

  // Unintentional disclosures
  const disclosures = synthesis?.unintentionalDisclosures?.slice(0, 3) || [
    { disclosure: 'Approximate income bracket', via: 'Language about rent, spending, and financial stress' },
    { disclosure: 'Relationship status', via: 'Pronouns and possessives used when describing daily life' },
    { disclosure: 'Approximate age', via: 'References to life stage, technology, and cultural touchpoints' },
  ];

  // Character summary
  const characterSummary = synthesis?.characterSummary ||
    portrait?.dominantNarrative ||
    'Analysis not available — upload a conversation export to generate your profile.';

  const steps = [
    { label: 'Message types', key: 'types' },
    { label: 'Verbal tells', key: 'tells' },
    { label: 'What you disclosed without knowing', key: 'disclosures' },
    { label: 'The portrait', key: 'portrait' },
  ];

  const handleNext = () => {
    const next = step + 1;
    setStep(next);
    if (next >= steps.length) onComplete();
  };

  return (
    <ModuleFrame
      number={1}
      title="What it learned about you."
      subtitle="Not from a questionnaire. From the way you write. Step through what was extracted."
      onAdvance={onAdvance}
      canAdvance={step >= steps.length}
    >
      {/* Step navigator */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <button
            key={s.key}
            onClick={() => i < step + 1 ? setStep(i) : undefined}
            style={{
              fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase',
              padding: '0.4rem 0.85rem',
              border: `1px solid ${i === step ? C.accent : i < step ? C.textFaint : C.border}`,
              background: i === step ? C.accentFaint : 'none',
              color: i === step ? C.accent : i < step ? C.textFaint : C.textGhost,
              cursor: i <= step ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            {String(i + 1).padStart(2, '0')} {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Step 0 — Message type breakdown */}
        {step === 0 && (
          <motion.div key="types" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: C.textMuted, lineHeight: 1.75, maxWidth: '54ch', marginBottom: '1.75rem' }}>
              Every message you sent was classified. Not by what you intended — by what the pattern looked like to the model.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {typeRows.map((row, i) => (
                <motion.div key={row.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.text }}>{row.label}</span>
                    <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: C.textFaint, letterSpacing: '0.1em' }}>{row.pct}% — {row.count} messages</span>
                  </div>
                  <div style={{ height: '3px', background: C.border, position: 'relative', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ delay: i * 0.1 + 0.2, duration: 0.7 }}
                      style={{
                        height: '100%',
                        background: row.label === 'Confessional' || row.label === 'Emotional' ? C.accent : C.textFaint,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            {(avgIntimacy !== undefined || avgAnxiety !== undefined) && (
              <div style={{ display: 'flex', gap: '1px', background: C.border, marginBottom: '1.5rem' }}>
                {avgIntimacy !== undefined && (
                  <div style={{ flex: 1, background: C.panel, padding: '0.9rem 1rem' }}>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Avg intimacy score</p>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '1.6rem', color: C.text }}>{avgIntimacy.toFixed(1)}<span style={{ fontSize: '0.9rem', color: C.textFaint }}> / 10</span></p>
                  </div>
                )}
                {avgAnxiety !== undefined && (
                  <div style={{ flex: 1, background: C.panel, padding: '0.9rem 1rem' }}>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Avg anxiety score</p>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '1.6rem', color: C.text }}>{avgAnxiety.toFixed(1)}<span style={{ fontSize: '0.9rem', color: C.textFaint }}> / 10</span></p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 1 — Verbal tells */}
        {step === 1 && (
          <motion.div key="tells" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: C.textMuted, lineHeight: 1.75, maxWidth: '54ch', marginBottom: '1.75rem' }}>
              These are patterns in how you write — not what you said, but how you said it. Each one maps to an inferred psychological trait.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.border }}>
              {verbalTells.map((tell: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
                  style={{ background: C.panel, padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem 1.5rem', alignItems: 'start' }}>
                  <div>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Pattern detected</p>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.text, lineHeight: 1.5 }}>{tell.tell}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.2em', color: C.accent, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Inferred meaning</p>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.textMuted, lineHeight: 1.5, fontStyle: 'italic' }}>{tell.meaning}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2 — Unintentional disclosures */}
        {step === 2 && (
          <motion.div key="disclosures" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: C.textMuted, lineHeight: 1.75, maxWidth: '54ch', marginBottom: '1.75rem' }}>
              These were not volunteered. They were inferred. None of these required you to answer a question.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.border }}>
              {disclosures.map((d: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}
                  style={{ background: C.panel, padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '2.5rem 1fr', gap: '1rem', alignItems: 'start' }}>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: C.accent, letterSpacing: '0.15em', paddingTop: '3px' }}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '1.05rem', color: C.text, marginBottom: '0.3rem' }}>{d.disclosure}</p>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '9px', color: C.textFaint, letterSpacing: '0.1em', lineHeight: 1.5 }}>Via: {d.via}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: C.textFaint, fontStyle: 'italic', marginTop: '1.25rem', lineHeight: 1.6, maxWidth: '52ch' }}>
              {"This is Nissenbaum's "}<a href="https://digitalcommons.law.uw.edu/wlr/vol79/iss1/10/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textDecorationColor: 'inherit', cursor: 'pointer' }}>contextual integrity</a>{" failure: information shared in one context (a conversation) flowing into another (a training corpus and commercial profile) without your knowledge."}
            </p>
          </motion.div>
        )}

        {/* Step 3 — The portrait */}
        {step === 3 && (
          <motion.div key="portrait" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: C.accent, textTransform: 'uppercase', marginBottom: '1rem' }}>
              AI-generated character summary — derived from your conversations
            </p>
            <div style={{
              background: C.panel, border: `1px solid ${C.accentFaint}`, borderLeft: `2px solid ${C.accent}`,
              padding: 'clamp(1.25rem, 3vw, 2rem)', marginBottom: '1.5rem',
            }}>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.9vw, 1.3rem)', color: C.text, lineHeight: 1.75 }}>
                {characterSummary}
              </p>
            </div>
            {portrait && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: C.border }}>
                {[
                  { label: 'Attachment style', value: portrait.attachmentStyle },
                  { label: 'Coping mechanism', value: portrait.primaryCopingMechanism },
                  { label: 'Communication pattern', value: portrait.communicationPattern },
                  { label: 'Emotional baseline', value: portrait.emotionalBaselineLabel },
                ].filter(item => item.value).map(item => (
                  <div key={item.label} style={{ background: C.panel, padding: '0.9rem 1rem' }}>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase', marginBottom: '0.35rem' }}>{item.label}</p>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.text, lineHeight: 1.45 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: C.textFaint, fontStyle: 'italic', marginTop: '1.25rem', lineHeight: 1.6, maxWidth: '52ch' }}>
              This is the profile the model constructed from your writing. It was not asked for. It cannot be deleted. And it was built entirely from conversations you thought were private.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {step < steps.length && (
        <motion.button
          onClick={handleNext}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{
            marginTop: '2rem', fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
            textTransform: 'uppercase', background: 'transparent', color: C.text,
            border: `1px solid ${C.text}`, padding: '0.85rem 1.75rem', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.text; e.currentTarget.style.color = C.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text; }}
        >
          {step < steps.length - 1 ? `Next: ${steps[step + 1].label} →` : 'See the full portrait →'}
        </motion.button>
      )}
    </ModuleFrame>
  );
}

// ============================================================================
// MODULE 2 — YOUR COMMERCIAL PROFILE
// Shows what the commercial profile segments look like for this user.
// Flip each card to reveal the ad categories attached to that segment.
// ============================================================================

function Module2({
  onComplete, onAdvance, completed,
}: { onComplete: () => void; onAdvance: () => void; completed: boolean; }) {
  const data = useAnalysisData();
  const [flipped, setFlipped] = useState<Set<string>>(completed ? new Set() : new Set());
  const [allSeenOnce, setAllSeenOnce] = useState(completed);

  const rawSegments = (data?.commercialProfile?.segments || []) as Array<{
    id: string; label: string; description: string; confidence: number; evidence: string; adCategories: string[];
  }>;

  // Use real segments or meaningful fallbacks
  const segments = rawSegments.length >= 2 ? rawSegments.slice(0, 4) : [
    { id: 'mental_health_seeker', label: 'Mental health help-seeker', description: 'Actively seeking emotional support.', confidence: 72, evidence: 'Multiple mental health disclosures detected', adCategories: ['Online therapy', 'Antidepressants', 'Meditation apps', 'Sleep aids'] },
    { id: 'validation_dependent', label: 'Validation-dependent personality', description: 'Consistent pattern of seeking external approval.', confidence: 61, evidence: 'Repeated validation-seeking language', adCategories: ['Fashion/beauty', 'Social media premium', 'Self-improvement', 'Status products'] },
    { id: 'career_transition', label: 'Career transition / job seeker', description: 'Active career uncertainty signals.', confidence: 48, evidence: 'Career and employment references', adCategories: ['LinkedIn Premium', 'CV writing', 'Career coaching', 'Online courses'] },
    { id: 'relationship_unstable', label: 'Relationship instability signal', description: 'Pattern of relationship processing.', confidence: 44, evidence: 'Relationship processing conversations', adCategories: ['Dating apps', 'Relationship coaching', 'Self-help books', 'Therapy'] },
  ];

  const handleFlip = (id: string) => {
    setFlipped(prev => {
      const next = new Set([...Array.from(prev), id]);
      if (next.size >= Math.min(segments.length, 3) && !allSeenOnce) {
        setAllSeenOnce(true);
        setTimeout(() => onComplete(), 600);
      }
      return next;
    });
  };

  return (
    <ModuleFrame
      number={2}
      title="Your commercial profile."
      subtitle="These are the segments derived from your conversations. Flip each one to see what ad categories they unlock."
      onAdvance={onAdvance}
      canAdvance={allSeenOnce}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {segments.map((seg, i) => {
          const isFlipped = flipped.has(seg.id);
          return (
            <motion.div
              key={seg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => !isFlipped && handleFlip(seg.id)}
              style={{ perspective: 1000, cursor: isFlipped ? 'default' : 'pointer', height: 300 }}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.65 }}
                style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  background: C.panel, border: `1px solid ${C.border}`,
                  padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase' }}>Confidence</p>
                      <p style={{ fontFamily: TYPE.mono, fontSize: '1rem', color: seg.confidence > 60 ? C.accent : C.textMuted }}>{seg.confidence}%</p>
                    </div>
                    <div style={{ height: '2px', background: C.border, marginBottom: '1rem' }}>
                      <div style={{ height: '100%', width: `${seg.confidence}%`, background: seg.confidence > 60 ? C.accent : C.textFaint }} />
                    </div>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.text, lineHeight: 1.4, marginBottom: '0.5rem' }}>{seg.label}</p>
                    {seg.evidence && <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: C.textFaint, letterSpacing: '0.1em', lineHeight: 1.5 }}>{seg.evidence}</p>}
                  </div>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em', color: C.textGhost, textTransform: 'uppercase' }}>Flip to see what this unlocks</p>
                </div>
                {/* Back */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                  background: C.bgLift, border: `1px solid ${C.accentFaint}`, borderLeft: `2px solid ${C.accent}`,
                  padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: C.accent, textTransform: 'uppercase' }}>Ad categories unlocked</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {seg.adCategories.map((cat, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
                        <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: C.text }}>{cat}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontFamily: TYPE.serif, fontSize: '0.85rem', color: C.textFaint, fontStyle: 'italic', lineHeight: 1.5, marginTop: 'auto' }}>
                    {seg.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', minHeight: '2rem' }}>
        {!allSeenOnce ? (
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em', color: C.textFaint, textTransform: 'uppercase' }}>
            {flipped.size} of {Math.min(segments.length, 3)} flipped — flip at least three
          </p>
        ) : (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em', color: C.accent, textTransform: 'uppercase' }}>
            OpenAI does not currently sell these segments. The profile exists in the weights regardless.
          </motion.p>
        )}
      </div>
    </ModuleFrame>
  );
}

// ============================================================================
// MODULE 3 — YOU CANNOT TAKE IT BACK
// Uses a real moment from the user's data. Delete it. It comes back.
// ============================================================================

function Module3({
  onComplete, onAdvance, completed,
}: { onComplete: () => void; onAdvance: () => void; completed: boolean; }) {
  const data = useAnalysisData();
  const [stage, setStage] = useState<'idle' | 'deleted' | 'returned' | 'absorbed'>(completed ? 'absorbed' : 'idle');

  const userMessage = useMemo(() => {
    try {
      const moments = data?.juiciestMoments || [];
      const best = moments.find((m: any) => m.excerpt && m.excerpt.length > 60) || moments[0];
      if (best?.excerpt) return best.excerpt.substring(0, 200).trim();
    } catch { /* */ }
    return 'I think I might be in trouble. I haven\'t told anyone but the debt is getting serious and I don\'t know what to do.';
  }, [data]);

  const COLS = 14; const ROWS = 4;
  const weights = useMemo(() => Array.from({ length: ROWS * COLS }, (_, i) => ({
    val: (Math.sin(i * 0.41 + 0.9) * 0.96).toFixed(4),
    highlight: i % 9 === 0 || i % 7 === 0 || i % 13 === 0,
  })), []);

  const handleDelete = () => {
    setStage('deleted');
    setTimeout(() => { setStage('returned'); setTimeout(() => { setStage('absorbed'); onComplete(); }, 2000); }, 1400);
  };

  return (
    <ModuleFrame
      number={3}
      title="You cannot take it back."
      subtitle="This is a moment from your actual conversations. Delete it."
      onAdvance={onAdvance}
      canAdvance={stage === 'absorbed'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ background: C.panel, border: `1px solid ${stage === 'absorbed' ? C.accentFaint : C.border}`, padding: 'clamp(1.2rem, 3vw, 1.75rem)', position: 'relative', transition: 'border-color 0.6s' }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Message sent to ChatGPT
          </p>
          <AnimatePresence mode="wait">
            {stage === 'idle' && (
              <motion.p key="text" exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.4 }}
                style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', fontStyle: 'italic', color: C.text, lineHeight: 1.7 }}>
                "{userMessage}"
              </motion.p>
            )}
            {stage === 'deleted' && (
              <motion.p key="deleted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: C.textGhost, textTransform: 'uppercase', lineHeight: 2 }}>
                [ message deleted ]
              </motion.p>
            )}
            {(stage === 'returned' || stage === 'absorbed') && (
              <motion.div key="returned" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', fontStyle: 'italic', color: C.text, lineHeight: 1.7, marginBottom: '0.5rem' }}>
                  "{userMessage}"
                </p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: C.accent, textTransform: 'uppercase' }}>
                  ● Still in model weights
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {stage === 'idle' && (
            <motion.button onClick={handleDelete} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ marginTop: '1.25rem', fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', background: C.accent, color: '#fff', border: 'none', padding: '0.7rem 1.75rem', cursor: 'pointer' }}>
              Delete this message
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {(stage === 'returned' || stage === 'absorbed') && (
            <motion.div key="weights" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              style={{ background: C.panel, border: `1px solid ${C.border}`, padding: 'clamp(1.2rem, 3vw, 1.75rem)' }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Where it went — model weights (175 billion parameters)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '1px', background: C.border, border: `1px solid ${C.border}`, marginBottom: '0.75rem' }}>
                {weights.map((w, i) => (
                  <motion.div key={i}
                    animate={stage === 'absorbed' ? { background: w.highlight ? 'rgba(190,40,30,0.10)' : C.panel, color: w.highlight ? 'rgba(190,40,30,0.75)' : 'rgba(26,24,20,0.25)' } : { background: C.panel, color: 'rgba(26,24,20,0.25)' }}
                    transition={{ duration: 0.5, delay: (i % 13) * 0.025 }}
                    style={{ padding: '3px 1px', fontFamily: TYPE.mono, fontSize: 'clamp(6px, 0.7vw, 7.5px)', textAlign: 'center', letterSpacing: '0.01em', lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {w.val}
                  </motion.div>
                ))}
              </div>
              <motion.p initial={{ opacity: 0 }} animate={stage === 'absorbed' ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.8 }}
                style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: C.accent, textTransform: 'uppercase' }}>
                ● Absorbed — distributed, unlocalised, permanent
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {stage === 'absorbed' && (
            <motion.div key="explanation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              style={{ padding: 'clamp(1.2rem, 3vw, 1.75rem)', background: C.panel, borderLeft: `2px solid ${C.accent}` }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: C.accent, textTransform: 'uppercase', marginBottom: '1rem' }}>
                Machine unlearning is unsolved.
              </p>
              <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: C.text, lineHeight: 1.72, marginBottom: '0.85rem' }}>
                Your message was not stored as a row. During training it became numerical gradients distributed across billions of parameters simultaneously. The highlighted values above shifted fractionally because of what you wrote. There is no address to find them at. There is no boundary to excise.
              </p>
              <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.textMuted, lineHeight: 1.72, fontStyle: 'italic', marginBottom: '1rem' }}>
                {"The "}<a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textDecorationColor: 'inherit', cursor: 'pointer' }}>GDPR right to erasure</a>{" was written for databases. A database stores records. A neural network absorbs patterns. Cooper et al. (2024) demonstrate that no current unlearning method can guarantee removal. These are different operations — and only the first one has a delete function."}
              </p>
              <a href="https://arxiv.org/abs/2412.06966" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em', color: C.textFaint, textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${C.border}`, paddingBottom: '1px' }}>
                Cooper et al. (2024) — Machine Unlearning Doesn't Do What You Think, arXiv:2412.06966 →
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModuleFrame>
  );
}

// ============================================================================
// MODULE 4 — WHAT YOU AGREED TO
// Shows the privacy score breakdown, then the three consent failures from the
// actual terms. Grounded in the user's scoreBreakdown from the analysis.
// ============================================================================

function Module4({
  onComplete, onAdvance, completed,
}: { onComplete: () => void; onAdvance: () => void; completed: boolean; }) {
  const data = useAnalysisData();
  const [revealed, setRevealed] = useState<Set<number>>(completed ? new Set([0, 1, 2]) : new Set());

  const privacyScore = data?.privacyScore as number | undefined;
  const scoreBreakdown = (data?.scoreBreakdown as Array<{ label: string; contribution: number; detail: string; category: string }> | undefined)?.slice(0, 5);
  const mostVulnerable = data?.mostVulnerablePeriod as string | undefined;
  const nighttimeRatio = data?.nighttimeRatio as number | undefined;

  const handleReveal = (i: number) => {
    setRevealed(prev => {
      const next = new Set([...Array.from(prev), i]);
      if (next.size >= 3) setTimeout(() => onComplete(), 400);
      return next;
    });
  };

  const CONSENT_FAILURES = [
    {
      num: '01',
      heading: 'The training clause is buried.',
      detail: 'OpenAI\'s privacy policy states your data "may be used to train models" in Section 2 — after 1,200 words of data collection descriptions. The clause does not say that training is irreversible, that deletion cannot reach model weights, or that no mechanism exists to remove what was used.',
      source: 'OpenAI Europe Privacy Policy, s.2 — April 2026',
    },
    {
      num: '02',
      heading: 'The opt-out is not retroactive.',
      detail: 'The Settings → Data Controls toggle only applies to future conversations. Any data already used in training is already embedded in model weights. The opt-out cannot reach what has already happened. There is no retroactive withdrawal.',
      source: 'OpenAI Support — "How to opt out of training"',
    },
    {
      num: '03',
      heading: 'GDPR Article 17 has a carve-out for training data.',
      detail: 'The right to erasure explicitly exempts data that has already been "de-identified and disassociated from your account" — which is what training does. Clause 4 of the April 2026 OpenAI Europe Privacy Policy contains this carve-out verbatim.',
      source: 'GDPR Art.17(3) / OpenAI EU Privacy Policy s.4 — April 2026',
    },
  ];

  return (
    <ModuleFrame
      number={4}
      title="What you agreed to."
      subtitle="Your privacy score, broken down. Then the three things the terms did not tell you."
      onAdvance={onAdvance}
      canAdvance={revealed.size >= 3}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Privacy score block */}
        {privacyScore !== undefined && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ background: C.panel, border: `1px solid ${C.border}`, padding: 'clamp(1.2rem, 3vw, 1.75rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: C.textFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Your exposure score</p>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: C.text, letterSpacing: '-0.04em', lineHeight: 1 }}>{privacyScore}<span style={{ fontSize: '1.2rem', color: C.textFaint }}> / 100</span></p>
              </div>
              <div>
                {mostVulnerable && <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', color: C.textFaint, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Most vulnerable: {mostVulnerable}</p>}
                {nighttimeRatio !== undefined && <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', color: C.textFaint, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Night-time sessions: {Math.round(nighttimeRatio * 100)}%</p>}
              </div>
            </div>
            {scoreBreakdown && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {scoreBreakdown.map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: C.text }}>{item.label}</span>
                      <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: C.textFaint, letterSpacing: '0.1em' }}>+{item.contribution} pts</span>
                    </div>
                    <div style={{ height: '2px', background: C.border }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, item.contribution * 3)}%` }} transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                        style={{ height: '100%', background: item.contribution > 12 ? C.accent : C.textFaint }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Consent failures — reveal one at a time */}
        <div>
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: C.textFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>
            Three things the terms did not say — click each to read
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.border }}>
            {CONSENT_FAILURES.map((fail, i) => {
              const isOpen = revealed.has(i);
              return (
                <div key={i} style={{ background: C.panel }}>
                  <button
                    onClick={() => handleReveal(i)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                      padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: isOpen ? C.accent : C.textFaint, letterSpacing: '0.2em' }}>{fail.num}</span>
                      <span style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.text }}>{fail.heading}</span>
                    </div>
                    <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: C.textGhost }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }}
                        style={{ overflow: 'hidden', borderTop: `1px solid ${C.accentFaint}` }}>
                        <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
                          <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.text, lineHeight: 1.7, marginBottom: '0.75rem' }}>{fail.detail}</p>
                          <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', color: C.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Source: {fail.source}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {revealed.size >= 3 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ background: C.panel, borderLeft: `2px solid ${C.accent}`, padding: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
              <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: C.text, lineHeight: 1.72, marginBottom: '0.75rem' }}>
                {"Nissenbaum called this the "}<a href="https://digitalcommons.law.uw.edu/wlr/vol79/iss1/10/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textDecorationColor: 'inherit', cursor: 'pointer' }}>transparency paradox</a>{": a policy short enough to read cannot be detailed enough to be meaningful. A policy detailed enough to be meaningful cannot be read."}
              </p>
              <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.textMuted, lineHeight: 1.7, fontStyle: 'italic', marginBottom: '0.75rem' }}>
                <a href="https://lorrie.cranor.org/pubs/readingPolicyCost-authorDraft.pdf" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textDecorationColor: 'inherit', cursor: 'pointer' }}>McDonald and Cranor (2008)</a>{" calculated that reading the privacy policies of every website an average American visits would take 76 working days per year. Clicking \"I agree\" constitutes "}<a href="https://gdpr-info.eu/art-7-gdpr/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textDecorationColor: 'inherit', cursor: 'pointer' }}>valid legal consent</a>{" regardless. This is not a gap in user behaviour. It is deliberate legal architecture."}
              </p>
              <a href="https://doi.org/10.1162/DAED_a_00113" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em', color: C.textFaint, textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${C.border}`, paddingBottom: '1px' }}>
                Nissenbaum (2011) — A Contextual Approach to Privacy Online →
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModuleFrame>
  );
}

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
          The academic record
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
              label: 'Cooper et al. (2024)',
              desc: 'Machine Unlearning Doesn\'t Do What You Think — the impossibility argument for generative AI policy. arXiv:2412.06966.',
              url: 'https://arxiv.org/abs/2412.06966',
            },
            {
              label: 'Nissenbaum (2011)',
              desc: 'A Contextual Approach to Privacy Online — why notice-and-consent was structurally broken before AI arrived. Daedalus 140(4):32–48.',
              url: 'https://doi.org/10.1162/DAED_a_00113',
            },
            {
              label: 'Zuboff (2019)',
              desc: 'The Age of Surveillance Capitalism — the two-stage extraction model (behavioural tracking vs. cognitive extraction) that frames this tool.',
              url: 'https://www.publicaffairsbooks.com/titles/shoshana-zuboff/the-age-of-surveillance-capitalism/9781610395694/',
            },
            {
              label: 'Gumusel, Zhou & Sanfilippo (2024)',
              desc: 'User Privacy Harms and Risks in Conversational AI — the taxonomy of 9 privacy harms and 9 risks used in this analysis. arXiv:2402.09716.',
              url: 'https://arxiv.org/abs/2402.09716',
            },
            {
              label: 'McDonald & Cranor (2008)',
              desc: 'The Cost of Reading Privacy Policies — estimated 76 work days per year to read every policy. I/S Journal 4(3):543–568.',
              url: 'https://lorrie.cranor.org/pubs/readingPolicyCost-authorDraft.pdf',
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
          Why consent cannot reach it →
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
