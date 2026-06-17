import { Outlet, useLocation } from "react-router";

/** Layout route: re-keys on each path change so the screen animates in. */
export default function RouteTransition() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="h-full animate-page">
      <Outlet />
    </div>
  );
}
