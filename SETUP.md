# Activating accounts, My 3DPIY and 3DPIY Studio

Everything in this project — customer accounts, the "My 3DPIY" download
library, and the "3DPIY Studio" admin — is fully built and already wired
up in the code. It's just inactive until you connect a real Supabase
project. Until then:

- The public site (Shop, Business, About, Contact, Free Designs, product
  pages) works exactly as before — nothing here affects it.
- `/auth/*`, `/account` and `/studio` show a "Not connected yet" message
  instead of crashing.

This is a one-time setup, roughly 15–20 minutes.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account + a
   new project (pick a region close to your customers).
2. In the project dashboard, go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (keep this secret — never commit it, never send
     it to the browser)

## 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
POLAR_ACCESS_TOKEN=...
POLAR_SERVER=sandbox
POLAR_WEBHOOK_SECRET=...
```

Restart `npm run dev` after saving — Next.js only reads `.env.local` on
startup.

## 3. Run the database migration

In the Supabase dashboard, open **SQL Editor**, paste the contents of
`supabase/migrations/0001_init.sql`, and run it. This creates:

- `profiles`, `products`, `orders`, `order_items`, `entitlements` tables
- Row Level Security policies (customers only ever see their own data;
  products are only publicly visible once published; admin role sees
  everything)
- The `product-images` (public) and `product-files` (private) storage
  buckets
- Triggers that auto-create a profile on signup and auto-claim any orders
  that arrived before the matching account existed

Alternatively, if you prefer the CLI: `npx supabase db push` (needs
`npx supabase login` and `npx supabase link` first).

## 4. Make yourself an admin

1. Go to the live site and sign up for a normal account (`/auth/sign-up`)
   using the email you want to manage the shop with.
2. In Supabase: **Table Editor → profiles**, find your row, change `role`
   from `customer` to `admin`.
3. Sign in at `/auth/sign-in` (the normal site sign-in) with that same account — admins are redirected into 3DPIY Studio automatically after signing in. There's no separate admin login screen.

(Every new signup gets `role = 'customer'` by default — this manual step
is intentional, so nobody can grant themselves admin access.)

## 5. Regenerate proper TypeScript types (recommended)

`src/lib/supabase/types.ts` is hand-written to match the migration. Once
the project exists, regenerate it from the real schema for full type
safety on nested queries:

```
npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/types.ts
```

## 6. Connect Polar (checkout)

Polar (polar.sh) is the merchant of record: it runs the checkout, charges
VAT and pays out. Test everything on **sandbox.polar.sh** (mock payments,
test card 4242 4242 4242 4242) before going live.

1. Run `supabase/migrations/0012_polar.sql`.
2. In Polar → Settings → **Access Tokens**, create an organization token
   with all scopes and set `POLAR_ACCESS_TOKEN` (+ `POLAR_SERVER=sandbox`
   while testing).
3. Studio → Products → **Sync with Polar** lists every product: one
   private Polar product per license tier (shop designs: Personal only;
   Business designs: Personal / Startup / Studio) with the Studio prices, VAT included. After that, every
   save in Studio and every ingest run keeps Polar up to date — nothing is
   created by hand in Polar.
4. In Polar → Settings → **Webhooks**, add the endpoint
   `https://<your-domain>/api/webhooks/polar` with the event
   **order.paid** and set its secret as `POLAR_WEBHOOK_SECRET`. (Polar
   can't reach localhost; locally the thank-you page stores the order.)
5. Set `NEXT_PUBLIC_COMMERCE_ENABLED=true` to show the buy buttons.

At go-live: create the same token + webhook in the real Polar dashboard,
swap the env vars on Netlify (and leave `POLAR_SERVER` empty), then run
**Sync with Polar** once.

## 6b. Auth emails and redirects

In Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://3dpiy.com`
- **Redirect URLs:** `https://3dpiy.com/**` and `http://localhost:3000/**`

Without these, password-reset and confirmation links fall back to the
Site URL — they land on the homepage instead of the reset form.

**Sign in with an email code:** on Supabase's free plan the email
templates can only be edited once custom SMTP is set up. Until then the
"Magic Link" mail contains a sign-in link, which works too (it goes
through /api/auth/callback). After SMTP is connected, add `{{ .Token }}`
to the Magic Link template, e.g.
`<p>Your 3DPIY sign-in code: <strong>{{ .Token }}</strong></p>`.

Supabase's built-in mailer only sends a few emails per hour — fine for
testing, but connect your own SMTP (Authentication → Emails → SMTP
Settings) before real customers sign in.

**Preview the gated site:** set `SITE_PREVIEW_SECRET` (8+ characters) in
Netlify's environment variables, deploy, then open
`https://3dpiy.com/?preview=<secret>`; `?preview=off` ends it.

## 6c. Mail (Resend)

Everything the site sends — contact form, newsletter welcome mail,
newsletters from Studio — goes through [Resend](https://resend.com). Until
the keys below are set the site still works: the contact form opens the
visitor's mail app and newsletter signups are only stored.

1. Create a free Resend account → **Domains** → **Add domain** → `3dpiy.com`.
2. Resend shows a few DNS records (TXT/MX/CNAME). Add each one at TransIP
   (Domain → **DNS**), then click **Verify** in Resend. Can take up to an
   hour. These don't touch your TransIP mailbox.
3. Resend → **API Keys** → **Create API key** (permission: Sending access).
4. Add to Netlify (**Site configuration → Environment variables**) and to
   `.env.local`:
   - `RESEND_API_KEY` = the key
   - `MAIL_FROM` = e.g. `3DPIY <hallo@3dpiy.com>` (any address @3dpiy.com)
   - `MAIL_TO` = the inbox for contact-form messages (optional; defaults to
     `contactEmail` in `src/lib/config/business.ts`)
5. Redeploy (push) and restart `npm run dev`.

**Supabase auth mails through Resend too** (makes templates editable, so
the sign-in mail can show a code): Supabase → Authentication → Emails →
**SMTP Settings**: host `smtp.resend.com`, port `465`, username `resend`,
password = the API key, sender = the same address as `MAIL_FROM`.

## 6d. AI product texts

"✨ Text with AI" in Studio and the ingest script both write product texts
(English + Dutch) in one house style, defined in
`src/lib/ai/productText.ts`. Needs `ANTHROPIC_API_KEY` in Netlify and
`.env.local` (the same key the ingest script uses). Run migration
`0011_product_text_nl.sql` for the Dutch columns.

## 6e. Analytics (Umami)

Cookieless page views via Umami Cloud (free plan, no cookie banner needed).
Create a website at cloud.umami.is for `3dpiy.com`, then put its Website ID
in `NEXT_PUBLIC_UMAMI_WEBSITE_ID` on Netlify. Only 3dpiy.com is counted
(not localhost, deploy previews or Studio). Tracked events: `chooser-shop`,
`chooser-business`, `buy-click` (with product), `free-download-request`.
Add more with `data-umami-event="name"` or the Button `event` prop.

## 7. Deploy

Any Next.js host works (Vercel is the simplest fit — zero-config, free
tier covers this scale). Add the same environment variables from step 2
in the host's dashboard. `src/proxy.ts` and the Supabase SSR helpers work
the same in production as in `next dev`.

## What ties back to the original brief

- **Future publishing automation** (import STL/3MF, auto-generate
  descriptions/tags, package ZIPs): `src/lib/studio/actions.ts` is the
  single place that writes products. A future local tool can call the
  same `saveProduct` logic (or an equivalent API route built on top of it)
  instead of duplicating it — the admin UI and automation would share one
  data layer.
- **Payment provider replaceable later**: nothing outside
  `src/lib/commerce/` and the checkout/webhook routes knows about Polar.
  Swapping to Stripe/WooCommerce later means a new `CommerceProvider`
  implementation and a new webhook route with the same shape
  (verify → upsert order → upsert entitlements) — the accounts, library,
  and admin UI don't change.
