import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API 用量追踪",
  description: "Track usage of various APIs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
