'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [raids, setRaids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', currentUser.id)
          .single();
        if (profile) setUserName(profile.full_name);
      }

      const { data, error } = await supabase
        .from('raids')
        .select(`*, participants (id)`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("목록 불러오기 실패:", error.message);
      } else if (data) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // 🚀 스마트 정렬: 날짜가 지난 것(Expired)을 아래로 보냅니다.
        const sortedData = [...data].sort((a, b) => {
          const dateA = a.meeting_time ? new Date(a.meeting_time) : null;
          const dateB = b.meeting_time ? new Date(b.meeting_time) : null;
          const isExpiredA = dateA && dateA < now;
          const isExpiredB = dateB && dateB < now;

          if (isExpiredA && !isExpiredB) return 1;
          if (!isExpiredA && isExpiredB) return -1;
          return 0;
        });
        setRaids(sortedData);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setUserName(null);
      alert("안전하게 로그아웃 되었습니다. 🫡");
      router.refresh();
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen text-orange-500 font-black animate-pulse italic bg-gray-50 uppercase tracking-widest">
      SCANNING FLIGHT DATA... ✈️
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen font-sans pb-40">
      
      {/* 🎫 상단 체크인 카운터 */}
      <div className="flex justify-end mb-6">
        {user ? (
          <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-md border border-orange-50">
            <span className="text-[11px] font-black text-gray-800 italic uppercase tracking-tighter">
              <span className="text-orange-500 mr-1 font-black">USER:</span>
              {userName || user.email?.split('@')[0].toUpperCase()}
            </span>
            <div className="w-px h-3 bg-gray-200" />
            <button onClick={handleLogout} className="text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest">
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="text-[10px] font-black text-gray-500 bg-white border border-gray-100 px-5 py-2.5 rounded-full hover:shadow-md transition-all uppercase tracking-widest">Login</Link>
            <Link href="/signup" className="text-[10px] font-black text-white bg-orange-500 px-5 py-2.5 rounded-full shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all uppercase tracking-widest">Sign Up</Link>
          </div>
        )}
      </div>

      {/* 🚀 리스트 영역 */}
      <div className="space-y-8">
        {raids.map((raid) => {
          const participantCount = (raid.participants?.length || 0) + 1;
          const maxParticipants = raid.max_participants || 4;
          const now = new Date();
          now.setHours(0, 0, 0, 0);

          // 🗓️ 상태 체크
          const isDateExpired = raid.meeting_time && new Date(raid.meeting_time) < now;
          const isFull = participantCount >= maxParticipants;
          
          // ✨ 인원이 다 찼어도(isFull) 카드는 선명하게 유지, 날짜가 지난 것만 흐릿하게!
          const isInactiveUI = isDateExpired;

          // ⏰ 시간 텍스트 처리
          const timeArray = Array.isArray(raid.time_mask) ? raid.time_mask : [];
          const firstIndex = timeArray.findIndex((val: any) => val === true || val === "true");
          const lastIndexReverse = [...timeArray].reverse().findIndex((val: any) => val === true || val === "true");
          let timeRangeText = raid.time_category === "미정" ? "미정" : raid.time_category;
          if (firstIndex !== -1) {
            const startHour = (firstIndex + 5) % 24;
            const actualLastIndex = timeArray.length - 1 - lastIndexReverse;
            const endHour = (actualLastIndex + 6) % 24;
            timeRangeText = `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
          }

          return (
            <Link key={raid.id} href={`/raid/${raid.id}`} className="block transform transition-transform active:scale-[0.97]">
              <div className={`group bg-white rounded-[40px] shadow-sm transition-all border-2 overflow-hidden
                ${isInactiveUI ? 'bg-gray-50 opacity-60 border-transparent' : 'border-white hover:border-orange-100 hover:shadow-xl hover:shadow-orange-500/5'}`}>
                
                {/* 📸 카드 상단 이미지 */}
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  {raid.image_url ? (
                    <img src={raid.image_url} alt={raid.store_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                      <span className="text-5xl opacity-30">✈️</span>
                    </div>
                  )}
                  {/* 🏷️ 상태 뱃지 */}
                  <div className="absolute top-4 left-4">
                    <span className={`text-[9px] px-3 py-1 rounded-full font-black tracking-widest uppercase backdrop-blur-md
                      ${isFull ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : isDateExpired ? 'bg-gray-200/80 text-gray-500' : 'bg-orange-500/90 text-white shadow-lg shadow-orange-500/30'}`}>
                      {isFull ? 'FULL' : isDateExpired ? 'Closed' : 'Open'}
                    </span>
                  </div>
                </div>

                {/* 📝 카드 정보 */}
                <div className="p-7">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase italic mb-1">Flight No. {raid.id.slice(0, 4)}</p>
                      <h2 className="text-2xl font-black text-gray-800 tracking-tighter leading-tight group-hover:text-orange-500 transition-colors">{raid.store_name}</h2>
                    </div>
                    {/* 인원수 배지 */}
                    <div className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-center min-w-[60px]">
                      <p className="text-[8px] text-gray-400 font-black uppercase mb-0.5 tracking-tighter">Crew</p>
                      <p className="text-sm font-black text-gray-800 tracking-tighter">
                        <span className={isFull ? "text-red-500" : "text-orange-500"}>{participantCount}</span>/{maxParticipants}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-6 font-bold italic opacity-80">🍴 {raid.menu_info || "메뉴 미정"}</p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-black">
                    {/* 📅 한국어 날짜 */}
                    <span className="bg-gray-900 text-white px-4 py-2 rounded-2xl tracking-tighter italic shadow-sm">
                      날짜: {raid.meeting_time ? new Date(raid.meeting_time).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : "미정 ❓"}
                    </span>
                    {/* ⏰ 시간 */}
                    <span className="bg-orange-50 text-orange-500 px-4 py-2 rounded-2xl tracking-tighter italic border border-orange-100">
                      시간: {timeRangeText}
                    </span>
                    
                    {/* 📍 지도 버튼 (시간 옆 배치) */}
                    {raid.map_link && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault(); 
                          window.open(raid.map_link, '_blank');
                        }}
                        className="bg-green-500 text-white px-4 py-2 rounded-2xl tracking-tighter italic shadow-md hover:bg-green-600 transition-colors flex items-center gap-1"
                      >
                        📍 MAP
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ➕ 하단 네비게이션 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
        <div className="px-6 mb-6">
          <Link href="/create">
            <button className="w-full bg-gray-900 text-white py-5 rounded-[30px] text-sm font-black shadow-2xl hover:bg-orange-500 transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-black group">
              <span className="text-lg group-hover:animate-bounce">✈️</span> 레이드 파티 모집
            </button>
          </Link>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border-t border-gray-100 px-8 py-4 flex justify-between items-center rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <Link href="/" className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">레이드</span>
          </Link>
          <Link href="/wish-menu" className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-xl">🍱</span>
            <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">먹고싶은거</span>
          </Link>
          <Link href="/crew-wanted" className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-xl">📢</span>
            <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">파티구직</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">내 정보</span>
          </Link>
        </div>
      </div>
    </div>
  );
}