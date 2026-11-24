import { SubtitleItem, VideoLearningData } from "@/types";
import { PRESET_VIDEOS } from "./presetVideos";
import crypto from "crypto";
import fs from "fs";
import path from "path";

/**
 * 从各种格式的 YouTube 链接中提取 11 位 videoId
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        return v;
      }
      const parts = url.pathname.split("/").filter(Boolean);
      if (
        (parts[0] === "shorts" ||
          parts[0] === "embed" ||
          parts[0] === "v" ||
          parts[0] === "live") &&
        parts[1] &&
        /^[a-zA-Z0-9_-]{11}$/.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    const match = trimmed.match(
      /(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) return match[1];
  }

  return null;
}

/**
 * 判断语言代码是否为中文（简/繁/中文各地区）
 */
export function isChineseLanguage(langCode: string): boolean {
  const lower = (langCode || "").toLowerCase();
  return (
    lower === "zh" ||
    lower.startsWith("zh-") ||
    lower.startsWith("cmn") ||
    lower.startsWith("yue")
  );
}

/**
 * 判断文本内容是否主要为中文字符
 */
export function isTextMostlyChinese(text: string): boolean {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars > 5 && chineseChars >= latinWords;
}

/**
 * 获取本地文件缓存路径
 */
function getCacheFilePath(videoId: string): string {
  const cacheDir = path.join(process.cwd(), ".cache", "videos");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return path.join(cacheDir, `${videoId}.json`);
}

/**
 * 通过 YouTube oEmbed 获取原视频标题与真实宽高比
 */
