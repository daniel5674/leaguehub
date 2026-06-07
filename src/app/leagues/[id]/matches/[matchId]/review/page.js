"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/ui/Toast";

export default function ReviewMatchReportPage() {
  const { id, matchId } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [league, setLeague] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });

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

  const normalizeStats = (items = []) => {
    return items
      .map((item) => ({
        playerId: item.playerId || "",
        playerName: item.playerName?.trim().toLowerCase() || "",
        teamName: item.teamName?.trim().toLowerCase() || "",
      }))
      .sort((a, b) =>
        `${a.playerId}-${a.playerName}-${a.teamName}`.localeCompare(
          `${b.playerId}-${b.playerName}-${b.teamName}`
        )
      );
  };

  const areSameStats = (arr1 = [], arr2 = []) => {
    return (
      JSON.stringify(normalizeStats(arr1)) ===
      JSON.stringify(normalizeStats(arr2))
    );
  };

  const reportsMatch =
    hasTwoReports &&
    Number(reports[0].homeScore) === Number(reports[1].homeScore) &&
    Number(reports[0].awayScore) === Number(reports[1].awayScore) &&
    areSameStats(reports[0].scorers, reports[1].scorers) &&
    areSameStats(reports[0].assists, reports[1].assists);

  const approvedReport = reportsMatch ? reports[0] : null;

  const handleApproveMatch = async () => {
    if (!approvedReport) return;

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
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-gray-500">טוען בדיקת דיווח...</p>
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

  if (!canManage) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-red-500">אין לך הרשאה לצפות בדף הזה</p>
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
            בדיקת דיווח משחק
          </h1>

          <div className="mb-8 flex items-center justify-between text-center">
            <h2 className="flex-1 text-2xl font-black">{match.homeTeam}</h2>

            <div className="rounded-3xl bg-black px-8 py-5 text-white shadow-lg">
              <div className="text-4xl font-black">
                {hasTwoReports
                  ? `${reports[0].homeScore} : ${reports[0].awayScore}`
                  : "- : -"}
              </div>
              <div className="mt-1 text-sm text-gray-300">דיווח קפטנים</div>
            </div>

            <h2 className="flex-1 text-2xl font-black">{match.awayTeam}</h2>
          </div>

          {reportsMatch ? (
            <div className="mb-6 rounded-3xl border border-green-200 bg-green-50 p-5 text-center">
              <p className="text-xl font-black text-green-700">
                ✅ הדיווחים תואמים
              </p>
            </div>
          ) : (
            <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-center">
              <p className="text-xl font-black text-red-700">
                ❌ הדיווחים לא תואמים
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report, index) => (
              <div
                key={index}
                className="rounded-3xl border border-gray-200 bg-gray-50 p-5"
              >
                <h3 className="mb-4 text-xl font-black text-gray-900">
                  דיווח {index + 1}
                </h3>

                <p className="font-bold text-gray-800">
                  קפטן: {report.captainName}
                </p>

                <p className="text-sm text-gray-500">
                  קבוצה: {report.teamName}
                </p>

                <div className="mt-5 rounded-2xl bg-white px-4 py-4 text-center">
                  <p className="text-sm font-bold text-gray-500">תוצאה</p>
                  <p className="mt-1 text-3xl font-black text-gray-900">
                    {report.homeScore} - {report.awayScore}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl bg-green-50 p-4">
                  <p className="mb-3 font-black text-green-800">כובשי שערים</p>

                  {!report.scorers || report.scorers.length === 0 ? (
                    <p className="text-sm text-gray-500">אין כובשים בדיווח</p>
                  ) : (
                    <div className="space-y-2">
                      {report.scorers.map((scorer, scorerIndex) => (
                        <div
                          key={scorerIndex}
                          className="rounded-xl bg-white px-3 py-2 text-sm"
                        >
                          ⚽ {scorer.playerName} | {scorer.teamName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-2xl bg-yellow-50 p-4">
                  <p className="mb-3 font-black text-yellow-800">מבשלי שערים</p>

                  {!report.assists || report.assists.length === 0 ? (
                    <p className="text-sm text-gray-500">אין בישולים בדיווח</p>
                  ) : (
                    <div className="space-y-2">
                      {report.assists.map((assist, assistIndex) => (
                        <div
                          key={assistIndex}
                          className="rounded-xl bg-white px-3 py-2 text-sm"
                        >
                          🅰️ {assist.playerName} | {assist.teamName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                  <p className="mb-3 font-black text-blue-800">
                    כרטיסים כחולים
                  </p>

                  {!report.blueCards || report.blueCards.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      אין כרטיסים כחולים בדיווח
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {report.blueCards.map((card, cardIndex) => (
                        <div
                          key={cardIndex}
                          className="rounded-xl bg-white px-3 py-2 text-sm"
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
