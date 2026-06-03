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

    const user = await User.findById(authUser._id).lean();
    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications = (user.notifications || [])
      .slice()
      .reverse()
      .slice(0, 50);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("GET notifications error:", error);
    return NextResponse.json({ message: "שגיאה בטעינת התראות" }, { status: 500 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH notifications error:", error);
    return NextResponse.json({ message: "שגיאה בעדכון התראות" }, { status: 500 });
  }
}