async function fetchVideoOEmbed(
  videoId: string
): Promise<{ title: string; aspectRatio: number }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`
    )}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      const width = Number(data.width) || 16;
      const height = Number(data.height) || 9;
      return {
        title: data.title || `YouTube Video (${videoId})`,
        aspectRatio: width / height,
      };
    }
  } catch {
    // ignore oembed failure
  }
  return {
    title: `YouTube Video (${videoId})`,
    aspectRatio: 16 / 9,
  };
}

interface CaptionTrackInfo {
  baseUrl: string;
  languageCode: string;
  kind?: string;
  name?: { simpleText?: string; runs?: { text?: string }[] };
  isTranslatable?: boolean;
}

interface YouTubeSession {
  cookie: string;
  visitorData: string;
  clientVersion: string;
  sapisid?: string;
  watchPageResult?: {
    status?: string;
    reason?: string;
    title?: string;
    aspectRatio?: number;
    tracks: CaptionTrackInfo[];
  };
}

const INNERTUBE_CLIENTS = [
  {
    name: "IOS_21_26",
    clientId: "5",
    ua: "com.google.ios.youtube/21.26.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
    client: {
      clientName: "IOS",
      clientVersion: "21.26.4",
      deviceMake: "Apple",
      deviceModel: "iPhone16,2",
      userAgent:
        "com.google.ios.youtube/21.26.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
      osName: "iPhone",
      osVersion: "18.3.2.22D82",
      hl: "en",
      timeZone: "UTC",
      utcOffsetMinutes: 0,
    },
  },
  {
    name: "ANDROID_VR_1_65",
    clientId: "28",
    ua: "com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
    client: {
      clientName: "ANDROID_VR",
      clientVersion: "1.65.10",
      deviceMake: "Oculus",
      deviceModel: "Quest 3",
      androidSdkVersion: 32,
      userAgent:
        "com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
      osName: "Android",
      osVersion: "12L",
      hl: "en",
      timeZone: "UTC",
      utcOffsetMinutes: 0,
    },
  },
  {
    name: "ANDROID_21_26",
    clientId: "3",
    ua: "com.google.android.youtube/21.26.364 (Linux; U; Android 11) gzip",
    client: {
      clientName: "ANDROID",
      clientVersion: "21.26.364",
      androidSdkVersion: 30,
      userAgent:
        "com.google.android.youtube/21.26.364 (Linux; U; Android 11) gzip",
      osName: "Android",
      osVersion: "11",
      hl: "en",
      timeZone: "UTC",
      utcOffsetMinutes: 0,
    },
  },
  {
    name: "TV_SAMSUNG",
    clientId: "7",
    ua: "Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/2.4.0 TV Safari/538.1",
    client: {
      clientName: "TVHTML5",
      clientVersion: "5.20260707",
      deviceMake: "Samsung",
      deviceModel: "UKS9800",
      userAgent:
        "Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/2.4.0 TV Safari/538.1",
      osName: "Tizen",
      osVersion: "2.4.0",
      hl: "en",
      timeZone: "UTC",
      utcOffsetMinutes: 0,
    },
  },
];

/**
 * 获取用户可选配置的本地 Cookie（如项目根目录下的 cookies.txt 或 cookie.txt）
 * 注意：仅过滤提取 youtube.com / .youtube.com 域名下的 Cookie，避免全量浏览器 Cookie 导致请求头超过大小限制 (HTTP 413/431)
 */
function loadCustomYouTubeCookies(): {
  cookieString: string;
  sapisid?: string;
} {
  const txtPaths = [
    path.join(process.cwd(), "cookie.txt"),
    path.join(process.cwd(), "cookies.txt"),
  ];
  for (const p of txtPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf-8").trim();
        if (!raw) continue;

        const cookieMap = new Map<string, string>();

        // 情况 1：直接粘贴的 Header Cookie 字符串（如 "VISITOR_INFO1_LIVE=...; SID=..."）
        if (!raw.includes("\t") && raw.includes("=")) {
          for (const part of raw.replace(/\r?\n/g, ";").split(";")) {
            const eqIdx = part.indexOf("=");
            if (eqIdx > 0) {
              const k = part.slice(0, eqIdx).trim();
              const v = part.slice(eqIdx + 1).trim();
              if (k) cookieMap.set(k, v);
            }
          }
        } else {
          // 情况 2：Netscape 格式 cookies.txt（严格过滤 youtube.com 域名）
          for (const line of raw.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const cols = trimmed.split("\t");
            if (cols.length >= 7) {
              const domain = cols[0].toLowerCase();
              if (
                domain === "youtube.com" ||
                domain.endsWith(".youtube.com")
              ) {
                cookieMap.set(cols[5], cols[6]);
              }
            }
          }
        }

        if (cookieMap.size > 0) {
          const cookieString = Array.from(cookieMap.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
          const sapisid =
            cookieMap.get("SAPISID") ||
            cookieMap.get("__Secure-3PAPISID") ||
            cookieMap.get("__Secure-1PAPISID");
          return { cookieString, sapisid };
        }
      } catch {
        // ignore
      }
    }
  }
  return { cookieString: "" };
}

/**
 * 生成带登录态 Cookie 时的 SAPISIDHASH Authorization 请求头
 */
function buildSapisidAuthorizationHeader(
  sapisid: string,
  origin = "https://www.youtube.com"
): string {
  const ts = Math.floor(Date.now() / 1000);
  const hash = crypto
    .createHash("sha1")
    .update(`${ts} ${sapisid} ${origin}`)
    .digest("hex");
  return `SAPISIDHASH ${ts}_${hash} SAPISID1PHASH ${ts}_${hash} SAPISID3PHASH ${ts}_${hash}`;
}

/**
 * 从 Watch 页面 HTML 中安全提取 ytInitialPlayerResponse 对象
 */
function extractInitialPlayerResponseFromHtml(html: string): Record<string, unknown> | null {
  const marker = "ytInitialPlayerResponse = ";
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const startObj = idx + marker.length;
  const endIdx = html.indexOf("};", startObj);
  if (endIdx === -1) return null;
  try {
    return JSON.parse(html.slice(startObj, endIdx + 1));
  } catch {
    return null;
  }
}

/**
 * 获取 YouTube 访客会话（Cookie 与 VISITOR_DATA）
 */
async function fetchYouTubeSession(videoId: string): Promise<YouTubeSession> {
  const { cookieString: customCookie, sapisid } = loadCustomYouTubeCookies();

  // 如果用户已配置含登录凭证 (SAPISID) 的 cookies.txt，无需先抓取 2.7MB 的 Watch 页面（且 Watch 页面的字幕链接含 exp=xpe 会返回 0 字节空响应），直接构造鉴权会话即可
  if (customCookie && sapisid) {
    return {
      cookie: customCookie,
      visitorData: "",
      clientVersion: "2.20261118.01.00",
      sapisid,
    };
  }

  const baseCookie = customCookie
    ? customCookie
    : "SOCS=CAI; PREF=hl=en&tz=UTC";
  const webUa =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  try {
    const pageRes = await fetch(
      `https://www.youtube.com/watch?v=${videoId}&bpctr=9999999999&has_verified=1&hl=en`,
      {
        headers: {
          "User-Agent": webUa,
          Cookie: baseCookie,
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    const setCookies = pageRes.headers.getSetCookie
      ? pageRes.headers
          .getSetCookie()
          .map((c) => c.split(";")[0])
          .join("; ")
      : "";
    const cookie = customCookie
      ? customCookie
      : [baseCookie, setCookies].filter(Boolean).join("; ");
    const html = await pageRes.text();
    const visitorData =
      html.match(/"VISITOR_DATA"\s*:\s*"([^"]+)"/)?.[1] || "";
    const clientVersion =
      html.match(/"INNERTUBE_CLIENT_VERSION"\s*:\s*"([^"]+)"/)?.[1] ||
      "2.20261118.01.00";

    return {
      cookie,
      visitorData,
      clientVersion,
      sapisid,
    };
  } catch {
    return {
      cookie: baseCookie,
      visitorData: "",
      clientVersion: "2.20261118.01.00",
      sapisid,
    };
  }
}

