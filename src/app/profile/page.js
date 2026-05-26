"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  useEffect(() => {
    const findPlayerProfile = async () => {
      try {
        const res = await fetch("/api/leagues", {
          credentials: "include",
        });

        const leagues = await res.json();

        if (!res.ok) {
          return;
        }

        for (const league of leagues) {
          for (const team of league.teams || []) {
            const player = team.players?.find(
              (player) =>
                player.email?.trim().toLowerCase() ===
                currentUser?.email?.trim().toLowerCase()
            );

            if (player) {
              router.push(
                `/leagues/${league._id || league.id}/players/${player.playerId}`
              );
              return;
            }
          }
        }

        alert("לא נמצא כרטיס שחקן");
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    if (currentUser?.email) {
      findPlayerProfile();
    }
  }, [currentUser, router]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-gray-500">טוען פרופיל...</p>
    </main>
  );
}
