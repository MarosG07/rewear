import { Link } from "react-router";
import { Heart } from "lucide-react";
import BottomNav from "../components/BottomNav";
import SmartImage from "../components/SmartImage";
import type { Item } from "../data/items";
import { useStore } from "../store/AppStore";

export default function Saved() {
  const { savedIds, toggleSaved, getItem } = useStore();
  const savedItems = savedIds
    .map((id) => getItem(id))
    .filter((item): item is Item => Boolean(item));

  return (
    <div className="h-full flex flex-col bg-[#F5F0E8] relative overflow-hidden">
      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      {/* Header */}
      <div className="bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-[#3D3530]/10 px-4 py-3.5">
        <h1 className="font-heading text-2xl text-[#3D3530]">Saved items</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-4">
        {savedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-full bg-[#E8DDD0] flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-[#6B7A5C]" strokeWidth={1.5} />
            </div>
            <p className="text-[#3D3530] font-medium">Nothing saved yet</p>
            <p className="text-[#3D3530]/60 text-sm mt-1 mb-5">
              Tap the heart on any item to keep it here for later.
            </p>
            <Link
              to="/"
              className="bg-[#C2794A] text-white px-6 py-3 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98]"
            >
              Browse items
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-4">
            {savedItems.map((item) => (
              <Link
                key={item.id}
                to={`/item/${item.id}`}
                className="group"
              >
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <SmartImage
                      src={item.image}
                      alt={item.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-[#3D3530]">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSaved(item.id);
                        }}
                        aria-label="Remove from saved"
                        className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                      >
                        <Heart className="w-4 h-4 text-[#C2794A] fill-[#C2794A]" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-[#6B7A5C]/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white">
                        {item.neighborhood}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <img
                        src={item.owner.avatar}
                        alt="Owner"
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-[#3D3530] line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#3D3530]/60 line-clamp-1">
                      {item.condition} · {item.neighborhood}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="saved" />
    </div>
  );
}
