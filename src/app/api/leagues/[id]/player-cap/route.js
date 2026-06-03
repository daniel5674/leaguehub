import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function PATCH(request, { params }) {
  try {
    await connectToDB();

    const { id } = await params;
    const authUser = await getUserFromToken();

    if (!authUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
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

    const { playerCap } = await request.json();
    league.playerCap = playerCap ? Number(playerCap) : null;
    await league.save();

    return NextResponse.json({ ...league.toObject(), id: league._id });
  } catch (error) {
    console.error("PATCH player-cap error:", error);
    return NextResponse.json({ message: "שגיאה בעדכון מכסה" }, { status: 500 });
  }
}
