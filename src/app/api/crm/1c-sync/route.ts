import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =============================================================================
// POST /api/crm/1c-sync — 1C SQL Sinxronizasiya API-si
// Header: Authorization: Bearer <CRM_1C_SECRET_KEY>
// Body: { ad, nömrə, şirkət, "1c_id", email? } (Customer üzrə upsert)
// Yalnız server-to-server inteqrasiya üçündür — istifadəçi sessiyası tələb
// olunmur, əvəzinə paylaşılan sirr açar (secret key) ilə qorunur.
// =============================================================================

export async function POST(req: Request) {
  try {
    const secretKey = process.env.CRM_1C_SECRET_KEY;
    if (!secretKey) {
      console.error("[CRM_1C_SYNC] CRM_1C_SECRET_KEY mühit dəyişəni təyin olunmayıb");
      return NextResponse.json({ error: "Server konfiqurasiyası tamamlanmayıb" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token || token !== secretKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Yanlış JSON body" }, { status: 400 });
    }

    const name: string | undefined = body.ad ?? body.name;
    const phone: string | undefined = body["nömrə"] ?? body.nomre ?? body.phone;
    const company: string | undefined = body["şirkət"] ?? body.sirket ?? body.company;
    const email: string | undefined = body.email;
    const external1cId: string | number | undefined = body["1c_id"] ?? body.external_1c_id;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "'ad' sahəsi mütləqdir" }, { status: 400 });
    }
    if (external1cId === undefined || external1cId === null || String(external1cId).trim() === "") {
      return NextResponse.json({ error: "'1c_id' sahəsi mütləqdir" }, { status: 400 });
    }

    const external1cIdStr = String(external1cId).trim();

    const customer = await prisma.customer.upsert({
      where: { external_1c_id: external1cIdStr },
      update: {
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : null,
        company: company ? String(company).trim() : null,
        email: email ? String(email).trim() : undefined,
      },
      create: {
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : null,
        company: company ? String(company).trim() : null,
        email: email ? String(email).trim() : null,
        source: "1C",
        external_1c_id: external1cIdStr,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("[CRM_1C_SYNC_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
