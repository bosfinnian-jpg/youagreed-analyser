'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

// ============================================================================
// TRACE.AI — Landing
// A title card, not a sales page. Austerity is the argument.
// ============================================================================

const COLOR = {
  bg: '#0e0e0d',
  ink: 'rgba(240,238,232,0.92)',
  inkMuted: 'rgba(240,238,232,0.55)',
  inkFaint: 'rgba(240,238,232,0.30)',
  inkTrace: 'rgba(240,238,232,0.12)',
  rule: 'rgba(240,238,232,0.18)',
  accent: 'rgba(220,60,50,0.85)',
} as const;

const SERIF = "'EB Garamond', 'Times New Roman', Georgia, serif";
const MONO = "'Courier Prime', 'Courier New', ui-monospace, monospace";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Home() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Courier+Prime:wght@400;700&display=swap');
        html, body {
          background: ${COLOR.bg};
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        ::selection {
          background: ${COLOR.accent};
          color: ${COLOR.bg};
        }
        @media (max-width: 640px) {
          .ya-header, .ya-footer {
            padding-left: 24px !important;
            padding-right: 24px !important;
            font-size: 10px !important;
          }
          .ya-hero {
            padding: 48px 24px !important;
          }
        }
      `}</style>

      <main
        style={{
          minHeight: '100vh',
          background: COLOR.bg,
          color: COLOR.ink,
          fontFamily: SERIF,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top meta bar — catalogue-card aesthetic */}
        <motion.header
          className="ya-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
          style={{
            padding: '32px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: MONO,
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: COLOR.inkFaint,
            borderBottom: `1px solid ${COLOR.inkTrace}`,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span>trace.ai</span>
          <span>A critical design installation</span>
        </motion.header>

        {/* Main content — title and statement */}
        <section
          className="ya-hero"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px 48px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{ maxWidth: '720px', width: '100%' }}>
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6, delay: 0.3, ease: EASE }}
              style={{ textAlign: 'center', marginBottom: '64px' }}
            >
              <h1
                style={{
                  fontFamily: SERIF,
                  fontWeight: 400,
                  fontSize: 'clamp(72px, 13vw, 168px)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  color: COLOR.ink,
                }}
              >
                trace<span style={{ color: COLOR.accent }}>.ai</span>
              </h1>
            </motion.div>

            {/* Thin rule */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.1, ease: EASE }}
              style={{
                height: '1px',
                background: COLOR.rule,
                transformOrigin: 'center',
                width: '80px',
                margin: '0 auto 56px',
              }}
            />

            {/* Statement */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, delay: 1.4, ease: EASE }}
              style={{
                fontFamily: SERIF,
                fontSize: 'clamp(17px, 1.6vw, 20px)',
                lineHeight: 1.65,
                color: COLOR.inkMuted,
                maxWidth: '560px',
                margin: '0 auto',
                textAlign: 'left',
              }}
            >
              <p style={{ margin: '0 0 24px 0' }}>
                This is a critical design installation. It takes your exported
                ChatGPT history and produces the dossier a data broker would
                build from it.
              </p>
              <p style={{ margin: 0 }}>
                The analysis runs in your browser. Nothing is uploaded.
                What you learn is not reversible.
              </p>
            </motion.div>

            {/* Action */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 2.2, ease: EASE }}
              style={{
                marginTop: '80px',
                textAlign: 'center',
              }}
            >
              <Link
                href="/terms"
                style={{
                  display: 'inline-block',
                  fontFamily: MONO,
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: COLOR.ink,
                  textDecoration: 'none',
                  padding: '14px 28px',
                  border: `1px solid ${COLOR.rule}`,
                  transition: 'background 400ms cubic-bezier(0.22, 1, 0.36, 1), border-color 400ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,238,232,0.04)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(240,238,232,0.40)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = COLOR.rule;
                }}
              >
                Begin
              </Link>

              <div
                style={{
                  marginTop: '20px',
                  fontFamily: MONO,
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: COLOR.inkFaint,
                }}
              >
                You will first review the terms of service.
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer — academic credit, quiet */}
        <motion.footer
          className="ya-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 2.6, ease: EASE }}
          style={{
            padding: '28px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: MONO,
            fontSize: '10px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: COLOR.inkFaint,
            borderTop: `1px solid ${COLOR.inkTrace}`,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span>trace.ai</span>
          <span>MMXXVI</span>
        </motion.footer>
      </main>
    </>
  );
}
