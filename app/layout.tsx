import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar"; // 👈 Navbar 위치가 맞는지 꼭 확인!

export const metadata: Metadata = {
  title: "Bab-Aircraft",
  description: "레이드 이륙 준비 완료! ✈️",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 antialiased font-sans text-gray-900">
        {/* ✈️ 모든 페이지 상단에 고정되는 내비게이션 바 */}
        <Navbar />

        {/* 🍱 각 페이지의 내용이 들어가는 메인 영역 */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}