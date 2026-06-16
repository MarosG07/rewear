import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { supabase } from "../lib/supabase";
import { uploadImage } from "../lib/upload";
import type { Conversation, Listing } from "../lib/types";
import { useAuth } from "./AuthContext";

/**
 * Supabase-backed data layer: the shared marketplace (listings), the user's
 * saved items and swap threads, plus the credit/eco mechanics. Credits live
 * on the user's profile row; messaging is handled live in the inbox screen.
 */

export const CREDIT_RULES = {
  LIST_ITEM: 2,
  COMPLETE_SWAP: 5,
  FIVE_STAR: 1,
  REQUEST_SWAP: 3,
  BOOST: 4,
} as const;

export const ECO = { CO2_PER_SWAP: 2.5, KM_PER_SWAP: 3 } as const;

const LISTING_SELECT = "*, owner:owner_id(id,name,avatar_url,location)";
const CONVO_SELECT =
  "*, listing:listing_id(id,name,image_url), requester:requester_id(id,name,avatar_url), owner:owner_id(id,name,avatar_url)";

export interface ListInput {
  name: string;
  category: string;
  condition: string;
  size: string;
  neighborhood: string;
  description?: string;
  imageDataUrl?: string;
}

interface StoreValue {
  loading: boolean;
  credits: number;
  listings: Listing[];
  myListings: Listing[];
  savedIds: string[];
  conversations: Conversation[];
  ecoStats: { itemsSwapped: number; co2Saved: number; kmAvoided: number };

  getListing: (id: string) => Listing | undefined;
  reload: () => Promise<void>;

  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => Promise<void>;

  hasRequested: (listingId: string) => boolean;
  requestSwap: (listing: Listing) => Promise<void>;
  completeSwap: (conversationId: string) => Promise<void>;
  rateSwap: (conversationId: string) => Promise<void>;

  listItem: (input: ListInput) => Promise<boolean>;
  boostListing: (listingId: string) => Promise<void>;
  deleteListing: (listingId: string) => Promise<void>;
  setListingStatus: (listingId: string, status: "active" | "swapped") => Promise<void>;

