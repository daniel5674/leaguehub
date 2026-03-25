import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import User from "@/models/User";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { teamName } = await request.json();

    if (!teamName?.trim()) {
      return NextResponse.json(
        { message: "צריך לבחור קבוצה" },
        { status: 400 }
      );
    }

    await connectToDB();

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const user = await User.findById(currentUser.userId);

    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא" }, { status: 404 });
    }

    if (user.role !== "coach") {
      return NextResponse.json(
        { message: "רק מאמן יכול לשלוח בקשת אימון" },
        { status: 403 }
      );
    }

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    if (!league.joinRequests) {
      league.joinRequests = [];
    }

    const trimmedTeamName = teamName.trim();
    const normalizedEmail = user.email.trim().toLowerCase();

    const team = league.teams.find(
      (t) => t.name?.trim().toLowerCase() === trimmedTeamName.toLowerCase()
    );

    if (!team) {
      return NextResponse.json(
        { message: "הקבוצה לא נמצאה בליגה" },
        { status: 404 }
      );
    }

    if (team.coachEmail) {
      return NextResponse.json(
        { message: "כבר יש מאמן לקבוצה הזו" },
        { status: 400 }
      );
    }

    const hasPendingRequest = league.joinRequests.some(
      (req) =>
        req.type === "coach" &&
        req.playerEmail?.trim().toLowerCase() === normalizedEmail &&
        req.teamName?.trim().toLowerCase() === trimmedTeamName.toLowerCase() &&
        req.status === "pending"
    );

    if (hasPendingRequest) {
      return NextResponse.json(
        { message: "כבר שלחת בקשת אימון לקבוצה הזו" },
        { status: 400 }
      );
    }

    league.joinRequests.push({
      type: "coach",
      playerEmail: normalizedEmail,
      playerName: user.fullName,
      teamName: trimmedTeamName,
      status: "pending",
    });

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      message: "בקשת האימון נשלחה בהצלחה",
    });
  } catch (error) {
    console.error("Request coach error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בשליחת בקשת אימון",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
