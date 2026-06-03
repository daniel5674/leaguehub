import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import User from "@/models/User";
import { getUserFromToken } from "@/lib/getUserFromToken";

async function notifyUser({ email, userId }, message, leagueId, leagueName, type) {
  try {
    const query = email ? { email } : userId ? { _id: userId } : null;
    if (!query) return;
    const user = await User.findOne(query);
    if (!user) return;
    user.notifications.push({ message, leagueId: String(leagueId), leagueName, type, read: false });
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
      return NextResponse.json({ message: "צריך להזין שם שחקן" }, { status: 400 });
    }

    const alreadyInRoster = league.personalPlayers.some(
      (p) => p.email && p.email === body.email
    );
    const alreadyWaiting = league.waitingList.some(
      (p) => p.email && p.email === body.email
    );

    if (alreadyInRoster || alreadyWaiting) {
      return NextResponse.json(
        { message: "השחקן כבר נמצא ברשימה" },
        { status: 400 }
      );
    }

    const playerData = {
      userId: body.userId || "",
      email: body.email || "",
      fullName: body.fullName.trim(),
      rating: body.rating || "D",
      goals: 0,
      assists: 0,
      gamesPlayed: 0,
    };

    const cap = league.playerCap;
    const currentCount = league.personalPlayers.length;

    if (cap && currentCount >= cap) {
      league.waitingList.push({
        userId: playerData.userId,
        email: playerData.email,
        fullName: playerData.fullName,
        rating: playerData.rating,
      });

      await league.save();

      await notifyUser(
        { email: playerData.email, userId: playerData.userId },
        `נוספת לרשימת ההמתנה של ליגה "${league.name}". תקבל הודעה כשמקום יתפנה!`,
        league._id,
        league.name,
        "waiting"
      );
    } else {
      league.personalPlayers.push(playerData);
      await league.save();

      await notifyUser(
        { email: playerData.email, userId: playerData.userId },
        `נוספת לליגה "${league.name}"! בהצלחה!`,
        league._id,
        league.name,
        "joined"
      );
    }

    const updated = await League.findById(id);
    return NextResponse.json({ ...updated.toObject(), id: updated._id });
  } catch (error) {
    console.error("POST personal player error:", error);
    return NextResponse.json({ message: "שגיאה בהוספת שחקן" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDB();

    const { id } = await params;
    const authUser = await getUserFromToken();

    if (!authUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const body = await request.json();
    const { playerId } = body;

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
        { message: "אפשר להסיר שחקנים רק מליגה אישית" },
        { status: 400 }
      );
    }

    league.personalPlayers = league.personalPlayers.filter(
      (p) => p._id.toString() !== playerId
    );

    // Auto-promote first person from waiting list
    if (league.waitingList.length > 0) {
      const promoted = league.waitingList.shift();
      league.personalPlayers.push({
        userId: promoted.userId,
        email: promoted.email,
        fullName: promoted.fullName,
        rating: promoted.rating,
        goals: 0,
        assists: 0,
        gamesPlayed: 0,
      });

      await league.save();

      await notifyUser(
        { email: promoted.email, userId: promoted.userId },
        `עלית מרשימת ההמתנה לליגה "${league.name}"! אתה במשחק! 🎉`,
        league._id,
        league.name,
        "promoted"
      );
    } else {
      league.generatedTeams = [];
      await league.save();
    }

    const updated = await League.findById(id);
    return NextResponse.json({ ...updated.toObject(), id: updated._id });
  } catch (error) {
    console.error("DELETE personal player error:", error);
    return NextResponse.json({ message: "שגיאה בהסרת שחקן" }, { status: 500 });
  }
}
