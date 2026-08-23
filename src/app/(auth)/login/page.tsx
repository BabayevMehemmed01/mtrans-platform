"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Briefcase, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/lib/validations";
import { getTranslation } from "@/lib/i18n";
import { getLoginDirectory } from "@/lib/org-structure";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const LOGIN_DIRECTORY = getLoginDirectory();

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = getTranslation("az");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard/my-work";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loggingEmail, setLoggingEmail] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const submitCredentials = async (email: string, password: string) => {
    setServerError("");
    const result = loginSchema.safeParse({ email, password });
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
    setLoggingEmail(email);
    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
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
      setLoggingEmail(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCredentials(form.email, form.password);
  };

  const loginAs = (email: string, password: string) => {
    setForm({ email, password });
    setErrors({});
    void submitCredentials(email, password);
  };

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-4">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t("auth.loginTitle")}</h1>
        <p className="text-sm text-slate-400 mt-1">{t("auth.loginSubtitle")}</p>
      </div>

      {serverError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <span className="w-4 h-4 flex-shrink-0">⚠️</span>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="mt-5 rounded-lg bg-white/5 border border-white/10 p-3">
        <p className="text-xs text-slate-400 font-medium">Demo giriş — şöbə seçin</p>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-2.5">
          İşçiyə klikləyin: email/şifrə doldurulur və daxil olunur (şifrə: password123)
        </p>
        <ScrollArea className="h-[280px] pr-2">
          <Accordion type="single" collapsible className="space-y-2">
            {LOGIN_DIRECTORY.map((dept) => (
              <AccordionItem
                key={dept.key}
                value={dept.key}
                className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
              >
                <AccordionTrigger className="px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/5">
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="truncate">{dept.name}</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      {dept.people.length}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="border-white/10">
                  <ul className="p-1.5 space-y-0.5">
                    {dept.people.map((person) => {
                      const selected = form.email === person.email;
                      const busy = loggingEmail === person.email;
                      return (
                        <li key={person.email}>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => loginAs(person.email, person.password)}
                            className={`w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
                              selected
                                ? "bg-indigo-600/30 text-indigo-100"
                                : "hover:bg-white/10 text-slate-200"
                            }`}
                          >
                            <Avatar size="sm" className="size-7">
                              <AvatarFallback className="bg-indigo-500/30 text-[10px] text-indigo-100">
                                {busy ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  getInitials(person.name)
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-medium">
                                {person.name}
                              </span>
                              <span className="block truncate text-[10px] text-slate-400">
                                {person.jobTitle}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </div>

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
