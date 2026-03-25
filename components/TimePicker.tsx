'use client';
import { useState } from 'react';

// 부모로부터 받을 함수의 규격을 정의합니다.
interface TimePickerProps {
  onChange: (times: boolean[]) => void;
}

export default function TimePicker({ onChange }: TimePickerProps) {
  // 05:00부터 익일 04:00까지 24개의 칸을 생성
  const [times, setTimes] = useState(new Array(24).fill(false));

  const toggleTime = (index: number) => {
    const newTimes = [...times];
    newTimes[index] = !newTimes[index];
    setTimes(newTimes);
    onChange(newTimes);
  };

  const getDisplayHour = (index: number) => {
    const hour = (index + 5) % 24;
    // 주인님, '자정' 대신 '0시'가 더 직관적이라면 `${hour}시`로 통일해도 좋습니다.
    // 여기선 일단 깔끔하게 '시'로 통일했습니다.
    return `${hour}시`;
  };

  // 시간대에 따른 라벨 (오전, 오후, 저녁, 밤, 새벽)
  const getTimeLabel = (index: number) => {
    const h = (index + 5) % 24;
    
    // 🔥 "내일" 로직 삭제! 0시부터는 '새벽'으로 표시합니다.
    if (h >= 0 && h < 6) return '새벽'; 
    if (h >= 6 && h < 12) return '오전';
    if (h >= 12 && h < 18) return '오후';
    if (h >= 18 && h < 21) return '저녁';
    return '밤'; // 21시 ~ 24시
  };

  return (
    <div className="w-full">
      
      {/* 그리드를 6열로 유지하거나, 터치 편의를 위해 4열로 조정할 수 있습니다.
          여기서는 기존 6열을 유지하되 디자인을 조금 더 다듬었습니다. */}
      <div className="grid grid-cols-6 gap-1.5">
        {times.map((isAvailable, index) => {
          const label = getTimeLabel(index);
          return (
            <button
              key={index}
              type="button"
              onClick={() => toggleTime(index)}
              className={`
                relative h-14 rounded-xl border transition-all flex flex-col items-center justify-center overflow-hidden
                ${isAvailable 
                  ? 'bg-orange-500 border-orange-600 shadow-inner' 
                  : 'bg-white border-gray-100 hover:border-gray-200'}
              `}
            >
              {/* 비활성 상태 빗금 패턴 */}
              {!isAvailable && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                     style={{backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 8px)'}} 
                />
              )}
              
              <span className={`text-[12px] font-black z-10 ${isAvailable ? 'text-white' : 'text-gray-700'}`}>
                {getDisplayHour(index)}
              </span>
              
              {/* 🔥 "내일" 글자 삭제 및 스타일 조정 */}
              <span className={`text-[8px] font-bold z-10 opacity-60 ${isAvailable ? 'text-orange-100' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 mt-1 ml-1"> * 지금은 입력하지 않고, 확정된 다음에 입력할 수도 있어요. </p>

      {/* 가이드 범례 */}
      <div className="mt-4 flex items-center justify-center gap-3 text-[10px] font-bold text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div> <span>선택됨</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 bg-gray-100 rounded-full border border-gray-200"></div> <span>미선택</span>
        </div>
      </div>
    </div>
    
  );
}