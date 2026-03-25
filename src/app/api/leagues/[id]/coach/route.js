import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { teamName } = await request.json();

    if (!teamName?.trim()) {
      return NextResponse.json(
        { message: "צריך לשלוח שם קבוצה" },
        { status: 400 }
      );
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

    const isOwner =
      String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser.userId);

    if (!isOwner) {
      return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
    }

    const normalizedTeamName = teamName.trim().toLowerCase();

    const teamIndex = league.teams.findIndex(
      (team) => team.name?.trim().toLowerCase() === normalizedTeamName
    );

    if (teamIndex === -1) {
      return NextResponse.json({ message: "הקבוצה לא נמצאה" }, { status: 404 });
    }

    league.teams[teamIndex].coachEmail = null;
    league.teams[teamIndex].coachName = null;

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      message: "המאמן הוסר מהקבוצה",
    });
  } catch (error) {
    console.error("DELETE coach error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בהסרת המאמן",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
