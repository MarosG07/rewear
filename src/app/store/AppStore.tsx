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
import { router } from "../routes";
import type { Conversation, Listing, WishItem } from "../lib/types";
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
  "*, listing:listing_id(id,name,image_url), offered:offered_listing_id(id,name,image_url), requester:requester_id(id,name,avatar_url), owner:owner_id(id,name,avatar_url)";

export interface ListInput {
  name: string;
  category: string;
  condition: string;
  size: string;
  neighborhood: string;
  description?: string;
  imageDataUrls?: string[];
}

export interface EditInput {
  name: string;
  category: string;
  condition: string;
  size: string;
  neighborhood: string;
  description?: string;
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
  requestSwap: (listing: Listing, offeredListingId?: string) => Promise<void>;
  acceptSwap: (conversationId: string) => Promise<void>;
  declineSwap: (conversationId: string) => Promise<void>;
  markComplete: (conversationId: string) => Promise<void>;
  submitReview: (conversationId: string, rating: number, comment: string) => Promise<void>;
  proposeMeetup: (conversationId: string, when: string, place: string) => Promise<void>;
  confirmMeetup: (conversationId: string) => Promise<void>;
  purchaseCredits: (amount: number) => Promise<void>;

  listItem: (input: ListInput) => Promise<boolean>;
  updateListing: (listingId: string, input: EditInput, newImageDataUrls?: string[]) => Promise<boolean>;
  boostListing: (listingId: string) => Promise<void>;
  deleteListing: (listingId: string) => Promise<void>;
  setListingStatus: (listingId: string, status: "active" | "swapped") => Promise<void>;

  notificationsEnabled: boolean;
  enableNotifications: () => Promise<void>;

