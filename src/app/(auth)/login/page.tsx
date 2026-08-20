"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Briefcase, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/lib/validations";
import { getTranslation } from "@/lib/i18n";

const DEMO_USERS = [
  { labelKey: "demoAdmin", email: "admin@demo.com", password: "Admin@1234" },
  { labelKey: "demoFounder", email: "founder@mtrans.com", password: "Founder@1234" },
  { labelKey: "demoSeniorDev", email: "ali@demo.com", password: "Member@1234" },
  { labelKey: "demoFinance", email: "gunel@demo.com", password: "Member@1234" },
  { labelKey: "demoFrontend", email: "leyla@demo.com", password: "Member@1234" },
  { labelKey: "demoCeo", email: "m.babayev@m-trans.az", password: "Admin@1234" },
  { labelKey: "demoLogistics", email: "nicat@demo.com", password: "Member@1234" },
] as const;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = getTranslation("az");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const fillDemo = (email: string, password: string) => {
    setForm({ email, password });
    setErrors({});
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    // Client-side validation
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      });

      if (res?.error) {
        setServerError(
          res.error === "CredentialsSignin"
            ? t("auth.invalidCredentials")
            : res.error
        );
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setServerError(t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-4">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t("auth.loginTitle")}</h1>
        <p className="text-sm text-slate-400 mt-1">{t("auth.loginSubtitle")}</p>
      </div>

      {/* Server Error */}
      {serverError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <span className="w-4 h-4 flex-shrink-0">⚠️</span>
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {t("auth.email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("auth.emailPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {t("auth.password")}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("auth.signingIn")}
            </>
          ) : (
            t("auth.signIn")
          )}
        </button>
      </form>

      {/* Demo credentials */}
      <div className="mt-5 p-3 rounded-lg bg-white/5 border border-white/10">
        <p className="text-xs text-slate-400 font-medium">{t("auth.demoTitle")}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-2.5">{t("auth.demoHint")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {DEMO_USERS.map((user) => {
            const selected = form.email === user.email;
            return (
              <button
                key={user.email}
                type="button"
                title={user.email}
                onClick={() => fillDemo(user.email, user.password)}
                className={`w-full px-2.5 py-1.5 rounded-full text-xs font-medium border truncate transition-all duration-150 ${
                  selected
                    ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-200 shadow-[0_0_0_1px_rgba(99,102,241,0.25)]"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white"
                }`}
              >
                {t(`auth.${user.labelKey}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Register link */}
      <p className="mt-5 text-center text-sm text-slate-500">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          {t("auth.registerLink")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
