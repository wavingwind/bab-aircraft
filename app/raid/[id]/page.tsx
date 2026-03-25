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

  const [guestName, setGuestName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoinedAsGuest, setHasJoinedAsGuest] = useState(false);

  useEffect(() => {
    if (raidId) {
      fetchRaidData();
    }
  }, [raidId]);

  async function fetchRaidData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      const { data: raidData } = await supabase
        .from('raids')
        .select('*')
        .eq('id', raidId)
        .maybeSingle();
      
      if (!raidData) {
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

      // 실시간 참가자 명단 가져오기
      const { data: parts } = await supabase
        .from('participants')
        .select('*')
        .eq('raid_id', raidId)
        .order('created_at', { ascending: true });

      const currentParticipants = parts || [];
      setParticipants(currentParticipants);

      // ✅ [핵심 로직] 세션 기록이 있더라도, 실시간 명단에 없으면 '참가 안 함'으로 간주 (강퇴 대응)
      const sessionFlag = sessionStorage.getItem(`joined_raid_${raidId}`) === 'true';
      
      // 로그인 유저라면 ID로, 게스트라면 세션 플래그와 명단 존재 여부로 확인
      const isStillInList = currentParticipants.some(p => {
        if (currentUser && p.user_id === currentUser.id) return true;
        // 게스트의 경우, 세션 플래그가 있고 명단에 본인이 있는지 확인 (이름 입력이 없으므로 세션 유효성만 체크)
        return !p.user_id && sessionFlag; 
      });

      // 만약 세션에는 참가했다고 되어있는데 명단에 내가 없다면 (강퇴당함) -> 세션 초기화
      if (sessionFlag && !isStillInList) {
        sessionStorage.removeItem(`joined_raid_${raidId}`);
        setHasJoinedAsGuest(false);
      } else {
        setHasJoinedAsGuest(sessionFlag);
      }

    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleJoin = async () => {
    if (!guestName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    setIsJoining(true);
    try {
      const { error } = await supabase
        .from('participants')
        .insert([{ 
          raid_id: raidId, 
          guest_name: guestName,
          user_id: user?.id || null 
        }]);

      if (error) throw error;
      
      sessionStorage.setItem(`joined_raid_${raidId}`, 'true');
      setHasJoinedAsGuest(true);
      setGuestName("");
      await fetchRaidData(); 
    } catch (err: any) {
      alert("참가 실패: " + err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("이 승객을 강제 하차(KICK) 시키겠습니까?")) return;
    try {
      await supabase.from('participants').delete().eq('id', id);
      await fetchRaidData(); // 삭제 후 즉시 갱신
    } catch (err: any) {
      alert("KICK 실패");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-orange-500 font-black italic animate-pulse">SYNCING DATA...</div>;

  const isCaptain = user && raid && String(user.id) === String(raid.creator_id);
  const isRegisteredUser = user && participants.some(p => p.user_id && String(p.user_id) === String(user.id));
  
  // ✅ 최종 판별: 방장이거나 명단에 실시간으로 존재하는 경우에만 버튼 노출
  const showChatButton = isCaptain || isRegisteredUser || hasJoinedAsGuest;

  return (
    <div className="max-w-md mx-auto p-6 bg-[#0F172A] min-h-screen text-white font-sans pb-40">
      
      <div className="flex justify-between items-center mb-10">
        <Link href="/" className="text-slate-400 font-bold hover:text-white text-xs uppercase tracking-widest">← TERMINAL</Link>
        {isCaptain && (
          <Link href={`/raid/${raidId}/edit`} className="text-[12px] bg-slate-700/50 text-slate-300 px-5 py-2 rounded-full font-black uppercase border border-white/10">수정</Link>
        )}
      </div>

      <div className="mb-10 bg-slate-800/30 p-8 rounded-[35px] border border-white/5 shadow-2xl relative overflow-hidden">
        <h1 className="text-3xl font-black italic mb-8 text-slate-100 uppercase tracking-tighter leading-tight">
          {raid?.store_name} 레이드
        </h1>
        
        <div className="space-y-5">
          <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <span className="text-slate-500 font-bold text-[10px] italic uppercase tracking-widest">Departure Time</span>
            <span className="font-black text-orange-500 italic text-xl tracking-tighter">
              {raid?.meeting_time ? new Date(raid.meeting_time).toLocaleDateString() : "날짜 미정"} 
            </span>
          </div>
          
          <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <span className="text-slate-500 font-bold text-[10px] italic uppercase tracking-widest">Destination</span>
            <span className="font-bold text-slate-100 text-lg">{raid?.store_name}</span>
          </div>

          {showChatButton ? (
            <button 
              onClick={() => window.open(raid.open_chat_link, '_blank')} 
              className="w-full mt-4 bg-[#FAE100] text-[#3C1E1E] py-5 rounded-[24px] font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">💬</span> 오픈채팅방 입장하기
            </button>
          ) : (
            <div className="mt-6 space-y-3">
              <input 
                type="text"
                placeholder="이름(실명)을 입력하세요"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full p-5 bg-white/5 border border-white/10 rounded-[24px] font-bold text-center text-orange-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              />
              <button 
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full bg-orange-500 text-white py-5 rounded-[24px] font-black text-lg italic uppercase shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
              >
                {isJoining ? 'REGISTERING...' : '레이드 참가하기'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-[40px] p-8 shadow-2xl border border-white/5">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 italic">Manifest</h3>
            <h2 className="text-xl font-black text-orange-500 italic uppercase">👨‍✈️ Captain</h2>
          </div>
        </div>

        <div className="mb-10 pb-8 border-b border-slate-700/50">
          <p className="text-3xl font-black italic text-slate-100 uppercase">{captainName}</p>
        </div>

        <div className="space-y-7">
          {participants.length === 0 && <p className="text-slate-600 font-bold text-center py-4 italic">No passengers yet...</p>}
          {participants.map((p) => {
            const isSelf = user && p.user_id && String(p.user_id) === String(user.id);
            const isGuest = !p.user_id;
            const showKick = isCaptain && !isSelf;

            return (
              <div key={p.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${isGuest ? 'bg-slate-500' : 'bg-orange-500'}`} />
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-black italic uppercase ${isGuest ? 'text-slate-400' : 'text-slate-100'}`}>
                      {p.guest_name}
                    </span>
                    {isGuest && <span className="text-[9px] bg-slate-700 text-slate-500 px-2 py-0.5 rounded-sm font-bold">GUEST</span>}
                    {isSelf && <span className="text-[9px] bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-sm font-bold border border-orange-500/30">YOU</span>}
                  </div>
                </div>
                {showKick && (
                  <button 
                    onClick={() => handleRemove(p.id)} 
                    className="text-[10px] bg-red-600/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full font-black uppercase transition-all active:bg-red-600 active:text-white"
                  >
                    KICK
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}