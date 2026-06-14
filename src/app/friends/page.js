"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  card,
  input,
  pageBg,
  pageGlow,
  primaryButton,
  secondaryButton,
  softCard,
} from "@/lib/uiStyles";

const emptyData = {
  friends: [],
  incoming: [],
  outgoing: [],
  suggestions: [],
};

function PersonCard({ item, actions }) {
  const user = item.user || item;

  return (
    <article className={`${softCard} flex flex-col gap-4 p-4 sm:flex-row sm:items-center`}>
      <Link
        href={`/users/${user.id}`}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-300/30 bg-white/10 text-xl font-black text-white">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.fullName}
              fill
              sizes="56px"
              className="object-cover"
              unoptimized
            />
          ) : (
            user.fullName?.charAt(0) || "?"
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-black text-white">{user.fullName}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {user.position ||
              (user.role === "player" ? "שחקן רשום" : "מנהל רשום")}
          </p>
        </div>
      </Link>

      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </article>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 p-8 text-center text-slate-400">
      {children}
    </div>
  );
}

export default function FriendsPage() {
  const { currentUser, isLoaded } = useAuth();
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const loadFriends = useCallback(async () => {
    try {
      const res = await fetch("/api/friends", {
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    loadFriends();
  }, [currentUser, isLoaded, loadFriends]);

  const runAction = async (key, url, options) => {
    try {
      setBusyId(key);
      setMessage("");
      const res = await fetch(url, {
        credentials: "include",
        ...options,
        headers: options?.body ? { "Content-Type": "application/json" } : {},
      });
      const result = await res.json();
      setMessage(result.message || "");
      if (res.ok) await loadFriends();
    } catch (error) {
      console.error("Friend action failed:", error);
      setMessage("משהו השתבש, נסה שוב");
    } finally {
      setBusyId("");
    }
  };

  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return data.suggestions;
    return data.suggestions.filter((user) =>
      `${user.fullName} ${user.position}`.toLowerCase().includes(normalizedQuery)
    );
  }, [data.suggestions, query]);

  if (!isLoaded || loading) {
    return (
      <main dir="rtl" className={pageBg}>
        <p className="relative mx-auto max-w-6xl text-slate-300">
          טוען חברים...
        </p>
      </main>
    );
  }

  if (!currentUser) return null;

  return (
    <main dir="rtl" className={pageBg}>
      <div className={pageGlow}>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <section className={`${card} mb-6 p-6 sm:p-8`}>
          <p className="text-sm font-black text-emerald-300">הקהילה שלך</p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            חברים
          </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            שלח בקשות חברות, אשר אנשים שאתה מכיר ושמור את הקבוצה שלך קרובה.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className={`${softCard} p-4`}>
              <p className="text-3xl font-black text-white">{data.friends.length}</p>
              <p className="text-sm text-slate-400">חברים</p>
            </div>
            <div className={`${softCard} p-4`}>
              <p className="text-3xl font-black text-white">{data.incoming.length}</p>
              <p className="text-sm text-slate-400">בקשות שמחכות לך</p>
            </div>
            <div className={`${softCard} p-4`}>
              <p className="text-3xl font-black text-white">{data.outgoing.length}</p>
              <p className="text-sm text-slate-400">בקשות ששלחת</p>
            </div>
          </div>
        </section>

        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 font-bold text-emerald-200">
            {message}
          </div>
        )}

        {data.incoming.length > 0 && (
          <section className={`${card} mb-6 p-6`}>
            <h2 className="mb-4 text-xl font-black text-white">בקשות חברות</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.incoming.map((item) => (
                <PersonCard
                  key={item.id}
                  item={item}
                  actions={
                    <>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() =>
                          runAction(item.id, `/api/friends/${item.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ action: "accept" }),
                          })
                        }
                        className={primaryButton}
                      >
                        אשר
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() =>
                          runAction(item.id, `/api/friends/${item.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ action: "reject" }),
                          })
                        }
                        className={secondaryButton}
                      >
                        דחה
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          </section>
        )}

        <section className={`${card} mb-6 p-6`}>
          <h2 className="mb-4 text-xl font-black text-white">החברים שלי</h2>
          {data.friends.length === 0 ? (
            <EmptyState>עדיין אין כאן חברים. אפשר להתחיל מהחיפוש למטה.</EmptyState>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.friends.map((item) => (
                <PersonCard
                  key={item.id}
                  item={item}
                  actions={
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() =>
                        runAction(item.id, `/api/friends/${item.id}`, {
                          method: "DELETE",
                        })
                      }
                      className={secondaryButton}
                    >
                      הסר חבר
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {data.outgoing.length > 0 && (
          <section className={`${card} mb-6 p-6`}>
            <h2 className="mb-4 text-xl font-black text-white">בקשות ששלחתי</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.outgoing.map((item) => (
                <PersonCard
                  key={item.id}
                  item={item}
                  actions={
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() =>
                        runAction(item.id, `/api/friends/${item.id}`, {
                          method: "DELETE",
                        })
                      }
                      className={secondaryButton}
                    >
                      בטל בקשה
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        <section className={`${card} p-6`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">מצא חברים חדשים</h2>
              <p className="mt-1 text-sm text-slate-400">
                חפש לפי שם או עמדה
              </p>
            </div>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="חיפוש אנשים..."
              className={`${input} w-full sm:max-w-xs`}
            />
          </div>

          {filteredSuggestions.length === 0 ? (
            <EmptyState>לא נמצאו משתמשים מתאימים.</EmptyState>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredSuggestions.map((user) => (
                <PersonCard
                  key={user.id}
                  item={user}
                  actions={
                    <button
                      type="button"
                      disabled={busyId === user.id}
                      onClick={() =>
                        runAction(user.id, "/api/friends", {
                          method: "POST",
                          body: JSON.stringify({ recipientId: user.id }),
                        })
                      }
                      className={primaryButton}
                    >
                      שלח בקשה
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
