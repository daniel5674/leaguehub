"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TeamPage() {
  const { id, teamName } = useParams();
  const router = useRouter();

  const decodedTeamName = decodeURIComponent(teamName);

  const [league, setLeague] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLeague = async () => {
    try {
      const res = await fetch(`/api/leagues/${id}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const foundTeam = data.teams?.find(
        (item) => item.name === decodedTeamName
      );

      setLeague(data);
      setTeam(foundTeam || null);
    } catch (error) {
      console.error("Failed to fetch team:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !teamName) return;
    fetchLeague();
  }, [id, teamName]);

  const standing = useMemo(() => {
    return league?.standings?.find((row) => row.team === decodedTeamName);
  }, [league, decodedTeamName]);

  const captain = team?.players?.find((player) => player.isCaptain);

  const teamMatches = useMemo(() => {
    return (
      league?.matches?.filter(
        (match) =>
          match.homeTeam === decodedTeamName ||
          match.awayTeam === decodedTeamName
      ) || []
    );
  }, [league, decodedTeamName]);

  const approvedMatches = teamMatches.filter((match) => match.isFinalApproved);

  const teamTopScorer = useMemo(() => {
    return (
      league?.topScorers
        ?.filter((player) => player.teamName === decodedTeamName)
        ?.sort((a, b) => Number(b.goals || 0) - Number(a.goals || 0))[0] || null
    );
  }, [league, decodedTeamName]);

  const teamTopAssist = useMemo(() => {
    return (
      league?.topAssists
        ?.filter((player) => player.teamName === decodedTeamName)
        ?.sort((a, b) => Number(b.assists || 0) - Number(a.assists || 0))[0] ||
      null
    );
  }, [league, decodedTeamName]);

  const teamTopMvp = useMemo(() => {
    return (
      league?.topMvps
        ?.filter((player) => player.teamName === decodedTeamName)
        ?.sort((a, b) => Number(b.mvps || 0) - Number(a.mvps || 0))[0] || null
    );
  }, [league, decodedTeamName]);

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-100 px-6 py-10">
        <p className="text-gray-500">טוען עמוד קבוצה...</p>
      </main>
    );
  }

  if (!team) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-100 px-6 py-10">
        <p className="text-red-500">הקבוצה לא נמצאה</p>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push(`/leagues/${id}`)}
          className="mb-6 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm"
        >
          חזרה לליגה
        </button>

        <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-8 text-white shadow-2xl">
          <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl font-black text-slate-950 shadow-xl">
                {team.name?.charAt(0)}
              </div>

              <div>
                <span className="mb-3 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-gray-200 backdrop-blur">
                  עמוד קבוצה
                </span>

                <h1 className="text-5xl font-black">{team.name}</h1>

                {captain && (
                  <p className="mt-3 text-lg font-bold text-yellow-300">
                    👑 קפטן: {captain.fullName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <HeroStat title="שחקנים" value={team.players?.length || 0} />
              <HeroStat title="נקודות" value={standing?.points || 0} />
              <HeroStat title="ניצחונות" value={standing?.wins || 0} />
              <HeroStat
                title="הפרש שערים"
                value={standing?.goalDifference || 0}
              />
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard title="משחקים" value={standing?.played || 0} />
          <StatCard title="ניצחונות" value={standing?.wins || 0} />
          <StatCard title="תיקו" value={standing?.draws || 0} />
          <StatCard title="הפסדים" value={standing?.losses || 0} />
          <StatCard title="שערי זכות" value={standing?.goalsFor || 0} />
          <StatCard title="שערי חובה" value={standing?.goalsAgainst || 0} />
          <StatCard title="הפרש שערים" value={standing?.goalDifference || 0} />
          <StatCard title="נקודות" value={standing?.points || 0} />
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <LeaderCard
            icon="⚽"
            title="מלך השערים"
            playerName={teamTopScorer?.playerName}
            value={teamTopScorer?.goals}
            label="שערים"
          />

          <LeaderCard
            icon="🅰️"
            title="מלך הבישולים"
            playerName={teamTopAssist?.playerName}
            value={teamTopAssist?.assists}
            label="בישולים"
          />

          <LeaderCard
            icon="🏆"
            title="שיאן MVP"
            playerName={teamTopMvp?.playerName}
            value={teamTopMvp?.mvps}
            label="MVP"
          />
        </section>

        <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900">סגל הקבוצה</h2>
            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600">
              {team.players?.length || 0} שחקנים
            </span>
          </div>

          {!team.players || team.players.length === 0 ? (
            <p className="text-gray-500">אין שחקנים בקבוצה</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {team.players.map((player) => (
                <button
                  key={player.playerId || player.email}
                  type="button"
                  onClick={() =>
                    router.push(`/leagues/${id}/players/${player.playerId}`)
                  }
                  className="group relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-5 text-right shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-200/60 blur-2xl transition group-hover:bg-emerald-300/80" />
                  <div className="absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-blue-200/60 blur-2xl transition group-hover:bg-blue-300/80" />

                  <div className="relative">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-slate-700 text-xl font-black text-white shadow-lg">
                          {player.fullName?.charAt(0) || "?"}
                        </div>

                        <div>
                          <p className="text-lg font-black text-gray-900">
                            {player.fullName || player.email}
                          </p>

                          <p className="text-xs font-bold text-gray-400">
                            שחקן סגל
                          </p>
                        </div>
                      </div>

                      {player.isCaptain && (
                        <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black shadow-sm">
                          👑 קפטן
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
                        <p className="text-xs font-bold text-gray-400">
                          מספר חולצה
                        </p>
                        <p className="mt-1 text-lg font-black text-gray-900">
                          {player.shirtNumber || "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 px-3 py-3 text-center">
                        <p className="text-xs font-bold text-gray-400">עמדה</p>
                        <p className="mt-1 text-lg font-black text-gray-900">
                          {player.position || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-black text-gray-900">
            משחקים אחרונים
          </h2>

          {approvedMatches.length === 0 ? (
            <p className="text-gray-500">אין עדיין משחקים מאושרים לקבוצה</p>
          ) : (
            <div className="space-y-3">
              {approvedMatches
                .slice(-5)
                .reverse()
                .map((match) => (
                  <div
                    key={match._id || match.id}
                    onClick={() =>
                      router.push(
                        `/leagues/${id}/matches/${match._id || match.id}`
                      )
                    }
                    className="group cursor-pointer overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="h-2 bg-gradient-to-r from-slate-950 via-emerald-700 to-slate-950" />

                    <div className="p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                          הסתיים
                        </span>

                        <span className="text-xs font-bold text-gray-400">
                          {match.date}
                        </span>
                      </div>

                      <div className="grid items-center gap-4 md:grid-cols-3">
                        <div className="text-center">
                          <p className="text-lg font-black text-gray-900">
                            {match.homeTeam}
                          </p>
                        </div>

                        <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-700 px-6 py-4 text-center text-white shadow-lg">
                          <p className="text-3xl font-black">
                            {match.homeScore} - {match.awayScore}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-black text-gray-900">
                            {match.awayTeam}
                          </p>
                        </div>
                      </div>

                      {match.mvpPlayerName && (
                        <div className="mt-4 flex items-center justify-center">
                          <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-yellow-700">
                            ⭐ MVP: {match.mvpPlayerName}
                          </span>
                        </div>
                      )}

                      <div className="mt-4 text-center text-sm font-bold text-blue-600 opacity-0 transition group-hover:opacity-100">
                        לחץ לצפייה בפרטי המשחק →
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/60 bg-white p-6 text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-200/50 blur-2xl transition group-hover:bg-emerald-300/70" />
      <div className="absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-blue-200/50 blur-2xl transition group-hover:bg-blue-300/70" />

      <div className="relative">
        <p className="text-5xl font-black text-slate-950">{value}</p>
        <p className="mt-3 text-sm font-black text-gray-500">{title}</p>
      </div>
    </div>
  );
}

function LeaderCard({ icon, title, playerName, value, label }) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl transition group-hover:bg-emerald-400/30" />
      <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-blue-500/20 blur-2xl transition group-hover:bg-blue-500/30" />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-300">מוביל קבוצה</p>
            <p className="text-xl font-black">{title}</p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-lg">
            {icon}
          </div>
        </div>

        {playerName ? (
          <>
            <p className="text-3xl font-black">{playerName}</p>

            <div className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-gray-100 backdrop-blur">
              {value || 0} {label}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-gray-300">
            אין עדיין נתונים
          </div>
        )}
      </div>
    </div>
  );
}

function HeroStat({ title, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold text-gray-300">{title}</p>
    </div>
  );
}
