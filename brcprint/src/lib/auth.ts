import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Admin",
      credentials: {
        username: { label: "Usuário", type: "text", placeholder: "admin" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        // Fallback: Super admin from environment variables
        if (
          credentials?.username === process.env.ADMIN_USERNAME &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "0", name: "Super Administrador", role: "admin" } as any;
        }

        // Search in the admins table
        if (credentials?.username && credentials?.password) {
          try {
            const [rows]: any = await pool.query(
              "SELECT * FROM admins WHERE username = ? AND active = 1",
              [credentials.username]
            );

            if (rows.length > 0) {
              const admin = rows[0];
              const isValid = await bcrypt.compare(credentials.password, admin.password_hash);
              if (isValid) {
                return {
                  id: admin.id.toString(),
                  name: admin.name || admin.username,
                  role: admin.role || "operador"
                } as any;
              }
            }
          } catch (error) {
            console.error("Auth DB Error:", error);
          }
        }

        return null;
      },
    }),
    CredentialsProvider({
      id: "client",
      name: "Cliente",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "cliente@email.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [rows] = await pool.query(
          "SELECT * FROM clients WHERE email = ?",
          [credentials.email]
        );
        const users = rows as any[];

        if (users.length === 0) return null;

        const user = users[0];
        if (!user.password_hash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (isValid) {
          return { id: user.id.toString(), name: user.name, email: user.email, role: "cliente" } as any;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const [rows]: any = await pool.query("SELECT * FROM clients WHERE email = ?", [user.email]);
          if (rows.length === 0) {
            await pool.query(
              "INSERT INTO clients (name, email, auth_provider, auth_provider_id) VALUES (?, ?, ?, ?)",
              [user.name, user.email, "google", account.providerAccountId]
            );
            const [newRows]: any = await pool.query("SELECT * FROM clients WHERE email = ?", [user.email]);
            user.id = newRows[0].id.toString();
            (user as any).role = "cliente";
          } else {
            const existingClient = rows[0];
            if (!existingClient.auth_provider_id) {
              await pool.query("UPDATE clients SET auth_provider = 'google', auth_provider_id = ? WHERE id = ?", [account.providerAccountId, existingClient.id]);
            }
            user.id = existingClient.id.toString();
            (user as any).role = "cliente";
          }
          return true;
        } catch (error) {
          console.error("Error during Google signIn:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.role = (user as any).role || token.role;
        token.id = user.id;
        if (account?.provider === 'google') {
          token.role = 'cliente';
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
};
