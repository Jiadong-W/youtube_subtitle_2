"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RecentVideoItem } from "@/types";
import {
  PlayCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

const RECENT_STORAGE_KEY = "yt_learn_recent_videos";

export default function HomePage() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentVideos, setRecentVideos] = useState<RecentVideoItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      if (raw) {
        setRecentVideos(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentVideo = (item: RecentVideoItem) => {
    try {
      const filtered = recentVideos.filter((v) => v.videoId !== item.videoId);
      const updated = [item, ...filtered].slice(0, 5);
      setRecentVideos(updated);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleStartLearning = async (targetUrl?: string) => {
    const finalUrl = (targetUrl ?? urlInput).trim();
    if (!finalUrl) {
      setErrorMsg("请输入有效的 YouTube 视频链接");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/video/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 无字幕时直接提示：“该视频暂无可用字幕，请更换视频”
        setErrorMsg(data?.message || "该视频暂无可用字幕，请更换视频");
        setLoading(false);
        return;
      }

      saveRecentVideo({
        videoId: data.videoId,
        title: data.title,
        isChineseOriginal: data.isChineseOriginal,
        updatedAt: Date.now(),
      });

      router.push(`/learn/${data.videoId}`);
    } catch {
      setErrorMsg("该视频暂无可用字幕，请更换视频");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-paper-bg">
      <div className="w-full max-w-2xl">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE6DA] text-stone-700 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-navy" />
            <span>即贴即学 · YouTube 极简双语精听工具</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-normal text-stone-900 tracking-tight">
            看原版 YouTube 视频学英语
          </h1>
          <p className="mt-2.5 text-sm md:text-base text-stone-600">
            粘贴 YouTube 链接即可生成双语对照字幕 · 点击单句跳转时间戳 · 点击单词即时查词
          </p>
        </div>

        {/* 链接输入卡片 */}
        <div className="bg-[#FDFCF9] rounded-2xl border border-paper-border shadow-xs p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStartLearning();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="粘贴 YouTube 视频链接，例如 https://www.youtube.com/watch?v=UF8uR6Z6KLc"
              className="flex-1 px-4 py-3 rounded-xl bg-[#F5F2EA] border border-paper-border text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-brand-navy hover:bg-brand-navyHover disabled:opacity-60 text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在解析字幕...</span>
                </>
              ) : (
                <>
                  <span>开始学习</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 错误/无字幕提示 */}
          {errorMsg && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 示例视频快速体验 */}
          <div className="mt-6 pt-5 border-t border-paper-border/80">
            <div className="text-xs font-medium text-stone-500 mb-3">
              一键体验示例视频（与参考图一致）：
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push("/learn/UF8uR6Z6KLc?t=741")
                }
                className="text-left p-3.5 rounded-xl bg-[#F5F2EA] hover:bg-[#ECE8DC] border border-paper-border transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-brand-navy/10 text-brand-navy">
                    英文原声 · 双语对照 (4:3 比例)
                  </span>
                  <PlayCircle className="w-4 h-4 text-stone-400 group-hover:text-brand-navy transition-colors" />
                </div>
                <p className="text-sm font-medium text-stone-900 line-clamp-1">
                  乔布斯 2005 斯坦福毕业演讲
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  直达 12:21 &ldquo;Don&apos;t be trapped by dogma&rdquo; 片段
                </p>
              </button>

              <button
                type="button"
                onClick={() => router.push("/learn/5qap5aO4i9A")}
                className="text-left p-3.5 rounded-xl bg-[#F5F2EA] hover:bg-[#ECE8DC] border border-paper-border transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                    中文原声 · 自动不翻译
                  </span>
                  <PlayCircle className="w-4 h-4 text-stone-400 group-hover:text-brand-navy transition-colors" />
                </div>
                <p className="text-sm font-medium text-stone-900 line-clamp-1">
                  【中文原声示例】原字幕展示验证
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  验证“中文视频不翻译、只显示原字幕”规则
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* 本地最近观看记录 */}
        {recentVideos.length > 0 && (
          <div className="mt-6 bg-[#FDFCF9] rounded-2xl border border-paper-border p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>最近学习记录</span>
            </div>
            <div className="space-y-2">
              {recentVideos.map((item) => (
                <div
                  key={item.videoId}
                  onClick={() => router.push(`/learn/${item.videoId}`)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#F5F2EA] cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-stone-800 truncate">
                      {item.title}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-500 shrink-0">
                    {item.isChineseOriginal ? "中文原声" : "双语字幕"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
