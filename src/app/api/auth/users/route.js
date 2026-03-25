import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectToDB();

    console.log("Current DB name:", mongoose.connection.name);
    console.log("Current DB host:", mongoose.connection.host);

    const users = await User.find().select("-password");

    return NextResponse.json({
      dbName: mongoose.connection.name,
      dbHost: mongoose.connection.host,
      users,
    });
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json(
      {
        message: "שגיאה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
