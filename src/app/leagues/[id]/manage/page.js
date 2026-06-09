"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-gray-900 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-5">
          <button
            type="button"
            onClick={() => router.push(`/leagues/${id}`)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            ← חזרה
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">{league.name}</h1>
            <p className="text-xs text-gray-500">ניהול שחקנים</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              שחקנים רשומים
              <span className="mr-2 text-sm font-normal text-gray-400">
                ({roster.length})
              </span>
            </h2>
          </div>

          {roster.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              אין שחקנים עדיין. הוסף שחקנים מהרשימה למטה.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {roster.map((player) => (
                <div
                  key={player._id}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700">
                      {player.fullName?.charAt(0)}
                    </div>
                    <div>
                      <Link href={`/leagues/${id}/players/${player.playerId}`}>
                        {player.fullName}
                      </Link>
                      {player.email && (
                        <p className="text-xs text-gray-400">{player.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
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
                        className="rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
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

        {isOwner && (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">הוסף שחקן</h2>
            <input
              type="text"
              placeholder="חיפוש לפי שם או אימייל..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
            />

            {filteredUsers.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                {search ? "לא נמצאו משתמשים" : "כל המשתמשים כבר ברשימה"}
              </p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {filteredUsers.map((u) => {
                  const key = u._id || u.email;
                  const rating = pendingRatings[key] || "C";
                  const isAdding = addingId === key;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                          {u.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {u.fullName}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
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
                          className="rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-bold outline-none"
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
                          className="rounded-xl bg-gray-900 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-gray-700 disabled:opacity-50"
                        >
                          {isAdding ? "..." : "+ הוסף"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
