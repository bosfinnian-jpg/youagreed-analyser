import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },

  // No iframing - prevents clickjacking
  { key: "X-Frame-Options", value: "DENY" },

  // Strict referrer - no leaking full URLs cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Lock down permissions - camera/mic/geo/payment
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },

  // HSTS - prod only; 1 year, include subdomains
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),

  // Content Security Policy
  // - default: self only
  // - scripts: self + next inline (nonce-based in prod would be better but requires middleware)
  // - styles: self + unsafe-inline (needed by Next.js/Framer Motion inline styles)
  // - fonts: self + Google Fonts
  // - connect: self + Anthropic API (for the analysis pipeline)
  // - img: self + data URIs (for canvas export / SVG inline)
  // - frame: none
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.anthropic.com",
      "img-src 'self' data: blob:",
      "media-src 'none'",
      "object-src 'none'",
      "frame-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: isProd,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
