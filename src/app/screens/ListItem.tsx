import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Camera, X } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import { useStore, CREDIT_RULES } from "../store/AppStore";
import { fileToDataUrl } from "../lib/upload";
import { NEIGHBORHOODS } from "../data/items";

const categories = ["Dress", "Shirt", "Pants", "Jacket", "Sweater", "Skirt", "Shoes", "Sneakers", "Accessories"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const conditions = ["New", "Like New", "Good", "Worn"];

export default function ListItem() {
  const navigate = useNavigate();
  const { listItem } = useStore();
  const [title, setTitle] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [swapPreference, setSwapPreference] = useState("open");
  const [busy, setBusy] = useState(false);

  const handleFile = async (index: number, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setPhotos((p) => {
        const next = [...p];
        next[index] = url;
        return next;
      });
    } catch {
      toast.error("Couldn't load that image", { description: "Try another photo." });
    }
  };

  const removePhoto = (index: number) =>
    setPhotos((p) => {
      const next = [...p];
      next[index] = "";
      return next;
    });

  const handleSubmit = async () => {
    if (busy) return;
    if (!title.trim()) {
      toast.error("Add a title", { description: "Give your item a name first." });
      return;
    }
    if (!selectedCategory) {
      toast.error("Pick a category", { description: "Choose what kind of item this is." });
      return;
    }
    setBusy(true);
    const ok = await listItem({
      name: title.trim(),
      category: selectedCategory,
      condition: selectedCondition || "Good",
      size: selectedSize || "One Size",
      neighborhood: selectedNeighborhood || "Ruzafa",
      imageDataUrls: photos.filter(Boolean), // all uploaded photos (first = cover)
    });
    setBusy(false);
    if (ok) navigate("/profile");
  };

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)] relative overflow-hidden">
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--rw-bg)]/95 backdrop-blur-sm border-b border-[var(--rw-ink)]/10 px-4 py-3.5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[var(--rw-bg2)] rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
          </button>
          <h1 className="font-heading text-2xl text-[var(--rw-ink)]">List an item</h1>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-8">
        <div className="bg-[var(--rw-card)] rounded-3xl p-5 shadow-sm space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vintage Denim Jacket"
              className="w-full bg-[var(--rw-bg)] rounded-2xl px-4 py-3 text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">Photos</label>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <label
                  key={i}
                  className="relative aspect-square bg-[var(--rw-bg)] rounded-2xl flex items-center justify-center border-2 border-dashed border-[var(--rw-ink)]/20 hover:border-[#6B7A5C] transition-colors cursor-pointer overflow-hidden"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      handleFile(i, e.target.files?.[0]);
                      e.target.value = ""; // allow re-picking the same file
                    }}
                  />
                  {photos[i] ? (
                    <>
                      <img
                        src={photos[i]}
                        alt={`Photo ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removePhoto(i);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/55 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-[var(--rw-ink)]/40 mx-auto mb-1" strokeWidth={1.5} />
                      <span className="text-xs text-[var(--rw-ink)]/40">Add</span>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-[#6B7A5C] text-white shadow-sm"
                      : "bg-[var(--rw-bg)] text-[var(--rw-ink)] hover:bg-[var(--rw-bg2)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Neighborhood */}
          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">Neighborhood</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {NEIGHBORHOODS.map((n) => (
                <button
                  key={n}
                  onClick={() => setSelectedNeighborhood(n)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedNeighborhood === n
                      ? "bg-[#6B7A5C] text-white shadow-sm"
                      : "bg-[var(--rw-bg)] text-[var(--rw-ink)] hover:bg-[var(--rw-bg2)]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">Size</label>
            <div className="grid grid-cols-6 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedSize === size
                      ? "bg-[#6B7A5C] text-white shadow-sm"
                      : "bg-[var(--rw-bg)] text-[var(--rw-ink)] hover:bg-[var(--rw-bg2)]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">Condition</label>
            <div className="grid grid-cols-2 gap-2">
              {conditions.map((condition) => (
                <button
                  key={condition}
                  onClick={() => setSelectedCondition(condition)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedCondition === condition
                      ? "bg-[#6B7A5C] text-white shadow-sm"
                      : "bg-[var(--rw-bg)] text-[var(--rw-ink)] hover:bg-[var(--rw-bg2)]"
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          {/* Swap preference */}
          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">Swap preference</label>
            <div className="space-y-2">
              <button
                onClick={() => setSwapPreference("open")}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  swapPreference === "open"
                    ? "bg-[#6B7A5C] text-white shadow-sm"
                    : "bg-[var(--rw-bg)] text-[var(--rw-ink)] hover:bg-[var(--rw-bg2)]"
                }`}
              >
                <p className="font-medium">Open swap</p>
                <p className="text-sm opacity-80 mt-0.5">Accept any swap requests</p>
              </button>
              <button
                onClick={() => setSwapPreference("specific")}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  swapPreference === "specific"
                    ? "bg-[#6B7A5C] text-white shadow-sm"
                    : "bg-[var(--rw-bg)] text-[var(--rw-ink)] hover:bg-[var(--rw-bg2)]"
                }`}
              >
                <p className="font-medium">Specific item only</p>
                <p className="text-sm opacity-80 mt-0.5">Looking for something particular</p>
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full bg-[#C2794A] text-white py-4 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? (
              <span>Listing…</span>
            ) : (
              <>
                <span>List item</span>
                <span className="text-white/80 text-sm">+{CREDIT_RULES.LIST_ITEM} credits</span>
              </>
            )}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
