import { Leaf } from "lucide-react";

interface LogoProps {
  size?: "small" | "medium" | "large";
  showText?: boolean;
}

export default function Logo({ size = "medium", showText = true }: LogoProps) {
  const sizes = {
    small: { container: "w-7 h-7", icon: "w-4 h-4", text: "text-lg", gap: "gap-2", rounded: "rounded-xl" },
    medium: { container: "w-10 h-10", icon: "w-6 h-6", text: "text-3xl", gap: "gap-3", rounded: "rounded-2xl" },
    large: { container: "w-16 h-16", icon: "w-10 h-10", text: "text-5xl", gap: "gap-3", rounded: "rounded-2xl" },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center ${currentSize.gap}`}>
      <div className={`${currentSize.container} bg-gradient-to-br from-[#C2794A] to-[#b36d3f] ${currentSize.rounded} flex items-center justify-center shadow-sm`}>
        <Leaf className={`${currentSize.icon} text-white`} strokeWidth={2} />
      </div>
      {showText && (
        <span className={`font-heading ${currentSize.text} text-[#3D3530]`}>
          Rewear
        </span>
      )}
    </div>
  );
}
