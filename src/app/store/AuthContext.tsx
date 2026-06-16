import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  /** Patch the cached profile locally (e.g. after a credit change). */
  patchProfile: (partial: Partial<Profile>) => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    fields: Partial<Pick<Profile, "name" | "location" | "avatar_url">>,
  ) => Promise<string | null>;
}

const AuthContext = createContext<AuthValue | null>(null);

async function fetchProfile(id: string): Promise<Profile | null> {
  // The signup trigger creates the row; retry once in case of a brief race.
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (data) return data as Profile;
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) setProfile(await fetchProfile(data.session.user.id));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!active) return;
      setSession(sess);
      setProfile(sess ? await fetchProfile(sess.user.id) : null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // When the app (esp. an installed PWA) is reopened, force a session check so
  // an expired token gets refreshed instead of bouncing the user to sign-in.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.startAutoRefresh();
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return error.message;
    // If email confirmation is on, there's no session yet.
    if (data.session) setProfile(await fetchProfile(data.session.user.id));
    return null;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const patchProfile = (partial: Partial<Profile>) =>
    setProfile((p) => (p ? { ...p, ...partial } : p));

  const refreshProfile = async () => {
    if (session) setProfile(await fetchProfile(session.user.id));
  };

  const updateProfile: AuthValue["updateProfile"] = async (fields) => {
    if (!session) return "Not signed in";
    const { error } = await supabase.from("profiles").update(fields).eq("id", session.user.id);
    if (error) return error.message;
    patchProfile(fields);
    return null;
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signUp, signIn, signOut, patchProfile, refreshProfile, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
