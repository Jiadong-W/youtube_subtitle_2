"use client";

import React, { useEffect, useRef, useState } from "react";
import { SubtitleItem } from "@/types";
import { Languages, LocateFixed } from "lucide-react";

interface SubtitleListProps {
  subtitles: SubtitleItem[];
  activeIndex: number;
  isChineseOriginal: boolean;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  onSelectSubtitle: (subtitle: SubtitleItem) => void;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SubtitleList({
  subtitles,
  activeIndex,
  isChineseOriginal,
  showTranslation,
  onToggleTranslation,
  onSelectSubtitle,
}: SubtitleListProps) {
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 当前播放句变化时，若未处于用户手动滚动状态，平滑居中滚动到当前句
  useEffect(() => {
    if (isUserScrolling) return;
    const activeEl = itemRefs.current[activeIndex];
    if (activeEl && listContainerRef.current) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex, isUserScrolling]);

  const handleUserScrollInteraction = () => {
    setIsUserScrolling(true);
    if (userScrollTimerRef.current) {
      clearTimeout(userScrollTimerRef.current);
    }
    userScrollTimerRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 6000);
  };

  const scrollToActiveNow = () => {
    setIsUserScrolling(false);
    const activeEl = itemRefs.current[activeIndex];
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* 右侧顶部工具栏（参考 example.jpg） */}
      <div className="h-12 px-4 border-b border-paper-border flex items-center justify-between shrink-0 bg-[#F8F6F0]">
        <div className="flex items-center gap-2">
          {!isChineseOriginal ? (
            <button
              type="button"
              onClick={onToggleTranslation}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                showTranslation
                  ? "bg-white text-stone-800 border-stone-300 shadow-2xs"
                  : "bg-transparent text-stone-500 border-stone-200 hover:bg-stone-200/50"
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{showTranslation ? "双语" : "仅原文"}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-200/70 text-stone-700">
              中文原声（仅显示原字幕）
            </span>
          )}
          <span className="text-xs text-stone-500 px-2 py-1 font-medium border-b-2 border-stone-800 text-stone-900">
            精听
          </span>
        </div>

        <span className="text-xs text-stone-400">
          点击任意字幕跳转对应时间戳
        </span>
      </div>

      {/* 字幕滚动列表 */}
      <div
        ref={listContainerRef}
        onWheel={handleUserScrollInteraction}
        onTouchMove={handleUserScrollInteraction}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scroll-smooth"
      >
        {subtitles.map((sub, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={sub.index}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              onClick={() => onSelectSubtitle(sub)}
              className={`group rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                isActive
                  ? "bg-[#E2E5F0] text-stone-950"
                  : "hover:bg-[#EFECE2] text-stone-800"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono mb-1">
                <span>
                  {sub.index} &nbsp;{formatTimestamp(sub.start)}
                </span>
              </div>

              <p
                className={`${
                  isChineseOriginal
                    ? "font-sans text-[15px]"
                    : "font-serif text-[16px]"
                } leading-relaxed text-stone-900`}
              >
                {sub.text}
              </p>

              {!isChineseOriginal && showTranslation && sub.translation && (
                <p className="mt-1 text-xs md:text-[13px] text-stone-500 leading-relaxed">
                  {sub.translation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 用户手动滚动时的“回到当前句”快捷悬浮按钮 */}
      {isUserScrolling && (
        <button
          type="button"
          onClick={scrollToActiveNow}
          className="absolute bottom-4 right-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-navy text-white text-xs font-medium shadow-md hover:bg-brand-navyHover transition-all"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          <span>回到当前句</span>
        </button>
      )}
    </div>
  );
}
