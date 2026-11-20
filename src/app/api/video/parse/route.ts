import { NextRequest, NextResponse } from "next/server";
import { extractYouTubeId, getOrParseVideoData } from "@/lib/youtube";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url || "";
    const videoId = extractYouTubeId(url);

    if (!videoId) {
      return NextResponse.json(
        {
          code: "INVALID_URL",
          message: "请输入有效的 YouTube 视频链接",
        },
        { status: 400 }
      );
    }

    const data = await getOrParseVideoData(videoId);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NO_SUBTITLES") {
      return NextResponse.json(
        {
          code: "NO_SUBTITLES",
          message: "该视频暂无可用字幕，请更换视频",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        code: "NO_SUBTITLES",
        message: "该视频暂无可用字幕，请更换视频",
      },
      { status: 404 }
    );
  }
}

export async function GET(req: NextRequest) {
  const videoIdParam = req.nextUrl.searchParams.get("videoId") || "";
  const videoId = extractYouTubeId(videoIdParam);

  if (!videoId) {
    return NextResponse.json(
      {
        code: "INVALID_URL",
        message: "请输入有效的 YouTube 视频链接",
      },
      { status: 400 }
    );
  }

  try {
    const data = await getOrParseVideoData(videoId);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        code: "NO_SUBTITLES",
        message: "该视频暂无可用字幕，请更换视频",
      },
      { status: 404 }
    );
  }
}
