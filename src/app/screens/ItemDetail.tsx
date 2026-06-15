import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Star, Heart, MapPin, Check } from "lucide-react";
import SmartImage from "../components/SmartImage";
import { useStore, CREDIT_RULES } from "../store/AppStore";

export default function ItemDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isSaved, toggleSaved, hasRequested, requestSwap, getItem } = useStore();
  const item = getItem(Number(id));

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F5F0E8]">
        <div className="text-center">
          <p className="text-[#3D3530] mb-4">Item not found</p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#C2794A] text-white px-6 py-3 rounded-2xl font-medium"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const saved = isSaved(item.id);
  const requested = hasRequested(item.id);

  return (
    <div className="h-full flex flex-col bg-[#F5F0E8] overflow-hidden">
      {/* Full-bleed photo */}
      <div className="relative h-[55%] overflow-hidden">
        <SmartImage
          src={item.image}
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
        {/* Item name */}
        <h1 className="font-heading text-3xl text-[#3D3530] mb-2">
          {item.name}
        </h1>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-[#3D3530]/60 mb-4">
          <MapPin className="w-4 h-4 text-[#6B7A5C]" strokeWidth={1.5} />
          <span className="text-sm">
            {item.neighborhood} · {item.distance} away
          </span>
        </div>

        {/* Condition chips */}
        <div className="flex gap-2 mb-4">
          <span className="bg-white px-3 py-1.5 rounded-full text-sm font-medium text-[#3D3530] shadow-sm">
            {item.condition}
          </span>
          <span className="bg-white px-3 py-1.5 rounded-full text-sm font-medium text-[#3D3530] shadow-sm">
            Size {item.size}
          </span>
          <span className="bg-[#6B7A5C] px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm">
            {item.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-[#3D3530]/80 mb-6 leading-relaxed">
          {item.description}
        </p>

        {/* Owner info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <img
              src={item.owner.avatar}
              alt={item.owner.name}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <p className="font-medium text-[#3D3530]">{item.owner.name}</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[#C2794A] fill-[#C2794A]" strokeWidth={1.5} />
                <span className="text-sm text-[#3D3530]/70">
                  {item.owner.rating} · {item.owner.swapCount} swaps
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pb-5">
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
        </div>
      </div>
    </div>
  );
}
