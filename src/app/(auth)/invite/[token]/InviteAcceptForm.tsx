"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { acceptInviteSchema } from "@/lib/validations";

export function InviteAcceptForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", password: "", confirmPassword: "" });
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

    const result = acceptInviteSchema.safeParse(form);
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
      const res = await fetch(`/api/invites/accept/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Xəta baş verdi");
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
    <>
      {serverError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
          <input
            value={email}
            disabled
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-500 text-sm cursor-not-allowed"
          />
        </div>

        {/* Ad */}
        <Field
          label="Ad Soyad"
          icon={User}
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Əli Həsənov"
          error={errors.name}
          autoComplete="name"
        />

        {/* Şifrə */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Şifrə</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              name="password"
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Ən az 8 simvol"
              autoComplete="new-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
        </div>

        {/* Şifrə təsdiq */}
        <Field
          label="Şifrəni Təsdiq Et"
          icon={Lock}
          name="confirmPassword"
          type={showPass ? "text" : "password"}
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors mt-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Hesab yaradılır...
            </>
          ) : (
            "Dəvəti Qəbul Et"
          )}
        </button>
      </form>
    </>
  );
}

// Reusable Field component (register səhifəsindəki nümunə ilə eyni)
function Field({
  label,
  icon: Icon,
  name,
  type,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}: {
  label: string;
  icon: React.ElementType;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
