import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ChevronLeft, Heart, MapPin, Check, Trash2, RotateCcw, Pencil, X, ChevronRight } from "lucide-react";
import SmartImage from "../components/SmartImage";
import { useStore, CREDIT_RULES } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import { listingImage, avatarFor } from "../lib/images";
import { haptic } from "../lib/haptics";

export default function ItemDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { session } = useAuth();
  const {
    getListing,
    loading,
    isSaved,
    toggleSaved,
    hasRequested,
    requestSwap,
    deleteListing,
    setListingStatus,
    myListings,
  } = useStore();
  const item = id ? getListing(id) : undefined;
  const [offering, setOffering] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--rw-bg)]">
        <div className="text-center">
          <p className="text-[var(--rw-ink)] mb-4">{loading ? "Loading…" : "Item not found"}</p>
          {!loading && (
            <button
              onClick={() => navigate("/")}
              className="bg-[#C2794A] text-white px-6 py-3 rounded-2xl font-medium"
            >
              Back to Browse
            </button>
          )}
        </div>
      </div>
    );
  }

  const saved = isSaved(item.id);
  const requested = hasRequested(item.id);
  const isOwn = item.owner_id === session?.user.id;
  const images = item.images?.length ? item.images : [listingImage(item.image_url)];
  const myActive = myListings.filter((l) => l.status === "active");

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)] overflow-hidden relative">
      {/* Photo carousel */}
      <div className="relative h-[55%] overflow-hidden bg-[var(--rw-bg2)]">
        <div className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {images.map((src, i) => (
            <div key={i} className="relative w-full h-full shrink-0 snap-center">
              <SmartImage src={src} alt={item.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 z-10 w-10 h-10 bg-[var(--rw-card)]/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-[var(--rw-card)] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
        </button>
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {images.map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--rw-card)]/80 shadow" />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 bg-[var(--rw-bg)] rounded-t-[32px] -mt-8 relative z-10 px-5 py-5 overflow-y-auto overscroll-contain">
        <h1 className="font-heading text-3xl text-[var(--rw-ink)] mb-2">{item.name}</h1>

        {item.neighborhood && (
          <div className="flex items-center gap-1.5 text-[var(--rw-ink)]/60 mb-4">
            <MapPin className="w-4 h-4 text-[#6B7A5C]" strokeWidth={1.5} />
            <span className="text-sm">{item.neighborhood}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {item.condition && (
            <span className="bg-[var(--rw-card)] px-3 py-1.5 rounded-full text-sm font-medium text-[var(--rw-ink)] shadow-sm">
              {item.condition}
            </span>
          )}
          {item.size && (
            <span className="bg-[var(--rw-card)] px-3 py-1.5 rounded-full text-sm font-medium text-[var(--rw-ink)] shadow-sm">
              Size {item.size}
            </span>
          )}
          {item.category && (
            <span className="bg-[#6B7A5C] px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm">
              {item.category}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-[var(--rw-ink)]/80 mb-6 leading-relaxed">{item.description}</p>
        )}

        {/* Owner card → profile */}
        <Link
          to={`/user/${item.owner_id}`}
          className="block bg-[var(--rw-card)] rounded-2xl p-4 shadow-sm mb-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <img
              src={avatarFor(item.owner?.name, item.owner?.avatar_url)}
              alt={item.owner?.name ?? "Owner"}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <p className="font-medium text-[var(--rw-ink)]">{item.owner?.name ?? "A Rewearer"}</p>
              <p className="text-sm text-[var(--rw-ink)]/70">{item.owner?.location ?? "Valencia, Spain"}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--rw-ink)]/40" strokeWidth={1.5} />
          </div>
        </Link>

        {/* Actions */}
        <div className="space-y-3 pb-5">
          {isOwn ? (
            <>
              <button
                onClick={() => navigate(`/item/${item.id}/edit`)}
                className="w-full bg-[#C2794A] text-white py-4 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Pencil className="w-5 h-5" strokeWidth={1.5} />
                Edit listing
              </button>
              <button
                onClick={() =>
                  setListingStatus(item.id, item.status === "swapped" ? "active" : "swapped")
                }
                className="w-full bg-[#6B7A5C] text-white py-4 rounded-2xl font-medium shadow-sm hover:bg-[#5d6b4f] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {item.status === "swapped" ? (
                  <>
                    <RotateCcw className="w-5 h-5" strokeWidth={1.5} />
                    Mark as available
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" strokeWidth={2} />
                    Mark as swapped
                  </>
                )}
              </button>
              <button
                onClick={async () => {
                  if (window.confirm("Delete this listing? This can't be undone.")) {
                    await deleteListing(item.id);
                    navigate("/profile");
                  }
                }}
                className="w-full bg-transparent text-[#b3402f] border border-[#b3402f]/30 py-4 rounded-2xl font-medium hover:bg-[#b3402f]/5 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                Delete listing
              </button>
            </>
          ) : (
            <>
              {requested ? (
                <button
                  disabled
                  className="w-full bg-[#6B7A5C] text-white py-4 rounded-2xl font-medium shadow-sm flex items-center justify-center gap-2 cursor-default"
                >
                  <Check className="w-5 h-5" strokeWidth={2} />
                  Swap requested
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedOffer(null);
                    setOffering(true);
                  }}
                  className="w-full bg-[#C2794A] text-white py-4 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Request swap</span>
                  <span className="text-white/80 text-sm">−{CREDIT_RULES.REQUEST_SWAP} credits</span>
                </button>
              )}
              <button
                onClick={() => {
                  haptic();
                  toggleSaved(item.id);
                }}
                className={`w-full py-4 rounded-2xl font-medium border transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  saved
                    ? "bg-[var(--rw-card)] text-[#C2794A] border-[#C2794A]/30"
                    : "bg-transparent text-[var(--rw-ink)] border-[var(--rw-ink)]/20 hover:bg-[var(--rw-card)]"
                }`}
              >
                <Heart
                  key={saved ? "on" : "off"}
                  className={`w-5 h-5 ${saved ? "fill-[#C2794A] text-[#C2794A] animate-pop" : ""}`}
                  strokeWidth={1.5}
                />
                {saved ? "Saved" : "Save item"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Offer-an-item sheet */}
      {offering && (
        <div
          className="absolute inset-0 z-30 flex items-end justify-center bg-black/40"
          onClick={() => setOffering(false)}
        >
          <div
            className="bg-[var(--rw-bg)] w-full rounded-t-3xl p-5 shadow-xl max-h-[75%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading text-xl text-[var(--rw-ink)]">Offer an item?</h2>
              <button onClick={() => setOffering(false)} className="p-1.5 hover:bg-[var(--rw-bg2)] rounded-full">
                <X className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
              </button>
            </div>
            <p className="text-sm text-[var(--rw-ink)]/60 mb-4">
              Optionally offer one of your listings in return — or just send the request.
            </p>
            {myActive.length === 0 ? (
              <p className="text-sm text-[var(--rw-ink)]/50 mb-4">You have no active listings to offer.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {myActive.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedOffer(selectedOffer === l.id ? null : l.id)}
                    className={`rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedOffer === l.id ? "border-[#C2794A]" : "border-transparent"
                    }`}
                  >
                    <div className="aspect-square">
                      <img src={listingImage(l.image_url)} alt={l.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] px-1 py-1 line-clamp-1 text-[var(--rw-ink)] bg-[var(--rw-card)]">{l.name}</p>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                requestSwap(item, selectedOffer ?? undefined);
                setOffering(false);
              }}
              className="w-full bg-[#C2794A] text-white py-3.5 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{selectedOffer ? "Send request with offer" : "Send request"}</span>
              <span className="text-white/80 text-sm">−{CREDIT_RULES.REQUEST_SWAP}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
