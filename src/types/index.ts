export interface SubtitleItem {
  index: number;        // 字幕序号（从 1 开始）
  start: number;        // 起始时间（秒）
  end: number;          // 结束时间（秒）
  text: string;         // 原字幕文本
  translation?: string; // 中文翻译（中文原声视频为 undefined）
}

export interface VideoLearningData {
  videoId: string;
  title: string;
  aspectRatio: number;        // 原视频宽高比，例如 16/9 (1.7778) 或 4/3 (1.3333)
  isChineseOriginal: boolean; // true 表示原视频本身为中文，不翻译、只显示原字幕
  languageCode: string;       // 原字幕语言代码，如 "en", "zh-CN"
  subtitles: SubtitleItem[];
}

export interface WordLookupResult {
  word: string;        // 用户点击的原词
  lemma?: string;      // 词形还原后的原型词（如有变化）
  phonetic: string;    // 音标，如 /'dɑgmə/
  meaning: string;     // 词性与简明中文释义，如 "n. 教条"
}

export interface RecentVideoItem {
  videoId: string;
  title: string;
  isChineseOriginal: boolean;
  updatedAt: number;
}
