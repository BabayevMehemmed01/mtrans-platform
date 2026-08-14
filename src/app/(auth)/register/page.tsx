"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, Mail, Lock, User, Building2, Loader2, Eye, EyeOff } from "lucide-react";
import { registerSchema } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Qeydiyyat zamanı xəta baş verdi");
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setServerError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-4">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Yeni Hesab Yarat</h1>
        <p className="text-sm text-slate-400 mt-1">Şirkətinizi platformada qeydiyyata alın</p>
      </div>

      {serverError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Ad */}
        <Field label="Ad Soyad" icon={User} name="name" type="text"
          value={form.name} onChange={handleChange}
          placeholder="Əli Həsənov" error={errors.name} autoComplete="name" />

        {/* Email */}
        <Field label="Email" icon={Mail} name="email" type="email"
          value={form.email} onChange={handleChange}
          placeholder="ad@sirket.com" error={errors.email} autoComplete="email" />

        {/* Şirkət */}
        <Field label="Şirkət Adı" icon={Building2} name="companyName" type="text"
          value={form.companyName} onChange={handleChange}
          placeholder="ABC Şirkət MMC" error={errors.companyName} />

        {/* Şifrə */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Şifrə</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              name="password" type={showPass ? "text" : "password"}
              value={form.password} onChange={handleChange}
              placeholder="Ən az 8 simvol"
              autoComplete="new-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
        </div>

        {/* Şifrə təsdiq */}
        <Field label="Şifrəni Təsdiq Et" icon={Lock} name="confirmPassword"
          type={showPass ? "text" : "password"}
          value={form.confirmPassword} onChange={handleChange}
          placeholder="••••••••" error={errors.confirmPassword} autoComplete="new-password" />

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors mt-1"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Qeydiyyat edilir...</> : "Hesab Yarat"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Artıq hesabınız var?{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Daxil Ol
        </Link>
      </p>
    </div>
  );
}

// Reusable Field component
function Field({
  label, icon: Icon, name, type, value, onChange, placeholder, error, autoComplete,
}: {
  label: string; icon: React.ElementType; name: string; type: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; error?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          name={name} type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
