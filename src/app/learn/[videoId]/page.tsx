"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SubtitleItem, VideoLearningData } from "@/types";
import YouTubePlayer, {
  YouTubePlayerHandle,
} from "@/components/YouTubePlayer";
import CurrentSubtitleCard from "@/components/CurrentSubtitleCard";
import SubtitleList from "@/components/SubtitleList";
import PlaybackControls from "@/components/PlaybackControls";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";

function LearnVideoContent() {
  const params = useParams<{ videoId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = params?.videoId || "";
  const initialTimeParam = Number(searchParams.get("t") || "0");

  const playerRef = useRef<YouTubePlayerHandle | null>(null);

  const [videoData, setVideoData] = useState<VideoLearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopSingle, setLoopSingle] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);

  const activeIndexRef = useRef(0);
  const loopSingleRef = useRef(false);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    loopSingleRef.current = loopSingle;
  }, [loopSingle]);

  // 加载视频与字幕数据
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    fetch(`/api/video/parse?videoId=${encodeURIComponent(videoId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "该视频暂无可用字幕，请更换视频");
        }
        if (!cancelled) {
          setVideoData(data);
          // 如果 URL 带有初始时间戳参数（例如 ?t=741 对应 Don't be trapped by dogma），定位到对应句子
          if (initialTimeParam > 0 && data.subtitles?.length > 0) {
            const foundIdx = data.subtitles.findIndex(
              (s: SubtitleItem) =>
                initialTimeParam >= s.start && initialTimeParam <= s.end
            );
            if (foundIdx !== -1) {
              setActiveIndex(foundIdx);
            }
          }
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "该视频暂无可用字幕，请更换视频"
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [videoId, initialTimeParam]);

  // 根据播放器实时时间匹配当前字幕，并处理单句循环
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!videoData || videoData.subtitles.length === 0) return;
      const subs = videoData.subtitles;
      const currIdx = activeIndexRef.current;
      const currentSub = subs[currIdx];

      // 单句循环逻辑
      if (
        loopSingleRef.current &&
        currentSub &&
        currentTime >= currentSub.end - 0.08
      ) {
        playerRef.current?.seekTo(currentSub.start);
        return;
      }

      // 查找当前时间所在的字幕条目
      let matchedIndex = -1;
      for (let i = 0; i < subs.length; i++) {
        if (currentTime >= subs[i].start && currentTime < subs[i].end) {
          matchedIndex = i;
          break;
        }
      }

      // 若处于两句之间的短暂间隙，保持最近的前一句高亮
      if (matchedIndex === -1) {
        for (let i = subs.length - 1; i >= 0; i--) {
          if (currentTime >= subs[i].start) {
            matchedIndex = i;
            break;
          }
        }
      }

      if (matchedIndex !== -1 && matchedIndex !== activeIndexRef.current) {
        setActiveIndex(matchedIndex);
      }
    },
    [videoData]
  );

  // 点击右侧某条字幕 -> 视频立即跳转到该字幕对应的时间戳
  const handleSelectSubtitle = (sub: SubtitleItem) => {
    if (!videoData) return;
    const idx = videoData.subtitles.findIndex((s) => s.index === sub.index);
    if (idx !== -1) {
      setActiveIndex(idx);
    }
    playerRef.current?.seekTo(sub.start);
  };

  const handlePrevSentence = () => {
    if (!videoData || videoData.subtitles.length === 0) return;
    const targetIdx = Math.max(0, activeIndex - 1);
    setActiveIndex(targetIdx);
    playerRef.current?.seekTo(videoData.subtitles[targetIdx].start);
  };

  const handleNextSentence = () => {
    if (!videoData || videoData.subtitles.length === 0) return;
    const targetIdx = Math.min(
      videoData.subtitles.length - 1,
      activeIndex + 1
    );
    setActiveIndex(targetIdx);
    playerRef.current?.seekTo(videoData.subtitles[targetIdx].start);
  };

  const handleChangeRate = (rate: number) => {
    setPlaybackRate(rate);
    playerRef.current?.setPlaybackRate(rate);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper-bg text-stone-600 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-brand-navy" />
        <p className="text-sm">正在加载视频与字幕数据...</p>
      </div>
    );
  }

  if (errorMsg || !videoData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper-bg px-4">
        <div className="bg-white rounded-2xl border border-paper-border p-8 max-w-md w-full text-center shadow-xs">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-medium text-stone-900 mb-2">
            {errorMsg || "该视频暂无可用字幕，请更换视频"}
          </h2>
          <p className="text-xs text-stone-500 mb-6">
            请确认输入的 YouTube 视频包含可用字幕后重试
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl bg-brand-navy text-white text-sm font-medium hover:bg-brand-navyHover transition-colors"
          >
            返回首页更换视频
          </button>
        </div>
      </div>
    );
  }

  const currentSubtitle = videoData.subtitles[activeIndex] || null;

  return (
    <div className="h-screen flex flex-col bg-paper-bg overflow-hidden">
      {/* 顶部导航栏（完全对齐 example.jpg 顶部样式） */}
      <header className="h-12 px-4 bg-[#FDFCF9] border-b border-paper-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => router.push("/")}
            title="返回首页"
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm md:text-[15px] font-medium text-stone-800 truncate">
            {videoData.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-400 shrink-0">
          <span>
            {videoData.isChineseOriginal ? "中文原声视频" : "英文/外语双语对照"}
          </span>
        </div>
      </header>

      {/* 主体双栏区域（左侧：原比例视频 + 左下角当前句与点词翻译；右侧：字幕列表 + 底部播控） */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 p-3 md:p-4 gap-4">
        {/* 左侧栏 */}
        <div className="flex-1 lg:w-[62%] flex flex-col gap-3 min-h-0">
          {/* 左侧上方：保持原视频长宽比的视频播放区 */}
          <YouTubePlayer
            ref={playerRef}
            videoId={videoData.videoId}
            aspectRatio={videoData.aspectRatio}
            initialTime={initialTimeParam}
            onTimeUpdate={handleTimeUpdate}
            onPlayStateChange={setIsPlaying}
          />

          {/* 左侧下方：正在播放的那句字幕及其翻译 + 点击单词弹出词卡（参考 certain_word.jpg） */}
          <CurrentSubtitleCard
            subtitle={currentSubtitle}
            isChineseOriginal={videoData.isChineseOriginal}
            showTranslation={showTranslation}
          />
        </div>

        {/* 右侧栏：原视频字幕与翻译列表 + 播控条 */}
        <div className="lg:w-[38%] xl:w-[36%] h-[45vh] lg:h-full bg-[#F8F6F0] rounded-xl border border-paper-border flex flex-col min-h-0 overflow-hidden shadow-2xs">
          <SubtitleList
            subtitles={videoData.subtitles}
            activeIndex={activeIndex}
            isChineseOriginal={videoData.isChineseOriginal}
            showTranslation={showTranslation}
            onToggleTranslation={() => setShowTranslation((prev) => !prev)}
            onSelectSubtitle={handleSelectSubtitle}
          />

          <PlaybackControls
            currentSentenceNum={currentSubtitle ? currentSubtitle.index : 1}
            totalSentences={videoData.subtitles.length}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            loopSingle={loopSingle}
            onPrevSentence={handlePrevSentence}
            onNextSentence={handleNextSentence}
            onTogglePlay={() => playerRef.current?.togglePlay()}
            onChangeRate={handleChangeRate}
            onToggleLoopSingle={() => setLoopSingle((prev) => !prev)}
          />
        </div>
      </div>
    </div>
  );
}

export default function LearnVideoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-paper-bg text-stone-600 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-brand-navy" />
          <p className="text-sm">正在加载学习页面...</p>
        </div>
      }
    >
      <LearnVideoContent />
    </Suspense>
  );
}
