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
PAYHIP_WEBHOOK_SECRET=<make up a long random string>
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

## 6. Connect the Payhip webhook

1. In Payhip's dashboard, find the webhook/notification settings for your
   product(s) (Payhip calls this differently across plans — look for
   "Webhooks" or "Notifications").
2. Set the webhook URL to:
   `https://<your-domain>/api/webhooks/payhip?secret=<PAYHIP_WEBHOOK_SECRET>`
   (same secret you put in `.env.local` / your hosting provider's env vars).
3. **Before relying on this**: trigger a real or test purchase and check
   the `orders` table in Supabase to confirm the payload parsed correctly.
   `src/app/api/webhooks/payhip/route.ts` has a comment flagging exactly
   which field names to double-check against Payhip's current docs — this
   was written without a live Payhip account to test against, so the
   field-name guesses (email, order id, product id, price) should be
   verified once, not assumed.
4. On each product in 3DPIY Studio, fill in **Payhip product ID /
   permalink** (Studio → Products → edit a product) so purchases can be
   matched to the right product.

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
  `src/lib/commerce/` and the Payhip webhook route knows about Payhip.
  Swapping to Stripe/WooCommerce later means a new `CommerceProvider`
  implementation and a new webhook route with the same shape
  (verify → upsert order → upsert entitlements) — the accounts, library,
  and admin UI don't change.
