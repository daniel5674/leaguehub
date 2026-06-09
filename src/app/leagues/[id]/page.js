"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Link from "next/link";

export default function LeagueDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const { currentUser, permissions } = useAuth();
  const router = useRouter();

  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  const [teamName, setTeamName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [scoreForms, setScoreForms] = useState({});
  const [selectedTeam, setSelectedTeam] = useState("");

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

  const [topScorerForm, setTopScorerForm] = useState({
    playerName: "",
    teamName: "",
    goals: "",
  });

  const [topAssistForm, setTopAssistForm] = useState({
    playerName: "",
    teamName: "",
    assists: "",
  });

  const [blueCardForms, setBlueCardForms] = useState({});

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
    setConfirmState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const [activeTab, setActiveTab] = useState("teams");

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

    if (league.leagueType === "personal") {
      setActiveTab("league-page");
    }
  }, [league]);

  const handleRequestJoin = async () => {
    const isPersonalLeague = league?.leagueType === "personal";

    if (!isPersonalLeague && !selectedTeam) {
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
        body: JSON.stringify(
          isPersonalLeague ? {} : { teamName: selectedTeam }
        ),
      });

      const data = await res.json();

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
        body: JSON.stringify({ teamName }),
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
        body: JSON.stringify({ teamName: teamToDelete }),
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

  const handleTopScorerChange = (e) => {
    setTopScorerForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleTopAssistChange = (e) => {
    setTopAssistForm((prev) => ({
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

  const handleAddTopScorer = async (e) => {
    e.preventDefault();

    if (
      !topScorerForm.playerName.trim() ||
      !topScorerForm.teamName ||
      topScorerForm.goals === ""
    ) {
      showToast("צריך למלא שם שחקן, קבוצה וכמות שערים", "error");
      return;
    }

    try {
      const res = await fetch(`/api/leagues/${id}/top-scorers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          playerName: topScorerForm.playerName.trim(),
          teamName: topScorerForm.teamName,
          goals: Number(topScorerForm.goals),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בהוספת מלך שערים", "error");
        return;
      }

      setLeague(data);

      setTopScorerForm({
        playerName: "",
        teamName: "",
        goals: "",
      });

      showToast("מלך השערים נוסף");
    } catch (error) {
      console.error("Failed to add top scorer:", error);
      showToast("שגיאה בהוספת מלך שערים", "error");
    }
  };

  const handleAddTopAssist = async (e) => {
    e.preventDefault();

    if (
      !topAssistForm.playerName.trim() ||
      !topAssistForm.teamName ||
      topAssistForm.assists === ""
    ) {
      showToast("צריך למלא שם שחקן, קבוצה וכמות בישולים", "error");
      return;
    }

    try {
      const res = await fetch(`/api/leagues/${id}/top-assists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          playerName: topAssistForm.playerName.trim(),
          teamName: topAssistForm.teamName,
          assists: Number(topAssistForm.assists),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בהוספת מלך בישולים", "error");
        return;
      }

      setLeague(data);

      setTopAssistForm({
        playerName: "",
        teamName: "",
        assists: "",
      });

      showToast("מלך הבישולים נוסף");
    } catch (error) {
      console.error("Failed to add top assist:", error);
      showToast("שגיאה בהוספת מלך בישולים", "error");
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
        body: JSON.stringify({ matchId }),
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

  const handleApproveMatch = async (
    matchId,
    approvedHomeScore,
    approvedAwayScore
  ) => {
    try {
      const res = await fetch(`/api/leagues/${id}/matches`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "UPDATE_SCORE",
          matchId,
          homeScore: Number(approvedHomeScore),
          awayScore: Number(approvedAwayScore),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה באישור תוצאה", "error");
        return;
      }

      setLeague(data);

      showToast("התוצאה אושרה בהצלחה");
    } catch (error) {
      console.error("Approve match failed:", error);
      showToast("שגיאה באישור תוצאה", "error");
    }
  };

  const handleSaveScore = async (matchId, captainTeamName) => {
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
          action: "SUBMIT_MATCH_REPORT",

          matchId,

          homeScore: Number(form.homeScore),
          awayScore: Number(form.awayScore),

          captainUserId:
            currentUser?._id || currentUser?.id || currentUser?.email,

          captainName:
            currentUser?.fullName || currentUser?.name || currentUser?.email,

          teamName: captainTeamName,
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
        [matchId]: { homeScore: "", awayScore: "" },
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
        body: JSON.stringify({ playerEmail, teamName }),
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

  const handleBlueCardChange = (matchId, field, value) => {
    setBlueCardForms((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }));
  };

  const addBlueCardToMatch = async (matchId) => {
    const form = blueCardForms[matchId];

    if (!form?.playerId) {
      showToast("צריך להזין שם שחקן וקבוצה", "error");
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
          action: "ADD_BLUE_CARD",
          matchId,
          playerId: form.playerId,
          playerName: form.playerName,
          teamName: form.teamName,
          minute: form.minute ? Number(form.minute) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "שגיאה בהוספת כרטיס כחול", "error");
        return;
      }

      setLeague(data);

      setBlueCardForms((prev) => ({
        ...prev,
        [matchId]: {
          playerName: "",
          teamName: "",
          minute: "",
        },
      }));

      showToast("כרטיס כחול נוסף בהצלחה");
    } catch (error) {
      console.error("Failed to add blue card:", error);
      showToast("שגיאה בהוספת כרטיס כחול", "error");
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

  const isPersonalLeague = league.leagueType === "personal";

  const currentUserId = currentUser?._id || currentUser?.id;

  const canManage =
    permissions?.canManageLeague &&
    currentUser &&
    (String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUserId));

  const isOwner =
    currentUser &&
    (String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUserId));

  const normalizedCurrentEmail = currentUser?.email?.trim().toLowerCase();

  const canJoinAsPlayer = !!currentUser && !isOwner;

  const isGuest = !currentUser || !permissions?.hasRolePower;

  const alreadyInAnyTeam =
    !!normalizedCurrentEmail &&
    Array.isArray(league.teams) &&
    league.teams.some((team) =>
      team.players?.some(
        (player) =>
          player.email?.trim().toLowerCase() === normalizedCurrentEmail
      )
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

  const visibleJoinRequests = Array.isArray(league.joinRequests)
    ? league.joinRequests.filter(
        (request) => request.status === "pending" && request.type === "player"
      )
    : [];

  const topAssists = [...(league.topAssists || [])].sort(
    (a, b) => Number(b.assists) - Number(a.assists)
  );

  const getBlueCardsTable = () => {
    const cardsMap = {};

    league.matches?.forEach((match) => {
      match.blueCards?.forEach((card) => {
        const key = `${card.playerName}-${card.teamName}`;

        if (!cardsMap[key]) {
          cardsMap[key] = {
            playerName: card.playerName,
            teamName: card.teamName,
            blueCards: 0,
          };
        }

        cardsMap[key].blueCards += 1;
      });
    });

    return Object.values(cardsMap).sort((a, b) => b.blueCards - a.blueCards);
  };

  const teamColors = [
    "from-blue-600 to-blue-800",
    "from-red-600 to-red-800",
    "from-green-600 to-green-800",
    "from-purple-600 to-purple-800",
    "from-orange-500 to-orange-700",
  ];

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#050b14] px-4 py-8 text-white"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/2 h-[420px] w-[760px] -translate-x-1/2 opacity-5">
          <div className="absolute bottom-0 h-full w-full rounded-t-[380px] border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-white" />
          <div className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-52 w-80 -translate-x-1/2 border-4 border-white" />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-5 rounded-[2rem] border border-white/10 bg-white/[0.06] px-5 py-5 text-white shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  {isPersonalLeague ? "Personal League" : "Regular League"}
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                {league.name}
              </h1>

              <p className="mt-2 text-slate-300">
                {league.location} • {league.sport}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
                {league.status}
              </span>

              {canJoinAsPlayer &&
                !alreadyInAnyTeam &&
                !hasPendingJoinRequest && (
                  <div className="flex items-center gap-2">
                    {league.leagueType !== "personal" && (
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
                    )}
                    <button
                      type="button"
                      onClick={handleRequestJoin}
                      className="rounded-xl bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
                    >
                      שלח בקשה
                    </button>
                  </div>
                )}

              {canJoinAsPlayer && hasPendingJoinRequest && (
                <span className="rounded-xl bg-yellow-100 px-4 py-2 text-sm text-yellow-700">
                  בקשה ממתינה לאישור
                </span>
              )}

              {canJoinAsPlayer && alreadyInAnyTeam && (
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
        </div>
        {isPersonalLeague && canManage && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.push(`/leagues/${id}/match-day`)}
              className="w-full rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-5 text-lg font-black text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.99]"
            >
              ⚽ יום משחק
            </button>
          </div>
        )}

        <div className="sticky top-24 z-40 mb-5 flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/[0.06] p-2 shadow-xl backdrop-blur">
          {isPersonalLeague ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("league-page")}
                className={`rounded-2xl px-5 py-3 font-bold transition ${
                  activeTab === "league-page"
                    ? "bg-emerald-400 text-slate-950 shadow-md"
                    : "text-gray-300 hover:bg-white/10"
                }`}
              >
                🏟️ עמוד הליגה
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("matches")}
                className={`rounded-2xl px-5 py-3 font-bold transition ${
                  activeTab === "matches"
                    ? "bg-emerald-400 text-slate-950 shadow-md"
                    : "text-gray-300 hover:bg-white/10"
                }`}
              >
                ⚽ משחקים
              </button>
              <button
                type="button"
                onClick={() => router.push(`/leagues/${id}/manage`)}
                className="rounded-2xl px-5 py-3 font-bold text-gray-600 transition hover:bg-gray-100"
              >
                ⚙️ ניהול
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("teams")}
                className={`rounded-2xl px-5 py-3 font-bold transition ${
                  activeTab === "teams"
                    ? "bg-emerald-400 text-slate-950 shadow-md"
                    : "text-gray-300 hover:bg-white/10"
                }`}
              >
                🏆 קבוצות
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("matches")}
                className={`rounded-2xl px-5 py-3 font-bold transition ${
                  activeTab === "matches"
                    ? "bg-emerald-400 text-slate-950 shadow-md"
                    : "text-gray-300 hover:bg-white/10"
                }`}
              >
                ⚽ משחקים
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("stats")}
                className={`rounded-2xl px-5 py-3 font-bold transition ${
                  activeTab === "stats"
                    ? "bg-emerald-400 text-slate-950 shadow-md"
                    : "text-gray-300 hover:bg-white/10"
                }`}
              >
                📊 סטטיסטיקות
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("management")}
                className={`rounded-2xl px-5 py-3 font-bold transition ${
                  activeTab === "management"
                    ? "bg-emerald-400 text-slate-950 shadow-md"
                    : "text-gray-300 hover:bg-white/10"
                }`}
              >
                ⚙️ ניהול
              </button>
            </>
          )}
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <LeagueMiniCard
            icon={isPersonalLeague ? "👥" : "🏆"}
            value={
              isPersonalLeague
                ? league.personalPlayers?.length || 0
                : league.teams?.length || 0
            }
            title={isPersonalLeague ? "שחקנים" : "קבוצות"}
          />

          <LeagueMiniCard
            icon="⚽"
            value={league.matches?.length || 0}
            title="משחקים"
          />

          <LeagueMiniCard
            icon="🥅"
            value={(league.topScorers || []).reduce(
              (sum, player) => sum + (player.goals || 0),
              0
            )}
            title="שערים בליגה"
          />

          {!isPersonalLeague && (
            <LeagueMiniCard
              icon="🟦"
              value={getBlueCardsTable().reduce(
                (sum, player) => sum + (player.blueCards || 0),
                0
              )}
              title="כרטיסים כחולים"
            />
          )}
        </div>

        {activeTab === "league-page" && isPersonalLeague && (
          <section className="mb-8 rounded-3xl border border-purple-200 bg-purple-50 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-purple-900">
                שחקני הליגה האישית
              </h2>
              <span className="text-sm text-purple-700">
                {league.personalPlayers?.length || 0} שחקנים
              </span>
            </div>

            {!league.personalPlayers || league.personalPlayers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-purple-300 bg-white p-8 text-center text-gray-500">
                עדיין אין שחקנים בליגה האישית
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-purple-200 text-xs font-semibold text-purple-700">
                      <th className="pb-3 pr-2">#</th>
                      <th className="pb-3">שחקן</th>
                      <th className="pb-3 text-center">דירוג</th>
                      <th className="pb-3 text-center">שערים</th>
                      <th className="pb-3 text-center">בישולים</th>
                      <th className="pb-3 text-center">משחקים</th>
                      {canManage && <th className="pb-3" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50">
                    {(league.personalPlayers || []).map((player, index) => (
                      <tr
                        key={player._id || index}
                        className="transition hover:bg-purple-50/50"
                      >
                        <td className="py-3 pr-2 text-sm text-gray-400">
                          {index + 1}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-200 text-sm font-bold text-purple-800">
                              {player.fullName?.charAt(0)}
                            </div>
                            <Link
                              href={`/leagues/${id}/players/${player._id}`}
                              className="text-sm font-semibold text-gray-900 hover:underline"
                            >
                              {player.fullName}
                            </Link>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          {canManage ? (
                            <select
                              value={player.rating || ""}
                              onChange={async (e) => {
                                const res = await fetch(
                                  `/api/leagues/${id}/personal-players`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    credentials: "include",
                                    body: JSON.stringify({
                                      playerId: String(player._id),
                                      rating: e.target.value,
                                    }),
                                  }
                                );

                                const data = await res.json();

                                if (!res.ok) {
                                  showToast(
                                    data.message || "שגיאה בעדכון דירוג",
                                    "error"
                                  );
                                  return;
                                }

                                setLeague(data);
                                showToast("הדירוג עודכן");
                              }}
                              className="rounded-xl border border-purple-300 px-2 py-1 text-sm"
                            >
                              <option value="">ללא דירוג</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          ) : (
                            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                              {player.rating || "לא דורג"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center text-sm font-semibold text-gray-700">
                          {player.goals || 0}
                        </td>
                        <td className="py-3 text-center text-sm font-semibold text-gray-700">
                          {player.assists || 0}
                        </td>
                        <td className="py-3 text-center text-sm font-semibold text-gray-700">
                          {player.gamesPlayed || 0}
                        </td>
                        {canManage && (
                          <td className="py-3 text-left">
                            <button
                              type="button"
                              onClick={() =>
                                openConfirmModal({
                                  title: "הסרת שחקן",
                                  message: `להסיר את ${player.fullName} מהליגה?`,
                                  onConfirm: async () => {
                                    const res = await fetch(
                                      `/api/leagues/${id}/personal-players`,
                                      {
                                        method: "DELETE",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        credentials: "include",
                                        body: JSON.stringify({
                                          playerId: String(player._id),
                                        }),
                                      }
                                    );
                                    const data = await res.json();
                                    if (res.ok) setLeague(data);
                                    closeConfirmModal();
                                  },
                                })
                              }
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                              הסר
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {league.generatedTeams?.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-4 text-center text-lg font-black text-purple-900">
                  כוחות אחרונים
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {league.generatedTeams.map((team, ti) => {
                    const palette = [
                      {
                        header: "bg-violet-600",
                        badge: "bg-violet-100 text-violet-700",
                      },
                      {
                        header: "bg-emerald-600",
                        badge: "bg-emerald-100 text-emerald-700",
                      },
                      {
                        header: "bg-blue-600",
                        badge: "bg-blue-100 text-blue-700",
                      },
                      {
                        header: "bg-rose-600",
                        badge: "bg-rose-100 text-rose-700",
                      },
                      {
                        header: "bg-amber-600",
                        badge: "bg-amber-100 text-amber-700",
                      },
                      {
                        header: "bg-cyan-600",
                        badge: "bg-cyan-100 text-cyan-700",
                      },
                    ];
                    const c = palette[ti % palette.length];
                    return (
                      <div
                        key={team._id || team.name}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                      >
                        <div className={`${c.header} px-4 py-3`}>
                          <h4 className="text-center text-base font-black text-white">
                            {team.name}
                          </h4>
                        </div>
                        <div className="divide-y divide-gray-50 p-3">
                          {team.players.map((player, pi) => (
                            <div
                              key={`${player.fullName}-${pi}`}
                              className="flex items-center justify-between py-2"
                            >
                              <Link
                                href={`/leagues/${id}/players/${player.playerId}`}
                                className="text-sm font-medium text-gray-800 transition hover:text-emerald-600 hover:underline"
                              >
                                {player.fullName}
                              </Link>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c.badge}`}
                              >
                                {player.rating}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "matches" && isPersonalLeague && (
          <section className="mb-8 rounded-3xl border border-gray-200 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">היסטוריית משחקים</h2>
              <span className="text-sm text-gray-500">
                {league.matches?.length || 0} משחקים
              </span>
            </div>

            {!league.matches || league.matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
                <p className="text-lg font-semibold text-gray-400">
                  אין משחקים במערכת
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {league.matches.map((match) => (
                  <div
                    key={match._id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between text-center">
                      <div className="flex-1">
                        <h3 className="text-lg font-extrabold text-gray-900">
                          {match.homeTeam}
                        </h3>
                      </div>
                      <div className="mx-6">
                        <div className="rounded-2xl bg-black px-6 py-3 text-center text-white shadow-md">
                          <div className="text-3xl font-extrabold">
                            {match.homeScore !== null &&
                            match.homeScore !== undefined
                              ? `${match.homeScore} : ${match.awayScore}`
                              : "- : -"}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-wider text-gray-300">
                            {match.isFinalApproved ? "הסתיים" : "טרם שוחק"}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-extrabold text-gray-900">
                          {match.awayTeam}
                        </h3>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        📅 {match.date}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        🕒 {match.time}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        📍 {match.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

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

        {activeTab === "management" && canManage && (
          <section className="mb-8 rounded-3xl border border-gray-200 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold">בקשות הצטרפות</h2>
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
                        רוצה להצטרף לקבוצה: {request.teamName}
                      </p>
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
        {activeTab === "teams" && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">קבוצות בליגה</h2>
              <span className="text-sm text-gray-400">
                סה״כ {league.teams?.length || 0} קבוצות
              </span>
            </div>

            {canManage && (
              <form onSubmit={handleAddTeam} className="mb-6 flex gap-3">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="הכנס שם קבוצה"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-emerald-400"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                >
                  {submitting ? "מוסיף..." : "הוסף קבוצה"}
                </button>
              </form>
            )}

            {!league.teams || league.teams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-8 text-center text-gray-400">
                אין עדיין קבוצות בליגה
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {league.teams.map((team, index) => (
                  <div
                    key={team._id || team.name}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-md backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09]"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400" />

                    <div className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${
                              teamColors[index % teamColors.length]
                            } text-2xl font-extrabold text-white shadow-lg`}
                          >
                            {team.name?.charAt(0)}

                            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[10px] text-slate-950">
                              ✓
                            </div>
                          </div>

                          <div>
                            <Link
                              href={`/leagues/${id}/teams/${encodeURIComponent(
                                team.name
                              )}`}
                              className="text-lg font-black text-white transition hover:text-emerald-300 hover:underline"
                            >
                              {team.name}
                            </Link>

                            <p className="text-sm text-gray-400">
                              {team.players?.length || 0} שחקנים
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gray-300">
                                👥 {team.players?.length || 0}
                              </span>
                              <Link
                                href={`/leagues/${id}/teams/${encodeURIComponent(
                                  team.name
                                )}`}
                                className="mt-3 inline-flex items-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                              >
                                צפייה בקבוצה →
                              </Link>

                              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                                פעילה
                              </span>
                            </div>
                          </div>
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
                            className="rounded-xl border border-red-400/20 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                          >
                            מחק
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        {activeTab === "matches" && !isPersonalLeague && (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">משחקים בליגה</h2>

              <span className="text-sm font-bold text-gray-400">
                סה״כ {league.matches?.length || 0} משחקים
              </span>
            </div>

            {!isPersonalLeague &&
              (league.teams?.length < 2 ? (
                <div className="mb-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-8 text-center text-gray-400">
                  צריך לפחות 2 קבוצות כדי להוסיף משחק
                </div>
              ) : canManage ? (
                <form
                  onSubmit={handleAddMatch}
                  className="mb-6 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-2"
                >
                  <select
                    name="homeTeam"
                    value={matchForm.homeTeam}
                    onChange={handleMatchChange}
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
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
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
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
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  />

                  <input
                    type="time"
                    name="time"
                    value={matchForm.time}
                    onChange={handleMatchChange}
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  />

                  <input
                    type="text"
                    name="location"
                    placeholder="מיקום המשחק"
                    value={matchForm.location}
                    onChange={handleMatchChange}
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-emerald-400 md:col-span-2"
                  />

                  <button
                    type="submit"
                    disabled={matchSubmitting}
                    className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60 md:col-span-2"
                  >
                    {matchSubmitting ? "מוסיף משחק..." : "הוסף משחק"}
                  </button>
                </form>
              ) : (
                <p className="mb-6 text-sm font-bold text-gray-400">
                  רק יוצר הליגה יכול להוסיף, למחוק ולעדכן משחקים.
                </p>
              ))}

            {!league.matches || league.matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-8 text-center text-gray-400">
                אין עדיין משחקים בליגה
              </div>
            ) : (
              <div className="grid gap-4">
                {league.matches.map((match) => {
                  const matchKey = match.id || match._id;

                  const homeTeamData = league.teams?.find(
                    (team) => team.name === match.homeTeam
                  );

                  const awayTeamData = league.teams?.find(
                    (team) => team.name === match.awayTeam
                  );

                  const isHomeCaptain = homeTeamData?.players?.some(
                    (player) =>
                      player.isCaptain &&
                      (String(player.playerId) === String(currentUserId) ||
                        player.email?.trim().toLowerCase() ===
                          currentUser?.email?.trim().toLowerCase())
                  );

                  const isAwayCaptain = awayTeamData?.players?.some(
                    (player) =>
                      player.isCaptain &&
                      (String(player.playerId) === String(currentUserId) ||
                        player.email?.trim().toLowerCase() ===
                          currentUser?.email?.trim().toLowerCase())
                  );

                  const canReportMatch =
                    !match.isFinalApproved && (isHomeCaptain || isAwayCaptain);

                  const reports = match.captainReports || [];
                  const hasTwoReports = reports.length >= 2;

                  return (
                    <div
                      key={matchKey}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 transition hover:bg-white/[0.09]"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              match.isFinalApproved
                                ? "bg-emerald-400/15 text-emerald-300"
                                : match.captainReports?.length > 0
                                ? "bg-yellow-400/15 text-yellow-300"
                                : "bg-blue-400/15 text-blue-300"
                            }`}
                          >
                            {match.isFinalApproved
                              ? "הסתיים"
                              : match.captainReports?.length > 0
                              ? "ממתין לאישור"
                              : "עתידי"}
                          </span>

                          <p className="font-black text-white">
                            {match.homeTeam}
                            <span className="mx-3 rounded-xl bg-white px-3 py-1 text-slate-950">
                              {match.homeScore !== null &&
                              match.homeScore !== undefined
                                ? `${match.homeScore} : ${match.awayScore}`
                                : "- : -"}
                            </span>
                            {match.awayTeam}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400">
                          <span>📅 {match.date}</span>
                          <span>🕒 {match.time}</span>
                          <span>📍 {match.location}</span>

                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/leagues/${id}/matches/${matchKey}`)
                            }
                            className="rounded-xl bg-white/10 px-3 py-1 text-white transition hover:bg-white/20"
                          >
                            פרטים
                          </button>

                          {canReportMatch && (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/leagues/${id}/matches/${matchKey}/update`
                                )
                              }
                              className="rounded-xl bg-blue-500 px-3 py-1 font-black text-white transition hover:bg-blue-400"
                            >
                              עדכון
                            </button>
                          )}

                          {hasTwoReports &&
                            canManage &&
                            !match.isFinalApproved && (
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/leagues/${id}/matches/${matchKey}/review`
                                  )
                                }
                                className="rounded-xl bg-yellow-400 px-3 py-1 font-black text-slate-950 transition hover:bg-yellow-300"
                              >
                                בדיקה
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
        )}
        {activeTab === "stats" && (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">סטטיסטיקות</h2>
              <span className="text-sm font-bold text-gray-400">
                נתוני הליגה
              </span>
            </div>

            {!isPersonalLeague && (
              <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">טבלת הליגה</h3>
                  <span className="text-sm font-bold text-gray-400">
                    {league.standings?.length || 0} קבוצות
                  </span>
                </div>

                {!league.standings || league.standings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-8 text-center text-gray-400">
                    עדיין אין טבלה להצגה
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-gray-400">
                        <tr className="border-b border-white/10">
                          <th className="px-3 py-3 text-right">#</th>
                          <th className="px-3 py-3 text-right">קבוצה</th>
                          <th className="px-3 py-3 text-center">מש׳</th>
                          <th className="px-3 py-3 text-center">נ׳</th>
                          <th className="px-3 py-3 text-center">ת׳</th>
                          <th className="px-3 py-3 text-center">ה׳</th>
                          <th className="px-3 py-3 text-center">הפרש</th>
                          <th className="px-3 py-3 text-center">נק׳</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/10">
                        {league.standings.map((row, index) => (
                          <tr
                            key={row.team}
                            className="transition hover:bg-white/[0.04]"
                          >
                            <td className="px-3 py-3 font-black text-white">
                              {index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : index + 1}
                            </td>
                            <td className="px-3 py-3 font-black text-white">
                              {row.team}
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">
                              {row.played}
                            </td>
                            <td className="px-3 py-3 text-center text-emerald-300">
                              {row.wins}
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">
                              {row.draws}
                            </td>
                            <td className="px-3 py-3 text-center text-red-300">
                              {row.losses}
                            </td>
                            <td className="px-3 py-3 text-center font-black text-gray-300">
                              {row.goalDifference > 0
                                ? `+${row.goalDifference}`
                                : row.goalDifference}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="rounded-full bg-emerald-400 px-3 py-1 font-black text-slate-950">
                                {row.points}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <StatsLeaderCard
                leagueId={id}
                title="מלך השערים"
                icon="⚽"
                items={[...(league.topScorers || [])]
                  .map((player) => {
                    const team = league.teams?.find(
                      (t) => t.name === player.teamName
                    );

                    const foundPlayer = team?.players?.find(
                      (p) => p.fullName === player.playerName
                    );

                    return {
                      ...player,
                      playerId: player.playerId || foundPlayer?.playerId,
                    };
                  })
                  .sort((a, b) => Number(b.goals) - Number(a.goals))}
                valueKey="goals"
                emptyText="אין עדיין נתוני שערים"
              />

              <StatsLeaderCard
                leagueId={id}
                title="מלך הבישולים"
                icon="🅰️"
                items={topAssists.map((player) => {
                  const team = league.teams?.find(
                    (t) => t.name === player.teamName
                  );

                  const foundPlayer = team?.players?.find(
                    (p) => p.fullName === player.playerName
                  );

                  return {
                    ...player,
                    playerId: player.playerId || foundPlayer?.playerId,
                  };
                })}
                valueKey="assists"
                emptyText="אין עדיין נתוני בישולים"
              />

              <StatsLeaderCard
                leagueId={id}
                title="מצטייני הליגה"
                icon="🏆"
                items={[...(league.topMvps || [])]
                  .map((player) => {
                    const team = league.teams?.find(
                      (t) => t.name === player.teamName
                    );

                    const foundPlayer = team?.players?.find(
                      (p) => p.fullName === player.playerName
                    );

                    return {
                      ...player,
                      playerId: player.playerId || foundPlayer?.playerId,
                    };
                  })
                  .sort((a, b) => Number(b.mvpAwards) - Number(a.mvpAwards))}
                valueKey="mvpAwards"
                emptyText="אין נתוני MVP עדיין"
              />

              <StatsLeaderCard
                leagueId={id}
                title="כרטיסים כחולים"
                icon="🟦"
                items={getBlueCardsTable().map((player) => {
                  const team = league.teams?.find(
                    (t) => t.name === player.teamName
                  );

                  const foundPlayer = team?.players?.find(
                    (p) => p.fullName === player.playerName
                  );

                  return {
                    ...player,
                    playerId: player.playerId || foundPlayer?.playerId,
                  };
                })}
                valueKey="blueCards"
                emptyText="אין עדיין כרטיסים כחולים"
              />
            </div>
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-gray-200 p-6">
          {(() => {
            const regularMembers = (league.members || []).map((m) => {
              const playerFromTeam = league.teams
                ?.flatMap((team) => team.players || [])
                ?.find((player) => player.email === m.email);

              return {
                key: m.email,
                playerId: playerFromTeam?.playerId || m.playerId || m._id,
                name: m.fullName || m.email,
              };
            });

            const personalEmails = new Set(
              (league.personalPlayers || []).map((p) => p.email).filter(Boolean)
            );

            const personalMembers = (league.personalPlayers || []).map((p) => ({
              key: p.email || p._id,
              playerId: p._id,
              name: p.fullName,
            }));
            const allMembers = isPersonalLeague
              ? [
                  ...personalMembers,
                  ...regularMembers.filter((m) => !personalEmails.has(m.key)),
                ]
              : regularMembers;
            return (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">חברי הליגה</h2>
                  <span className="text-sm text-gray-500">
                    {allMembers.length} חברים
                  </span>
                </div>
                {allMembers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                    עדיין אין חברים בליגה
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {allMembers.map((member) => (
                      <div
                        key={member.key}
                        className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        {member.playerId ? (
                          <Link
                            href={`/leagues/${id}/players/${member.playerId}`}
                            className="font-medium text-gray-800 transition hover:text-emerald-600 hover:underline"
                          >
                            {member.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-800">
                            {member.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
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

function LeagueMiniCard({ icon, value, title }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col items-center text-center">
        <div className="text-3xl">{icon}</div>

        <p className="mt-3 text-4xl font-black text-white">{value}</p>

        <p className="mt-1 text-sm font-bold text-gray-400">{title}</p>
      </div>
    </div>
  );
}
function StatsLeaderCard({
  leagueId,
  title,
  icon,
  items,
  valueKey,
  emptyText,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black text-white">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>

      {!items || items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-6 text-center text-sm font-bold text-gray-400">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 5).map((player, index) => (
            <div
              key={
                player._id || `${player.playerName}-${player.teamName}-${index}`
              }
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3"
            >
              <div>
                {player.playerId ? (
                  <Link
                    href={`/leagues/${leagueId}/players/${player.playerId}`}
                    className="font-black text-white transition hover:text-emerald-400 hover:underline"
                  >
                    {index === 0
                      ? "🥇 "
                      : index === 1
                      ? "🥈 "
                      : index === 2
                      ? "🥉 "
                      : ""}
                    {player.playerName}
                  </Link>
                ) : (
                  <p className="font-black text-white">
                    {index === 0
                      ? "🥇 "
                      : index === 1
                      ? "🥈 "
                      : index === 2
                      ? "🥉 "
                      : ""}
                    {player.playerName}
                  </p>
                )}

                <p className="text-xs font-bold text-gray-400">
                  {player.teamName}
                </p>
              </div>

              <span className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-black text-slate-950">
                {player[valueKey] || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
