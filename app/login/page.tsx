'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation'; // ✈️ 페이지 이동을 위해 추가

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // 🔑 비밀번호 상태 추가
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ✨ 비밀번호 기반 로그인 실행
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("로그인 실패: " + error.message);
    } else {
      alert('반갑습니다~ ✈️');
      router.push('/'); // 로그인 성공 시 메인으로 이동
      router.refresh(); // 세션 반영을 위해 새로고침
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-[40px] shadow-2xl border border-orange-100">
      <div className="text-center mb-8">
        <span className="text-4xl block mb-2">🛫</span>
        <h1 className="text-2xl font-black text-gray-800 italic uppercase tracking-tighter">Bab-Aircraft Login</h1>
        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Ready for Take-off</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* 이메일 입력 */}
        <input
          type="email"
          placeholder="Email Address"
          className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-orange-500 font-bold text-sm outline-none transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        {/* ✨ 비밀번호 입력칸 (새로 추가됨!) */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-orange-500 font-bold text-sm outline-none transition-all"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full bg-orange-500 text-white font-black py-5 rounded-[24px] hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] uppercase italic tracking-tighter"
        >
          {loading ? 'Authenticating...' : 'Login Now ✈️'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400 font-bold">
          처음 오셨나요?{' '}
          <button onClick={() => router.push('/signup')} className="text-orange-500 underline">
            회원가입 하기
          </button>
        </p>
      </div>
    </div>
  );
}