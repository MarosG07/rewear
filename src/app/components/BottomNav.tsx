import { Link } from "react-router";
import { Home, MessageSquare, Plus, User, Heart } from "lucide-react";

interface BottomNavProps {
  active?: "browse" | "inbox" | "saved" | "profile";
}

export default function BottomNav({ active }: BottomNavProps) {
  return (
    <div className="relative shrink-0 bg-white border-t border-[#3D3530]/10 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-lg z-20">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${
            active === "browse" ? "text-[#6B7A5C]" : "text-[#3D3530]/40"
          }`}
        >
          <Home className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-xs font-medium">Browse</span>
        </Link>

        <Link
          to="/inbox"
          className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${
            active === "inbox" ? "text-[#6B7A5C]" : "text-[#3D3530]/40"
          }`}
        >
          <MessageSquare className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-xs font-medium">Inbox</span>
        </Link>

        {/* Spacer for center floating button */}
        <div className="w-14"></div>

        <Link
          to="/saved"
          className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${
            active === "saved" ? "text-[#6B7A5C]" : "text-[#3D3530]/40"
          }`}
        >
          <Heart className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-xs font-medium">Saved</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${
            active === "profile" ? "text-[#6B7A5C]" : "text-[#3D3530]/40"
          }`}
        >
          <User className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-xs font-medium">Profile</span>
        </Link>

        {/* Floating add button */}
        <Link
          to="/list"
          className="absolute left-1/2 -translate-x-1/2 -top-7"
        >
          <div className="w-14 h-14 bg-[#C2794A] rounded-full flex items-center justify-center shadow-lg hover:bg-[#b36d3f] transition-all active:scale-95">
            <Plus className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
        </Link>
      </div>
    </div>
  );
}
