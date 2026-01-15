# AI Website Starter

Minimal Next.js starter that shows a simple chat UI and a server API route that calls an OpenAI Chat Completion.

Setup:
1. Create a Next.js project and place the files in the `pages/` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Set environment variable:
   - `OPENAI_API_KEY` — your OpenAI API key (or other model provider).
4. Run locally:
   ```
   npm run dev
   ```

Security note:
- Never expose your API key to the browser. Keep it on the server or use a secure inference proxy.
- Add rate limiting, logging, and moderation for production.
