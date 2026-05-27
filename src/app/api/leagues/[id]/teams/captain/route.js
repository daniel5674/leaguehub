import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { teamName, playerEmail } = await request.json();

    if (!teamName?.trim() || !playerEmail?.trim()) {
      return NextResponse.json({ message: "חסרים פרטים" }, { status: 400 });
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
      return NextResponse.json(
        { message: "רק מנהל הליגה יכול למנות קפטן" },
        { status: 403 },
      );
    }

    const teamIndex = league.teams.findIndex(
      (t) => t.name?.trim().toLowerCase() === teamName.trim().toLowerCase(),
    );

    if (teamIndex === -1) {
      return NextResponse.json({ message: "הקבוצה לא נמצאה" }, { status: 404 });
    }

    const normalizedEmail = playerEmail.trim().toLowerCase();

    const playerIndex = league.teams[teamIndex].players.findIndex(
      (p) => p.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (playerIndex === -1) {
      return NextResponse.json(
        { message: "השחקן לא נמצא בקבוצה" },
        { status: 404 },
      );
    }

    const isAlreadyCaptain =
      !!league.teams[teamIndex].players[playerIndex].isCaptain;

    const updateOps = {};

    // Remove captain from all players in this team
    league.teams[teamIndex].players.forEach((_, i) => {
      updateOps[`teams.${teamIndex}.players.${i}.isCaptain`] = false;
    });

    // If not already captain, set the new one
    if (!isAlreadyCaptain) {
      updateOps[`teams.${teamIndex}.players.${playerIndex}.isCaptain`] = true;
    }

    const fresh = await League.findByIdAndUpdate(
      id,
      { $set: updateOps },
      { new: true },
    );

    return NextResponse.json({
      ...fresh.toObject(),
      id: fresh._id,
      message: !isAlreadyCaptain ? "הקפטן נקבע בהצלחה" : "הקפטן הוסר בהצלחה",
    });
  } catch (error) {
    console.error("Set captain error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בקביעת קפטן",
        error: error?.message || "unknown error",
      },
      { status: 500 },
    );
  }
}
