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

    const users = await User.find().select("fullName email role").lean();
    return NextResponse.json(users);
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ message: "שגיאה" }, { status: 500 });
  }
}
