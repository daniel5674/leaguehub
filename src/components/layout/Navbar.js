"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const publicLinks = [
  { href: "/", label: "בית" },
  { href: "/leagues", label: "ליגות" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [requests, setRequests] = useState([]);

  const menuRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/leagues/my", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setRequests([]);
        setPendingCount(0);
        return;
      }

      const allRequests = [];

      data.forEach((league) => {
        (league.joinRequests || []).forEach((req) => {
          if (req.status === "pending") {
            allRequests.push({
              ...req,
              leagueId: league.id || league._id,
              leagueName: league.name,
            });
          }
        });
      });

      setRequests(allRequests);
      setPendingCount(allRequests.length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setRequests([]);
      setPendingCount(0);
    }
  };

  const handleApprove = async (req) => {
    try {
      const res = await fetch(
        `/api/leagues/${req.leagueId}/join-requests/${req._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ action: "approve" }),
        }
      );

      if (!res.ok) {
        return;
      }

      await fetchNotifications();
    } catch (error) {
      console.error("Approve notification failed:", error);
    }
  };

  const handleReject = async (req) => {
    try {
      const res = await fetch(
        `/api/leagues/${req.leagueId}/join-requests/${req._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ action: "reject" }),
        }
      );

      if (!res.ok) {
        return;
      }

      await fetchNotifications();
    } catch (error) {
      console.error("Reject notification failed:", error);
    }
  };

  const privateLinks = [
    { href: "/my-leagues", label: "הליגות שלי" },
    ...(currentUser?.role === "manager"
      ? [
          {
            href: "/notifications",
            label: `התראות${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
          },
          { href: "/leagues/create", label: "צור ליגה" },
        ]
      : []),
  ];

  const links = currentUser ? [...publicLinks, ...privateLinks] : publicLinks;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (currentUser?.role === "manager") {
      fetchNotifications();
    } else {
      setRequests([]);
      setPendingCount(0);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role !== "manager") return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000); // כל 5 שניות

    return () => clearInterval(interval);
  }, [currentUser]);

  if (!mounted) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-3xl font-bold tracking-tight text-gray-900 transition hover:opacity-80"
        >
          LeagueHub
        </Link>

        <nav className="flex items-center gap-2">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {currentUser?.role === "manager" && (
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative rounded-full border border-gray-300 px-3 py-2 text-sm transition hover:bg-gray-100"
              >
                🔔
                {pendingCount > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                    {pendingCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute left-0 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">התראות</h3>
                    <span className="text-xs text-gray-500">
                      {pendingCount} ממתינות
                    </span>
                  </div>

                  {requests.length === 0 ? (
                    <p className="text-sm text-gray-500">אין התראות</p>
                  ) : (
                    <div className="max-h-96 space-y-3 overflow-y-auto">
                      {requests.map((req) => (
                        <div
                          key={req._id}
                          className="rounded-xl border border-gray-200 p-3"
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {req.playerName || req.playerEmail}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            רוצה להצטרף ל־{req.teamName}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            ליגה: {req.leagueName}
                          </p>

                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(req)}
                              className="flex-1 rounded-xl bg-black px-3 py-2 text-sm text-white transition hover:bg-gray-800"
                            >
                              אשר
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReject(req)}
                              className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm text-white transition hover:bg-red-600"
                            >
                              דחה
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link
                    href="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="mt-3 block rounded-xl bg-gray-100 px-4 py-2 text-center text-sm text-gray-700 transition hover:bg-gray-200"
                  >
                    לכל ההתראות
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="relative" ref={menuRef}>
            {!currentUser ? (
              <>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  התחברות / הרשמה
                </button>

                {menuOpen && (
                  <div className="absolute left-0 mt-3 w-44 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                    >
                      התחברות
                    </Link>

                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                    >
                      הרשמה
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="rounded-2xl border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                >
                  🟢 מחובר
                </button>

                {menuOpen && (
                  <div className="absolute left-0 mt-3 w-52 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                    >
                      הפרופיל שלי
                    </Link>

                    {currentUser?.role === "manager" && (
                      <Link
                        href="/notifications"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                      >
                        התראות{pendingCount > 0 ? ` (${pendingCount})` : ""}
                      </Link>
                    )}

                    {currentUser?.role === "manager" && (
                      <Link
                        href="/leagues/create"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                      >
                        צור ליגה
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="block w-full rounded-xl px-4 py-2 text-right text-sm text-red-500 transition hover:bg-red-50 hover:text-red-700"
                    >
                      התנתק
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
