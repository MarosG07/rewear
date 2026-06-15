import { useState } from "react";
import { ChevronLeft, Calendar, Clock, Check, Star, MessageSquare } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useStore, CREDIT_RULES, type SwapStatus } from "../store/AppStore";

const statusLabel: Record<SwapStatus, string> = {
  pending: "Pending",
  confirmed: "Meetup confirmed",
  completed: "Completed",
};

const statusStyle: Record<SwapStatus, string> = {
  pending: "bg-[#C2794A]/10 text-[#C2794A]",
  confirmed: "bg-[#6B7A5C]/15 text-[#6B7A5C]",
  completed: "bg-[#3D3530]/10 text-[#3D3530]/70",
};

export default function SwapInbox() {
  const { conversations, completeSwap, rateSwap } = useStore();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  const chat = selectedChat
    ? conversations.find((c) => c.id === selectedChat)
    : null;

  if (chat) {
    const isCompleted = chat.status === "completed";

    return (
      <div className="h-full flex flex-col bg-[#F5F0E8]">
        {/* Chat header */}
        <div className="bg-white border-b border-[#3D3530]/10 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedChat(null)}
              className="p-2 hover:bg-[#F5F0E8] rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#3D3530]" strokeWidth={1.5} />
            </button>
            <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <p className="font-medium text-[#3D3530]">{chat.name}</p>
              <p className="text-sm text-[#3D3530]/60">
                {isCompleted ? "Swap completed" : "Active now"}
              </p>
            </div>
          </div>
        </div>

        {/* Active meetup banner */}
        {chat.hasActiveMeetup && !isCompleted && (
          <div className="bg-[#6B7A5C] text-white px-4 py-2.5 flex items-center gap-2">
            <Calendar className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-sm font-medium">Meetup confirmed · Tue 3pm</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          <div className="flex gap-3">
            <img src={chat.avatar} alt={chat.name} className="w-8 h-8 rounded-full" />
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[70%]">
              <p className="text-[#3D3530]">Hi! I love your item. Would you be interested in swapping?</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <div className="bg-[#6B7A5C] text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[70%]">
              <p>Hi {chat.name.split(" ")[0]}! Yes, I'd love to. Want to meet up this week?</p>
            </div>
          </div>

          {/* Time picker card — only while a swap is still in progress */}
          {!isCompleted && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#6B7A5C]/20">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-[#6B7A5C]" strokeWidth={1.5} />
                <p className="font-medium text-[#3D3530]">Proposed meetup time</p>
              </div>
              <div className="bg-[#F5F0E8] rounded-xl p-3">
                <p className="text-sm text-[#3D3530]">Tuesday, June 17</p>
                <p className="text-lg font-medium text-[#3D3530]">3:00 PM</p>
                <p className="text-sm text-[#3D3530]/60 mt-1">Mercado de Ruzafa</p>
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="flex justify-center">
              <span className="bg-[#3D3530]/5 text-[#3D3530]/70 text-sm px-4 py-2 rounded-full">
                You completed this swap 🎉
              </span>
            </div>
          )}
        </div>

        {/* Action bar — reflects the swap's stage */}
        <div className="bg-white border-t border-[#3D3530]/10 px-4 py-3.5">
          {!isCompleted ? (
            <button
              onClick={() => completeSwap(chat.id)}
              className="w-full bg-[#6B7A5C] text-white py-3.5 rounded-2xl font-medium shadow-sm hover:bg-[#5d6b4f] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" strokeWidth={2} />
              <span>Mark swap complete</span>
              <span className="text-white/80 text-sm">+{CREDIT_RULES.COMPLETE_SWAP} credits</span>
            </button>
          ) : !chat.rated ? (
            <button
              onClick={() => rateSwap(chat.id)}
              className="w-full bg-[#C2794A] text-white py-3.5 rounded-2xl font-medium shadow-sm hover:bg-[#b36d3f] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5 fill-white" strokeWidth={1.5} />
              <span>Leave a 5-star rating</span>
              <span className="text-white/80 text-sm">+{CREDIT_RULES.FIVE_STAR} credit</span>
            </button>
          ) : (
            <div className="w-full bg-[#F5F0E8] text-[#3D3530] py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="w-4 h-4 text-[#C2794A] fill-[#C2794A]" strokeWidth={1.5} />
                ))}
              </div>
              <span className="text-sm">Thanks for rating!</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F5F0E8] relative overflow-hidden">
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      {/* Header */}
      <div className="bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-[#3D3530]/10 px-4 py-3.5">
        <h1 className="font-heading text-2xl text-[#3D3530]">Swap inbox</h1>
      </div>

      {/* Conversations */}
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
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedChat(conv.id)}
              className="w-full px-4 py-3.5 hover:bg-white/50 transition-colors border-b border-[#3D3530]/5"
            >
              <div className="flex gap-3">
                <div className="relative">
                  <img src={conv.itemThumb} alt="Item" className="w-16 h-16 rounded-2xl object-cover" />
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-8 h-8 rounded-full absolute -bottom-1 -right-1 border-2 border-[#F5F0E8]"
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-[#3D3530]">{conv.name}</p>
                    <span className="text-xs text-[#3D3530]/60">{conv.time}</span>
                  </div>
                  <p className="text-sm text-[#3D3530]/70 line-clamp-1">{conv.lastMessage}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[conv.status]}`}
                    >
                      {statusLabel[conv.status]}
                    </span>
                  </div>
                </div>
                {conv.unread && (
                  <div className="w-2 h-2 bg-[#C2794A] rounded-full mt-2"></div>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      <BottomNav active="inbox" />
    </div>
  );
}
