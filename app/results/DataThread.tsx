'use client';

import { useEffect, useRef } from 'react';
import type { DashPage } from './DashboardLayout';

// ============================================================================
// DATA THREAD — the living element on every page
//
// A sinuous double-helix on the right edge. Two strands: what you typed,
// what was inferred. Coloured data packets travel downward continuously.
// The snake only exists in a band around your scroll position — it emerges
// ahead of you, dissolves above. Something is always watching you read.
//
// Each page has its own jewel tone — colours that don't exist elsewhere
// in the palette, vivid against the paper.
// ============================================================================

// Jewel tones — distinct from the site's existing red/amber/green
export const PAGE_COLORS: Record<DashPage, { r: number; g: number; b: number; name: string }> = {
  overview:        { r: 255, g: 107, b: 107, name: 'coral' },       // coral red
  profile:         { r: 255, g: 183, b: 77,  name: 'gold' },        // warm gold
  'commercial-profile': { r: 255, g: 147, b: 51, name: 'amber' },   // deep amber
  risk:            { r: 255, g: 100, b: 72,  name: 'ember' },       // ember orange
  understand:      { r: 78,  g: 205, b: 196, name: 'teal' },        // mint teal
  terms:           { r: 187, g: 134, b: 252, name: 'violet' },      // lavender
  permanent:       { r: 255, g: 107, b: 53,  name: 'ember' },       // deep amber
  resist:          { r: 107, g: 203, b: 119, name: 'sage' },        // sage green
  sources:         { r: 168, g: 218, b: 220, name: 'ice' },         // ice blue
  'sources-detail':{ r: 168, g: 218, b: 220, name: 'ice' },
};

// Data packet labels — tiny text labels that travel down the strand
const PACKET_LABELS: Record<string, string[]> = {
  overview:   ['msg', 'loc', 'name', 'date', 'topic', 'mood'],
  profile:    ['inference', 'pattern', 'belief', 'trait', 'tell'],
  'commercial-profile': ['CPM', 'IAB', 'segment', 'value', 'bid'],
  risk:       ['breach', 'exposure', 'target', 'profile', 'risk'],
  understand: ['signal', 'vector', 'weight', 'token', 'embed'],
  terms:      ['§1.2', '§4.3', '§19', 'consent', 'waiver'],
  permanent:  ['weight', 'gradient', 'frozen', 'irrev.', '∞'],
  resist:     ['opt-out', 'GDPR', 'delete', 'appeal', 'limit'],
  sources:    ['source', 'data', 'input', 'feed', 'merge'],
  'sources-detail': ['source', 'data'],
};


// Utility: get hex colour string for a given page
export function getPageColorHex(page: DashPage): string {
  const col = PAGE_COLORS[page] || PAGE_COLORS.overview;
  return `rgb(${col.r},${col.g},${col.b})`;
}

interface Packet {
  y: number;
  speed: number;
  strandOffset: number; // which strand (0 or 1)
  label: string;
  alpha: number;
  size: number;
  hue: number; // slight hue shift per packet
}

