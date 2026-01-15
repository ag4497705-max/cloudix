import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import authOptions from "./auth/[...nextauth]";
import prisma from "../../lib/prisma";

/**
 * Example gated endpoint:
 * - If user.isLifetime or isPro: allow "infinite chat"
 * - For generates: if user.isPro or isLifetime allow free usage OR we deduct credits
 * - This example deducts 1 credit per generation if user has credits and not pro.
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.email) return res.status(401).json({ error: "Not authenticated" });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ error: "User not found" });

  // allow infinite chat if isPro or isLifetime
  const allowInfiniteChat = user.isPro || user.isLifetime;

  // for a generation action that consumes a credit:
  const consumesCredit = true;
  if (consumesCredit) {
    if (user.isLifetime || user.isPro) {
      // pro users also get 100 extra credits (but we treat them as allowed)
      // optionally still consume credits if required; in this example pro = unlimited generation and credits are bonus
      return res.status(200).json({ ok: true, note: "Pro or lifetime: generation allowed (unlimited)" });
    } else if (user.credits > 0) {
      await prisma.user.update({ where: { id: user.id }, data: { credits: { decrement: 1 } } });
      return res.status(200).json({ ok: true, remainingCredits: user.credits - 1 });
    } else {
      return res.status(402).json({ error: "No credits. Please upgrade to Pro." });
    }
  }

  res.json({ ok: true, allowInfiniteChat });
}