/**
 * 通过多客户端轮询提取字幕轨道列表，并精确记录失败原因
 */
async function fetchCaptionTracks(videoId: string): Promise<{
  title?: string;
  aspectRatio?: number;
  tracks: CaptionTrackInfo[];
  cookie: string;
  userAgent: string;
  failureReason?: "BOT_BLOCKED" | "VIDEO_UNAVAILABLE" | "NETWORK_ERROR";
  failureDetail?: string;
}> {
  const webUa =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  let sawBotBlock = false;
  let sawUnavailable = false;
  let lastReason = "";
  let anyResponseReceived = false;

  for (let attempt = 0; attempt < 2; attempt++) {
    const session = await fetchYouTubeSession(videoId);

    // 如果配置了登录态 Cookie (存在 SAPISID)，优先使用支持 Cookie 鉴权的 WEB 客户端请求 /youtubei/v1/player（生成的字幕 URL 不含 exp=xpe，可直接下载）
    const clientsToTry = [
      ...(session.sapisid
        ? [
            {
              name: "WEB_AUTHED",
              clientId: "1",
              ua: webUa,
              useAuthHeader: true,
              client: {
                clientName: "WEB",
                clientVersion: session.clientVersion,
                hl: "en",
                gl: "US",
              },
            },
          ]
        : []),
      ...INNERTUBE_CLIENTS.map((c) => ({ ...c, useAuthHeader: false })),
    ];

    for (const c of clientsToTry) {
      try {
        const authHeaders: Record<string, string> = {};
        if (c.useAuthHeader && session.sapisid) {
          authHeaders["Authorization"] = buildSapisidAuthorizationHeader(
            session.sapisid
          );
          authHeaders["X-Origin"] = "https://www.youtube.com";
          authHeaders["X-Youtube-Bootstrap-Logged-In"] = "true";
        }

        const res = await fetch(
          "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": c.ua,
              "X-YouTube-Client-Name": c.clientId,
              "X-YouTube-Client-Version": c.client.clientVersion,
              ...(session.visitorData
                ? { "X-Goog-Visitor-Id": session.visitorData }
                : {}),
              ...(session.cookie ? { Cookie: session.cookie } : {}),
              Origin: "https://www.youtube.com",
              ...authHeaders,
            },
            body: JSON.stringify({
              context: {
                client: c.client,
              },
              videoId,
              playbackContext: {
                contentPlaybackContext: {
                  html5Preference: "HTML5_PREF_WANTS",
                },
              },
              contentCheckOk: true,
              racyCheckOk: true,
            }),
            signal: AbortSignal.timeout(8000),
          }
        );

        if (!res.ok) continue;
        anyResponseReceived = true;
        const data = await res.json();
        const status = data?.playabilityStatus?.status;
        const reason = data?.playabilityStatus?.reason || "";

        if (status === "OK") {
          const tracks: CaptionTrackInfo[] =
            data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
            [];
          const title = data?.videoDetails?.title;
          const formats = data?.streamingData?.adaptiveFormats || [];
          const videoFormat = formats.find(
            (f: { width?: number; height?: number }) => f.width && f.height
          );
          const aspectRatio =
            videoFormat?.width && videoFormat?.height
              ? videoFormat.width / videoFormat.height
              : undefined;

          return {
            title,
            aspectRatio,
            tracks,
            cookie: session.cookie,
            userAgent: c.ua,
          };
        }

        if (
          status === "LOGIN_REQUIRED" ||
          reason.toLowerCase().includes("not a bot") ||
          reason.toLowerCase().includes("sign in")
        ) {
          sawBotBlock = true;
          lastReason = reason || "Sign in to confirm you’re not a bot";
        } else if (status === "UNPLAYABLE" || status === "ERROR") {
          sawUnavailable = true;
          lastReason = reason || status;
        }
      } catch {
        // try next client
      }
    }
  }

  return {
    tracks: [],
    cookie: "SOCS=CAI; PREF=hl=en&tz=UTC",
    userAgent: INNERTUBE_CLIENTS[0].ua,
    failureReason: sawBotBlock
      ? "BOT_BLOCKED"
      : sawUnavailable
      ? "VIDEO_UNAVAILABLE"
      : !anyResponseReceived
      ? "NETWORK_ERROR"
      : undefined,
    failureDetail: lastReason,
  };
}

