'use client';

import { useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence } from '../../DashboardLayout';
import DataProductSummary from '../../DataProductSummary';

// ============================================================================
// TYPES
// ============================================================================

interface MarketSeg {
  label: string;
  confidence: number;
  cpm: string;
  category: string;
}

// ============================================================================
// HELPERS - copied from ProfilePage
// ============================================================================

function generateMarketplaceSegments(r: any): MarketSeg[] {
  const segments = r.commercialProfile?.segments || [];
  const cpmMap: Record<string, { cpm: string; cat: string }> = {
    mental_health_support:    { cpm: '£6.20', cat: 'IAB: Health - Panic/Anxiety Disorders' },
    career_development:       { cpm: '£3.80', cat: 'IAB: Business - Career Advice' },
    financial_planning:       { cpm: '£4.50', cat: 'IAB: Personal Finance' },
    relationship_advice:      { cpm: '£2.90', cat: 'IAB: Family - Dating/Marriage' },
    productivity_optimisation:{ cpm: '£2.40', cat: 'IAB: Technology - Software' },
    creative_professional:    { cpm: '£3.10', cat: 'IAB: Business - Freelance/Startup' },
    health_wellness:          { cpm: '£5.60', cat: 'IAB: Health - General' },
    education_learning:       { cpm: '£2.20', cat: 'IAB: Education' },
    housing_relocation:       { cpm: '£7.80', cat: 'IAB: Real Estate' },
    parenting:                { cpm: '£4.10', cat: 'IAB: Family - Babies and Toddlers' },
    legal_concerns:           { cpm: '£8.90', cat: 'IAB: Legal' },
  };
  return segments.slice(0, 6).map((seg: any) => {
    const key = seg.label.toLowerCase().replace(/[\s/]+/g, '_');
    const m = cpmMap[key] || { cpm: '£' + (2 + seg.confidence / 25).toFixed(2), cat: 'IAB: Unclassified' };
    return { label: seg.label, confidence: seg.confidence, cpm: m.cpm, category: m.cat };
  });
}

// ============================================================================
// SHARED LAYOUT COMPONENTS
// ============================================================================

function Section({ children, index }: { children: React.ReactNode; index?: number }) {
  return (
    <div style={{
      padding: 'clamp(2.5rem, 8vw, 6rem) clamp(1.25rem, 5vw, 4rem)',
      borderBottom: `1px solid ${PALETTE.border}`,
      position: 'relative',
    }}>
      {index !== undefined && (
        <div className="section-ghost-num" style={{
          position: 'absolute',
          top: 'clamp(1.5rem, 5vw, 4rem)',
          right: 'clamp(1rem, 5vw, 4rem)',
          fontFamily: "'EB Garamond', serif",
          fontSize: 'clamp(60px, 12vw, 140px)',
          fontWeight: 400,
          color: 'rgba(26,24,20,0.04)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {String(index).padStart(2, '0')}
        </div>
      )}
      {children}
    </div>
  );
}

function SectionHeader({ label, heading, body }: { label: string; heading: string; body: string }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.8rem',
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(1.6rem, 3.2vw, 2.4rem)',
        fontWeight: 400, color: PALETTE.ink,
        letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.2rem',
      }}>
        {heading}
      </p>
      <p style={{
        fontFamily: TYPE.serif, fontSize: '1.1rem',
        color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '58ch',
      }}>
        {body}
      </p>
    </div>
  );
}

// ============================================================================
// COMMERCIAL TARGETS - specific real brands (copied from ProfilePage)
// ============================================================================

