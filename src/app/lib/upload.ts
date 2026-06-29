import { supabase } from "./supabase";

/** Resize a picked photo down to a small JPEG data URL (fast + small uploads). */
export function fileToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read image"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Crops a region (in source-image pixels, as produced by react-easy-crop's
 * croppedAreaPixels) out of an image data URL and returns a JPEG data URL,
 * downscaled so the long edge is at most `maxOut`.
 */
export function cropToDataUrl(
  src: string,
  area: { x: number; y: number; width: number; height: number },
  maxOut = 1000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Could not read image"));
    img.onload = () => {
      const scale = Math.min(1, maxOut / Math.max(area.width, area.height));
      const w = Math.max(1, Math.round(area.width * scale));
      const h = Math.max(1, Math.round(area.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = src;
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** Uploads a (data-URL) image to the user's folder and returns the public URL. */
export async function uploadImage(userId: string, dataUrl: string): Promise<string | null> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from("listing-photos")
      .upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) return null;
    return supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}
