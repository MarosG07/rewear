import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Plus, X, Search } from "lucide-react";
import { useStore } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import { avatarFor } from "../lib/images";
import { haptic } from "../lib/haptics";
import { NEIGHBORHOODS } from "../data/items";
import { useI18n } from "../lib/i18n";

const CATEGORIES = ["Dress", "Shirt", "Pants", "Jacket", "Sweater", "Skirt", "Shoes", "Sneakers", "Accessories"];

export default function Wishlist() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { session } = useAuth();
  const { wishlist, addWish, removeWish } = useStore();
  const myId = session?.user.id;

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await addWish({ title, category: category || undefined, neighborhood: neighborhood || undefined, note: note || undefined });
    setBusy(false);
    if (ok) {
      setAdding(false);
      setTitle("");
      setCategory("");
      setNeighborhood("");
      setNote("");
    }
  };

  const chip = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
      active ? "bg-[#6B7A5C] text-white shadow-sm" : "bg-[var(--rw-bg)] text-[var(--rw-ink)] hover:bg-[var(--rw-bg2)]"
    }`;

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)]">
      <div className="bg-[var(--rw-card)] border-b border-[var(--rw-ink)]/10 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--rw-bg)] rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
        </button>
        <h1 className="font-heading text-xl text-[var(--rw-ink)] flex-1">{t("wish.title")}</h1>
        <button
          onClick={() => {
            haptic();
            setAdding((a) => !a);
          }}
          className="w-9 h-9 bg-[#C2794A] rounded-full flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform"
        >
          {adding ? <X className="w-5 h-5" strokeWidth={2} /> : <Plus className="w-5 h-5" strokeWidth={2} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
        {adding && (
          <div className="bg-[var(--rw-card)] rounded-2xl p-4 shadow-sm space-y-3 animate-fade-up">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("wish.placeholder")}
              className="w-full bg-[var(--rw-bg)] rounded-xl px-3 py-2.5 text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
            />
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(category === c ? "" : c)} className={chip(category === c)}>{c}</button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {NEIGHBORHOODS.map((n) => (
                <button key={n} onClick={() => setNeighborhood(neighborhood === n ? "" : n)} className={chip(neighborhood === n)}>{n}</button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={t("wish.detailsPlaceholder")}
              className="w-full bg-[var(--rw-bg)] rounded-xl px-3 py-2.5 text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C] resize-none"
            />
            <button onClick={submit} disabled={busy || !title.trim()} className="w-full bg-[#C2794A] text-white py-2.5 rounded-xl font-medium disabled:opacity-50">
              {busy ? t("wish.posting") : t("wish.post")}
            </button>
          </div>
        )}

        {wishlist.length === 0 && !adding ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 pt-16">
            <div className="w-16 h-16 rounded-full bg-[var(--rw-bg2)] flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-[#6B7A5C]" strokeWidth={1.5} />
            </div>
            <p className="text-[var(--rw-ink)] font-medium">{t("wish.none")}</p>
            <p className="text-[var(--rw-ink)]/60 text-sm mt-1">{t("wish.noneSub")}</p>
          </div>
        ) : (
          wishlist.map((w) => (
            <div key={w.id} className="bg-[var(--rw-card)] rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <img src={avatarFor(w.user?.name, w.user?.avatar_url)} alt="" className="w-9 h-9 rounded-full" />
                <div className="flex-1">
                  <p className="text-xs text-[var(--rw-ink)]/60">{t("wish.userLooking", { name: w.user?.name ?? "A Rewearer" })}</p>
                  <p className="font-medium text-[var(--rw-ink)]">{w.title}</p>
                  {(w.category || w.neighborhood) && (
                    <div className="flex gap-1.5 mt-1.5">
                      {w.category && <span className="text-xs bg-[#6B7A5C]/12 text-[#6B7A5C] px-2 py-0.5 rounded-full">{w.category}</span>}
                      {w.neighborhood && <span className="text-xs bg-[var(--rw-ink)]/8 text-[var(--rw-ink)]/70 px-2 py-0.5 rounded-full">{w.neighborhood}</span>}
                    </div>
                  )}
                  {w.note && <p className="text-sm text-[var(--rw-ink)]/70 mt-1.5">{w.note}</p>}
                </div>
                {w.user_id === myId && (
                  <button onClick={() => removeWish(w.id)} aria-label="Remove" className="p-1.5 text-[var(--rw-ink)]/40 hover:text-[#b3402f] transition-colors">
                    <X className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
