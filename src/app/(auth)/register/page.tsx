"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Mail,
  Lock,
  User,
  Building2,
  Loader2,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { registerSchema, inviteRegisterSchema } from "@/lib/validations";
import { getTranslation } from "@/lib/i18n";

type InviteInfo = {
  email: string;
  name: string;
  surname: string;
  roleName: string | null;
  departmentName: string | null;
};

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const t = useMemo(() => getTranslation("az"), []);

  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    roleName: "",
    departmentName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(Boolean(token));
  const [inviteValid, setInviteValid] = useState(false);

  useEffect(() => {
    if (!token) {
      setInviteLoading(false);
      setInviteValid(false);
      return;
    }

    const inviteInvalidMsg = t("auth.inviteInvalid");
    const networkErrorMsg = t("auth.networkError");

    let cancelled = false;
    const verify = async () => {
      setInviteLoading(true);
      setServerError("");
      try {
        const res = await fetch(`/api/invites/verify?token=${encodeURIComponent(token)}`);
        const data: InviteInfo & { error?: string } = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setInviteValid(false);
          setServerError(data.error || inviteInvalidMsg);
          return;
        }
        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          surname: data.surname || "",
          email: data.email || "",
          roleName: data.roleName || "",
          departmentName: data.departmentName || "",
        }));
        setInviteValid(true);
      } catch {
        if (!cancelled) {
          setInviteValid(false);
          setServerError(networkErrorMsg);
        }
      } finally {
        if (!cancelled) setInviteLoading(false);
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (token) {
      const result = inviteRegisterSchema.safeParse({
        token,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
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
          setServerError(data.error ?? t("auth.registerError"));
        } else {
          router.push("/login?registered=true");
        }
      } catch {
        setServerError(t("auth.networkError"));
      } finally {
        setLoading(false);
      }
      return;
    }

    const result = registerSchema.safeParse({
      name: form.name,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      companyName: form.companyName,
    });
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
        setServerError(data.error ?? t("auth.registerError"));
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setServerError(t("auth.networkError"));
    } finally {
      setLoading(false);
    }
  };

  const isInviteMode = Boolean(token);

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl">
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-4">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          {isInviteMode ? t("auth.inviteTitle") : t("auth.registerTitle")}
        </h1>
        <p className="text-sm text-slate-400 mt-1 text-center">
          {isInviteMode ? t("auth.inviteSubtitle") : t("auth.registerSubtitle")}
        </p>
      </div>

      {serverError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {serverError}
        </div>
      )}

      {inviteLoading ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">{t("auth.inviteLoading")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isInviteMode ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label={t("auth.firstName")}
                  icon={User}
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("auth.firstName")}
                  error={errors.name}
                  readOnly
                />
                <Field
                  label={t("auth.lastName")}
                  icon={User}
                  name="surname"
                  type="text"
                  value={form.surname}
                  onChange={handleChange}
                  placeholder={t("auth.lastName")}
                  error={errors.surname}
                  readOnly
                />
              </div>
              <Field
                label={t("auth.email")}
                icon={Mail}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t("auth.emailPlaceholder")}
                error={errors.email}
                autoComplete="email"
                readOnly
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label={t("auth.role")}
                  icon={Shield}
                  name="roleName"
                  type="text"
                  value={form.roleName || "—"}
                  onChange={handleChange}
                  placeholder={t("auth.role")}
                  readOnly
                />
                <Field
                  label={t("auth.department")}
                  icon={Building2}
                  name="departmentName"
                  type="text"
                  value={form.departmentName || "—"}
                  onChange={handleChange}
                  placeholder={t("auth.department")}
                  readOnly
                />
              </div>
            </>
          ) : (
            <>
              <Field
                label={t("auth.fullName")}
                icon={User}
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder={t("auth.namePlaceholder")}
                error={errors.name}
                autoComplete="name"
              />
              <Field
                label={t("auth.email")}
                icon={Mail}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t("auth.emailPlaceholder")}
                error={errors.email}
                autoComplete="email"
              />
              <Field
                label={t("auth.companyName")}
                icon={Building2}
                name="companyName"
                type="text"
                value={form.companyName}
                onChange={handleChange}
                placeholder={t("auth.companyPlaceholder")}
                error={errors.companyName}
              />
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{t("auth.password")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                name="password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder={t("auth.passwordPlaceholder")}
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

          <Field
            label={t("auth.confirmPassword")}
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
            disabled={loading || (isInviteMode && !inviteValid)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors mt-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isInviteMode ? t("auth.acceptingInvite") : t("auth.registering")}
              </>
            ) : isInviteMode ? (
              t("auth.acceptInvite")
            ) : (
              t("auth.createAccount")
            )}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-slate-500">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
          {t("auth.signInLink")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

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
  readOnly,
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
  readOnly?: boolean;
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
          readOnly={readOnly}
          disabled={readOnly}
          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
            readOnly
              ? "bg-white/5 border-white/10 text-slate-400 cursor-not-allowed"
              : "bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          }`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
