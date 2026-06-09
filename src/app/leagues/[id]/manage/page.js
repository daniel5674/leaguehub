"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const RATING_COLORS = {
  A: "bg-emerald-100 text-emerald-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-gray-100 text-gray-600",
};

export default function ManagePage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [league, setLeague] = useState(null);
  const [siteUsers, setSiteUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [pendingRatings, setPendingRatings] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!id) return;
    fetchLeague();
    fetchUsers();
  }, [id]);

  const fetchLeague = async () => {
    const res = await fetch(`/api/leagues/${id}`, { credentials: "include" });
    const data = await res.json();
    if (res.ok) setLeague(data);
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users", { credentials: "include" });
    const data = await res.json();
    if (res.ok) setSiteUsers(data);
  };

  const isOwner =
    league &&
    currentUser &&
    (String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser._id || currentUser.id));

  const handleAddPlayer = async (user) => {
    setAddingId(user._id || user.email);
    const rating = pendingRatings[user._id || user.email] || "C";
    const res = await fetch(`/api/leagues/${id}/personal-players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        userId: String(user._id || ""),
        email: user.email,
        fullName: user.fullName,
        rating,
      }),
    });
    const data = await res.json();
    setAddingId(null);
    if (res.ok) {
      setLeague(data);
      showToast(`${user.fullName} נוסף לרשימה`);
    } else {
      showToast(data.message || "שגיאה בהוספה", "error");
    }
  };

  const handleRemovePlayer = async (playerId) => {
    setRemovingId(playerId);
    const res = await fetch(`/api/leagues/${id}/personal-players`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ playerId }),
    });
    const data = await res.json();
    setRemovingId(null);
    if (res.ok) {
      setLeague(data);
      showToast("השחקן הוסר");
    } else {
      showToast(data.message || "שגיאה", "error");
    }
  };

  if (!league) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  const roster = league.personalPlayers || [];

  const registeredEmails = new Set(roster.map((p) => p.email).filter(Boolean));

  const filteredUsers = siteUsers.filter((u) => {
    if (registeredEmails.has(u.email)) return false;
    const term = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#050b14] px-6 py-10 text-white"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/2 h-[700px] w-[1200px] -translate-x-1/2 opacity-[0.06]">
          <div className="absolute bottom-0 h-full w-full rounded-t-[500px] border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-white" />
          <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-72 w-[420px] -translate-x-1/2 border-4 border-white" />
        </div>
      </div>

      {toast && (
        <div
          className={`fixed right-6 top-24 z-50 rounded-2xl px-5 py-3 text-sm font-black shadow-2xl ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-emerald-400 text-slate-950"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <span className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-xs font-black text-emerald-300">
              ניהול ליגה אישית
            </span>

            <h1 className="text-3xl font-black text-white">{league.name}</h1>

            <p className="mt-2 text-sm font-bold text-slate-400">
              ניהול שחקנים, דירוגים והוספת משתמשים לליגה
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/leagues/${id}`)}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/15"
          >
            חזרה לליגה ←
          </button>
        </div>

        <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">שחקנים רשומים</h2>
              <p className="mt-1 text-sm text-slate-400">
                {roster.length} שחקנים בליגה
              </p>
            </div>

            <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
              {roster.length}
            </span>
          </div>

          {roster.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-10 text-center text-sm font-bold text-slate-400">
              אין שחקנים עדיין. הוסף שחקנים מהרשימה למטה.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {roster.map((player) => (
                <div
                  key={player._id}
                  className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 transition hover:bg-white/[0.08]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-black text-white">
                      {player.fullName?.charAt(0)}
                    </div>

                    <div>
                      <Link
                        href={`/leagues/${id}/players/${
                          player._id || player.playerId
                        }`}
                        className="font-black text-white transition hover:text-emerald-300 hover:underline"
                      >
                        {player.fullName}
                      </Link>

                      {player.email && (
                        <p className="text-xs font-bold text-slate-500">
                          {player.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        RATING_COLORS[player.rating] || RATING_COLORS.D
                      }`}
                    >
                      {player.rating}
                    </span>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(String(player._id))}
                        disabled={removingId === String(player._id)}
                        className="rounded-xl border border-red-400/20 px-3 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {isOwner && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
            <div className="mb-5">
              <h2 className="text-xl font-black text-white">הוסף שחקן</h2>
              <p className="mt-1 text-sm text-slate-400">
                חפש משתמשים קיימים והוסף אותם לליגה עם דירוג התחלתי.
              </p>
            </div>

            <input
              type="text"
              placeholder="חיפוש לפי שם או אימייל..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-emerald-400"
            />

            {filteredUsers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-10 text-center text-sm font-bold text-slate-400">
                {search ? "לא נמצאו משתמשים" : "כל המשתמשים כבר ברשימה"}
              </div>
            ) : (
              <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                {filteredUsers.map((u) => {
                  const key = u._id || u.email;
                  const rating = pendingRatings[key] || "C";
                  const isAdding = addingId === key;

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 transition hover:bg-white/[0.08]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-black text-white">
                          {u.fullName?.charAt(0)}
                        </div>

                        <div>
                          <p className="text-sm font-black text-white">
                            {u.fullName}
                          </p>

                          <p className="text-xs font-bold text-slate-500">
                            {u.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={rating}
                          onChange={(e) =>
                            setPendingRatings((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-black text-white outline-none focus:border-emerald-400"
                        >
                          {["A", "B", "C", "D"].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleAddPlayer(u)}
                          disabled={isAdding}
                          className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                        >
                          {isAdding ? "..." : "+ הוסף"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
