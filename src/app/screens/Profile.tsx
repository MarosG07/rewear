import { useState } from "react";
import { Leaf, Package, TrendingDown, MapPin, Clock, Rocket, Check, Pencil, Bell, Plus, Settings as SettingsIcon, Search } from "lucide-react";
import { Link } from "react-router";
import BottomNav from "../components/BottomNav";
import SmartImage from "../components/SmartImage";
import ProfileEditSheet from "../components/ProfileEditSheet";
import AnimatedNumber from "../components/AnimatedNumber";
import { useStore, CREDIT_RULES } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import { listingImage, avatarFor } from "../lib/images";

export default function Profile() {
  const { profile, session } = useAuth();
  const { credits, myListings, conversations, ecoStats, boostListing, notificationsEnabled, enableNotifications } =
    useStore();
  const myId = session?.user.id;
  const [editing, setEditing] = useState(false);

  const completedSwaps = conversations.filter((c) => c.status === "completed");

  return (
    <div className="h-full flex flex-col bg-[#F5F0E8] relative overflow-hidden">
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
        {/* Profile header */}
        <div className="px-4 pt-5 pb-6">
          <div className="flex items-start gap-4 mb-6">
            <img
              src={avatarFor(profile?.name, profile?.avatar_url)}
              alt={profile?.name ?? "You"}
              className="w-20 h-20 rounded-full shadow-sm"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="font-heading text-2xl text-[#3D3530] mb-1">
                  {profile?.name ?? "You"}
                </h1>
                <div className="flex items-center gap-3 mt-1 shrink-0">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 text-xs text-[#3D3530]/50 hover:text-[#3D3530] transition-colors"
                  >
                    <Pencil className="w-4 h-4" strokeWidth={1.5} />
                    Edit
                  </button>
                  <Link
                    to="/settings"
                    className="flex items-center gap-1 text-xs text-[#3D3530]/50 hover:text-[#3D3530] transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" strokeWidth={1.5} />
                    Settings
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#3D3530]/60 mb-3">
                <MapPin className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-sm">{profile?.location ?? "Valencia, Spain"}</span>
              </div>
              <Link
                to="/credits"
                className="bg-gradient-to-r from-[#C2794A] to-[#b36d3f] text-white pl-4 pr-2.5 py-2 rounded-full inline-flex items-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
              >
                <Leaf className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-medium tabular-nums">
                  <AnimatedNumber value={credits} /> swap credits
                </span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
              </Link>
            </div>
          </div>

          {/* Eco stats */}
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <h2 className="font-heading text-lg text-[#3D3530] mb-4">Your impact</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#F5F0E8] rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5 text-[#6B7A5C]" strokeWidth={1.5} />
                </div>
                <p className="text-2xl font-heading text-[#3D3530] mb-0.5 tabular-nums">
                  {ecoStats.itemsSwapped}
                </p>
                <p className="text-xs text-[#3D3530]/60">Items swapped</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#F5F0E8] rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingDown className="w-5 h-5 text-[#6B7A5C]" strokeWidth={1.5} />
                </div>
                <p className="text-2xl font-heading text-[#3D3530] mb-0.5 tabular-nums">
                  {ecoStats.co2Saved}
                </p>
                <p className="text-xs text-[#3D3530]/60">kg CO₂ saved</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#F5F0E8] rounded-full flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-5 h-5 text-[#6B7A5C]" strokeWidth={1.5} />
                </div>
                <p className="text-2xl font-heading text-[#3D3530] mb-0.5 tabular-nums">
                  {ecoStats.kmAvoided}
                </p>
                <p className="text-xs text-[#3D3530]/60">km avoided</p>
              </div>
            </div>
          </div>
        </div>

        {/* Looking for */}
        <div className="px-4 -mt-2 mb-3">
          <Link
            to="/wishlist"
            className="w-full bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow active:scale-[0.99]"
          >
            <div className="w-9 h-9 bg-[#C2794A]/12 rounded-full flex items-center justify-center shrink-0">
              <Search className="w-4 h-4 text-[#C2794A]" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#3D3530]">Looking for something?</p>
              <p className="text-xs text-[#3D3530]/60">Post a wish — neighbors can offer it</p>
            </div>
          </Link>
        </div>

        {/* Notifications */}
        {!notificationsEnabled && (
          <div className="px-4 -mt-2 mb-6">
            <button
              onClick={enableNotifications}
              className="w-full bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow text-left active:scale-[0.99]"
            >
              <div className="w-9 h-9 bg-[#6B7A5C]/15 rounded-full flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-[#6B7A5C]" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#3D3530]">Turn on notifications</p>
                <p className="text-xs text-[#3D3530]/60">Get pinged when someone messages you</p>
              </div>
            </button>
          </div>
        )}

        {/* Listed items */}
        <div className="px-4 mb-6">
          <h2 className="font-heading text-xl text-[#3D3530] mb-4">Your listings</h2>
          {myListings.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-sm text-[#3D3530]/60 mb-3">You haven't listed anything yet.</p>
              <Link
                to="/list"
                className="inline-block bg-[#C2794A] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#b36d3f] transition-all active:scale-[0.98]"
              >
                List your first item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {myListings.map((item) => (
                <div key={item.id} className="relative">
                  <Link to={`/item/${item.id}`}>
                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <SmartImage
                          src={listingImage(item.image_url)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {item.status === "swapped" && (
                          <div className="absolute inset-0 z-[2] bg-black/40 flex items-center justify-center">
                            <span className="bg-white text-[#3D3530] px-3 py-1.5 rounded-full text-sm font-medium">
                              Swapped
                            </span>
                          </div>
                        )}
                        {item.boosted && (
                          <div className="absolute top-3 left-3 z-[2]">
                            <span className="bg-[#C2794A] text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm">
                              <Rocket className="w-3 h-3" strokeWidth={1.5} />
                              Boosted
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="text-sm font-medium text-[#3D3530] line-clamp-1">{item.name}</p>
                        <p className="text-xs text-[#3D3530]/60 line-clamp-1">
                          {[item.condition, item.neighborhood].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  </Link>
                  {item.status === "active" && !item.boosted && (
                    <button
                      onClick={() => boostListing(item.id)}
                      className="mt-2 w-full bg-white text-[#C2794A] border border-[#C2794A]/30 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-[#C2794A]/5 transition-all active:scale-[0.98]"
                    >
                      <Rocket className="w-4 h-4" strokeWidth={1.5} />
                      Boost
                      <span className="text-[#C2794A]/70 text-xs">−{CREDIT_RULES.BOOST}</span>
                    </button>
                  )}
                  {item.status === "active" && item.boosted && (
                    <div className="mt-2 w-full bg-[#6B7A5C]/10 text-[#6B7A5C] py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" strokeWidth={2} />
                      Boosted
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Swap history */}
        <div className="px-4">
          <h2 className="font-heading text-xl text-[#3D3530] mb-4">Swap history</h2>
          {completedSwaps.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-sm text-[#3D3530]/60">
                No completed swaps yet — finish one from your inbox to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedSwaps.map((swap) => {
                const partner = swap.requester_id === myId ? swap.owner : swap.requester;
                return (
                  <div key={swap.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex gap-3">
                      <img
                        src={listingImage(swap.listing?.image_url)}
                        alt={swap.listing?.name ?? "Swapped item"}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-[#3D3530] mb-0.5">
                          {swap.listing?.name ?? "Swapped item"}
                        </p>
                        <p className="text-sm text-[#3D3530]/70 mb-1">
                          Swapped with <span className="font-medium">{partner?.name ?? "a Rewearer"}</span>
                        </p>
                        <div className="flex items-center gap-1 text-xs text-[#3D3530]/60">
                          <Clock className="w-3 h-3" strokeWidth={1.5} />
                          <span>{swap.rated ? "Rated · 5 stars" : "Completed"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="profile" />
      {editing && <ProfileEditSheet onClose={() => setEditing(false)} />}
    </div>
  );
}
