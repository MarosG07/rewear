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
      {/* On phones the app fills the screen like an installed app; from `sm`
          up it sits inside the centered device frame for desktop preview. */}
      <div className="min-h-[100dvh] bg-[#E8DDD0] sm:flex sm:items-center sm:justify-center sm:py-4 sm:px-4">
        <div className="relative w-full h-[100dvh] bg-white overflow-hidden sm:h-[calc(100dvh-2rem)] sm:max-w-[390px] sm:max-h-[844px] sm:mx-auto sm:rounded-[40px] sm:shadow-2xl">
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