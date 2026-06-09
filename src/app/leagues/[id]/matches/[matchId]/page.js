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
    <main dir="rtl" className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm"
        >
          חזרה
        </button>
        <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-8 text-white shadow-2xl">
          <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <div className="mb-8 flex items-center justify-between">
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-gray-200 backdrop-blur">
                פרטי משחק
              </span>

              <span
                className={`rounded-full px-4 py-2 text-sm font-black ${
                  match.isFinalApproved
                    ? "bg-green-400 text-black"
                    : "bg-yellow-400 text-black"
                }`}
              >
                {match.isFinalApproved ? "תוצאה סופית" : "ממתין לאישור"}
              </span>
            </div>

            <div className="grid items-center gap-6 md:grid-cols-3">
              <div className="rounded-3xl bg-white/10 p-6 text-center backdrop-blur">
                <p className="mb-2 text-sm font-bold text-gray-300">בית</p>
                <h1 className="text-3xl font-black">{match.homeTeam}</h1>
              </div>

              <div className="rounded-[2rem] bg-white p-8 text-center text-black shadow-2xl">
                <p className="text-6xl font-black tracking-tight">
                  {match.homeScore ?? "-"} - {match.awayScore ?? "-"}
                </p>
                <p className="mt-3 text-sm font-bold text-gray-500">
                  תוצאת המשחק
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 p-6 text-center backdrop-blur">
                <p className="mb-2 text-sm font-bold text-gray-300">חוץ</p>
                <h1 className="text-3xl font-black">{match.awayTeam}</h1>
              </div>
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
                    ?.find(
                      (player) => player.playerName === match.mvpPlayerName
                    );

                  if (mvpPlayer?.playerId) {
                    router.push(`/leagues/${id}/players/${mvpPlayer.playerId}`);
                  }
                }}
                className="mx-auto mt-8 block rounded-3xl bg-yellow-400 px-8 py-4 text-center text-lg font-black text-black shadow-lg transition hover:-translate-y-1 hover:bg-yellow-300"
              >
                ⭐ MVP המשחק: {match.mvpPlayerName}
              </button>
            )}
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <InfoCard title="תאריך" value={match.date || "לא הוגדר"} />
          <InfoCard title="שעה" value={match.time || "לא הוגדרה"} />
          <InfoCard title="מיקום" value={match.location || "לא הוגדר"} />
        </section>

        <section className="grid gap-6 md:grid-cols-2">
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
    <div className="rounded-3xl border border-gray-200 bg-white p-5 text-center shadow-sm">
      <p className="text-sm font-bold text-gray-500">{title}</p>
      <p className="mt-2 text-xl font-black text-gray-900">{value}</p>
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
    <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between bg-gradient-to-l from-gray-950 to-gray-800 px-6 py-5 text-white">
        <h2 className="text-xl font-black">{title}</h2>
        <span className="text-3xl">{icon}</span>
      </div>

      <div className="p-5">
        {!items || items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-sm font-bold text-gray-500">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
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
                      className="text-right font-black text-gray-900 transition hover:text-blue-600 hover:underline"
                    >
                      {item.playerName}
                    </button>
                  ) : (
                    <p className="font-black text-gray-900">
                      {item.playerName}
                    </p>
                  )}

                  <p className="mt-1 text-sm font-bold text-gray-500">
                    {item.teamName}
                    {showMinute && item.minute ? ` | דקה ${item.minute}` : ""}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
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
