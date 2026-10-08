import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, API } from '../../../test/server';
import { renderAt, signIn } from '../../../test/render';
import ProfileView from './ProfileView';

const profile = (over = {}) => ({
  user_id: 'reader01', name: '독서가', email: 'reader01@gmail.com', gender: 'F', age_group: '30대',
  readingAmount: 'BOOKS_3_4', genres: ['NOVEL', 'SCIENCE'], ...over,
});
const serve = (body = profile()) =>
  server.use(http.get(`${API}/member/me`, () => HttpResponse.json({ success: true, document: body })));
const renderProfile = () => {
  signIn('reader01');
  return renderAt(<ProfileView />, { path: '/mypage/profile', route: '/mypage/profile' });
};

describe('ProfileView 나의 회원정보', () => {
  it('처음에는 입력창 없이 정보를 텍스트로 보여줌', async () => {
    serve();
    renderProfile();

    expect(await screen.findByText('독서가')).toBeInTheDocument();
    expect(screen.getByText('reader01@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('reader01')).toBeInTheDocument();
    expect(screen.getByText('30대')).toBeInTheDocument();
    // 선호 장르는 한글 이름표로 보임
    const genres = within(screen.getByText('선호 장르').closest('div')!).getAllByRole('listitem');
    expect(genres.map((li) => li.textContent)).toEqual(['소설', '과학']);
    // 입력창·선택창이 하나도 없음
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    expect(screen.getByRole('button', { name: '회원정보 수정' })).toBeInTheDocument();
  });

  it('값이 없는 항목은 안내 문구로 보여줌', async () => {
    serve(profile({ gender: null, age_group: null, readingAmount: null, genres: [] }));
    renderProfile();

    await screen.findByText('독서가');
    expect(screen.getAllByText('제공된 정보가 없습니다.')).toHaveLength(3);
    expect(screen.getByText('선택한 장르가 없습니다.')).toBeInTheDocument();
  });

  it('수정 버튼을 누르면 입력창이 열리고 취소하면 다시 텍스트로 돌아감', async () => {
    serve();
    renderProfile();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: '회원정보 수정' }));

    expect(screen.getByLabelText(/닉네임/)).toHaveValue('독서가');
    expect(screen.getByLabelText(/이메일/)).toHaveValue('reader01@gmail.com');
    expect(screen.queryByRole('button', { name: '회원정보 수정' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(await screen.findByText('독서가')).toBeInTheDocument();
    expect(screen.queryByLabelText(/닉네임/)).not.toBeInTheDocument();
  });

  it('저장하면 텍스트 조회로 돌아와 바뀐 값과 안내를 보여줌', async () => {
    let current = profile();
    server.use(
      http.get(`${API}/member/me`, () => HttpResponse.json({ success: true, document: current })),
      http.patch(`${API}/auth/updateMyInfo`, async ({ request }) => {
        const body = (await request.json()) as { name: string };
        current = profile({ name: body.name });
        return HttpResponse.json({ success: true, document: {} });
      }),
    );
    renderProfile();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: '회원정보 수정' }));
    await user.clear(screen.getByLabelText(/닉네임/));
    await user.type(screen.getByLabelText(/닉네임/), '바뀐닉네임');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('회원정보를 수정했습니다.')).toBeInTheDocument();
    expect(await screen.findByText('바뀐닉네임')).toBeInTheDocument();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });
});
