"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function MyLeaguesPage() {
  const { currentUser, isLoaded } = useAuth();
  const router = useRouter();

  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !currentUser) {
      router.push("/login");
      return;
    }

    const fetchLeagues = async () => {
      try {
        const res = await fetch("/api/leagues/my", {
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
        console.error("Failed to fetch my leagues:", error);
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && currentUser) {
      fetchLeagues();
    }
  }, [currentUser, isLoaded, router]);

  if (!isLoaded || loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-gray-500">טוען ליגות...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">הליגות שלי</h1>
          <p className="mt-2 text-gray-500">
            כאן תוכל לראות את כל הליגות שיצרת
          </p>
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
                <h2 className="text-xl font-bold text-gray-900">
                  {league.name}
                </h2>

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
    </main>
  );
}
