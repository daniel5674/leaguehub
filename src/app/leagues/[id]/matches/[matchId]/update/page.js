"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/ui/Toast";

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

      for (const goal of goalForms) {
        if (goal.playerName && goal.teamName && goal.goals !== "") {
          await fetch(`/api/leagues/${id}/top-scorers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              playerName: goal.playerName,
              teamName: goal.teamName,
              goals: Number(goal.goals),
            }),
          });
        }
      }

      for (const assist of assistForms) {
        if (assist.playerName && assist.teamName && assist.assists !== "") {
          await fetch(`/api/leagues/${id}/top-assists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              playerName: assist.playerName,
              teamName: assist.teamName,
              assists: Number(assist.assists),
            }),
          });
        }
      }

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בשליחת דיווח", "error");
        return;
      }

      showToast("הדיווח נשלח בהצלחה");
      router.push(`/leagues/${id}`);
    } catch (error) {
      console.error("Submit report failed:", error);
      showToast("שגיאה בשליחת דיווח", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-gray-500">טוען משחק...</p>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-red-500">המשחק לא נמצא</p>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push(`/leagues/${id}`)}
          className="mb-6 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm"
        >
          חזרה לליגה
        </button>

        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-8 text-center text-3xl font-black text-gray-900">
            עדכון משחק
          </h1>

          <div className="mb-8 flex items-center justify-between text-center">
            <h2 className="flex-1 text-2xl font-black">{match.homeTeam}</h2>

            <div className="rounded-3xl bg-black px-8 py-5 text-white shadow-lg">
              <div className="text-4xl font-black">- : -</div>
              <div className="mt-1 text-sm text-gray-300">דיווח קפטן</div>
            </div>

            <h2 className="flex-1 text-2xl font-black">{match.awayTeam}</h2>
          </div>

          <div className="mb-8 grid gap-3 md:grid-cols-3">
            <span className="rounded-full bg-gray-100 px-4 py-2 text-center text-sm font-bold">
              📅 {match.date}
            </span>
            <span className="rounded-full bg-gray-100 px-4 py-2 text-center text-sm font-bold">
              🕒 {match.time}
            </span>
            <span className="rounded-full bg-gray-100 px-4 py-2 text-center text-sm font-bold">
              📍 {match.location}
            </span>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="mb-4 text-xl font-black">תוצאת משחק</h3>

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
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <span className="text-xl font-black">-</span>

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
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <h3 className="mb-4 text-xl font-black text-amber-800">שערים</h3>

              <div className="space-y-4">
                {goalForms.map((goal, index) => (
                  <div key={index} className="rounded-2xl bg-white p-4">
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
                      className="mb-3 w-full rounded-2xl border border-gray-300 px-4 py-3"
                    >
                      <option value="">בחר שחקן</option>

                      {allPlayers.map((player) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.fullName || player.email} - {player.teamName}
                        </option>
                      ))}
                    </select>

                    <div className="mb-3 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-500">
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
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                    />

                    {goalForms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGoalRow(index)}
                        className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600"
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

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
              <h3 className="mb-4 text-xl font-black text-emerald-800">
                בישולים
              </h3>

              <div className="space-y-4">
                {assistForms.map((assist, index) => (
                  <div key={index} className="rounded-2xl bg-white p-4">
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
                      className="mb-3 w-full rounded-2xl border border-gray-300 px-4 py-3"
                    >
                      <option value="">בחר שחקן</option>

                      {allPlayers.map((player) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.fullName || player.email} - {player.teamName}
                        </option>
                      ))}
                    </select>

                    <div className="mb-3 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-500">
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
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                    />

                    {assistForms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAssistRow(index)}
                        className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600"
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

          <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-4 text-xl font-black text-blue-800">
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
                className="rounded-2xl border border-gray-300 px-4 py-3"
              >
                <option value="">בחר שחקן</option>

                {allPlayers.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.fullName || player.email} - {player.teamName}
                  </option>
                ))}
              </select>

              <div className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-500">
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
                className="rounded-2xl border border-gray-300 px-4 py-3"
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
                    className="rounded-xl bg-white px-3 py-2 text-sm text-gray-800"
                  >
                    🔵 {card.playerName} | {card.teamName}
                    {card.minute ? ` | דקה ${card.minute}` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitReport}
            className="mt-8 w-full rounded-3xl bg-black py-4 text-lg font-black text-white transition hover:bg-gray-800 disabled:opacity-60"
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
