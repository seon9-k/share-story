import { useCallback, useEffect, useState } from 'react';
import { allPages, documentRequest } from '../api/client';

// load는 useCallback으로 고정하고, 조회 대상이 달라지면 key도 변경 필요
export function useResource<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const [version, setVersion] = useState(0);
  // 같은 대상의 재시도도 별도 요청으로 구분해 이전 응답이 잠깐 노출되지 않게 함
  const identity = `${key}:${version}`;
  const [result, setResult] = useState<{ key: string; data?: T; error?: string }>({ key: '' });
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key: identity, data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key: identity,
            error: error instanceof Error ? error.message : '불러오기에 실패했습니다.',
          });
      },
    );
    // 탭 전환·화면 이탈 시 요청 취소. load가 signal을 전달하지 않아도
    // 위의 aborted 검사로 늦게 도착한 응답의 상태 갱신은 막음
    return () => controller.abort();
  }, [identity, load]);
  return {
    data: result.key === identity ? result.data : undefined,
    error: result.key === identity ? result.error : undefined,
    loading: result.key !== identity,
    reload: () => setVersion((value) => value + 1),
  };
}
export function useDocument<T>(path: string) {
  return useResource(
    path,
    useCallback((signal: AbortSignal) => documentRequest<T>(path, { signal }), [path]),
  );
}
export function useAllPages<T>(path: string) {
  return useResource(
    path,
    useCallback((signal: AbortSignal) => allPages<T>(path, signal), [path]),
  );
}
