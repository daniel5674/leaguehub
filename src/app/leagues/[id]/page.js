"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function LeagueDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const { currentUser } = useAuth();
  const router = useRouter();

  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  const [teamName, setTeamName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [scoreForms, setScoreForms] = useState({});
  const [selectedTeam, setSelectedTeam] = useState("");
  const [squadInputs, setSquadInputs] = useState({});

  const [matchForm, setMatchForm] = useState({
    homeTeam: "",
    awayTeam: "",
    date: "",
    time: "",
    location: "",
  });
  const [matchSubmitting, setMatchSubmitting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    sport: "",
    location: "",
    description: "",
    status: "",
  });

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const openConfirmModal = ({ title, message, onConfirm }) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmState({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const fetchLeague = async () => {
    try {
      const res = await fetch(`/api/leagues/${id}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.message || "שגיאה בטעינת ליגה");
        setLeague(null);
        return;
      }

      setLeague(data);
    } catch (error) {
      console.error("Failed to fetch league:", error);
      setLeague(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchLeague();
  }, [id]);

  useEffect(() => {
    if (!league) return;

    setEditForm({
      name: league.name || "",
      sport: league.sport || "",
      location: league.location || "",
      description: league.description || "",
      status: league.status || "",
    });
  }, [league]);

  const handleRequestJoin = async () => {
    if (!selectedTeam) {
      showToast("צריך לבחור קבוצה", "error");
      return;
    }

    try {
      const res = await fetch(`/api/leagues/${id}/request-join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          teamName: selectedTeam,
        }),
      });

      const text = await res.text();
      console.log("REQUEST JOIN RESPONSE:", text);

      const data = JSON.parse(text);

      if (!res.ok) {
        showToast(data.message || "שגיאה בשליחת בקשה", "error");
        return;
      }

      setLeague(data);
      setSelectedTeam("");
      showToast("בקשת ההצטרפות נשלחה");
    } catch (error) {
      console.error("Request join failed:", error);
      showToast("שגיאה בשליחת בקשה", "error");
    }
  };

  const handleRequestCoach = async () => {
    if (!selectedTeam) {
      showToast("צריך לבחור קבוצה", "error");
      return;
    }

    try {
      const res = await fetch(`/api/leagues/${id}/request-coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          teamName: selectedTeam,
        }),
      });

      const data = await res.json();
      console.log("COACH REQUEST RESPONSE:", data);

      if (!res.ok) {
        showToast(data.message || "שגיאה בשליחת בקשת אימון", "error");
        return;
      }

      setLeague(data);
      setSelectedTeam("");
      showToast("בקשת האימון נשלחה");
    } catch (error) {
      console.error("Request coach failed:", error);
      showToast("שגיאה בשליחת בקשת אימון", "error");
    }
  };

  const handleRemoveCoach = async (teamName) => {
    try {
      const res = await fetch(`/api/leagues/${id}/coach`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          teamName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בהסרת מאמן", "error");
        return;
      }

      setLeague(data);
      closeConfirmModal();
      showToast("המאמן הוסר מהקבוצה");
    } catch (error) {
      console.error("Remove coach failed:", error);
      showToast("שגיאה בהסרת מאמן", "error");
    }
  };

  const handleApproveJoinRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/leagues/${id}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action: "approve" }),
      });

      const text = await res.text();
      console.log("APPROVE RESPONSE:", text);

      const data = JSON.parse(text);

      if (!res.ok) {
        showToast(data.message || "שגיאה באישור בקשה", "error");
        return;
      }

      setLeague(data);
      showToast("הבקשה אושרה");
    } catch (error) {
      console.error("Approve request failed:", error);
      showToast("שגיאה באישור בקשה", "error");
    }
  };

  const handleRejectJoinRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/leagues/${id}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ action: "reject" }),
      });

      const text = await res.text();
      console.log("REJECT RESPONSE:", text);

      const data = JSON.parse(text);

      if (!res.ok) {
        showToast(data.message || "שגיאה בדחיית בקשה", "error");
        return;
      }

      setLeague(data);
      showToast("הבקשה נדחתה");
    } catch (error) {
      console.error("Reject request failed:", error);
      showToast("שגיאה בדחיית בקשה", "error");
    }
  };

  const handleDeleteLeague = async () => {
    try {
      const res = await fetch(`/api/leagues/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה במחיקת ליגה", "error");
        return;
      }

      closeConfirmModal();
      showToast("הליגה נמחקה בהצלחה");
      router.push("/leagues");
    } catch (error) {
      console.error("Delete league failed:", error);
      showToast("שגיאה במחיקת ליגה", "error");
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) return;

    try {
      setSubmitting(true);

      const res = await fetch(`/api/leagues/${id}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          teamName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בהוספת קבוצה", "error");
        return;
      }

      setLeague(data);
      setTeamName("");
      showToast("הקבוצה נוספה");
    } catch (error) {
      console.error("Failed to add team:", error);
      showToast("שגיאה בהוספת קבוצה", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamToDelete) => {
    try {
      const res = await fetch(`/api/leagues/${id}/teams`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          teamName: teamToDelete,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה במחיקת קבוצה", "error");
        return;
      }

      setLeague(data);
      closeConfirmModal();
      showToast("הקבוצה נמחקה");
    } catch (error) {
      console.error("Failed to delete team:", error);
      showToast("שגיאה במחיקת קבוצה", "error");
    }
  };

  const handleMatchChange = (e) => {
    setMatchForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdateLeague = async (e) => {
    e.preventDefault();

    try {
      setEditSubmitting(true);

      const res = await fetch(`/api/leagues/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בעריכת ליגה", "error");
        return;
      }

      setLeague(data);
      setIsEditing(false);
      showToast("הליגה עודכנה");
    } catch (error) {
      console.error("Failed to update league:", error);
      showToast("שגיאה בעריכת ליגה", "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAddMatch = async (e) => {
    e.preventDefault();

    if (!matchForm.homeTeam || !matchForm.awayTeam) {
      showToast("צריך לבחור שתי קבוצות", "error");
      return;
    }

    if (matchForm.homeTeam === matchForm.awayTeam) {
      showToast("אי אפשר לבחור את אותה קבוצה פעמיים", "error");
      return;
    }

    if (!matchForm.date || !matchForm.time || !matchForm.location.trim()) {
      showToast("צריך למלא תאריך, שעה ומיקום", "error");
      return;
    }

    try {
      setMatchSubmitting(true);

      const res = await fetch(`/api/leagues/${id}/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...matchForm,
          location: matchForm.location.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בהוספת משחק", "error");
        return;
      }

      setLeague(data);
      setMatchForm({
        homeTeam: "",
        awayTeam: "",
        date: "",
        time: "",
        location: "",
      });
      showToast("המשחק נוסף");
    } catch (error) {
      console.error("Failed to add match:", error);
      showToast("שגיאה בהוספת משחק", "error");
    } finally {
      setMatchSubmitting(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      const res = await fetch(`/api/leagues/${id}/matches`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          matchId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה במחיקת משחק", "error");
        return;
      }

      setLeague(data);
      closeConfirmModal();
      showToast("המשחק נמחק");
    } catch (error) {
      console.error("Failed to delete match:", error);
      showToast("שגיאה במחיקת משחק", "error");
    }
  };

  const handleScoreChange = (matchId, field, value) => {
    setScoreForms((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }));
  };

  const handleSaveScore = async (matchId) => {
    const form = scoreForms[matchId];

    if (!form) {
      showToast("צריך להזין תוצאה", "error");
      return;
    }

    if (form.homeScore === "" || form.awayScore === "") {
      showToast("צריך למלא שתי תוצאות", "error");
      return;
    }

    try {
      const res = await fetch(`/api/leagues/${id}/matches`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          matchId,
          homeScore: Number(form.homeScore),
          awayScore: Number(form.awayScore),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בעדכון תוצאה", "error");
        return;
      }

      setLeague(data);

      setScoreForms((prev) => ({
        ...prev,
        [matchId]: {
          homeScore: "",
          awayScore: "",
        },
      }));

      showToast("התוצאה נשמרה");
    } catch (error) {
      console.error("Failed to save score:", error);
      showToast("שגיאה בעדכון תוצאה", "error");
    }
  };

  const handleRemovePlayer = async (playerEmail, teamName) => {
    try {
      const res = await fetch(`/api/leagues/${id}/players`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          playerEmail,
          teamName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בהסרת שחקן", "error");
        return;
      }

      setLeague(data);
      closeConfirmModal();
      showToast("השחקן הוסר מהקבוצה");
    } catch (error) {
      console.error("Remove player failed:", error);
      showToast("שגיאה בהסרת שחקן", "error");
    }
  };

  const handleAddToSquad = async (teamName) => {
    const playerName = squadInputs[teamName];

    if (!playerName?.trim()) return;

    try {
      const res = await fetch(`/api/leagues/${id}/squad`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          teamName,
          playerName: playerName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בהוספה", "error");
        return;
      }

      setLeague(data);
      setSquadInputs((prev) => ({ ...prev, [teamName]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromSquad = async (teamName, playerName) => {
    try {
      const res = await fetch(`/api/leagues/${id}/squad`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          teamName,
          playerName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה במחיקה", "error");
        return;
      }

      setLeague(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-gray-500">טוען ליגה...</p>
      </main>
    );
  }

  if (!league) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-red-500">הליגה לא נמצאה</p>
      </main>
    );
  }

  const currentUserId = currentUser?._id || currentUser?.id;

  const canManage =
    currentUser &&
    (String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUserId));

  const isOwner =
    currentUser &&
    (String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUserId));

  const normalizedCurrentEmail = currentUser?.email?.trim().toLowerCase();

  const isPlayer = currentUser?.role === "player";
  const isCoach = currentUser?.role === "coach";
  const isGuest = !currentUser;

  const alreadyInAnyTeam =
    !!normalizedCurrentEmail &&
    Array.isArray(league.teams) &&
    league.teams.some((team) =>
      team.players?.some(
        (player) =>
          player.email?.trim().toLowerCase() === normalizedCurrentEmail
      )
    );

  const alreadyCoachInLeague =
    !!normalizedCurrentEmail &&
    Array.isArray(league.teams) &&
    league.teams.some(
      (team) => team.coachEmail?.trim().toLowerCase() === normalizedCurrentEmail
    );

  const hasPendingJoinRequest =
    !!normalizedCurrentEmail &&
    Array.isArray(league.joinRequests) &&
    league.joinRequests.some(
      (request) =>
        request.type === "player" &&
        request.playerEmail?.trim().toLowerCase() === normalizedCurrentEmail &&
        request.status === "pending"
    );

  const hasPendingCoachRequest =
    !!normalizedCurrentEmail &&
    Array.isArray(league.joinRequests) &&
    league.joinRequests.some(
      (request) =>
        request.type === "coach" &&
        request.playerEmail?.trim().toLowerCase() === normalizedCurrentEmail &&
        request.status === "pending"
    );

  const isPlayerInSquad = (teamName, playerName) => {
    const team = league.teams?.find(
      (t) => t.name?.trim().toLowerCase() === teamName?.trim().toLowerCase()
    );

    if (!team || !team.squad) return false;

    return team.squad.some(
      (name) => name.trim().toLowerCase() === playerName?.trim().toLowerCase()
    );
  };

  const coachTeams =
    Array.isArray(league.teams) && normalizedCurrentEmail
      ? league.teams.filter(
          (team) =>
            team.coachEmail?.trim().toLowerCase() === normalizedCurrentEmail
        )
      : [];

  const canReviewRequests = canManage || coachTeams.length > 0;

  const visibleJoinRequests = Array.isArray(league.joinRequests)
    ? league.joinRequests.filter((request) => {
        if (request.status !== "pending") return false;

        if (canManage) {
          return request.type === "coach";
        }

        return coachTeams.some(
          (team) =>
            team.name?.trim().toLowerCase() ===
            request.teamName?.trim().toLowerCase()
        );
      })
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{league.name}</h1>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
              {league.status}
            </span>

            {currentUser &&
              isPlayer &&
              !isOwner &&
              !alreadyInAnyTeam &&
              !hasPendingJoinRequest && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                  >
                    <option value="">בחר קבוצה</option>
                    {league.teams.map((team) => (
                      <option key={team._id || team.name} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleRequestJoin}
                    className="rounded-xl bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
                  >
                    שלח בקשה
                  </button>
                </div>
              )}

            {currentUser &&
              isCoach &&
              !isOwner &&
              !alreadyCoachInLeague &&
              !hasPendingCoachRequest && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                  >
                    <option value="">בחר קבוצה</option>
                    {league.teams.map((team) => (
                      <option key={team._id || team.name} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleRequestCoach}
                    className="rounded-xl bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
                  >
                    שלח בקשת אימון
                  </button>
                </div>
              )}

            {currentUser && isCoach && hasPendingCoachRequest && (
              <span className="rounded-xl bg-yellow-100 px-4 py-2 text-sm text-yellow-700">
                בקשת האימון ממתינה לאישור
              </span>
            )}

            {currentUser && isCoach && alreadyCoachInLeague && (
              <span className="rounded-xl bg-green-100 px-4 py-2 text-sm text-green-700">
                אתה כבר מאמן קבוצה בליגה
              </span>
            )}

            {currentUser && isPlayer && hasPendingJoinRequest && (
              <span className="rounded-xl bg-yellow-100 px-4 py-2 text-sm text-yellow-700">
                בקשה ממתינה לאישור
              </span>
            )}

            {currentUser && isPlayer && alreadyInAnyTeam && (
              <span className="rounded-xl bg-green-100 px-4 py-2 text-sm text-green-700">
                אתה כבר משויך לקבוצה בליגה
              </span>
            )}

            {canManage && (
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className="rounded-xl bg-gray-800 px-4 py-2 text-sm text-white transition hover:bg-black"
              >
                {isEditing ? "סגור עריכה" : "ערוך ליגה"}
              </button>
            )}

            {canManage && (
              <button
                type="button"
                onClick={() =>
                  openConfirmModal({
                    title: "מחיקת ליגה",
                    message: "אתה בטוח שאתה רוצה למחוק את הליגה?",
                    onConfirm: handleDeleteLeague,
                  })
                }
                className="rounded-xl bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600"
              >
                מחק ליגה
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">ספורט</p>
            <p className="mt-1 font-medium">{league.sport}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">מיקום</p>
            <p className="mt-1 font-medium">{league.location}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">מספר קבוצות</p>
            <p className="mt-1 font-medium">{league.teamsCount || 0}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">משחקים</p>
            <p className="mt-1 font-medium">{league.matches?.length || 0}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">חברים בליגה</p>
            <p className="mt-1 font-medium">{league.members?.length || 0}</p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">תיאור</p>
          <p className="mt-2 text-gray-800">
            {league.description || "אין תיאור לליגה"}
          </p>
        </div>

        {isGuest && (
          <div className="mb-8 rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-center">
            <div className="text-4xl">🔒</div>
            <h2 className="mt-3 text-xl font-bold text-gray-900">
              התוכן המלא זמין למשתמשים מחוברים בלבד
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              כדי להצטרף לליגה, לראות שחקנים, בקשות ופעולות ניהול — צריך להתחבר.
            </p>

            <a
              href="/login"
              className="mt-4 inline-block rounded-2xl bg-black px-5 py-3 text-sm text-white transition hover:bg-gray-800"
            >
              התחבר כדי להמשיך
            </a>
          </div>
        )}

        {canReviewRequests && (
          <section className="mb-8 rounded-3xl border border-gray-200 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {canManage ? "בקשות מאמנים" : "בקשות שחקנים"}
              </h2>
              <span className="text-sm text-gray-500">
                {visibleJoinRequests.length} ממתינות
              </span>
            </div>

            {visibleJoinRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                אין בקשות ממתינות
              </div>
            ) : (
              <div className="grid gap-3">
                {visibleJoinRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {request.playerName || request.playerEmail}
                      </p>

                      <p className="text-sm text-gray-500">
                        {request.type === "coach"
                          ? `רוצה להיות המאמן של הקבוצה: ${request.teamName}`
                          : `רוצה להצטרף לקבוצה: ${request.teamName}`}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {request.playerEmail}
                      </p>

                      {request.type === "player" && (
                        <p
                          className={`mt-2 text-xs font-medium ${
                            isPlayerInSquad(
                              request.teamName,
                              request.playerName
                            )
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {isPlayerInSquad(request.teamName, request.playerName)
                            ? "✅ השחקן נמצא בסגל הקבוצה"
                            : "❌ השחקן לא נמצא בסגל הקבוצה"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveJoinRequest(request._id)}
                        className="rounded-xl bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
                      >
                        אשר
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectJoinRequest(request._id)}
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600"
                      >
                        דחה
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {canManage && isEditing && (
          <section className="mb-8 rounded-3xl border border-gray-200 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">עריכת ליגה</h2>
            </div>

            <form
              onSubmit={handleUpdateLeague}
              className="grid gap-4 md:grid-cols-2"
            >
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="שם הליגה"
                className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <input
                type="text"
                name="sport"
                value={editForm.sport}
                onChange={handleEditChange}
                placeholder="ספורט"
                className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <input
                type="text"
                name="location"
                value={editForm.location}
                onChange={handleEditChange}
                placeholder="מיקום"
                className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <select
                name="status"
                value={editForm.status}
                onChange={handleEditChange}
                className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="פתוחה">פתוחה</option>
                <option value="פעילה">פעילה</option>
                <option value="סגורה">סגורה</option>
              </select>

              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                placeholder="תיאור"
                className="md:col-span-2 min-h-28 rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <button
                type="submit"
                disabled={editSubmitting}
                className="md:col-span-2 rounded-2xl bg-black px-5 py-3 text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {editSubmitting ? "שומר..." : "שמור שינויים"}
              </button>
            </form>
          </section>
        )}

        <section className="rounded-3xl border border-gray-200 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">קבוצות בליגה</h2>
            <span className="text-sm text-gray-500">
              סה״כ {league.teams?.length || 0} קבוצות
            </span>
          </div>

          {canManage ? (
            <form onSubmit={handleAddTeam} className="mb-6 flex gap-3">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="הכנס שם קבוצה"
                className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-black px-5 py-3 text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {submitting ? "מוסיף..." : "הוסף קבוצה"}
              </button>
            </form>
          ) : (
            <p className="mb-6 text-sm text-gray-500">
              {isGuest
                ? "התחבר כדי לראות ולבצע פעולות בליגה."
                : "רק יוצר הליגה יכול להוסיף או למחוק קבוצות."}
            </p>
          )}

          {!league.teams || league.teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              אין עדיין קבוצות בליגה
            </div>
          ) : (
            <div className="grid gap-3">
              {league.teams.map((team) => (
                <div
                  key={team._id || team.name}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-800">
                        {team.name}
                      </span>
                      <p className="mt-1 text-sm text-gray-500">
                        {team.players?.length || 0} שחקנים
                      </p>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() =>
                          openConfirmModal({
                            title: "מחיקת קבוצה",
                            message: `למחוק את הקבוצה "${team.name}"?`,
                            onConfirm: () => handleDeleteTeam(team.name),
                          })
                        }
                        className="rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-50 hover:text-red-700"
                      >
                        מחק
                      </button>
                    )}
                  </div>

                  {team.coachName && (
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-gray-700">
                      <span>מאמן: {team.coachName}</span>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            openConfirmModal({
                              title: "הסרת מאמן",
                              message: `להסיר את המאמן מהקבוצה ${team.name}?`,
                              onConfirm: () => handleRemoveCoach(team.name),
                            })
                          }
                          className="rounded-lg px-3 py-1 text-xs text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        >
                          הסר מאמן
                        </button>
                      )}
                    </div>
                  )}

                  {/* 🧠 רק המאמן של הקבוצה */}
                  {currentUser?.email === team.coachEmail && (
                    <div className="mt-3 rounded-xl bg-white p-3">
                      <h4 className="mb-2 text-sm font-semibold text-gray-800">
                        סגל שחקנים
                      </h4>

                      {/* הוספת שחקן */}
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="הכנס שם שחקן"
                          value={squadInputs[team.name] || ""}
                          onChange={(e) =>
                            setSquadInputs((prev) => ({
                              ...prev,
                              [team.name]: e.target.value,
                            }))
                          }
                          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                        />

                        <button
                          type="button"
                          onClick={() => handleAddToSquad(team.name)}
                          className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
                        >
                          הוסף
                        </button>
                      </div>

                      {/* רשימת שחקנים */}
                      {team.squad?.length === 0 ? (
                        <p className="text-xs text-gray-400">אין שחקנים בסגל</p>
                      ) : (
                        <div className="space-y-1">
                          {team.squad.map((player, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm text-gray-700"
                            >
                              <span>{player}</span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveFromSquad(team.name, player)
                                }
                                className="text-xs text-red-500 hover:underline"
                              >
                                הסר
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {currentUser ? (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        שחקנים בקבוצה
                      </p>

                      {team.players.map((player, index) => (
                        <div
                          key={`${player.email}-${index}`}
                          className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-gray-700"
                        >
                          <span>{player.email}</span>

                          {canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                openConfirmModal({
                                  title: "הסרת שחקן",
                                  message: `להסיר את ${player.email} מהקבוצה ${team.name}?`,
                                  onConfirm: () =>
                                    handleRemovePlayer(player.email, team.name),
                                })
                              }
                              className="rounded-lg px-3 py-1 text-xs text-red-500 transition hover:bg-red-50 hover:text-red-700"
                            >
                              הסר
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white px-3 py-4 text-center text-sm text-gray-500">
                      🔒 התחבר כדי לראות את שחקני הקבוצה
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">משחקים בליגה</h2>
            <span className="text-sm text-gray-500">
              סה״כ {league.matches?.length || 0} משחקים
            </span>
          </div>

          {league.teams?.length < 2 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              צריך לפחות 2 קבוצות כדי להוסיף משחק
            </div>
          ) : canManage ? (
            <form
              onSubmit={handleAddMatch}
              className="mb-6 grid gap-3 md:grid-cols-2"
            >
              <select
                name="homeTeam"
                value={matchForm.homeTeam}
                onChange={handleMatchChange}
                className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="">בחר קבוצה בית</option>
                {league.teams.map((team) => (
                  <option key={team._id || team.name} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>

              <select
                name="awayTeam"
                value={matchForm.awayTeam}
                onChange={handleMatchChange}
                className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="">בחר קבוצה חוץ</option>
                {league.teams
                  .filter((team) => team.name !== matchForm.homeTeam)
                  .map((team) => (
                    <option key={team._id || team.name} value={team.name}>
                      {team.name}
                    </option>
                  ))}
              </select>

              <input
                type="date"
                name="date"
                value={matchForm.date}
                onChange={handleMatchChange}
                className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <input
                type="time"
                name="time"
                value={matchForm.time}
                onChange={handleMatchChange}
                className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <input
                type="text"
                name="location"
                placeholder="מיקום המשחק"
                value={matchForm.location}
                onChange={handleMatchChange}
                className="md:col-span-2 rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <button
                type="submit"
                disabled={matchSubmitting}
                className="md:col-span-2 rounded-2xl bg-black px-5 py-3 text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {matchSubmitting ? "מוסיף משחק..." : "הוסף משחק"}
              </button>
            </form>
          ) : (
            <p className="mb-6 text-sm text-gray-500">
              רק יוצר הליגה יכול להוסיף, למחוק ולעדכן משחקים.
            </p>
          )}

          {!league.matches || league.matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              אין עדיין משחקים בליגה
            </div>
          ) : (
            <div className="grid gap-4">
              {league.matches.map((match) => {
                const matchKey = match.id || match._id;

                return (
                  <div
                    key={matchKey}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">
                        {match.homeTeam} נגד {match.awayTeam}
                      </h3>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            openConfirmModal({
                              title: "מחיקת משחק",
                              message: "למחוק את המשחק הזה?",
                              onConfirm: () => handleDeleteMatch(matchKey),
                            })
                          }
                          className="rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        >
                          מחק
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-gray-600">
                      תאריך: {match.date} | שעה: {match.time}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      מיקום: {match.location}
                    </p>

                    <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-3">
                      <p className="mb-2 font-medium text-gray-800">
                        תוצאה נוכחית:{" "}
                        {match.homeScore !== "" &&
                        match.homeScore !== null &&
                        match.homeScore !== undefined
                          ? `${match.homeScore} - ${match.awayScore}`
                          : "טרם נקבעה"}
                      </p>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          placeholder={match.homeTeam}
                          value={scoreForms[matchKey]?.homeScore ?? ""}
                          onChange={(e) =>
                            handleScoreChange(
                              matchKey,
                              "homeScore",
                              e.target.value
                            )
                          }
                          className="w-24 rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-black"
                        />

                        <span className="text-gray-500">-</span>

                        <input
                          type="number"
                          min="0"
                          placeholder={match.awayTeam}
                          value={scoreForms[matchKey]?.awayScore ?? ""}
                          onChange={(e) =>
                            handleScoreChange(
                              matchKey,
                              "awayScore",
                              e.target.value
                            )
                          }
                          className="w-24 rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-black"
                        />

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleSaveScore(matchKey)}
                            className="rounded-xl bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
                          >
                            שמור תוצאה
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">טבלת הליגה</h2>
            <span className="text-sm text-gray-500">
              {league.standings?.length || 0} קבוצות
            </span>
          </div>

          {!league.standings || league.standings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              עדיין אין טבלה להצגה
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full overflow-hidden rounded-2xl border border-gray-200">
                <thead className="bg-gray-100 text-sm text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-right">#</th>
                    <th className="px-4 py-3 text-right">קבוצה</th>
                    <th className="px-4 py-3 text-center">מש'</th>
                    <th className="px-4 py-3 text-center">נ'</th>
                    <th className="px-4 py-3 text-center">ת'</th>
                    <th className="px-4 py-3 text-center">ה'</th>
                    <th className="px-4 py-3 text-center">ז'</th>
                    <th className="px-4 py-3 text-center">ח'</th>
                    <th className="px-4 py-3 text-center">הפרש</th>
                    <th className="px-4 py-3 text-center">נק'</th>
                  </tr>
                </thead>

                <tbody className="bg-white text-sm">
                  {league.standings.map((row, index) => (
                    <tr
                      key={row.team}
                      className={`border-t border-gray-200 ${
                        index === 0 ? "bg-yellow-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {row.team}
                      </td>

                      <td className="px-4 py-3 text-center">{row.played}</td>
                      <td className="px-4 py-3 text-center">{row.wins}</td>
                      <td className="px-4 py-3 text-center">{row.draws}</td>
                      <td className="px-4 py-3 text-center">{row.losses}</td>
                      <td className="px-4 py-3 text-center">{row.goalsFor}</td>
                      <td className="px-4 py-3 text-center">
                        {row.goalsAgainst}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.goalDifference}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-black">
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">חברי הליגה</h2>
            <span className="text-sm text-gray-500">
              {league.members?.length || 0} חברים
            </span>
          </div>

          {!league.members || league.members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              עדיין אין חברים בליגה
            </div>
          ) : (
            <div className="grid gap-3">
              {league.members.map((member, index) => (
                <div
                  key={`${member.email}-${index}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <span className="font-medium text-gray-800">
                    {member.email}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="אישור"
        cancelText="ביטול"
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirmModal}
        isDanger
      />
    </main>
  );
}
