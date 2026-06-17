import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Plus, X, Search } from "lucide-react";
import { useStore } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import { avatarFor } from "../lib/images";
import { haptic } from "../lib/haptics";
import { NEIGHBORHOODS } from "../data/items";

const CATEGORIES = ["Dress", "Shirt", "Pants", "Jacket", "Sweater", "Skirt", "Shoes", "Sneakers", "Accessories"];

export default function Wishlist() {
  const navigate = useNavigate();
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
      active ? "bg-[#6B7A5C] text-white shadow-sm" : "bg-[#F5F0E8] text-[#3D3530] hover:bg-[#E8DDD0]"
    }`;

  return (
    <div className="h-full flex flex-col bg-[#F5F0E8]">
      <div className="bg-white border-b border-[#3D3530]/10 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F5F0E8] rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#3D3530]" strokeWidth={1.5} />
        </button>
        <h1 className="font-heading text-xl text-[#3D3530] flex-1">Looking for</h1>
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
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3 animate-fade-up">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you looking for? (e.g. black wool coat)"
              className="w-full bg-[#F5F0E8] rounded-xl px-3 py-2.5 text-[#3D3530] placeholder-[#3D3530]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
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
              placeholder="Any details (size, color)…"
              className="w-full bg-[#F5F0E8] rounded-xl px-3 py-2.5 text-[#3D3530] placeholder-[#3D3530]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C] resize-none"
            />
            <button onClick={submit} disabled={busy || !title.trim()} className="w-full bg-[#C2794A] text-white py-2.5 rounded-xl font-medium disabled:opacity-50">
              {busy ? "Posting…" : "Post"}
            </button>
          </div>
        )}

        {wishlist.length === 0 && !adding ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 pt-16">
            <div className="w-16 h-16 rounded-full bg-[#E8DDD0] flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-[#6B7A5C]" strokeWidth={1.5} />
            </div>
            <p className="text-[#3D3530] font-medium">No wishes yet</p>
            <p className="text-[#3D3530]/60 text-sm mt-1">Post what you're hunting for and neighbors can offer it.</p>
          </div>
        ) : (
          wishlist.map((w) => (
            <div key={w.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <img src={avatarFor(w.user?.name, w.user?.avatar_url)} alt="" className="w-9 h-9 rounded-full" />
                <div className="flex-1">
                  <p className="text-xs text-[#3D3530]/60">{w.user?.name ?? "A Rewearer"} is looking for</p>
                  <p className="font-medium text-[#3D3530]">{w.title}</p>
                  {(w.category || w.neighborhood) && (
                    <div className="flex gap-1.5 mt-1.5">
                      {w.category && <span className="text-xs bg-[#6B7A5C]/12 text-[#6B7A5C] px-2 py-0.5 rounded-full">{w.category}</span>}
                      {w.neighborhood && <span className="text-xs bg-[#3D3530]/8 text-[#3D3530]/70 px-2 py-0.5 rounded-full">{w.neighborhood}</span>}
                    </div>
                  )}
                  {w.note && <p className="text-sm text-[#3D3530]/70 mt-1.5">{w.note}</p>}
                </div>
                {w.user_id === myId && (
                  <button onClick={() => removeWish(w.id)} aria-label="Remove" className="p-1.5 text-[#3D3530]/40 hover:text-[#b3402f] transition-colors">
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
