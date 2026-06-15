// Fallbacks for listings/users that don't have an uploaded image yet.

export const FALLBACK_LISTING_IMAGE =
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800";

export function listingImage(url?: string | null): string {
  return url || FALLBACK_LISTING_IMAGE;
}

/** A name-initial avatar when the user has no uploaded photo. */
export function avatarFor(name?: string | null, url?: string | null): string {
  if (url) return url;
  const n = encodeURIComponent((name || "Rewear").trim() || "Rewear");
  return `https://ui-avatars.com/api/?name=${n}&background=6B7A5C&color=fff&bold=true`;
}
