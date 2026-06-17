import { Leaf, Repeat, MapPin, type LucideIcon } from "lucide-react";
import Logo from "./Logo";

function Row({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-11 h-11 rounded-2xl bg-[#6B7A5C]/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#6B7A5C]" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-medium text-[var(--rw-ink)]">{title}</p>
        <p className="text-sm text-[var(--rw-ink)]/65 leading-snug">{text}</p>
      </div>
    </div>
  );
}

export default function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <div className="absolute inset-0 z-40 bg-[var(--rw-bg)] flex flex-col px-6 py-8 overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-center mb-6">
          <Logo size="large" />
        </div>
        <h1 className="font-heading text-3xl text-[var(--rw-ink)] text-center mb-2">Welcome to Rewear</h1>
        <p className="text-center text-[var(--rw-ink)]/60 mb-8">Swap clothes locally, earn credits, cut waste.</p>
        <div className="space-y-5">
          <Row
            icon={Repeat}
            title="Swap, don't shop"
            text="List items you no longer wear and request swaps from people nearby."
          />
          <Row
            icon={Leaf}
            title="Earn swap credits"
            text="List (+2), complete a swap (+5), leave a review (+1). Requesting a swap costs −3."
          />
          <Row
            icon={MapPin}
            title="Stay local"
            text="Browse by neighborhood, chat live, and meet up nearby in Valencia."
          />
        </div>
      </div>
      <button
        onClick={onDone}
        className="w-full bg-[#C2794A] text-white py-4 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] mt-8"
      >
        Get started
      </button>
    </div>
  );
}
