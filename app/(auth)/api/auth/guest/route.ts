import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return NextResponse.json(
    { error: "Guest login is disabled" },
    { status: 403 }
  );
}
