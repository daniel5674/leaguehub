"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch("/api/leagues", {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(data.message || "שגיאה בטעינת ליגות");
          setLeagues([]);
          return;
        }

        setLeagues(data);
      } catch (error) {
        console.error("Failed to fetch leagues:", error);
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-gray-500">טוען ליגות...</p>
      </main>
    );
  }
  const visibleLeagues = currentUser ? leagues : leagues.slice(0, 3);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 py-12">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10 overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                🏆 LeagueHub Leagues
              </span>

              <h1 className="text-4xl font-extrabold md:text-5xl">
                כל הליגות במקום אחד
              </h1>

              <p className="mt-4 max-w-2xl text-slate-300">
                צפה בליגות פעילות, בדוק קבוצות ומשחקים, והיכנס לניהול מלא של
                הליגה.
              </p>
            </div>

            {currentUser?.role === "manager" ? (
              <Link
                href="/leagues/create"
                className="rounded-2xl bg-white px-6 py-4 text-center font-bold text-black transition hover:scale-105 hover:bg-gray-200"
              >
                + צור ליגה
              </Link>
            ) : !currentUser ? (
              <Link
                href="/login"
                className="rounded-2xl border border-white/20 px-6 py-4 text-center font-bold text-white transition hover:scale-105 hover:bg-white/10"
              >
                🔒 התחבר כדי ליצור ליגה
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-3xl font-extrabold">{leagues.length}</p>
            <p className="text-sm text-gray-500">ליגות במערכת</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-3xl font-extrabold">
              {leagues.reduce(
                (sum, league) => sum + (league.teamsCount || 0),
                0
              )}
            </p>
            <p className="text-sm text-gray-500">קבוצות</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-3xl font-extrabold">
              {leagues.reduce(
                (sum, league) => sum + (league.matches?.length || 0),
                0
              )}
            </p>
            <p className="text-sm text-gray-500">משחקים</p>
          </div>
        </div>

        {leagues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-5xl">🏟️</div>
            <h2 className="text-2xl font-bold text-gray-900">
              אין ליגות להצגה
            </h2>
            <p className="mt-2 text-gray-500">
              ברגע שתיווצר ליגה, היא תופיע כאן.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleLeagues.map((league, index) => {
                const leagueId = league.id || league._id;

                const statusColor =
                  league.status === "פעילה"
                    ? "bg-green-100 text-green-700"
                    : league.status === "פתוחה"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600";

                const gradients = [
                  "from-blue-600 to-blue-900",
                  "from-emerald-600 to-emerald-900",
                  "from-purple-600 to-purple-900",
                  "from-orange-500 to-orange-800",
                ];

                const card = (
                  <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    {!currentUser && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm">
                        <div className="mb-2 text-4xl">🔒</div>
                        <p className="font-semibold text-gray-700">
                          התחבר כדי להיכנס
                        </p>
                      </div>
                    )}

                    <div className={!currentUser ? "opacity-45" : ""}>
                      <div
                        className={`h-24 bg-gradient-to-br ${
                          gradients[index % gradients.length]
                        } p-5 text-white`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold backdrop-blur">
                            {league.name?.charAt(0)}
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-sm font-bold ${statusColor}`}
                          >
                            {league.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <h2 className="text-2xl font-extrabold text-gray-900">
                          {league.name}
                        </h2>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            ⚽ {league.sport}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            📍 {league.location}
                          </span>
                        </div>

                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600">
                          {league.description || "ללא תיאור"}
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-gray-50 p-4 text-center">
                            <p className="text-2xl font-extrabold text-gray-900">
                              {league.teamsCount || 0}
                            </p>
                            <p className="text-xs text-gray-500">קבוצות</p>
                          </div>

                          <div className="rounded-2xl bg-gray-50 p-4 text-center">
                            <p className="text-2xl font-extrabold text-gray-900">
                              {league.matches?.length || 0}
                            </p>
                            <p className="text-xs text-gray-500">משחקים</p>
                          </div>
                        </div>

                        <div className="mt-6 rounded-2xl bg-black px-4 py-3 text-center text-sm font-bold text-white transition group-hover:bg-gray-800">
                          כניסה לליגה
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return currentUser ? (
                  <Link key={leagueId} href={`/leagues/${leagueId}`}>
                    {card}
                  </Link>
                ) : (
                  <div key={leagueId}>{card}</div>
                );
              })}
            </div>

            {!currentUser && leagues.length > 3 && (
              <div className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
                <p className="text-gray-600">
                  🔒 יש עוד ליגות זמינות. התחבר כדי לראות את כולן.
                </p>

                <Link
                  href="/login"
                  className="mt-5 inline-block rounded-2xl bg-black px-6 py-3 font-bold text-white transition hover:scale-105 hover:bg-gray-800"
                >
                  התחברות / הרשמה
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
