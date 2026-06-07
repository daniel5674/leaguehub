"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { currentUser, isLoaded } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    shirtNumber: "",
    position: "",
    image: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/player-profile/me", {
          credentials: "include",
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : null;

        if (!res.ok) {
          console.log("Profile API error:", data);
          setProfile(null);
          return;
        }

        setProfile(data);
        setEditForm({
          shirtNumber: data.shirtNumber || "",
          position: data.position || "",
          image: data.image || "",
        });
      } catch (error) {
        console.error("Failed to load player profile:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoaded) return;

    if (!currentUser) {
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [currentUser, isLoaded]);

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const res = await fetch("/api/player-profile/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "שגיאה בעדכון כרטיס שחקן");
        return;
      }

      setProfile(data);
      setIsEditing(false);
    } catch (error) {
      console.error("Update profile failed:", error);
      alert("שגיאה בעדכון כרטיס שחקן");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-gray-500">טוען פרופיל...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-red-500">צריך להתחבר כדי לראות פרופיל</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-red-500">לא נמצא כרטיס שחקן</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-l from-black via-gray-900 to-gray-700 px-8 py-10 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/30 bg-white/10 text-5xl font-bold">
                {profile.image ? (
                  <img
                    src={profile.image}
                    alt={profile.fullName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  profile.fullName?.charAt(0) || "?"
                )}
              </div>

              <div>
                <p className="text-sm text-gray-300">כרטיס שחקן</p>

                <h1 className="mt-1 text-4xl font-black">{profile.fullName}</h1>

                <p className="mt-2 text-gray-300">{profile.email}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
                    דירוג {profile.rating || "לא דורג"}{" "}
                  </span>

                  {profile.goals >= 10 && (
                    <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-bold text-white">
                      ⚽ חלוץ מוביל
                    </span>
                  )}

                  {profile.assists >= 5 && (
                    <span className="rounded-full bg-indigo-500 px-3 py-1 text-sm font-bold text-white">
                      🎯 פליימייקר
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 px-8 py-5 text-center backdrop-blur">
              <p className="text-sm text-gray-300">מספר חולצה</p>
              <p className="text-6xl font-black">
                {profile.shirtNumber || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="rounded-xl bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
            >
              {isEditing ? "סגור עריכה" : "ערוך כרטיס שחקן"}
            </button>
          </div>

          {isEditing && (
            <form
              onSubmit={handleUpdateProfile}
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
                disabled={saving}
                className="md:col-span-3 rounded-xl bg-black px-5 py-3 text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {saving ? "שומר..." : "שמור שינויים"}
              </button>
            </form>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-3xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
              <div className="text-3xl">🎯</div>
              <p className="mt-2 text-3xl font-black text-gray-900">
                {profile.position || "-"}
              </p>
              <p className="text-sm text-gray-600">עמדה</p>
            </div>

            <div className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <div className="text-3xl">⚽</div>
              <p className="mt-2 text-5xl font-black text-green-700">
                {profile.goals || 0}
              </p>
              <p className="text-sm text-gray-600">שערים</p>
            </div>

            <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
              <div className="text-3xl">🅰️</div>
              <p className="mt-2 text-5xl font-black text-indigo-700">
                {profile.assists || 0}
              </p>
              <p className="text-sm text-gray-600">בישולים</p>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <div className="text-3xl">🟦</div>
              <p className="mt-2 text-5xl font-black text-blue-700">
                {profile.blueCards || 0}
              </p>
              <p className="text-sm text-gray-600">כרטיסים כחולים</p>
            </div>

            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
              <div className="text-3xl">🏟️</div>
              <p className="mt-2 text-5xl font-black text-yellow-700">
                {profile.gamesPlayed || 0}
              </p>
              <p className="text-sm text-gray-600">משחקים</p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold">מידע שחקן</h2>

            <div className="mt-8 rounded-3xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold">הליגות שלי</h2>

              {profile.leagues?.length ? (
                <div className="mt-4 space-y-3">
                  {profile.leagues.map((league) => (
                    <div
                      key={league.leagueId}
                      className="rounded-2xl border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">{league.leagueName}</h3>
                          <p className="text-sm text-gray-500">
                            {league.teamName}
                          </p>
                        </div>

                        {league.isCaptain && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">
                            👑 קפטן
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-green-50 p-3">
                          <p className="text-2xl font-black text-green-700">
                            {league.goals}
                          </p>
                          <p className="text-xs text-gray-500">שערים</p>
                        </div>

                        <div className="rounded-xl bg-indigo-50 p-3">
                          <p className="text-2xl font-black text-indigo-700">
                            {league.assists}
                          </p>
                          <p className="text-xs text-gray-500">בישולים</p>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3">
                          <p className="text-2xl font-black text-blue-700">
                            {league.blueCards}
                          </p>
                          <p className="text-xs text-gray-500">
                            כרטיסים כחולים
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-gray-500">
                  השחקן עדיין לא משחק באף ליגה
                </p>
              )}
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">שם מלא</span>
                <span className="font-medium">{profile.fullName}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">אימייל</span>
                <span className="font-medium">{profile.email}</span>
              </div>

              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">דירוג</span>
                <span className="font-medium">
                  {profile.rating || "לא דורג"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">מספר חולצה</span>
                <span className="font-medium">
                  {profile.shirtNumber || "לא נקבע"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
