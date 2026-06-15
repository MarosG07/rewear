import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Check, Star, MessageSquare, Send } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import { useStore, CREDIT_RULES } from "../store/AppStore";
import { useAuth } from "../store/AuthContext";
import { avatarFor, listingImage } from "../lib/images";
import type { Conversation, Message, SwapStatus } from "../lib/types";

const statusLabel: Record<SwapStatus, string> = {
  pending: "Pending",
  confirmed: "In progress",
  completed: "Completed",
};
const statusStyle: Record<SwapStatus, string> = {
  pending: "bg-[#C2794A]/10 text-[#C2794A]",
  confirmed: "bg-[#6B7A5C]/15 text-[#6B7A5C]",
  completed: "bg-[#3D3530]/10 text-[#3D3530]/70",
};

function partnerOf(c: Conversation, myId?: string) {
  return c.requester_id === myId ? c.owner : c.requester;
}

export default function SwapInbox() {
  const { session } = useAuth();
  const myId = session?.user.id;
  const { conversations, completeSwap, rateSwap } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const chat = selectedId ? conversations.find((c) => c.id === selectedId) : null;

  if (chat) {
    return (
      <ChatView
        key={chat.id}
        chat={chat}
        myId={myId}
        onBack={() => setSelectedId(null)}
        onComplete={() => completeSwap(chat.id)}
        onRate={() => rateSwap(chat.id)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F5F0E8] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      <div className="bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-[#3D3530]/10 px-4 py-3.5">
        <h1 className="font-heading text-2xl text-[#3D3530]">Swap inbox</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {conversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-full bg-[#E8DDD0] flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-[#6B7A5C]" strokeWidth={1.5} />
            </div>
            <p className="text-[#3D3530] font-medium">No swaps yet</p>
            <p className="text-[#3D3530]/60 text-sm mt-1">
              Request a swap on an item and the chat will show up here.
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const partner = partnerOf(conv, myId);
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className="w-full px-4 py-3.5 hover:bg-white/50 transition-colors border-b border-[#3D3530]/5"
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
                      className="w-8 h-8 rounded-full absolute -bottom-1 -right-1 border-2 border-[#F5F0E8]"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-[#3D3530]">{partner?.name ?? "A Rewearer"}</p>
                    </div>
                    <p className="text-sm text-[#3D3530]/70 line-clamp-1">
                      {conv.listing?.name ?? "Swap"}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[conv.status]}`}
                      >
                        {statusLabel[conv.status]}
                      </span>
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

function ChatView({
  chat,
  myId,
  onBack,
  onComplete,
  onRate,
}: {
  chat: Conversation;
  myId?: string;
  onBack: () => void;
  onComplete: () => void;
  onRate: () => void;
}) {
  const partner = partnerOf(chat, myId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const isCompleted = chat.status === "completed";

  // Load history + subscribe to live inserts for this conversation.
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
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${chat.id}`,
        },
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
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: chat.id, sender_id: myId, body });
    setSending(false);
    if (error) setDraft(body); // restore on failure
  };

  return (
    <div className="h-full flex flex-col bg-[#F5F0E8]">
      {/* Header */}
      <div className="bg-white border-b border-[#3D3530]/10 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#F5F0E8] rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#3D3530]" strokeWidth={1.5} />
          </button>
          <img
            src={avatarFor(partner?.name, partner?.avatar_url)}
            alt={partner?.name ?? "User"}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <p className="font-medium text-[#3D3530]">{partner?.name ?? "A Rewearer"}</p>
            <p className="text-sm text-[#3D3530]/60">{chat.listing?.name ?? "Swap"}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {messages.map((m) => {
          const mine = m.sender_id === myId;
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
              {!mine && (
                <img
                  src={avatarFor(partner?.name, partner?.avatar_url)}
                  alt=""
                  className="w-8 h-8 rounded-full self-end"
                />
              )}
              <div
                className={`rounded-2xl px-4 py-2.5 shadow-sm max-w-[72%] ${
                  mine
                    ? "bg-[#6B7A5C] text-white rounded-tr-sm"
                    : "bg-white text-[#3D3530] rounded-tl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </div>
          );
        })}
        {isCompleted && (
          <div className="flex justify-center pt-1">
            <span className="bg-[#3D3530]/5 text-[#3D3530]/70 text-sm px-4 py-2 rounded-full">
              Swap completed 🎉
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Swap action */}
      <div className="bg-white border-t border-[#3D3530]/10 px-4 pt-3">
        {!isCompleted ? (
          <button
            onClick={onComplete}
            className="w-full bg-[#6B7A5C] text-white py-3 rounded-2xl font-medium shadow-sm hover:bg-[#5d6b4f] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" strokeWidth={2} />
            <span>Mark swap complete</span>
            <span className="text-white/80 text-sm">+{CREDIT_RULES.COMPLETE_SWAP}</span>
          </button>
        ) : !chat.rated ? (
          <button
            onClick={onRate}
            className="w-full bg-[#C2794A] text-white py-3 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5 fill-white" strokeWidth={1.5} />
            <span>Leave a 5-star rating</span>
            <span className="text-white/80 text-sm">+{CREDIT_RULES.FIVE_STAR}</span>
          </button>
        ) : (
          <div className="w-full bg-[#F5F0E8] text-[#3D3530] py-3 rounded-2xl font-medium flex items-center justify-center gap-2">
            <div className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-4 h-4 text-[#C2794A] fill-[#C2794A]" strokeWidth={1.5} />
              ))}
            </div>
            <span className="text-sm">Thanks for rating!</span>
          </div>
        )}

        {/* Message input */}
        <div className="flex gap-2 py-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Type a message…"
            className="flex-1 bg-[#F5F0E8] rounded-full px-4 py-3 text-[#3D3530] placeholder-[#3D3530]/40 focus:outline-none focus:ring-2 focus:ring-[#6B7A5C]"
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            className="bg-[#C2794A] text-white w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
          >
            <Send className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
