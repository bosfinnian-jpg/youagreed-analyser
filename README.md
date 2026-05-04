# YOU AGREED — youagreed.co.uk

Critical art installation examining the structural failure of consent frameworks applied to irreversible AI cognitive data extraction.

---

## Project Structure

```
youagreed-analyser/
│
├── app/
│   ├── page.tsx                          # Landing page (trace.ai entry point)
│   ├── layout.tsx                        # Root layout
│   ├── globals.css
│   │
│   ├── upload/
│   │   └── page.tsx                      # File upload + pipeline trigger
│   │
│   ├── terms/
│   │   └── page.tsx                      # Standalone terms page
│   │
│   ├── api/
│   │   ├── enrich/route.ts               # Claude Haiku — per-message enrichment
│   │   └── synthesize/route.ts           # Claude Sonnet — full synthesis pass
│   │
│   └── results/
│       ├── page.tsx                      # Results router (SPA shell)
│       │
│       ├── shared/
│       │   ├── layout/
│       │   │   └── DashboardLayout.tsx   # Nav, act structure, accessibility settings
│       │   ├── components/
│       │   │   └── DataThread.tsx        # Animated double-helix canvas component
│       │   ├── AboutPage.tsx             # Theoretical basis
│       │   └── SourcesPage.tsx           # Data sources + multi-upload handler
│       │
│       └── acts/
│           │
│           ├── act-i-record/             # ACT I — The Record
│           │   └── OverviewPage.tsx      # 01 · Your data, extracted and mapped
│           │
│           ├── act-ii-inference/         # ACT II — The Inference
│           │   ├── ProfilePage.tsx       # 02 · What the pattern reveals about you
│           │   ├── CommercialProfilePage.tsx  # 03 · The product version of you, priced
│           │   ├── DataProductSummary.tsx     # Commercial profile sub-component
│           │   └── RiskPage.tsx          # 04 · What this record makes possible
│           │
│           ├── act-iii-permanence/       # ACT III — The Permanence
│           │   ├── CannotBeDeletedPage.tsx  # 05 · Why deletion changes nothing
│           │   └── PolicyDriftPage.tsx   # 06 · What you agreed to — and when it changed
│           │
│           ├── act-iv-mechanism/         # ACT IV — The Mechanism
│           │   ├── HowItWorksPage.tsx    # 07 · Why the inference is effectively persistent
│           │   ├── UnderstandPage.tsx    # 08 · Watch the extraction happen live
│           │   ├── AIEnrichmentPage.tsx  # AI enrichment visualisation
│           │   └── ScoreBreakdownPage.tsx  # Score breakdown detail
│           │
│           └── act-v-after/              # ACT V — After
│               ├── ResistPage.tsx        # 09 · What remains. What you can do.
│               └── MethodPage.tsx        # 10 · A note on how this system should be read.
│
├── lib/
│   ├── pipeline/                         # Analysis pipeline (runs in order)
│   │   ├── analyzeExport.ts              # Entry point — orchestrates the full pipeline
│   │   ├── aiEnrichment.ts              # Batched Haiku enrichment per message
│   │   └── synthesis.ts                 # Sonnet synthesis — final verdict pass
│   │
│   └── parsers/                          # Format-specific input parsers
│       ├── deepParser.ts                 # Regex deep parser — primary extraction
│       └── claudeParser.ts              # Claude export normaliser
│
├── public/
│   ├── demo-conversations.json           # Demo data for exhibition mode
│   ├── favicon.svg
│   └── fonts/
│       ├── NeueMontreal-Medium.otf
│       └── neue-montreal-bold.otf
│
└── [config files]
    ├── next.config.ts
    ├── tsconfig.json
    ├── package.json
    ├── postcss.config.mjs
    └── eslint.config.mjs
```

---

## Four-Act Argument

| Act | ID | Pages | Thesis |
|-----|----|-------|--------|
| I — The Record | `record` | Overview | What was extracted |
| II — The Inference | `infer` | Profile · Commercial Profile · Risk | What was inferred |
| III — The Permanence | `delete` | Permanent · Terms | Why it cannot be undone |
| IV — The Mechanism | `understand` | How It Works · Test | How the extraction persists |
| V — After | `resist` | After · Method | What remains |

---

## Pipeline Flow

```
File upload
  → deepParser.ts         (regex extraction, scoring)
  → aiEnrichment.ts       (Haiku — batched per-message enrichment)
  → synthesis.ts          (Sonnet — full synthesis + verdict)
  → sessionStorage
  → Results dashboard
```

---

## Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Deploy**: Netlify (auto-deploy from `main`)
- **AI**: Anthropic API — Claude Haiku (enrichment) + Claude Sonnet (synthesis)
- **Design**: EB Garamond · Courier Prime · `#f5f4f0` paper · single red accent
- **Domain**: youagreed.co.uk
