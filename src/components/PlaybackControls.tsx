"use client";

import React from "react";
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat1,
} from "lucide-react";

interface PlaybackControlsProps {
  currentSentenceNum: number;
  totalSentences: number;
  isPlaying: boolean;
  playbackRate: number;
  loopSingle: boolean;
  onPrevSentence: () => void;
  onNextSentence: () => void;
  onTogglePlay: () => void;
  onChangeRate: (rate: number) => void;
  onToggleLoopSingle: () => void;
}

const RATES = [0.75, 1, 1.25, 1.5];

export default function PlaybackControls({
  currentSentenceNum,
  totalSentences,
  isPlaying,
  playbackRate,
  loopSingle,
  onPrevSentence,
  onNextSentence,
  onTogglePlay,
  onChangeRate,
  onToggleLoopSingle,
}: PlaybackControlsProps) {
  const handleCycleRate = () => {
    const idx = RATES.indexOf(playbackRate);
    const nextRate = RATES[(idx + 1) % RATES.length];
    onChangeRate(nextRate);
  };

  return (
    <div className="h-14 px-4 border-t border-paper-border bg-[#F8F6F0] flex items-center justify-between shrink-0 select-none">
      {/* 左侧：句数进度 */}
      <div className="text-xs text-stone-500 font-medium min-w-[95px]">
        第 {currentSentenceNum} / {totalSentences} 句
      </div>

      {/* 中间：上一句、播放/暂停、下一句 */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPrevSentence}
          title="上一句"
          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          title={isPlaying ? "暂停" : "播放"}
          className="w-9 h-9 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white flex items-center justify-center shadow-xs transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={onNextSentence}
          title="下一句"
          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* 右侧：倍速与单句循环 */}
      <div className="flex items-center justify-end gap-2 min-w-[95px]">
        <button
          type="button"
          onClick={handleCycleRate}
          title="切换播放倍速"
          className="px-2 py-1 rounded text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
        >
          {playbackRate}x
        </button>

        <button
          type="button"
          onClick={onToggleLoopSingle}
          title={loopSingle ? "已开启单句循环" : "开启单句循环"}
          className={`p-1.5 rounded-lg transition-colors ${
            loopSingle
              ? "bg-[#E2E5F0] text-brand-navy"
              : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/60"
          }`}
        >
          <Repeat1 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
