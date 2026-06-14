"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  pageBg,
  pageGlow,
  card,
  softCard,
  primaryButton,
  secondaryButton,
} from "@/lib/uiStyles";

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok) setUser(data);
      } catch (error) {
        console.error("Failed to load user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  const runFriendAction = async (url, options) => {
    try {
      setFriendActionLoading(true);
      setMessage("");
      const res = await fetch(url, {
        credentials: "include",
        ...options,
        headers: options?.body ? { "Content-Type": "application/json" } : {},
      });
      const data = await res.json();
      setMessage(data.message || "");
      if (!res.ok) return;

      if (options.method === "POST") {
        setUser((current) => ({
          ...current,
          friendship: {
            id: data.id,
            status: "pending",
            direction: "outgoing",
          },
        }));
      } else if (options.method === "DELETE") {
        setUser((current) => ({ ...current, friendship: null }));
      } else if (options.body?.includes("accept")) {
        setUser((current) => ({
          ...current,
          friendship: { ...current.friendship, status: "accepted" },
        }));
      } else {
        setUser((current) => ({ ...current, friendship: null }));
      }
    } catch (error) {
      console.error("Friend action failed:", error);
      setMessage("משהו השתבש, נסה שוב");
    } finally {
      setFriendActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main dir="rtl" className={pageBg}>
        <p className="relative mx-auto max-w-5xl text-slate-300">טוען משתמש...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main dir="rtl" className={pageBg}>
        <div className={`${softCard} relative mx-auto max-w-5xl p-6 text-red-300`}>
          המשתמש לא נמצא
        </div>
      </main>
    );
  }

  const playerCardMembership = user.memberships.find(
    (membership) => membership.playerId
  );
  const playerCardHref = playerCardMembership
    ? `/leagues/${playerCardMembership.leagueId}/players/${playerCardMembership.playerId}`
    : "";

  return (
    <main dir="rtl" className={pageBg}>
      <div className={pageGlow}>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className={`${secondaryButton} mb-6`}
        >
          חזרה
        </button>

        <section className={`${card} overflow-hidden`}>
          <div className="flex flex-col items-center gap-5 bg-gradient-to-l from-[#0b1d13] to-[#12351f] p-8 text-center text-white">
            <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-400/30 bg-white/10 text-4xl font-black">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.fullName}
                  fill
                  sizes="112px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                user.fullName?.charAt(0) || "?"
              )}
            </div>

            <div>
              <span className="rounded-full bg-emerald-400/15 px-4 py-1 text-sm font-bold text-emerald-300">
                {user.role === "player" ? "שחקן רשום" : "מנהל רשום"}
              </span>
              {playerCardHref ? (
                <Link
                  href={playerCardHref}
                  className="mt-3 block text-3xl font-black underline decoration-emerald-300/40 underline-offset-8 transition hover:text-emerald-300"
                >
                  {user.fullName}
                </Link>
              ) : (
                <h1 className="mt-3 text-3xl font-black">{user.fullName}</h1>
              )}
              {user.position && (
                <p className="mt-2 text-sm text-slate-300">
                  עמדה: {user.position}
                </p>
              )}

              {!user.isCurrentUser && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {!user.friendship && (
                    <button
                      type="button"
                      disabled={friendActionLoading}
                      onClick={() =>
                        runFriendAction("/api/friends", {
                          method: "POST",
                          body: JSON.stringify({ recipientId: user.id }),
                        })
                      }
                      className={primaryButton}
                    >
                      שלח בקשת חברות
                    </button>
                  )}

                  {user.friendship?.status === "pending" &&
                    user.friendship.direction === "outgoing" && (
                      <button
                        type="button"
                        disabled={friendActionLoading}
                        onClick={() =>
                          runFriendAction(`/api/friends/${user.friendship.id}`, {
                            method: "DELETE",
                          })
                        }
                        className={secondaryButton}
                      >
                        בקשה נשלחה - בטל
                      </button>
                    )}

                  {user.friendship?.status === "pending" &&
                    user.friendship.direction === "incoming" && (
                      <>
                        <button
                          type="button"
                          disabled={friendActionLoading}
                          onClick={() =>
                            runFriendAction(
                              `/api/friends/${user.friendship.id}`,
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
                              `/api/friends/${user.friendship.id}`,
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

                  {user.friendship?.status === "accepted" && (
                    <>
                      <Link href="/friends" className={primaryButton}>
                        חברים
                      </Link>
                      <button
                        type="button"
                        disabled={friendActionLoading}
                        onClick={() =>
                          runFriendAction(`/api/friends/${user.friendship.id}`, {
                            method: "DELETE",
                          })
                        }
                        className={secondaryButton}
                      >
                        הסר חבר
                      </button>
                    </>
                  )}
                </div>
              )}

              {message && (
                <p className="mt-3 text-sm font-bold text-emerald-200">
                  {message}
                </p>
              )}
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-black text-white">ליגות וקבוצות</h2>

            {user.memberships.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-6 text-center text-slate-400">
                המשתמש עדיין לא הצטרף לליגה
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {user.memberships.map((membership) => (
                  <Link
                    key={String(membership.leagueId)}
                    href={`/leagues/${membership.leagueId}`}
                    className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/[0.05] p-4 transition hover:border-emerald-300/50 hover:bg-white/[0.09]"
                  >
                    <span className="font-black text-white">
                      {membership.leagueName}
                    </span>
                    <span className="text-sm text-slate-400">
                      {membership.teamName}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
