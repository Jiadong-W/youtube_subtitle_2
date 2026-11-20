import { NextRequest, NextResponse } from "next/server";
import { lookupWord } from "@/lib/dict";

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get("word") || "";
  if (!word.trim()) {
    return NextResponse.json(
      { message: "请提供要查询的单词" },
      { status: 400 }
    );
  }

  const result = await lookupWord(word);
  return NextResponse.json(result);
}
