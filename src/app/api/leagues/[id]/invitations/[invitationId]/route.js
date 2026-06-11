import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import User from "@/models/User";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PATCH(request, { params }) {
  try {
    await connectToDB();

    const { id, invitationId } = await params;
    const { action } = await request.json();

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ message: "פעולה לא תקינה" }, { status: 400 });
    }

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const [league, user] = await Promise.all([
      League.findById(id),
      User.findById(currentUser.userId),
    ]);

    if (!league || !user) {
      return NextResponse.json({ message: "ההזמנה לא נמצאה" }, { status: 404 });
    }

    const invitation = league.invitations?.id(invitationId);

    if (!invitation) {
      return NextResponse.json({ message: "ההזמנה לא נמצאה" }, { status: 404 });
    }

    if (
      String(invitation.playerId) !== String(user._id) ||
      invitation.playerEmail?.trim().toLowerCase() !==
        user.email?.trim().toLowerCase()
    ) {
      return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ message: "ההזמנה כבר טופלה" }, { status: 400 });
    }

    if (action === "accept") {
      const alreadyInLeague = league.teams.some((team) =>
        team.players?.some(
          (player) =>
            player.email?.trim().toLowerCase() ===
            user.email?.trim().toLowerCase()
        )
      );

      if (alreadyInLeague) {
        return NextResponse.json(
          { message: "אתה כבר נמצא בליגה" },
          { status: 400 }
        );
      }

      const team = league.teams.find(
        (item) =>
          item.name?.trim().toLowerCase() ===
          invitation.teamName?.trim().toLowerCase()
      );

      if (!team) {
        return NextResponse.json(
          { message: "הקבוצה כבר לא קיימת" },
          { status: 404 }
        );
      }

      if (!team.players) {
        team.players = [];
      }

      team.players.push({
        playerId: String(user._id),
        email: user.email,
        fullName: user.fullName,
      });

      if (!league.members) {
        league.members = [];
      }

      const alreadyMember = league.members.some(
        (member) =>
          member.email?.trim().toLowerCase() === user.email?.trim().toLowerCase()
      );

      if (!alreadyMember) {
        league.members.push({
          email: user.email,
          fullName: user.fullName,
        });
      }

      invitation.status = "accepted";
    } else {
      invitation.status = "rejected";
    }

    user.notifications = user.notifications.filter(
      (notification) =>
        String(notification.invitationId) !== String(invitationId)
    );

    await Promise.all([league.save(), user.save()]);

    return NextResponse.json({
      message:
        action === "accept" ? "הצטרפת לקבוצה בהצלחה" : "ההזמנה נדחתה",
    });
  } catch (error) {
    console.error("PATCH league invitation error:", error);
    return NextResponse.json(
      { message: "שגיאה בטיפול בהזמנה" },
      { status: 500 }
    );
  }
}
