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
      <div className="understand-inference-headers" style={{
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
        <p className="understand-inference-header-right" style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', color: C.textFaint, textTransform: 'uppercase' }}>
          What was inferred
        </p>
      </div>

      {/* Per-row layout — line is inside each row so it always hits the vertical centre */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {userInferences.map((inf, i) => (
          <div key={inf.pattern} className="understand-inference-row" style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', alignItems: 'center' }}>
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
            <div className="understand-inference-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
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
            style={{ maxWidth: '62ch', margin: '0 auto' }}
          >
            <p
              style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
                color: C.text,
                lineHeight: 1.7,
                fontStyle: 'italic',
                marginBottom: '1.25rem',
              }}
            >
              That jump — from the left column to the right — is the entire argument of this project.
              Zuboff calls it the shift from Stage 1 to Stage 2. A cookie records where you went.
              A conversation records how you think.
            </p>
            <p
              style={{
                fontFamily: TYPE.serif,
                fontSize: '1rem',
                color: C.textMuted,
                lineHeight: 1.7,
                marginBottom: '1rem',
              }}
            >
              The categories on the right are not hypothetical. They map onto documented data broker
              classifications used in targeting systems across financial services, healthcare, and advertising.
              OpenAI does not currently sell your data to those brokers — but the inference exists in the
              model's weights regardless of who holds it.
            </p>
            <a
              href="https://arxiv.org/abs/2402.09716"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: TYPE.mono,
                fontSize: '10px',
                letterSpacing: '0.16em',
                color: C.accent,
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderBottom: `1px solid rgba(190,40,30,0.3)`,
                paddingBottom: '1px',
              }}
            >
              Gumusel, Zhou &amp; Sanfilippo (2024) — User Privacy Harms in Conversational AI, arXiv:2402.09716 →
            </a>
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

      <div style={{ textAlign: 'center', marginTop: '1.5rem', minHeight: 30 }}>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}
          >
            <p
              style={{
                fontFamily: TYPE.mono,
                fontSize: '10px',
                letterSpacing: '0.16em',
                color: C.accent,
                textTransform: 'uppercase',
              }}
            >
              All four documented. Continue.
            </p>
            <a
              href="https://www.ftc.gov/business-guidance/privacy-security/privacy-enforcement"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: TYPE.mono,
                fontSize: '9px',
                letterSpacing: '0.14em',
                color: C.textFaint,
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderBottom: `1px solid ${C.border}`,
                paddingBottom: '1px',
              }}
            >
              FTC privacy enforcement record → ftc.gov
            </a>
          </motion.div>
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
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p
              style={{
                fontFamily: TYPE.mono,
                fontSize: '10px',
                letterSpacing: '0.18em',
                color: C.accent,
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                lineHeight: 1.3,
              }}
            >
              {precedent.back.title}
            </p>
            <p
              style={{
                fontFamily: TYPE.serif,
                fontSize: '0.92rem',
                color: C.text,
                lineHeight: 1.4,
                marginBottom: '0.4rem',
                fontWeight: 500,
              }}
            >
              {precedent.back.mechanism}
            </p>
            <p
              style={{
                fontFamily: TYPE.serif,
                fontSize: '0.88rem',
                color: C.textMuted,
                fontStyle: 'italic',
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
              } as React.CSSProperties}
            >
              {precedent.back.detail}
            </p>
          </div>
          <div style={{ paddingTop: '0.5rem', borderTop: `1px solid ${C.accentFaint}`, flexShrink: 0 }}>
            <p
              style={{
                fontFamily: TYPE.mono,
                fontSize: '10px',
                letterSpacing: '0.14em',
                color: C.accent,
                textTransform: 'uppercase',
                marginBottom: '0.3rem',
              }}
            >
              {precedent.back.fine}
            </p>
            {precedent.back.source && (
              <a
                href={precedent.back.source}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  fontFamily: TYPE.mono,
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  color: C.textFaint,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: '1px',
                  display: 'inline-block',
                }}
              >
                {precedent.back.sourceLabel || 'Source →'}
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// MODULE 3 — YOU CANNOT TAKE IT BACK
// Three stages: delete → text returns → absorbed into weights
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
  const [stage, setStage] = useState<'idle' | 'deleted' | 'returned' | 'absorbed'>(completed ? 'absorbed' : 'idle');

  const userMessage = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('analysisResults');
      if (!stored) return 'I think I might be in trouble. I haven\'t told anyone but the debt is getting serious and I don\'t know what to do.';
      const analysis = JSON.parse(stored);
      const moment = analysis.juiciestMoments?.[0];
      if (moment?.excerpt) return moment.excerpt.substring(0, 180).trim();
      return 'I think I might be in trouble. I haven\'t told anyone but the debt is getting serious and I don\'t know what to do.';
    } catch {
      return 'I think I might be in trouble. I haven\'t told anyone but the debt is getting serious and I don\'t know what to do.';
    }
  }, []);

  // Weight grid — fake parameter values
  const COLS = 12; const ROWS = 5;
  const weights = useMemo(() => Array.from({ length: ROWS * COLS }, (_, i) => ({
    val: (Math.sin(i * 0.41 + 0.9) * 0.96).toFixed(4),
    highlight: i % 9 === 0 || i % 7 === 0 || i % 13 === 0,
  })), []);

  const handleDelete = () => {
    setStage('deleted');
    setTimeout(() => {
      setStage('returned');
      setTimeout(() => {
        setStage('absorbed');
        onComplete();
      }, 2000);
    }, 1400);
  };

  return (
    <ModuleFrame
      number={3}
      title="You cannot take it back."
      subtitle="Delete the message below. Watch what happens."
      onAdvance={onAdvance}
      canAdvance={stage === 'absorbed'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Stage 1 — The message */}
        <div style={{
          background: C.panel,
          border: `1px solid ${stage === 'absorbed' ? C.accentFaint : C.border}`,
          padding: 'clamp(1.2rem, 3vw, 1.75rem)',
          position: 'relative',
          transition: 'border-color 0.6s',
        }}>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
            color: C.textFaint, textTransform: 'uppercase', marginBottom: '0.75rem',
          }}>
            Message sent to ChatGPT
          </p>

          <AnimatePresence mode="wait">
            {stage === 'idle' && (
              <motion.p key="text" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.4 }}
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
            <motion.button
              onClick={handleDelete}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{
                marginTop: '1.25rem',
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
                textTransform: 'uppercase', background: C.accent,
                color: '#fff', border: 'none',
                padding: '0.7rem 1.75rem', cursor: 'pointer',
              }}
            >
              Delete this message
            </motion.button>
          )}
        </div>

        {/* Stage 2 — Weight grid appears after return */}
        <AnimatePresence>
          {(stage === 'returned' || stage === 'absorbed') && (
            <motion.div
              key="weights"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                padding: 'clamp(1.2rem, 3vw, 1.75rem)',
              }}
            >
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
                color: C.textFaint, textTransform: 'uppercase', marginBottom: '0.75rem',
              }}>
                Where it went — model weights (175 billion parameters)
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gap: '1px',
                background: C.border,
                border: `1px solid ${C.border}`,
                marginBottom: '0.75rem',
              }}>
                {weights.map((w, i) => (
                  <motion.div
                    key={i}
                    animate={stage === 'absorbed' ? {
                      background: w.highlight ? 'rgba(190,40,30,0.10)' : C.panel,
                      color: w.highlight ? 'rgba(190,40,30,0.75)' : 'rgba(26,24,20,0.25)',
                    } : {
                      background: C.panel,
                      color: 'rgba(26,24,20,0.25)',
                    }}
                    transition={{ duration: 0.5, delay: (i % 13) * 0.025 }}
                    style={{
                      padding: '3px 1px',
                      fontFamily: TYPE.mono,
                      fontSize: 'clamp(6px, 0.75vw, 8px)',
                      textAlign: 'center',
                      letterSpacing: '0.01em',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {w.val}
                  </motion.div>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={stage === 'absorbed' ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                style={{
                  fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em',
                  color: C.accent, textTransform: 'uppercase',
                }}
              >
                ● Absorbed — distributed, unlocalised, permanent
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 3 — Explanation */}
        <AnimatePresence>
          {stage === 'absorbed' && (
            <motion.div
              key="explanation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              style={{
                padding: 'clamp(1.2rem, 3vw, 1.75rem)',
                background: C.panel,
                borderLeft: `2px solid ${C.accent}`,
              }}
            >
              <p style={{
                fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
                color: C.accent, textTransform: 'uppercase', marginBottom: '1rem',
              }}>
                Machine unlearning is unsolved.
              </p>
              <p style={{
                fontFamily: TYPE.serif, fontSize: '1.1rem',
                color: C.text, lineHeight: 1.72, marginBottom: '0.85rem',
              }}>
                Your message is not stored as a row. During training it was broken into numerical gradients
                distributed across billions of parameters simultaneously. The highlighted values above
                shifted fractionally because of what you wrote. There is no address to find them at.
                There is no boundary to excise.
              </p>
              <p style={{
                fontFamily: TYPE.serif, fontSize: '1rem',
                color: C.textMuted, lineHeight: 1.72, fontStyle: 'italic', marginBottom: '1rem',
              }}>
                This is not a policy position. It is a mathematical consequence. The GDPR right to erasure
                was written for databases. A database stores records. A neural network absorbs patterns.
                These are different operations — and only the first one has a delete function.
              </p>
              <a
                href="https://arxiv.org/abs/2412.06966"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
                  color: C.textFaint, textTransform: 'uppercase', textDecoration: 'none',
                  borderBottom: `1px solid ${C.border}`, paddingBottom: '1px',
                }}
              >
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
      subtitle="This is the actual OpenAI Europe Privacy Policy (1 April 2026). Start the timer. Try to read it."
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
            The full OpenAI Europe Privacy Policy is below. It is approximately 2,400 words across 13 sections. Start the clock and try to read it properly.
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase', margin: 0 }}>
                OpenAI Europe Privacy Policy — Updated 1 April 2026
              </p>
              <a
                href="https://openai.com/policies/eu-privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
                  color: C.accent, textTransform: 'uppercase', textDecoration: 'none',
                  borderBottom: `1px solid rgba(190,40,30,0.3)`, paddingBottom: '1px',
                  whiteSpace: 'nowrap',
                }}
              >
                Read at openai.com →
              </a>
            </div>
            <p style={{ marginBottom: '1rem' }}>
              <strong>1. Personal Data we collect.</strong> We collect Personal Data if you create an account to use our Services or communicate with us. <em>Account Information:</em> name, contact information, account credentials, date of birth, payment information, and transaction history. <em>User Content:</em> your prompts and other content you upload, such as files, images, audio and video, Sora characters, and data from connected services. <em>Communication Information:</em> if you communicate with us via email or social media pages. <em>Contact Data:</em> if you connect your device contacts, we upload information from your address books and check which of your contacts also use our Services. <em>Other Information You Provide:</em> when you participate in events or surveys or provide identity or age verification.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <em>Personal Data We Receive from Your Use of the Services:</em> <strong>Log Data</strong> (IP address, browser type, date and time of your request, how you interact with our Services). <strong>Usage Data</strong> (content you view or engage with, features you use, actions you take, feedback submitted, people you interact with, time zone, country, access dates and times, device type, computer connection; if you use the Atlas browser, your browser data). <strong>Device Information</strong> (device name, operating system, device identifiers, browser). <strong>Location Information</strong> (general area from IP for security and to improve your experience; precise GPS if you choose to provide it). <strong>Cookies and Similar Technologies</strong> (to operate and administer our Services and improve your experience).
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <em>Information We Receive from Other Sources:</em> We receive information from trusted security and safety partners to protect against fraud, abuse, and other threats. We receive information from marketing vendors about potential customers. We also collect information from publicly available sources on the internet to develop the models that power our Services.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>2. How we use Personal Data.</strong> To provide, analyse, and maintain our Services; to improve and develop our Services and conduct research; to personalise and customise your experience across our Services; to communicate with you and send information about our Services and events; to identify your contacts who use our Services when you choose to connect your contacts; to prevent fraud, illegal activity, or misuses of our Services and protect the security of our systems; to comply with legal obligations and protect the rights, privacy, safety, or property of our users, OpenAI, or third parties. <em>We may use Content you provide us to improve our Services — for example, to train the models that power ChatGPT.</em>
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>3. Disclosure of Personal Data.</strong> <em>Vendors and Service Providers:</em> hosting, customer service, cloud, content delivery, support and safety, email software, analytics, payments, search and shopping, age and identity verification. <em>Business Transfers:</em> in the event of strategic transactions, reorganisation, bankruptcy, or transition of service. <em>Government Authorities or Other Third Parties:</em> where required by law, to protect rights or property, to detect fraud, to protect safety and integrity, or to protect against legal liability. <em>Affiliates:</em> entities under common control with OpenAI. <em>Business Account Administrators:</em> administrators of Enterprise or business accounts may access and control your OpenAI account, including your Content. <em>Parent or Guardian of a Teen:</em> linked accounts with parental controls and safety alerts. <em>Other Users and Third Parties You Interact or Share Information With:</em> via shared links, custom GPT actions, or third-party applications.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>4. Retention.</strong> We retain your Personal Data only as long as needed to provide our Services or for legitimate business purposes. <em>Until you delete it:</em> ChatGPT conversations, Saved Memories, your account. Once you choose to delete Personal Data, we remove it within 30 days — <strong>unless it has already been de-identified and disassociated from your account when you allow us to use your Content to improve our models.</strong> <em>Deleted automatically:</em> Temporary Chats within 30 days; Atlas incognito browsing history after session. <em>Retained for longer:</em> where legally required; to address fraud, abuse, or policy violations; for security reasons; for financial record-keeping; to verify erasure requests.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>5. Data controls.</strong> You can choose whether your Content can be used to improve and train our models; decide whether we remember details between chats; export your ChatGPT history; delete or archive chats or delete your account entirely; use Temporary Chat mode; control which cookies are used; use advertising controls; delete your Atlas browsing history or use incognito mode; unsubscribe from marketing communications.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>6. Your rights.</strong> Access your Personal Data; delete your Personal Data from our records; rectify or update your Personal Data; transfer your Personal Data to a third party (data portability); restrict how we process your Personal Data; withdraw your consent; lodge a complaint with your local data protection authority. You also have the right to object to our processing for direct marketing and to processing based on legitimate interests. <em>EEA residents:</em> Irish Data Protection Commission. <em>UK residents:</em> Information Commissioner's Office. <em>Swiss residents:</em> Federal Data Protection and Information Commissioner. A note on accuracy: ChatGPT generates responses by predicting words most likely to appear next. You should not rely on factual accuracy of outputs. If ChatGPT output contains inaccurate information about you, you can submit correction or removal requests through privacy.openai.com or to dsar@openai.com.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>7. Children.</strong> Our Services are not directed to children under 13. We do not knowingly collect Personal Data from children under 13. Users under 18 must have permission from their parent or guardian.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>8. Security.</strong> We implement commercially reasonable technical, administrative, and organisational measures designed to protect Personal Data from loss, misuse, and unauthorised access, disclosure, alteration, or destruction. No internet or email transmission is ever fully secure.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>9. Legal bases for processing (EEA/UK/Switzerland).</strong> We rely on: <em>Performance of a contract</em> (processing prompts to provide responses; processing contact information for service announcements). <em>Legitimate interests</em> (developing and improving our Services, including training our models for everyone; fraud prevention; analytics; enabling contact features). <em>Legal obligation</em> (retaining billing information; responding to lawful requests). <em>Consent</em> (certain categories of sensitive data; direct marketing).
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>10. Data transfers.</strong> OpenAI processes your Personal Data on servers outside the EEA, Switzerland, and UK — including in the United States and in countries where our affiliates, partners, or vendors operate. We rely on the European Commission's adequacy decisions, Standard Contractual Clauses (Article 46(2)(c) GDPR), and the UK International Data Transfer Addendum when transferring Personal Data.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>11. Changes to the privacy policy.</strong> We may update this policy from time to time. We will publish an updated version and effective date on this page.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>12. Data controller.</strong> EEA or Switzerland: OpenAI Ireland Limited, 1st Floor, The Liffey Trust Centre, 117–126 Sheriff Street Upper, Dublin 1, D01 YC43, Ireland. Elsewhere: OpenAI OpCo, LLC, 1455 Third Street, San Francisco, California 94158.
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>13. How to contact us.</strong> Contact support with any questions not addressed here. Write to us at privacy@openai.com. Contact our Data Protection Officer at dpo@openai.com for matters related to Personal Data processing.
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
                  background: C.panel,
                  borderLeft: `2px solid ${C.accent}`,
                  padding: 'clamp(1.2rem, 3vw, 1.75rem)',
                }}
              >
                <p style={{
                  fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
                  color: C.accent, textTransform: 'uppercase', marginBottom: '1rem',
                }}>
                  You spent {Math.floor(elapsed)} seconds. You agreed to these terms in twelve.
                </p>

                <p style={{
                  fontFamily: TYPE.serif, fontSize: '1.15rem',
                  color: C.text, lineHeight: 1.72, marginBottom: '1rem',
                }}>
                  Nissenbaum (2011) called this the transparency paradox: a policy short enough to read
                  cannot be detailed enough to be meaningful. A policy detailed enough to be meaningful
                  cannot be read. The model is broken before you open the document.
                </p>

                <p style={{
                  fontFamily: TYPE.serif, fontSize: '1.05rem',
                  color: C.textMuted, lineHeight: 1.72, marginBottom: '1rem', fontStyle: 'italic',
                }}>
                  McDonald and Cranor (2008) calculated that reading the privacy policies of every website
                  an average American visits would take 76 working days per year. OpenAI's Terms of Service
                  run to approximately 3,800 words. The legal consensus is that clicking "I agree" constitutes
                  valid consent regardless. This is not a gap in user behaviour. It is deliberate legal
                  architecture — terms written to secure consent while ensuring that consent given will not
                  meaningfully constrain the party drafting them.
                </p>

                {/* The three specific failures */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '1px',
                  background: C.border, marginBottom: '1.25rem',
                }}>
                  {[
                    { num: '01', text: 'The terms say your data "may be used to train models." They do not explain that training is irreversible, that deletion cannot reach model weights, or that no mechanism exists to remove what was used.' },
                    { num: '02', text: 'The opt-out toggle (Settings → Data Controls) only applies to future conversations. Data already used in training is already embedded. There is no retroactive opt-out.' },
                    { num: '03', text: 'The right to erasure under GDPR Article 17 explicitly exempts data that has already been de-identified and incorporated into model training. Clause 4 of the April 2026 policy contains this carve-out verbatim.' },
                  ].map((fact, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '2.5rem 1fr',
                      background: C.panel, padding: '1rem clamp(1rem, 2vw, 1.25rem)',
                      gap: '0.75rem', alignItems: 'start',
                    }}>
                      <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: C.accent, textTransform: 'uppercase', paddingTop: '3px' }}>{fact.num}</span>
                      <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: C.text, lineHeight: 1.65 }}>{fact.text}</p>
                    </div>
                  ))}
                </div>

                <a
                  href="https://doi.org/10.1162/DAED_a_00113"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
                    color: C.textFaint, textTransform: 'uppercase', textDecoration: 'none',
                    borderBottom: `1px solid ${C.border}`, paddingBottom: '1px',
                  }}
                >
                  Nissenbaum (2011) — A Contextual Approach to Privacy Online, Daedalus 140(4):32–48. doi:10.1162/DAED_a_00113 →
                </a>
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
    if (setPage) setPage('how-it-works');
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
