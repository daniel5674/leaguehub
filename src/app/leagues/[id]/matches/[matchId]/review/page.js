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
  secondaryButton,
} from "@/lib/uiStyles";

export default function ReviewMatchReportPage() {
  const { id, matchId } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [league, setLeague] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [selectedMvp, setSelectedMvp] = useState({
    playerId: "",
    playerName: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const fetchLeague = async () => {
    const res = await fetch(`/api/leagues/${id}`, {
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "שגיאה בטעינת הליגה", "error");
      setLoading(false);
      return;
    }

    const currentMatch = data.matches?.find(
      (item) => String(item._id || item.id) === String(matchId)
    );

    setLeague(data);
    setMatch(currentMatch || null);
    setLoading(false);
  };

  useEffect(() => {
    if (!id || !matchId) return;
    fetchLeague();
  }, [id, matchId]);

  const currentUserId = currentUser?._id || currentUser?.id;

  const canManage =
    currentUser &&
    league &&
    (String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUserId));

  const reports = match?.captainReports || [];

  const hasTwoReports = reports.length >= 2;

  const getAmount = (item, amountField) => {
    if (amountField === "goals") {
      return Number(item.goals || item.goalCount || item.count || 1);
    }

    if (amountField === "assists") {
      return Number(item.assists || item.assistCount || item.count || 1);
    }

    return 1;
  };

  const normalizeStats = (items = [], amountField = "goals") => {
    const map = {};

    items.forEach((item) => {
      const key = `${item.playerId || ""}-${item.playerName
        ?.trim()
        .toLowerCase()}-${item.teamName?.trim().toLowerCase()}`;

      const amount = getAmount(item, amountField);

      map[key] = (map[key] || 0) + amount;
    });

    return Object.keys(map)
      .map((key) => ({
        key,
        amount: map[key],
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  };

  const areSameStats = (arr1 = [], arr2 = [], amountField = "goals") => {
    return (
      JSON.stringify(normalizeStats(arr1, amountField)) ===
      JSON.stringify(normalizeStats(arr2, amountField))
    );
  };

  const reportsMatch =
    hasTwoReports &&
    Number(reports[0].homeScore) === Number(reports[1].homeScore) &&
    Number(reports[0].awayScore) === Number(reports[1].awayScore) &&
    areSameStats(reports[0].scorers, reports[1].scorers, "goals") &&
    areSameStats(reports[0].assists, reports[1].assists, "assists");

  const scoresMatch =
    hasTwoReports &&
    Number(reports[0].homeScore) === Number(reports[1].homeScore) &&
    Number(reports[0].awayScore) === Number(reports[1].awayScore);

  const scorersMatch =
    hasTwoReports &&
    areSameStats(reports[0].scorers, reports[1].scorers, "goals");

  const assistsMatch =
    hasTwoReports &&
    areSameStats(reports[0].assists, reports[1].assists, "assists");

  const hasMvpConflict =
    reportsMatch &&
    reports[0]?.mvpPlayerId &&
    reports[1]?.mvpPlayerId &&
    reports[0].mvpPlayerId !== reports[1].mvpPlayerId;

  const approvedReport = reportsMatch ? reports[0] : null;

  const sameMvpSelected =
    hasTwoReports &&
    reports[0]?.mvpPlayerId &&
    reports[0]?.mvpPlayerId === reports[1]?.mvpPlayerId;

  const allMvpOptions = reports.flatMap((report) => {
    if (!report.mvpPlayerId || !report.mvpPlayerName) return [];

    return [
      {
        playerId: report.mvpPlayerId,
        playerName: report.mvpPlayerName,
      },
    ];
  });

  const handleApproveMatch = async () => {
    if (!approvedReport) return;

    if (!sameMvpSelected && !selectedMvp.playerId) {
      showToast("יש לבחור MVP סופי", "error");
      return;
    }

    const res = await fetch(`/api/leagues/${id}/matches`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        action: "UPDATE_SCORE",
        matchId,
        homeScore: Number(approvedReport.homeScore),
        awayScore: Number(approvedReport.awayScore),
        finalMvpPlayerId: sameMvpSelected
          ? reports[0]?.mvpPlayerId
          : selectedMvp.playerId,

        finalMvpPlayerName: sameMvpSelected
          ? reports[0]?.mvpPlayerName
          : selectedMvp.playerName,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "שגיאה באישור תוצאה", "error");
      return;
    }

    showToast("התוצאה אושרה בהצלחה");
    router.push(`/leagues/${id}`);
  };

  const handleResetReports = async () => {
    const res = await fetch(`/api/leagues/${id}/matches`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        action: "RESET_CAPTAIN_REPORTS",
        matchId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "שגיאה באיפוס הדיווחים", "error");
      return;
    }

    showToast("הדיווחים אופסו, הקפטנים יכולים לדווח מחדש");
    router.push(`/leagues/${id}`);
  };

  if (loading) {
    return (
      <main dir="rtl" className={pageBg}>
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="text-gray-400">טוען בדיקת דיווח...</p>
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

  if (!canManage) {
    return (
      <main dir="rtl" className={pageBg}>
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="text-red-300">אין לך הרשאה לצפות בדף הזה</p>
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
              ניהול משחק
            </span>
            <h1 className="mt-3 text-3xl font-black text-white">
              בדיקת דיווח משחק
            </h1>
          </div>

          <div className="mb-8 flex flex-col items-center justify-between gap-4 text-center md:flex-row">
            <h2 className="flex-1 text-2xl font-black text-white">
              {match.homeTeam}
            </h2>

            <div className="rounded-3xl border border-emerald-400/20 bg-slate-950/70 px-8 py-5 text-white shadow-lg shadow-emerald-950/30">
              <div className="text-4xl font-black text-emerald-300">
                {hasTwoReports
                  ? `${reports[0].homeScore} : ${reports[0].awayScore}`
                  : "- : -"}
              </div>
              <div className="mt-1 text-sm text-gray-400">דיווח קפטנים</div>
            </div>

            <h2 className="flex-1 text-2xl font-black text-white">
              {match.awayTeam}
            </h2>
          </div>

          {reportsMatch ? (
            <div className="mb-6 rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-5 text-center">
              <p className="text-xl font-black text-emerald-300">
                ✅ הדיווחים תואמים
              </p>
            </div>
          ) : (
            <div className="mb-6 rounded-3xl border border-red-400/25 bg-red-400/10 p-5 text-center">
              <p className="text-xl font-black text-red-300">
                ❌ הדיווחים לא תואמים
              </p>

              {hasTwoReports && (
                <div className="mt-4 text-sm font-bold text-red-300">
                  {!scoresMatch && <p>התוצאה לא תואמת</p>}
                  {!scorersMatch && <p>כובשי השערים לא תואמים</p>}
                  {!assistsMatch && <p>המבשלים לא תואמים</p>}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report, index) => (
              <div
                key={index}
                className="rounded-3xl border border-white/10 bg-slate-950/35 p-5"
              >
                <h3 className="mb-4 text-xl font-black text-white">
                  דיווח {index + 1}
                </h3>

                <p className="font-bold text-gray-200">
                  קפטן: {report.captainName}
                </p>

                <p className="text-sm text-gray-400">
                  קבוצה: {report.teamName}
                </p>

                <div className="mt-4 rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.07] p-4">
                  <p className="mb-2 font-black text-yellow-300">
                    ⭐ שחקן מצטיין שנבחר
                  </p>

                  {report.mvpPlayerName ? (
                    <div className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-gray-200">
                      ⭐ {report.mvpPlayerName}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">לא נבחר שחקן מצטיין</p>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-center">
                  <p className="text-sm font-bold text-gray-400">תוצאה</p>
                  <p className="mt-1 text-3xl font-black text-emerald-300">
                    {report.homeScore} - {report.awayScore}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.07] p-4">
                  <p className="mb-3 font-black text-emerald-300">כובשי שערים</p>

                  {!report.scorers || report.scorers.length === 0 ? (
                    <p className="text-sm text-gray-400">אין כובשים בדיווח</p>
                  ) : (
                    <div className="space-y-2">
                      {report.scorers.map((scorer, scorerIndex) => (
                        <div
                          key={scorerIndex}
                          className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-gray-200"
                        >
                          ⚽ {scorer.playerName} | {scorer.teamName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.07] p-4">
                  <p className="mb-3 font-black text-yellow-300">מבשלי שערים</p>

                  {!report.assists || report.assists.length === 0 ? (
                    <p className="text-sm text-gray-400">אין בישולים בדיווח</p>
                  ) : (
                    <div className="space-y-2">
                      {report.assists.map((assist, assistIndex) => (
                        <div
                          key={assistIndex}
                          className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-gray-200"
                        >
                          🅰️ {assist.playerName} | {assist.teamName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-blue-400/15 bg-blue-400/[0.07] p-4">
                  <p className="mb-3 font-black text-blue-300">
                    כרטיסים כחולים
                  </p>

                  {!report.blueCards || report.blueCards.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      אין כרטיסים כחולים בדיווח
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {report.blueCards.map((card, cardIndex) => (
                        <div
                          key={cardIndex}
                          className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-gray-200"
                        >
                          🔵 {card.playerName} | {card.teamName}
                          {card.minute ? ` | דקה ${card.minute}` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMvpConflict && (
            <div className="mt-6 rounded-3xl border border-yellow-400/20 bg-yellow-400/[0.07] p-6">
              <h3 className="mb-4 text-xl font-black text-yellow-300">
                ⭐ הקפטנים בחרו MVP שונה
              </h3>

              <p className="mb-4 text-sm text-gray-400">
                בחר את ה-MVP הסופי לפני אישור המשחק
              </p>

              <select
                value={selectedMvp.playerId}
                onChange={(e) => {
                  const selected = allMvpOptions.find(
                    (player) => player.playerId === e.target.value
                  );

                  setSelectedMvp({
                    playerId: selected?.playerId || "",
                    playerName: selected?.playerName || "",
                  });
                }}
                className={`${input} w-full`}
              >
                <option value="">בחר MVP סופי</option>

                {allMvpOptions.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 md:flex-row">
            {reportsMatch && (
              <button
                type="button"
                onClick={handleApproveMatch}
                className="flex-1 rounded-3xl bg-green-600 py-4 text-lg font-black text-white transition hover:bg-green-700"
              >
                אשר תוצאה
              </button>
            )}

            {!reportsMatch && (
              <button
                type="button"
                onClick={handleResetReports}
                className="flex-1 rounded-3xl bg-red-600 py-4 text-lg font-black text-white transition hover:bg-red-700"
              >
                בקש דיווח מחדש
              </button>
            )}
          </div>
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
