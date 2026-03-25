"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function NotificationsPage() {
  const { currentUser, isLoaded } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyLeagues = async () => {
    try {
      const res = await fetch("/api/leagues/my", {
        credentials: "include",
      });

      const data = await res.json();

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

  useEffect(() => {
    if (!isLoaded) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    if (currentUser.role !== "manager") {
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
            <Link
              key={request._id}
              href={`/leagues/${request.leagueId}`}
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

              <p className="text-sm text-gray-700">{request.playerEmail}</p>

              <p className="mt-1 text-sm text-gray-500">
                רוצה להצטרף לקבוצה: {request.teamName}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
