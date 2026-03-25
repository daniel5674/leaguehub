import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { playerEmail, teamName } = await request.json();

    if (!playerEmail || !teamName) {
      return NextResponse.json(
        { message: "צריך לשלוח אימייל שחקן ושם קבוצה" },
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

    const normalizedEmail = playerEmail.trim().toLowerCase();
    const normalizedTeamName = teamName.trim().toLowerCase();

    const teamIndex = league.teams.findIndex(
      (team) => team.name?.trim().toLowerCase() === normalizedTeamName
    );

    if (teamIndex === -1) {
      return NextResponse.json({ message: "הקבוצה לא נמצאה" }, { status: 404 });
    }

    if (!league.teams[teamIndex].players) {
      league.teams[teamIndex].players = [];
    }

    league.teams[teamIndex].players = league.teams[teamIndex].players.filter(
      (player) => player.email?.trim().toLowerCase() !== normalizedEmail
    );

    if (!league.members) {
      league.members = [];
    }

    const stillInAnotherTeam = league.teams.some((team) =>
      team.players?.some(
        (player) => player.email?.trim().toLowerCase() === normalizedEmail
      )
    );

    if (!stillInAnotherTeam) {
      league.members = league.members.filter(
        (member) => member.email?.trim().toLowerCase() !== normalizedEmail
      );
    }

    if (league.joinRequests) {
      league.joinRequests = league.joinRequests.filter(
        (request) =>
          !(
            request.playerEmail?.trim().toLowerCase() === normalizedEmail &&
            request.teamName?.trim().toLowerCase() === normalizedTeamName &&
            request.status === "approved"
          )
      );
    }

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      message: "השחקן הוסר מהקבוצה",
    });
  } catch (error) {
    console.error("DELETE player from team error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בהסרת שחקן מהקבוצה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
