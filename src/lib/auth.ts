import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { logUserLogin, logUserLogout } from "@/lib/audit";

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
              // YENİ ƏLAVƏLƏR: Prisma-ya qoyduğumuz yeni sahələri çəkirik
              phone: true,
              address: true,
              bio: true,
              workingHours: true,
              language: true, // BURA ƏLAVƏ OLUNDU (DİL ÜÇÜN)
              companyId: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logo: true,
                  plan: true,
                  ownerId: true,
                  taxId: true,
                  website: true,
                  description: true,
                },
              },
              extraPermissions: {
                select: {
                  permission: { select: { key: true } },
                },
              },
              isFounder: true,
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

        const roleKeys = user.role
          ? user.role.permissions.map((rp) => rp.permission.key)
          : [];
        const extraKeys = user.extraPermissions.map((up) => up.permission.key);
        const permissionKeys = [...new Set([...roleKeys, ...extraKeys])];
        const isFounderUser =
          Boolean(user.isFounder) ||
          user.company?.ownerId === user.id ||
          (user.role?.name ?? "").trim().toLowerCase() === "founder";
        const isSuperAdmin =
          isFounderUser ||
          (user.role?.name ?? "").trim().toLowerCase() === "super admin" ||
          permissionKeys.includes("CAN_MANAGE_COMPANY");

        // 6. JWT token üçün istifadəçi məlumatını qaytar
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          jobTitle: user.jobTitle,
          phone: user.phone,
          address: user.address,
          bio: user.bio,
          workingHours: user.workingHours,
          language: user.language,
          companyId: user.companyId,
          isSuperAdmin,
          isFounder: isFounderUser,
          sessionStartedAt: Date.now(),
          company: user.company
            ? {
                id: user.company.id,
                name: user.company.name,
                slug: user.company.slug,
                logo: user.company.logo,
                plan: user.company.plan,
                taxId: user.company.taxId,
                website: user.company.website,
                description: user.company.description,
              }
            : null,
          role: user.role
            ? {
                id: user.role.id,
                name: user.role.name,
                color: user.role.color,
                permissions: permissionKeys,
              }
            : null,
        };
      },
    }),
  ],

  callbacks: {
    // YENİ: trigger və session parametrlərini əlavə etdik
    async jwt({ token, user, trigger, session }) {
      // İlk giriş zamanı user məlumatlarını token-a əlavə et
      if (user) {
        token.id = user.id;
        token.jobTitle = (user as any).jobTitle;
        // YENİ ƏLAVƏLƏR
        token.phone = (user as any).phone;
        token.address = (user as any).address;
        token.bio = (user as any).bio;
        token.workingHours = (user as any).workingHours;
        token.language = (user as any).language || 'az'; // BURA ƏLAVƏ OLUNDU
        token.companyId = (user as any).companyId;
        token.company = (user as any).company;
        token.role = (user as any).role;
        token.isSuperAdmin = Boolean((user as any).isSuperAdmin);
        token.isFounder = Boolean((user as any).isFounder);
        token.sessionStartedAt = (user as any).sessionStartedAt ?? Date.now();
      }

      // YENİ ƏLAVƏ: Ayarlardan update() çağırılanda token-i (dili) anında yeniləyirik!
      if (trigger === "update" && session) {
        if (session.language) {
          token.language = session.language;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Session-a token məlumatlarını əlavə et
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.jobTitle = token.jobTitle as string;
        // YENİ ƏLAVƏLƏR (Frontend-də istifadə üçün)
        (session.user as any).phone = token.phone as string;
        (session.user as any).address = token.address as string;
        (session.user as any).bio = token.bio as string;
        (session.user as any).workingHours = token.workingHours as string;
        (session.user as any).language = token.language as string; // BURA ƏLAVƏ OLUNDU
        session.user.companyId = token.companyId as string;
        session.user.company = token.company as any;
        session.user.role = token.role as any;
        (session.user as any).isSuperAdmin = Boolean(token.isSuperAdmin);
        (session.user as any).isFounder = Boolean(token.isFounder);
      }
      return session;
    },
  },

  events: {
    async signIn({ user }) {
      const companyId = (user as any).companyId as string | undefined;
      if (!user?.id || !companyId) return;
      await logUserLogin({
        userId: user.id,
        companyId,
        userName: user.name,
      });
    },
    async signOut(message) {
      const token = "token" in message ? (message as { token?: Record<string, unknown> }).token : undefined;
      const userId = token?.id as string | undefined;
      const companyId = token?.companyId as string | undefined;
      if (!userId || !companyId) return;
      await logUserLogout({
        userId,
        companyId,
        userName: (token?.name as string | undefined) ?? null,
        sessionStartedAt: (token?.sessionStartedAt as number | undefined) ?? null,
      });
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

  trustHost: true,
});