/**
 * 解码 HTML 实体
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 下载并解析单个字幕轨（支持 json3 与 XML 格式）
 */
async function downloadTrackSubtitles(
  rawBaseUrl: string,
  headers: { cookie?: string; userAgent?: string } = {}
): Promise<SubtitleItem[]> {
  const baseUrl = rawBaseUrl.startsWith("/")
    ? `https://www.youtube.com${rawBaseUrl}`
    : rawBaseUrl;
  const reqHeaders: Record<string, string> = {};
  if (headers.userAgent) reqHeaders["User-Agent"] = headers.userAgent;
  if (headers.cookie) reqHeaders["Cookie"] = headers.cookie;

  // 1. 优先尝试 json3 格式
  try {
    const json3Url = baseUrl.includes("fmt=")
      ? baseUrl.replace(/fmt=[^&]+/, "fmt=json3")
      : `${baseUrl}&fmt=json3`;
    const res = await fetch(json3Url, {
      headers: reqHeaders,
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const events = data?.events || [];
      const rawItems: { start: number; end: number; text: string }[] = [];

      for (const ev of events) {
        if (!ev.segs || ev.aAppend === 1) continue;
        const text = ev.segs
          .map((s: { utf8?: string }) => s.utf8 || "")
          .join("")
          .replace(/\n+/g, " ")
          .trim();
        if (!text) continue;
        const start = (ev.tStartMs || 0) / 1000;
        const duration = (ev.dDurationMs || 2500) / 1000;
        rawItems.push({
          start,
          end: start + duration,
          text: decodeHtmlEntities(text),
        });
      }

      if (rawItems.length > 0) {
        return normalizeSubtitleTimings(rawItems);
      }
    }
  } catch {
    // fallback to XML
  }

  // 2. 解析默认 XML 格式
  try {
    const xmlRes = await fetch(baseUrl, {
      headers: reqHeaders,
      signal: AbortSignal.timeout(8000),
    });
    if (!xmlRes.ok) return [];
    const xml = await xmlRes.text();
    const regex =
      /<text\s+start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    const rawItems: { start: number; end: number; text: string }[] = [];
    let m: RegExpExecArray | null;

    while ((m = regex.exec(xml)) !== null) {
      const start = parseFloat(m[1]);
      const dur = m[2] ? parseFloat(m[2]) : 2.5;
      const text = decodeHtmlEntities(m[3].replace(/<[^>]+>/g, ""));
      if (text) {
        rawItems.push({ start, end: start + dur, text });
      }
    }

    return normalizeSubtitleTimings(rawItems);
  } catch {
    return [];
  }
}

/**
 * 规范化字幕时间轴，避免相邻字幕时间重叠导致高亮闪烁
 */
function normalizeSubtitleTimings(
  items: { start: number; end: number; text: string }[]
): SubtitleItem[] {
  return items.map((item, idx) => {
    const next = items[idx + 1];
    const adjustedEnd =
      next && next.start < item.end
        ? Math.max(item.start + 0.25, next.start)
        : item.end;
    return {
      index: idx + 1,
      start: Number(item.start.toFixed(2)),
      end: Number(adjustedEnd.toFixed(2)),
      text: item.text,
    };
  });
}

/**
 * 智能选择视频原声字幕轨道：
 * 兼容普通多语种字幕与 YouTube 自动配音（Auto-dubbed 多 ASR 轨道）场景
 */
function selectPrimaryTrack(tracks: CaptionTrackInfo[]): CaptionTrackInfo {
  const manualTracks = tracks.filter((t) => t.kind !== "asr");
  const asrTracks = tracks.filter((t) => t.kind === "asr");

  // 1. 如果视频只有唯一一条人工字幕（例如 7XzjQa8z0uc 有 1 条 'en' 人工字幕 + 21 条自动配音 ASR 字幕），该人工字幕必为原声字幕
  if (manualTracks.length === 1) {
    return manualTracks[0];
  }

  // 2. 如果只有唯一一条 ASR 语音识别轨道，则它的语言必为原声语言
  if (asrTracks.length === 1 && asrTracks[0].languageCode) {
    const baseLang = asrTracks[0].languageCode.split("-")[0].toLowerCase();
    const matchingManual =
      manualTracks.find(
        (t) =>
          t.languageCode.toLowerCase() ===
          asrTracks[0].languageCode.toLowerCase()
      ) ||
      manualTracks.find(
        (t) => t.languageCode.split("-")[0].toLowerCase() === baseLang
      );

    if (matchingManual) return matchingManual;
    return asrTracks[0];
  }

  // 3. 在人工字幕池（若有）或 ASR 字幕池中，优先选择英语 (en*) 或中文 (zh*)
  const pool = manualTracks.length > 0 ? manualTracks : asrTracks;

  const enTrack = pool.find((t) =>
    t.languageCode.toLowerCase().startsWith("en")
  );
  if (enTrack) return enTrack;

  const zhTrack = pool.find((t) => isChineseLanguage(t.languageCode));
  if (zhTrack) return zhTrack;

  return pool[0] || tracks[0];
}

/**
 * 将已有的官方中文字幕轨道按时间轴对齐到原字幕上
 */
function alignChineseSubtitlesByTime(
  originals: SubtitleItem[],
  zhSubs: SubtitleItem[]
): SubtitleItem[] {
  if (zhSubs.length === originals.length) {
    return originals.map((s, i) => ({
      ...s,
      translation: zhSubs[i].text,
    }));
  }

  return originals.map((orig) => {
    const mid = (orig.start + orig.end) / 2;
    // 寻找覆盖原句中点或时间重叠最大的中文字幕
    let bestMatch: SubtitleItem | null = null;
    let bestOverlap = 0;

    for (const zh of zhSubs) {
      if (zh.end < orig.start - 0.5) continue;
      if (zh.start > orig.end + 0.5) break;

      const overlapStart = Math.max(orig.start, zh.start);
      const overlapEnd = Math.min(orig.end, zh.end);
      const overlap = overlapEnd - overlapStart;

      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestMatch = zh;
      } else if (!bestMatch && mid >= zh.start && mid <= zh.end) {
        bestMatch = zh;
      }
    }

    return {
      ...orig,
      translation: bestMatch ? bestMatch.text : undefined,
    };
  });
}

