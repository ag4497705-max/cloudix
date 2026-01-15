import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY!;
if (!stripeSecret) {
  throw new Error("Missing STRIPE_SECRET_KEY in env");
}

export const stripe = new Stripe(stripeSecret, { apiVersion: "2024-11-08" });
