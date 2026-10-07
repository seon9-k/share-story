import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, API } from '../../../../test/server';
import { renderAt, signIn } from '../../../../test/render';
import LoginView from './LoginView';

const authUser = {
  user_id: 'reader01', name: '독서왕', email: 'a@b.co', gender: 'F', age_group: '30대',
  monthly_reading_volume: 'BOOKS_3_4', genre_1: 'NOVEL', genre_2: null,
};

const submit = async (id: string, pw: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('아이디를 입력해 주세요'), id);
  await user.type(screen.getByPlaceholderText('비밀번호를 입력해 주세요'), pw);
  await user.click(screen.getByRole('button', { name: '로그인' }));
};

describe('LoginView (로그인 화면)', () => {
  it('성공하면 토큰·회원 정보를 저장하고 원래 가려던 경로로 이동함', async () => {
    let sent: unknown;
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ success: true, token: 'jwt-token', document: authUser });
      }),
    );
    renderAt(<LoginView />, { path: '/login', route: { pathname: '/login', state: { from: '/meetups/3' } } });

    await submit('  reader01 ', 'password1');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/meetups/3'));
    expect(sent).toEqual({ user_id: 'reader01', password: 'password1' }); // 아이디 공백 제거
    expect(localStorage.getItem('sharestory.token')).toBe('jwt-token');
    expect(JSON.parse(localStorage.getItem('sharestory.user')!)).toMatchObject({ user_id: 'reader01', name: '독서왕' });
  });

  it('from이 없으면 홈으로 이동함', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.json({ success: true, token: 't', document: authUser })));
    renderAt(<LoginView />, { path: '/login', route: '/login' });

    await submit('reader01', 'password1');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
  });

  it('실패하면 서버 메시지를 화면에 보여주고 토큰을 저장하지 않음', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 }),
      ),
    );
    renderAt(<LoginView />, { path: '/login', route: '/login' });

    await submit('reader01', 'wrong-pass1');

    expect(await screen.findByText('아이디 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
    expect(localStorage.getItem('sharestory.token')).toBeNull();
    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled();
  });

  it('토큰 없는 응답은 로그인 실패로 처리함', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.json({ success: true, document: authUser })));
    renderAt(<LoginView />, { path: '/login', route: '/login' });

    await submit('reader01', 'password1');

    expect(await screen.findByText('로그인 응답이 올바르지 않습니다.')).toBeInTheDocument();
    expect(localStorage.getItem('sharestory.user')).toBeNull();
  });

  it('서버에 연결할 수 없으면 안내 메시지를 보여줌', async () => {
    server.use(http.post(`${API}/auth/login`, () => HttpResponse.error()));
    renderAt(<LoginView />, { path: '/login', route: '/login' });

    await submit('reader01', 'password1');

    expect(await screen.findByText(/서버에 연결할 수 없습니다/)).toBeInTheDocument();
  });

  it('요청 중에는 버튼이 비활성화되어 중복 제출을 막음', async () => {
    server.use(
      http.post(`${API}/auth/login`, async () => {
        await new Promise((r) => setTimeout(r, 50));
        return HttpResponse.json({ success: false, message: '실패' }, { status: 401 });
      }),
    );
    renderAt(<LoginView />, { path: '/login', route: '/login' });

    await submit('reader01', 'password1');

    expect(screen.getByRole('button', { name: '로그인중...' })).toBeDisabled();
    await screen.findByText('실패');
  });

  it('회원가입 직후에는 아이디를 채우고 안내 문구를 보여줌', () => {
    renderAt(<LoginView />, { path: '/login', route: { pathname: '/login', state: { signedUpId: 'newbie01' } } });

    expect(screen.getByPlaceholderText('아이디를 입력해 주세요')).toHaveValue('newbie01');
    expect(screen.getByText('회원가입이 완료되었습니다. 로그인해 주세요.')).toBeInTheDocument();
  });

  it('이미 로그인한 상태면 원래 경로로 바로 이동함', async () => {
    signIn();
    renderAt(<LoginView />, { path: '/login', route: { pathname: '/login', state: { from: '/mypage' } } });

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/mypage'));
  });
});
