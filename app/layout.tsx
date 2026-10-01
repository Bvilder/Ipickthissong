import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "我选这首歌 · 音乐人格选择游戏",
  description: "从歌单里选出你的最爱",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
