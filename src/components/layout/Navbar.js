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
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

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

  const openPlayerProfile = async (req) => {
    setSelectedRequest(req);
    setSelectedProfile(null);
    setProfileLoading(true);
    setNotificationsOpen(false);

    try {
      const res = await fetch("/api/player-profile/by-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: req.playerEmail,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        console.log("Player profile error:", data);
        setSelectedProfile(null);
        return;
      }

      setSelectedProfile(data);
    } catch (error) {
      console.error("Failed to load player profile:", error);
      setSelectedProfile(null);
    } finally {
      setProfileLoading(false);
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
      ? [{ href: "/leagues/create", label: "צור ליגה" }]
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
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex flex-row-reverse items-center gap-4">
            <Link
              href="/"
              className="text-3xl font-extrabold tracking-tight text-gray-900 transition hover:opacity-80"
            >
              LeagueHub
            </Link>

            {currentUser && (
              <Link
                href="/profile"
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-black hover:bg-black hover:text-white"
              >
                הפרופיל שלי
              </Link>
            )}
          </div>

          <nav className="flex items-center gap-2">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" &&
                  link.href !== "/leagues" &&
                  pathname.startsWith(link.href));

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

                            <button
                              type="button"
                              onClick={() => openPlayerProfile(req)}
                              className="mt-3 block w-full rounded-xl bg-black px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                            >
                              הצג פרטי שחקן
                            </button>
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

      {selectedRequest && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">כרטיס שחקן</h2>

              <button
                onClick={() => {
                  setSelectedRequest(null);

                  setSelectedProfile(null);
                }}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-600 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {profileLoading ? (
              <p className="py-10 text-center text-gray-500">
                טוען כרטיס שחקן...
              </p>
            ) : (
              <>
                <div className="rounded-[1.5rem] bg-gradient-to-br from-gray-900 to-gray-700 p-6 text-center text-white">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl font-black text-gray-900">
                    {(
                      selectedProfile?.fullName ||
                      selectedRequest.playerName ||
                      "?"
                    )

                      .charAt(0)

                      .toUpperCase()}
                  </div>

                  <h3 className="text-2xl font-black">
                    {selectedProfile?.fullName || selectedRequest.playerName}
                  </h3>

                  <p className="mt-1 text-sm text-gray-300">
                    {selectedProfile?.email || selectedRequest.playerEmail}
                  </p>

                  <div className="mt-5 inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-bold">
                    דירוג {selectedProfile?.rating || "D"}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-gray-100 p-4">
                    <p className="text-2xl font-black">
                      {selectedProfile?.goals || 0}
                    </p>

                    <p className="text-xs text-gray-500">שערים</p>
                  </div>

                  <div className="rounded-2xl bg-gray-100 p-4">
                    <p className="text-2xl font-black">
                      {selectedProfile?.assists || 0}
                    </p>

                    <p className="text-xs text-gray-500">בישולים</p>
                  </div>

                  <div className="rounded-2xl bg-gray-100 p-4">
                    <p className="text-2xl font-black">
                      {selectedProfile?.gamesPlayed || 0}
                    </p>

                    <p className="text-xs text-gray-500">משחקים</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-gray-100 p-4 text-right">
                  <p className="text-xs text-gray-500">קבוצה מבוקשת</p>

                  <p className="font-bold text-gray-900">
                    {selectedRequest.teamName}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      handleApprove(selectedRequest);

                      setSelectedRequest(null);

                      setSelectedProfile(null);
                    }}
                    className="rounded-2xl bg-green-600 py-3 font-bold text-white hover:bg-green-700"
                  >
                    אשר
                  </button>

                  <button
                    onClick={() => {
                      handleReject(selectedRequest);

                      setSelectedRequest(null);

                      setSelectedProfile(null);
                    }}
                    className="rounded-2xl bg-red-600 py-3 font-bold text-white hover:bg-red-700"
                  >
                    דחה
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
