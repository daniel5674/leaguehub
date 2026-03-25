"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { currentUser, isLoaded } = useAuth();
  const router = useRouter();

  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !currentUser) {
      router.push("/login");
      return;
    }

    const fetchMyLeagues = async () => {
      try {
        const res = await fetch("/api/leagues/my", {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(data.message || "שגיאה בטעינת הליגות");
          setLeagues([]);
          return;
        }

        setLeagues(data);
      } catch (error) {
        console.error("Failed to fetch my leagues:", error);
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && currentUser) {
      fetchMyLeagues();
    }
  }, [currentUser, isLoaded, router]);

  const stats = useMemo(() => {
    const leaguesCount = leagues.length;
    const teamsCount = leagues.reduce(
      (sum, league) => sum + (league.teams?.length || 0),
      0
    );
    const matchesCount = leagues.reduce(
      (sum, league) => sum + (league.matches?.length || 0),
      0
    );

    return {
      leaguesCount,
      teamsCount,
      matchesCount,
    };
  }, [leagues]);

  if (!isLoaded || loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-gray-500">טוען פרופיל...</p>
      </main>
    );
  }

  if (!currentUser) return null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="mb-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl font-bold text-white">
            {currentUser.email?.[0]?.toUpperCase() || "U"}
          </div>

          <div>
            <h1 className="text-3xl font-bold">הפרופיל שלי</h1>
            <p className="mt-1 text-gray-500">{currentUser.email}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">ליגות שיצרתי</p>
            <p className="mt-2 text-3xl font-bold">{stats.leaguesCount}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">סה״כ קבוצות</p>
            <p className="mt-2 text-3xl font-bold">{stats.teamsCount}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">סה״כ משחקים</p>
            <p className="mt-2 text-3xl font-bold">{stats.matchesCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">הליגות שלי</h2>
            <p className="mt-1 text-gray-500">כל הליגות שיצרת במערכת</p>
          </div>

          <Link
            href="/leagues/create"
            className="rounded-2xl bg-black px-4 py-2 text-white transition hover:bg-gray-800"
          >
            צור ליגה
          </Link>
        </div>

        {leagues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <p className="mb-4 text-gray-500">עדיין לא יצרת ליגות</p>

            <Link
              href="/leagues/create"
              className="rounded-2xl bg-black px-4 py-2 text-white transition hover:bg-gray-800"
            >
              צור ליגה ראשונה
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {leagues.map((league) => (
              <Link
                key={league.id || league._id}
                href={`/leagues/${league.id || league._id}`}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {league.name}
                  </h3>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                    {league.status}
                  </span>
                </div>

                <p className="mb-2 text-sm text-gray-500">{league.sport}</p>
                <p className="mb-3 text-sm text-gray-500">{league.location}</p>

                <p className="mb-5 line-clamp-2 text-sm text-gray-600">
                  {league.description || "ללא תיאור"}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>קבוצות: {league.teamsCount || 0}</span>
                  <span>משחקים: {league.matches?.length || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