function CommercialTargetsSection({ targets }: { targets: any[] }) {
  if (!targets || targets.length === 0) return null;
  return (
    <Section index={3}>
      <SectionHeader
        label="Advertisers who would target you"
        heading="The brands that would pay to reach this profile."
        body="These are real companies, named specifically. Each fits the inferred profile. If your behavioural data entered the broker ecosystem - through a breach, a policy change, or a data-sharing agreement - these are the advertisers whose algorithms would identify you as a high-value target."
      />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
        gap: '1px',
        background: PALETTE.border,
      }}>
        {targets.map((t: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-5%' }}
            transition={{ delay: i * 0.06, duration: 0.6 }}
            style={{ background: PALETTE.bgPanel, padding: '1.6rem 1.8rem' }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', marginBottom: '0.6rem',
            }}>
              <p style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(1.2rem, 2vw, 1.45rem)',
                color: PALETTE.ink, letterSpacing: '-0.015em',
              }}>
                {t.brand}
              </p>
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
                color: PALETTE.redMuted, textTransform: 'uppercase',
              }}>
                {t.category}
              </p>
            </div>
            <p style={{
              fontFamily: TYPE.serif, fontSize: '1.05rem',
              color: PALETTE.inkMuted, lineHeight: 1.7, fontStyle: 'italic',
            }}>
              {t.why}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function CommercialProfilePage({ results, setPage }: {
  results: any;
  setPage?: (p: any) => void;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  const segments = useMemo(() => generateMarketplaceSegments(results), [results]);

  const stats = results.stats || results.rawStats;
  const totalMsgs = results.totalUserMessages || stats?.userMessages || 0;
  const segmentId = 'USR-' + String(results.privacyScore).padStart(3, '0') + '-' + String(totalMsgs % 10000).padStart(4, '0');
  const topSeg = results.commercialProfile?.segments?.[0];
  const hasDeepData = !!(results?.emotionalTimeline && results?.commercialProfile);

  return (
    <div className="dash-page-inner" style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>

      {/* ================================================================
          OPENING
          ================================================================ */}
      <div ref={heroRef} style={{
        padding: 'clamp(3rem, 8vw, 5rem) clamp(2rem, 5vw, 4rem)',
        borderBottom: `1px solid ${PALETTE.border}`,
      }}>
        <ActLabel roman="II" title="The Inference" pageLabel="03 / Commercial Profile" />
        <ThreadSentence>The product version of you - built without permission, priced without your knowledge.</ThreadSentence>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: 400, color: PALETTE.ink,
            letterSpacing: '-0.03em', lineHeight: 1.08,
            marginBottom: '1.5rem', maxWidth: '20ch',
          }}
        >
          You are not the customer. You are the product.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)',
            color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '56ch',
          }}
        >
          OpenAI does not sell your data to advertisers - but your conversations
          helped train a model now worth hundreds of billions of dollars. That
          contribution is permanent and cannot be undone. What follows is the
          commercial shape of what you gave away.
        </motion.p>
      </div>

      {/* ================================================================
          MARKET PLACEMENT - segment ID card + marketplace segments grid
          ================================================================ */}
      <Section index={1}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap',
          marginBottom: '2.5rem',
        }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <SectionHeader
              label="Market placement"
              heading="What a profile like yours is worth."
              body="These are the IAB advertising segments your inferred profile maps onto. The CPM rate is what advertisers pay per thousand impressions to reach someone matching this profile. These segments are derived from your conversation patterns - without your consent or awareness."
            />
          </div>

          {/* Segment ID product card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{
              background: PALETTE.bgElevated,
              border: `1px solid ${PALETTE.border}`,
              padding: '1.5rem',
              minWidth: 220,
              flexShrink: 0,
            }}
          >
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
              color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '3px',
            }}>Segment ID</p>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '1rem', color: PALETTE.ink,
              letterSpacing: '0.06em', marginBottom: '1rem',
            }}>{segmentId}</p>

            <div style={{ height: '1px', background: PALETTE.border, marginBottom: '1rem' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              {[
                { l: 'Data points', v: totalMsgs.toLocaleString('en-GB') },
                { l: 'Quality', v: results.privacyScore >= 70 ? 'Premium' : results.privacyScore >= 40 ? 'Standard' : 'Sparse' },
                { l: 'Segment', v: (topSeg?.label || 'General').replace(/_/g, ' ') },
                { l: 'Segments', v: String(segments.length) },
              ].map(item => (
                <div key={item.l}>
                  <p style={{
                    fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em',
                    color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '3px',
                  }}>{item.l}</p>
                  <p style={{
                    fontFamily: TYPE.serif, fontSize: '1.1rem',
                    color: results.privacyScore >= 70 && item.l === 'Quality' ? PALETTE.red : PALETTE.ink,
                    textTransform: 'capitalize',
                  }}>{item.v}</p>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: PALETTE.border, margin: '1rem 0' }} />
            <p style={{
              fontFamily: TYPE.serif, fontSize: '0.95rem',
              color: PALETTE.inkMuted, lineHeight: 1.7, fontStyle: 'italic',
            }}>
              This is the profile available if this data entered the broker ecosystem.
            </p>
          </motion.div>
        </div>

        {/* Marketplace segments grid */}
        {segments.length > 0 && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
              gap: '1px',
              background: PALETTE.border,
              marginBottom: '1.2rem',
            }}>
              {segments.map((seg, i) => (
                <motion.div
                  key={seg.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                  style={{ background: PALETTE.bgPanel, padding: '1.5rem' }}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: '0.6rem',
                  }}>
                    <p style={{
                      fontFamily: TYPE.serif, fontSize: '1.1rem',
                      color: PALETTE.ink, textTransform: 'capitalize',
                      flex: 1, marginRight: '1rem',
                    }}>
                      {seg.label.replace(/_/g, ' ')}
                    </p>
                    <p style={{
                      fontFamily: TYPE.mono, fontSize: '1rem',
                      color: PALETTE.red, letterSpacing: '0.04em', flexShrink: 0,
                    }}>{seg.cpm}</p>
                  </div>
                  <p style={{
                    fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em',
                    color: PALETTE.inkFaint, marginBottom: '0.6rem',
                  }}>{seg.category}</p>
                  <div style={{ height: '2px', background: PALETTE.ink + '08', position: 'relative', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: seg.confidence / 100 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.07, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        position: 'absolute', inset: 0,
                        transformOrigin: 'left',
                        background: PALETTE.red + '60',
                      }}
                    />
                  </div>
                  <p style={{
                    fontFamily: TYPE.mono, fontSize: '11px',
                    color: PALETTE.inkFaint, marginTop: '0.4rem',
                  }}>{seg.confidence}% confidence</p>
                </motion.div>
              ))}
            </div>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em',
              color: PALETTE.inkFaint,
            }}>
              CPM rates are indicative, based on 2024 IAB programmatic benchmarks.
            </p>
          </>
        )}
      </Section>

      {/* ================================================================
          DATA PRODUCT SUMMARY - training value, vulnerability plot,
          segment cards, targeting window (full Appendix B content)
          ================================================================ */}
      {hasDeepData && (
        <Section index={2}>
          <DataProductSummary analysis={results as any} />
        </Section>
      )}

      {/* ================================================================
          COMMERCIAL TARGETS - specific brands that would buy this profile
          ================================================================ */}
      {results.synthesis?.commercialTargets?.length > 0 && (
        <CommercialTargetsSection targets={results.synthesis.commercialTargets} />
      )}

      {/* ================================================================
          CLOSING
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 1.2 }}
        style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(2rem, 5vw, 4rem)' }}
      >
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            height: '1px', background: PALETTE.ink,
            transformOrigin: 'left', marginBottom: '2.5rem', opacity: 0.12,
          }}
        />
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 1 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)',
            color: PALETTE.ink, lineHeight: 1.75, maxWidth: '52ch', marginBottom: '1rem',
          }}
        >
          This is not your identity. This is a commercial reconstruction of your
          identity - assembled without your knowledge, retained without meaningful
          consent, and irrecoverable once embedded in a trained model.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 1 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1rem, 1.5vw, 1.1rem)',
            color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '52ch', fontStyle: 'italic',
          }}
        >
          The difference between the two is what makes it valuable.
        </motion.p>

        {setPage && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2, duration: 0.8 }}
            style={{ marginTop: '3rem' }}
          >
            <button
              onClick={() => setPage('risk')}
              style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                letterSpacing: '-0.01em', color: PALETTE.ink,
                background: 'none', border: `1px solid ${PALETTE.border}`,
                padding: 'clamp(0.85rem, 2vw, 1.25rem) clamp(1.25rem, 2.5vw, 2rem)',
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = PALETTE.borderHover;
                (e.currentTarget as HTMLElement).style.background = PALETTE.bgPanel;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = PALETTE.border;
                (e.currentTarget as HTMLElement).style.background = 'none';
              }}
            >
              <span style={{
                display: 'block', fontFamily: TYPE.mono, fontSize: '9px',
                letterSpacing: '0.25em', color: PALETTE.redMuted,
                textTransform: 'uppercase', marginBottom: '0.35rem',
              }}>ACT II / Continues</span>
              What it enables →
            </button>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.55 }}
          viewport={{ once: true }}
          transition={{ delay: 1.4, duration: 1.2 }}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em',
            color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '2.5rem',
          }}
        >
          End of commercial profile.
        </motion.p>
      </motion.div>

    </div>
  );
}
