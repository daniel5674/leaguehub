"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  pageBg,
  pageGlow,
  card,
  softCard,
  primaryButton,
  secondaryButton,
  tabActive,
  tabInactive,
} from "@/lib/uiStyles";

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

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

  const personalLeagues = leagues.filter(
    (league) => league.leagueType === "personal"
  );

  const teamLeagues = leagues.filter(
    (league) => league.leagueType !== "personal"
  );

  const filteredLeagues = useMemo(() => {
    if (activeTab === "personal") return personalLeagues;
    if (activeTab === "teams") return teamLeagues;
    return leagues;
  }, [activeTab, leagues]);

  const visibleLeagues = currentUser
    ? filteredLeagues
    : filteredLeagues.slice(0, 3);

  const totalTeams = leagues.reduce(
    (sum, league) =>
      sum +
      (league.leagueType === "personal"
        ? league.personalPlayers?.length || 0
        : league.teamsCount || league.teams?.length || 0),
    0
  );

  const totalMatches = leagues.reduce(
    (sum, league) => sum + (league.matches?.length || 0),
    0
  );

  if (loading) {
    return (
      <main dir="rtl" className={pageBg}>
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-400">טוען ליגות...</p>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className={pageBg}>
      <div className={pageGlow}>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/2 h-[420px] w-[760px] -translate-x-1/2 opacity-5">
          <div className="absolute bottom-0 h-full w-full rounded-t-[380px] border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-white" />
          <div className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-52 w-80 -translate-x-1/2 border-4 border-white" />
        </div>
      </div>

      <section className="relative z-10 mx-auto max-w-6xl">
        <div className={`${card} mb-5 p-6`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="mb-3 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black text-emerald-300">
                LeagueHub Leagues 🏆
              </span>

              <h1 className="text-3xl font-black md:text-4xl">
                כל הליגות במקום אחד
              </h1>

              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-gray-400">
                צפה בליגות פעילות, בדוק קבוצות ומשחקים, והיכנס לניהול מלא של
                הליגה.
              </p>
            </div>

            {currentUser?.role === "manager" ? (
              <Link href="/leagues/create" className={primaryButton}>
                + צור ליגה
              </Link>
            ) : !currentUser ? (
              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
              >
                🔒 התחבר כדי ליצור ליגה
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <LeagueStat value={leagues.length} title="ליגות במערכת" />
          <LeagueStat value={totalTeams} title="קבוצות / שחקנים" />
          <LeagueStat value={totalMatches} title="משחקים" />
        </div>

        <div className={`${softCard} mb-6 flex gap-2 overflow-x-auto p-2`}>
          <TabButton
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          >
            כל הליגות
          </TabButton>

          <TabButton
            active={activeTab === "teams"}
            onClick={() => setActiveTab("teams")}
          >
            ליגות קבוצתיות
          </TabButton>

          <TabButton
            active={activeTab === "personal"}
            onClick={() => setActiveTab("personal")}
          >
            ליגות אישיות
          </TabButton>
        </div>

        {filteredLeagues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur">
            <div className="mb-3 text-4xl">🏟️</div>
            <h2 className="text-xl font-black text-white">אין ליגות להצגה</h2>
            <p className="mt-2 text-sm font-bold text-gray-400">
              ברגע שתיווצר ליגה, היא תופיע כאן.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleLeagues.map((league, index) => {
                const leagueId = league.id || league._id;
                const isPersonal = league.leagueType === "personal";

                const card = (
                  <LeagueCard
                    league={league}
                    index={index}
                    isPersonal={isPersonal}
                    currentUser={currentUser}
                  />
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

            {!currentUser && filteredLeagues.length > 3 && (
              <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur">
                <p className="text-sm font-bold text-gray-400">
                  🔒 יש עוד ליגות זמינות. התחבר כדי לראות את כולן.
                </p>

                <Link
                  href="/login"
                  className="mt-4 inline-block rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
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

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-black transition ${
        active ? tabActive : tabInactive
      }`}
    >
      {children}
    </button>
  );
}

function LeagueStat({ value, title }) {
  return (
    <div className={`${softCard} p-5 text-center`}>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm font-bold text-gray-400">{title}</p>
    </div>
  );
}

function LeagueCard({ league, index, isPersonal, currentUser }) {
  const gradients = [
    "from-blue-600 to-blue-900",
    "from-emerald-600 to-emerald-900",
    "from-purple-600 to-purple-900",
    "from-orange-500 to-orange-800",
  ];

  const teamsOrPlayers = isPersonal
    ? league.personalPlayers?.length || 0
    : league.teamsCount || league.teams?.length || 0;

  return (
    <div
      className={`${softCard} group relative overflow-hidden transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09]`}
    >
      {!currentUser && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-black/45 backdrop-blur-sm">
          <div className="mb-2 text-3xl">🔒</div>
          <p className="text-sm font-black text-white">התחבר כדי להיכנס</p>
        </div>
      )}

      <div className={!currentUser ? "opacity-45" : ""}>
        <div
          className={`h-1.5 bg-gradient-to-r ${
            gradients[index % gradients.length]
          }`}
        />

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${
                gradients[index % gradients.length]
              } text-xl font-black text-white shadow-lg`}
            >
              {league.name?.charAt(0)}
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gray-300">
                {isPersonal ? "👤 ליגה אישית" : "🏆 ליגת קבוצות"}
              </span>

              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                {league.status}
              </span>
            </div>
          </div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-white">{league.name}</h2>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gray-300">
              {isPersonal ? "ליגה אישית" : "ליגת קבוצות"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gray-300">
              ⚽ {league.sport}
            </span>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gray-300">
              📍 {league.location}
            </span>
          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-400">
            {league.description || "ללא תיאור"}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.05] p-3 text-center">
              <p className="text-2xl font-black text-white">{teamsOrPlayers}</p>
              <p className="text-xs font-bold text-gray-400">
                {isPersonal ? "שחקנים" : "קבוצות"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.05] p-3 text-center">
              <p className="text-2xl font-black text-white">
                {league.matches?.length || 0}
              </p>
              <p className="text-xs font-bold text-gray-400">משחקים</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-emerald-400 px-4 py-3 text-center text-sm font-black text-slate-950 transition group-hover:bg-emerald-300">
            כניסה לליגה
          </div>
        </div>
      </div>
    </div>
  );
}
