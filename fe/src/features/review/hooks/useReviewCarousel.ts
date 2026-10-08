import { useEffect, useReducer, useState } from 'react';

interface State {
  index: number;
  animate: boolean;
}

// count: 원본 카드 수. 트랙 뒤에 앞쪽 카드를 복제해 두므로 index가 count에 닿으면 처음(0)과 같은 화면임
function reducer(state: State, action: 'advance' | 'settle', count: number): State {
  if (state.index >= count) return { index: 0, animate: false };
  return action === 'advance' ? { index: state.index + 1, animate: true } : state;
}

/**
 * 항해일지 자동 순환 캐러셀 상태
 * - rotating이 true면 intervalMs마다 한 칸씩 이동하고, 복제 구간에 닿으면 애니메이션 없이 처음으로 되돌려 끊김 없이 이어짐
 * - 마우스·키보드 포커스 중에는 pause()로 멈춤
 */
export function useReviewCarousel(count: number, rotating: boolean, intervalMs = 4500) {
  const [state, dispatch] = useReducer(
    (current: State, action: 'advance' | 'settle') => reducer(current, action, count),
    { index: 0, animate: true },
  );
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!rotating || paused) return;
    const timer = window.setInterval(() => dispatch('advance'), intervalMs);
    return () => window.clearInterval(timer);
  }, [rotating, paused, intervalMs]);

  return {
    index: state.index,
    animate: state.animate,
    // 이동 애니메이션이 끝났을 때 호출. 탭이 숨겨져 transitionend가 누락돼도 다음 tick의 advance에서 보정됨
    settle: () => dispatch('settle'),
    pause: () => setPaused(true),
    resume: () => setPaused(false),
  };
}
