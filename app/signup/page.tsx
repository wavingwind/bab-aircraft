'use client'; // 👈 이 줄이 반드시 맨 위에 있어야 합니다!

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// ✅ 'export default'가 반드시 있어야 Next.js가 컴포넌트로 인식합니다.
export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Auth 회원가입 (비밀번호 기반)
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        // 회원가입 후 프로필 데이터에 이름을 바로 넣을 수도 있지만, 
        // 확실하게 하기 위해 아래에서 profiles 테이블에 따로 인서트합니다.
        data: { full_name: fullName } 
      }
    });

    if (error) {
      alert("가입 실패: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 2. 별도의 profiles 테이블에 실명 저장
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, full_name: fullName }]);

      if (profileError) {
        console.error("프로필 저장 오류:", profileError.message);
      }
      
      alert("회원가입 완료! 이제 로그인해 주세요. ✈️");
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full bg-white rounded-[40px] p-10 shadow-2xl border border-orange-100">
        <div className="text-center mb-8">
          <span className="text-4xl block mb-2">📝</span>
          <h1 className="text-2xl font-black text-orange-500 italic uppercase tracking-tighter">New Pilot Registration</h1>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Join the Bab-Aircraft Crew</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input 
            type="text" 
            placeholder="실명 (본인 확인용)" 
            value={fullName} 
            onChange={(e)=>setFullName(e.target.value)} 
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm transition-all" 
            required 
          />
          <input 
            type="email" 
            placeholder="이메일 주소" 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)} 
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm transition-all" 
            required 
          />
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm transition-all" 
            required 
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-500 text-white font-black py-5 rounded-[24px] shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all uppercase italic tracking-tighter active:scale-95"
          >
            {loading ? 'Registering...' : 'Complete Sign Up ✈️'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => router.push('/login')} className="text-xs text-gray-400 font-bold underline cursor-pointer">
            이미 계정이 있으신가요? 로그인하기
          </button>
        </div>
      </div>
    </div>
  );
}