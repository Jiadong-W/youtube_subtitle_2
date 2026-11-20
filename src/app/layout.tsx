import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EchoTube - YouTube 沉浸式双语精听与查词学习",
  description:
    "粘贴 YouTube 视频链接即可开启双语字幕对照、点击字幕跳转时间戳、点击单词即时查词的极简英语学习工具。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-paper-bg text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
