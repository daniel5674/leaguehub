"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PlayerPage() {
  const { id, playerId } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [league, setLeague] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    shirtNumber: "",
    position: "",
    image: "",
  });

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const res = await fetch(`/api/leagues/${id}`, {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          setLeague(null);
          return;
        }

        setLeague(data);

        let foundPlayer = null;
        let foundTeam = null;

        data.teams?.forEach((team) => {
          const player = team.players?.find(
            (player) => String(player.playerId) === String(playerId)
          );

          if (player) {
            foundPlayer = player;
            foundTeam = team;
          }
        });

        if (foundPlayer) {
          const playerGoals =
            data.topScorers?.find(
              (scorer) =>
                scorer.playerName?.trim().toLowerCase() ===
                  foundPlayer.fullName?.trim().toLowerCase() &&
                scorer.teamName?.trim().toLowerCase() ===
                  foundTeam.name?.trim().toLowerCase()
            )?.goals || 0;

          const playerAssists =
            data.topAssists?.find(
              (assist) =>
                assist.playerName?.trim().toLowerCase() ===
                  foundPlayer.fullName?.trim().toLowerCase() &&
                assist.teamName?.trim().toLowerCase() ===
                  foundTeam.name?.trim().toLowerCase()
            )?.assists || 0;

          const playerBlueCards =
            data.matches?.reduce((total, match) => {
              const cardsCount =
                match.blueCards?.filter(
                  (card) =>
                    String(card.playerId) === String(foundPlayer.playerId)
                ).length || 0;

              return total + cardsCount;
            }, 0) || 0;

          setPlayerData({
            ...foundPlayer,
            teamName: foundTeam.name,
            goals: playerGoals,
            assists: playerAssists,
            blueCards: playerBlueCards,
          });

          setEditForm({
            shirtNumber: foundPlayer.shirtNumber || "",
            position: foundPlayer.position || "",
            image: foundPlayer.image || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch player:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && playerId) {
      fetchLeague();
    }
  }, [id, playerId]);

  const handleToggleCaptain = async () => {
    const newCaptainState = !playerData.isCaptain;

    try {
      const res = await fetch(`/api/leagues/${id}/teams/captain`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          teamName: playerData.teamName,
          playerEmail: playerData.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "שגיאה במינוי קפטן");
        return;
      }

      setPlayerData((prev) => ({ ...prev, isCaptain: newCaptainState }));
      router.refresh();
    } catch (error) {
      console.error("Toggle captain failed:", error);
      alert("שגיאה במינוי קפטן");
    }
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdatePlayer = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/leagues/${id}/players/${playerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "שגיאה בעדכון שחקן");
        return;
      }

      const updatedPlayer = data.teams
        .flatMap((team) =>
          team.players.map((player) => ({
            ...player,
            teamName: team.name,
          }))
        )
        .find((player) => String(player.playerId) === String(playerId));

      setPlayerData(updatedPlayer);
      setIsEditing(false);
    } catch (error) {
      console.error("Update player failed:", error);
      alert("שגיאה בעדכון שחקן");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-gray-500">טוען שחקן...</p>
      </main>
    );
  }

  if (!league || !playerData) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-red-500">השחקן לא נמצא</p>
      </main>
    );
  }

  const canManage =
    currentUser &&
    (String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser._id || currentUser.id));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-l from-black via-gray-900 to-gray-700 px-8 py-10 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/30 bg-white/10 text-5xl font-bold">
                {playerData.image ? (
                  <img
                    src={playerData.image}
                    alt={playerData.fullName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  playerData.fullName?.charAt(0) || "?"
                )}
              </div>

              <div>
                <p className="text-sm text-gray-300">פרופיל שחקן</p>
                <div className="mt-1 flex items-center gap-3">
                  <h1 className="text-4xl font-black">{playerData.fullName}</h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {playerData.isCaptain && (
                      <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold text-black">
                        👑 קפטן
                      </span>
                    )}

                    {playerData.goals >= 10 && (
                      <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-bold text-white">
                        ⚽ חלוץ מוביל
                      </span>
                    )}

                    {playerData.assists >= 5 && (
                      <span className="rounded-full bg-indigo-500 px-3 py-1 text-sm font-bold text-white">
                        🎯 פליימייקר
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-gray-300">{playerData.email}</p>
                <p className="mt-1 text-sm text-gray-300">
                  {league.name} • {playerData.teamName}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 px-8 py-5 text-center backdrop-blur">
              <p className="text-sm text-gray-300">מספר חולצה</p>
              <p className="text-6xl font-black">
                {playerData.shirtNumber || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {canManage && (
            <div className="mb-6 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className="rounded-xl bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
              >
                {isEditing ? "סגור עריכה" : "ערוך שחקן"}
              </button>

              {!playerData.isCaptain && (
                <button
                  type="button"
                  onClick={handleToggleCaptain}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                >
                  הגדר כקפטן
                </button>
              )}

              {playerData.isCaptain && (
                <>
                  <span className="flex items-center gap-1 rounded-xl bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-700 border border-yellow-300">
                    ★ קפטן
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleCaptain}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50"
                  >
                    הסר קפטן
                  </button>
                </>
              )}
            </div>
          )}

          {canManage && isEditing && (
            <form
              onSubmit={handleUpdatePlayer}
              className="mb-8 grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-3"
            >
              <input
                type="number"
                name="shirtNumber"
                value={editForm.shirtNumber}
                onChange={handleEditChange}
                placeholder="מספר חולצה"
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <input
                type="text"
                name="position"
                value={editForm.position}
                onChange={handleEditChange}
                placeholder="עמדה"
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <input
                type="text"
                name="image"
                value={editForm.image}
                onChange={handleEditChange}
                placeholder="קישור לתמונה"
                className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <button
                type="submit"
                className="md:col-span-3 rounded-xl bg-black px-5 py-3 text-white transition hover:bg-gray-800"
              >
                שמור שינויים
              </button>
            </form>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="text-3xl">🏆</div>
              <p className="mt-2 text-3xl font-black text-gray-900">
                {playerData.teamName}
              </p>
              <p className="text-sm text-gray-600">קבוצה</p>
            </div>

            <div className="rounded-3xl border border-purple-200 bg-purple-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="text-3xl">🎯</div>
              <p className="mt-2 text-3xl font-black text-gray-900">
                {playerData.position || "-"}
              </p>
              <p className="text-sm text-gray-600">עמדה</p>
            </div>

            <div className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="text-3xl">⚽</div>
              <p className="mt-2 text-5xl font-black text-green-700">
                {playerData.goals}
              </p>
              <p className="text-sm text-gray-600">שערים</p>
            </div>

            <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="text-3xl">🅰️</div>
              <p className="mt-2 text-5xl font-black text-indigo-700">
                {playerData.assists}
              </p>
              <p className="text-sm text-gray-600">בישולים</p>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="text-3xl">🟦</div>
              <p className="mt-2 text-5xl font-black text-blue-700">
                {playerData.blueCards || 0}
              </p>
              <p className="text-sm text-gray-600">כרטיסים כחולים</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold">מידע שחקן</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">שם מלא</span>
                  <span className="font-medium">{playerData.fullName}</span>
                </div>

                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">אימייל</span>
                  <span className="font-medium">{playerData.email}</span>
                </div>

                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">ליגה</span>
                  <span className="font-medium">{league.name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">מספר חולצה</span>
                  <span className="font-medium">
                    {playerData.shirtNumber || "לא נקבע"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
