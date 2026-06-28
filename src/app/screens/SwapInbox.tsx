import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, Check, MessageSquare, Send, Calendar, Gift, CalendarPlus, Star } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import { useStore, CREDIT_RULES } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import { avatarFor, listingImage } from "../lib/images";
import { useI18n } from "../lib/i18n";
import type { Conversation, Message, SwapStatus } from "../lib/types";

const statusKey: Record<SwapStatus, string> = {
  inquiry: "inbox.statusInquiry",
  pending: "inbox.statusRequested",
  accepted: "inbox.statusAccepted",
  confirmed: "inbox.statusMeetup",
  completed: "inbox.statusCompleted",
  declined: "inbox.statusDeclined",
};
const statusStyle: Record<SwapStatus, string> = {
  inquiry: "bg-[var(--rw-ink)]/8 text-[var(--rw-ink)]/60",
  pending: "bg-[#C2794A]/10 text-[#C2794A]",
  accepted: "bg-[#6B7A5C]/15 text-[#6B7A5C]",
  confirmed: "bg-[#6B7A5C]/15 text-[#6B7A5C]",
  completed: "bg-[var(--rw-ink)]/10 text-[var(--rw-ink)]/70",
  declined: "bg-[var(--rw-ink)]/8 text-[var(--rw-ink)]/50",
};

function partnerOf(c: Conversation, myId?: string) {
  return c.requester_id === myId ? c.owner : c.requester;
}

