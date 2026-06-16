import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import SplashScreen from "./components/SplashScreen";
import Onboarding from "./components/Onboarding";
import Auth from "./screens/Auth";
import { AuthProvider, useAuth } from "./store/AuthContext";
import { StoreProvider } from "./store/AppStore";

export default function App() {
  // Track the visual viewport so the app shrinks to fit above the on-screen
  // keyboard (otherwise the chat input gets pushed off the bottom on mobile).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      // Only trust plausible viewport heights (avoids odd 0/tiny values in
      // some embedded/headless contexts); otherwise fall back to 100dvh.
      if (vv.height >= 200 && vv.height <= window.innerHeight + 4) {
        document.documentElement.style.setProperty("--app-h", `${Math.round(vv.height)}px`);
      } else {
        document.documentElement.style.removeProperty("--app-h");
      }
    };
    apply();
    vv.addEventListener("resize", apply);
    return () => vv.removeEventListener("resize", apply);
  }, []);

  return (
    <AuthProvider>
      {/* On phones the app is locked to the viewport (only inner content
          scrolls, so the address bar doesn't toggle and resize things); from
          `sm` up it sits inside the centered device frame for desktop. */}
      <div className="h-[var(--app-h,100dvh)] overflow-hidden bg-[#E8DDD0] sm:h-auto sm:min-h-[100dvh] sm:overflow-visible sm:flex sm:items-center sm:justify-center sm:py-4 sm:px-4">
        <div className="relative w-full h-[var(--app-h,100dvh)] bg-white overflow-hidden sm:h-[calc(100dvh-2rem)] sm:max-w-[390px] sm:max-h-[844px] sm:mx-auto sm:rounded-[40px] sm:shadow-2xl">
          <Shell />
        </div>
      </div>
      <Toaster
        position="top-center"
        offset={24}
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#3D3530",
            border: "1px solid rgba(61, 53, 48, 0.1)",
            borderRadius: "16px",
          },
        }}
      />
    </AuthProvider>
  );
}

function Shell() {
  const { loading, session } = useAuth();
  const [onboarded, setOnboarded] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("rewear-onboarded") === "1",
  );

  // Splash: minimum brand moment, but also held until auth resolves.
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [renderSplash, setRenderSplash] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 2200);
    return () => clearTimeout(t);
  }, []);

  const wantSplash = loading || !minTimePassed;
  useEffect(() => {
    if (!wantSplash) {
      setFading(true);
      const t = setTimeout(() => setRenderSplash(false), 450);
      return () => clearTimeout(t);
    }
  }, [wantSplash]);

  return (
    <>
      {session ? (
        <StoreProvider>
          <RouterProvider router={router} />
        </StoreProvider>
      ) : (
        !wantSplash && <Auth />
      )}
      {session && !onboarded && !wantSplash && (
        <Onboarding
          onDone={() => {
            localStorage.setItem("rewear-onboarded", "1");
            setOnboarded(true);
          }}
        />
      )}
      {renderSplash && <SplashScreen fading={fading} />}
    </>
  );
}
