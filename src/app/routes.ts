import { createBrowserRouter } from "react-router";
import RouteTransition from "./components/RouteTransition";
import Home from "./screens/Home";

// Home is eager (it's the landing screen); every other route is split into its
// own chunk and fetched on first navigation, which keeps the initial bundle
// small. `lazy` returns the route's Component once its module resolves.
const lazyScreen = (load: () => Promise<{ default: React.ComponentType }>) => () =>
  load().then((m) => ({ Component: m.default }));

export const router = createBrowserRouter([
  {
    Component: RouteTransition,
    children: [
      { path: "/", Component: Home },
      { path: "/item/:id", lazy: lazyScreen(() => import("./screens/ItemDetail")) },
      { path: "/item/:id/edit", lazy: lazyScreen(() => import("./screens/EditListing")) },
      { path: "/list", lazy: lazyScreen(() => import("./screens/ListItem")) },
      { path: "/inbox", lazy: lazyScreen(() => import("./screens/SwapInbox")) },
      { path: "/saved", lazy: lazyScreen(() => import("./screens/Saved")) },
      { path: "/profile", lazy: lazyScreen(() => import("./screens/Profile")) },
      { path: "/user/:id", lazy: lazyScreen(() => import("./screens/UserProfile")) },
      { path: "/rate/:id", lazy: lazyScreen(() => import("./screens/RateSwap")) },
      { path: "/credits", lazy: lazyScreen(() => import("./screens/Credits")) },
      { path: "/settings", lazy: lazyScreen(() => import("./screens/Settings")) },
      { path: "/wishlist", lazy: lazyScreen(() => import("./screens/Wishlist")) },
      { path: "/rewards", lazy: lazyScreen(() => import("./screens/Rewards")) },
    ],
  },
]);
