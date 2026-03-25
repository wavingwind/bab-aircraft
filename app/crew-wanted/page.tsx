'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CrewWantedPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        async function getInitialData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
            fetchPosts();
        }
        getInitialData();
    }, []);

    async function fetchPosts() {
        const { data, error } = await supabase
            .from('crew_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            const now = new Date();
            now.setHours(0, 0, 0, 0); // 오늘 0시 기준

            // 🔥 스마트 정렬 로직
            const sortedData = [...data].sort((a, b) => {
                const dateA = a.meeting_date ? new Date(a.meeting_date) : null;
                const dateB = b.meeting_date ? new Date(b.meeting_date) : null;

                const isExpiredA = dateA && dateA < now;
                const isExpiredB = dateB && dateB < now;

                // 1순위: 만료되지 않은 글(미래/오늘/TBD)이 위로
                if (isExpiredA && !isExpiredB) return 1;
                if (!isExpiredA && isExpiredB) return -1;

                // 2순위: 둘 다 살아있거나 둘 다 만료됐으면 최신 등록순
                return 0;
            });

            setPosts(sortedData);
        }
        setLoading(false);
    }

    const handleDelete = async (postId: string) => {
        if (!confirm("이 구직 글을 내릴까요?")) return;
        const { error } = await supabase.from('crew_posts').delete().eq('id', postId);
        if (!error) fetchPosts();
    };

    if (loading) return <div className="p-10 text-center animate-pulse font-black text-orange-500 italic">SCANNING CREW... 📢</div>;

    return (
        <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen pb-40">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-orange-500 italic tracking-tighter mb-1 uppercase">CREW WANTED</h1>
                <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.4em] ml-1">함께 밥 먹을 동료를 찾으세요</p>
            </div>

            <div className="space-y-4">
                {posts.length > 0 ? (
                    posts.map((post) => {
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const postDate = post.meeting_date ? new Date(post.meeting_date) : null;
                        const isExpired = postDate && postDate < now; // 기간 만료 여부

                        const dateText = post.meeting_date 
                            ? new Date(post.meeting_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
                            : "DATE TBD";

                        return (
                            <div 
                                key={post.id} 
                                className={`bg-white p-6 rounded-[32px] shadow-sm border-2 transition-all relative group 
                                    ${isExpired ? 'opacity-50 grayscale-[0.6] border-transparent' : 'border-white hover:border-orange-100'}`}
                            >
                                {/* 기간 만료 라벨 */}
                                {isExpired && (
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gray-400 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                                        Expired
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase italic border 
                                        ${isExpired ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                        #{post.meeting_time_category || "미정"}
                                    </span>
                                    {currentUserId === post.creator_id && (
                                        <div className="flex gap-3 items-center">
                                            <Link href={`/crew-wanted/create?id=${post.id}`}>
                                                <span className="text-gray-300 hover:text-blue-500 text-[10px] font-bold transition-colors cursor-pointer underline underline-offset-4">수정</span>
                                            </Link>
                                            <button onClick={() => handleDelete(post.id)} className="text-gray-300 hover:text-red-500 text-[10px] font-bold transition-colors underline underline-offset-4">삭제</button>
                                        </div>
                                    )}
                                </div>

                                <p className="text-gray-800 font-bold text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                                    {post.content}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 mb-6">
                                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${isExpired ? 'bg-gray-50 border-gray-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <span className="text-[10px]">📅</span>
                                        <span className={`text-[10px] font-black tracking-tighter ${isExpired ? 'text-gray-400' : post.meeting_date ? 'text-gray-700' : 'text-orange-400 italic'}`}>
                                            {dateText}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                                        <span className="text-[10px]">🕒</span>
                                        <span className={`text-[10px] font-black tracking-tighter ${isExpired ? 'text-gray-400' : post.meeting_time_category !== '미정' ? 'text-orange-500' : 'text-gray-400 italic'}`}>
                                            {post.meeting_time_category === '미정' ? "시간 미정" : post.meeting_time_category}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                    <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest">
                                        Post No. {post.id.slice(0, 4)}
                                    </span>
                                    {!isExpired && post.open_chat_link && (
                                        <a
                                            href={post.open_chat_link}
                                            target="_blank"
                                            className="bg-gray-900 text-white text-[10px] font-black px-5 py-2.5 rounded-full hover:bg-orange-500 transition-all shadow-lg shadow-gray-200 active:scale-95"
                                        >
                                            TALK NOW 💬
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
                        <p className="text-gray-300 font-black italic uppercase tracking-widest text-xs">No Crew Seeking 📭</p>
                    </div>
                )}
            </div>

            <Link href="/crew-wanted/create">
                <button className="fixed bottom-28 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-2xl shadow-orange-500/40 flex items-center justify-center text-2xl font-black hover:rotate-90 transition-transform active:scale-90 z-50">
                    +
                </button>
            </Link>

            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-xl border-t border-gray-100 px-8 py-4 flex justify-between items-center rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <Link href="/" className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🏠</span><span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">레이드</span></Link>
                    <Link href="/wish-menu" className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🍱</span><span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">먹고싶은거</span></Link>
                    <Link href="/crew-wanted" className="flex flex-col items-center gap-1"><span className="text-xl">📢</span><span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">파티구직</span></Link>
                    <Link href="/profile" className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">👤</span><span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">내 정보</span></Link>
                </div>
            </div>
        </div>
    );
}