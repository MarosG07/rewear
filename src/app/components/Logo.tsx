import logoMark from "../../assets/logo-mark.svg";

interface LogoProps {
  size?: "small" | "medium" | "large";
  showText?: boolean;
}

export default function Logo({ size = "medium", showText = true }: LogoProps) {
  const sizes = {
    small: { mark: "w-8 h-8", text: "text-lg", gap: "gap-2" },
    medium: { mark: "w-11 h-11", text: "text-3xl", gap: "gap-2.5" },
    large: { mark: "w-20 h-20", text: "text-5xl", gap: "gap-3" },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center ${currentSize.gap}`}>
      <img src={logoMark} alt="Rewear" className={`${currentSize.mark} object-contain shrink-0`} />
      {showText && (
        <span className={`font-heading ${currentSize.text} text-[var(--rw-ink)]`}>Rewear</span>
      )}
    </div>
  );
}
