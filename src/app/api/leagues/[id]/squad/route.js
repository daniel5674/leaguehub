import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { teamName, playerName } = await request.json();

    if (!teamName?.trim() || !playerName?.trim()) {
      return NextResponse.json(
        { message: "צריך לשלוח שם קבוצה ושם שחקן" },
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

    const normalizedEmail = currentUser.email?.trim().toLowerCase();
    const normalizedTeamName = teamName.trim().toLowerCase();
    const trimmedPlayerName = playerName.trim();

    const teamIndex = league.teams.findIndex(
      (team) => team.name?.trim().toLowerCase() === normalizedTeamName
    );

    if (teamIndex === -1) {
      return NextResponse.json({ message: "הקבוצה לא נמצאה" }, { status: 404 });
    }

    const team = league.teams[teamIndex];

    const isOwner =
      String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser.userId);

    const isCoach = team.coachEmail?.trim().toLowerCase() === normalizedEmail;

    if (!isOwner && !isCoach) {
      return NextResponse.json(
        { message: "אין הרשאה לעדכן את סגל הקבוצה" },
        { status: 403 }
      );
    }

    if (!team.squad) {
      team.squad = [];
    }

    const alreadyExists = team.squad.some(
      (name) => name.trim().toLowerCase() === trimmedPlayerName.toLowerCase()
    );

    if (alreadyExists) {
      return NextResponse.json(
        { message: "השחקן כבר קיים בסגל" },
        { status: 400 }
      );
    }

    team.squad.push(trimmedPlayerName);

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      message: "השחקן נוסף לסגל",
    });
  } catch (error) {
    console.error("POST squad error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בהוספת שחקן לסגל",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { teamName, playerName } = await request.json();

    if (!teamName?.trim() || !playerName?.trim()) {
      return NextResponse.json(
        { message: "צריך לשלוח שם קבוצה ושם שחקן" },
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

    const normalizedEmail = currentUser.email?.trim().toLowerCase();
    const normalizedTeamName = teamName.trim().toLowerCase();
    const trimmedPlayerName = playerName.trim();

    const teamIndex = league.teams.findIndex(
      (team) => team.name?.trim().toLowerCase() === normalizedTeamName
    );

    if (teamIndex === -1) {
      return NextResponse.json({ message: "הקבוצה לא נמצאה" }, { status: 404 });
    }

    const team = league.teams[teamIndex];

    const isOwner =
      String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser.userId);

    const isCoach = team.coachEmail?.trim().toLowerCase() === normalizedEmail;

    if (!isOwner && !isCoach) {
      return NextResponse.json(
        { message: "אין הרשאה לעדכן את סגל הקבוצה" },
        { status: 403 }
      );
    }

    if (!team.squad) {
      team.squad = [];
    }

    team.squad = team.squad.filter(
      (name) => name.trim().toLowerCase() !== trimmedPlayerName.toLowerCase()
    );

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      message: "השחקן הוסר מהסגל",
    });
  } catch (error) {
    console.error("DELETE squad error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בהסרת שחקן מהסגל",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
