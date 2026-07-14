import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PATCH(request, { params }) {
  try {
    const { id, requestId } = await params;
    const { action } = await request.json();

    if (!["approve", "reject", "permanent-block"].includes(action)) {
      return NextResponse.json({ message: "פעולה לא תקינה" }, { status: 400 });
    }

    await connectToDB();

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    if (!league.joinRequests) {
      league.joinRequests = [];
    }

    if (!league.members) {
      league.members = [];
    }

    const isOwner =
      String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser.userId);

    const requestIndex = league.joinRequests.findIndex(
      (req) => String(req._id) === String(requestId)
    );

    if (requestIndex === -1) {
      return NextResponse.json({ message: "הבקשה לא נמצאה" }, { status: 404 });
    }

    const joinRequest = league.joinRequests[requestIndex];

    if (joinRequest.status !== "pending") {
      return NextResponse.json({ message: "הבקשה כבר טופלה" }, { status: 400 });
    }

    const teamIndex = league.teams.findIndex(
      (team) =>
        team.name?.trim().toLowerCase() ===
        joinRequest.teamName?.trim().toLowerCase()
    );

    if (!isOwner) {
      return NextResponse.json(
        { message: "רק מנהל הליגה יכול לטפל בבקשות הצטרפות" },
        { status: 403 }
      );
    }
    if (action === "approve") {
      const normalizedEmail = joinRequest.playerEmail.trim().toLowerCase();

      if (league.leagueType === "personal") {
        if (!league.personalPlayers) {
          league.personalPlayers = [];
        }

        const alreadyPersonalPlayer = league.personalPlayers.some(
          (player) =>
            player.email?.trim().toLowerCase() === normalizedEmail ||
            String(player.playerId) === String(joinRequest.playerId)
        );

        if (!alreadyPersonalPlayer) {
          league.personalPlayers.push({
            playerId: joinRequest.playerId,
            email: normalizedEmail,
            fullName: joinRequest.playerName || "",
            rating: "D",
            goals: 0,
            assists: 0,
            gamesPlayed: 0,
          });
        }

        const alreadyMember = league.members.some(
          (member) => member.email?.trim().toLowerCase() === normalizedEmail
        );

        if (!alreadyMember) {
          league.members.push({
            email: normalizedEmail,
            fullName: joinRequest.playerName || "",
          });
        }

        league.joinRequests[requestIndex].status = "approved";
      } else {
        if (teamIndex === -1) {
          return NextResponse.json(
            { message: "הקבוצה לא נמצאה" },
            { status: 404 }
          );
        }

        if (!league.teams[teamIndex].players) {
          league.teams[teamIndex].players = [];
        }

        const alreadyInTeam = league.teams.some((team) =>
          team.players?.some(
            (player) => player.email?.trim().toLowerCase() === normalizedEmail
          )
        );

        if (!alreadyInTeam) {
          league.teams[teamIndex].players.push({
            playerId: joinRequest.playerId,
            email: normalizedEmail,
            fullName: joinRequest.playerName || "",
          });
        }

        const alreadyMember = league.members.some(
          (member) => member.email?.trim().toLowerCase() === normalizedEmail
        );

        if (!alreadyMember) {
          league.members.push({
            email: normalizedEmail,
            fullName: joinRequest.playerName || "",
          });
        }

        league.joinRequests[requestIndex].status = "approved";
      }
    }

    if (action === "reject") {
      league.joinRequests[requestIndex].status = "rejected";
    }

    if (action === "permanent-block") {
      if (!league.blockedPlayers) {
        league.blockedPlayers = [];
      }

      const normalizedEmail = joinRequest.playerEmail.trim().toLowerCase();
      const alreadyBlocked = league.blockedPlayers.some(
        (blockedPlayer) =>
          blockedPlayer.playerEmail?.trim().toLowerCase() === normalizedEmail ||
          String(blockedPlayer.playerId) === String(joinRequest.playerId)
      );

      if (!alreadyBlocked) {
        league.blockedPlayers.push({
          playerId: joinRequest.playerId,
          playerEmail: normalizedEmail,
          playerName: joinRequest.playerName || "",
          blockedBy: currentUser.email || currentUser.userId,
        });
      }

      league.joinRequests.forEach((requestItem) => {
        const isSamePlayer =
          requestItem.playerEmail?.trim().toLowerCase() === normalizedEmail ||
          String(requestItem.playerId) === String(joinRequest.playerId);

        if (isSamePlayer && requestItem.status === "pending") {
          requestItem.status = "rejected";
        }
      });
    }

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      message:
        action === "approve"
          ? "הבקשה אושרה"
          : action === "permanent-block"
            ? "השחקן נחסם לצמיתות"
            : "הבקשה נדחתה",
    });
  } catch (error) {
    console.error("PATCH join request error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בטיפול בבקשה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
