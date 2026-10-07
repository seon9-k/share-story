import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../../features/auth';
import { http, HttpResponse } from 'msw';
import { server, API } from '../../test/server';
import { signIn } from '../../test/render';
import { request } from '../../shared/api/client';
import RequireAuth from './RequireAuth';

function Login() {
  const { state, pathname } = useLocation();
  return <div>로그인 화면 {pathname} from={(state as { from?: string })?.from}</div>;
}

const setup = (route: string) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/mypage/journal" element={<p>내 항해일지</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe('RequireAuth (REQ-MEM-001, REQ-MEM-003 로그인 필요 화면)', () => {
  it('비로그인이면 로그인 화면으로 보내고 원래 경로·쿼리를 from에 보관함', () => {
    setup('/mypage/journal?tab=crew');
    expect(screen.getByText(/로그인 화면/)).toHaveTextContent('from=/mypage/journal?tab=crew');
    expect(screen.queryByText('내 항해일지')).not.toBeInTheDocument();
  });

  it('로그인했어도 토큰이 없으면 접근할 수 없음', () => {
    signIn();
    localStorage.removeItem('sharestory.token');
    setup('/mypage/journal');
    expect(screen.getByText(/로그인 화면/)).toBeInTheDocument();
  });

  it('로그인 상태면 화면을 보여줌', () => {
    signIn();
    setup('/mypage/journal');
    expect(screen.getByText('내 항해일지')).toBeInTheDocument();
  });

  it('API가 401을 반환하면 자동 로그아웃되어 로그인 화면으로 이동함', async () => {
    signIn();
    server.use(
      http.get(`${API}/member/me`, () =>
        HttpResponse.json({ success: false, message: '로그인이 만료되었습니다.' }, { status: 401 }),
      ),
    );
    setup('/mypage/journal');
    expect(screen.getByText('내 항해일지')).toBeInTheDocument();

    await request('/member/me').catch(() => undefined);

    expect(await screen.findByText(/로그인 화면/)).toBeInTheDocument();
    expect(localStorage.getItem('sharestory.token')).toBeNull();
    expect(localStorage.getItem('sharestory.user')).toBeNull();
  });
});
