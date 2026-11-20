"use client";

import React, { useEffect, useState } from "react";
import { SubtitleItem, WordLookupResult } from "@/types";
import { Volume2, X, Loader2 } from "lucide-react";

interface CurrentSubtitleCardProps {
  subtitle: SubtitleItem | null;
  isChineseOriginal: boolean;
  showTranslation: boolean;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 将英文句子切分为可点击的单词 Token 与非单词分隔符 Token
 */
function tokenizeSentence(
  sentence: string
): { text: string; isWord: boolean; clean: string }[] {
  const regex = /([a-zA-Z]+(?:'[a-zA-Z]+)?)/g;
  const tokens: { text: string; isWord: boolean; clean: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sentence)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: sentence.slice(lastIndex, match.index),
        isWord: false,
        clean: "",
      });
    }
    const wordText = match[1];
    const clean = wordText.replace(/'s$/i, "");
    tokens.push({
      text: wordText,
      isWord: true,
      clean,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < sentence.length) {
    tokens.push({
      text: sentence.slice(lastIndex),
      isWord: false,
      clean: "",
    });
  }

  return tokens;
}

export default function CurrentSubtitleCard({
  subtitle,
  isChineseOriginal,
  showTranslation,
}: CurrentSubtitleCardProps) {
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(
    null
  );
  const [wordResult, setWordResult] = useState<WordLookupResult | null>(null);
  const [loadingWord, setLoadingWord] = useState(false);

  // 当播放进入新的一句字幕时，清除上一句的选中单词高亮
  useEffect(() => {
    setSelectedTokenIndex(null);
  }, [subtitle?.index]);

  const handleWordClick = async (cleanWord: string, tokenIdx: number) => {
    // 严格遵守确认的产品规则：单词翻译卡片弹出时【不会暂停视频】
    setSelectedTokenIndex(tokenIdx);
    setLoadingWord(true);

    try {
      const res = await fetch(
        `/api/dict?word=${encodeURIComponent(cleanWord)}`
      );
      if (res.ok) {
        const data: WordLookupResult = await res.json();
        setWordResult(data);
      } else {
        setWordResult({
          word: cleanWord,
          phonetic: "",
          meaning: "暂无该词释义",
        });
      }
    } catch {
      setWordResult({
        word: cleanWord,
        phonetic: "",
        meaning: "查询失败，请重试",
      });
    } finally {
      setLoadingWord(false);
    }
  };

  const handleSpeak = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleClosePopup = () => {
    setWordResult(null);
    setSelectedTokenIndex(null);
  };

  if (!subtitle) {
    return (
      <div className="flex-1 bg-[#F5F2EA] rounded-xl border border-paper-border flex flex-col items-center justify-center p-6 text-stone-400">
        <p className="text-base">播放视频或点击右侧字幕以显示当前句子</p>
      </div>
    );
  }

  const tokens = tokenizeSentence(subtitle.text);

  return (
    <div className="flex-1 bg-[#F5F2EA] rounded-xl border border-paper-border flex flex-col items-center justify-center px-8 py-6 relative min-h-[210px] transition-all">
      {/* 当前句原文：英文单词支持独立点击 */}
      <div className="text-center max-w-3xl leading-relaxed">
        {isChineseOriginal ? (
          <p className="text-2xl md:text-[26px] font-medium text-stone-800 tracking-wide">
            {subtitle.text}
          </p>
        ) : (
          <p className="font-serif text-2xl md:text-[28px] text-stone-900 leading-snug select-none">
            {tokens.map((token, idx) => {
              if (!token.isWord) {
                return <span key={idx}>{token.text}</span>;
              }
              const isSelected = selectedTokenIndex === idx;
              return (
                <span
                  key={idx}
                  onClick={() => handleWordClick(token.clean, idx)}
                  title="点击查看单词释义（不暂停视频）"
                  className={`inline-block cursor-pointer rounded px-1 transition-colors ${
                    isSelected
                      ? "bg-[#E0E4EE] border-b-2 border-brand-navy text-stone-950"
                      : "hover:bg-[#E6E3DA]"
                  }`}
                >
                  {token.text}
                </span>
              );
            })}
          </p>
        )}

        {/* 中文翻译（仅当视频本身非中文且开启双语时显示） */}
        {!isChineseOriginal && showTranslation && subtitle.translation && (
          <p className="mt-3 text-base md:text-lg text-stone-600 font-normal">
            {subtitle.translation}
          </p>
        )}
      </div>

      {/* 底部区域：弹出单词翻译卡片（参考 certain_word.jpg）或句子序号时间戳 */}
      {loadingWord || wordResult ? (
        <div className="mt-5 w-full max-w-xl bg-white rounded-xl shadow-sm border border-[#E6E2D8] px-5 py-3 flex items-center justify-between gap-4 animate-in fade-in duration-150">
          {loadingWord ? (
            <div className="flex items-center gap-2 text-stone-500 text-sm py-0.5">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>正在查询单词释义...</span>
            </div>
          ) : wordResult ? (
            <>
              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 min-w-0">
                <span className="font-serif text-xl text-stone-900 font-normal">
                  {wordResult.word}
                </span>
                {wordResult.phonetic && (
                  <span className="text-sm text-stone-500 font-sans">
                    {wordResult.phonetic}
                  </span>
                )}
                <span className="text-base text-stone-800 font-medium truncate">
                  {wordResult.meaning}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSpeak(wordResult.word)}
                  title="朗读发音"
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClosePopup}
                  title="关闭"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 text-xs text-stone-400 font-mono tracking-wider">
          #{subtitle.index} · {formatTime(subtitle.start)}
        </div>
      )}
    </div>
  );
}
