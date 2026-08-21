import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requirePermission, PermissionError } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("İcazə yoxdur", { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return new NextResponse("Şirkət yoxdur", { status: 400 });

    await requirePermission(session.user.id, "CAN_MANAGE_COMPANY");

    const { projectIds } = await req.json();

    if (!Array.isArray(projectIds)) {
      return new NextResponse("projectIds massivi tələb olunur", { status: 400 });
    }

    // Client-dən gələn id-ləri kor-koranə etibar etmirik — şirkətə aid olduğunu təsdiqləyirik
    const verifiedProjects = await prisma.project.findMany({
      where: { id: { in: projectIds }, companyId },
      select: { id: true },
    });
    const verifiedIds = verifiedProjects.map((p) => p.id);

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { defaultProjectIds: verifiedIds },
      select: { defaultProjectIds: true },
    });

    return NextResponse.json({ success: true, defaultProjectIds: company.defaultProjectIds });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[DEFAULT_PROJECTS_POST]", error);
    return new NextResponse("Server xətası", { status: 500 });
  }
}
