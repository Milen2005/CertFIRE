import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "../../../../lib/supabase";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // Fetch user from Supabase profiles table
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", credentials.email.toLowerCase().trim())
          .single();
          
        if (error || !profile) {
          return null;
        }
        
        // Verify password
        const isValid = await bcrypt.compare(credentials.password, profile.password);
        if (!isValid) {
          return null;
        }
        
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role, // 'PARTICIPANT' | 'ORGANIZER' | 'ADMIN'
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
