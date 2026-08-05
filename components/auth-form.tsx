"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/lib/i18n";
import { strings, t } from "@/lib/strings";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-client";
import { useUiFeedback } from "@/lib/ui-feedback";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

function friendlyAuthMessage(message: string, language: string) {
  if (message === "Invalid login credentials") {
    return language === "vi" ? "Sai email hoặc mật khẩu. Hãy kiểm tra lại thông tin đăng nhập." : "Invalid email or password. Please check your login details.";
  }

  if (message === "Email not confirmed") {
    return language === "vi" ? "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư." : "Email not confirmed. Please check your inbox.";
  }

  return message;
}

export function AuthForm({ mode }: AuthFormProps) {
  const { language } = useLanguage();
  const { pushNotice, setBanner } = useUiFeedback();
  const router = useRouter();
  const s = strings.auth;
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage(`${t(s.authMissing, language)} (${process.env.NEXT_PUBLIC_SUPABASE_URL ? "client ready" : "missing env"})`);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
      }
    }).catch((err) => {
      console.error("[Auth] Failed to check existing session:", err);
    });

    return () => {
      active = false;
    };
  }, [language, supabase, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    setLoading(true);
    setMessage(null);
    setBanner(null);

    if (!supabase) {
      const text = t(s.authMissing, language);
      setMessage(text);
      pushNotice({ title: language === "vi" ? "Lỗi đăng nhập" : "Auth error", message: text, tone: "error" });
      setLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const timeoutMs = 15000;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      setLoading(false);
      const timeoutText = language === "vi"
        ? "Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra kết nối mạng và thử lại."
        : "Cannot reach authentication server. Please check your network and try again.";
      setMessage(timeoutText);
      setBanner({ title: language === "vi" ? "Hết thời gian kết nối" : "Connection timed out", message: timeoutText, tone: "error" });
    }, timeoutMs);

    try {
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
          : await supabase.auth.signUp({
              email: normalizedEmail,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/login`
              }
            });

      if (timedOut) return;
      clearTimeout(timer);

      if (result.error) {
        console.error("[Auth] Sign-in error:", result.error);
        const friendly = friendlyAuthMessage(result.error.message, language);
        const text = `${t(s.errorPrefix, language)}: ${friendly}`;
        setMessage(text);
        setBanner({ title: language === "vi" ? "Xác thực thất bại" : "Authentication failed", message: friendly, tone: "error" });
        pushNotice({ title: language === "vi" ? "Lỗi đăng nhập" : "Auth error", message: friendly, tone: "error" });
        setLoading(false);
        return;
      }

      if (mode === "login") {
        if (!result.data.session) {
          console.error("[Auth] signInWithPassword returned without session");
          const friendly = language === "vi" ? "Không thể tạo phiên đăng nhập. Vui lòng thử lại." : "Unable to create a sign-in session. Please try again.";
          const text = `${t(s.errorPrefix, language)}: ${friendly}`;
          setMessage(text);
          setBanner({ title: language === "vi" ? "Đăng nhập chưa hoàn tất" : "Sign-in incomplete", message: friendly, tone: "warning" });
          pushNotice({ title: language === "vi" ? "Đăng nhập chưa hoàn tất" : "Sign-in incomplete", message: friendly, tone: "warning" });
          setLoading(false);
          return;
        }

        pushNotice({ title: language === "vi" ? "Đăng nhập thành công" : "Signed in", message: language === "vi" ? "Chào mừng quay lại!" : "Welcome back!", tone: "success" });
        router.replace("/dashboard");
        return;
      }

      const successText = t(s.confirmEmail, language);
      setMessage(successText);
      setBanner({ title: language === "vi" ? "Kiểm tra email" : "Check your email", message: successText, tone: "success" });
      pushNotice({ title: language === "vi" ? "Đăng ký thành công" : "Account created", message: successText, tone: "success" });
      setLoading(false);
    } catch (err) {
      if (timedOut) return;
      clearTimeout(timer);
      console.error("[Auth] Unexpected error in handleSubmit:", err);
      const friendly = language === "vi"
        ? "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại."
        : "Connection error. Please check your network and try again.";
      setMessage(friendly);
      setBanner({ title: language === "vi" ? "Lỗi kết nối" : "Connection error", message: friendly, tone: "error" });
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand opacity-25 blur-3xl animate-float" />
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-accent opacity-20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="overflow-hidden rounded-3xl border border-border glass-strong p-6 shadow-card sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-2xl shadow-glow">
              <span aria-hidden>⚡</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              {mode === "login" ? t(s.welcomeBack, language) : t(s.createAccount, language)} ✨
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold text-card-foreground sm:text-3xl">
              {mode === "login" ? t(s.loginTitle, language) : t(s.signupTitle, language)}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? t(s.loginDesc, language) : t(s.signupDesc, language)}</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm">
              <span className="text-muted-foreground">📧 {t(s.email, language)}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-glow"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="text-muted-foreground">🔒 {t(s.password, language)}</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background/70 px-4 py-3 pr-12 text-foreground outline-none transition focus:border-primary focus:ring-glow"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg opacity-70 transition hover:opacity-100"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition ease-spring hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <span className="inline-flex items-center gap-2"><span className="animate-spin">⏳</span> {t(s.wait, language)}</span> : mode === "login" ? t(s.submitLogin, language) : t(s.submitSignup, language)}
            </button>

            {message ? (
              <div className="rounded-2xl border border-border bg-background/60 p-3 text-sm text-muted-foreground animate-fade-in">{message}</div>
            ) : null}
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <a href={mode === "login" ? "/signup" : "/login"} className="inline-flex items-center gap-1 transition hover:text-primary">
              {mode === "login" ? t(s.needAccount, language) : t(s.haveAccount, language)} →
            </a>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">{t(s.loginRedirect, language)}</p>
      </div>
    </div>
  );
}
