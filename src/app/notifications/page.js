"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function NotificationsPage() {
  const { currentUser, isLoaded } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchMyLeagues = async () => {
    try {
      const res = await fetch("/api/leagues/my", {
        credentials: "include",
      });

      const data = await res.json();

      console.log("MY LEAGUES DATA:", data);

      if (!res.ok) {
        setLeagues([]);
        return;
      }

      setLeagues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch notifications leagues:", error);
      setLeagues([]);
    } finally {
      setLoading(false);
    }
  };

  const openPlayerProfile = async (request) => {
    setSelectedRequest(request);
    setSelectedProfile(null);
    setProfileLoading(true);

    try {
      const res = await fetch("/api/player-profile/by-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: request.playerEmail,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        console.log("Player profile error:", data);
        setSelectedProfile(null);
        return;
      }

      setSelectedProfile(data);
    } catch (error) {
      console.error("Failed to load player profile:", error);
      setSelectedProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleJoinRequest = async (request, action) => {
    try {
      const res = await fetch(
        `/api/leagues/${request.leagueId}/join-requests/${request._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ action }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "שגיאה בעדכון הבקשה");
        return;
      }

      setSelectedRequest(null);
      setSelectedProfile(null);
      await fetchMyLeagues();
    } catch (error) {
      console.error("Failed to update join request:", error);
      alert("שגיאה בעדכון הבקשה");
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!currentUser || currentUser.role !== "manager") {
      setLoading(false);
      return;
    }

    fetchMyLeagues();
  }, [currentUser, isLoaded]);

  const pendingRequests = useMemo(() => {
    return leagues.flatMap((league) =>
      (league.joinRequests || [])
        .filter((request) => request.status === "pending")
        .map((request) => ({
          ...request,
          leagueId: league.id || league._id,
          leagueName: league.name,
        }))
    );
  }, [leagues]);

  console.log("PENDING REQUESTS:", pendingRequests);

  if (!isLoaded || loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-gray-500">טוען התראות...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-red-500">צריך להתחבר כדי לראות התראות</p>
      </main>
    );
  }

  if (currentUser.role !== "manager") {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-red-500">רק מנהל יכול לראות התראות</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">התראות</h1>
          <p className="mt-2 text-gray-500">בקשות הצטרפות ממתינות לליגות שלך</p>
        </div>

        <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
          {pendingRequests.length} ממתינות
        </span>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          אין התראות חדשות
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingRequests.map((request) => (
            <div
              key={request._id}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {request.leagueName}
                </h2>

                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">
                  ממתינה
                </span>
              </div>

              <p className="text-sm font-semibold text-gray-700">
                {request.playerName || request.playerEmail}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                רוצה להצטרף לקבוצה: {request.teamName}
              </p>

              <button
                onClick={() => openPlayerProfile(request)}
                className="mt-5 rounded-2xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                הצג פרטי שחקן
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">כרטיס שחקן</h2>

              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setSelectedProfile(null);
                }}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-600 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {profileLoading ? (
              <p className="py-10 text-center text-gray-500">
                טוען כרטיס שחקן...
              </p>
            ) : (
              <>
                <div className="rounded-[1.5rem] bg-gradient-to-br from-gray-900 to-gray-700 p-6 text-center text-white">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl font-black text-gray-900">
                    {(
                      selectedProfile?.fullName ||
                      selectedRequest.playerName ||
                      "?"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <h3 className="text-2xl font-black">
                    {selectedProfile?.fullName ||
                      selectedRequest.playerName ||
                      "שם שחקן לא קיים"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-300">
                    {selectedProfile?.email || selectedRequest.playerEmail}
                  </p>

                  <div className="mt-5 inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-bold">
                    דירוג {selectedProfile?.rating || "D"}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-gray-100 p-4">
                    <p className="text-2xl font-black">
                      {selectedProfile?.goals || 0}
                    </p>
                    <p className="text-xs text-gray-500">שערים</p>
                  </div>

                  <div className="rounded-2xl bg-gray-100 p-4">
                    <p className="text-2xl font-black">
                      {selectedProfile?.assists || 0}
                    </p>
                    <p className="text-xs text-gray-500">בישולים</p>
                  </div>

                  <div className="rounded-2xl bg-gray-100 p-4">
                    <p className="text-2xl font-black">
                      {selectedProfile?.gamesPlayed || 0}
                    </p>
                    <p className="text-xs text-gray-500">משחקים</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-gray-100 p-4 text-right">
                  <p className="text-xs text-gray-500">קבוצה מבוקשת</p>
                  <p className="font-bold text-gray-900">
                    {selectedRequest.teamName}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      handleJoinRequest(selectedRequest, "approve")
                    }
                    className="rounded-2xl bg-green-600 py-3 font-bold text-white hover:bg-green-700"
                  >
                    אשר
                  </button>

                  <button
                    onClick={() => handleJoinRequest(selectedRequest, "reject")}
                    className="rounded-2xl bg-red-600 py-3 font-bold text-white hover:bg-red-700"
                  >
                    דחה
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
