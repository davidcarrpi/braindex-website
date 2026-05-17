# Braindex website

The marketing site at https://braindexapp.com.

Static HTML, zero build step. Five files — drag-drop deploy anywhere.

## What's here

| File | Purpose |
|---|---|
| `index.html` | Landing page + newsletter signup |
| `privacy-policy.html` | Privacy policy (linked from app + ASC + Play Console) |
| `delete-account.html` | Account deletion instructions (Play Console "Delete account URL") |
| `support.html` | Support + data-change requests (Play Console "Data deletion URL") |
| `braindex_logo.png` | Brand mark, used across all pages |
| `vercel.json` | Vercel config — required for newsletter form to work on Vercel |

## Deploy

### Netlify (recommended — newsletter form works out of the box)

The newsletter form on `index.html` uses **Netlify Forms** (`data-netlify="true"`).
Submissions land in Netlify dashboard → Site → Forms → "newsletter".

- **Drag-drop:** https://app.netlify.com → your site → Deploys → drag this whole folder
- **Git-connected:** Settings → Build & deploy → link to GitHub repo → auto-deploys on push

### Vercel

Vercel doesn't have built-in form handling. Two paths:

1. **Accept it as a preview-only mirror** — pages render, form silently fails.
2. **Replace with Formspree / serverless function** — see TODO below.

To deploy:
- https://vercel.com → New Project → import this repo → it'll auto-detect a static site → Deploy
- No build settings needed; `vercel.json` already configures clean URLs.

### Custom domain (braindexapp.com)

DNS lives on the registrar (Squarespace / Namecheap / whoever).

For **Netlify** as primary host (recommended):
- Netlify → Site settings → Domain management → Add custom domain `braindexapp.com`
- Follow Netlify's prompt to point your DNS A record / CNAME to their edge.

For **Vercel** as secondary:
- Vercel → Project → Settings → Domains → add `staging.braindexapp.com` (or similar subdomain — keep main domain on Netlify)

## Updating the site

Edit any of the HTML files in this repo. Push to `main`. Netlify auto-deploys.

For the founder paragraph in `index.html`, search for `"Hi, I'm David"` and edit
in place.

## TODO if you want the newsletter form to work on Vercel

Right now Vercel deploys are read-only previews. To make the form submit:

**Option A — Formspree (no code):**
1. Sign up at formspree.io → create a form → get an endpoint URL
2. In `index.html`, find the form tag and replace:
   ```html
   <form id="signup-form" ... data-netlify="true" ...>
   ```
   with:
   ```html
   <form id="signup-form" action="https://formspree.io/f/YOUR_ID" method="POST" ...>
   ```
3. Remove the AJAX `fetch('/', ...)` JS and let the form submit natively.

**Option B — Vercel Serverless Function (writes to Firebase):**
1. Create `api/newsletter.js` with a POST handler
2. Use Firebase Admin SDK + a service account JSON in env vars
3. Update the form's fetch URL to `/api/newsletter`

Ask Claude (the AI) for either option when ready.

## Contact

David — david@movietoons.co
