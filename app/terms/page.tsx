'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

const termsContent: Array<{ title: string; content: string }> = [
  {
    title: '1. What This Tool Does',
    content: `This tool analyses conversation exports from AI platforms (ChatGPT, Claude, Gemini) to demonstrate what can be inferred from that data. The analysis runs in your browser. No data is uploaded to a server during analysis.

The tool performs privacy exposure analysis, behavioural pattern detection, and risk scoring. It produces a report showing what personal information, emotional patterns, and behavioural profiles can be extracted from your conversations.

This is an educational tool. It is not a commercial product. It does not collect, store, or sell your data.`,
  },
  {
    title: '2. What Happens to Your Data',
    content: `Your uploaded conversation file is processed entirely in your browser. The file does not leave your device during the initial analysis phase.

The analysis uses OpenAI and Anthropic APIs for AI-powered enrichment. When this happens, selected excerpts from your conversations are sent to these services. This is disclosed during the upload process.

You can choose to skip the AI enrichment step. The tool will still produce a full analysis using pattern-matching algorithms alone.

No data is retained by this tool after you close your browser. Your analysis is stored in browser session storage and is cleared when you navigate away or close the tab.`,
  },
  {
    title: '3. Third-Party API Usage',
    content: `If you enable AI enrichment, the tool sends excerpts of your messages to:
- Anthropic API (Claude Haiku and Claude Sonnet models)

These services process the excerpts to identify psychological patterns, inferred beliefs, and demographic predictions. The tool does not control what these services do with the data after processing.

Anthropic's privacy policy applies to data sent to their API. You should review it before enabling AI enrichment.

If you are concerned about third-party processing, you can disable AI enrichment. The tool will still function without it.`,
  },
  {
    title: '4. Your Responsibilities',
    content: `By uploading a conversation export, you confirm:
- You own the conversation data or have permission to analyse it
- The data was obtained legally
- You understand that conversation exports may contain personal information about other people mentioned in your messages
- You accept responsibility for complying with data protection law when uploading data that references third parties

If your conversation export contains sensitive information about others, consider whether uploading it is appropriate. The tool cannot distinguish between your personal information and information about people you mentioned.`,
  },
  {
    title: '5. Limitations and Disclaimers',
    content: `This tool is provided for educational purposes. The analysis is not:
- A professional privacy audit
- Legal advice
- A guarantee of what AI platforms actually infer about you
- A complete record of all inferences that could be made

The privacy score, risk categories, and inferred attributes are algorithmic outputs. They demonstrate what is possible, not what has definitely occurred.

The tool makes no warranties about accuracy, completeness, or reliability. Results should be interpreted as illustrative, not definitive.`,
  },
  {
    title: '6. Data Retention (By This Tool)',
    content: `This tool does not retain your data after analysis. Your uploaded file and analysis results are stored temporarily in browser session storage. They are deleted when:
- You close the browser tab
- You clear your browser data
- Your browser session expires

No copy of your data is kept on any server. No database stores your analysis. No backup exists.

This only applies to this tool. It does not describe what ChatGPT, Claude, Gemini, or other AI platforms do with your original conversations. That is governed by their terms, not these.`,
  },
  {
    title: '7. Age Restriction',
    content: `You must be at least 18 years old to use this tool.

If you are under 18, do not upload any conversation data. Close this page and do not proceed.`,
  },
  {
    title: '8. Liability',
    content: `This tool is provided as-is. The creators are not liable for:
- Decisions you make based on the analysis
- Emotional distress caused by seeing your data analysed
- Consequences of sharing your analysis with others
- Data processed by third-party APIs if you enable AI enrichment
- Any other outcome of using this tool

By continuing, you acknowledge that you use this tool at your own risk.`,
  },
  {
    title: '9. Changes to These Terms',
    content: `These terms may be updated. Continued use of the tool after changes constitutes acceptance.

If you do not agree to these terms, do not use the tool.`,
  },
  {
    title: '10. Governing Law',
    content: `These terms are governed by the laws of England and Wales.

Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.`,
  },
  {
    title: '11. Contact',
    content: `This tool is an academic project created at the University of Leeds.

For questions about the project, contact the School of Media and Communication.`,
  },
];

const COLOR = {
  bg: '#eeece5',
  ink: '#1a1816',
  inkMuted: 'rgba(26,24,20,0.58)',
  inkFaint: 'rgba(26,24,20,0.32)',
  inkTrace: 'rgba(26,24,20,0.10)',
  rule: 'rgba(26,24,20,0.15)',
  accent: 'rgba(190,40,30,0.90)',
} as const;

const SERIF = "'EB Garamond', 'Times New Roman', Georgia, serif";
const MONO = "'Courier Prime', 'Courier New', ui-monospace, monospace";

