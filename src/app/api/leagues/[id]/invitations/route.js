import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import User from "@/models/User";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(request, { params }) {
  try {
    await connectToDB();

    const { id } = await params;
    const { playerId, teamName } = await request.json();
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

    if (league.status !== "סגורה" || league.leagueType === "personal") {
      return NextResponse.json(
        { message: "אפשר לשלוח הזמנות לקבוצות בליגה סגורה בלבד" },
        { status: 400 }
      );
    }

    const player = await User.findById(playerId);

    if (!player || player.role !== "player") {
      return NextResponse.json({ message: "השחקן לא נמצא" }, { status: 404 });
    }

    const team = league.teams.find(
      (item) =>
        item.name?.trim().toLowerCase() === teamName?.trim().toLowerCase()
    );

    if (!team) {
      return NextResponse.json({ message: "הקבוצה לא נמצאה" }, { status: 404 });
    }

    const normalizedEmail = player.email.trim().toLowerCase();
    const alreadyInLeague = league.teams.some((item) =>
      item.players?.some(
        (member) => member.email?.trim().toLowerCase() === normalizedEmail
      )
    );

    if (alreadyInLeague) {
      return NextResponse.json(
        { message: "השחקן כבר נמצא בליגה" },
        { status: 400 }
      );
    }

    if (!league.invitations) {
      league.invitations = [];
    }

    const pendingInvitation = league.invitations.some(
      (invitation) =>
        invitation.playerEmail?.trim().toLowerCase() === normalizedEmail &&
        invitation.status === "pending"
    );

    if (pendingInvitation) {
      return NextResponse.json(
        { message: "כבר נשלחה לשחקן הזמנה שממתינה לתשובה" },
        { status: 400 }
      );
    }

    league.invitations.push({
      playerId: String(player._id),
      playerEmail: normalizedEmail,
      playerName: player.fullName,
      teamName: team.name,
      status: "pending",
    });

    const invitation = league.invitations[league.invitations.length - 1];

    if (!player.notifications) {
      player.notifications = [];
    }

    player.notifications.push({
      message: `הוזמנת להצטרף לקבוצה "${team.name}"`,
      leagueId: String(league._id),
      leagueName: league.name,
      invitationId: String(invitation._id),
      teamName: team.name,
      actionType: "league-invitation",
      type: "invite",
      read: false,
    });

    await Promise.all([league.save(), player.save()]);

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      message: "ההזמנה נשלחה לשחקן",
    });
  } catch (error) {
    console.error("POST league invitation error:", error);
    return NextResponse.json(
      { message: "שגיאה בשליחת ההזמנה" },
      { status: 500 }
    );
  }
}
