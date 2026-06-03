import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET() {
  try {
    await connectToDB();

    const authUser = await getUserFromToken();
    if (!authUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const user = await User.findById(authUser._id);
    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא" }, { status: 404 });
    }

    const notifications = [...(user.notifications || [])]
      .reverse()
      .slice(0, 50);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("GET notifications error:", error);
    return NextResponse.json({ message: "שגיאה" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    await connectToDB();

    const authUser = await getUserFromToken();
    if (!authUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    await User.updateOne(
      { _id: authUser._id },
      { $set: { "notifications.$[].read": true } }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH notifications error:", error);
    return NextResponse.json({ message: "שגיאה" }, { status: 500 });
  }
}
