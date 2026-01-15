# Minecraft AI — Pro Subscription Scaffold

This project is a starter scaffold that implements a Pro subscription system (Stripe) with NextAuth + Prisma, plus a gated generation endpoint.

Quick summary:
- Monthly price: $10 / month
- Yearly price: $100 / year
- Buying a subscription grants `isPro = true` and increments `credits` by 100
- The email `nood2proinbloxfruit@gmail.com` will be seeded as a lifetime Pro user (isLifetime=true, isPro=true)
- You must configure Stripe products/prices and set env variables listed below

Setup steps (local):

1. Clone or create a new Next.js project and paste the files above.

2. Create a Postgres database and set env:
   - DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
   - NEXTAUTH_URL="http://localhost:3000"
   - NEXTAUTH_SECRET="long_random_secret"
   - EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, EMAIL_FROM — for NextAuth email signin (or configure GitHub provider if you prefer)
   - STRIPE_SECRET_KEY="sk_live_..."
   - STRIPE_WEBHOOK_SECRET="whsec_..."
   - STRIPE_PRICE_MONTHLY_ID="price_XXXX"   <-- set in Stripe dashboard
   - STRIPE_PRICE_YEARLY_ID="price_YYYY"    <-- set in Stripe dashboard

3. Create Stripe products/prices:
   - Create a Product "Minecraft AI Pro"
   - Add a recurring price $10/month and capture its Price ID -> set STRIPE_PRICE_MONTHLY_ID
   - Add a recurring price $100/year and capture its Price ID -> set STRIPE_PRICE_YEARLY_ID
   - Add webhook endpoint in Stripe: https://YOUR_DOMAIN/api/stripe-webhook (or http://localhost:3000/api/stripe-webhook for local, use stripe CLI to forward and get webhook secret)
   - Save the webhook signing secret to STRIPE_WEBHOOK_SECRET

4. Migrate Prisma:
   - npm run prisma:generate
   - npm run prisma:migrate

5. Seed lifetime user:
   - npm run seed
   - This creates/updates nood2proinbloxfruit@gmail.com as lifetime Pro.

6. Run dev:
   - npm run dev
   - Visit http://localhost:3000

7. Test checkout:
   - Sign in with email, click Buy Monthly/Yearly; Stripe Checkout will redirect. After completing, Stripe will call your webhook and the DB will be updated.

Notes & Next steps:
- Secure webhook endpoint: use a proper webhook secret and HTTPS in production.
- Add a billing portal (Stripe Billing Portal) or management UI for cancellations.
- Add rate limits and moderation to the generation endpoint.
- You can adjust whether Pro users get "unlimited" or still consume credits.
- For deployment use Vercel/Render and set environment variables there.
- Consider using NextAuth GitHub provider for simpler sign-ins if you prefer.

Security: Never commit your secret keys. Use environment variables in production.
