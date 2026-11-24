import { NextRequest, NextResponse } from "next/server";
import { extractYouTubeId, getOrParseVideoData } from "@/lib/youtube";

function mapErrorToResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : "";

  if (msg === "BOT_BLOCKED") {
    return NextResponse.json(
      {
        code: "BOT_BLOCKED",
        message:
          "当前代理节点 IP 被 YouTube 识别为异常访问（Sign in to confirm you’re not a bot），请切换代理节点后重试，或在项目根目录放置 cookies.txt",
      },
      { status: 403 }
    );
  }

  if (msg === "NETWORK_ERROR") {
    return NextResponse.json(
      {
        code: "NETWORK_ERROR",
        message: "连接 YouTube 超时，请检查本地网络或代理设置后重试",
      },
      { status: 502 }
    );
  }

  if (msg === "VIDEO_UNAVAILABLE") {
    return NextResponse.json(
      {
        code: "VIDEO_UNAVAILABLE",
        message: "该视频不可用（可能为私享视频、会员专属或受地区限制）",
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
    return mapErrorToResponse(err);
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
  } catch (err: unknown) {
    return mapErrorToResponse(err);
  }
}
