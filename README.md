# 🦄 Unicorn Furniture

**Premium luxury furniture e-commerce for Dubai homes.**
A First Unicorn Group company.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select this repository
4. Framework: **Vite** (auto-detected)
5. Deploy — live in ~30 seconds

## Product Management (tools/)

The `tools/` directory contains Python automation scripts:

| Script | Purpose |
|--------|---------|
| `premium_curator.py` | Transforms raw AliExpress data into premium Unicorn listings |
| `generate_site.py` | Reads spreadsheet → generates React storefront |
| `aliexpress_import.py` | AliExpress API → auto-import products |
| `quick_collect.py` | CSV/manual entry → spreadsheet → site |

### Add New Products

```bash
cd tools/
# Edit sample_products.csv with your products
python quick_collect.py sample_products.csv
# Copy generated JSX to src/App.jsx
cp unicorn-furniture-generated.jsx ../src/App.jsx
# Commit and push — Vercel auto-deploys
```

### AliExpress API Import

```bash
cd tools/
export AE_APP_KEY='your_key'
export AE_APP_SECRET='your_secret'
export AE_TRACKING_ID='your_tracking_id'
python aliexpress_import.py --bulk
```

## Tech Stack

- **React 18** + **Vite** (no Next.js overhead needed for SPA)
- **Vercel** deployment (free tier)
- **Python** product automation tools
- **AliExpress Affiliate API** integration

## Brand

- Primary: Charcoal `#1a1a1a`
- Accent: Gold `#c9b99a`
- Background: Cream `#fcfaf7`
- Typography: Cormorant Garamond + DM Sans

---

*First Unicorn Group — Dubai*
