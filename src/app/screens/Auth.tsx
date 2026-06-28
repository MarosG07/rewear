import { useState } from "react";
import { toast } from "sonner";
import Logo from "../components/Logo";
import { useAuth } from "../store/AuthContext";
import { useI18n } from "../lib/i18n";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (mode === "signup" && !name.trim()) {
      toast.error(t("toast.addName"));
      return;
    }
    if (!email.trim() || password.length < 6) {
      toast.error(t("toast.enterEmailPw"));
      return;
    }
    setBusy(true);
    const error =
      mode === "signup"
        ? await signUp(email.trim(), password, name.trim())
        : await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      toast.error(error);
    } else if (mode === "signup") {
      toast.success(t("auth.welcomeToast"));
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)] relative overflow-hidden">
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="flex flex-col items-center mb-8">
          <Logo size="large" showText={true} />
          <p className="text-[var(--rw-ink)]/60 text-sm mt-3 tracking-wide">
            {t("common.tagline")}
          </p>
        </div>

        <form onSubmit={submit} className="bg-[var(--rw-card)] rounded-3xl p-6 shadow-sm space-y-4">
          <h1 className="font-heading text-2xl text-[var(--rw-ink)]">
            {mode === "signin" ? t("auth.welcomeBack") : t("auth.createAccount")}
          </h1>

          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.name")}
              autoComplete="name"
              className="w-full bg-[var(--rw-bg)] rounded-2xl px-4 py-3 text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.email")}
            autoComplete="email"
            className="w-full bg-[var(--rw-bg)] rounded-2xl px-4 py-3 text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.password")}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full bg-[var(--rw-bg)] rounded-2xl px-4 py-3 text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
          />

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#C2794A] text-white py-4 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? t("auth.pleaseWait") : mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-center text-sm text-[var(--rw-ink)]/70 mt-5 hover:text-[var(--rw-ink)]"
        >
          {mode === "signin" ? t("auth.newHere") : t("auth.haveAccount")}
        </button>
      </div>
    </div>
  );
}
