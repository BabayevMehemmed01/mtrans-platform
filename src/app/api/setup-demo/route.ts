import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedOrganization } from "@/lib/org-seed";
import { DEMO_PASSWORD } from "@/lib/org-structure";

function isAuthorized(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.SETUP_DEMO_SECRET;
  if (!secret) return false;
  return req.headers.get("x-setup-secret") === secret;
}

async function runSeed() {
  const result = await seedOrganization(prisma);
  return {
    ok: true,
    ...result,
    password: DEMO_PASSWORD,
    accounts: {
      founder: "founder@mtrans.com",
      superAdmin: "admin@demo.com",
      ceo: "m.babayev@m-trans.az",
    },
  };
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  try {
    const result = await runSeed();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/setup-demo]", error);
    return NextResponse.json({ error: "Seed xətası" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  try {
    const result = await runSeed();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/setup-demo]", error);
    return NextResponse.json({ error: "Seed xətası" }, { status: 500 });
  }
}
