"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const RATING_COLORS = {
  A: "bg-emerald-400/20 text-emerald-300",
  B: "bg-blue-400/20 text-blue-300",
  C: "bg-amber-400/20 text-amber-300",
  D: "bg-gray-400/20 text-gray-400",
};

const TEAM_COLORS = [
  "from-emerald-600 to-emerald-800",
  "from-blue-600 to-blue-800",
  "from-violet-600 to-violet-800",
  "from-rose-600 to-rose-800",
  "from-amber-600 to-amber-800",
  "from-cyan-600 to-cyan-800",
];

function formatMatchDate(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split(/[-/]/);
    if (parts.length < 3) return dateStr;
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    return d.toLocaleDateString("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return dateStr;
  }
}

export default function MatchDayPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [league, setLeague] = useState(null);
  const [todayPlayers, setTodayPlayers] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [dailyCap, setDailyCap] = useState("");
  const [teamsCount, setTeamsCount] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/leagues/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setLeague(data));
  }, [id]);

  const isOwner =
    league &&
    currentUser &&
    (String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser._id || currentUser.id));

  const nextMatch = (() => {
    if (!league?.matches?.length) return null;
    const unplayed = league.matches.filter(
      (m) => !m.isApprovedByManager && m.score === "טרם נקבע"
    );
    return unplayed[0] || league.matches[league.matches.length - 1];
  })();

  const roster = (league?.personalPlayers || []).filter(
    (p) =>
      !todayPlayers.some((t) => t._id === p._id) &&
      !waitingList.some((w) => w._id === p._id)
  );

  const selectPlayer = (player) => {
    const cap = Number(dailyCap);
    if (cap && todayPlayers.length >= cap) {
      setWaitingList((prev) => [...prev, player]);
    } else {
      setTodayPlayers((prev) => [...prev, player]);
    }
  };

  const unselectPlayer = (playerId) => {
    const newToday = todayPlayers.filter((p) => p._id !== playerId);
    if (waitingList.length > 0) {
      const [first, ...rest] = waitingList;
      setTodayPlayers([...newToday, first]);
      setWaitingList(rest);
    } else {
      setTodayPlayers(newToday);
    }
  };

  const removeFromWaiting = (playerId) => {
    setWaitingList((prev) => prev.filter((p) => p._id !== playerId));
  };

  const handleGenerateTeams = async () => {
    if (todayPlayers.length < 2) {
      showToast("צריך לפחות 2 שחקנים ברשימת המשחק", "error");
      return;
    }
    setGenerating(true);
    const res = await fetch(`/api/leagues/${id}/generate-teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ players: todayPlayers, teamsCount }),
    });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) {
      setLeague(data);
      showToast("הכוחות נוצרו בהצלחה!");
    } else {
      showToast(data.message || "שגיאה", "error");
    }
  };

  if (!league) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060e1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  const allPlayers = league.personalPlayers || [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060e1a]" dir="rtl">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-0 right-0 h-1/3">
          <div className="absolute inset-0 bg-gradient-to-t from-green-900/25 to-transparent" />
          <svg className="absolute inset-0 h-full w-full opacity-8" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice">
            <line x1="400" y1="0" x2="400" y2="300" stroke="white" strokeWidth="1.5" />
            <ellipse cx="400" cy="300" rx="140" ry="80" fill="none" stroke="white" strokeWidth="1.5" />
            <rect x="270" y="180" width="260" height="120" fill="none" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(100,200,100,0.05) 0%, transparent 60%)" }} />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-6 z-50 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg ${toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-5">
          <button
            type="button"
            onClick={() => router.push(`/leagues/${id}`)}
            className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10"
          >
            ← חזרה
          </button>
          <div>
            <h1 className="text-xl font-black text-white">{league.name}</h1>
            <p className="text-xs text-white/40">⚽ יום משחק</p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* Next match info */}
        {nextMatch && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">המשחק הקרוב</p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-xs text-white/40">תאריך</p>
                  <p className="font-bold text-white">{formatMatchDate(nextMatch.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🕐</span>
                <div>
                  <p className="text-xs text-white/40">שעה</p>
                  <p className="font-bold text-white">{nextMatch.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-xs text-white/40">מיקום</p>
                  <p className="font-bold text-white">{nextMatch.location}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily cap */}
        {isOwner && (
          <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
            <span className="text-sm font-semibold text-white/70">כמה שחקנים משחקים היום?</span>
            <input
              type="number"
              min="2"
              max="50"
              value={dailyCap}
              onChange={(e) => setDailyCap(e.target.value)}
              placeholder="ללא מגבלה"
              className="w-28 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-center text-sm font-bold text-white outline-none placeholder-white/30 focus:border-emerald-400"
            />
            {dailyCap ? (
              <span className="text-sm text-white/40">
                נבחרו {todayPlayers.length}/{dailyCap}
                {waitingList.length > 0 && ` · ${waitingList.length} ממתינים`}
              </span>
            ) : todayPlayers.length > 0 ? (
              <span className="text-sm text-white/40">נבחרו {todayPlayers.length}</span>
            ) : null}
          </div>
        )}

        {/* Three-column: roster | today | waiting */}
        <div className={`grid gap-4 ${waitingList.length > 0 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {/* Roster — click to add */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-white/80">כל השחקנים</h2>
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm font-bold text-white/60">
                {roster.length}
              </span>
            </div>

            {allPlayers.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/30">
                אין שחקנים רשומים. הוסף שחקנים בעמוד הניהול.
              </p>
            ) : roster.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/30">כל השחקנים נבחרו</p>
            ) : (
              <div className="space-y-2">
                {roster.map((player) => (
                  <button
                    key={player._id}
                    type="button"
                    onClick={() => isOwner && selectPlayer(player)}
                    className={`flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-right transition ${
                      isOwner ? "hover:border-emerald-500/40 hover:bg-emerald-500/10 cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
                        {player.fullName?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white">{player.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${RATING_COLORS[player.rating] || RATING_COLORS.D}`}>
                        {player.rating}
                      </span>
                      {isOwner && <span className="text-xs text-white/30">+</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Today's squad */}
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-emerald-300">משחק היום</h2>
              <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-sm font-bold text-emerald-300">
                {todayPlayers.length}
                {dailyCap ? `/${dailyCap}` : ""}
              </span>
            </div>

            {todayPlayers.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-white/30">לחץ על שחקן ברשימה כדי להוסיף</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayPlayers.map((player) => (
                  <div
                    key={player._id}
                    className="flex items-center justify-between rounded-2xl border border-emerald-500/10 bg-emerald-500/10 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                        {player.fullName?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white">{player.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${RATING_COLORS[player.rating] || RATING_COLORS.D}`}>
                        {player.rating}
                      </span>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => unselectPlayer(player._id)}
                          className="rounded-lg p-1 text-white/30 transition hover:text-red-400"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waiting (ממתינים) — shown only when there are waiting players */}
          {waitingList.length > 0 && (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-amber-300">ממתינים</h2>
                <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-sm font-bold text-amber-300">
                  {waitingList.length}
                </span>
              </div>
              <p className="mb-3 text-xs text-amber-500/70">
                אם מישהו מהמשחק מבטל, הממתין הראשון עולה אוטומטית
              </p>
              <div className="space-y-2">
                {waitingList.map((player, index) => (
                  <div
                    key={player._id}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-white">{player.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${RATING_COLORS[player.rating] || RATING_COLORS.D}`}>
                        {player.rating}
                      </span>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => removeFromWaiting(player._id)}
                          className="rounded-lg p-1 text-white/30 transition hover:text-red-400"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Generate teams */}
        {isOwner && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-white">צור קבוצות מאוזנות</h2>
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/50">כמה קבוצות?</label>
                <select
                  value={teamsCount}
                  onChange={(e) => setTeamsCount(Number(e.target.value))}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-bold text-white outline-none"
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n} className="bg-gray-900">{n}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateTeams}
              disabled={generating || todayPlayers.length < 2}
              className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-40"
            >
              {generating ? "יוצר קבוצות..." : `⚽ צור קבוצות (${todayPlayers.length} שחקנים)`}
            </button>
            {todayPlayers.length < 2 && (
              <p className="mt-2 text-center text-xs text-white/30">
                בחר לפחות 2 שחקנים מהרשימה
              </p>
            )}
          </div>
        )}

        {/* Generated teams */}
        {league.generatedTeams?.length > 0 && (
          <div>
            <h2 className="mb-4 text-center text-lg font-black text-white">הכוחות האחרונים</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {league.generatedTeams.map((team, ti) => (
                <div key={team._id || team.name} className={`rounded-3xl bg-gradient-to-br p-5 shadow-lg ${TEAM_COLORS[ti % TEAM_COLORS.length]}`}>
                  <h3 className="mb-4 text-center text-lg font-black text-white">{team.name}</h3>
                  <div className="space-y-2">
                    {team.players.map((player, pi) => (
                      <div key={`${player.fullName}-${pi}`} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2">
                        <span className="text-sm font-medium text-white">{player.fullName}</span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">{player.rating}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
