"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { currentUser, isLoaded } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mx-auto max-w-md rounded-[2rem] border border-gray-200 bg-white p-6 shadow-lg">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-gray-900 to-gray-700 p-6 text-center text-white">
          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-white text-5xl font-black text-gray-900">
            {profile.fullName?.charAt(0) || "?"}
          </div>

          <h1 className="text-3xl font-black">{profile.fullName}</h1>
          <p className="mt-1 text-sm text-gray-300">{profile.email}</p>

          <div className="mt-5 inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-bold">
            דירוג {profile.rating || "D"}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-gray-100 p-4">
            <p className="text-2xl font-black">{profile.goals || 0}</p>
            <p className="text-xs text-gray-500">שערים</p>
          </div>

          <div className="rounded-2xl bg-gray-100 p-4">
            <p className="text-2xl font-black">{profile.assists || 0}</p>
            <p className="text-xs text-gray-500">בישולים</p>
          </div>

          <div className="rounded-2xl bg-gray-100 p-4">
            <p className="text-2xl font-black">{profile.gamesPlayed || 0}</p>
            <p className="text-xs text-gray-500">משחקים</p>
          </div>
        </div>
      </div>
    </main>
  );
}
