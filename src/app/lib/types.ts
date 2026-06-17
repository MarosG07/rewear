// Database row shapes (Supabase) shared across the app.

export interface Profile {
  id: string;
  name: string;
  location: string;
  avatar_url: string | null;
  credits: number;
  created_at: string;
}

export interface Listing {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  condition: string | null;
  size: string | null;
  neighborhood: string | null;
  description: string | null;
  image_url: string | null;
  images: string[];
  status: "active" | "swapped";
  boosted: boolean;
  created_at: string;
  owner?: Pick<Profile, "id" | "name" | "avatar_url" | "location"> | null;
}

export type SwapStatus = "pending" | "accepted" | "declined" | "confirmed" | "completed";

export interface Conversation {
  id: string;
  listing_id: string | null;
  requester_id: string;
  owner_id: string;
  status: SwapStatus;
  rated: boolean;
  requester_completed: boolean;
  owner_completed: boolean;
  offered_listing_id: string | null;
  meetup_at: string | null;
  meetup_place: string | null;
  meetup_confirmed: boolean;
  created_at: string;
  listing?: Pick<Listing, "id" | "name" | "image_url"> | null;
  offered?: Pick<Listing, "id" | "name" | "image_url"> | null;
  requester?: Pick<Profile, "id" | "name" | "avatar_url"> | null;
  owner?: Pick<Profile, "id" | "name" | "avatar_url"> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface WishItem {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  size: string | null;
  neighborhood: string | null;
  note: string | null;
  created_at: string;
  user?: Pick<Profile, "id" | "name" | "avatar_url"> | null;
}

export interface Review {
  id: string;
  conversation_id: string | null;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Pick<Profile, "id" | "name" | "avatar_url"> | null;
}