/**
 * 将非中文字幕并发分批翻译为中文
 */
async function translateSubtitlesToChinese(
  subtitles: SubtitleItem[]
): Promise<SubtitleItem[]> {
  const result: SubtitleItem[] = subtitles.map((s) => ({ ...s }));
  const untranslatedIndices = result
    .map((s, idx) => (!s.translation ? idx : -1))
    .filter((idx) => idx !== -1);

  if (untranslatedIndices.length === 0) {
    return result;
  }

  const BATCH_SIZE = 30;
  const batches: number[][] = [];
  for (let i = 0; i < untranslatedIndices.length; i += BATCH_SIZE) {
    batches.push(untranslatedIndices.slice(i, i + BATCH_SIZE));
  }

  // 控制并发数为 5，加速长视频字幕翻译
  const CONCURRENCY = 5;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (indices) => {
        const joinedText = indices
          .map((idx) => result[idx].text.replace(/\n/g, " "))
          .join("\n");

        try {
          // 优先使用 clients5.google.com (dict-chrome-ex)，不易触发代理 IP 的 429 限制
          const clients5Url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=zh-CN&q=${encodeURIComponent(
            joinedText
          )}`;
          const res = await fetch(clients5Url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
            signal: AbortSignal.timeout(8000),
          });
          if (res.ok) {
            const data = await res.json();
            const translatedFull =
              typeof data?.[0] === "string"
                ? data[0]
                : Array.isArray(data?.[0])
                ? data[0][0] || ""
                : "";
            const lines = String(translatedFull).split("\n");

            indices.forEach((targetIdx, lineIdx) => {
              const trans = (lines[lineIdx] || "").trim();
              if (trans) {
                result[targetIdx].translation = trans;
              }
            });
            return;
          }

          // 备用：translate.googleapis.com
          const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(
            joinedText
          )}`;
          const gtxRes = await fetch(gtxUrl, {
            signal: AbortSignal.timeout(8000),
          });
          if (gtxRes.ok) {
            const data = await gtxRes.json();
            const translatedFull = (data?.[0] || [])
              .map((seg: [string]) => seg?.[0] || "")
              .join("");
            const lines = translatedFull.split("\n");

            indices.forEach((targetIdx, lineIdx) => {
              const trans = (lines[lineIdx] || "").trim();
              if (trans) {
                result[targetIdx].translation = trans;
              }
            });
          }
        } catch {
          // 单批失败不阻塞整体
        }
      })
    );
  }

  return result;
}

