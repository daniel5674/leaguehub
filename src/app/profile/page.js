"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  pageBg,
  pageGlow,
  card,
  softCard,
  input,
  primaryButton,
  secondaryButton,
  statCard,
  profilePanel,
} from "@/lib/uiStyles";

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
      <main dir="rtl" className={pageBg}>
        <div className={pageGlow}>
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-green-400/15 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_60%)]" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <p className="text-slate-300">טוען פרופיל...</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main dir="rtl" className={pageBg}>
        <div className="relative mx-auto max-w-5xl">
          <div className={`${card} p-8 text-center`}>
            <p className="text-red-300">צריך להתחבר כדי לראות פרופיל</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main dir="rtl" className={pageBg}>
        <div className="relative mx-auto max-w-5xl">
          <div className={`${card} p-8 text-center`}>
            <p className="text-red-300">לא נמצא כרטיס שחקן</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className={pageBg}>
      <div className={pageGlow}>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-green-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_60%)]" />

        <div className="absolute bottom-0 left-1/2 h-[520px] w-[900px] -translate-x-1/2 opacity-[0.08]">
          <div className="absolute bottom-0 h-full w-full rounded-t-[420px] border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-white" />
          <div className="absolute bottom-0 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-56 w-96 -translate-x-1/2 border-4 border-white" />
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className={`${profilePanel} overflow-hidden`}>
          <div className="bg-gradient-to-l from-[#0b1d13] via-[#07140c] to-[#12351f] px-8 py-10 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-emerald-400/30 bg-white/10 text-5xl font-black shadow-2xl shadow-emerald-500/10">
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
                  <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm font-bold text-emerald-300">
                    כרטיס שחקן
                  </span>

                  <h1 className="mt-3 text-4xl font-black">
                    {profile.fullName}
                  </h1>

                  <p className="mt-2 text-sm text-slate-300">{profile.email}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-black text-slate-950">
                      דירוג {profile.rating || "לא דורג"}
                    </span>

                    {profile.goals >= 10 && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
                        ⚽ חלוץ מוביל
                      </span>
                    )}

                    {profile.assists >= 5 && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
                        🎯 פליימייקר
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 px-8 py-5 text-center backdrop-blur">
                <p className="text-sm text-slate-300">מספר חולצה</p>
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
                className={secondaryButton}
              >
                {isEditing ? "סגור עריכה" : "ערוך כרטיס שחקן"}
              </button>
            </div>

            {isEditing && (
              <form
                onSubmit={handleUpdateProfile}
                className={`${softCard} mb-8 grid gap-3 p-4 md:grid-cols-3`}
              >
                <input
                  type="number"
                  name="shirtNumber"
                  value={editForm.shirtNumber}
                  onChange={handleEditChange}
                  placeholder="מספר חולצה"
                  className={input}
                />

                <input
                  type="text"
                  name="position"
                  value={editForm.position}
                  onChange={handleEditChange}
                  placeholder="עמדה"
                  className={input}
                />

                <input
                  type="text"
                  name="image"
                  value={editForm.image}
                  onChange={handleEditChange}
                  placeholder="קישור לתמונה"
                  className={input}
                />

                <button
                  type="submit"
                  disabled={saving}
                  className={`${primaryButton} md:col-span-3`}
                >
                  {saving ? "שומר..." : "שמור שינויים"}
                </button>
              </form>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <ProfileStat
                icon="🎯"
                value={profile.position || "-"}
                label="עמדה"
              />
              <ProfileStat icon="⚽" value={profile.goals || 0} label="שערים" />
              <ProfileStat
                icon="🅰️"
                value={profile.assists || 0}
                label="בישולים"
              />
              <ProfileStat
                icon="🟦"
                value={profile.blueCards || 0}
                label="כרטיסים כחולים"
              />
              <ProfileStat
                icon="🏟️"
                value={profile.gamesPlayed || 0}
                label="משחקים"
              />
            </div>

            <div className={`${softCard} mt-8 p-6`}>
              <h2 className="text-xl font-black text-white">הליגות שלי</h2>

              {profile.leagues?.length ? (
                <div className="mt-4 space-y-3">
                  {profile.leagues.map((league) => (
                    <div
                      key={league.leagueId}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-white">
                            {league.leagueName}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {league.teamName}
                          </p>
                        </div>

                        {league.isCaptain && (
                          <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-black text-slate-950">
                            👑 קפטן
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <MiniStat value={league.goals} label="שערים" />
                        <MiniStat value={league.assists} label="בישולים" />
                        <MiniStat value={league.blueCards} label="כחולים" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-slate-400">
                  השחקן עדיין לא משחק באף ליגה
                </p>
              )}
            </div>

            <div className={`${softCard} mt-8 p-6`}>
              <h2 className="text-xl font-black text-white">מידע שחקן</h2>

              <div className="mt-5 space-y-3 text-sm">
                <InfoRow label="שם מלא" value={profile.fullName} />
                <InfoRow label="אימייל" value={profile.email} />
                <InfoRow label="דירוג" value={profile.rating || "לא דורג"} />
                <InfoRow
                  label="מספר חולצה"
                  value={profile.shirtNumber || "לא נקבע"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileStat({ icon, value, label }) {
  return (
    <div className={statCard}>
      <div className="text-3xl">{icon}</div>
      <p className="mt-2 text-4xl font-black text-white">{value}</p>
      <p className="text-sm font-bold text-slate-400">{label}</p>
    </div>
  );
}

function MiniStat({ value, label }) {
  return (
    <div className="rounded-xl bg-white/[0.06] p-3">
      <p className="text-2xl font-black text-white">{value || 0}</p>
      <p className="text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}
