import { SubtitleItem, VideoLearningData } from "@/types";
import { PRESET_VIDEOS } from "./presetVideos";

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
 * 内存级视频字幕缓存（适配 Cloudflare Edge / Workers 无本地文件系统环境）
 */
const VIDEO_MEMORY_CACHE = new Map<string, VideoLearningData>();

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
 * 获取 YouTube 访客会话（Cookie 与 VISITOR_DATA），用于绕过匿名 Player 接口的 Bot 校验
 */
async function fetchYouTubeSession(videoId: string): Promise<YouTubeSession> {
  const webUa =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  try {
    const pageRes = await fetch(
      `https://www.youtube.com/watch?v=${videoId}&bpctr=9999999999&has_verified=1`,
      {
        headers: {
          "User-Agent": webUa,
          Cookie: "SOCS=CAI; PREF=hl=en&tz=UTC",
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
    const cookie = ["SOCS=CAI", "PREF=hl=en&tz=UTC", setCookies]
      .filter(Boolean)
      .join("; ");
    const html = await pageRes.text();
    const visitorData =
      html.match(/"VISITOR_DATA"\s*:\s*"([^"]+)"/)?.[1] || "";

    return { cookie, visitorData };
  } catch {
    return { cookie: "SOCS=CAI; PREF=hl=en&tz=UTC", visitorData: "" };
  }
}

/**
 * 通过多客户端轮询提取字幕轨道列表
 */
async function fetchCaptionTracks(videoId: string): Promise<{
  title?: string;
  aspectRatio?: number;
  tracks: CaptionTrackInfo[];
  cookie: string;
  userAgent: string;
}> {
  // 最多尝试 2 轮会话（如果第 1 个 visitorData 会话偶然被风控，刷新一次会话重试）
  for (let attempt = 0; attempt < 2; attempt++) {
    const session = await fetchYouTubeSession(videoId);

    for (const c of INNERTUBE_CLIENTS) {
      try {
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
        const data = await res.json();
        const status = data?.playabilityStatus?.status;

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
      } catch {
        // try next client
      }
    }
  }

  return {
    tracks: [],
    cookie: "SOCS=CAI; PREF=hl=en&tz=UTC",
    userAgent: INNERTUBE_CLIENTS[0].ua,
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
  baseUrl: string,
  headers: { cookie?: string; userAgent?: string } = {}
): Promise<SubtitleItem[]> {
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
 * YouTube 返回的 captionTracks 默认按语言名称字母序排列（例如 Arabic 'ar' 会排在 English 'en' 前面）。
 * 因此需要通过 ASR（自动语音识别）轨道语言或优先匹配原声语言（en / zh）来选出真正的原声字幕。
 */
function selectPrimaryTrack(tracks: CaptionTrackInfo[]): CaptionTrackInfo {
  // 1. ASR 自动语音识别轨道的语言一定等于视频原本的说话语言
  const asrTrack = tracks.find((t) => t.kind === "asr");
  const manualTracks = tracks.filter((t) => t.kind !== "asr");

  if (asrTrack && asrTrack.languageCode) {
    const baseLang = asrTrack.languageCode.split("-")[0].toLowerCase();
    // 优先寻找与原声语言一致的人工上传字幕
    const matchingManual =
      manualTracks.find(
        (t) => t.languageCode.toLowerCase() === asrTrack.languageCode.toLowerCase()
      ) ||
      manualTracks.find(
        (t) => t.languageCode.split("-")[0].toLowerCase() === baseLang
      );

    if (matchingManual) {
      return matchingManual;
    }
    // 若该视频只有其他国家的翻译字幕和原声 ASR 字幕，优先使用原声 ASR 字幕
    return asrTrack;
  }

  // 2. 若没有 ASR 轨道，在人工字幕中优先匹配英文 (en*) 或中文 (zh*)
  const enManual = manualTracks.find((t) =>
    t.languageCode.toLowerCase().startsWith("en")
  );
  if (enManual) return enManual;

  const zhManual = manualTracks.find((t) =>
    isChineseLanguage(t.languageCode)
  );
  if (zhManual) return zhManual;

  return manualTracks[0] || tracks[0];
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
 * 单批文本调用 Google 翻译接口（优先使用 POST 表单提交避免长 URL 被 400/414 拒绝，失败时自动降级备选端点）
 */
async function translateBatchText(joinedText: string): Promise<string | null> {
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  const formBody = new URLSearchParams({ q: joinedText }).toString();

  // 1. 优先通过 POST 请求 translate.googleapis.com (gtx)，无 URL 长度限制且保留换行最稳定
  try {
    const gtxPostUrl =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t";
    const res = await fetch(gtxPostUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": ua,
      },
      body: formBody,
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const translatedFull = (data?.[0] || [])
        .map((seg: [string]) => seg?.[0] || "")
        .join("");
      if (translatedFull.trim()) {
        return translatedFull;
      }
    }
  } catch {
    // try next endpoint
  }

  // 2. 备选：通过 POST 请求 clients5.google.com (dict-chrome-ex)
  try {
    const clients5PostUrl =
      "https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=zh-CN";
    const res = await fetch(clients5PostUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": ua,
      },
      body: formBody,
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const translatedFull =
        typeof data?.[0] === "string"
          ? data[0]
          : Array.isArray(data?.[0])
          ? data[0][0] || ""
          : Array.isArray(data?.sentences)
          ? data.sentences.map((s: { trans?: string }) => s?.trans || "").join("")
          : "";
      if (String(translatedFull).trim()) {
        return String(translatedFull);
      }
    }
  } catch {
    // try next endpoint
  }

  // 3. 兜底：通过 GET 请求 translate.googleapis.com（适用于短批次）
  try {
    const gtxGetUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(
      joinedText
    )}`;
    const res = await fetch(gtxGetUrl, {
      headers: { "User-Agent": ua },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const translatedFull = (data?.[0] || [])
        .map((seg: [string]) => seg?.[0] || "")
        .join("");
      if (translatedFull.trim()) {
        return translatedFull;
      }
    }
  } catch {
    // ignore
  }

  return null;
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

  // 同时按句数（最多 35 句）与字符数（最多 2200 字符）动态分批，兼顾 Cloudflare 子请求数上限与单次翻译体积
  const MAX_ITEMS_PER_BATCH = 35;
  const MAX_CHARS_PER_BATCH = 2200;
  const batches: number[][] = [];
  let currentBatch: number[] = [];
  let currentChars = 0;

  for (const idx of untranslatedIndices) {
    const lineLen = result[idx].text.length + 1;
    if (
      currentBatch.length > 0 &&
      (currentBatch.length >= MAX_ITEMS_PER_BATCH ||
        currentChars + lineLen > MAX_CHARS_PER_BATCH)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }
    currentBatch.push(idx);
    currentChars += lineLen;
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  // 控制并发数为 5，加速长视频字幕翻译
  const CONCURRENCY = 5;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (indices) => {
        const joinedText = indices
          .map((idx) => result[idx].text.replace(/[\r\n]+/g, " ").trim() || ".")
          .join("\n");

        const translatedFull = await translateBatchText(joinedText);
        if (!translatedFull) return;

        const lines = translatedFull.split(/\r?\n/);
        indices.forEach((targetIdx, lineIdx) => {
          const trans = (lines[lineIdx] || "").trim();
          if (trans) {
            result[targetIdx].translation = trans;
          }
        });
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

  // 2. 检查内存缓存
  const cached = VIDEO_MEMORY_CACHE.get(videoId);
  if (cached && cached.subtitles?.length > 0) {
    const hasMissingTranslation =
      !cached.isChineseOriginal &&
      cached.subtitles.some((s) => !s.translation);
    if (hasMissingTranslation) {
      cached.subtitles = await translateSubtitlesToChinese(cached.subtitles);
      VIDEO_MEMORY_CACHE.set(videoId, cached);
    }
    return cached;
  }

  // 3. 并行请求 oEmbed 元信息与字幕轨道列表
  const [oembed, captionData] = await Promise.all([
    fetchVideoOEmbed(videoId),
    fetchCaptionTracks(videoId),
  ]);

  const tracks = captionData.tracks;
  if (!tracks || tracks.length === 0) {
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
    // 6.1 优先查找视频是否已有官方中文字幕轨道（严格按 zh-cn / zh-hans -> zh -> 其他中文 优先级）
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

    // 6.2 若无现成人工中文字幕，尝试请求 YouTube 原生自动翻译轨道 (&tlang=zh-Hans)，仅需 1 次请求即可对齐全片
    const hasTranslatedCount = finalSubtitles.filter((s) => Boolean(s.translation)).length;
    if (
      hasTranslatedCount < finalSubtitles.length * 0.5 &&
      primaryTrack.isTranslatable !== false
    ) {
      const autoZhUrl = primaryTrack.baseUrl.includes("tlang=")
        ? primaryTrack.baseUrl.replace(/tlang=[^&]+/, "tlang=zh-Hans")
        : `${primaryTrack.baseUrl}&tlang=zh-Hans`;
      const autoZhSubs = await downloadTrackSubtitles(autoZhUrl, {
        cookie: captionData.cookie,
        userAgent: captionData.userAgent,
      });
      if (autoZhSubs.length > 0) {
        const autoZhSample = autoZhSubs
          .slice(0, 12)
          .map((s) => s.text)
          .join(" ");
        if (isTextMostlyChinese(autoZhSample)) {
          finalSubtitles = alignChineseSubtitlesByTime(finalSubtitles, autoZhSubs);
        }
      }
    }

    // 6.3 对仍未匹配到中文翻译的句子，调用并发 POST 批量翻译补齐
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

  // 写入内存缓存
  VIDEO_MEMORY_CACHE.set(videoId, result);

  return result;
}
