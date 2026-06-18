import { Leaf, Repeat, MapPin, type LucideIcon } from "lucide-react";
import Logo from "./Logo";
import { useI18n } from "../lib/i18n";

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
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 z-40 bg-[var(--rw-bg)] flex flex-col px-6 py-8 overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-center mb-6">
          <Logo size="large" />
        </div>
        <h1 className="font-heading text-3xl text-[var(--rw-ink)] text-center mb-2">{t("ob.welcome")}</h1>
        <p className="text-center text-[var(--rw-ink)]/60 mb-8">{t("ob.sub")}</p>
        <div className="space-y-5">
          <Row
            icon={Repeat}
            title={t("ob.swapTitle")}
            text={t("ob.swapText")}
          />
          <Row
            icon={Leaf}
            title={t("ob.creditsTitle")}
            text={t("ob.creditsText")}
          />
          <Row
            icon={MapPin}
            title={t("ob.localTitle")}
            text={t("ob.localText")}
          />
        </div>
      </div>
      <button
        onClick={onDone}
        className="w-full bg-[#C2794A] text-white py-4 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] mt-8"
      >
        {t("ob.getStarted")}
      </button>
    </div>
  );
}
