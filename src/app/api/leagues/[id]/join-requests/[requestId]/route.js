import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PATCH(request, { params }) {
  try {
    const { id, requestId } = await params;
    const { action } = await request.json();

    if (!["approve", "reject"].includes(action)) {
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

    const normalizedCurrentEmail = currentUser.email?.trim().toLowerCase();

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

    const isCoachOfTeam =
      teamIndex !== -1 &&
      league.teams[teamIndex].coachEmail?.trim().toLowerCase() ===
        normalizedCurrentEmail;

    if (joinRequest.type === "coach" && !isOwner) {
      return NextResponse.json(
        { message: "רק מנהל יכול לאשר מאמן" },
        { status: 403 }
      );
    }

    if (joinRequest.type === "player" && !isCoachOfTeam) {
      return NextResponse.json(
        { message: "רק מאמן הקבוצה יכול לאשר שחקן" },
        { status: 403 }
      );
    }

    if (action === "approve") {
      if (teamIndex === -1) {
        return NextResponse.json(
          { message: "הקבוצה לא נמצאה" },
          { status: 404 }
        );
      }

      const normalizedEmail = joinRequest.playerEmail.trim().toLowerCase();

      if (joinRequest.type === "coach") {
        league.teams[teamIndex].coachEmail = normalizedEmail;
        league.teams[teamIndex].coachName = joinRequest.playerName || "";
        league.joinRequests[requestIndex].status = "approved";

        await league.save();

        return NextResponse.json({
          ...league.toObject(),
          id: league._id,
          message: "בקשת המאמן אושרה",
        });
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
        });
      }

      league.joinRequests[requestIndex].status = "approved";
    }

    if (action === "reject") {
      league.joinRequests[requestIndex].status = "rejected";
    }

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      message: action === "approve" ? "הבקשה אושרה" : "הבקשה נדחתה",
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
