"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { User, Shield, Mail, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useSession } from "next-auth/react"; // YENİ: Dil üçün sessiya
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  jobTitle: string | null;
  phone: string | null;
  timezone: string;
  createdAt: Date;
  department: { name: string } | null;
  role: { name: string; color: string } | null;
  company: { name: string } | null;
};

export function ProfileClient({ user }: { user: ProfileUser }) {
  // YENİ: Tərcümə
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [name, setName] = useState(user.name);
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [timezone, setTimezone] = useState(user.timezone);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) return toast.error(t("profileClient.errorNameRequired") || "Ad tələb olunur");
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, jobTitle: jobTitle || null, phone: phone || null, timezone }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? (t("profileClient.errorGeneric") || "Xəta baş verdi"));
      toast.success(t("profileClient.successProfile") || "Profil yeniləndi");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) return toast.error(t("profileClient.errorFieldsRequired") || "Bütün sahələri doldurun");
    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? (t("profileClient.errorGeneric") || "Xəta baş verdi"));
      toast.success(t("profileClient.successPassword") || "Şifrə uğurla dəyişdirildi");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: summary card */}
      <div className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] p-6 shadow-sm h-fit">
        <div className="flex flex-col items-center text-center">
          <Avatar className="w-20 h-20 mb-3">
            <AvatarImage src={user.avatar ?? undefined} />
            <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{user.name}</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{user.jobTitle || (t("profileClient.noJobTitle") || "Vəzifə təyin edilməyib")}</p>
          {user.role && (
            <span
              className="mt-2 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: `${user.role.color}20`, color: user.role.color }}
            >
              {user.role.name}
            </span>
          )}
        </div>
        <div className="mt-6 space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> {user.email}
          </div>
          {user.department && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {user.department.name}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t("profileClient.joinedDate") || "Qoşulma"}: {new Intl.DateTimeFormat(lang === "en" ? "en-US" : lang === "ru" ? "ru-RU" : "az-AZ", { day: "numeric", month: "long", year: "numeric" }).format(new Date(user.createdAt))}
          </div>
        </div>
      </div>

      {/* Right: forms */}
      <div className="lg:col-span-2 space-y-6">
        <div className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-[hsl(var(--primary))]" />
            {t("profileClient.personalInfo") || "Şəxsi Məlumatlar"}
          </h3>
          <div className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>{t("profileClient.nameLabel") || "Ad Soyad"}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("profileClient.jobTitleLabel") || "Vəzifə"}</Label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={t("profileClient.jobTitlePlaceholder") || "Məs: Frontend Developer"} />
            </div>
            <div className="space-y-2">
              <Label>{t("profileClient.phoneLabel") || "Telefon"}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994 XX XXX XX XX" />
            </div>
            <div className="space-y-2">
              <Label>{t("profileClient.timezoneLabel") || "Saat Qurşağı"}</Label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
              >
                <option value="Asia/Baku">Asia/Baku (GMT+4)</option>
                <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
              </select>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? (t("profileClient.saving") || "Yadda saxlanılır...") : (t("profileClient.save") || "Yadda Saxla")}
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))] p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[hsl(var(--primary))]" />
            {t("profileClient.changePassword") || "Şifrəni Dəyiş"}
          </h3>
          <div className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>{t("profileClient.currentPassword") || "Hazırkı Şifrə"}</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("profileClient.newPassword") || "Yeni Şifrə"}</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{t("profileClient.passwordHint") || "Ən az 8 simvol, böyük/kiçik hərf və rəqəm daxil olmalıdır."}</p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={savePassword} disabled={savingPassword}>
                {savingPassword ? (t("profileClient.updating") || "Yenilənir...") : (t("profileClient.updatePassword") || "Şifrəni Yenilə")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}