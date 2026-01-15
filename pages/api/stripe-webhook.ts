import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../lib/stripe";
import prisma from "../../lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "./auth/[...nextauth]"; // path to NextAuth options - in this example we referenced the default file

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { price } = req.body as { price?: "monthly" | "yearly" };
  if (!price) return res.status(400).json({ error: "price missing" });

  // map to env price IDs
  const priceId =
    price === "monthly" ? process.env.STRIPE_PRICE_MONTHLY_ID : process.env.STRIPE_PRICE_YEARLY_ID;
  if (!priceId) return res.status(500).json({ error: "Stripe price IDs not configured" });

  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.email) return res.status(401).json({ error: "Not signed in" });

  // ensure customer exists in Stripe and DB
  let user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    user = await prisma.user.create({ data: { email: session.user.email } });
  }

  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined });
    user = await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  }

  const origin = process.env.NEXTAUTH_URL || `http://localhost:3000`;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/profile?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
  });

  return res.status(200).json({ url: checkout.url });
}
