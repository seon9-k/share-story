import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, API } from '../../../../test/server';
import { renderAt, signIn } from '../../../../test/render';
import MeetupDetailView from './MeetupDetailView';

const detail = (over: { meetup?: Record<string, unknown>; apply_count?: number } = {}) => ({
  meetup: {
    meetup_id: 1, leader_id: 'leader01', title: '소설 모임', description: '소설을 함께 읽어요',
    book_title: '채식주의자', book_image_url: null, price: 40000, min_capacity: 4, max_capacity: 8,
    deadline: '2099-01-01T12:00:00', status: 'RECRUITING', leader_name: '모임장', ...over.meetup,
  },
  sessions: [1, 2, 3, 4].map((n) => ({
    session_id: n, session_number: n, topic: `${n}회차 주제`, sch_date: `2099-0${n}-10`, sch_day: '토',
    sch_time: '20:00', sch_st_time: '20:00', sch_ed_time: '22:00', zoom_url: null, zoom_password: null,
    status: 'SCHEDULED',
  })),
  apply_count: over.apply_count ?? 2,
  apply_user_stats: {
    genre_1: {}, genre_2: {}, monthly_reading_volume: { BOOKS_3_4: 2 }, age_group: { '20대': 2 }, gender: { F: 2 },
  },
});

const serve = (body = detail()) =>
  server.use(http.get(`${API}/meetup/1`, () => HttpResponse.json({ success: true, document: body })));

const renderDetail = () => renderAt(<MeetupDetailView />, { path: '/meetups/:meetupId', route: '/meetups/1' });

