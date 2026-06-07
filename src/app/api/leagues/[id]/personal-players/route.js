import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import User from "@/models/User";
import { getUserFromToken } from "@/lib/getUserFromToken";
import PlayerProfile from "@/models/PlayerProfile";

async function notifyUser(email, message, leagueId, leagueName) {
  try {
    if (!email) return;
    const user = await User.findOne({ email });
    if (!user) return;
    user.notifications.push({
      message,
      leagueId: String(leagueId),
      leagueName,
      type: "info",
      read: false,
    });
    await user.save();
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
}

export async function POST(request, { params }) {
  try {
    await connectToDB();

    const { id } = await params;
    const authUser = await getUserFromToken();

    if (!authUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const body = await request.json();
    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    const isOwner =
      String(league.createdBy) === String(authUser.email) ||
      String(league.createdBy) === String(authUser._id);

    if (!isOwner) {
      return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
    }

    if (league.leagueType !== "personal") {
      return NextResponse.json(
        { message: "אפשר להוסיף שחקנים אישיים רק לליגה אישית" },
        { status: 400 }
      );
    }

    if (!body.fullName?.trim()) {
      return NextResponse.json(
        { message: "צריך להזין שם שחקן" },
        { status: 400 }
      );
    }

    const alreadyInRoster = body.email
      ? league.personalPlayers.some((p) => p.email && p.email === body.email)
      : false;

    if (alreadyInRoster) {
      return NextResponse.json(
        { message: "השחקן כבר נמצא ברשימה" },
        { status: 400 }
      );
    }

    league.personalPlayers.push({
      userId: body.userId || "",
      email: body.email || "",
      fullName: body.fullName.trim(),
      rating: body.rating || "",
      goals: 0,
      assists: 0,
      gamesPlayed: 0,
    });

    await league.save();

    if (body.email) {
      await notifyUser(
        body.email,
        `הוספת לליגה "${league.name}"`,
        league._id,
        league.name
      );
    }

    return NextResponse.json({ ...league.toObject(), id: league._id });
  } catch (error) {
    console.error("POST personal player error:", error);
    return NextResponse.json(
      { message: "שגיאה בהוספת שחקן אישי" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectToDB();

    const { id } = await params;
    const authUser = await getUserFromToken();

    if (!authUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const body = await request.json();
    const { playerId, rating } = body;

    if (!playerId) {
      return NextResponse.json({ message: "חסר מזהה שחקן" }, { status: 400 });
    }

    if (!["", "A", "B", "C", "D"].includes(rating)) {
      return NextResponse.json({ message: "דירוג לא תקין" }, { status: 400 });
    }

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    const isOwner =
      String(league.createdBy) === String(authUser.email) ||
      String(league.createdBy) === String(authUser._id);

    if (!isOwner) {
      return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
    }

    if (league.leagueType !== "personal") {
      return NextResponse.json(
        { message: "אפשר לעדכן דירוג רק בליגה אישית" },
        { status: 400 }
      );
    }

    const player = league.personalPlayers.id(playerId);

    if (!player) {
      return NextResponse.json({ message: "השחקן לא נמצא" }, { status: 404 });
    }

    player.rating = rating;
    if (player.email) {
      await PlayerProfile.findOneAndUpdate(
        { email: player.email },
        { rating },
        { new: true }
      );
    }
    league.generatedTeams = [];

    await league.save();

    return NextResponse.json({ ...league.toObject(), id: league._id });
  } catch (error) {
    console.error("PATCH personal player rating error:", error);
    return NextResponse.json(
      { message: "שגיאה בעדכון דירוג שחקן" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDB();

    const { id } = await params;
    const body = await request.json();
    const { playerId } = body;

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    if (league.leagueType !== "personal") {
      return NextResponse.json(
        { message: "אפשר להסיר שחקנים רק מליגה אישית" },
        { status: 400 }
      );
    }

    league.personalPlayers = league.personalPlayers.filter(
      (player) => player._id.toString() !== playerId
    );

    league.generatedTeams = [];

    await league.save();

    return NextResponse.json({ ...league.toObject(), id: league._id });
  } catch (error) {
    console.error("DELETE personal player error:", error);
    return NextResponse.json(
      { message: "שגיאה בהסרת שחקן אישי" },
      { status: 500 }
    );
  }
}
