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

    if (!isAlreadyCaptain) {
      const otherCaptain = league.teams[teamIndex].players.find(
        (p) => p.isCaptain && p.email?.trim().toLowerCase() !== normalizedEmail,
      );

      if (otherCaptain) {
        return NextResponse.json(
          {
            message: `${otherCaptain.fullName || otherCaptain.email} כבר קפטן הקבוצה`,
          },
          { status: 400 },
        );
      }
    }

    const key = `teams.${teamIndex}.players.${playerIndex}.isCaptain`;
    console.log("Setting captain:", key, "->", !isAlreadyCaptain);

    const fresh = await League.findByIdAndUpdate(
      id,
      { $set: { [key]: !isAlreadyCaptain } },
      { new: true },
    );

    console.log(
      "After update isCaptain:",
      fresh.teams[teamIndex].players[playerIndex].isCaptain,
    );

    return NextResponse.json({
      ...fresh.toObject(),
      id: fresh._id,
      message: !isAlreadyCaptain ? "הקפטן נקבע בהצלחה" : "הקפטן הוסר",
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
