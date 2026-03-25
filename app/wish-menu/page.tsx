'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function WishMenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      fetchWishes();
    }
    getInitialData();
  }, []);

  async function fetchWishes() {
    const { data, error } = await supabase
      .from('wish_menus')
      .select(`*, wish_votes(id)`)
      .order('created_at', { ascending: false });

    if (!error) setItems(data || []);
    setLoading(false);
  }

  // 🔥 삭제 함수 추가
  const handleDelete = async (e: React.MouseEvent, wishId: string, creatorId: string) => {
    e.preventDefault();
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

    if (currentUserId !== creatorId) {
      return alert("본인이 등록한 메뉴만 삭제할 수 있습니다! 🙅‍♂️");
    }

    if (!confirm("이 메뉴 제안을 삭제할까요?")) return;

    const { error } = await supabase
      .from('wish_menus')
      .delete()
      .eq('id', wishId);

    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      alert("삭제되었습니다. 🫡");
      fetchWishes(); // 목록 새로고침
    }
  };

  const handleVote = async (e: React.MouseEvent, wishId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다!");

    const { error } = await supabase
      .from('wish_votes')
      .insert({ wish_id: wishId, user_id: user.id });

    if (error) {
      if (error.code === '23505') alert("이미 투표하셨습니다! 😉");
      else alert("투표 실패: " + error.message);
    } else {
      fetchWishes();
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse font-black text-orange-500 uppercase italic">Loading Menu... 🍱</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen pb-40">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-orange-500 italic tracking-tighter mb-1 uppercase">WISH MENU</h1>
        <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.4em] ml-1">오늘 뭐 먹지? 투표해봐요</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border-2 border-white hover:border-orange-100 transition-all relative group">
            
            {/* 🗑️ 삭제 버튼 (본인일 때만 표시) */}
            {currentUserId === item.creator_id && (
              <button 
                onClick={(e) => handleDelete(e, item.id, item.creator_id)}
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-colors"
              >
                ✕
              </button>
            )}

            <div className="relative h-32 bg-gray-100">
              {item.image_url ? (
                <img src={item.image_url} className="w-full h-full object-cover" alt={item.menu_name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🍲</div>
              )}
              <button 
                onClick={(e) => handleVote(e, item.id)}
                className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 active:scale-90 transition-transform"
              >
                <span className="text-xs">🔥</span>
                <span className="text-[10px] font-black text-orange-500">{item.wish_votes?.length || 0}</span>
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-black text-sm text-gray-800 tracking-tighter truncate">{item.menu_name}</h3>
              <p className="text-[10px] text-gray-400 font-bold truncate">@ {item.store_name || "장소 미정"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ➕ 글쓰기 플로팅 버튼 */}
      <Link href="/wish-menu/create">
        <button className="fixed bottom-28 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-2xl shadow-orange-500/40 flex items-center justify-center text-2xl font-black hover:rotate-90 transition-transform active:scale-90 z-50">
          +
        </button>
      </Link>

      {/* 하단 탭 바 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl border-t border-gray-100 px-8 py-4 flex justify-between items-center rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <Link href="/" className="flex flex-col items-center gap-1 opacity-40">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">레이드</span>
          </Link>
          <Link href="/wish-menu" className="flex flex-col items-center gap-1">
            <span className="text-xl">🍱</span>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">먹고싶은거</span>
          </Link>
          <Link href="/crew-wanted" className="flex flex-col items-center gap-1 opacity-40">
            <span className="text-xl">📢</span>
            <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">파티구직</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 opacity-40">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">내 정보</span>
          </Link>
        </div>
      </div>
    </div>
  );
}