'use client';
import { useState } from 'react';
import TimePicker from '@/components/TimePicker';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateRaid() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ✅ formData 초기값에 mapLink: '' 를 추가하여 Controlled Input 에러를 방지했습니다.
  const [formData, setFormData] = useState({
    storeName: '',
    menu: '',
    openChatLink: '',
    max_participants: 4,
    meetingDate: '',
    isDateTBD: false, 
    timeCategory: '점심',
    availableTimes: [],
    mapLink: '' // ✨ 초기값 설정 완료
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다!");
      router.push('/login');
      return;
    }

    try {
      let imageUrl = "";

      // 📸 이미지 업로드 로직
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `raids/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('raid-images').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('raid-images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      // 📅 날짜 처리 로직
      const finalDateTime = formData.isDateTBD ? null : `${formData.meetingDate}T00:00:00`;

      // 🚀 DB 저장 (map_link 추가됨)
      const { data, error } = await supabase
        .from('raids')
        .insert([
          {
            title: `${formData.storeName} 레이드`,
            store_name: formData.storeName,
            meeting_time: finalDateTime,
            time_category: formData.timeCategory,
            open_chat_link: formData.openChatLink,
            menu_info: formData.menu,
            time_mask: formData.availableTimes,
            creator_id: user.id,
            max_participants: formData.max_participants,
            image_url: imageUrl,
            map_link: formData.mapLink, // ✨ 네이버 지도 링크 저장
          },
        ])
        .select();

      if (error) throw error;

      alert("레이드 생성 완료! ✈️");
      router.push(`/raid/${data[0].id}`);
    } catch (err: any) {
      alert("에러 발생: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-[32px] mt-10 mb-20 border border-orange-50">
      <h1 className="text-2xl font-black mb-8 text-orange-500 text-center italic tracking-tighter uppercase">
        ✈️ Create New Raid
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* --- 섹션 0: 이미지 업로드 --- */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">📸 Flight Photo</h2>
          <div className="relative group">
            <label className="flex flex-col items-center justify-center w-full h-48 bg-gray-50 rounded-[30px] border-2 border-dashed border-gray-200 cursor-pointer overflow-hidden hover:bg-gray-100 transition-all">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <span className="text-3xl mb-2">📷</span>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Select Image (Optional)</p>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
            {previewUrl && (
              <button
                type="button"
                onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                className="absolute top-3 right-3 bg-black/50 text-white w-8 h-8 rounded-full text-xs font-bold backdrop-blur-sm"
              >
                X
              </button>
            )}
          </div>
        </section>

        {/* --- 섹션 1: Destination --- */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">📍 Destination</h2>
          <input
            type="text"
            placeholder="식당 이름을 입력해주세요"
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-300 outline-none font-bold text-sm"
            value={formData.storeName}
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="어떤 메뉴를 먹을까요? (선택)"
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-300 outline-none font-bold text-sm"
            value={formData.menu}
            onChange={(e) => setFormData({ ...formData, menu: e.target.value })}
          />
          
          {/* 🗺️ 네이버 지도 링크 입력 필드 */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Naver Map Link (Optional)</label>
            <input
              type="url"
              placeholder="네이버 지도 공유 링크를 붙여넣으세요"
              value={formData.mapLink || ''}
              className="w-full p-4 mt-2 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-300 transition-all text-green-600"
              onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
            />
          </div>
        </section>

        {/* --- 섹션 2: Schedule --- */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">
            📅 Schedule
          </h2>

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
            <label className="block text-[10px] font-black mb-3 text-gray-400 uppercase tracking-widest">🕒 원하는 시간대를 선택해주세요</label>
            <div className="bg-gray-50 p-5 rounded-[24px]">
              <TimePicker onChange={(selectedTimes) => setFormData({ ...formData, availableTimes: selectedTimes })} />
            </div>
          </div>
        </section>

        {/* --- 섹션 3: Participants --- */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">👥 Max Participants</h2>
          <div className="relative">
            <input
              type="number"
              min="2"
              max="20"
              value={isNaN(formData.max_participants) ? '' : formData.max_participants}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-300 outline-none font-bold text-sm"
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setFormData({ ...formData, max_participants: isNaN(val) ? 0 : val });
              }}
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">명</span>
          </div>
        </section>

        {/* --- 섹션 4: Communication --- */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">🔗 Communication</h2>
          <input
            type="url"
            placeholder="카톡 오픈채팅 링크 (필수)"
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-300 outline-none font-bold text-blue-500 text-sm"
            value={formData.openChatLink}
            onChange={(e) => setFormData({ ...formData, openChatLink: e.target.value })}
            required
          />
        </section>

        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white font-black py-5 rounded-[24px] transition shadow-xl active:scale-[0.98] text-lg italic tracking-tighter uppercase
            ${loading ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'}`}
        >
          {loading ? 'Processing...' : 'Take Off (모집 시작)'}
        </button>
      </form>
    </div>
  );
}