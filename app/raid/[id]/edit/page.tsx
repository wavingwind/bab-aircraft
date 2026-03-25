'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TimePicker from '@/components/TimePicker';
import { supabase } from '@/lib/supabase';

export default function EditRaid() {
  const params = useParams();
  const router = useRouter();
  const raidId = params.id;

  const [loading, setLoading] = useState(true);
  const [issubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    storeName: '',
    menu: '',
    openChatLink: '',
    max_participants: 4,
    meetingDate: '',
    isDateTBD: false, // ✨ 날짜 미정 상태 추가
    timeCategory: '점심',
    availableTimes: [] as boolean[],
    imageUrl: ''
  });

  // 1. 기존 데이터 불러오기
  useEffect(() => {
    async function fetchRaidData() {
      const { data, error } = await supabase
        .from('raids')
        .select('*')
        .eq('id', raidId)
        .single();

      if (error) {
        alert("데이터를 불러오지 못했습니다.");
        router.push('/');
        return;
      }

      if (data) {
        setFormData({
          storeName: data.store_name,
          menu: data.menu_info || '',
          openChatLink: data.open_chat_link,
          max_participants: data.max_participants,
          // ✨ 날짜가 있으면 세팅, 없으면 빈값 + 미정 체크
          meetingDate: data.meeting_time ? data.meeting_time.split('T')[0] : '',
          isDateTBD: !data.meeting_time,
          timeCategory: data.time_category,
          availableTimes: data.time_mask || [],
          imageUrl: data.image_url || ''
        });
        setPreviewUrl(data.image_url || null);
      }
      setLoading(false);
    }
    fetchRaidData();
  }, [raidId, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 2. 수정 제출 (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `raids/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('raid-images').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('raid-images').getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }

      // ✨ 날짜가 미정이면 null, 아니면 날짜 문자열 생성
      const finalDateTime = formData.isDateTBD ? null : `${formData.meetingDate}T00:00:00`;

      const { error } = await supabase
        .from('raids')
        .update({
          store_name: formData.storeName,
          meeting_time: finalDateTime, // ✨ 최종 날짜값 적용
          time_category: formData.timeCategory,
          open_chat_link: formData.openChatLink,
          menu_info: formData.menu,
          time_mask: formData.availableTimes,
          max_participants: formData.max_participants,
          image_url: finalImageUrl,
        })
        .eq('id', raidId);

      if (error) throw error;

      alert("레이드 수정 완료! ✈️");
      router.push(`/raid/${raidId}`);
      router.refresh();
    } catch (err: any) {
      alert("수정 실패: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse italic text-orange-500">SCANNING FLIGHT DATA... ✈️</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-[32px] mt-10 mb-20">
      <h1 className="text-2xl font-black mb-8 text-orange-500 text-center italic tracking-tighter uppercase">
        🛠️ Edit Flight Info
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* 📸 Photo Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">📸 Photo Update</h2>
          <div className="relative h-48 w-full rounded-[30px] border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex flex-col items-center justify-center group">
            {previewUrl ? (
              <>
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">Change Photo</p>
                </div>
              </>
            ) : (
              <div className="text-center">
                <span className="text-gray-300 text-4xl block mb-2">📷</span>
                <p className="text-[10px] text-gray-400 font-bold uppercase">No Image Selected</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </section>

        {/* Destination */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">📍 Destination</h2>
          <input
            type="text"
            value={formData.storeName}
            placeholder="식당 이름"
            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-300"
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
            required
          />
          <input
            type="text"
            value={formData.menu}
            placeholder="메뉴 정보 (선택)"
            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-300"
            onChange={(e) => setFormData({ ...formData, menu: e.target.value })}
          />
        </section>

        {/* --- 섹션 2: Schedule --- */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">
            📅 Schedule
          </h2>

          {/* 1. 날짜 및 시간 선택 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              disabled={formData.isDateTBD}
              value={formData.meetingDate}
              className={`w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-300 outline-none font-bold text-sm transition-opacity ${formData.isDateTBD ? 'opacity-30' : 'opacity-100'}`}
              onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
              required={!formData.isDateTBD}
            />
            <select
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-300 outline-none font-bold text-sm appearance-none"
              onChange={(e) => setFormData({ ...formData, timeCategory: e.target.value })}
              value={formData.timeCategory}
            >
              <option value="미정">❓ 미정</option>
              <option value="아침">🌅 아침</option>
              <option value="점심">☀️ 점심</option>
              <option value="저녁">🌙 저녁</option>
              <option value="간식">🍩 간식</option>
            </select>
          </div>

          {/* 2. 날짜 미정 체크박스 (입력창 아래로 이동) */}
          <div className="flex items-center gap-2 px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isDateTBD}
                onChange={(e) => setFormData({ ...formData, isDateTBD: e.target.checked })}
                className="w-4 h-4 accent-orange-500 rounded border-gray-300"
              />
              <span className="text-[11px] font-bold text-gray-500 group-hover:text-orange-500 transition-colors">
                날짜가 정해지지 않았을 경우 체크
              </span>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-black mb-3 text-gray-400 uppercase tracking-widest">🕒 시간대 다시 선택</label>
            <div className="bg-gray-50 p-5 rounded-[24px]">
              <TimePicker
                initialSelected={formData.availableTimes}
                onChange={(selectedTimes) => setFormData({ ...formData, availableTimes: selectedTimes })}
              />
            </div>
          </div>
        </section>

        {/* Crew */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">👥 Max Participants</h2>
          <div className="relative">
            <input
              type="number"
              value={formData.max_participants}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm"
              onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">명</span>
          </div>
        </section>

        {/* Communication */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">🔗 Communication</h2>
          <input
            type="url"
            value={formData.openChatLink}
            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-blue-500 text-sm"
            onChange={(e) => setFormData({ ...formData, openChatLink: e.target.value })}
            required
          />
        </section>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={issubmitting}
            className="flex-1 bg-gray-100 text-gray-500 font-black py-5 rounded-[24px] hover:bg-gray-200 transition uppercase text-[11px] tracking-widest"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={issubmitting}
            className="flex-[2] bg-orange-500 text-white font-black py-5 rounded-[24px] hover:bg-orange-600 transition shadow-xl shadow-orange-500/20 active:scale-[0.98] text-lg italic tracking-tighter uppercase"
          >
            {issubmitting ? 'Updating...' : 'Update Flight'}
          </button>
        </div>
      </form>
    </div>
  );
}