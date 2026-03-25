'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateWishMenu() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    menuName: '',
    storeName: '',
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

      // 1️⃣ 이미지 업로드 (raid-images 버킷 재사용 또는 wish-images 생성 권장)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `wishes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('raid-images') 
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('raid-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // 2️⃣ DB 삽입
      const { error } = await supabase
        .from('wish_menus')
        .insert([
          {
            menu_name: formData.menuName,
            store_name: formData.storeName,
            image_url: imageUrl,
            creator_id: user.id,
          },
        ]);

      if (error) throw error;

      alert("메뉴 제안 완료! 🔥");
      router.push('/wish-menu');
    } catch (err: any) {
      alert("에러 발생: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-[32px] mt-10 mb-20 border border-orange-50">
      <h1 className="text-2xl font-black mb-8 text-orange-500 text-center italic tracking-tighter uppercase">
        🍱 Suggest Menu
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 이미지 업로드 섹션 */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">📸 Menu Photo</h2>
          <div className="relative">
            <label className="flex flex-col items-center justify-center w-full h-48 bg-gray-50 rounded-[30px] border-2 border-dashed border-gray-200 cursor-pointer overflow-hidden hover:bg-gray-100 transition-all">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <span className="text-3xl mb-2">🍱</span>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter text-center">
                    먹고 싶은 메뉴 사진을<br/>등록해주세요 (선택)
                  </p>
                </div>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
        </section>

        {/* 정보 입력 섹션 */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-gray-800 border-l-4 border-orange-500 pl-2 uppercase tracking-tighter">📍 Info</h2>
          <input
            type="text"
            placeholder="메뉴 이름 (예: 매콤 마라탕)"
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-300 outline-none font-bold text-sm"
            onChange={(e) => setFormData({ ...formData, menuName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="식당 이름 (예: 하이디라오)"
            className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-300 outline-none font-bold text-sm"
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
          />
        </section>

        <div className="flex gap-3">
            <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-100 text-gray-400 font-black py-5 rounded-[24px] hover:bg-gray-200 transition text-lg italic tracking-tighter"
            >
            CANCEL
            </button>
            <button
            type="submit"
            disabled={loading}
            className={`flex-[2] text-white font-black py-5 rounded-[24px] transition shadow-xl active:scale-[0.98] text-lg italic tracking-tighter
                ${loading ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'}`}
            >
            {loading ? 'UPLOADING...' : 'SUGGEST! 🔥'}
            </button>
        </div>
      </form>
    </div>
  );
}