  notificationsEnabled: boolean;
  enableNotifications: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session, profile, patchProfile } = useAuth();
  const userId = session?.user.id ?? "";

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted",
  );

  // Always-fresh snapshot for the realtime notification handler.
  const conversationsRef = useRef<Conversation[]>([]);
  conversationsRef.current = conversations;

  const credits = profile?.credits ?? 0;

  // ── data loading ──────────────────────────────────────────────────────
  const loadListings = useCallback(async () => {
    const { data } = await supabase
      .from("listings")
      .select(LISTING_SELECT)
      .order("created_at", { ascending: false });
    setListings((data as Listing[]) ?? []);
  }, []);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("conversations")
      .select(CONVO_SELECT)
      .or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    setConversations((data as Conversation[]) ?? []);
  }, [userId]);

  const loadSaved = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("saved").select("listing_id").eq("user_id", userId);
    setSavedIds((data ?? []).map((r: { listing_id: string }) => r.listing_id));
  }, [userId]);

  const reload = useCallback(async () => {
    await Promise.all([loadListings(), loadConversations(), loadSaved()]);
  }, [loadListings, loadConversations, loadSaved]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      await reload();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [reload]);

  // Keep the inbox live: refresh when my conversations change.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("conversations-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => loadConversations(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadConversations]);

  // Notify on any incoming message (RLS only delivers my conversations').
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("messages-notify")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as { conversation_id: string; sender_id: string; body: string };
          if (msg.sender_id === userId) return; // ignore my own
          loadConversations();
          const convo = conversationsRef.current.find((c) => c.id === msg.conversation_id);
          const partner = convo
            ? convo.requester_id === userId
              ? convo.owner
              : convo.requester
            : null;
          const who = partner?.name ?? "Someone";
          if (
            typeof document !== "undefined" &&
            document.hidden &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification(`New message from ${who}`, { body: msg.body, icon: "/pwa-192.png" });
          } else {
            toast(`💬 ${who}`, { description: msg.body.slice(0, 60) });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadConversations]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Notifications aren't supported here");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationsEnabled(perm === "granted");
    if (perm === "granted") toast.success("Notifications on");
    else toast("Notifications blocked", { description: "Allow them in your browser settings." });
  };

  // ── credit helper ─────────────────────────────────────────────────────
  const changeCredits = async (delta: number, label: string): Promise<boolean> => {
    const current = profile?.credits ?? 0;
    if (delta < 0 && current + delta < 0) {
      toast.error("Not enough credits", { description: `You need ${-delta} credits.` });
      return false;
    }
    const next = current + delta;
    const { error } = await supabase.from("profiles").update({ credits: next }).eq("id", userId);
    if (error) {
      toast.error("Couldn't update credits");
      return false;
    }
    patchProfile({ credits: next });
    if (delta >= 0) toast.success(`+${delta} credits`, { description: label });
    else toast(`−${-delta} credits`, { description: label });
    return true;
  };

  // ── lookups ───────────────────────────────────────────────────────────
  const getListing = (id: string) => listings.find((l) => l.id === id);

  const myListings = useMemo(
    () => listings.filter((l) => l.owner_id === userId),
    [listings, userId],
  );

  // ── saved ─────────────────────────────────────────────────────────────
  const isSaved = (id: string) => savedIds.includes(id);

  const toggleSaved = async (id: string) => {
    if (savedIds.includes(id)) {
      setSavedIds((s) => s.filter((x) => x !== id));
      await supabase.from("saved").delete().eq("user_id", userId).eq("listing_id", id);
    } else {
      setSavedIds((s) => [...s, id]);
      await supabase.from("saved").insert({ user_id: userId, listing_id: id });
    }
  };

  // ── swaps ─────────────────────────────────────────────────────────────
  const hasRequested = (listingId: string) =>
    conversations.some((c) => c.listing_id === listingId && c.requester_id === userId);

  const requestSwap = async (listing: Listing) => {
    if (listing.owner_id === userId) {
      toast("That's your own listing", { description: "You can't swap with yourself." });
      return;
    }
    if (hasRequested(listing.id)) {
      toast("Swap already requested", { description: listing.name });
      return;
    }
    if (!(await changeCredits(-CREDIT_RULES.REQUEST_SWAP, `Requested swap · ${listing.name}`))) {
      return;
    }
    const { data, error } = await supabase
      .from("conversations")
      .insert({ listing_id: listing.id, requester_id: userId, owner_id: listing.owner_id })
      .select("id")
      .single();
    if (error) {
      toast.error("Couldn't start the swap");
      await changeCredits(CREDIT_RULES.REQUEST_SWAP, "Refund"); // give it back
      return;
    }
    await supabase.from("messages").insert({
      conversation_id: data.id,
      sender_id: userId,
      body: `Hi! I'd love to swap for your ${listing.name}. 👋`,
    });
    await loadConversations();
  };

  const completeSwap = async (conversationId: string) => {
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo || convo.status === "completed") return;
    const { error } = await supabase
      .from("conversations")
      .update({ status: "completed" })
      .eq("id", conversationId);
    if (error) {
      toast.error("Couldn't complete the swap");
      return;
    }
    await changeCredits(CREDIT_RULES.COMPLETE_SWAP, "Completed a swap");
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C2794A", "#6B7A5C", "#E8DDD0"],
    });
    await loadConversations();
  };

  const rateSwap = async (conversationId: string) => {
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo || convo.rated || convo.status !== "completed") return;
    const { error } = await supabase
      .from("conversations")
      .update({ rated: true })
      .eq("id", conversationId);
    if (error) return;
    await changeCredits(CREDIT_RULES.FIVE_STAR, "5-star rating given");
    await loadConversations();
  };

  // ── listings ──────────────────────────────────────────────────────────
  const listItem = async (input: ListInput): Promise<boolean> => {
    let imageUrl: string | null = null;
    if (input.imageDataUrl) {
      imageUrl = await uploadImage(userId, input.imageDataUrl);
      if (!imageUrl) toast.error("Photo upload failed", { description: "Listing saved without it." });
    }

    const { error } = await supabase.from("listings").insert({
      owner_id: userId,
      name: input.name,
      category: input.category,
      condition: input.condition,
      size: input.size,
      neighborhood: input.neighborhood,
      description: input.description ?? null,
      image_url: imageUrl,
    });
    if (error) {
      toast.error("Couldn't create the listing");
      return false;
    }
    await changeCredits(CREDIT_RULES.LIST_ITEM, `Listed “${input.name}”`);
    await loadListings();
    return true;
  };

  const boostListing = async (listingId: string) => {
    const target = listings.find((l) => l.id === listingId);
    if (target?.boosted) {
      toast("Already boosted", { description: target.name });
      return;
    }
    if (!(await changeCredits(-CREDIT_RULES.BOOST, "Boosted a listing"))) return;
    await supabase.from("listings").update({ boosted: true }).eq("id", listingId);
    await loadListings();
  };

  const deleteListing = async (listingId: string) => {
    setListings((l) => l.filter((x) => x.id !== listingId)); // optimistic
    const { error } = await supabase.from("listings").delete().eq("id", listingId);
    if (error) {
      toast.error("Couldn't delete listing");
      await loadListings();
      return;
    }
    toast("Listing removed");
  };

  const setListingStatus = async (listingId: string, status: "active" | "swapped") => {
    setListings((l) => l.map((x) => (x.id === listingId ? { ...x, status } : x))); // optimistic
    const { error } = await supabase.from("listings").update({ status }).eq("id", listingId);
    if (error) {
      toast.error("Couldn't update listing");
      await loadListings();
      return;
    }
    toast(status === "swapped" ? "Marked as swapped" : "Marked as available");
  };

  // ── derived ───────────────────────────────────────────────────────────
  const completedSwaps = useMemo(
    () => conversations.filter((c) => c.status === "completed").length,
    [conversations],
  );

  const ecoStats = useMemo(
    () => ({
      itemsSwapped: completedSwaps,
      co2Saved: Math.round(completedSwaps * ECO.CO2_PER_SWAP),
      kmAvoided: Math.round(completedSwaps * ECO.KM_PER_SWAP),
    }),
    [completedSwaps],
  );

  const value: StoreValue = {
    loading,
    credits,
    listings,
    myListings,
    savedIds,
    conversations,
    ecoStats,
    getListing,
    reload,
    isSaved,
    toggleSaved,
    hasRequested,
    requestSwap,
    completeSwap,
    rateSwap,
    listItem,
    boostListing,
    deleteListing,
    setListingStatus,
    notificationsEnabled,
    enableNotifications,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
