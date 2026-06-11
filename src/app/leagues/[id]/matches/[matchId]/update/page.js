"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/ui/Toast";
import {
  card,
  input,
  pageBg,
  pageGlow,
  primaryButton,
  secondaryButton,
} from "@/lib/uiStyles";

export default function UpdateMatchPage() {
  const { id, matchId } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [league, setLeague] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [scoreForm, setScoreForm] = useState({
    homeScore: "",
    awayScore: "",
  });

  const [goalForms, setGoalForms] = useState([
    { playerId: "", playerName: "", teamName: "", goals: "" },
  ]);

  const [assistForms, setAssistForms] = useState([
    { playerId: "", playerName: "", teamName: "", assists: "" },
  ]);

  const [blueCardForm, setBlueCardForm] = useState({
    playerId: "",
    playerName: "",
    teamName: "",
    minute: "",
  });

  const [mvpPlayer, setMvpPlayer] = useState({
    playerId: "",
    playerName: "",
  });

  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const fetchLeague = async () => {
    try {
      const res = await fetch(`/api/leagues/${id}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בטעינת הליגה", "error");
        return;
      }

      const currentMatch = data.matches?.find(
        (item) => String(item._id || item.id) === String(matchId)
      );

      setLeague(data);
      setMatch(currentMatch || null);
    } catch (error) {
      console.error("Fetch league failed:", error);
      showToast("שגיאה בטעינת המשחק", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !matchId) return;
    fetchLeague();
  }, [id, matchId]);

  const allPlayers =
    league?.teams?.flatMap((team) =>
      (team.players || []).map((player) => ({
        ...player,
        teamName: team.name,
      }))
    ) || [];

  const currentUserId = currentUser?._id || currentUser?.id;

  const homeTeamData = league?.teams?.find(
    (team) => team.name === match?.homeTeam
  );

  const awayTeamData = league?.teams?.find(
    (team) => team.name === match?.awayTeam
  );

  const isHomeCaptain = homeTeamData?.players?.some(
    (player) =>
      player.isCaptain &&
      (String(player.playerId) === String(currentUserId) ||
        player.email?.trim().toLowerCase() ===
          currentUser?.email?.trim().toLowerCase())
  );

  const isAwayCaptain = awayTeamData?.players?.some(
    (player) =>
      player.isCaptain &&
      (String(player.playerId) === String(currentUserId) ||
        player.email?.trim().toLowerCase() ===
          currentUser?.email?.trim().toLowerCase())
  );

  const captainTeamName = isHomeCaptain ? match?.homeTeam : match?.awayTeam;

  const addGoalRow = () => {
    setGoalForms((prev) => [
      ...prev,
      { playerId: "", playerName: "", teamName: "", goals: "" },
    ]);
  };

  const addAssistRow = () => {
    setAssistForms((prev) => [
      ...prev,
      { playerId: "", playerName: "", teamName: "", assists: "" },
    ]);
  };

  const removeGoalRow = (index) => {
    setGoalForms((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAssistRow = (index) => {
    setAssistForms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddBlueCard = async () => {
    if (!blueCardForm.playerId) {
      showToast("צריך לבחור שחקן לכרטיס כחול", "error");
      return;
    }

    const res = await fetch(`/api/leagues/${id}/matches`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "ADD_BLUE_CARD",
        matchId,
        playerId: blueCardForm.playerId,
        playerName: blueCardForm.playerName,
        teamName: blueCardForm.teamName,
        minute: blueCardForm.minute ? Number(blueCardForm.minute) : null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "שגיאה בהוספת כרטיס כחול", "error");
      return;
    }

    setLeague(data);

    const updatedMatch = data.matches?.find(
      (item) => String(item._id || item.id) === String(matchId)
    );

    setMatch(updatedMatch);

    setBlueCardForm({
      playerId: "",
      playerName: "",
      teamName: "",
      minute: "",
    });

    showToast("כרטיס כחול נוסף");
  };

  const handleSubmitReport = async () => {
    if (scoreForm.homeScore === "" || scoreForm.awayScore === "") {
      showToast("צריך למלא תוצאה", "error");
      return;
    }

    try {
      setSubmitting(true);

      const cleanScorers = goalForms
        .filter((goal) => goal.playerName && goal.teamName && goal.goals !== "")
        .map((goal) => ({
          playerId: goal.playerId,
          playerName: goal.playerName,
          teamName: goal.teamName,
          goals: Number(goal.goals),
        }));

      const cleanAssists = assistForms
        .filter(
          (assist) =>
            assist.playerName && assist.teamName && assist.assists !== ""
        )
        .map((assist) => ({
          playerId: assist.playerId,
          playerName: assist.playerName,
          teamName: assist.teamName,
          assists: Number(assist.assists),
        }));

      console.log("GOALS:", cleanScorers);
      console.log("ASSISTS:", cleanAssists);

      const res = await fetch(`/api/leagues/${id}/matches`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "SUBMIT_MATCH_REPORT",
          matchId,
          homeScore: Number(scoreForm.homeScore),
          awayScore: Number(scoreForm.awayScore),
          captainUserId:
            currentUser?._id || currentUser?.id || currentUser?.email,
          captainName:
            currentUser?.fullName || currentUser?.name || currentUser?.email,
          teamName: captainTeamName,

          scorers: cleanScorers,
          assists: cleanAssists,
          mvpPlayerId: mvpPlayer.playerId,
          mvpPlayerName: mvpPlayer.playerName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בשליחת דיווח", "error");
        return;
      }

      showToast("הדיווח נשלח בהצלחה");

      router.refresh();

      setTimeout(() => {
        router.push(`/leagues/${id}`);
      }, 300);
    } catch (error) {
      console.error("Submit report failed:", error);
      showToast("שגיאה בשליחת דיווח", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main dir="rtl" className={pageBg}>
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="text-gray-400">טוען משחק...</p>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main dir="rtl" className={pageBg}>
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="text-red-300">המשחק לא נמצא</p>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className={pageBg}>
      <div className={pageGlow}>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push(`/leagues/${id}`)}
          className={`${secondaryButton} mb-6`}
        >
          ← חזרה לליגה
        </button>

        <section className={`${card} p-5 md:p-8`}>
          <div className="mb-8 text-center">
            <span className="inline-flex rounded-full bg-emerald-400/15 px-4 py-2 text-xs font-black text-emerald-300">
              דיווח קפטן
            </span>
            <h1 className="mt-3 text-3xl font-black text-white">
              דיווח תוצאת משחק
            </h1>
          </div>

          <div className="mb-8 flex flex-col items-center justify-between gap-4 text-center md:flex-row">
            <h2 className="flex-1 text-2xl font-black text-white">
              {match.homeTeam}
            </h2>

            <div className="rounded-3xl border border-emerald-400/20 bg-slate-950/70 px-8 py-5 text-white shadow-lg shadow-emerald-950/30">
              <div className="text-4xl font-black text-emerald-300">- : -</div>
              <div className="mt-1 text-sm text-gray-400">ממתין לדיווח</div>
            </div>

            <h2 className="flex-1 text-2xl font-black text-white">
              {match.awayTeam}
            </h2>
          </div>

          <div className="mb-8 grid gap-3 md:grid-cols-3">
            <span className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center text-sm font-bold text-gray-300">
              📅 {match.date}
            </span>
            <span className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center text-sm font-bold text-gray-300">
              🕒 {match.time}
            </span>
            <span className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-center text-sm font-bold text-gray-300">
              📍 {match.location}
            </span>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-6">
            <h3 className="mb-4 text-xl font-black text-white">
              תוצאת משחק
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                placeholder={match.homeTeam}
                value={scoreForm.homeScore}
                onChange={(e) =>
                  setScoreForm((prev) => ({
                    ...prev,
                    homeScore: e.target.value,
                  }))
                }
                className={`${input} w-full text-center text-xl font-black`}
              />

              <span className="text-xl font-black text-emerald-300">-</span>

              <input
                type="number"
                min="0"
                placeholder={match.awayTeam}
                value={scoreForm.awayScore}
                onChange={(e) =>
                  setScoreForm((prev) => ({
                    ...prev,
                    awayScore: e.target.value,
                  }))
                }
                className={`${input} w-full text-center text-xl font-black`}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.07] p-6">
              <h3 className="mb-4 text-xl font-black text-amber-300">שערים</h3>

              <div className="space-y-4">
                {goalForms.map((goal, index) => (
                  <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <select
                      value={goal.playerId}
                      onChange={(e) => {
                        const selectedPlayer = allPlayers.find(
                          (player) =>
                            String(player.playerId) === String(e.target.value)
                        );

                        setGoalForms((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  playerId: e.target.value,
                                  playerName: selectedPlayer?.fullName || "",
                                  teamName: selectedPlayer?.teamName || "",
                                }
                              : item
                          )
                        );
                      }}
                      className={`${input} mb-3 w-full`}
                    >
                      <option value="">בחר שחקן</option>

                      {allPlayers.map((player) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.fullName || player.email} - {player.teamName}
                        </option>
                      ))}
                    </select>

                    <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-gray-400">
                      {goal.teamName || "קבוצה תתמלא אוטומטית"}
                    </div>

                    <input
                      type="number"
                      min="0"
                      placeholder="כמות שערים"
                      value={goal.goals}
                      onChange={(e) =>
                        setGoalForms((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, goals: e.target.value }
                              : item
                          )
                        )
                      }
                      className={`${input} w-full`}
                    />

                    {goalForms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGoalRow(index)}
                        className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-400/20"
                      >
                        הסר כובש
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addGoalRow}
                className="mt-4 rounded-2xl bg-amber-500 px-5 py-3 font-bold text-white transition hover:bg-amber-600"
              >
                + הוסף כובש
              </button>
            </div>

            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.07] p-6">
              <h3 className="mb-4 text-xl font-black text-emerald-300">
                בישולים
              </h3>

              <div className="space-y-4">
                {assistForms.map((assist, index) => (
                  <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <select
                      value={assist.playerId}
                      onChange={(e) => {
                        const selectedPlayer = allPlayers.find(
                          (player) =>
                            String(player.playerId) === String(e.target.value)
                        );

                        setAssistForms((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  playerId: e.target.value,
                                  playerName: selectedPlayer?.fullName || "",
                                  teamName: selectedPlayer?.teamName || "",
                                }
                              : item
                          )
                        );
                      }}
                      className={`${input} mb-3 w-full`}
                    >
                      <option value="">בחר שחקן</option>

                      {allPlayers.map((player) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.fullName || player.email} - {player.teamName}
                        </option>
                      ))}
                    </select>

                    <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-gray-400">
                      {assist.teamName || "קבוצה תתמלא אוטומטית"}
                    </div>

                    <input
                      type="number"
                      min="0"
                      placeholder="כמות בישולים"
                      value={assist.assists}
                      onChange={(e) =>
                        setAssistForms((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, assists: e.target.value }
                              : item
                          )
                        )
                      }
                      className={`${input} w-full`}
                    />

                    {assistForms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAssistRow(index)}
                        className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-400/20"
                      >
                        הסר מבשל
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addAssistRow}
                className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
              >
                + הוסף מבשל
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-blue-400/20 bg-blue-400/[0.07] p-6">
            <h3 className="mb-4 text-xl font-black text-blue-300">
              כרטיסים כחולים
            </h3>

            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={blueCardForm.playerId}
                onChange={(e) => {
                  const selectedPlayer = allPlayers.find(
                    (player) =>
                      String(player.playerId) === String(e.target.value)
                  );

                  setBlueCardForm((prev) => ({
                    ...prev,
                    playerId: e.target.value,
                    playerName: selectedPlayer?.fullName || "",
                    teamName: selectedPlayer?.teamName || "",
                  }));
                }}
                className={input}
              >
                <option value="">בחר שחקן</option>

                {allPlayers.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.fullName || player.email} - {player.teamName}
                  </option>
                ))}
              </select>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-gray-400">
                {blueCardForm.teamName || "קבוצה תתמלא אוטומטית"}
              </div>

              <input
                type="number"
                placeholder="דקה"
                value={blueCardForm.minute}
                onChange={(e) =>
                  setBlueCardForm((prev) => ({
                    ...prev,
                    minute: e.target.value,
                  }))
                }
                className={input}
              />
            </div>

            <button
              type="button"
              onClick={handleAddBlueCard}
              className="mt-4 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
            >
              הוסף כרטיס כחול
            </button>

            {match.blueCards?.length > 0 && (
              <div className="mt-4 space-y-2">
                {match.blueCards.map((card, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-gray-200"
                  >
                    🔵 {card.playerName} | {card.teamName}
                    {card.minute ? ` | דקה ${card.minute}` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-3xl border border-yellow-400/20 bg-yellow-400/[0.07] p-6">
            <h3 className="mb-4 text-xl font-black text-yellow-300">
              ⭐ שחקן מצטיין המשחק
            </h3>

            <select
              value={mvpPlayer.playerId}
              onChange={(e) => {
                const selectedPlayer = allPlayers.find(
                  (player) => String(player.playerId) === String(e.target.value)
                );

                setMvpPlayer({
                  playerId: e.target.value,
                  playerName: selectedPlayer?.fullName || "",
                });
              }}
              className={`${input} w-full`}
            >
              <option value="">בחר שחקן מצטיין</option>

              {allPlayers.map((player) => (
                <option key={player.playerId} value={player.playerId}>
                  {player.fullName || player.email} - {player.teamName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitReport}
            className={`${primaryButton} mt-8 w-full py-4 text-lg`}
          >
            {submitting ? "שולח דיווח..." : "שלח דיווח"}
          </button>
        </section>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </main>
  );
}
