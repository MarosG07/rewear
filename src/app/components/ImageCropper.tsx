import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ZoomIn } from "lucide-react";
import { cropToDataUrl } from "../lib/upload";
import { useI18n } from "../lib/i18n";

/**
 * Full-screen crop step shown after a photo is picked. The user drags to
 * reposition and pinches / slides to zoom; confirming returns a cropped JPEG
 * data URL at the listing aspect ratio (portrait 3:4 by default).
 */
export default function ImageCropper({
  src,
  aspect = 3 / 4,
  onCancel,
  onDone,
}: {
  src: string;
  aspect?: number;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const { t } = useI18n();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setAreaPx(pixels), []);

  const confirm = async () => {
    if (!areaPx || busy) return;
    setBusy(true);
    try {
      onDone(await cropToDataUrl(src, areaPx));
    } catch {
      onCancel();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black">
      <div className="shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 text-center">
        <p className="text-white font-medium">{t("list.cropTitle")}</p>
        <p className="text-white/55 text-xs mt-0.5">{t("list.cropHint")}</p>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          minZoom={1}
          maxZoom={3}
          restrictPosition
          showGrid
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="shrink-0 bg-[var(--rw-card)] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
        <div className="flex items-center gap-3">
          <ZoomIn className="w-4 h-4 text-[var(--rw-ink)]/50 shrink-0" strokeWidth={1.5} />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label={t("list.zoom")}
            className="w-full accent-[#6B7A5C]"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-5 bg-[var(--rw-bg)] text-[var(--rw-ink)] py-3 rounded-2xl font-medium hover:bg-[var(--rw-bg2)] transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={confirm}
            disabled={busy || !areaPx}
            className="flex-1 bg-[#C2794A] text-white py-3 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {t("list.usePhoto")}
          </button>
        </div>
      </div>
    </div>
  );
}
