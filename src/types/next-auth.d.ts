import "next-auth";
import "next-auth/jwt";

// =============================================================================
// NextAuth v5 Type Augmentation
// Session və JWT token-a əlavə sahələr əlavə edilir
// =============================================================================

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      jobTitle?: string | null;
      companyId?: string | null;
      company?: {
        id: string;
        name: string;
        slug: string;
        logo?: string | null;
        plan: string;
      } | null;
      role?: {
        id: string;
        name: string;
        color: string;
        permissions: string[];
      } | null;
    };
  }

  interface User {
    id: string;
    jobTitle?: string | null;
    companyId?: string | null;
    company?: {
      id: string;
      name: string;
      slug: string;
      logo?: string | null;
      plan: string;
    } | null;
    role?: {
      id: string;
      name: string;
      color: string;
      permissions: string[];
    } | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    jobTitle?: string | null;
    companyId?: string | null;
    company?: {
      id: string;
      name: string;
      slug: string;
      logo?: string | null;
      plan: string;
    } | null;
    role?: {
      id: string;
      name: string;
      color: string;
      permissions: string[];
    } | null;
  }
}
