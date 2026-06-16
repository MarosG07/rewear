import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Heart, MapPin, Check, Trash2, RotateCcw } from "lucide-react";
import SmartImage from "../components/SmartImage";
import { useStore, CREDIT_RULES } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import { listingImage, avatarFor } from "../lib/images";

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
  } = useStore();
  const item = id ? getListing(id) : undefined;

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F5F0E8]">
        <div className="text-center">
          <p className="text-[#3D3530] mb-4">{loading ? "Loading…" : "Item not found"}</p>
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

  return (
    <div className="h-full flex flex-col bg-[#F5F0E8] overflow-hidden">
      {/* Full-bleed photo */}
      <div className="relative h-[55%] overflow-hidden">
        <SmartImage
          src={listingImage(item.image_url)}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#3D3530]" strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#F5F0E8] rounded-t-[32px] -mt-8 relative z-10 px-5 py-5 overflow-y-auto">
        <h1 className="font-heading text-3xl text-[#3D3530] mb-2">{item.name}</h1>

        {item.neighborhood && (
          <div className="flex items-center gap-1.5 text-[#3D3530]/60 mb-4">
            <MapPin className="w-4 h-4 text-[#6B7A5C]" strokeWidth={1.5} />
            <span className="text-sm">{item.neighborhood}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {item.condition && (
            <span className="bg-white px-3 py-1.5 rounded-full text-sm font-medium text-[#3D3530] shadow-sm">
              {item.condition}
            </span>
          )}
          {item.size && (
            <span className="bg-white px-3 py-1.5 rounded-full text-sm font-medium text-[#3D3530] shadow-sm">
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
          <p className="text-[#3D3530]/80 mb-6 leading-relaxed">{item.description}</p>
        )}

        {/* Owner info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <img
              src={avatarFor(item.owner?.name, item.owner?.avatar_url)}
              alt={item.owner?.name ?? "Owner"}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <p className="font-medium text-[#3D3530]">{item.owner?.name ?? "A Rewearer"}</p>
              <p className="text-sm text-[#3D3530]/70">{item.owner?.location ?? "Valencia, Spain"}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pb-5">
          {isOwn ? (
            <>
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
                  onClick={() => requestSwap(item)}
                  className="w-full bg-[#C2794A] text-white py-4 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Request swap</span>
                  <span className="text-white/80 text-sm">−{CREDIT_RULES.REQUEST_SWAP} credits</span>
                </button>
              )}
              <button
                onClick={() => toggleSaved(item.id)}
                className={`w-full py-4 rounded-2xl font-medium border transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  saved
                    ? "bg-white text-[#C2794A] border-[#C2794A]/30"
                    : "bg-transparent text-[#3D3530] border-[#3D3530]/20 hover:bg-white"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${saved ? "fill-[#C2794A] text-[#C2794A]" : ""}`}
                  strokeWidth={1.5}
                />
                {saved ? "Saved" : "Save item"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
