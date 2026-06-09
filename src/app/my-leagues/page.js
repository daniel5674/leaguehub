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
      <main
        dir="rtl"
        className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-12 text-white"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <p className="text-slate-300">טוען ליגות...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-12 text-white"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/2 h-[700px] w-[1200px] -translate-x-1/2 opacity-[0.06]">
          <div className="absolute bottom-0 h-full w-full rounded-t-[500px] border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-white" />
          <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-72 w-[420px] -translate-x-1/2 border-4 border-white" />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <span className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm font-bold text-emerald-300">
              LeagueHub
            </span>

            <h1 className="text-4xl font-black">הליגות שלי</h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              כאן תוכל לראות את כל הליגות שיצרת, להיכנס לניהול הליגה, לעקוב אחרי
              קבוצות, משחקים וסטטוס הפעילות.
            </p>
          </div>

          <Link
            href="/leagues/create"
            className="rounded-2xl bg-emerald-400 px-5 py-3 text-center text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300"
          >
            צור ליגה חדשה
          </Link>
        </div>

        {leagues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/10 p-12 text-center backdrop-blur">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-400/10 text-3xl">
              🏆
            </div>

            <h2 className="mb-2 text-2xl font-black">עדיין לא יצרת ליגות</h2>

            <p className="mb-6 text-sm text-slate-300">
              צור את הליגה הראשונה שלך והתחל לנהל קבוצות, משחקים וטבלאות.
            </p>

            <Link
              href="/leagues/create"
              className="inline-flex rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
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
                className="group rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-white/15"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-lg font-black text-emerald-300">
                      {league.name?.charAt(0)}
                    </div>

                    <h2 className="text-lg font-black text-white">
                      {league.name}
                    </h2>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                    {league.status}
                  </span>
                </div>

                <div className="mb-4 space-y-1 text-sm text-slate-300">
                  <p>ענף: {league.sport || "לא צוין"}</p>
                  <p>מיקום: {league.location || "לא צוין"}</p>
                </div>

                <p className="mb-4 line-clamp-2 text-sm leading-5 text-slate-400">
                  {league.description || "ללא תיאור"}
                </p>

                <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                  <div className="rounded-xl bg-slate-950/40 p-3">
                    <p className="text-xs text-slate-400">קבוצות</p>
                    <p className="mt-1 text-xl font-black text-white">
                      {league.teamsCount || league.teams?.length || 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/40 p-3">
                    <p className="text-xs text-slate-400">משחקים</p>
                    <p className="mt-1 text-xl font-black text-white">
                      {league.matches?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-5 text-sm font-bold text-emerald-300 opacity-0 transition group-hover:opacity-100">
                  כניסה לליגה ←
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
