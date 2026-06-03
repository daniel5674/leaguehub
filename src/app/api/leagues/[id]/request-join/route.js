import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";
import User from "@/models/User";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { teamName } = body;

    await connectToDB();

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const user = await User.findById(currentUser.userId);

    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא" }, { status: 404 });
    }

    if (user.role !== "player") {
      return NextResponse.json(
        { message: "רק שחקן יכול לשלוח בקשת הצטרפות" },
        { status: 403 }
      );
    }

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    const isPersonalLeague = league.leagueType === "personal";
    const normalizedEmail = user.email.trim().toLowerCase();
    const trimmedTeamName = teamName?.trim() || "";

    if (!isPersonalLeague && !trimmedTeamName) {
      return NextResponse.json(
        { message: "צריך לבחור קבוצה" },
        { status: 400 }
      );
    }

    if (!isPersonalLeague) {
      const teamExists = league.teams.some(
        (team) =>
          team.name?.trim().toLowerCase() === trimmedTeamName.toLowerCase()
      );

      if (!teamExists) {
        return NextResponse.json(
          { message: "הקבוצה לא נמצאה בליגה" },
          { status: 404 }
        );
      }
    }

    const alreadyInAnyTeam = league.teams.some((team) =>
      team.players?.some(
        (player) => player.email?.trim().toLowerCase() === normalizedEmail
      )
    );

    if (alreadyInAnyTeam) {
      return NextResponse.json(
        { message: "השחקן כבר משויך לקבוצה בליגה" },
        { status: 400 }
      );
    }

    if (!league.joinRequests) {
      league.joinRequests = [];
    }

    const pendingRequestExists = league.joinRequests.some(
      (request) =>
        request.playerEmail?.trim().toLowerCase() === normalizedEmail &&
        request.status === "pending"
    );

    if (pendingRequestExists) {
      return NextResponse.json(
        { message: "כבר שלחת בקשת הצטרפות שממתינה לאישור" },
        { status: 400 }
      );
    }

    league.joinRequests.push({
      type: "player",
      playerId: String(user._id || user.id || user.userId),
      playerEmail: normalizedEmail,
      playerName: user.fullName,
      teamName: isPersonalLeague ? "ליגה אישית" : trimmedTeamName,
      status: "pending",
    });

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      message: "בקשת ההצטרפות נשלחה בהצלחה",
    });
  } catch (error) {
    console.error("Request join error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בשליחת בקשת הצטרפות",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
