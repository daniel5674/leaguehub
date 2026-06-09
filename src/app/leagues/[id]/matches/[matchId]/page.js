"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function MatchDetailsPage() {
  const { id, matchId } = useParams();
  const router = useRouter();

  const [league, setLeague] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const approvedReport = match?.captainReports?.[0];

  const matchScorers = approvedReport?.scorers || [];
  const matchAssists = approvedReport?.assists || [];
  const matchBlueCards = match?.blueCards || approvedReport?.blueCards || [];

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

      const foundMatch = data.matches?.find(
        (item) => String(item._id || item.id) === String(matchId)
      );

      setLeague(data);
      setMatch(foundMatch || null);
    } catch (error) {
      console.error("Failed to fetch match:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !matchId) return;
    fetchLeague();
  }, [id, matchId]);

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-100 px-6 py-10">
        <p className="text-gray-500">טוען פרטי משחק...</p>
      </main>
    );
  }

  if (!match) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-100 px-6 py-10">
        <p className="text-red-500">המשחק לא נמצא</p>
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

      <div className="relative z-10 mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
        >
          חזרה
        </button>

        <section className="mb-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-gray-200">
              פרטי משחק
            </span>

            <span
              className={`rounded-full px-4 py-2 text-xs font-black ${
                match.isFinalApproved
                  ? "bg-emerald-400 text-slate-950"
                  : "bg-yellow-400 text-slate-950"
              }`}
            >
              {match.isFinalApproved ? "תוצאה סופית" : "ממתין לאישור"}
            </span>
          </div>

          <div className="grid items-center gap-3 md:grid-cols-3">
            <MatchTeamBox label="בית" name={match.homeTeam} />

            <div className="rounded-3xl bg-white p-5 text-center text-slate-950 shadow-xl">
              <p className="text-5xl font-black tracking-tight">
                {match.homeScore ?? "-"} - {match.awayScore ?? "-"}
              </p>
              <p className="mt-2 text-xs font-bold text-gray-500">
                תוצאת המשחק
              </p>
            </div>

            <MatchTeamBox label="חוץ" name={match.awayTeam} />
          </div>

          {match.mvpPlayerName && (
            <button
              type="button"
              onClick={() => {
                const mvpPlayer = match.captainReports
                  ?.flatMap((report) => [
                    ...(report.scorers || []),
                    ...(report.assists || []),
                    ...(report.blueCards || []),
                  ])
                  ?.find((player) => player.playerName === match.mvpPlayerName);

                if (mvpPlayer?.playerId) {
                  router.push(`/leagues/${id}/players/${mvpPlayer.playerId}`);
                }
              }}
              className="mx-auto mt-5 flex items-center justify-center rounded-2xl bg-yellow-400/95 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-300"
            >
              ⭐ MVP המשחק: {match.mvpPlayerName}
            </button>
          )}
        </section>

        <section className="mb-5 grid gap-3 md:grid-cols-3">
          <InfoCard title="תאריך" value={match.date || "לא הוגדר"} />
          <InfoCard title="שעה" value={match.time || "לא הוגדרה"} />
          <InfoCard title="מיקום" value={match.location || "לא הוגדר"} />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <MatchListCard
            title="כובשי שערים"
            emptyText="אין כובשים במשחק"
            items={matchScorers}
            icon="⚽"
            leagueId={id}
            router={router}
          />

          <MatchListCard
            title="מבשלי שערים"
            emptyText="אין מבשלים במשחק"
            items={matchAssists}
            icon="🅰️"
            leagueId={id}
            router={router}
          />

          <MatchListCard
            title="כרטיסים כחולים"
            emptyText="אין כרטיסים כחולים במשחק"
            items={matchBlueCards}
            icon="🔵"
            showMinute
            leagueId={id}
            router={router}
          />
        </section>
      </div>
    </main>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center shadow-sm backdrop-blur">
      <p className="text-xs font-bold text-gray-400">{title}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function MatchTeamBox({ label, name }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-center backdrop-blur">
      <p className="text-xs font-bold text-gray-400">{label}</p>
      <h1 className="mt-2 text-2xl font-black text-white">{name}</h1>
    </div>
  );
}

function MatchListCard({
  title,
  items,
  emptyText,
  icon,
  showMinute,
  leagueId,
  router,
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-lg backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-black text-white">{title}</h2>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="p-4">
        {!items || items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-5 text-center">
            <p className="text-sm font-bold text-gray-400">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 transition hover:bg-white/[0.09]"
              >
                <div>
                  {item.playerId ? (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/leagues/${leagueId}/players/${item.playerId}`
                        )
                      }
                      className="text-right font-black text-white transition hover:text-emerald-300 hover:underline"
                    >
                      {item.playerName}
                    </button>
                  ) : (
                    <p className="font-black text-white">{item.playerName}</p>
                  )}

                  <p className="mt-1 text-xs font-bold text-gray-400">
                    {item.teamName}
                    {showMinute && item.minute ? ` | דקה ${item.minute}` : ""}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  {icon}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
