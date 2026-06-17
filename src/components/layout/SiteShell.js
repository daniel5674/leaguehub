"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

const AUTH_ROUTES = new Set(["/login", "/register"]);

function getShellTheme(pathname) {
  if (AUTH_ROUTES.has(pathname)) return "auth-shell";
  if (pathname === "/") return "shell-home";
  if (pathname === "/leagues/create") return "shell-create-league";
  if (pathname.startsWith("/leagues/")) return "shell-league-room";
  if (pathname === "/leagues" || pathname === "/my-leagues") return "shell-leagues";
  if (pathname.startsWith("/friends") || pathname.startsWith("/users")) return "shell-social";
  if (pathname.startsWith("/profile")) return "shell-profile";
  if (pathname.startsWith("/notifications")) return "shell-notifications";
  if (pathname.startsWith("/dashboard")) return "shell-dashboard";
  return "shell-home";
}

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const shellTheme = getShellTheme(pathname);

  return (
    <div className={`site-shell ${shellTheme}`}>
      <Navbar />
      <div className="site-content">{children}</div>
    </div>
  );
}
