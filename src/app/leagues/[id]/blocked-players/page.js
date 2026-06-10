"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  pageBg,
  pageGlow,
  card,
  softCard,
  secondaryButton,
  dangerButton,
} from "@/lib/uiStyles";

export default function BlockedPlayersPage() {
  const { id } = useParams();
  const router = useRouter();
  const [leagueName, setLeagueName] = useState("");
  const [blockedPlayers, setBlockedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchBlockedPlayers = async () => {
      try {
        const res = await fetch(`/api/leagues/${id}/blocked-players`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          setMessage(data.message || "שגיאה בטעינת החסימות");
          return;
        }

        setLeagueName(data.leagueName || "");
        setBlockedPlayers(data.blockedPlayers || []);
      } catch {
        setMessage("שגיאה בטעינת החסימות");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBlockedPlayers();
  }, [id]);

  const handleRemoveBlock = async (blockedPlayerId) => {
    setRemovingId(blockedPlayerId);
    setMessage("");

    try {
      const res = await fetch(`/api/leagues/${id}/blocked-players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ blockedPlayerId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "שגיאה בביטול החסימה");
        return;
      }

      setBlockedPlayers(data.blockedPlayers || []);
      setMessage("החסימה בוטלה");
    } catch {
      setMessage("שגיאה בביטול החסימה");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main dir="rtl" className={pageBg}>
      <div className={pageGlow}>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <header
          className={`${card} mb-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`}
        >
          <div>
            <span className="mb-3 inline-flex rounded-full bg-red-500/10 px-4 py-1 text-xs font-black text-red-300">
              ניהול חסימות
            </span>
            <h1 className="text-3xl font-black text-white">חסימות קבועות</h1>
            <p className="mt-2 text-sm font-bold text-slate-400">
              {leagueName || "הליגה"} · שחקנים שלא יכולים לשלוח בקשת הצטרפות
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/leagues/${id}`)}
            className={secondaryButton}
          >
            חזרה לליגה ←
          </button>
        </header>

        {message && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200">
            {message}
          </div>
        )}

        <section className={`${softCard} p-6`}>
          {loading ? (
            <p className="text-sm font-bold text-slate-400">טוען חסימות...</p>
          ) : blockedPlayers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/25 bg-[#173326]/65 py-12 text-center text-sm font-bold text-slate-400 backdrop-blur-md">
              אין שחקנים שחסומים לצמיתות
            </div>
          ) : (
            <div className="grid gap-3">
              {blockedPlayers.map((player) => (
                <div
                  key={player._id}
                  className="flex flex-col gap-4 rounded-3xl border border-white/25 bg-[#173326]/65 px-5 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-white">
                      {player.playerName || player.playerEmail}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {player.playerEmail}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      נחסם בתאריך{" "}
                      {new Date(player.blockedAt).toLocaleDateString("he-IL")}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={removingId === String(player._id)}
                    onClick={() => handleRemoveBlock(String(player._id))}
                    className={`${dangerButton} disabled:opacity-50`}
                  >
                    {removingId === String(player._id)
                      ? "מבטל חסימה..."
                      : "בטל חסימה"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
