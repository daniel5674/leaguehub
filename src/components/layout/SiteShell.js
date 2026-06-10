"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

const AUTH_ROUTES = new Set(["/login", "/register"]);

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  return (
    <div className={`site-shell${isAuthRoute ? " auth-shell" : ""}`}>
      <Navbar />
      <div className="site-content">{children}</div>
    </div>
  );
}
