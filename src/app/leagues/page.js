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
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">כל הליגות</h1>
          <p className="mt-2 text-gray-500">כאן מוצגות כל הליגות במערכת</p>
        </div>

        {currentUser ? (
          <Link
            href="/leagues/create"
            className="rounded-2xl bg-black px-4 py-2 text-white transition hover:bg-gray-800"
          >
            צור ליגה
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-2xl border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-100"
          >
            🔒 התחבר כדי ליצור ליגה
          </Link>
        )}
      </div>

      {leagues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-500">אין ליגות להצגה</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleLeagues.map((league) => {
              const leagueId = league.id || league._id;

              const card = (
                <div className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                  {/* 🔒 Overlay לאורח */}
                  {!currentUser && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm">
                      <div className="text-3xl mb-2">🔒</div>
                      <p className="text-sm text-gray-600">התחבר כדי להיכנס</p>
                    </div>
                  )}

                  {/* תוכן רגיל */}
                  <div className={!currentUser ? "opacity-50" : ""}>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">
                        {league.name}
                      </h2>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                        {league.status}
                      </span>
                    </div>

                    <p className="mb-2 text-sm text-gray-500">{league.sport}</p>
                    <p className="mb-3 text-sm text-gray-500">
                      {league.location}
                    </p>

                    <p className="mb-5 line-clamp-2 text-sm text-gray-600">
                      {league.description || "ללא תיאור"}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>קבוצות: {league.teamsCount || 0}</span>
                      <span>משחקים: {league.matches?.length || 0}</span>
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
            <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-6 text-center">
              <p className="text-gray-600">
                🔒 יש עוד ליגות זמינות. התחבר כדי לראות את כולן.
              </p>

              <Link
                href="/login"
                className="mt-4 inline-block rounded-2xl bg-black px-5 py-3 text-white transition hover:bg-gray-800"
              >
                התחברות / הרשמה
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}
