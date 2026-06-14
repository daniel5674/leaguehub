"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  pageBg,
  pageGlow,
  card,
  softCard,
  secondaryButton,
  primaryButton,
  dangerButton,
  statCard,
} from "@/lib/uiStyles";

export default function PlayerPage() {
  const { id, playerId } = useParams();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");

  const router = useRouter();
  const { currentUser } = useAuth();

  const [league, setLeague] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [publicUser, setPublicUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [friendMessage, setFriendMessage] = useState("");

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const res = await fetch(`/api/leagues/${id}`, {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          setLeague(null);
          return;
        }

        setLeague(data);

        let foundPlayer = null;
        let foundTeam = null;

        if (data.leagueType === "personal") {
          foundPlayer = data.personalPlayers?.find(
            (player) => String(player._id) === String(playerId)
          );

          if (foundPlayer) {
            foundTeam = {
              name: "ליגה אישית",
            };
          }
        } else {
          data.teams?.forEach((team) => {
            const player = team.players?.find(
              (player) => String(player.playerId) === String(playerId)
            );

            if (player) {
              foundPlayer = player;
              foundTeam = team;
            }
          });
        }

        if (!foundPlayer && requestId) {
          const joinRequest = data.joinRequests?.find(
            (request) =>
              String(request._id) === String(requestId) &&
              String(request.playerId) === String(playerId)
          );

          if (joinRequest) {
            foundPlayer = {
              playerId: joinRequest.playerId,
              email: joinRequest.playerEmail,
              fullName: joinRequest.playerName,
              isPendingRequest: true,
              requestId: joinRequest._id,
            };

            foundTeam = {
              name: joinRequest.teamName || "בקשת הצטרפות",
            };
          }
        }

        if (foundPlayer) {
          let globalProfile = null;

          try {
            const profileRes = await fetch("/api/player-profile/by-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                email: foundPlayer.email,
              }),
            });

            const profileData = await profileRes.json();

          if (profileRes.ok) {
            globalProfile = profileData;

            if (profileData.userId) {
              try {
                const userRes = await fetch(`/api/users/${profileData.userId}`, {
                  credentials: "include",
                  cache: "no-store",
                });
                const userData = await userRes.json();
                if (userRes.ok) setPublicUser(userData);
              } catch (error) {
                console.error("Failed to fetch public user:", error);
              }
            }
          }
          } catch (error) {
            console.error("Failed to fetch global player profile:", error);
          }
          const playerGoals =
            data.topScorers?.find(
              (scorer) =>
                scorer.playerName?.trim().toLowerCase() ===
                  foundPlayer.fullName?.trim().toLowerCase() &&
                scorer.teamName?.trim().toLowerCase() ===
                  foundTeam.name?.trim().toLowerCase()
            )?.goals || 0;

          const playerAssists =
            data.topAssists?.find(
              (assist) =>
                assist.playerName?.trim().toLowerCase() ===
                  foundPlayer.fullName?.trim().toLowerCase() &&
                assist.teamName?.trim().toLowerCase() ===
                  foundTeam.name?.trim().toLowerCase()
            )?.assists || 0;

          const playerBlueCards =
            data.matches?.reduce((total, match) => {
              const cardsCount =
                match.blueCards?.filter(
                  (card) =>
                    String(card.playerId) === String(foundPlayer.playerId)
                ).length || 0;

              return total + cardsCount;
            }, 0) || 0;

          console.log("GLOBAL PROFILE:", globalProfile);
          console.log("GLOBAL PROFILE RATING:", globalProfile?.rating);

          setPlayerData({
            ...foundPlayer,
            image: globalProfile?.image || foundPlayer.image || "",
            shirtNumber:
              globalProfile?.shirtNumber || foundPlayer.shirtNumber || "",
            position: globalProfile?.position || foundPlayer.position || "",
            rating: globalProfile?.rating || foundPlayer.rating || "D",
            teamName: foundTeam.name,
            goals: playerGoals,
            assists: playerAssists,
            blueCards: playerBlueCards,
            mvpAwards: foundPlayer.mvpAwards || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch player:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && playerId) {
      fetchLeague();
    }
  }, [id, playerId, requestId]);

  const handleToggleCaptain = async () => {
    const newCaptainState = !playerData.isCaptain;

    try {
      const res = await fetch(`/api/leagues/${id}/teams/captain`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          teamName: playerData.teamName,
          playerEmail: playerData.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "שגיאה במינוי קפטן");
        return;
      }

      setPlayerData((prev) => ({ ...prev, isCaptain: newCaptainState }));
      router.refresh();
    } catch (error) {
      console.error("Toggle captain failed:", error);
      alert("שגיאה במינוי קפטן");
    }
  };

  const handleJoinRequest = async (action) => {
    try {
      const res = await fetch(`/api/leagues/${id}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "שגיאה בעדכון הבקשה");
        return;
      }

      router.push("/notifications");
    } catch (error) {
      console.error("Failed to update join request:", error);
      alert("שגיאה בעדכון הבקשה");
    }
  };

  const runFriendAction = async (url, options) => {
    try {
      setFriendActionLoading(true);
      setFriendMessage("");
      const res = await fetch(url, {
        credentials: "include",
        ...options,
        headers: options?.body ? { "Content-Type": "application/json" } : {},
      });
      const data = await res.json();
      setFriendMessage(data.message || "");
      if (!res.ok) return;

      if (options.method === "POST") {
        setPublicUser((current) => ({
          ...current,
          friendship: {
            id: data.id,
            status: "pending",
            direction: "outgoing",
          },
        }));
      } else if (options.method === "DELETE") {
        setPublicUser((current) => ({ ...current, friendship: null }));
      } else if (options.body?.includes("accept")) {
        setPublicUser((current) => ({
          ...current,
          friendship: { ...current.friendship, status: "accepted" },
        }));
      } else {
        setPublicUser((current) => ({ ...current, friendship: null }));
      }
    } catch (error) {
      console.error("Friend action failed:", error);
      setFriendMessage("משהו השתבש, נסה שוב");
    } finally {
      setFriendActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main dir="rtl" className={pageBg}>
        <div className={pageGlow}>
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="absolute bottom-0 left-1/2 h-[420px] w-[760px] -translate-x-1/2 opacity-5">
            <div className="absolute bottom-0 h-full w-full rounded-t-[380px] border-4 border-white" />
            <div className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-white" />
            <div className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full border-4 border-white" />
            <div className="absolute bottom-0 left-1/2 h-52 w-80 -translate-x-1/2 border-4 border-white" />
          </div>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <p className="text-slate-300">טוען שחקן...</p>
        </div>
      </main>
    );
  }

  if (!league || !playerData) {
    return (
      <main dir="rtl" className={pageBg}>
        <div className={pageGlow}>
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl rounded-3xl border border-red-400/20 bg-red-500/10 p-6">
          <p className="font-bold text-red-300">השחקן לא נמצא</p>
        </div>
      </main>
    );
  }

  const canManage =
    currentUser &&
    (String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser._id || currentUser.id));

  return (
    <main dir="rtl" className={pageBg}>
      <div className={pageGlow}>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.push(`/leagues/${id}`)}
          className={`${secondaryButton} mb-6 text-sm`}
        >
          חזרה לליגה
        </button>

        <section className={`${card} relative overflow-hidden`}>
          <div className={pageGlow}>
            <div className="absolute bottom-0 left-1/2 h-[700px] w-[1200px] -translate-x-1/2 opacity-[0.06]">
              <div className="absolute bottom-0 h-full w-full rounded-t-[500px] border-4 border-white" />
              <div className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-white" />
              <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full border-4 border-white" />
              <div className="absolute bottom-0 left-1/2 h-72 w-[420px] -translate-x-1/2 border-4 border-white" />
            </div>
          </div>

          <div className="relative bg-gradient-to-l from-black via-slate-900 to-slate-800 px-6 py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_35%)]" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-4xl font-black">
                  {playerData.image ? (
                    <img
                      src={playerData.image}
                      alt={playerData.fullName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    playerData.fullName?.charAt(0) || "?"
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-emerald-300">
                    פרופיל שחקן
                  </p>

                  {publicUser?.id ? (
                    <Link
                      href={`/users/${publicUser.id}`}
                      className="mt-1 block text-3xl font-black underline decoration-emerald-300/40 underline-offset-8 transition hover:text-emerald-300 md:text-4xl"
                    >
                      {playerData.fullName}
                    </Link>
                  ) : (
                    <h1 className="mt-1 text-3xl font-black md:text-4xl">
                      {playerData.fullName}
                    </h1>
                  )}

                  <p className="mt-2 text-sm text-slate-300">
                    {playerData.email}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {league.name} • {playerData.teamName}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-purple-500/90 px-3 py-1 text-xs font-black text-white">
                      דירוג {playerData.rating || "לא דורג"}
                    </span>

                    {playerData.isCaptain && (
                      <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-slate-950">
                        👑 קפטן
                      </span>
                    )}

                    {playerData.goals >= 10 && (
                      <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950">
                        ⚽ חלוץ מוביל
                      </span>
                    )}

                    {playerData.assists >= 5 && (
                      <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-black text-white">
                        🎯 פליימייקר
                      </span>
                    )}
                  </div>

                  {publicUser && !publicUser.isCurrentUser && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {!publicUser.friendship && (
                        <button
                          type="button"
                          disabled={friendActionLoading}
                          onClick={() =>
                            runFriendAction("/api/friends", {
                              method: "POST",
                              body: JSON.stringify({
                                recipientId: publicUser.id,
                              }),
                            })
                          }
                          className={primaryButton}
                        >
                          שלח בקשת חברות
                        </button>
                      )}

                      {publicUser.friendship?.status === "pending" &&
                        publicUser.friendship.direction === "outgoing" && (
                          <button
                            type="button"
                            disabled={friendActionLoading}
                            onClick={() =>
                              runFriendAction(
                                `/api/friends/${publicUser.friendship.id}`,
                                { method: "DELETE" }
                              )
                            }
                            className={secondaryButton}
                          >
                            בקשה נשלחה - בטל
                          </button>
                        )}

                      {publicUser.friendship?.status === "pending" &&
                        publicUser.friendship.direction === "incoming" && (
                          <>
                            <button
                              type="button"
                              disabled={friendActionLoading}
                              onClick={() =>
                                runFriendAction(
                                  `/api/friends/${publicUser.friendship.id}`,
                                  {
                                    method: "PATCH",
                                    body: JSON.stringify({ action: "accept" }),
                                  }
                                )
                              }
                              className={primaryButton}
                            >
                              אשר בקשת חברות
                            </button>
                            <button
                              type="button"
                              disabled={friendActionLoading}
                              onClick={() =>
                                runFriendAction(
                                  `/api/friends/${publicUser.friendship.id}`,
                                  {
                                    method: "PATCH",
                                    body: JSON.stringify({ action: "reject" }),
                                  }
                                )
                              }
                              className={secondaryButton}
                            >
                              דחה
                            </button>
                          </>
                        )}

                      {publicUser.friendship?.status === "accepted" && (
                        <>
                          <Link href="/friends" className={primaryButton}>
                            חברים
                          </Link>
                          <button
                            type="button"
                            disabled={friendActionLoading}
                            onClick={() =>
                              runFriendAction(
                                `/api/friends/${publicUser.friendship.id}`,
                                { method: "DELETE" }
                              )
                            }
                            className={secondaryButton}
                          >
                            הסר חבר
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {friendMessage && (
                    <p className="mt-3 text-sm font-bold text-emerald-200">
                      {friendMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-4 text-center backdrop-blur">
                <p className="text-xs text-slate-300">מספר חולצה</p>
                <p className="text-4xl font-black">
                  {playerData.shirtNumber || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-6">
            {canManage && (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {!playerData.isCaptain && (
                  <button
                    type="button"
                    onClick={handleToggleCaptain}
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/20"
                  >
                    הגדר כקפטן
                  </button>
                )}

                {playerData.isCaptain && (
                  <>
                    <span className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                      ★ קפטן
                    </span>

                    <button
                      type="button"
                      onClick={handleToggleCaptain}
                      className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                    >
                      הסר קפטן
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <div className={`${statCard} p-4`}>
                <div className="text-2xl">🏆</div>
                <p className="mt-2 truncate text-xl font-black text-white">
                  {playerData.teamName}
                </p>
                <p className="text-xs text-slate-400">קבוצה</p>
              </div>

              <div className={`${statCard} p-4`}>
                <div className="text-2xl">🎯</div>
                <p className="mt-2 truncate text-xl font-black text-white">
                  {playerData.position || "-"}
                </p>
                <p className="text-xs text-slate-400">עמדה</p>
              </div>

              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <div className="text-2xl">⚽</div>
                <p className="mt-2 text-3xl font-black text-emerald-300">
                  {playerData.goals}
                </p>
                <p className="text-xs text-slate-400">שערים</p>
              </div>

              <div className="rounded-3xl border border-indigo-400/20 bg-indigo-400/10 p-4">
                <div className="text-2xl">🅰️</div>
                <p className="mt-2 text-3xl font-black text-indigo-300">
                  {playerData.assists}
                </p>
                <p className="text-xs text-slate-400">בישולים</p>
              </div>

              <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                <div className="text-2xl">⭐</div>
                <p className="mt-2 text-3xl font-black text-yellow-300">
                  {playerData.mvpAwards || 0}
                </p>
                <p className="text-xs text-slate-400">MVP</p>
              </div>

              <div className="rounded-3xl border border-blue-400/20 bg-blue-400/10 p-4">
                <div className="text-2xl">🟦</div>
                <p className="mt-2 text-3xl font-black text-blue-300">
                  {playerData.blueCards || 0}
                </p>
                <p className="text-xs text-slate-400">כרטיסים כחולים</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/25 bg-[#173326]/65 p-6 backdrop-blur-md">
                <h2 className="text-xl font-black">מידע שחקן</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                    <span className="text-slate-400">שם מלא</span>
                    <span className="font-bold text-white">
                      {playerData.fullName}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                    <span className="text-slate-400">אימייל</span>
                    <span className="font-bold text-white">
                      {playerData.email}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                    <span className="text-slate-400">ליגה</span>
                    <span className="font-bold text-white">{league.name}</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">מספר חולצה</span>
                    <span className="font-bold text-white">
                      {playerData.shirtNumber || "לא נקבע"}
                    </span>
                  </div>
                </div>
              </div>

              {canManage && requestId && playerData.isPendingRequest && (
                <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">
                  <h2 className="text-xl font-black text-yellow-300">
                    בקשת הצטרפות ממתינה
                  </h2>

                  <p className="mt-2 text-sm text-yellow-100/80">
                    השחקן ביקש להצטרף ל־{playerData.teamName}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => handleJoinRequest("approve")}
                      className={`${primaryButton} py-3`}
                    >
                      אשר
                    </button>

                    <button
                      type="button"
                      onClick={() => handleJoinRequest("reject")}
                      className={`${secondaryButton} py-3`}
                    >
                      דחה
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const confirmed = window.confirm(
                          "השחקן לא יוכל לשלוח בקשות נוספות לליגה עד לביטול החסימה. להמשיך?"
                        );
                        if (confirmed) handleJoinRequest("permanent-block");
                      }}
                      className={`${dangerButton} py-3`}
                    >
                      חסימה קבועה
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