/**
 * 核心入口：获取或解析指定 YouTube 视频的字幕与翻译数据
 */
export async function getOrParseVideoData(
  videoId: string
): Promise<VideoLearningData> {
  // 1. 若命中内置精选视频，直接返回
  if (PRESET_VIDEOS[videoId]) {
    return PRESET_VIDEOS[videoId];
  }

  // 2. 检查本地文件缓存
  const cacheFile = getCacheFilePath(videoId);
  if (fs.existsSync(cacheFile)) {
    try {
      const cached: VideoLearningData = JSON.parse(
        fs.readFileSync(cacheFile, "utf-8")
      );
      if (cached && cached.subtitles?.length > 0) {
        // 如果之前缓存的非中文视频存在漏翻句子，自动补齐翻译并更新缓存
        const hasMissingTranslation =
          !cached.isChineseOriginal &&
          cached.subtitles.some((s) => !s.translation);
        if (hasMissingTranslation) {
          cached.subtitles = await translateSubtitlesToChinese(
            cached.subtitles
          );
          try {
            fs.writeFileSync(
              cacheFile,
              JSON.stringify(cached, null, 2),
              "utf-8"
            );
          } catch {
            // ignore
          }
        }
        return cached;
      }
    } catch {
      // ignore corrupted cache
    }
  }

  // 3. 并行请求 oEmbed 元信息与字幕轨道列表
  const [oembed, captionData] = await Promise.all([
    fetchVideoOEmbed(videoId),
    fetchCaptionTracks(videoId),
  ]);

  const tracks = captionData.tracks;
  if (!tracks || tracks.length === 0) {
    if (captionData.failureReason === "BOT_BLOCKED") {
      throw new Error("BOT_BLOCKED");
    }
    if (captionData.failureReason === "NETWORK_ERROR") {
      throw new Error("NETWORK_ERROR");
    }
    if (captionData.failureReason === "VIDEO_UNAVAILABLE") {
      throw new Error("VIDEO_UNAVAILABLE");
    }
    throw new Error("NO_SUBTITLES");
  }

  // 4. 智能选择视频原声主字幕轨道
  const primaryTrack = selectPrimaryTrack(tracks);
  const langCode = primaryTrack.languageCode || "en";

  const subtitles = await downloadTrackSubtitles(primaryTrack.baseUrl, {
    cookie: captionData.cookie,
    userAgent: captionData.userAgent,
  });

  if (!subtitles || subtitles.length === 0) {
    throw new Error("NO_SUBTITLES");
  }

  // 5. 判断该视频是否本身就是中文
  const sampleText = subtitles
    .slice(0, 12)
    .map((s) => s.text)
    .join(" ");
  const isChinese =
    isChineseLanguage(langCode) || isTextMostlyChinese(sampleText);

  let finalSubtitles = subtitles;

  // 6. 如果视频本身不是中文，则需要翻译为中文（同时显示原字幕及其中文翻译）
  if (!isChinese) {
    // 优先查找视频是否已有官方中文字幕轨道（严格按 zh-cn / zh-hans -> zh -> 其他中文 优先级）
    const existingZhTrack =
      tracks.find((t) => {
        const c = t.languageCode.toLowerCase();
        return c === "zh-cn" || c === "zh-hans";
      }) ||
      tracks.find((t) => t.languageCode.toLowerCase() === "zh") ||
      tracks.find((t) => isChineseLanguage(t.languageCode));

    if (existingZhTrack) {
      const zhSubs = await downloadTrackSubtitles(existingZhTrack.baseUrl, {
        cookie: captionData.cookie,
        userAgent: captionData.userAgent,
      });
      if (zhSubs.length > 0) {
        finalSubtitles = alignChineseSubtitlesByTime(subtitles, zhSubs);
      }
    }

    // 对未匹配到中文翻译的句子，调用并发批量翻译补齐
    finalSubtitles = await translateSubtitlesToChinese(finalSubtitles);
  }

  const result: VideoLearningData = {
    videoId,
    title: captionData.title || oembed.title,
    aspectRatio: captionData.aspectRatio || oembed.aspectRatio || 16 / 9,
    isChineseOriginal: isChinese,
    languageCode: langCode,
    subtitles: finalSubtitles,
  };

  // 写入服务端缓存
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2), "utf-8");
  } catch {
    // ignore write error
  }

  return result;
}
