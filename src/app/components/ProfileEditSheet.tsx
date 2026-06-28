import { useState } from "react";
import { X, Camera } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../store/AuthContext";
import { useStore } from "../store/AppStore";
import { fileToDataUrl, uploadImage } from "../lib/upload";
import { avatarFor } from "../lib/images";
import { useI18n } from "../lib/i18n";

export default function ProfileEditSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { profile, session, updateProfile } = useAuth();
  const { reload } = useStore();
  const [name, setName] = useState(profile?.name ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("toast.chooseImage"));
      return;
    }
    try {
      setAvatarPreview(await fileToDataUrl(file, 400));
    } catch {
      toast.error(t("pe.loadImageFailed"));
    }
  };

  const save = async () => {
    if (busy) return;
    if (!name.trim()) {
      toast.error(t("toast.addName"));
      return;
    }
    setBusy(true);
    let avatar_url: string | undefined;
    if (avatarPreview && session) {
      const url = await uploadImage(session.user.id, avatarPreview);
      if (url) avatar_url = url;
      else toast.error(t("pe.photoFailed"));
    }
    const err = await updateProfile({
      name: name.trim(),
      location: location.trim() || "Valencia, Spain",
      ...(avatar_url ? { avatar_url } : {}),
    });
    setBusy(false);
    if (err) {
      toast.error(err);
      return;
    }
    // Refresh the marketplace so the new photo replaces the old one everywhere
    // it's shown denormalized (your listings, chat threads), not just here.
    if (avatar_url) void reload();
    toast.success(t("pe.updated"));
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-[var(--rw-bg)] w-full rounded-t-3xl sm:rounded-3xl sm:max-w-[360px] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl text-[var(--rw-ink)]">{t("pe.title")}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--rw-bg2)] rounded-full transition-colors">
            <X className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex justify-center mb-5">
          <label className="relative cursor-pointer">
            <img
              src={avatarPreview ?? avatarFor(profile?.name, profile?.avatar_url)}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-7 h-7 bg-[#C2794A] rounded-full flex items-center justify-center border-2 border-[var(--rw-bg)]">
              <Camera className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        </div>

        <label className="block text-sm text-[var(--rw-ink)] font-medium mb-1.5">{t("pe.name")}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[var(--rw-card)] rounded-2xl px-4 py-3 mb-3 text-[var(--rw-ink)] focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
        />
        <label className="block text-sm text-[var(--rw-ink)] font-medium mb-1.5">{t("pe.location")}</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-[var(--rw-card)] rounded-2xl px-4 py-3 mb-5 text-[var(--rw-ink)] focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
        />

        <button
          onClick={save}
          disabled={busy}
          className="w-full bg-[#C2794A] text-white py-3.5 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? t("list.saving") : t("list.saveChanges")}
        </button>
      </div>
    </div>
  );
}