export default function SwapInbox() {
  const { t } = useI18n();
  const { session } = useAuth();
  const myId = session?.user.id;
  const { conversations } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  // Allow deep-linking straight to a thread, e.g. /inbox?c=<id> from an item.
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get("c"));

  const chat = selectedId ? conversations.find((c) => c.id === selectedId) : null;

  const closeChat = () => {
    setSelectedId(null);
    if (searchParams.has("c")) {
      searchParams.delete("c");
      setSearchParams(searchParams, { replace: true });
    }
  };

  if (chat) {
    return <ChatView key={chat.id} chat={chat} myId={myId} onBack={closeChat} />;
  }

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      <div className="bg-[var(--rw-bg)]/95 backdrop-blur-sm border-b border-[var(--rw-ink)]/10 px-4 py-3.5 shrink-0">
        <h1 className="font-heading text-2xl text-[var(--rw-ink)]">{t("inbox.title")}</h1>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
        {conversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-full bg-[var(--rw-bg2)] flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-[#6B7A5C]" strokeWidth={1.5} />
            </div>
            <p className="text-[var(--rw-ink)] font-medium">{t("inbox.noSwaps")}</p>
            <p className="text-[var(--rw-ink)]/60 text-sm mt-1">
              {t("inbox.noSwapsSub")}
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const partner = partnerOf(conv, myId);
            const incoming = conv.owner_id === myId && conv.status === "pending";
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className="w-full px-4 py-3.5 hover:bg-[var(--rw-card)]/50 transition-colors border-b border-[var(--rw-ink)]/5"
              >
                <div className="flex gap-3">
                  <div className="relative">
                    <img
                      src={listingImage(conv.listing?.image_url)}
                      alt="Item"
                      className="w-16 h-16 rounded-2xl object-cover"
                    />
                    <img
                      src={avatarFor(partner?.name, partner?.avatar_url)}
                      alt={partner?.name ?? "User"}
                      className="w-8 h-8 rounded-full absolute -bottom-1 -right-1 border-2 border-[var(--rw-bg)]"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-[var(--rw-ink)]">{partner?.name ?? "A Rewearer"}</p>
                    <p className="text-sm text-[var(--rw-ink)]/70 line-clamp-1">{conv.listing?.name ?? "Swap"}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[conv.status]}`}>
                        {incoming ? t("inbox.wantsToSwap") : t(statusKey[conv.status])}
                      </span>
                      {conv.offered && (
                        <span className="text-xs text-[#6B7A5C] flex items-center gap-0.5">
                          <Gift className="w-3 h-3" strokeWidth={1.5} /> offer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <BottomNav active="inbox" />
    </div>
  );
}

function ChatView({ chat, myId, onBack }: { chat: Conversation; myId?: string; onBack: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { acceptSwap, declineSwap, markComplete, proposeMeetup, confirmMeetup, requestSwap, getListing } = useStore();
  const partner = partnerOf(chat, myId);
  const isOwner = chat.owner_id === myId;
  const isRequester = chat.requester_id === myId;
  // The person who proposed the current meetup can't also confirm it.
  const iProposedMeetup = chat.meetup_by === myId;
  const iCompleted = chat.requester_id === myId ? chat.requester_completed : chat.owner_completed;
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const [showMeetup, setShowMeetup] = useState(false);
  const [meetupWhen, setMeetupWhen] = useState("");
  const [meetupPlace, setMeetupPlace] = useState("");

  const inProgress = chat.status === "accepted" || chat.status === "confirmed";

  useEffect(() => {
    let active = true;
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", chat.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) setMessages((data as Message[]) ?? []);
      });

    const channel = supabase
      .channel(`messages:${chat.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${chat.id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [chat.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    const { error } = await supabase.from("messages").insert({ conversation_id: chat.id, sender_id: myId, body });
    setSending(false);
    if (error) setDraft(body);
  };

  const submitMeetup = () => {
    if (!meetupWhen) return;
    if (!meetupPlace.trim()) {
      toast.error(t("inbox.placeRequired"));
      return;
    }
    proposeMeetup(chat.id, new Date(meetupWhen).toISOString(), meetupPlace.trim());
    setShowMeetup(false);
    setMeetupWhen("");
    setMeetupPlace("");
  };

  const meetupNice = chat.meetup_at
    ? new Date(chat.meetup_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div className="h-full flex flex-col bg-[var(--rw-bg)]">
      {/* Header */}
      <div className="bg-[var(--rw-card)] border-b border-[var(--rw-ink)]/10 px-4 py-3.5 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-[var(--rw-bg)] rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-[var(--rw-ink)]" strokeWidth={1.5} />
          </button>
          <img src={avatarFor(partner?.name, partner?.avatar_url)} alt={partner?.name ?? "User"} className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <p className="font-medium text-[var(--rw-ink)]">{partner?.name ?? "A Rewearer"}</p>
            <p className="text-sm text-[var(--rw-ink)]/60">{chat.listing?.name ?? "Swap"}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[chat.status]}`}>
            {t(statusKey[chat.status])}
          </span>
        </div>
      </div>

      {/* Offered item banner */}
      {chat.offered && (
        <div className="bg-[#6B7A5C]/10 px-4 py-2 flex items-center gap-2 text-sm text-[var(--rw-ink)] shrink-0">
          <Gift className="w-4 h-4 text-[#6B7A5C]" strokeWidth={1.5} />
          <span>{t("inbox.offering")} <span className="font-medium">{chat.offered.name}</span></span>
        </div>
      )}

      {/* "Arrange a meetup" prompt once accepted */}
      {inProgress && !meetupNice && (
        <div className="bg-[#C2794A]/12 px-4 py-2 flex items-center gap-2 text-sm text-[var(--rw-ink)] shrink-0">
          <Calendar className="w-4 h-4 text-[#C2794A]" strokeWidth={1.5} />
          <span>{t("inbox.matched")}</span>
        </div>
      )}

      {/* Meetup banner */}
      {meetupNice && (
        <div className={`px-4 py-2.5 flex items-center justify-between gap-2 shrink-0 ${chat.meetup_confirmed ? "bg-[#6B7A5C] text-white" : "bg-[#C2794A]/15 text-[var(--rw-ink)]"}`}>
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Calendar className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span className="font-medium truncate">{meetupNice}{chat.meetup_place ? ` · ${chat.meetup_place}` : ""}</span>
          </div>
          {/* Only the person who did NOT propose confirms — that's the agreement. */}
          {!chat.meetup_confirmed && inProgress && !iProposedMeetup && (
            <button onClick={() => confirmMeetup(chat.id)} className="bg-[#6B7A5C] text-white text-xs font-medium px-3 py-1.5 rounded-full shrink-0">
              {t("inbox.confirm")}
            </button>
          )}
          {!chat.meetup_confirmed && inProgress && iProposedMeetup && (
            <span className="text-xs text-[var(--rw-ink)]/60 shrink-0">
              {t("inbox.waitingConfirm", { name: partner?.name?.split(" ")[0] ?? "them" })}
            </span>
          )}
          {chat.meetup_confirmed && <Check className="w-4 h-4 shrink-0" strokeWidth={2} />}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-3">
        {messages.map((m) => {
          const mine = m.sender_id === myId;
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
              {!mine && <img src={avatarFor(partner?.name, partner?.avatar_url)} alt="" className="w-8 h-8 rounded-full self-end" />}
              <div className={`rounded-2xl px-4 py-2.5 shadow-sm max-w-[72%] ${mine ? "bg-[#6B7A5C] text-white rounded-tr-sm" : "bg-[var(--rw-card)] text-[var(--rw-ink)] rounded-tl-sm"}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Action area */}
      <div className="bg-[var(--rw-card)] border-t border-[var(--rw-ink)]/10 px-4 pt-3 shrink-0">
        {chat.status === "inquiry" ? (
          isRequester ? (
            <button
              onClick={() => {
                const l = chat.listing_id ? getListing(chat.listing_id) : undefined;
                if (l) requestSwap(l);
              }}
              className="w-full bg-[#C2794A] text-white py-3 rounded-2xl font-medium flex items-center justify-center gap-2 mb-3 hover:bg-[#b36d3f] transition-all active:scale-[0.98]"
            >
              <span>{t("inbox.requestSwapNow")}</span>
              <span className="text-white/80 text-sm">−{CREDIT_RULES.REQUEST_SWAP} {t("common.credits")}</span>
            </button>
          ) : null
        ) : chat.status === "pending" ? (
          isOwner ? (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => declineSwap(chat.id)}
                className="px-5 bg-[var(--rw-bg)] text-[var(--rw-ink)] py-3 rounded-2xl font-medium hover:bg-[var(--rw-bg2)] transition-colors"
              >
                {t("inbox.decline")}
              </button>
              <button
                onClick={() => acceptSwap(chat.id)}
                className="flex-1 bg-[#6B7A5C] text-white py-3 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[#5d6b4f] transition-all active:scale-[0.98]"
              >
                <Check className="w-5 h-5" strokeWidth={2} />
                {t("inbox.accept")}
              </button>
            </div>
          ) : (
            <div className="w-full bg-[var(--rw-bg)] text-[var(--rw-ink)]/70 py-3 rounded-2xl font-medium text-center mb-3 text-sm">
              {t("inbox.waitingAccept", { name: partner?.name ?? "them" })}
            </div>
          )
        ) : chat.status === "declined" ? (
          <div className="w-full bg-[var(--rw-bg)] text-[var(--rw-ink)]/60 py-3 rounded-2xl font-medium text-center mb-3 text-sm">
            {t("inbox.declined")}
          </div>
        ) : chat.status === "completed" ? (
          chat.rated ? (
            <div className="w-full bg-[var(--rw-bg)] text-[var(--rw-ink)] py-2.5 rounded-2xl font-medium flex items-center justify-center gap-2 mb-3 text-sm">
              <Check className="w-4 h-4 text-[#6B7A5C]" strokeWidth={2} />
              {t("inbox.thanksReview")}
            </div>
          ) : (
            <button
              onClick={() => navigate(`/rate/${chat.id}`)}
              className="w-full bg-[#C2794A] text-white py-3 rounded-2xl font-medium flex items-center justify-center gap-2 mb-3 hover:bg-[#b36d3f] transition-all active:scale-[0.98]"
            >
              <Star className="w-5 h-5 fill-white" strokeWidth={1.5} />
              {t("inbox.rateThisSwap")}
            </button>
          )
        ) : showMeetup ? (
          <div className="bg-[var(--rw-bg)] rounded-2xl p-3 mb-3 space-y-2">
            <p className="text-sm font-medium text-[var(--rw-ink)]">{t("inbox.proposeMeetup")}</p>
            <div>
              <label className="block text-xs font-medium text-[var(--rw-ink)]/70 mb-1">{t("inbox.meetupDate")}</label>
              <input
                type="datetime-local"
                value={meetupWhen}
                onChange={(e) => setMeetupWhen(e.target.value)}
                className="w-full bg-[var(--rw-card)] rounded-xl px-3 py-2 text-sm text-[var(--rw-ink)] focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--rw-ink)]/70 mb-1">{t("inbox.meetupPlaceLabel")}</label>
              <input
                type="text"
                value={meetupPlace}
                onChange={(e) => setMeetupPlace(e.target.value)}
                placeholder={t("inbox.placePlaceholder")}
                className="w-full bg-[var(--rw-card)] rounded-xl px-3 py-2 text-sm text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={submitMeetup} disabled={!meetupWhen || !meetupPlace.trim()} className="flex-1 bg-[#6B7A5C] text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                {t("inbox.propose")}
              </button>
              <button onClick={() => setShowMeetup(false)} className="px-4 bg-[var(--rw-card)] text-[var(--rw-ink)] py-2 rounded-xl text-sm font-medium">
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowMeetup(true)}
              className="flex-1 bg-[var(--rw-bg)] text-[var(--rw-ink)] py-3 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[var(--rw-bg2)] transition-colors"
            >
              <CalendarPlus className="w-5 h-5 text-[#6B7A5C]" strokeWidth={1.5} />
              {meetupNice ? t("inbox.reschedule") : t("inbox.arrangeMeetup")}
            </button>
            {iCompleted ? (
              <div className="flex-1 bg-[#6B7A5C]/12 text-[#6B7A5C] py-3 rounded-2xl font-medium flex items-center justify-center gap-1.5 text-sm text-center px-2">
                <Check className="w-4 h-4 shrink-0" strokeWidth={2} />
                {t("inbox.waitingFor", { name: partner?.name?.split(" ")[0] ?? "them" })}
              </div>
            ) : (
              <button
                onClick={() => markComplete(chat.id)}
                className="flex-1 bg-[#6B7A5C] text-white py-3 rounded-2xl font-medium flex items-center justify-center gap-1.5 hover:bg-[#5d6b4f] transition-all active:scale-[0.98]"
              >
                <Check className="w-5 h-5" strokeWidth={2} />
                {t("inbox.markComplete")}
              </button>
            )}
          </div>
        )}

        {/* Message input */}
        <div className="flex gap-2 pb-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder={t("inbox.typeMessage")}
            className="flex-1 bg-[var(--rw-bg)] rounded-full px-4 py-3 text-[var(--rw-ink)] placeholder-[var(--rw-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            className="bg-[#C2794A] text-white w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Send className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
