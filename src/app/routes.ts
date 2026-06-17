import { createBrowserRouter } from "react-router";
import RouteTransition from "./components/RouteTransition";
import Home from "./screens/Home";
import ItemDetail from "./screens/ItemDetail";
import EditListing from "./screens/EditListing";
import ListItem from "./screens/ListItem";
import SwapInbox from "./screens/SwapInbox";
import Saved from "./screens/Saved";
import Profile from "./screens/Profile";
import UserProfile from "./screens/UserProfile";
import RateSwap from "./screens/RateSwap";
import Credits from "./screens/Credits";
import Settings from "./screens/Settings";
import Wishlist from "./screens/Wishlist";
import Rewards from "./screens/Rewards";

export const router = createBrowserRouter([
  {
    Component: RouteTransition,
    children: [
      { path: "/", Component: Home },
      { path: "/item/:id", Component: ItemDetail },
      { path: "/item/:id/edit", Component: EditListing },
      { path: "/list", Component: ListItem },
      { path: "/inbox", Component: SwapInbox },
      { path: "/saved", Component: Saved },
      { path: "/profile", Component: Profile },
      { path: "/user/:id", Component: UserProfile },
      { path: "/rate/:id", Component: RateSwap },
      { path: "/credits", Component: Credits },
      { path: "/settings", Component: Settings },
      { path: "/wishlist", Component: Wishlist },
      { path: "/rewards", Component: Rewards },
    ],
  },
]);
