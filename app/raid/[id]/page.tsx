'use client';

import { useEffect, useState, use as useReact } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RaidDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = useReact(params);
  const raidId = resolvedParams.id;
  const router = useRouter();

  const [raid, setRaid] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [captainName, setCaptainName] = useState<string>("LOADING..."); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (raidId) fetchRaidData();
  }, [raidId]);

  async function fetchRaidData() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      const { data: raidData, error: raidError } = await supabase
        .from('raids')
        .select('*')
        .eq('id', raidId)
        .maybeSingle();
      
      if (raidError) throw raidError;
      if (!raidData) {
        alert("존재하지 않는 일정입니다.");
        router.push('/');
        return;
      }
      setRaid(raidData);

      if (raidData.creator_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', raidData.creator_id)
          .single();
        setCaptainName(profile?.full_name || "UNKNOWN CAPTAIN");
      }

      const { data: parts } = await supabase
        .from('participants')
        .select('*')
        .eq('raid_id', raidId)
        .order('created_at', { ascending: true });

      setParticipants(parts || []);
    } catch (err: any) {
      console.error("데이터 로드 에러:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!confirm("이 레이드 일정을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('raids').delete().eq('id', raidId);
    if (!error) router.push('/');
  };

  const handleRemove = async (id: string, email: string, isKick: boolean) => {
    if (isKick && !confirm("이 승객을 제외하시겠습니까?")) return;
    await supabase.from('participants').delete().eq('id', id);
    fetchRaidData();
  };

  if (loading) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-orange-500 font-black italic">SCANNING...</div>;

  const isCaptain = user && raid && user.id === raid.creator_id;

  return (
    <div className="max-w-md mx-auto p-6 bg-[#0F172A] min-h-screen text-white font-sans pb-40">
      
      {/* 🛠 수리 1: 수정/삭제 버튼 확대 */}
      <div className="flex justify-between items-center mb-10">
        <Link href="/" className="text-slate-400 font-bold hover:text-white transition-colors">← TERMINAL</Link>
        <div className="flex gap-4">
          {isCaptain && (
            <>
              <Link href={`/raid/${raidId}/edit`} className="text-[14px] bg-slate-700 px-7 py-3 rounded-full font-black uppercase shadow-lg hover:bg-slate-600 transition-all">
                수정
              </Link>
              <button onClick={handleDelete} className="text-[14px] bg-red-900/60 text-red-300 px-7 py-3 rounded-full font-black uppercase shadow-lg hover:bg-red-800 transition-all">
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* 🛠 수리 2: 데이터 바인딩 수정 (저장된 실제 컬럼명 매칭) */}
      <div className="mb-10 bg-slate-800/30 p-8 rounded-[35px] border border-white/5 shadow-2xl relative overflow-hidden">
        <h1 className="text-3xl font-black italic mb-8 text-slate-100 uppercase tracking-tighter leading-tight">
          {raid?.store_name} 레이드
        </h1>
        
        <div className="space-y-5">
          <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <span className="text-slate-500 font-bold text-[10px] italic uppercase tracking-widest">Departure Time</span>
            <span className="font-black text-orange-500 italic text-xl tracking-tighter">
              {/* ✅ meeting_time 으로 변경 */}
              {raid?.meeting_time ? new Date(raid.meeting_time).toLocaleDateString() : "날짜 미정"} 
            </span>
          </div>
          
          <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <span className="text-slate-500 font-bold text-[10px] italic uppercase tracking-widest">Destination</span>
            <span className="font-bold text-slate-100 text-lg">
              {/* ✅ store_name 으로 변경 */}
              {raid?.store_name || "미정"}
            </span>
          </div>

          {/* ✅ open_chat_link 로 변경 */}
          {raid?.open_chat_link && (
            <button 
              onClick={() => window.open(raid.open_chat_link, '_blank')} 
              className="w-full mt-4 bg-[#FAE100] text-[#3C1E1E] py-4 rounded-2xl font-black text-base shadow-xl active:scale-95 transition-transform"
            >
              💬 오픈채팅방 입장하기
            </button>
          )}
        </div>
      </div>

      {/* 📋 PASSENGER MANIFEST */}
      <div className="bg-[#1E293B] rounded-[40px] p-8 shadow-2xl border border-white/5 relative">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 italic">Manifest</h3>
            <h2 className="text-xl font-black text-orange-500 italic uppercase">👨‍✈️ Captain</h2>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 px-4 py-1 rounded-full text-[10px] font-black text-orange-400 italic uppercase">Confirmed</div>
        </div>

        <div className="mb-10 pb-8 border-b border-slate-700/50">
          <p className="text-3xl font-black italic text-slate-100 uppercase">{captainName}</p>
        </div>

        <div className="space-y-7">
          {participants.map((p, index) => {
            // ✅ 수리 3: 기장 본인에게는 KICK 버튼이 보이지 않도록 함
            const isSelf = user && (p.user_id === user.id);
            const showKick = isCaptain && !isSelf;

            return (
              <div key={p.id} className="flex justify-between items-center group">
                <div className="flex items-center gap-4 flex-1">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                  <span className="text-xl font-black tracking-tight text-slate-100 italic uppercase">
                    {p.guest_name || "GUEST"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-slate-500 font-black italic opacity-40">P-No. {index + 1}</span>
                  {showKick && (
                    <button 
                      onClick={() => handleRemove(p.id, p.email, true)} 
                      className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-full font-black uppercase shadow-lg active:scale-90"
                    >
                      KICK
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}