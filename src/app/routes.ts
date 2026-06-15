import { createBrowserRouter } from "react-router";
import Home from "./screens/Home";
import ItemDetail from "./screens/ItemDetail";
import ListItem from "./screens/ListItem";
import SwapInbox from "./screens/SwapInbox";
import Saved from "./screens/Saved";
import Profile from "./screens/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/item/:id",
    Component: ItemDetail,
  },
  {
    path: "/list",
    Component: ListItem,
  },
  {
    path: "/inbox",
    Component: SwapInbox,
  },
  {
    path: "/saved",
    Component: Saved,
  },
  {
    path: "/profile",
    Component: Profile,
  },
]);
