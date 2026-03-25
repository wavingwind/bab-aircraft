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
  const [captainName, setCaptainName] = useState<string>("로딩 중..."); 
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
        setCaptainName(profile?.full_name || "알 수 없는 파티장");
      }

      const { data: parts } = await supabase
        .from('participants')
        .select('*')
        .eq('raid_id', raidId)
        .order('created_at', { ascending: true });

      const currentParticipants = parts || [];
      setParticipants(currentParticipants);

      const sessionFlag = sessionStorage.getItem(`joined_raid_${raidId}`) === 'true';
      const isStillInList = currentParticipants.some(p => {
        if (currentUser && p.user_id === currentUser.id) return true;
        return !p.user_id && sessionFlag; 
      });

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

  /**
   * 🌡️ 온도계 배열(boolean[])을 시간 문자열로 변환하는 함수
   * ✅ 수정: 시작 시간을 새벽 5시(05:00)로 설정합니다.
   */
  const parseTemperatureTime = (timeMask: any) => {
    if (!timeMask || !Array.isArray(timeMask)) return "시간 미정";

    const START_HOUR = 5; // 온도계의 시작 시간은 05시

    // true인 인덱스들을 모두 찾음 (예: [14, 15])
    const activeIndexes = timeMask
      .map((val, idx) => (val === true ? idx : null))
      .filter((val) => val !== null) as number[];

    if (activeIndexes.length === 0) return "시간 미정";

    // 인덱스에 시작 시간을 더해서 실제 시간을 계산 (예: 14 -> 19시)
    const startTime = activeIndexes[0] + START_HOUR;
    const endTime = activeIndexes[activeIndexes.length - 1] + START_HOUR;

    if (startTime === endTime) {
      // 단일 시간일 경우 (예: "19:00")
      return `${String(startTime).padStart(2, '0')}:00`;
    } else {
      // 시간 범위일 경우 (예: "19:00 ~ 21:00")
      return `${String(startTime).padStart(2, '0')}:00 ~ ${String(endTime + 1).padStart(2, '0')}:00`;
    }
  };

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
    if (!confirm("이 멤버를 강퇴하시겠습니까?")) return;
    try {
      await supabase.from('participants').delete().eq('id', id);
      await fetchRaidData(); 
    } catch (err: any) {
      alert("강퇴 실패");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-orange-500 font-black italic animate-pulse">데이터 동기화 중...</div>;

  const isCaptain = user && raid && String(user.id) === String(raid.creator_id);
  const isRegisteredUser = user && participants.some(p => p.user_id && String(p.user_id) === String(user.id));
  const showChatButton = isCaptain || isRegisteredUser || hasJoinedAsGuest;

  return (
    <div className="max-w-md mx-auto p-6 bg-[#0F172A] min-h-screen text-white font-sans pb-40">
      
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-slate-400 font-bold hover:text-white text-xs uppercase tracking-widest">← 목록으로</Link>
        {isCaptain && (
          <Link href={`/raid/${raidId}/edit`} className="text-[12px] bg-slate-700/50 text-slate-300 px-5 py-2 rounded-full font-black uppercase border border-white/10">수정</Link>
        )}
      </div>

      <div className="mb-6 rounded-[35px] overflow-hidden shadow-2xl border border-white/5 h-64 relative bg-slate-800">
        {raid?.image_url ? (
          <img src={raid.image_url} alt={raid?.store_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
            <span className="text-6xl mb-2">😋</span>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">No Image Provided</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-tight drop-shadow-lg">
            {raid?.store_name}
          </h1>
        </div>
      </div>

      <div className="mb-8 bg-slate-800/30 p-8 rounded-[35px] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="space-y-5">
          <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <span className="text-slate-500 font-bold text-[10px] italic uppercase tracking-widest">모이는 시간</span>
            <span className="font-black text-orange-500 italic text-xl tracking-tighter">
              {/* ✅ 수정한 온도계 해석 함수 적용 */}
              {parseTemperatureTime(raid?.time_mask)}
            </span>
          </div>
          
          <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <span className="text-slate-500 font-bold text-[10px] italic uppercase tracking-widest">장소</span>
            <span className="font-bold text-slate-100 text-lg">{raid?.store_name}</span>
          </div>

          {showChatButton ? (
            <button onClick={() => window.open(raid.open_chat_link, '_blank')} className="w-full mt-4 bg-[#FAE100] text-[#3C1E1E] py-5 rounded-[24px] font-black text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
              <span className="text-xl">💬</span> 오픈채팅방 입장하기
            </button>
          ) : (
            <div className="mt-6 space-y-3">
              <input type="text" placeholder="이름(실명)을 입력하세요" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full p-5 bg-white/5 border border-white/10 rounded-[24px] font-bold text-center text-orange-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              <button onClick={handleJoin} disabled={isJoining} className="w-full bg-orange-500 text-white py-5 rounded-[24px] font-black text-lg italic uppercase shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                {isJoining ? '등록 중...' : '레이드 참가하기'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-[40px] p-8 shadow-2xl border border-white/5">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 italic">Passengers</h3>
            <h2 className="text-xl font-black text-orange-500 italic uppercase">파티 정보</h2>
          </div>
        </div>

        {user || hasJoinedAsGuest ? (
          <>
            <div className="mb-10 pb-8 border-b border-slate-700/50">
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">파티장</p>
              <p className="text-3xl font-black italic text-slate-100 uppercase">{captainName}</p>
            </div>

            <div className="space-y-7">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">파티원 명단</h3>
              {participants.length === 0 && <p className="text-slate-600 font-bold text-center py-4 italic">아직 파티원이 없습니다...</p>}
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
                        {isGuest && <span className="text-[9px] bg-slate-700 text-slate-500 px-2 py-0.5 rounded-sm font-bold uppercase">Guest</span>}
                        {isSelf && <span className="text-[9px] bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-sm font-bold border border-orange-500/30">You</span>}
                      </div>
                    </div>
                    {showKick && (
                      <button onClick={() => handleRemove(p.id)} className="text-[10px] bg-red-600/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full font-black uppercase transition-all active:bg-red-600 active:text-white">KICK</button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-10 text-center space-y-4">
            <span className="text-4xl block">🔒</span>
            <p className="text-slate-400 font-bold leading-relaxed">
              로그인 하시면<br />
              <span className="text-orange-500">파티장과 파티원 명단</span>을<br/>볼 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}