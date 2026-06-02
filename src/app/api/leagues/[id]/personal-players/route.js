import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";

export async function POST(request, { params }) {
  try {
    await connectToDB();

    const { id } = await params;
    const body = await request.json();

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
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

    league.personalPlayers.push({
      fullName: body.fullName.trim(),
      rating: body.rating || "D",
      goals: Number(body.goals) || 0,
      assists: Number(body.assists) || 0,
      gamesPlayed: Number(body.gamesPlayed) || 0,
    });

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
    });
  } catch (error) {
    console.error("POST personal player error:", error);
    return NextResponse.json(
      { message: "שגיאה בהוספת שחקן אישי" },
      { status: 500 }
    );
  }
}
