"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const publicLinks = [
  { href: "/", label: "בית" },
  { href: "/leagues", label: "ליגות" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [playerNotifications, setPlayerNotifications] = useState([]);

  const menuRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPlayerNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setPlayerNotifications(data.notifications || []);
    } catch {
      setPlayerNotifications([]);
    }
  };

  const markPlayerNotifsRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      credentials: "include",
    });
    setPlayerNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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
    if (currentUser) {
      fetchPlayerNotifications();
    } else {
      setPlayerNotifications([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role !== "manager") return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      fetchPlayerNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (!mounted) {
    return null;
  }
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050b14]/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex flex-row-reverse items-center gap-4">
            <Link
              href="/"
              className="text-3xl font-black tracking-tight text-white transition hover:text-emerald-300"
            >
              LeagueHub
            </Link>

            {currentUser && (
              <Link
                href="/profile"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 shadow-sm transition hover:border-emerald-400/40 hover:bg-emerald-400 hover:text-slate-950"
              >
                הפרופיל שלי
              </Link>
            )}
          </div>

          <nav className="hidden items-center gap-2 md:flex">
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
                  className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                    isActive
                      ? "bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {currentUser &&
              (() => {
                const unreadPlayer = playerNotifications.filter(
                  (n) => !n.read
                ).length;
                const totalBadge = pendingCount + unreadPlayer;

                return (
                  <div className="relative" ref={notificationsRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen((prev) => !prev);
                        if (unreadPlayer > 0) markPlayerNotifsRead();
                      }}
                      className="relative rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm transition hover:bg-white/15"
                    >
                      🔔
                      {totalBadge > 0 && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {totalBadge}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div className="absolute left-0 mt-3 w-80 rounded-3xl border border-white/10 bg-[#0b1220] p-3 text-white shadow-2xl">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-black">התראות</h3>

                          {totalBadge > 0 && (
                            <span className="text-xs text-slate-400">
                              {totalBadge} חדשות
                            </span>
                          )}
                        </div>

                        {currentUser.role === "manager" && (
                          <>
                            {requests.length > 0 && (
                              <div className="mb-3">
                                <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                                  בקשות הצטרפות
                                </p>

                                <div className="space-y-3">
                                  {requests.map((req) => (
                                    <div
                                      key={req._id}
                                      className="rounded-2xl border border-white/10 bg-white/[0.05] p-3"
                                    >
                                      <p className="text-sm font-bold text-white">
                                        {req.playerName || req.playerEmail}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-400">
                                        רוצה להצטרף ל־{req.teamName}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-400">
                                        ליגה: {req.leagueName}
                                      </p>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNotificationsOpen(false);
                                          router.push(
                                            `/leagues/${req.leagueId}/players/${req.playerId}?requestId=${req._id}`
                                          );
                                        }}
                                        className="mt-3 block w-full rounded-xl bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                                      >
                                        הצג פרטי שחקן
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {requests.length > 0 &&
                              playerNotifications.length > 0 && (
                                <hr className="my-3 border-white/10" />
                              )}
                          </>
                        )}

                        {playerNotifications.length > 0 ? (
                          <div className="space-y-2">
                            {playerNotifications.slice(0, 8).map((n, i) => (
                              <div
                                key={i}
                                className={`rounded-2xl p-3 text-sm ${
                                  n.read
                                    ? "bg-white/[0.05] text-slate-400"
                                    : "bg-emerald-400/10 font-bold text-slate-100"
                                }`}
                              >
                                <p>{n.message}</p>

                                {n.leagueName && (
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {n.leagueName}
                                  </p>
                                )}

                                {n.actionType === "report-match" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNotificationsOpen(false);
                                      router.push(
                                        `/leagues/${n.leagueId}/matches/${n.matchId}/update`
                                      );
                                    }}
                                    className="mt-3 block w-full rounded-xl bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                                  >
                                    דווח משחק
                                  </button>
                                )}

                                {n.actionType === "review-match-report" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNotificationsOpen(false);
                                      router.push(
                                        `/leagues/${n.leagueId}/matches/${n.matchId}/review`
                                      );
                                    }}
                                    className="mt-3 block w-full rounded-xl bg-yellow-400 px-3 py-2 text-center text-sm font-black text-slate-950 transition hover:bg-yellow-300"
                                  >
                                    בדוק דיווח משחק
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          (currentUser.role !== "manager" ||
                            requests.length === 0) && (
                            <p className="text-sm text-slate-400">אין התראות</p>
                          )
                        )}

                        {currentUser.role === "manager" && (
                          <Link
                            href="/notifications"
                            onClick={() => setNotificationsOpen(false)}
                            className="mt-3 block rounded-xl bg-white/10 px-4 py-2 text-center text-sm font-bold text-slate-200 transition hover:bg-white/15"
                          >
                            לכל ההתראות
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            <div className="relative" ref={menuRef}>
              {!currentUser ? (
                <>
                  <button
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/15"
                  >
                    התחברות / הרשמה
                  </button>

                  {menuOpen && (
                    <div className="absolute left-0 mt-3 w-44 rounded-2xl border border-white/10 bg-[#0b1220] p-2 shadow-2xl">
                      <Link
                        href="/login"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                      >
                        התחברות
                      </Link>

                      <Link
                        href="/register"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
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
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                  >
                    🟢 מחובר
                  </button>

                  {menuOpen && (
                    <div className="absolute left-0 mt-3 w-52 rounded-2xl border border-white/10 bg-[#0b1220] p-2 shadow-2xl">
                      {currentUser?.role === "manager" && (
                        <Link
                          href="/leagues/create"
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-xl px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          צור ליגה
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                        }}
                        className="block w-full rounded-xl px-4 py-2 text-right text-sm font-bold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
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
