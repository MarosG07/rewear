import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { items, type Item } from "../data/items";

/**
 * Central client-side store for the Rewear demo.
 *
 * Holds the things that have to stay in sync as the user moves between
 * screens: the swap-credit balance, saved items, the user's own listings,
 * and the swap conversations that drive the inbox + eco stats.
 *
 * State is persisted to localStorage, so it survives reloads and syncs
 * across tabs/windows on the same device (via the `storage` event).
 * NOTE: this is per-device only — sharing listings across different
 * devices/users would require a backend.
 */

// ── Credit economy ────────────────────────────────────────────────────────
export const CREDIT_RULES = {
  START: 12,
  LIST_ITEM: 2, // earn: listing an item
  COMPLETE_SWAP: 5, // earn: completing a swap
  FIVE_STAR: 1, // earn: leaving a 5-star rating
  REQUEST_SWAP: 3, // spend: requesting a swap
  BOOST: 4, // spend: boosting a listing
} as const;

// Eco-impact multipliers (per completed swap)
export const ECO = {
  CO2_PER_SWAP: 2.5, // kg CO₂ saved
  KM_PER_SWAP: 3, // km of shipping avoided
} as const;

// A handful of swaps already under the user's belt, so the eco stats and
// history don't start empty. Live completions are added on top of this.
const BASE_COMPLETED_SWAPS = 8;

const STORAGE_KEY = "rewear-state-v2";

// ── Types ─────────────────────────────────────────────────────────────────
export type SwapStatus = "pending" | "confirmed" | "completed";

export interface Listing extends Item {
  status: "active" | "swapped";
  boosted: boolean;
  userCreated?: boolean; // true for items the user listed themselves
}

export interface Conversation {
  id: number;
  name: string;
  avatar: string;
  itemId: number;
  itemThumb: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  status: SwapStatus;
  rated: boolean;
  hasActiveMeetup?: boolean;
}

export interface CreditEntry {
  id: number;
  label: string;
  amount: number; // signed
}

// ── Seed state ────────────────────────────────────────────────────────────
const seedListings: Listing[] = [
  { ...items[0], status: "active", boosted: false },
  { ...items[1], status: "active", boosted: false },
  { ...items[2], status: "swapped", boosted: false },
  { ...items[3], status: "active", boosted: false },
];

const seedConversations: Conversation[] = [
  {
    id: 1,
    name: "Emma Wilson",
    avatar: "https://i.pravatar.cc/150?img=5",
    itemId: 2,
    itemThumb: items[1].image,
    lastMessage: "That works for me! See you then",
    time: "2h ago",
    unread: false,
    status: "confirmed",
    rated: false,
    hasActiveMeetup: true,
  },
  {
    id: 2,
    name: "Alex Chen",
    avatar: "https://i.pravatar.cc/150?img=8",
    itemId: 3,
    itemThumb: items[2].image,
    lastMessage: "Would you be interested in swapping?",
    time: "5h ago",
    unread: true,
    status: "pending",
    rated: false,
  },
  {
    id: 3,
    name: "Maria Garcia",
    avatar: "https://i.pravatar.cc/150?img=9",
    itemId: 4,
    itemThumb: items[3].image,
    lastMessage: "Thanks for the quick swap!",
    time: "1d ago",
    unread: false,
    status: "completed",
    rated: false,
  },
];

const seedSavedIds = [3, 6];

interface PersistedState {
  credits: number;
  ledger: CreditEntry[];
  savedIds: number[];
  listings: Listing[];
  conversations: Conversation[];
}

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.credits !== "number" || !Array.isArray(p?.listings)) return null;
    return p as PersistedState;
  } catch {
    return null;
  }
}

// ── Store shape ───────────────────────────────────────────────────────────
export interface ListInput {
  name: string;
  category: string;
  condition: string;
  size: string;
  image?: string;
  neighborhood?: string;
  description?: string;
}

interface StoreValue {
  credits: number;
  ledger: CreditEntry[];
  savedIds: number[];
  listings: Listing[];
  conversations: Conversation[];

  // derived
  feedItems: Item[]; // user listings + the public catalogue, for the browse feed
  completedSwaps: number;
  ecoStats: { itemsSwapped: number; co2Saved: number; kmAvoided: number };

  // lookups
  getItem: (id: number) => Item | undefined;

  // saved
  isSaved: (itemId: number) => boolean;
  toggleSaved: (itemId: number) => void;

  // swaps
  hasRequested: (itemId: number) => boolean;
  requestSwap: (item: Item) => boolean;
  completeSwap: (conversationId: number) => void;
  rateSwap: (conversationId: number) => void;

  // listings
  listItem: (input: ListInput) => void;
  boostListing: (listingId: number) => void;

  // demo
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

// Unique, monotonically increasing ids that don't collide across reloads/tabs.
let idSeq = 0;
const genId = () => Date.now() * 1000 + (idSeq++ % 1000);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = loadPersisted();
  const [credits, setCredits] = useState(initial?.credits ?? CREDIT_RULES.START);
  const [ledger, setLedger] = useState<CreditEntry[]>(initial?.ledger ?? []);
  const [savedIds, setSavedIds] = useState<number[]>(initial?.savedIds ?? seedSavedIds);
  const [listings, setListings] = useState<Listing[]>(initial?.listings ?? seedListings);
  const [conversations, setConversations] = useState<Conversation[]>(
    initial?.conversations ?? seedConversations,
  );

