import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET() {
  try {
    await connectToDB();

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const leagues = await League.find({
      $or: [
        { createdBy: currentUser.email },
        { createdBy: currentUser.userId },
      ],
    });

    return NextResponse.json(
      leagues.map((league) => ({
        ...league.toObject(),
        id: league._id,
      }))
    );
  } catch (error) {
    console.error("GET my leagues error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בקבלת הליגות שלי",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
