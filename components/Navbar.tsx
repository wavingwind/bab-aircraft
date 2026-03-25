'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-[100] bg-gray-50/80 backdrop-blur-md px-6 py-4 border-b border-gray-100">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* ✈️ 로고 영역 */}
        <Link href="/" className="flex flex-col items-start">
          <h1 className="text-xl font-black text-orange-500 italic tracking-tighter leading-none">
            밥항공기
          </h1>
          <span className="text-[8px] text-gray-300 font-black uppercase tracking-[0.3em]">
            bab-aircraft
          </span>
        </Link>

        {/* 💬 고정 단톡방 버튼 */}
        <a 
          href="https://invite.kakao.com/tc/jn6rFXLGTz" // 👈 여기에 실제 오픈채팅 링크 입력!
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#FEE500] text-[#3A1D1D] px-3 py-1.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all border border-yellow-400/50"
        >
          <span className="text-xs">💬</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">단톡방</span>
        </a>
      </div>
    </nav>
  );
}