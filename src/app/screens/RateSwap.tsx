import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Star } from "lucide-react";
import { useStore, CREDIT_RULES } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import { avatarFor } from "../lib/images";

const RATING_WORDS = ["", "Poor", "Okay", "Good", "Great", "Excellent"];

export default function RateSwap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { conversations, submitReview } = useStore();
  const myId = session?.user.id;
  const convo = id ? conversations.find((c) => c.id === id) : undefined;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!convo) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--rw-bg)] gap-4">
        <p className="text-[var(--rw-ink)]/60">Swap not found</p>
        <button onClick={() => navigate("/inbox")} className="bg-[#C2794A] text-white px-6 py-3 rounded-2xl font-medium">
          Back to inbox
        </button>
      </div>
    );
  }

  const partner = convo.requester_id === myId ? convo.owner : convo.requester;
  const alreadyRated = convo.rated;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    await submitReview(convo.id, rating, comment);
    setBusy(false);
    navigate("/inbox");
  };

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)]">
      <div className="bg-[var(--rw-card)] border-b border-[var(--rw-ink)]/10 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate("/inbox")} className="p-2 hover:bg-[var(--rw-bg)] rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
        </button>
        <h1 className="font-heading text-xl text-[var(--rw-ink)]">Rate your swap</h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 flex flex-col items-center">
        <img
          src={avatarFor(partner?.name, partner?.avatar_url)}
          alt={partner?.name ?? "Partner"}
          className="w-20 h-20 rounded-full shadow-sm mb-3"
        />
        <p className="text-[var(--rw-ink)] mb-1">
          How was swapping with <span className="font-medium">{partner?.name ?? "them"}</span>?
        </p>

        {alreadyRated ? (
          <p className="text-[var(--rw-ink)]/60 mt-6">You've already reviewed this swap. 🙌</p>
        ) : (
          <>
            <div className="flex gap-1.5 mt-5 mb-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setRating(i)} className="p-1 active:scale-90 transition-transform">
                  <Star
                    className={`w-9 h-9 ${i <= rating ? "text-[#C2794A] fill-[#C2794A]" : "text-[var(--rw-ink)]/20"}`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-[#6B7A5C] font-medium h-5 mb-5">{RATING_WORDS[rating]}</p>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Add a comment (optional)…"
              className="w-full bg-[var(--rw-card)] rounded-2xl px-4 py-3 text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C] resize-none"
            />

            <button
              onClick={submit}
              disabled={busy}
              className="w-full bg-[#C2794A] text-white py-4 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] disabled:opacity-60 mt-5 flex items-center justify-center gap-2"
            >
              {busy ? "Submitting…" : "Submit review"}
              {!busy && <span className="text-white/80 text-sm">+{CREDIT_RULES.FIVE_STAR}</span>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
