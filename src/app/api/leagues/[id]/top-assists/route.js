import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";

export async function POST(req, { params }) {
  try {
    await connectToDB();

    const { id } = await params;

    const body = await req.json();

    const { playerName, teamName, assists } = body;

    if (!playerName || !teamName || assists === undefined) {
      return NextResponse.json({ message: "חסרים נתונים" }, { status: 400 });
    }

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    league.topAssists.push({
      playerName,
      teamName,
      assists,
    });

    await league.save();

    return NextResponse.json(league);
  } catch (error) {
    console.error("Failed to add top assist:", error);

    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}
