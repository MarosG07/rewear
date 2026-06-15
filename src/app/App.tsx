import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import SplashScreen from "./components/SplashScreen";
import { StoreProvider } from "./store/AppStore";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Plain timers (not an rAF/AnimatePresence transition) so the splash
    // always clears, even if the tab loads in the background.
    const fade = setTimeout(() => setFading(true), 2500);
    const done = setTimeout(() => setShowSplash(false), 3000);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  return (
    <StoreProvider>
      <div className="min-h-screen bg-[#E8DDD0] flex items-center justify-center py-4 px-2 sm:px-4">
        <div className="w-full max-w-[390px] h-[calc(100vh-2rem)] max-h-[844px] bg-white shadow-2xl overflow-hidden relative rounded-[40px]">
          {/* The app mounts immediately; the splash fades out on top of it.
              This keeps the splash from gating the whole app behind a
              requestAnimationFrame transition (which a background tab pauses). */}
          <RouterProvider router={router} />
          {showSplash && <SplashScreen fading={fading} />}
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
    </StoreProvider>
  );
}