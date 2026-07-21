"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function TeamPage() {
  const { id, teamName } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const decodedTeamName = decodeURIComponent(teamName);

  const [league, setLeague] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [removingPlayer, setRemovingPlayer] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

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

  const isOwner =
    league &&
    currentUser &&
    (String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) ===
        String(currentUser._id || currentUser.id));

  const handleRemovePlayer = async (player) => {
    const playerName = player.fullName || player.email;

    if (!player.email) {
      showToast("לא ניתן להסיר שחקן ללא כתובת אימייל", "error");
      return;
    }

    if (!window.confirm(`להסיר את ${playerName} מהקבוצה?`)) return;

    const playerKey = player.playerId || player.email;
    setRemovingPlayer(playerKey);

    try {
      const res = await fetch(`/api/leagues/${id}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          playerEmail: player.email,
          teamName: decodedTeamName,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בהסרת השחקן", "error");
        return;
      }

      const updatedTeam = data.teams?.find(
        (item) => item.name === decodedTeamName
      );
      setLeague(data);
      setTeam(updatedTeam || null);
      showToast(`${playerName} הוסר מהקבוצה`);
    } catch (error) {
      console.error("Failed to remove player:", error);
      showToast("שגיאה בהסרת השחקן", "error");
    } finally {
      setRemovingPlayer(null);
    }
  };

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

  const upcomingMatches = teamMatches.filter((match) => !match.isFinalApproved);

  const nextMatch =
    upcomingMatches.slice().sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dateA - dateB;
    })[0] || null;

  const recentForm = approvedMatches
    .slice(-5)
    .reverse()
    .map((match) => {
      const isHome = match.homeTeam === decodedTeamName;

      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      if (teamScore > opponentScore) return "W";
      if (teamScore < opponentScore) return "L";
      return "D";
    });

  const leaguePosition =
    league?.standings
      ?.slice()
      ?.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.goalDifference - a.goalDifference;
      })
      ?.findIndex((row) => row.team === decodedTeamName) + 1 || "-";

  const findTeamPlayerId = (playerName) => {
    const team = league?.teams?.find((team) => team.name === decodedTeamName);

    const foundPlayer = team?.players?.find(
      (player) =>
        player.fullName?.trim().toLowerCase() ===
        playerName?.trim().toLowerCase()
    );

    return foundPlayer?.playerId;
  };

  const teamTopScorer = useMemo(() => {
    const topPlayer =
      league?.topScorers
        ?.filter((player) => player.teamName === decodedTeamName)
        ?.sort((a, b) => Number(b.goals || 0) - Number(a.goals || 0))[0] ||
      null;

    if (!topPlayer) return null;

    return {
      ...topPlayer,
      playerId: topPlayer.playerId || findTeamPlayerId(topPlayer.playerName),
    };
  }, [league, decodedTeamName]);

  const teamTopAssist = useMemo(() => {
    const topPlayer =
      league?.topAssists
        ?.filter((player) => player.teamName === decodedTeamName)
        ?.sort((a, b) => Number(b.assists || 0) - Number(a.assists || 0))[0] ||
      null;

    if (!topPlayer) return null;

    return {
      ...topPlayer,
      playerId: topPlayer.playerId || findTeamPlayerId(topPlayer.playerName),
    };
  }, [league, decodedTeamName]);

  const teamTopMvp = useMemo(() => {
    const topPlayer =
      league?.topMvps
        ?.filter((player) => player.teamName === decodedTeamName)
        ?.sort((a, b) => Number(b.mvps || 0) - Number(a.mvps || 0))[0] || null;

    if (!topPlayer) return null;

    return {
      ...topPlayer,
      playerId: topPlayer.playerId || findTeamPlayerId(topPlayer.playerName),
    };
  }, [league, decodedTeamName]);

  const getPlayerStats = (player) => {
    const playerName = player.fullName || player.email;

    const goals =
      league?.topScorers?.find(
        (item) =>
          item.playerName === playerName && item.teamName === decodedTeamName
      )?.goals || 0;

    const assists =
      league?.topAssists?.find(
        (item) =>
          item.playerName === playerName && item.teamName === decodedTeamName
      )?.assists || 0;

    const mvpAwards =
      league?.topMvps?.find(
        (item) =>
          item.playerName === playerName && item.teamName === decodedTeamName
      )?.mvpAwards || 0;

    return {
      goals,
      assists,
      mvpAwards,
    };
  };

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
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#050b14] px-4 py-8 text-white"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/2 h-[420px] w-[760px] -translate-x-1/2 opacity-5">
          <div className="absolute bottom-0 h-full w-full rounded-t-[380px] border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-white" />
          <div className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-52 w-80 -translate-x-1/2 border-4 border-white" />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {toast && (
          <div
            role="status"
            className={`fixed right-6 top-24 z-50 rounded-2xl px-5 py-3 text-sm font-black shadow-2xl ${
              toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-emerald-400 text-slate-950"
            }`}
          >
            {toast.message}
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push(`/leagues/${id}`)}
          className="mb-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
        >
          חזרה לליגה
        </button>

        <section className="mb-5 rounded-[2rem] border border-white/25 bg-[#173326]/65 p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-400 text-3xl font-black text-slate-950 shadow-lg">
                {team.name?.charAt(0)}
              </div>

              <div>
                <p className="text-xs font-bold text-emerald-300">עמוד קבוצה</p>
                <h1 className="text-3xl font-black md:text-4xl">{team.name}</h1>

                {captain && (
                  <p className="mt-1 text-sm font-bold text-yellow-300">
                    👑 קפטן: {captain.fullName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <MiniStat title="מקום" value={`#${leaguePosition}`} />
              <MiniStat title="נק׳" value={standing?.points || 0} />
              <MiniStat title="נצ׳" value={standing?.wins || 0} />
              <MiniStat title="שחקנים" value={team.players?.length || 0} />
            </div>
          </div>
        </section>

        <div className="mb-5 flex gap-2 overflow-x-auto rounded-3xl border border-white/25 bg-[#173326]/65 p-2 backdrop-blur-md">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          >
            סקירה
          </TabButton>

          <TabButton
            active={activeTab === "players"}
            onClick={() => setActiveTab("players")}
          >
            שחקנים
          </TabButton>

          <TabButton
            active={activeTab === "matches"}
            onClick={() => setActiveTab("matches")}
          >
            משחקים
          </TabButton>

          <TabButton
            active={activeTab === "leaders"}
            onClick={() => setActiveTab("leaders")}
          >
            מובילים
          </TabButton>
        </div>

        {activeTab === "overview" && (
          <div className="grid gap-5 lg:grid-cols-3">
            <section className="rounded-[2rem] border border-white/25 bg-[#173326]/65 p-5 backdrop-blur-md lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">המשחק הבא</h2>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">
                  בקרוב
                </span>
              </div>

              {!nextMatch ? (
                <p className="py-10 text-center text-sm font-bold text-gray-400">
                  אין משחק קרוב
                </p>
              ) : (
                <div className="grid items-center gap-3 md:grid-cols-3">
                  <TeamBox label="בית" name={nextMatch.homeTeam} />
                  <div className="rounded-3xl bg-white p-5 text-center text-slate-950">
                    <p className="text-2xl font-black">VS</p>
                    <p className="mt-2 text-sm font-bold text-gray-500">
                      {nextMatch.date} | {nextMatch.time}
                    </p>
                    <p className="text-sm font-bold text-gray-500">
                      📍 {nextMatch.location}
                    </p>
                  </div>
                  <TeamBox label="חוץ" name={nextMatch.awayTeam} />
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/25 bg-[#173326]/65 p-5 backdrop-blur-md">
              <h2 className="mb-4 text-xl font-black">כושר אחרון</h2>

              {recentForm.length === 0 ? (
                <p className="text-sm font-bold text-gray-400">
                  אין משחקים אחרונים
                </p>
              ) : (
                <div className="flex gap-2">
                  {recentForm.map((result, index) => (
                    <span
                      key={index}
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white ${
                        result === "W"
                          ? "bg-green-500"
                          : result === "L"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-3 md:grid-cols-5 lg:col-span-3">
              <CompactStat title="משחקים" value={standing?.played || 0} />
              <CompactStat title="שערי זכות" value={standing?.goalsFor || 0} />
              <CompactStat
                title="שערי חובה"
                value={standing?.goalsAgainst || 0}
              />
              <CompactStat
                title="הפרש שערים"
                value={standing?.goalDifference || 0}
              />
              <CompactStat title="נקודות" value={standing?.points || 0} />
            </section>
          </div>
        )}

        {activeTab === "players" && (
          <section className="rounded-[2rem] border border-white/25 bg-[#173326]/65 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">סגל הקבוצה</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gray-300">
                {team.players?.length || 0} שחקנים
              </span>
            </div>

            <div className="space-y-2">
              {team.players?.map((player) => {
                const stats = getPlayerStats(player);

                return (
                  <div
                    key={player.playerId || player.email}
                    role="link"
                    tabIndex={0}
                    onClick={() =>
                      router.push(`/leagues/${id}/players/${player.playerId}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(
                          `/leagues/${id}/players/${player.playerId}`
                        );
                      }
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/20 bg-[#173326]/55 px-4 py-3 text-right backdrop-blur-sm transition hover:bg-[#173326]/75"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 font-black">
                        {player.fullName?.charAt(0) || "?"}
                      </div>

                      <div>
                        <p className="font-black">
                          {player.fullName || player.email}
                        </p>
                        <p className="text-xs font-bold text-gray-400">
                          {player.position || "ללא עמדה"} · #
                          {player.shirtNumber || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-black text-gray-300">
                        <span>⚽ {stats.goals}</span>
                        <span>🅰️ {stats.assists}</span>
                        <span>🏆 {stats.mvpAwards}</span>
                        {player.isCaptain && (
                          <span className="text-yellow-300">קפטן</span>
                        )}
                      </div>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemovePlayer(player);
                          }}
                          disabled={
                            removingPlayer ===
                            (player.playerId || player.email)
                          }
                          className="rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {removingPlayer ===
                          (player.playerId || player.email)
                            ? "מסיר..."
                            : "הסרה מהקבוצה"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "matches" && (
          <section className="rounded-[2rem] border border-white/25 bg-[#173326]/65 p-5 backdrop-blur-md">
            <h2 className="mb-4 text-xl font-black">משחקים אחרונים</h2>

            {approvedMatches.length === 0 ? (
              <p className="text-sm font-bold text-gray-400">
                אין עדיין משחקים מאושרים
              </p>
            ) : (
              <div className="space-y-2">
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
                      className="cursor-pointer rounded-2xl border border-white/20 bg-[#173326]/55 px-4 py-3 backdrop-blur-sm transition hover:bg-[#173326]/75"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-black">
                          {match.homeTeam}{" "}
                          <span className="text-emerald-300">
                            {match.homeScore} - {match.awayScore}
                          </span>{" "}
                          {match.awayTeam}
                        </p>
                        <span className="text-xs font-bold text-gray-400">
                          {match.date}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "leaders" && (
          <section className="grid gap-4 md:grid-cols-3">
            <LeaderCard
              leagueId={id}
              icon="⚽"
              title="מלך השערים"
              playerName={teamTopScorer?.playerName}
              playerId={teamTopScorer?.playerId}
              value={teamTopScorer?.goals}
              label="שערים"
            />

            <LeaderCard
              leagueId={id}
              icon="🅰️"
              title="מלך הבישולים"
              playerName={teamTopAssist?.playerName}
              playerId={teamTopAssist?.playerId}
              value={teamTopAssist?.assists}
              label="בישולים"
            />

            <LeaderCard
              leagueId={id}
              icon="🏆"
              title="שיאן MVP"
              playerName={teamTopMvp?.playerName}
              playerId={teamTopMvp?.playerId}
              value={teamTopMvp?.mvps}
              label="MVP"
            />
          </section>
        )}
      </div>
    </main>
  );
}

function LeaderCard({
  leagueId,
  icon,
  title,
  playerName,
  playerId,
  value,
  label,
}) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/25 bg-[#173326]/65 p-6 text-white shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-[#173326]/75 hover:shadow-2xl">
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-lg font-black">{title}</p>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur">
            {icon}
          </div>
        </div>

        {playerName ? (
          <>
            {playerId ? (
              <Link
                href={`/leagues/${leagueId}/players/${playerId}`}
                className="inline-block text-3xl font-black transition hover:text-emerald-300 hover:underline"
              >
                {playerName}
              </Link>
            ) : (
              <p className="text-3xl font-black">{playerName}</p>
            )}

            <div className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
              {value || 0} {label}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-300">אין עדיין נתונים</p>
        )}
      </div>
    </div>
  );
}

function MiniStat({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-[#173326]/55 px-4 py-3 text-center backdrop-blur-sm">
      <p className="text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold text-gray-400">{title}</p>
    </div>
  );
}

function CompactStat({ title, value }) {
  return (
    <div className="rounded-3xl border border-white/25 bg-[#173326]/65 p-4 backdrop-blur-md">
      <p className="text-xs font-bold text-gray-400">{title}</p>
      <p className="mt-2 text-3xl font-black text-emerald-300">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-2 text-sm font-black transition ${
        active
          ? "bg-emerald-400 text-slate-950"
          : "text-gray-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function TeamBox({ label, name }) {
  return (
    <div className="rounded-3xl border border-white/25 bg-[#173326]/65 p-5 text-center backdrop-blur-md">
      <p className="text-xs font-bold text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{name}</p>
    </div>
  );
}
