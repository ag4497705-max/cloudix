  import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      // attach DB user fields to session
      // `user` here is the Adapter user type
      if (session.user) {
        session.user.id = user.id;
        session.user.email = user.email;
        // attach custom fields if present
        // Note: NextAuth's default `user` has only id/email/name/image; if you want extended fields,
        // fetch from DB instead in other endpoints where needed
      }
      return session;
    },
  },
};

export default NextAuth(authOptions as any);