export default function TermsPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const el = contentRef.current;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      const pct = total > 0 ? scrolled / total : 0;
      setScrollProgress(pct);
    };
    const el = contentRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const canAgree = scrollProgress > 0.85;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Courier+Prime:wght@400;700&display=swap');
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        body { background: ${COLOR.bg}; -webkit-font-smoothing: antialiased; }
        ::selection { background: ${COLOR.accent}; color: ${COLOR.bg}; }
      `}</style>

      <div style={{ height: '100vh', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: COLOR.bg }}>
        <header style={{
          padding: '0 clamp(1.5rem, 4vw, 3rem)',
          height: '52px',
          borderBottom: `1px solid ${COLOR.inkTrace}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: SERIF,
              fontSize: '1.1rem',
              letterSpacing: '-0.02em',
              color: COLOR.ink,
            }}>
              trace<span style={{ color: COLOR.accent }}>.ai</span>
            </span>
          </Link>
          <span style={{
            fontFamily: MONO,
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: COLOR.inkFaint,
          }}>
            Terms of Service
          </span>
        </header>

        <main
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'clamp(3rem, 6vw, 5rem) clamp(1.5rem, 4vw, 3rem)',
          }}
        >
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'clamp(3rem, 6vw, 4.5rem)' }}>
              <h1 style={{
                fontFamily: SERIF,
                fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
                fontWeight: 400,
                color: COLOR.ink,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                marginBottom: '1.2rem',
              }}>
                Terms of Service
              </h1>
              <p style={{
                fontFamily: MONO,
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: COLOR.inkFaint,
              }}>
                Effective 2 May 2026
              </p>
            </div>

            <div style={{
              marginBottom: 'clamp(3rem, 6vw, 4rem)',
              padding: '1.75rem 2rem',
              background: 'rgba(26,24,20,0.03)',
              border: `1px solid ${COLOR.inkTrace}`,
            }}>
              <p style={{
                fontFamily: SERIF,
                fontSize: 'clamp(1.05rem, 1.9vw, 1.2rem)',
                color: COLOR.inkMuted,
                lineHeight: 1.75,
                margin: 0,
              }}>
                By using this tool, you agree to these terms. Read them carefully.
                They describe what the tool does, what happens to your data, and what
                your responsibilities are. If you do not agree, do not proceed.
              </p>
            </div>

            {termsContent.map((section, i) => (
              <section
                key={section.title}
                style={{
                  marginBottom: 'clamp(2.75rem, 5vw, 3.75rem)',
                  paddingBottom: 'clamp(2.25rem, 4vw, 3.25rem)',
                  borderBottom: i < termsContent.length - 1
                    ? `1px solid ${COLOR.inkTrace}`
                    : 'none',
                }}
              >
                <h2 style={{
                  fontFamily: MONO,
                  fontSize: '12px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: COLOR.accent,
                  marginBottom: '1.25rem',
                  fontWeight: 700,
                }}>
                  {section.title}
                </h2>
                <div style={{
                  fontFamily: SERIF,
                  fontSize: 'clamp(1rem, 1.75vw, 1.1rem)',
                  color: COLOR.inkMuted,
                  lineHeight: 1.85,
                  whiteSpace: 'pre-line',
                }}>
                  {section.content}
                </div>
              </section>
            ))}

            <div style={{ height: 'clamp(3rem, 6vw, 5rem)' }} />
          </div>
        </main>

        <footer style={{
          position: 'sticky',
          bottom: 0,
          borderTop: `1px solid ${COLOR.inkTrace}`,
          padding: 'clamp(1.5rem, 3vw, 2rem) clamp(1.5rem, 4vw, 3rem)',
          background: COLOR.bg,
          zIndex: 10,
        }}>
          <div style={{
            maxWidth: '760px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
              <p style={{
                fontFamily: MONO,
                fontSize: '10px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: canAgree ? COLOR.inkMuted : COLOR.accent,
                margin: 0,
              }}>
                {canAgree
                  ? 'You have read the terms'
                  : 'Scroll to the bottom to continue'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <Link
                href="/"
                style={{
                  fontFamily: MONO,
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: COLOR.inkFaint,
                  textDecoration: 'none',
                  padding: '0.4rem 0',
                  borderBottom: `1px solid ${COLOR.rule}`,
                }}
              >
                ← Back
              </Link>

              {canAgree ? (
                <Link
                  href="/upload"
                  style={{
                    padding: '0.75rem 1.75rem',
                    fontFamily: MONO,
                    fontSize: '10px',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: COLOR.bg,
                    background: COLOR.ink,
                    border: 'none',
                    textDecoration: 'none',
                    display: 'inline-block',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(26,24,20,0.85)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = COLOR.ink; }}
                >
                  I Agree
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  style={{
                    padding: '0.75rem 1.75rem',
                    fontFamily: MONO,
                    fontSize: '10px',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(26,24,20,0.20)',
                    background: 'rgba(26,24,20,0.05)',
                    border: `1px solid ${COLOR.inkTrace}`,
                    cursor: 'not-allowed',
                  }}
                >
                  I Agree
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
