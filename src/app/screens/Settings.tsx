import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, LogOut, Bell, Mail, Lock, Trash2, Info, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../store/AuthContext";
import { useStore } from "../store/AppStore";
import { haptic } from "../lib/haptics";
import { getTheme, applyTheme, type Theme } from "../lib/theme";
import { useI18n, LANGS } from "../lib/i18n";

const APP_VERSION = "1.0";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => {
        haptic();
        onChange(!on);
      }}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-[#6B7A5C]" : "bg-[var(--rw-ink)]/20"}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-[var(--rw-card)] rounded-full shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function PrefRow({ label, prefKey, defaultOn = true }: { label: string; prefKey: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(() => localStorage.getItem(prefKey) !== "off" && (localStorage.getItem(prefKey) === "on" || defaultOn));
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[var(--rw-ink)]">{label}</span>
      <Toggle
        on={on}
        onChange={(v) => {
          setOn(v);
          localStorage.setItem(prefKey, v ? "on" : "off");
        }}
      />
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { session, signOut, changePassword, changeEmail, deleteAccount } = useAuth();
  const { notificationsEnabled, enableNotifications } = useStore();
  const { t, lang, setLang } = useI18n();

  const [emailMode, setEmailMode] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<Theme>(getTheme());

  const pickTheme = (t: Theme) => {
    haptic();
    setTheme(t);
    applyTheme(t);
  };

  const doChangeEmail = async () => {
    if (!newEmail.trim()) return;
    setBusy(true);
    const err = await changeEmail(newEmail.trim());
    setBusy(false);
    if (err) toast.error(err);
    else {
      toast.success("Check your inbox to confirm the new email");
      setEmailMode(false);
      setNewEmail("");
    }
  };

  const doChangePassword = async () => {
    if (newPw.length < 6) {
      toast.error("Password must be 6+ characters");
      return;
    }
    setBusy(true);
    const err = await changePassword(newPw);
    setBusy(false);
    if (err) toast.error(err);
    else {
      toast.success("Password updated");
      setPwMode(false);
      setNewPw("");
    }
  };

  const doDelete = async () => {
    if (!window.confirm("Delete your account and all your data? This can't be undone.")) return;
    setBusy(true);
    const err = await deleteAccount();
    setBusy(false);
    if (err) toast.error(err);
    else toast("Account deleted");
  };

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)]">
      <div className="bg-[var(--rw-card)] border-b border-[var(--rw-ink)]/10 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--rw-bg)] rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
        </button>
        <h1 className="font-heading text-xl text-[var(--rw-ink)]">{t("settings.title")}</h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-5">
        {/* Account */}
        <section className="bg-[var(--rw-card)] rounded-3xl p-5 shadow-sm">
          <h2 className="font-heading text-lg text-[var(--rw-ink)] mb-3">{t("settings.account")}</h2>
          <p className="text-sm text-[var(--rw-ink)]/60 mb-4 break-all">{session?.user.email}</p>

          {emailMode ? (
            <div className="space-y-2 mb-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t("settings.newEmail")}
                className="w-full bg-[var(--rw-bg)] rounded-xl px-3 py-2.5 text-[var(--rw-ink)] focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
              />
              <div className="flex gap-2">
                <button onClick={doChangeEmail} disabled={busy} className="flex-1 bg-[#6B7A5C] text-white py-2 rounded-xl text-sm font-medium disabled:opacity-60">{t("common.save")}</button>
                <button onClick={() => setEmailMode(false)} className="px-4 bg-[var(--rw-bg)] text-[var(--rw-ink)] py-2 rounded-xl text-sm font-medium">{t("common.cancel")}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEmailMode(true)} className="w-full flex items-center gap-3 py-2.5 text-[var(--rw-ink)] hover:text-[#6B7A5C] transition-colors">
              <Mail className="w-5 h-5" strokeWidth={1.5} /> {t("settings.changeEmail")}
            </button>
          )}

          {pwMode ? (
            <div className="space-y-2 mb-3">
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder={t("settings.newPassword")}
                className="w-full bg-[var(--rw-bg)] rounded-xl px-3 py-2.5 text-[var(--rw-ink)] focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
              />
              <div className="flex gap-2">
                <button onClick={doChangePassword} disabled={busy} className="flex-1 bg-[#6B7A5C] text-white py-2 rounded-xl text-sm font-medium disabled:opacity-60">{t("common.save")}</button>
                <button onClick={() => setPwMode(false)} className="px-4 bg-[var(--rw-bg)] text-[var(--rw-ink)] py-2 rounded-xl text-sm font-medium">{t("common.cancel")}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setPwMode(true)} className="w-full flex items-center gap-3 py-2.5 text-[var(--rw-ink)] hover:text-[#6B7A5C] transition-colors">
              <Lock className="w-5 h-5" strokeWidth={1.5} /> {t("settings.changePassword")}
            </button>
          )}

          <button onClick={signOut} className="w-full flex items-center gap-3 py-2.5 text-[var(--rw-ink)] hover:text-[#6B7A5C] transition-colors">
            <LogOut className="w-5 h-5" strokeWidth={1.5} /> {t("common.signOut")}
          </button>
          <button onClick={doDelete} disabled={busy} className="w-full flex items-center gap-3 py-2.5 text-[#b3402f] hover:opacity-80 transition-opacity disabled:opacity-60">
            <Trash2 className="w-5 h-5" strokeWidth={1.5} /> {t("settings.deleteAccount")}
          </button>
        </section>

        {/* Notifications */}
        <section className="bg-[var(--rw-card)] rounded-3xl p-5 shadow-sm">
          <h2 className="font-heading text-lg text-[var(--rw-ink)] mb-3">{t("settings.notifications")}</h2>
          {!notificationsEnabled ? (
            <button
              onClick={enableNotifications}
              className="w-full bg-[#6B7A5C] text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 mb-2"
            >
              <Bell className="w-4 h-4" strokeWidth={1.5} /> {t("settings.turnOnNotifs")}
            </button>
          ) : (
            <p className="text-sm text-[#6B7A5C] mb-1 flex items-center gap-2">
              <Bell className="w-4 h-4" strokeWidth={1.5} /> {t("settings.notifsOn")}
            </p>
          )}
          <div className="divide-y divide-[var(--rw-ink)]/5">
            <PrefRow label={t("settings.newMessages")} prefKey="notif.messages" />
            <PrefRow label={t("settings.swapRequests")} prefKey="notif.requests" />
            <PrefRow label={t("settings.swapAccepted")} prefKey="notif.accepted" />
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-[var(--rw-card)] rounded-3xl p-5 shadow-sm">
          <h2 className="font-heading text-lg text-[var(--rw-ink)] mb-3">{t("settings.appearance")}</h2>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: "light", label: t("settings.light"), Icon: Sun },
              { v: "dark", label: t("settings.dark"), Icon: Moon },
              { v: "system", label: t("settings.system"), Icon: Monitor },
            ] as const).map(({ v, label, Icon }) => (
              <button
                key={v}
                onClick={() => pickTheme(v)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all ${
                  theme === v
                    ? "border-[#6B7A5C] bg-[#6B7A5C]/10 text-[#6B7A5C]"
                    : "border-[var(--rw-ink)]/15 text-[var(--rw-ink)]/70 hover:bg-[var(--rw-bg)]"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Language */}
        <section className="bg-[var(--rw-card)] rounded-3xl p-5 shadow-sm">
          <h2 className="font-heading text-lg text-[var(--rw-ink)] mb-3">{t("settings.language")}</h2>
          <div className="grid grid-cols-3 gap-2">
            {LANGS.map(({ code, label, flag }) => (
              <button
                key={code}
                onClick={() => {
                  haptic();
                  setLang(code);
                }}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all ${
                  lang === code
                    ? "border-[#6B7A5C] bg-[#6B7A5C]/10 text-[#6B7A5C]"
                    : "border-[var(--rw-ink)]/15 text-[var(--rw-ink)]/70 hover:bg-[var(--rw-bg)]"
                }`}
              >
                <span className="text-lg leading-none">{flag}</span>
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="bg-[var(--rw-card)] rounded-3xl p-5 shadow-sm">
          <h2 className="font-heading text-lg text-[var(--rw-ink)] mb-3">{t("settings.about")}</h2>
          <div className="flex items-center gap-3 text-[var(--rw-ink)]/70 text-sm">
            <Info className="w-5 h-5 text-[#6B7A5C]" strokeWidth={1.5} />
            <span>Rewear · v{APP_VERSION} · Circular fashion, locally</span>
          </div>
        </section>
      </div>
    </div>
  );
}
