import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import { fileToDataUrl } from "../lib/upload";
import { listingImage } from "../lib/images";
import { NEIGHBORHOODS } from "../data/items";
import { useI18n } from "../lib/i18n";
import type { Listing } from "../lib/types";

const categories = ["Dress", "Shirt", "Pants", "Jacket", "Sweater", "Skirt", "Shoes", "Sneakers", "Accessories"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
const conditions = ["New", "Like New", "Good", "Worn"];

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { session } = useAuth();
  const { getListing, loading } = useStore();
  const item = id ? getListing(id) : undefined;

  if (!item) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--rw-bg)]">
        <p className="text-[var(--rw-ink)]/60">{loading ? t("common.loading") : t("list.notFound")}</p>
      </div>
    );
  }
  if (item.owner_id !== session?.user.id) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--rw-bg)] gap-4">
        <p className="text-[var(--rw-ink)]">{t("list.onlyOwn")}</p>
        <button onClick={() => navigate(-1)} className="bg-[#C2794A] text-white px-6 py-3 rounded-2xl font-medium">
          {t("list.goBack")}
        </button>
      </div>
    );
  }
  return <EditForm item={item} />;
}

function EditForm({ item }: { item: Listing }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { updateListing } = useStore();
  const [title, setTitle] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [category, setCategory] = useState(item.category ?? "");
  const [neighborhood, setNeighborhood] = useState(item.neighborhood ?? "");
  const [size, setSize] = useState(item.size ?? "");
  const [condition, setCondition] = useState(item.condition ?? "");
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const existing = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];

  const handleFile = async (index: number, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("toast.chooseImage"));
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setNewPhotos((p) => {
        const next = [...p];
        next[index] = url;
        return next;
      });
    } catch {
      toast.error("Couldn't load that image");
    }
  };

  const handleSubmit = async () => {
    if (busy) return;
    if (!title.trim()) {
      toast.error(t("toast.addTitle"));
      return;
    }
    setBusy(true);
    const newImgs = newPhotos.filter(Boolean);
    const ok = await updateListing(
      item.id,
      {
        name: title.trim(),
        category: category || "Other",
        condition: condition || "Good",
        size: size || "One Size",
        neighborhood: neighborhood || "Ruzafa",
        description: description.trim() || undefined,
      },
      newImgs.length ? newImgs : undefined,
    );
    setBusy(false);
    if (ok) navigate(`/item/${item.id}`);
  };

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
      active ? "bg-[#6B7A5C] text-white shadow-sm" : "bg-[var(--rw-bg)] text-[var(--rw-ink)] hover:bg-[var(--rw-bg2)]"
    }`;

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)] relative overflow-hidden">
      <div className="bg-[var(--rw-card)] border-b border-[var(--rw-ink)]/10 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--rw-bg)] rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
        </button>
        <h1 className="font-heading text-xl text-[var(--rw-ink)]">{t("item.editListing")}</h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-8">
        <div className="bg-[var(--rw-card)] rounded-3xl p-5 shadow-sm space-y-5">
          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">{t("list.fieldTitle")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--rw-bg)] rounded-2xl px-4 py-3 text-[var(--rw-ink)] focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
            />
          </div>

          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">{t("list.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t("list.descPlaceholder")}
              className="w-full bg-[var(--rw-bg)] rounded-2xl px-4 py-3 text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C] resize-none"
            />
          </div>

          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">{t("list.photos")}</label>
            {newPhotos.filter(Boolean).length === 0 && existing.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                {existing.map((src, i) => (
                  <img key={i} src={listingImage(src)} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ))}
              </div>
            )}
            <p className="text-xs text-[var(--rw-ink)]/50 mb-2">{t("list.replacePhotos")}</p>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <label
                  key={i}
                  className="aspect-square bg-[var(--rw-bg)] rounded-2xl flex items-center justify-center border-2 border-dashed border-[var(--rw-ink)]/20 hover:border-[#6B7A5C] transition-colors cursor-pointer relative overflow-hidden"
                >
                  {newPhotos[i] ? (
                    <>
                      <img src={newPhotos[i]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setNewPhotos((p) => {
                            const next = [...p];
                            next[i] = "";
                            return next;
                          });
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center z-10"
                      >
                        <X className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-[var(--rw-ink)]/40 mx-auto mb-1" strokeWidth={1.5} />
                      <span className="text-xs text-[var(--rw-ink)]/40">{t("list.add")}</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(i, e.target.files?.[0])}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">{t("home.category")}</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={chip(category === c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">{t("home.neighborhood")}</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {NEIGHBORHOODS.map((n) => (
                <button key={n} onClick={() => setNeighborhood(n)} className={chip(neighborhood === n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">{t("list.size")}</label>
            <div className="flex gap-2 flex-wrap">
              {sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)} className={chip(size === s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[var(--rw-ink)] font-medium mb-3">{t("home.condition")}</label>
            <div className="grid grid-cols-2 gap-2">
              {conditions.map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    condition === c
                      ? "bg-[#6B7A5C] text-white shadow-sm"
                      : "bg-[var(--rw-bg)] text-[var(--rw-ink)] hover:bg-[var(--rw-bg2)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full bg-[#C2794A] text-white py-4 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? t("list.saving") : t("list.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
