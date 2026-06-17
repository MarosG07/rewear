import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, MapPin, Star } from "lucide-react";
import SmartImage from "../components/SmartImage";
import { supabase } from "../lib/supabase";
import { avatarFor, listingImage } from "../lib/images";
import type { Profile, Listing, Review } from "../lib/types";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: l }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("listings")
          .select("*, owner:owner_id(id,name,avatar_url,location)")
          .eq("owner_id", id)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        supabase
          .from("reviews")
          .select("*, reviewer:reviewer_id(id,name,avatar_url)")
          .eq("reviewee_id", id)
          .order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      setProfile((p as Profile) ?? null);
      setListings((l as Listing[]) ?? []);
      setReviews((r as Review[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)] relative overflow-hidden">
      <div className="bg-[var(--rw-card)] border-b border-[var(--rw-ink)]/10 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--rw-bg)] rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
        </button>
        <h1 className="font-heading text-xl text-[var(--rw-ink)]">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-[var(--rw-ink)]/50">Loading…</div>
        ) : !profile ? (
          <div className="flex items-center justify-center h-40 text-[var(--rw-ink)]/50">User not found</div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 pt-5 pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={avatarFor(profile.name, profile.avatar_url)}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full shadow-sm"
                />
                <div className="flex-1">
                  <h2 className="font-heading text-2xl text-[var(--rw-ink)] mb-1">{profile.name}</h2>
                  <div className="flex items-center gap-1 text-[var(--rw-ink)]/60 mb-1.5">
                    <MapPin className="w-4 h-4" strokeWidth={1.5} />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                  {reviews.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#C2794A] fill-[#C2794A]" strokeWidth={1.5} />
                      <span className="text-sm text-[var(--rw-ink)] font-medium">{avg.toFixed(1)}</span>
                      <span className="text-sm text-[var(--rw-ink)]/60">
                        · {reviews.length} review{reviews.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--rw-ink)]/50">No reviews yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Their listings */}
            <div className="px-4 mb-6">
              <h3 className="font-heading text-lg text-[var(--rw-ink)] mb-3">Listings</h3>
              {listings.length === 0 ? (
                <p className="text-sm text-[var(--rw-ink)]/60">No active listings.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {listings.map((item) => (
                    <Link key={item.id} to={`/item/${item.id}`}>
                      <div className="bg-[var(--rw-card)] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-[3/4] relative overflow-hidden">
                          <SmartImage
                            src={listingImage(item.image_url)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="px-3 py-2.5">
                          <p className="text-sm font-medium text-[var(--rw-ink)] line-clamp-1">{item.name}</p>
                          <p className="text-xs text-[var(--rw-ink)]/60 line-clamp-1">
                            {[item.condition, item.neighborhood].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="px-4">
                <h3 className="font-heading text-lg text-[var(--rw-ink)] mb-3">Reviews</h3>
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-[var(--rw-card)] rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={avatarFor(rev.reviewer?.name, rev.reviewer?.avatar_url)}
                          alt={rev.reviewer?.name ?? "Reviewer"}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm font-medium text-[var(--rw-ink)] flex-1">
                          {rev.reviewer?.name ?? "A Rewearer"}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i <= rev.rating ? "text-[#C2794A] fill-[#C2794A]" : "text-[var(--rw-ink)]/20"}`}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="text-sm text-[var(--rw-ink)]/80">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
