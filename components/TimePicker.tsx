'use client';
import { useState, useEffect } from 'react';

// ✅ 1. 부모로부터 '초기값(initialSelected)'도 받을 수 있게 규격(Interface) 수정
interface TimePickerProps {
  initialSelected?: boolean[]; // '?'는 필수값이 아니라는 뜻입니다.
  onChange: (times: boolean[]) => void;
}

export default function TimePicker({ initialSelected, onChange }: TimePickerProps) {
  // ✅ 2. 초기값이 있으면 그걸 쓰고, 없으면(새로 만들기) 24개 false로 시작
  const [times, setTimes] = useState<boolean[]>(new Array(24).fill(false));

  // ✅ 3. [중요] 수정 페이지에서 DB 데이터를 불러왔을 때 화면에 반영하는 로직
  useEffect(() => {
    if (initialSelected && initialSelected.length === 24) {
      setTimes(initialSelected);
    }
  }, [initialSelected]);

  const toggleTime = (index: number) => {
    const newTimes = [...times];
    newTimes[index] = !newTimes[index];
    setTimes(newTimes);
    onChange(newTimes);
  };

  const getDisplayHour = (index: number) => {
    const hour = (index + 5) % 24;
    return `${hour}시`;
  };

  const getTimeLabel = (index: number) => {
    const h = (index + 5) % 24;
    if (h >= 0 && h < 6) return '새벽'; 
    if (h >= 6 && h < 12) return '오전';
    if (h >= 12 && h < 18) return '오후';
    if (h >= 18 && h < 21) return '저녁';
    return '밤';
  };

  return (
    <div className="w-full">
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
              {!isAvailable && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                     style={{backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 8px)'}} 
                />
              )}
              
              <span className={`text-[12px] font-black z-10 ${isAvailable ? 'text-white' : 'text-gray-700'}`}>
                {getDisplayHour(index)}
              </span>
              
              <span className={`text-[8px] font-bold z-10 opacity-60 ${isAvailable ? 'text-orange-100' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 mt-1 ml-1"> * 지금은 입력하지 않고, 확정된 다음에 입력할 수도 있어요. </p>

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