  wishlist: WishItem[];
  myWishes: WishItem[];
  addWish: (input: { title: string; category?: string; size?: string; neighborhood?: string; note?: string }) => Promise<boolean>;
  removeWish: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session, profile, patchProfile, refreshProfile } = useAuth();
  const userId = session?.user.id ?? "";

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
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

  const loadWishlist = useCallback(async () => {
    const { data } = await supabase
      .from("wishlist")
      .select("*, user:user_id(id,name,avatar_url)")
      .order("created_at", { ascending: false });
    setWishlist((data as WishItem[]) ?? []);
  }, []);

  const reload = useCallback(async () => {
    await Promise.all([loadListings(), loadConversations(), loadSaved(), loadWishlist()]);
  }, [loadListings, loadConversations, loadSaved, loadWishlist]);

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
          if (typeof localStorage !== "undefined" && localStorage.getItem("notif.messages") === "off") return;
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
      toast.error("Not enough credits", {
        description: `You need ${-delta} credits.`,
        action: { label: "Get more", onClick: () => router.navigate("/credits") },
      });
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

  const requestSwap = async (listing: Listing, offeredListingId?: string) => {
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
      .insert({
        listing_id: listing.id,
        requester_id: userId,
        owner_id: listing.owner_id,
        offered_listing_id: offeredListingId ?? null,
      })
      .select("id")
      .single();
    if (error) {
      toast.error("Couldn't start the swap");
      await changeCredits(CREDIT_RULES.REQUEST_SWAP, "Refund"); // give it back
      return;
    }
    const offered = offeredListingId ? listings.find((l) => l.id === offeredListingId) : null;
    const body = offered
      ? `Hi! I'd love to swap my ${offered.name} for your ${listing.name}. 👋`
      : `Hi! I'd love to swap for your ${listing.name}. 👋`;
    await supabase.from("messages").insert({ conversation_id: data.id, sender_id: userId, body });
    await loadConversations();
  };

  const acceptSwap = async (conversationId: string) => {
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo || convo.owner_id !== userId || convo.status !== "pending") return;
    const { error } = await supabase
      .from("conversations")
      .update({ status: "accepted" })
      .eq("id", conversationId);
    if (error) {
      toast.error("Couldn't accept the swap");
      return;
    }
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: "✅ Accepted the swap — let's arrange a meetup!",
    });
    toast.success("Swap accepted");
    await loadConversations();
  };

  const declineSwap = async (conversationId: string) => {
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo || convo.owner_id !== userId || convo.status !== "pending") return;
    const { error } = await supabase
      .from("conversations")
      .update({ status: "declined" })
      .eq("id", conversationId);
    if (error) {
      toast.error("Couldn't decline the swap");
      return;
    }
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: "Declined this swap request.",
    });
    toast("Swap declined");
    await loadConversations();
  };

  // Mutual completion: each side marks complete; the swap only finalizes (and
  // both get +5, awarded server-side) once both have confirmed.
  const markComplete = async (conversationId: string) => {
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo || convo.status === "completed") return;
    if (convo.status === "pending" || convo.status === "declined") {
      toast("Not ready yet", { description: "The owner needs to accept the swap first." });
      return;
    }
    const { data, error } = await supabase.rpc("mark_swap_complete", { conv_id: conversationId });
    if (error) {
      toast.error("Couldn't update the swap");
      return;
    }
    await Promise.all([loadConversations(), refreshProfile()]);
    if (data === "completed") {
      toast.success(`+${CREDIT_RULES.COMPLETE_SWAP} credits`, { description: "Swap completed 🎉" });
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#C2794A", "#6B7A5C", "#E8DDD0"],
      });
    } else {
      toast("Marked complete", { description: "Waiting for the other person to confirm." });
    }
  };

  const submitReview = async (conversationId: string, rating: number, comment: string) => {
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo || convo.rated || convo.status !== "completed") return;
    const revieweeId = convo.requester_id === userId ? convo.owner_id : convo.requester_id;
    const { error } = await supabase.from("reviews").insert({
      conversation_id: conversationId,
      reviewer_id: userId,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim() || null,
    });
    if (error) {
      toast.error("Couldn't submit review");
      return;
    }
    await supabase.from("conversations").update({ rated: true }).eq("id", conversationId);
    await changeCredits(CREDIT_RULES.FIVE_STAR, "Left a review");
    await loadConversations();
  };

  const proposeMeetup = async (conversationId: string, when: string, place: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ meetup_at: when, meetup_place: place || null, meetup_confirmed: false })
      .eq("id", conversationId);
    if (error) {
      toast.error("Couldn't propose meetup");
      return;
    }
    const nice = new Date(when).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: `📅 Proposed a meetup: ${nice}${place ? ` at ${place}` : ""}`,
    });
    await loadConversations();
  };

  const confirmMeetup = async (conversationId: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ meetup_confirmed: true })
      .eq("id", conversationId);
    if (error) {
      toast.error("Couldn't confirm meetup");
      return;
    }
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: "✅ Confirmed the meetup — see you there!",
    });
    toast.success("Meetup confirmed");
    await loadConversations();
  };

  // ── listings ──────────────────────────────────────────────────────────
  const listItem = async (input: ListInput): Promise<boolean> => {
    const images: string[] = [];
    for (const d of input.imageDataUrls ?? []) {
      const url = await uploadImage(userId, d);
      if (url) images.push(url);
    }
    if ((input.imageDataUrls?.length ?? 0) > 0 && images.length === 0) {
      toast.error("Photo upload failed", { description: "Listing saved without it." });
    }

    const { error } = await supabase.from("listings").insert({
      owner_id: userId,
      name: input.name,
      category: input.category,
      condition: input.condition,
      size: input.size,
      neighborhood: input.neighborhood,
      description: input.description ?? null,
      image_url: images[0] ?? null,
      images,
    });
    if (error) {
      toast.error("Couldn't create the listing");
      return false;
    }
    await changeCredits(CREDIT_RULES.LIST_ITEM, `Listed “${input.name}”`);
    await loadListings();
    return true;
  };

  const updateListing = async (
    listingId: string,
    input: EditInput,
    newImageDataUrls?: string[],
  ): Promise<boolean> => {
    const patch: Record<string, unknown> = {
      name: input.name,
      category: input.category,
      condition: input.condition,
      size: input.size,
      neighborhood: input.neighborhood,
      description: input.description ?? null,
    };
    if (newImageDataUrls && newImageDataUrls.length > 0) {
      const images: string[] = [];
      for (const d of newImageDataUrls) {
        const url = await uploadImage(userId, d);
        if (url) images.push(url);
      }
      if (images.length) {
        patch.images = images;
        patch.image_url = images[0];
      }
    }
    const { error } = await supabase.from("listings").update(patch).eq("id", listingId);
    if (error) {
      toast.error("Couldn't update listing");
      return false;
    }
    toast.success("Listing updated");
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

  // Placeholder credit purchase — no real payment processing.
  const purchaseCredits = async (amount: number) => {
    await changeCredits(amount, `Purchased ${amount} credits`);
  };

  // ── wishlist ("Looking for") ─────────────────────────────────────────────
  const myWishes = useMemo(() => wishlist.filter((w) => w.user_id === userId), [wishlist, userId]);

  const addWish: StoreValue["addWish"] = async (input) => {
    if (!input.title.trim()) {
      toast.error("Add a title");
      return false;
    }
    const { error } = await supabase.from("wishlist").insert({
      user_id: userId,
      title: input.title.trim(),
      category: input.category ?? null,
      size: input.size ?? null,
      neighborhood: input.neighborhood ?? null,
      note: input.note?.trim() || null,
    });
    if (error) {
      toast.error("Couldn't add to your wishlist");
      return false;
    }
    toast.success("Added to your wishlist");
    await loadWishlist();
    return true;
  };

  const removeWish = async (id: string) => {
    setWishlist((w) => w.filter((x) => x.id !== id));
    await supabase.from("wishlist").delete().eq("id", id);
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
    acceptSwap,
    declineSwap,
    markComplete,
    submitReview,
    proposeMeetup,
    confirmMeetup,
    purchaseCredits,
    listItem,
    updateListing,
    boostListing,
    deleteListing,
    setListingStatus,
    notificationsEnabled,
    enableNotifications,
    wishlist,
    myWishes,
    addWish,
    removeWish,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
