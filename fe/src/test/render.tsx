/* eslint-disable react-refresh/only-export-components -- 테스트 전용 헬퍼라 Fast Refresh 대상이 아님 */
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../features/auth';

// 현재 경로·state를 화면에 노출해 이동 결과를 검증함
function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location" data-state={JSON.stringify(location.state)}>
      {location.pathname + location.search}
    </div>
  );
}

interface RenderOptions {
  path?: string;
  route?: string | { pathname: string; state?: unknown };
}

export function renderAt(ui: ReactElement, { path = '/', route = '/' }: RenderOptions = {}) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

// 로그인 상태를 localStorage에 미리 심어 AuthProvider가 읽게 함
export function signIn(user_id = 'reader01') {
  localStorage.setItem('sharestory.token', 'test-token');
  localStorage.setItem(
    'sharestory.user',
    JSON.stringify({
      user_id,
      name: '독서왕',
      email: 'reader@example.com',
      gender: 'F',
      age_group: '30대',
      monthly_reading_volume: 'BOOKS_3_4',
      genre_1: 'NOVEL',
      genre_2: null,
    }),
  );
}
