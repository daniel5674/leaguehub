import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PATCH(request, { params }) {
  try {
    const { id, playerId } = await params;
    const { shirtNumber, position, image } = await request.json();

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

    let foundPlayer = null;

    for (const team of league.teams) {
      const player = team.players.find(
        (player) => String(player.playerId) === String(playerId)
      );

      if (player) {
        foundPlayer = player;
        break;
      }
    }

    if (!foundPlayer) {
      return NextResponse.json({ message: "השחקן לא נמצא" }, { status: 404 });
    }

    foundPlayer.shirtNumber =
      shirtNumber === "" || shirtNumber === undefined
        ? null
        : Number(shirtNumber);

    foundPlayer.position = position?.trim() || "";
    foundPlayer.image = image?.trim() || "";

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
    });
  } catch (error) {
    console.error("PATCH player error:", error);

    return NextResponse.json({ message: "שגיאה בעדכון שחקן" }, { status: 500 });
  }
}