  // Persist on any change.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ credits, ledger, savedIds, listings, conversations }),
      );
    } catch {
      /* quota or privacy mode — ignore, app still works in-memory */
    }
  }, [credits, ledger, savedIds, listings, conversations]);

  // Sync state when another tab/window on the same device changes it.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const p = JSON.parse(e.newValue) as PersistedState;
        setCredits(p.credits);
        setLedger(p.ledger);
        setSavedIds(p.savedIds);
        setListings(p.listings);
        setConversations(p.conversations);
      } catch {
        /* ignore malformed payloads */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── credit helpers ──────────────────────────────────────────────────────
  const earn = (amount: number, label: string) => {
    setCredits((c) => c + amount);
    setLedger((l) => [{ id: genId(), label, amount }, ...l]);
    toast.success(`+${amount} credits`, { description: label });
  };

  /** Returns false (and warns) when the user can't afford the spend. */
  const spend = (amount: number, label: string): boolean => {
    let ok = false;
    setCredits((c) => {
      if (c < amount) return c;
      ok = true;
      return c - amount;
    });
    if (!ok) {
      toast.error("Not enough credits", {
        description: `You need ${amount} credits for this.`,
      });
      return false;
    }
    setLedger((l) => [{ id: genId(), label, amount: -amount }, ...l]);
    toast(`−${amount} credits`, { description: label });
    return true;
  };

  // ── lookups ───────────────────────────────────────────────────────────────
  const getItem = (id: number): Item | undefined =>
    listings.find((l) => l.id === id) ?? items.find((i) => i.id === id);

  // ── saved ────────────────────────────────────────────────────────────────
  const isSaved = (itemId: number) => savedIds.includes(itemId);
  const toggleSaved = (itemId: number) =>
    setSavedIds((ids) =>
      ids.includes(itemId) ? ids.filter((i) => i !== itemId) : [...ids, itemId],
    );

  // ── swaps ────────────────────────────────────────────────────────────────
  const hasRequested = (itemId: number) =>
    conversations.some((c) => c.itemId === itemId && c.status !== "completed");

  const requestSwap = (item: Item): boolean => {
    if (hasRequested(item.id)) {
      toast("Swap already requested", { description: item.name });
      return false;
    }
    if (!spend(CREDIT_RULES.REQUEST_SWAP, `Requested swap · ${item.name}`)) {
      return false;
    }
    setConversations((cs) => [
      {
        id: genId(),
        name: item.owner.name,
        avatar: item.owner.avatar,
        itemId: item.id,
        itemThumb: item.image,
        lastMessage: "You requested a swap — say hi! 👋",
        time: "Just now",
        unread: false,
        status: "pending",
        rated: false,
      },
      ...cs,
    ]);
    return true;
  };

  const completeSwap = (conversationId: number) => {
    let already = false;
    setConversations((cs) =>
      cs.map((c) => {
        if (c.id !== conversationId) return c;
        if (c.status === "completed") {
          already = true;
          return c;
        }
        return {
          ...c,
          status: "completed",
          unread: false,
          lastMessage: "Swap completed 🎉",
        };
      }),
    );
    if (already) return;
    earn(CREDIT_RULES.COMPLETE_SWAP, "Completed a swap");
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C2794A", "#6B7A5C", "#E8DDD0"],
    });
  };

  const rateSwap = (conversationId: number) => {
    let ok = false;
    setConversations((cs) =>
      cs.map((c) => {
        if (c.id !== conversationId || c.rated || c.status !== "completed") return c;
        ok = true;
        return { ...c, rated: true };
      }),
    );
    if (ok) earn(CREDIT_RULES.FIVE_STAR, "5-star rating given");
  };

  // ── listings ──────────────────────────────────────────────────────────────
  const listItem = (input: ListInput) => {
    const newListing: Listing = {
      id: genId(),
      name: input.name,
      category: input.category,
      condition: input.condition,
      size: input.size,
      image:
        input.image ||
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
      distance: "0.2km",
      neighborhood: input.neighborhood || "Ruzafa",
      description: input.description || "Freshly listed by you.",
      owner: {
        name: "Brandon Parker",
        avatar: "https://i.pravatar.cc/150?img=12",
        rating: 4.9,
        swapCount: BASE_COMPLETED_SWAPS,
      },
      status: "active",
      boosted: false,
      userCreated: true,
    };
    setListings((l) => [newListing, ...l]);
    earn(CREDIT_RULES.LIST_ITEM, `Listed “${input.name}”`);
  };

  const boostListing = (listingId: number) => {
    const target = listings.find((l) => l.id === listingId);
    if (target?.boosted) {
      toast("Already boosted", { description: target.name });
      return;
    }
    if (!spend(CREDIT_RULES.BOOST, "Boosted a listing")) return;
    setListings((l) =>
      l.map((x) => (x.id === listingId ? { ...x, boosted: true } : x)),
    );
  };

  const resetDemo = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setCredits(CREDIT_RULES.START);
    setLedger([]);
    setSavedIds(seedSavedIds);
    setListings(seedListings);
    setConversations(seedConversations);
    toast("Demo reset", { description: "Back to a fresh start." });
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const feedItems = useMemo<Item[]>(
    () => [...listings.filter((l) => l.userCreated && l.status === "active"), ...items],
    [listings],
  );

  const completedSwaps = useMemo(
    () =>
      BASE_COMPLETED_SWAPS +
      conversations.filter((c) => c.status === "completed").length,
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
    credits,
    ledger,
    savedIds,
    listings,
    conversations,
    feedItems,
    completedSwaps,
    ecoStats,
    getItem,
    isSaved,
    toggleSaved,
    hasRequested,
    requestSwap,
    completeSwap,
    rateSwap,
    listItem,
    boostListing,
    resetDemo,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
