# Minecraft AI — Generator Integration (Datapacks)

This update adds OpenAI integration for generating Minecraft datapacks, including preview and downloadable ZIP flow. It works with the Pro / credits scaffold you already have.

Required environment variables (add to your .env, never commit real secrets):
- OPENAI_API_KEY=sk_...
- DATABASE_URL=postgresql://user:pass@host:5432/db
- NEXTAUTH_URL=http://localhost:3000
- NEXTAUTH_SECRET=long_random_secret
- EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, EMAIL_FROM — for NextAuth email signin (or configure another provider)
- STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY_ID, STRIPE_PRICE_YEARLY_ID, STRIPE_WEBHOOK_SECRET — for Stripe flow

Local dev steps:
1. Install dependencies:
   ```
   npm install
   ```
2. Prepare database:
   - Set DATABASE_URL
   - Run prisma generate/migrate:
     ```
     npm run prisma:generate
     npm run prisma:migrate
     ```
3. Seed the lifetime user (nood2proinbloxfruit@gmail.com):
   ```
   npm run seed
   ```
4. Run dev server:
   ```
   npm run dev
   ```
5. Visit http://localhost:3000, sign in, craft a prompt and preview / download a datapack.

Notes:
- The generation endpoint uses the model to return strict JSON describing files. If the model returns non-JSON the API attempts to extract the JSON object; if parsing still fails an error is returned with the raw model output for debugging.
- Pro or lifetime users are allowed unlimited generation; non-Pro users must have credits and one credit is consumed per generation (this is the behaviour in the scaffold).
- Tweak the prompt template in pages/api/generate.ts to produce different file sets (resource packs, mod sources, etc.). For mods you may want a different prompt and packaging scheme.
- For production, secure your OpenAI key, validate model outputs more thoroughly, and add rate limits and moderation filters.

What I can do next (pick any):
- Wire generation to also produce resource packs or simple mod source skeletons.
- Add server-side verification/tests for generated datapacks (basic file-level checks).
- Add a UI to list user's saved projects and history (Prisma DB).
- Deploy to Vercel and provide step-by-step Stripe webhook setup (I can guide you and provide the exact webhook URL).
