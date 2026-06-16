import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Leaf, Sparkles, CreditCard } from "lucide-react";
import { useStore } from "../store/AppStore";

const PACKAGES = [
  { credits: 10, price: "€2.99", tag: "" },
  { credits: 25, price: "€5.99", tag: "Popular" },
  { credits: 60, price: "€11.99", tag: "Best value" },
];

export default function Credits() {
  const navigate = useNavigate();
  const { credits, purchaseCredits } = useStore();
  const [busy, setBusy] = useState<number | null>(null);

  const buy = async (amount: number) => {
    if (busy !== null) return;
    setBusy(amount);
    // Simulated checkout — placeholder, no real charge.
    await new Promise((r) => setTimeout(r, 800));
    await purchaseCredits(amount);
    setBusy(null);
  };

  return (
    <div className="h-full flex flex-col bg-[#F5F0E8]">
      <div className="bg-white border-b border-[#3D3530]/10 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F5F0E8] rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#3D3530]" strokeWidth={1.5} />
        </button>
        <h1 className="font-heading text-xl text-[#3D3530]">Get more credits</h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-6">
        {/* Current balance */}
        <div className="bg-gradient-to-br from-[#C2794A] to-[#b36d3f] text-white rounded-3xl p-5 shadow-sm mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Leaf className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm opacity-90">Your balance</span>
          </div>
          <p className="font-heading text-4xl tabular-nums">{credits}</p>
          <p className="text-sm opacity-90">swap credits</p>
        </div>

        <div className="space-y-3">
          {PACKAGES.map((p) => (
            <button
              key={p.credits}
              onClick={() => buy(p.credits)}
              disabled={busy !== null}
              className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-60 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#6B7A5C]/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#6B7A5C]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-xl text-[#3D3530]">{p.credits} credits</p>
                  {p.tag && (
                    <span className="text-[10px] font-medium bg-[#C2794A]/15 text-[#C2794A] px-2 py-0.5 rounded-full">
                      {p.tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#3D3530]/60">{p.price}</p>
              </div>
              <div className="text-[#C2794A] font-medium text-sm shrink-0">
                {busy === p.credits ? "Processing…" : "Buy"}
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 justify-center text-[#3D3530]/45 text-xs mt-6">
          <CreditCard className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Demo checkout — no real payment is taken.</span>
        </div>
      </div>
    </div>
  );
}
