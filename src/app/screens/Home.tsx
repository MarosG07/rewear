import { useState } from "react";
import { Link } from "react-router";
import { Search, MapPin, Grid3x3, Map, Leaf, Heart, PackageOpen, SlidersHorizontal, X } from "lucide-react";
import BottomNav from "../components/BottomNav";
import Logo from "../components/Logo";
import SmartImage from "../components/SmartImage";
import MapView from "../components/MapView";
import { useStore } from "../store/AppStore";
import { listingImage, avatarFor } from "../lib/images";
import { NEIGHBORHOODS } from "../data/items";

const CATEGORIES = ["Dress", "Shirt", "Pants", "Jacket", "Sweater", "Skirt", "Shoes", "Sneakers", "Accessories", "Coat", "Scarf", "Bag"];
const CONDITIONS = ["New", "Like New", "Good", "Worn"];

const chipCls = (active: boolean) =>
  `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
    active ? "bg-[#6B7A5C] text-white shadow-sm" : "bg-white text-[#3D3530] hover:bg-[#E8DDD0]"
  }`;

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-[#3D3530] mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onChange("")} className={chipCls(value === "")}>
          All
        </button>
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className={chipCls(value === o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const { credits, listings, loading, isSaved, toggleSaved } = useStore();
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [fCategory, setFCategory] = useState("");
  const [fCondition, setFCondition] = useState("");
  const [fNeighborhood, setFNeighborhood] = useState("");
  const [sort, setSort] = useState<"new" | "old">("new");

  const activeFilters = [fCategory, fCondition, fNeighborhood].filter(Boolean).length;
  const isFiltering = activeFilters > 0 || search.trim().length > 0;

  const filtered = listings
    .filter((l) => {
      if (l.status !== "active") return false; // don't show swapped items in browse
      const q = search.trim().toLowerCase();
      if (q && ![l.name, l.category, l.neighborhood].some((v) => v?.toLowerCase().includes(q)))
        return false;
      if (fCategory && l.category !== fCategory) return false;
      if (fCondition && l.condition !== fCondition) return false;
      if (fNeighborhood && l.neighborhood !== fNeighborhood) return false;
      return true;
    })
    .sort((a, b) =>
      sort === "new" ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at),
    );

  const clearFilters = () => {
    setFCategory("");
    setFCondition("");
    setFNeighborhood("");
  };

  return (
    <div className="h-full flex flex-col bg-[#F5F0E8] relative overflow-hidden isolate">
      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-[#3D3530]/10 px-4 py-3.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Logo size="small" showText={true} />
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#6B7A5C]" strokeWidth={1.5} />
              <span className="text-[#3D3530] text-xs">Valencia, Spain</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#C2794A] to-[#b36d3f] text-white pl-2.5 pr-3 py-1.5 rounded-full shadow-sm">
              <Leaf className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="text-xs font-medium tabular-nums">{credits}</span>
            </div>
            <button
              onClick={() => setShowSearch((s) => !s)}
              className={`p-2 rounded-full transition-colors ${showSearch ? "bg-[#E8DDD0]" : "hover:bg-[#E8DDD0]"}`}
            >
              <Search className="w-5 h-5 text-[#3D3530]" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex-1 py-2 px-4 rounded-2xl transition-all ${
              viewMode === "grid"
                ? "bg-white shadow-sm text-[#3D3530]"
                : "bg-transparent text-[#3D3530]/60"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Grid3x3 className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm font-medium">Grid</span>
            </div>
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex-1 py-2 px-4 rounded-2xl transition-all ${
              viewMode === "map"
                ? "bg-white shadow-sm text-[#3D3530]"
                : "bg-transparent text-[#3D3530]/60"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Map className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm font-medium">Map</span>
            </div>
          </button>
        </div>

        {/* Search + filters */}
        {showSearch && (
          <div className="flex gap-2 mt-3">
            <div className="flex-1 relative">
              <Search
                className="w-4 h-4 text-[#3D3530]/40 absolute left-3 top-1/2 -translate-y-1/2"
                strokeWidth={1.5}
              />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items, categories…"
                className="w-full bg-white rounded-2xl pl-9 pr-3 py-2.5 text-sm text-[#3D3530] placeholder-[#3D3530]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
              />
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              className="relative px-3.5 bg-white rounded-2xl flex items-center justify-center text-[#3D3530] hover:bg-[#E8DDD0] transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} />
              {activeFilters > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C2794A] text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "map" ? (
        <div className="flex-1 overflow-hidden px-4 py-4">
          <MapView listings={filtered} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overscroll-contain pb-8 px-4">
          {loading ? (
          <div className="grid grid-cols-2 gap-3 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm">
                <div className="aspect-[3/4] bg-[#E8DDD0] animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#E8DDD0] rounded animate-pulse" />
                  <div className="h-2.5 w-2/3 bg-[#E8DDD0] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <PackageOpen className="w-12 h-12 text-[#6B7A5C] mb-3" strokeWidth={1.5} />
            <p className="text-[#3D3530] font-medium">{isFiltering ? "No matches" : "No items yet"}</p>
            <p className="text-[#3D3530]/60 text-sm mt-1 mb-5">
              {isFiltering
                ? "Try a different search or clear your filters."
                : "Be the first to list something for your neighborhood to swap."}
            </p>
            {isFiltering ? (
              <button
                onClick={() => {
                  setSearch("");
                  clearFilters();
                }}
                className="bg-[#C2794A] text-white px-6 py-3 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98]"
              >
                Clear filters
              </button>
            ) : (
              <Link
                to="/list"
                className="bg-[#C2794A] text-white px-6 py-3 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98]"
              >
                List an item
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-4">
            {filtered.map((item) => {
              const saved = isSaved(item.id);
              return (
                <Link key={item.id} to={`/item/${item.id}`} className="group">
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <SmartImage
                        src={listingImage(item.image_url)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.category && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-[#3D3530]">
                            {item.category}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSaved(item.id);
                        }}
                        aria-label={saved ? "Remove from saved" : "Save item"}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform"
                      >
                        <Heart
                          className={`w-4 h-4 ${saved ? "text-[#C2794A] fill-[#C2794A]" : "text-[#3D3530]"}`}
                          strokeWidth={1.5}
                        />
                      </button>
                      {item.neighborhood && (
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-[#6B7A5C]/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white">
                            {item.neighborhood}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3">
                        <img
                          src={avatarFor(item.owner?.name, item.owner?.avatar_url)}
                          alt={item.owner?.name ?? "Owner"}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-medium text-[#3D3530] line-clamp-1">{item.name}</p>
                      <p className="text-xs text-[#3D3530]/60 line-clamp-1">
                        {[item.condition, item.neighborhood].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* Filter sheet */}
      {filterOpen && (
        <div
          className="absolute inset-0 z-30 flex items-end justify-center bg-black/40"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="bg-[#F5F0E8] w-full rounded-t-3xl p-5 shadow-xl max-h-[80%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl text-[#3D3530]">Filters</h2>
              <button onClick={() => setFilterOpen(false)} className="p-1.5 hover:bg-[#E8DDD0] rounded-full">
                <X className="w-5 h-5 text-[#3D3530]" strokeWidth={1.5} />
              </button>
            </div>

            <FilterRow label="Category" options={CATEGORIES} value={fCategory} onChange={setFCategory} />
            <FilterRow label="Condition" options={CONDITIONS} value={fCondition} onChange={setFCondition} />
            <FilterRow
              label="Neighborhood"
              options={[...NEIGHBORHOODS]}
              value={fNeighborhood}
              onChange={setFNeighborhood}
            />

            <div className="mb-5">
              <p className="text-sm font-medium text-[#3D3530] mb-2">Sort</p>
              <div className="flex gap-2">
                <button onClick={() => setSort("new")} className={chipCls(sort === "new")}>
                  Newest
                </button>
                <button onClick={() => setSort("old")} className={chipCls(sort === "old")}>
                  Oldest
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="flex-1 bg-white text-[#3D3530] py-3 rounded-2xl font-medium hover:bg-[#E8DDD0] transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 bg-[#C2794A] text-white py-3 rounded-2xl font-medium hover:bg-[#b36d3f] transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="browse" />
    </div>
  );
}
