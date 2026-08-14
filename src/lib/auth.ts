import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

// =============================================================================
// NextAuth v5 Configuration — Credentials Provider
// JWT Strategy — Korporativ ERP üçün
// =============================================================================

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifrə", type: "password" },
      },

      async authorize(credentials) {
        // 1. Input validasiyası
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Email və ya şifrə formatı düzgün deyil");
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        // 2. İstifadəçini tap
        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              passwordHash: true,
              status: true,
              jobTitle: true,
              companyId: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logo: true,
                  plan: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  permissions: {
                    select: {
                      permission: {
                        select: { key: true },
                      },
                    },
                  },
                },
              },
            },
          });
        } catch (dbErr) {
          console.error("[AUTH] DB_ERROR:", dbErr);
          throw new Error("Verilənlər bazasına qoşulma xətası");
        }

        if (!user) {
          throw new Error("Bu email ilə qeydiyyatlı istifadəçi tapılmadı");
        }

        // 3. Status yoxlaması
        if (user.status === "SUSPENDED") {
          throw new Error("Hesabınız bloklanmışdır. Admin ilə əlaqə saxlayın");
        }
        if (user.status === "INACTIVE") {
          throw new Error("Hesabınız aktiv deyil");
        }

        // 4. Şifrə yoxlaması
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error("Şifrə düzgün deyil");
        }

        // 5. Son giriş tarixini yenilə
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // 6. JWT token üçün istifadəçi məlumatını qaytar
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          jobTitle: user.jobTitle,
          companyId: user.companyId,
          company: user.company,
          role: user.role
            ? {
                id: user.role.id,
                name: user.role.name,
                color: user.role.color,
                permissions: user.role.permissions.map((rp) => rp.permission.key),
              }
            : null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // İlk giriş zamanı user məlumatlarını token-a əlavə et
      if (user) {
        token.id = user.id;
        token.jobTitle = (user as any).jobTitle;
        token.companyId = (user as any).companyId;
        token.company = (user as any).company;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      // Session-a token məlumatlarını əlavə et
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.jobTitle = token.jobTitle as string;
        session.user.companyId = token.companyId as string;
        session.user.company = token.company as any;
        session.user.role = token.role as any;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },

  // NextAuth v5: AUTH_SECRET env dəyişənini avtomatik oxuyur.
  // NEXTAUTH_SECRET köhnə v4 adıdır — v5-də işləmir.
  // secret: process.env.AUTH_SECRET — NextAuth v5 bunu özü oxuyur
  trustHost: true,
});