describe('MeetupDetailView (REQ-GRP-003 모임 상세)', () => {
  it('모임 기본 정보와 4개 회차 주제를 표시함', async () => {
    serve();
    renderDetail();

    expect(await screen.findByRole('heading', { name: '소설 모임' })).toBeInTheDocument();
    for (const n of [1, 2, 3, 4]) expect(screen.getByText(`${n}회차 주제`)).toBeInTheDocument();
  });

  it('없는 모임이면 안내와 목록 링크를 보여줌', async () => {
    server.use(http.get(`${API}/meetup/1`, () => HttpResponse.json({ success: false }, { status: 404 })));
    renderDetail();

    expect(await screen.findByText('모임을 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '모임 목록' })).toHaveAttribute('href', '/meetups');
  });

  it('조회가 실패해도 처리되지 않은 오류 없이 안내와 목록 링크를 보여줌', async () => {
    server.use(http.get(`${API}/meetup/1`, () => HttpResponse.json({ success: false }, { status: 500 })));
    renderDetail();

    expect(await screen.findByText('모임을 찾을 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '모임 목록' })).toHaveAttribute('href', '/meetups');
  });

  it('로그인하지 않아도 상세를 볼 수 있음', async () => {
    serve();
    renderDetail();
    expect(await screen.findByRole('heading', { name: '소설 모임' })).toBeInTheDocument();
  });
});

describe('MeetupDetailView 참여 신청 (REQ-MEM-001, REQ-PAY-001)', () => {
  it('비로그인 사용자가 참여하기를 누르면 로그인 화면으로 보내고 돌아올 경로를 넘김', async () => {
    serve();
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    await userEvent.setup().click(screen.getByRole('button', { name: '항해 참여하기' }));

    const location = await screen.findByTestId('location');
    expect(location).toHaveTextContent('/login');
    expect(JSON.parse(location.dataset.state!)).toEqual({ from: '/meetups/1' });
  });

  it('로그인 사용자가 신청하면 완료 안내를 보여주고 상세를 다시 조회함', async () => {
    signIn('crew01');
    let detailCalls = 0;
    let applyBody: unknown;
    server.use(
      http.get(`${API}/meetup/1`, () => {
        detailCalls += 1;
        return HttpResponse.json({ success: true, document: detail({ apply_count: detailCalls === 1 ? 2 : 3 }) });
      }),
      http.post(`${API}/meetup/1/apply`, async ({ request }) => {
        applyBody = await request.json();
        return HttpResponse.json({ success: true, document: { meetup_id: 1, user_id: 'crew01' } }, { status: 201 });
      }),
    );
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    await userEvent.setup().click(screen.getByRole('button', { name: '항해 참여하기' }));

    expect(await screen.findByText('항해 참여 신청이 완료되었습니다.')).toBeInTheDocument();
    expect(applyBody).toEqual({ user_id: 'crew01', meetup_id: 1 });
    expect(detailCalls).toBe(2);
  });

  it('정원 초과 등 서버 오류 메시지를 보여줌', async () => {
    signIn('crew01');
    serve();
    server.use(
      http.post(`${API}/meetup/1/apply`, () =>
        HttpResponse.json({ success: false, message: '모집 인원이 마감되었습니다.' }, { status: 409 }),
      ),
    );
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    await userEvent.setup().click(screen.getByRole('button', { name: '항해 참여하기' }));

    expect(await screen.findByText('모집 인원이 마감되었습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '항해 참여하기' })).toBeEnabled();
  });

  it('토큰이 만료(401)되면 로그아웃하고 로그인 화면으로 보내 돌아올 경로를 넘김', async () => {
    signIn('crew01');
    serve();
    server.use(
      http.post(`${API}/meetup/1/apply`, () =>
        HttpResponse.json({ success: false, message: '로그인이 만료되었습니다.' }, { status: 401 }),
      ),
    );
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    await userEvent.setup().click(screen.getByRole('button', { name: '항해 참여하기' }));

    const location = await screen.findByTestId('location');
    expect(location).toHaveTextContent('/login');
    expect(JSON.parse(location.dataset.state!)).toEqual({ from: '/meetups/1' });
    expect(localStorage.getItem('sharestory.token')).toBeNull();
    expect(localStorage.getItem('sharestory.user')).toBeNull();
  });

  it('모임장 본인에게는 참여하기 버튼이 보이지 않고 항해수정 링크가 열림', async () => {
    signIn('leader01');
    serve();
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    expect(screen.queryByRole('button', { name: '항해 참여하기' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '항해수정' })).toHaveAttribute('href', '/meetups/1/edit');
  });

  it.each([
    ['CLOSED', '승선 마감'],
    ['IN_PROGRESS', '항해 중'],
    ['COMPLETED', '항해 완료'],
  ])('상태 %s → %s 표시, 참여하기 비활성화', async (status, label) => {
    signIn('crew01');
    serve(detail({ meetup: { status } }));
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: '항해 참여하기' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '승선 마감' })).toBeDisabled();
  });

  it('모집 중이어도 마감 일시가 지났으면 승선 마감으로 보이고 참여하기가 비활성화됨', async () => {
    signIn('crew01');
    serve(detail({ meetup: { deadline: '2000-01-01T00:00:00' } }));
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    expect(screen.getByRole('button', { name: '승선 마감' })).toBeDisabled();
  });

  it('모임장이 아니면 항해수정 버튼이 보이지 않음', async () => {
    signIn('crew01');
    serve();
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    expect(screen.queryByText('항해수정')).not.toBeInTheDocument();
    // 수정 버튼이 없어도 목록으로·참여하기는 그대로 보임
    expect(screen.getByRole('link', { name: '목록으로' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '항해 참여하기' })).toBeEnabled();
  });

  it('비로그인 사용자에게도 항해수정 버튼이 보이지 않음', async () => {
    serve();
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    expect(screen.queryByText('항해수정')).not.toBeInTheDocument();
  });
});

describe('MeetupDetailView 후기 섹션', () => {
  const review = {
    review_id: 'r1', apply_id: 'a1', content: '좋은 모임이었어요', rating: 5,
    reviewed_at: '2099-05-01T00:00:00', apply: { user_id: 'crew02', User: { name: '크루2' } },
  };
  const serveReviews = (items: unknown[]) =>
    server.use(
      http.get(`${API}/review/meetups/1`, () =>
        HttpResponse.json({ success: true, document: { items, nextPage: null } }),
      ),
    );

  it('종료된 모임에 후기가 있으면 후기 섹션을 보여줌', async () => {
    signIn('crew01');
    serve(detail({ meetup: { status: 'COMPLETED' } }));
    serveReviews([review]);
    renderDetail();

    expect(await screen.findByText('좋은 모임이었어요')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '항해 후기' })).toBeInTheDocument();
  });

  it('종료된 모임이라도 후기가 없으면 후기 섹션이 보이지 않음', async () => {
    signIn('crew01');
    serve(detail({ meetup: { status: 'COMPLETED' } }));
    serveReviews([]);
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    expect(screen.queryByRole('heading', { name: '항해 후기' })).not.toBeInTheDocument();
  });

  it.each(['RECRUITING', 'IN_PROGRESS'])('%s 모임에는 후기 섹션이 보이지 않음', async (status) => {
    signIn('crew01');
    serve(detail({ meetup: { status } }));
    serveReviews([review]);
    renderDetail();
    await screen.findByRole('heading', { name: '소설 모임' });

    expect(screen.queryByRole('heading', { name: '항해 후기' })).not.toBeInTheDocument();
  });
});
