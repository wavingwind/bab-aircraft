'use client';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

function CrewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id'); // 수정 모드인지 확인

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    category: '미정',
    openChatLink: '',
    meetingDate: '',
    isDateTBD: false
  });

  // 수정 모드일 때 데이터 불러오기
  useEffect(() => {
    if (editId) {
      const fetchPost = async () => {
        const { data, error } = await supabase.from('crew_posts').select('*').eq('id', editId).single();
        if (data) {
          setFormData({
            content: data.content,
            category: data.meeting_time_category,
            openChatLink: data.open_chat_link,
            meetingDate: data.meeting_date || '',
            isDateTBD: !data.meeting_date
          });
        }
      };
      fetchPost();
    }
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const postData = {
      content: formData.content,
      meeting_time_category: formData.category,
      open_chat_link: formData.openChatLink,
      meeting_date: formData.isDateTBD ? null : formData.meetingDate,
      creator_id: user.id
    };

    let error;
    if (editId) {
      // 수정 (Update)
      const { error: err } = await supabase.from('crew_posts').update(postData).eq('id', editId);
      error = err;
    } else {
      // 생성 (Insert)
      const { error: err } = await supabase.from('crew_posts').insert([postData]);
      error = err;
    }

    if (!error) {
      alert(editId ? "수정 완료! ✨" : "파티모집 시작! 📢");
      router.push('/crew-wanted');
      router.refresh();
    } else {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-[32px] mt-10 mb-20 border border-orange-50">
      <h1 className="text-2xl font-black mb-8 text-orange-500 text-center italic tracking-tighter uppercase">
        {editId ? '📢 Edit Post' : '📢 Find Crew'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 날짜 및 시간 선택 (레이드와 디자인 통일) */}
        <section className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">📅 Schedule</label>
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="date" 
              required={!formData.isDateTBD}
              disabled={formData.isDateTBD}
              value={formData.meetingDate}
              className={`w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-300 transition-opacity ${formData.isDateTBD ? 'opacity-30' : 'opacity-100'}`}
              onChange={(e) => setFormData({...formData, meetingDate: e.target.value})}
            />
            <select 
              className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-300"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="미정">🌈 시간 미정</option>
              <option value="점심">☀️ 오늘 점심 같이</option>
              <option value="저녁">🌙 수업 끝나고 저녁</option>
              <option value="간식">🍩 디저트/커피</option>
              <option value="야식">🍕 출출한 밤 야식</option>
              <option value="술">🍺 가볍게 술 한잔</option>
            </select>
          </div>
          <label className="flex items-center gap-2 px-1 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={formData.isDateTBD}
              onChange={(e) => setFormData({...formData, isDateTBD: e.target.checked})}
              className="w-4 h-4 accent-orange-500 rounded"
            />
            <span className="text-[11px] font-bold text-gray-500 group-hover:text-orange-500 transition-colors">날짜가 정해지지 않았을 경우 체크</span>
          </label>
        </section>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Message</label>
          <textarea 
            required
            value={formData.content}
            placeholder="예: 내일 맛있는 거 먹으러 갈 사람 구해요!"
            className="w-full p-4 mt-2 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-300 h-32 resize-none"
            onChange={(e) => setFormData({...formData, content: e.target.value})}
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Open Chat Link</label>
          <input 
            type="url" required value={formData.openChatLink}
            placeholder="카톡 오픈채팅 링크"
            className="w-full p-4 mt-2 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-300"
            onChange={(e) => setFormData({...formData, openChatLink: e.target.value})}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-orange-500 text-white font-black py-5 rounded-[24px] shadow-xl text-lg italic tracking-tighter hover:bg-orange-600 transition-all disabled:bg-gray-400"
        >
          {loading ? 'PROCESSING...' : editId ? 'SAVE CHANGES ✨' : 'BROADCAST NOW 📢'}
        </button>
      </form>
    </div>
  );
}

// Next.js Suspense 에러 방지용 래퍼
export default function CreateCrewPost() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black text-orange-500 animate-pulse">LOADING FORM...</div>}>
      <CrewForm />
    </Suspense>
  );
}