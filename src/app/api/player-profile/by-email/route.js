import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import PlayerProfile from "@/models/PlayerProfile";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(request) {
  try {
    await connectToDB();

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "חסר אימייל" }, { status: 400 });
    }

    const profile = await PlayerProfile.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!profile) {
      return NextResponse.json(
        { message: "לא נמצא כרטיס שחקן" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET player profile by email error:", error);

    return NextResponse.json(
      { message: "שגיאה בטעינת כרטיס שחקן" },
      { status: 500 }
    );
  }
}
