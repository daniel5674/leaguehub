import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

const isLeagueOwner = (league, currentUser) =>
  String(league.createdBy) === String(currentUser.email) ||
  String(league.createdBy) === String(currentUser.userId);

async function getAuthorizedLeague(id) {
  await connectToDB();

  const currentUser = await getUserFromToken();
  if (!currentUser) {
    return { error: NextResponse.json({ message: "לא מחובר" }, { status: 401 }) };
  }

  const league = await League.findById(id);
  if (!league) {
    return {
      error: NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 }),
    };
  }

  if (!isLeagueOwner(league, currentUser)) {
    return {
      error: NextResponse.json({ message: "אין הרשאה" }, { status: 403 }),
    };
  }

  return { league };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { league, error } = await getAuthorizedLeague(id);
    if (error) return error;

    return NextResponse.json({
      leagueName: league.name,
      blockedPlayers: league.blockedPlayers || [],
    });
  } catch (error) {
    console.error("GET blocked players error:", error);
    return NextResponse.json(
      { message: "שגיאה בטעינת החסימות" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { blockedPlayerId } = await request.json();
    const { league, error } = await getAuthorizedLeague(id);
    if (error) return error;

    const blockedPlayer = league.blockedPlayers?.id(blockedPlayerId);
    if (!blockedPlayer) {
      return NextResponse.json(
        { message: "החסימה לא נמצאה" },
        { status: 404 }
      );
    }

    blockedPlayer.deleteOne();
    await league.save();

    return NextResponse.json({
      message: "החסימה בוטלה",
      blockedPlayers: league.blockedPlayers || [],
    });
  } catch (error) {
    console.error("DELETE blocked player error:", error);
    return NextResponse.json(
      { message: "שגיאה בביטול החסימה" },
      { status: 500 }
    );
  }
}
