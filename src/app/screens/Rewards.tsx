import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Flame, Gift, Copy, Check, Package, Repeat, Leaf, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import { haptic } from "../lib/haptics";

const todayUTC = () => new Date().toISOString().slice(0, 10);

export default function Rewards() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { conversations, myListings, dailyCheckin, redeemReferral } = useStore();

  const [claiming, setClaiming] = useState(false);
  const [claimedToday, setClaimedToday] = useState(profile?.last_checkin === todayUTC());
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const streak = profile?.streak ?? 0;
  const completed = conversations.filter((c) => c.status === "completed").length;
  const listed = myListings.length;

  const achievements = [
    { label: "First listing", desc: "List an item", Icon: Package, done: listed >= 1 },
    { label: "First swap", desc: "Complete a swap", Icon: Repeat, done: completed >= 1 },
    { label: "Swap pro", desc: "5 swaps", Icon: Award, done: completed >= 5 },
    { label: "Eco hero", desc: "10 swaps", Icon: Leaf, done: completed >= 10 },
    { label: "On a roll", desc: "3-day streak", Icon: Flame, done: streak >= 3 },
    { label: "Week warrior", desc: "7-day streak", Icon: Sparkles, done: streak >= 7 },
  ];

  const checkin = async () => {
    if (claiming || claimedToday) return;
    haptic();
    setClaiming(true);
    const res = await dailyCheckin();
    setClaiming(false);
    if (res?.claimed) {
      setClaimedToday(true);
      toast.success(`+${res.bonus} credits`, { description: `Day ${res.streak} streak 🔥` });
    } else if (res && !res.claimed) {
      setClaimedToday(true);
      toast("Already claimed today", { description: "Come back tomorrow!" });
    }
  };

  const copyCode = async () => {
    if (!profile?.referral_code) return;
    try {
      await navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      haptic();
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const redeem = async () => {
    if (!code.trim() || redeeming) return;
    setRedeeming(true);
    const res = await redeemReferral(code.trim());
    setRedeeming(false);
    if (res?.ok) {
      toast.success(res.msg);
      setCode("");
      await refreshProfile();
    } else if (res) {
      toast.error(res.msg);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)]">
      <div className="bg-[var(--rw-card)] border-b border-[var(--rw-ink)]/10 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--rw-bg)] rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
        </button>
        <h1 className="font-heading text-xl text-[var(--rw-ink)]">Rewards</h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-5">
        {/* Daily check-in */}
        <section className="bg-gradient-to-br from-[#C2794A] to-[#b36d3f] text-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm opacity-90">Daily streak</span>
          </div>
          <p className="font-heading text-4xl tabular-nums mb-3">
            {streak} <span className="text-xl font-normal opacity-80">day{streak === 1 ? "" : "s"}</span>
          </p>
          <button
            onClick={checkin}
            disabled={claiming || claimedToday}
            className="w-full bg-white/95 text-[#3D3530] py-3 rounded-2xl font-medium active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {claimedToday ? "Claimed — see you tomorrow 👋" : claiming ? "Claiming…" : "Claim today's bonus"}
          </button>
        </section>

        {/* Achievements */}
        <section>
          <h2 className="font-heading text-lg text-[var(--rw-ink)] mb-3 px-1">Achievements</h2>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a) => (
              <div
                key={a.label}
                className={`bg-[var(--rw-card)] rounded-2xl p-4 shadow-sm flex items-center gap-3 ${a.done ? "" : "opacity-50"}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    a.done ? "bg-[#6B7A5C]/15 text-[#6B7A5C]" : "bg-[var(--rw-bg2)] text-[var(--rw-ink)]/40"
                  }`}
                >
                  <a.Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--rw-ink)] truncate">{a.label}</p>
                  <p className="text-xs text-[var(--rw-ink)]/60 truncate">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Referral */}
        <section className="bg-[var(--rw-card)] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-5 h-5 text-[#C2794A]" strokeWidth={1.5} />
            <h2 className="font-heading text-lg text-[var(--rw-ink)]">Invite a friend</h2>
          </div>
          <p className="text-sm text-[var(--rw-ink)]/60 mb-3">
            Share your code — you both get +5 credits when they redeem it.
          </p>
          <button
            onClick={copyCode}
            className="w-full bg-[var(--rw-bg)] rounded-2xl px-4 py-3 flex items-center justify-between mb-4 active:scale-[0.99] transition-transform"
          >
            <span className="font-heading text-2xl tracking-widest text-[var(--rw-ink)]">
              {profile?.referral_code ?? "······"}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-[#C2794A] font-medium">
              {copied ? <Check className="w-4 h-4" strokeWidth={2} /> : <Copy className="w-4 h-4" strokeWidth={1.5} />}
              {copied ? "Copied" : "Copy"}
            </span>
          </button>

          {!profile?.referred_by && (
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter a friend's code"
                maxLength={6}
                className="flex-1 bg-[var(--rw-bg)] rounded-xl px-3 py-2.5 text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
              />
              <button
                onClick={redeem}
                disabled={!code.trim() || redeeming}
                className="px-4 bg-[#6B7A5C] text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {redeeming ? "…" : "Redeem"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
