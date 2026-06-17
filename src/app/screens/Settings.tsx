import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, LogOut, Bell, Mail, Lock, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../store/AuthContext";
import { useStore } from "../store/AppStore";
import { haptic } from "../lib/haptics";

const APP_VERSION = "1.0";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => {
        haptic();
        onChange(!on);
      }}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-[#6B7A5C]" : "bg-[#3D3530]/20"}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function PrefRow({ label, prefKey, defaultOn = true }: { label: string; prefKey: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(() => localStorage.getItem(prefKey) !== "off" && (localStorage.getItem(prefKey) === "on" || defaultOn));
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[#3D3530]">{label}</span>
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

  const [emailMode, setEmailMode] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

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
    <div className="h-full flex flex-col bg-[#F5F0E8]">
      <div className="bg-white border-b border-[#3D3530]/10 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F5F0E8] rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#3D3530]" strokeWidth={1.5} />
        </button>
        <h1 className="font-heading text-xl text-[#3D3530]">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-5">
        {/* Account */}
        <section className="bg-white rounded-3xl p-5 shadow-sm">
          <h2 className="font-heading text-lg text-[#3D3530] mb-3">Account</h2>
          <p className="text-sm text-[#3D3530]/60 mb-4 break-all">{session?.user.email}</p>

          {emailMode ? (
            <div className="space-y-2 mb-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email"
                className="w-full bg-[#F5F0E8] rounded-xl px-3 py-2.5 text-[#3D3530] focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
              />
              <div className="flex gap-2">
                <button onClick={doChangeEmail} disabled={busy} className="flex-1 bg-[#6B7A5C] text-white py-2 rounded-xl text-sm font-medium disabled:opacity-60">Save</button>
                <button onClick={() => setEmailMode(false)} className="px-4 bg-[#F5F0E8] text-[#3D3530] py-2 rounded-xl text-sm font-medium">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEmailMode(true)} className="w-full flex items-center gap-3 py-2.5 text-[#3D3530] hover:text-[#6B7A5C] transition-colors">
              <Mail className="w-5 h-5" strokeWidth={1.5} /> Change email
            </button>
          )}

          {pwMode ? (
            <div className="space-y-2 mb-3">
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password"
                className="w-full bg-[#F5F0E8] rounded-xl px-3 py-2.5 text-[#3D3530] focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
              />
              <div className="flex gap-2">
                <button onClick={doChangePassword} disabled={busy} className="flex-1 bg-[#6B7A5C] text-white py-2 rounded-xl text-sm font-medium disabled:opacity-60">Save</button>
                <button onClick={() => setPwMode(false)} className="px-4 bg-[#F5F0E8] text-[#3D3530] py-2 rounded-xl text-sm font-medium">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setPwMode(true)} className="w-full flex items-center gap-3 py-2.5 text-[#3D3530] hover:text-[#6B7A5C] transition-colors">
              <Lock className="w-5 h-5" strokeWidth={1.5} /> Change password
            </button>
          )}

          <button onClick={signOut} className="w-full flex items-center gap-3 py-2.5 text-[#3D3530] hover:text-[#6B7A5C] transition-colors">
            <LogOut className="w-5 h-5" strokeWidth={1.5} /> Sign out
          </button>
          <button onClick={doDelete} disabled={busy} className="w-full flex items-center gap-3 py-2.5 text-[#b3402f] hover:opacity-80 transition-opacity disabled:opacity-60">
            <Trash2 className="w-5 h-5" strokeWidth={1.5} /> Delete account
          </button>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-3xl p-5 shadow-sm">
          <h2 className="font-heading text-lg text-[#3D3530] mb-3">Notifications</h2>
          {!notificationsEnabled ? (
            <button
              onClick={enableNotifications}
              className="w-full bg-[#6B7A5C] text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 mb-2"
            >
              <Bell className="w-4 h-4" strokeWidth={1.5} /> Turn on notifications
            </button>
          ) : (
            <p className="text-sm text-[#6B7A5C] mb-1 flex items-center gap-2">
              <Bell className="w-4 h-4" strokeWidth={1.5} /> Notifications are on
            </p>
          )}
          <div className="divide-y divide-[#3D3530]/5">
            <PrefRow label="New messages" prefKey="notif.messages" />
            <PrefRow label="Swap requests" prefKey="notif.requests" />
            <PrefRow label="Swap accepted" prefKey="notif.accepted" />
          </div>
        </section>

        {/* About */}
        <section className="bg-white rounded-3xl p-5 shadow-sm">
          <h2 className="font-heading text-lg text-[#3D3530] mb-3">About</h2>
          <div className="flex items-center gap-3 text-[#3D3530]/70 text-sm">
            <Info className="w-5 h-5 text-[#6B7A5C]" strokeWidth={1.5} />
            <span>Rewear · v{APP_VERSION} · Circular fashion, locally</span>
          </div>
        </section>
      </div>
    </div>
  );
}
