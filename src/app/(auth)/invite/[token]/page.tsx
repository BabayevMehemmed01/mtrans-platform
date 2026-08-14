import Link from "next/link";
import { Briefcase, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { InviteAcceptForm } from "./InviteAcceptForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dəvəti Qəbul Et" };

function InviteError({ message }: { message: string }) {
  return (
    <div className="glass rounded-2xl p-8 shadow-2xl text-center">
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center shadow-lg mb-4">
          <XCircle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Dəvət etibarsızdır</h1>
        <p className="text-sm text-slate-400 mt-2">{message}</p>
      </div>
      <Link
        href="/login"
        className="inline-block w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
      >
        Giriş səhifəsinə qayıt
      </Link>
    </div>
  );
}

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      company: { select: { name: true } },
      invitedBy: { select: { name: true } },
      role: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  if (!invite) {
    return <InviteError message="Bu dəvət linki mövcud deyil. Zəhmət olmasa dəvəti göndərən şəxslə əlaqə saxlayın." />;
  }
  if (invite.status === "ACCEPTED") {
    return <InviteError message="Bu dəvət artıq qəbul edilib. Zəhmət olmasa hesabınıza daxil olun." />;
  }
  if (invite.status === "REVOKED") {
    return <InviteError message="Bu dəvət ləğv edilib. Zəhmət olmasa yeni dəvət istəyin." />;
  }
  if (invite.status === "EXPIRED" || invite.expiresAt < new Date()) {
    return <InviteError message="Bu dəvətin vaxtı bitib. Zəhmət olmasa yeni dəvət istəyin." />;
  }

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl">
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-4">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Dəvəti Qəbul Et</h1>
        <p className="text-sm text-slate-400 mt-1 text-center">
          <b className="text-slate-300">{invite.invitedBy.name}</b> sizi{" "}
          <b className="text-slate-300">{invite.company.name}</b> şirkətinə{" "}
          {invite.type === "GUEST" ? "qonaq (guest)" : "üzv"} kimi dəvət edir
        </p>
      </div>

      <div className="mb-6 rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-slate-400 space-y-1">
        <p>
          <span className="text-slate-500">Email:</span> {invite.email}
        </p>
        {invite.role && (
          <p>
            <span className="text-slate-500">Rol:</span> {invite.role.name}
          </p>
        )}
        {invite.department && (
          <p>
            <span className="text-slate-500">Şöbə:</span> {invite.department.name}
          </p>
        )}
      </div>

      <InviteAcceptForm token={token} email={invite.email} />
    </div>
  );
}
