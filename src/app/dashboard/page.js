"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { currentUser, isLoaded } = useAuth();

  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await fetch("/api/leagues");
        const data = await res.json();
        setLeagues(data);
      } catch (error) {
        console.error("Failed to fetch leagues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

  if (!isLoaded) return null;

  if (!currentUser) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-4 text-3xl font-bold">דשבורד</h1>
        <p className="text-gray-600">צריך להתחבר כדי לראות את הליגות שלך.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-gray-600">טוען ליגות...</p>
      </main>
    );
  }

  const userLeagues = leagues.filter(
    (league) => league.createdBy === currentUser.email
  );

  const handleRemoveLeague = async (leagueId, leagueName) => {
    const confirmed = window.confirm(`למחוק את הליגה "${leagueName}"?`);

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/leagues/${leagueId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete league");
      }

      setLeagues((prev) =>
        prev.filter((league) => String(league.id) !== String(leagueId))
      );

      setMessage("הליגה נמחקה בהצלחה");
    } catch (error) {
      console.error("Failed to delete league:", error);
      setMessage("מחיקת הליגה נכשלה");
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">הליגות שלי</h1>

        <Link
          href="/leagues/create"
          className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          + צור ליגה
        </Link>
      </div>

      {message && <p className="mb-6 text-sm text-green-600">{message}</p>}

      {userLeagues.length === 0 ? (
        <p className="text-gray-500">עדיין לא יצרת ליגות.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {userLeagues.map((league) => (
            <div
              key={league.id}
              className="rounded-2xl border border-gray-200 p-6 transition hover:shadow-md"
            >
              <Link href={`/leagues/${league.id}`} className="block">
                <h2 className="mb-2 text-xl font-bold">{league.name}</h2>

                <p className="text-sm text-gray-600">
                  {league.sport} | {league.location}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  קבוצות: {league.teamsCount}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  משחקים: {league.matches.length}
                </p>
              </Link>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleRemoveLeague(league.id, league.name)}
                  className="text-sm text-red-500 transition hover:scale-105 hover:text-red-700"
                >
                  מחק ליגה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