export default function DataThread({ page }: { page: DashPage }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const stateRef  = useRef({
    scrollY: 0,
    scrollV: 0, // scroll velocity
    lastScrollY: 0,
    lastTime: 0,
    packets: [] as Packet[],
    time: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 56;
    let H = 0;

    const resize = () => {
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const onScroll = () => {
      stateRef.current.scrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const color = PAGE_COLORS[page] || PAGE_COLORS.overview;
    const labels = PACKET_LABELS[page] || PACKET_LABELS.overview;

    // Seed initial packets
    const s = stateRef.current;
    s.packets = Array.from({ length: 18 }, (_, i) => ({
      y:           (H / 18) * i,
      speed:       0.4 + Math.random() * 0.7,
      strandOffset: i % 2,
      label:       labels[Math.floor(Math.random() * labels.length)],
      alpha:       0.4 + Math.random() * 0.4,
      size:        1.5 + Math.random() * 1.5,
      hue:         (Math.random() - 0.5) * 30,
    }));

    const draw = (ts: number) => {
      const dt  = Math.min((ts - s.lastTime) / 1000, 0.05);
      s.lastTime = ts;
      s.time    += dt;

      // Scroll velocity (clamped)
      s.scrollV = Math.max(0.3, Math.min(4, Math.abs(stateRef.current.scrollY - s.lastScrollY) * 0.06 + s.scrollV * 0.88));
      s.lastScrollY = stateRef.current.scrollY;

      const t    = s.time;
      const vel  = s.scrollV;

      // Canvas dimensions
      const cxBase  = W / 2;
      const amp     = 10; // wave amplitude
      const freq    = 0.028; // wave frequency (cycles per pixel)
      // Phase advances with time — makes the wave crawl downward
      const phase1  = t * 1.1;
      const phase2  = t * 1.1 + Math.PI; // opposite strand

      ctx.clearRect(0, 0, W, H);

      // ── Draw strands ────────────────────────────────────────────────────
      const drawStrand = (phaseOff: number, alphaScale: number) => {
        ctx.beginPath();
        for (let y = 0; y <= H; y += 3) {
          const x = cxBase + Math.sin(phase1 + phaseOff + y * freq) * amp;
          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // Gradient: appears from centre of viewport, fades at top/bottom
        const viewMid = H * 0.5; // always centred in viewport
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        const cr = color.r, cg = color.g, cb = color.b;
        grad.addColorStop(0,    `rgba(${cr},${cg},${cb},0)`);
        grad.addColorStop(0.05, `rgba(${cr},${cg},${cb},${0.08 * alphaScale})`);
        grad.addColorStop(0.25, `rgba(${cr},${cg},${cb},${0.35 * alphaScale})`);
        grad.addColorStop(0.5,  `rgba(${cr},${cg},${cb},${0.55 * alphaScale})`);
        grad.addColorStop(0.75, `rgba(${cr},${cg},${cb},${0.35 * alphaScale})`);
        grad.addColorStop(0.95, `rgba(${cr},${cg},${cb},${0.08 * alphaScale})`);
        grad.addColorStop(1,    `rgba(${cr},${cg},${cb},0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      };

      drawStrand(0, 1);
      drawStrand(Math.PI, 0.6); // second strand, slightly dimmer

      // ── Cross-links (the helix rungs) ──────────────────────────────────
      const rungSpacing = 28;
      const rungCount   = Math.ceil(H / rungSpacing) + 2;
      const rungPhase   = (t * rungSpacing * 1.1) % rungSpacing;

      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 0.6;

      for (let i = 0; i < rungCount; i++) {
        const y  = i * rungSpacing - rungPhase;
        const x1 = cxBase + Math.sin(phase1 + y * freq) * amp;
        const x2 = cxBase + Math.sin(phase1 + Math.PI + y * freq) * amp;

        // Fade at edges
        const edgeFade = Math.min(y / (H * 0.15), 1) * Math.min((H - y) / (H * 0.15), 1);

        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${0.18 * edgeFade})`;
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ── Data packets ────────────────────────────────────────────────────
      for (const pkt of s.packets) {
        // Advance
        pkt.y += pkt.speed * vel * dt * 60;

        // Wrap to top when off bottom
        if (pkt.y > H + 20) {
          pkt.y = -20;
          pkt.label  = labels[Math.floor(Math.random() * labels.length)];
          pkt.speed  = 0.4 + Math.random() * 0.7;
          pkt.alpha  = 0.4 + Math.random() * 0.4;
        }

        const phOff  = pkt.strandOffset === 0 ? 0 : Math.PI;
        const x      = cxBase + Math.sin(phase1 + phOff + pkt.y * freq) * amp;

        // Edge proximity fade
        const edgeFade = Math.min(pkt.y / (H * 0.12), 1) * Math.min((H - pkt.y) / (H * 0.12), 1);
        if (edgeFade <= 0) continue;

        const a = pkt.alpha * edgeFade;

        // Glow
        const grd = ctx.createRadialGradient(x, pkt.y, 0, x, pkt.y, 7);
        grd.addColorStop(0,   `rgba(${color.r},${color.g},${color.b},${a * 0.6})`);
        grd.addColorStop(1,   `rgba(${color.r},${color.g},${color.b},0)`);
        ctx.beginPath();
        ctx.arc(x, pkt.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, pkt.y, pkt.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${a})`;
        ctx.fill();

        // Label — only draw when large enough to read
        if (edgeFade > 0.5) {
          ctx.font = `7px "Courier Prime", monospace`;
          ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${a * 0.75})`;
          ctx.textAlign = 'center';
          ctx.fillText(pkt.label, x, pkt.y - pkt.size - 3);
        }
      }

      // ── Head pip — a brighter node that floats at mid-viewport ──────────
      const headY   = H * 0.5 + Math.sin(t * 0.7) * H * 0.04;
      const headX   = cxBase + Math.sin(phase1 + headY * freq) * amp;
      const headGrd = ctx.createRadialGradient(headX, headY, 0, headX, headY, 12);
      headGrd.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0.55)`);
      headGrd.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
      ctx.beginPath();
      ctx.arc(headX, headY, 12, 0, Math.PI * 2);
      ctx.fillStyle = headGrd;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX, headY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},0.9)`;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [page]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        right:         0,
        top:           56,        // below nav
        bottom:        0,
        width:         56,
        zIndex:        99,
        pointerEvents: 'none',
        opacity:       1,
      }}
    />
  );
}
