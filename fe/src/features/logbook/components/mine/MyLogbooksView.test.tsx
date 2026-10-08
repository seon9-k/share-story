import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, API } from '../../../../test/server';
import { renderAt, signIn } from '../../../../test/render';
import MyLogbooksView from './MyLogbooksView';

// KST 기준 오늘로부터 n일 뒤 날짜 (화면이 쓰는 기준과 같음)
const day = (n: number) =>
  new Date(Date.now() + n * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

const session = (number: number, offset: number, status = 'SCHEDULED') => ({
  session_id: String(number), meetup_id: '1', session_number: number, topic: `${number}회차 주제`,
  sch_date: day(offset), sch_day: '토', sch_time: '20:00', sch_st_time: '20:00', sch_ed_time: '22:00', status,
});
// 1·2회차는 지났고 3회차가 다음 예정 회차
const sessions = [session(1, -14), session(2, -7), session(3, 3), session(4, 10)];

const ok = (document: unknown) => HttpResponse.json({ success: true, document });
const serve = ({ meetupStatus = 'IN_PROGRESS', list = sessions, mine = null as unknown } = {}) =>
  server.use(
    http.get(`${API}/meetup/1`, () => ok({ meetup: { meetup_id: '1', title: '소설 모임', status: meetupStatus } })),
    http.get(`${API}/member/meetups/1/sessions`, () => ok(list)),
    http.get(`${API}/logbook/meetups/1/sessions/3/me`, () => ok(mine)),
  );

const entry = (id: number, number: number, content: string, over = {}) => ({
  logbook_id: String(id), session_id: String(id), session_number: number, topic: `${number}회차 주제`,
  sch_date: day(-14 + (number - 1) * 7), content, submitted_at: '2026-10-01T01:00:00Z', is_approved: false, ...over,
});
const groups = [
  {
    meetup: { meetup_id: '2', title: '과학 모임', book_title: '코스모스', status: 'IN_PROGRESS' },
    logbooks: [entry(5, 1, '과학 모임 1회차 기록')],
  },
  {
    meetup: { meetup_id: '1', title: '소설 모임', book_title: '채식주의자', status: 'IN_PROGRESS' },
    logbooks: [entry(1, 1, '소설 모임 1회차 기록', { is_approved: true }), entry(2, 2, '소설 모임 2회차 기록')],
  },
  {
    meetup: { meetup_id: '3', title: '역사 모임', book_title: '사피엔스', status: 'COMPLETED' },
    logbooks: [entry(9, 4, '역사 모임 4회차 기록')],
  },
];

const renderView = () => {
  signIn('crew01');
  return renderAt(<MyLogbooksView />, { path: '/meetups/:meetupId/logbooks', route: '/meetups/1/logbooks' });
};
const openMine = async () => userEvent.setup().click(screen.getByRole('button', { name: '제출한 로그북' }));

describe('MyLogbooksView 로그북 작성 탭', () => {
  it('모든 회차가 아니라 다음 예정 회차 하나와 그 로그북 입력창만 보여줌', async () => {
    serve();
    renderView();

    expect(await screen.findByRole('heading', { name: '3회차 · 3회차 주제' })).toBeInTheDocument();
    expect(screen.getByLabelText('나의 독서 기록')).toBeInTheDocument();
    for (const other of ['1회차', '2회차', '4회차'])
      expect(screen.queryByRole('heading', { name: new RegExp(`^${other}`) })).not.toBeInTheDocument();
    expect(screen.getByText('미제출')).toBeInTheDocument();
  });

  it('제출하면 해당 회차로 저장하고 제출 완료로 바뀜', async () => {
    serve();
    let body: unknown;
    server.use(
      http.put(`${API}/logbook/meetups/1/sessions/3/me`, async ({ request }) => {
        body = await request.json();
        return ok({ logbook_id: '7', session_id: '3', apply_id: '10', content: '새 기록', submitted_at: 'x', is_approved: false });
      }),
    );
    renderView();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('나의 독서 기록'), '새 기록');
    await user.click(screen.getByRole('button', { name: '로그북 제출' }));

    expect(await screen.findByText('3회차 로그북을 제출했습니다.')).toBeInTheDocument();
    expect(body).toEqual({ content: '새 기록' });
    expect(screen.getByText('제출 완료')).toBeInTheDocument();
  });

  it('이미 제출한 로그북이면 내용을 채워서 수정할 수 있게 함', async () => {
    serve({ mine: { logbook_id: '7', session_id: '3', apply_id: '10', content: '이전 기록', submitted_at: 'x', is_approved: false } });
    renderView();

    expect(await screen.findByDisplayValue('이전 기록')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정하여 다시 제출' })).toBeInTheDocument();
    expect(screen.getByText('제출 완료')).toBeInTheDocument();
  });

  it('모든 회차가 지났으면 작성할 회차가 없다고 안내하고 제출한 로그북으로 안내함', async () => {
    serve({ list: [session(1, -21), session(2, -14), session(3, -7), session(4, -1)] });
    renderView();

    expect(await screen.findByText('작성할 회차가 없어요.')).toBeInTheDocument();
    expect(screen.getByText(/'제출한 로그북'에서 확인할 수 있어요/)).toBeInTheDocument();
    expect(screen.queryByLabelText('나의 독서 기록')).not.toBeInTheDocument();
  });

  it('취소된 회차는 건너뛰고 그 다음 회차를 보여줌', async () => {
    serve({ list: [session(1, -7), session(2, -1), session(3, 3, 'CANCELLED'), session(4, 10)] });
    server.use(http.get(`${API}/logbook/meetups/1/sessions/4/me`, () => ok(null)));
    renderView();

    expect(await screen.findByRole('heading', { name: '4회차 · 4회차 주제' })).toBeInTheDocument();
  });

  it('완료된 모임은 입력창 없이 작성 불가 안내만 보여줌', async () => {
    serve({ meetupStatus: 'COMPLETED' });
    renderView();

    expect(await screen.findByText('완료된 모임에는 로그북을 작성하거나 수정할 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByLabelText('나의 독서 기록')).not.toBeInTheDocument();
  });

  it('제출한 로그북 탭을 다녀와도 아직 제출하지 않은 입력이 유지됨', async () => {
    serve();
    server.use(http.get(`${API}/logbook/mine`, () => ok(groups)));
    renderView();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('나의 독서 기록'), '쓰는 중');
    await openMine();
    await screen.findByRole('heading', { name: '과학 모임' });
    await user.click(screen.getByRole('button', { name: '로그북 작성' }));

    expect(await screen.findByDisplayValue('쓰는 중')).toBeVisible();
  });
});

describe('MyLogbooksView 제출한 로그북 탭', () => {
  it('여러 모임의 로그북을 모임 단위로 묶고 지난 회차 내용도 보여줌', async () => {
    serve();
    server.use(http.get(`${API}/logbook/mine`, () => ok(groups)));
    renderView();
    await screen.findByRole('heading', { name: '3회차 · 3회차 주제' });

    await openMine();

    const headings = await screen.findAllByRole('heading', { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(['과학 모임', '소설 모임', '역사 모임']);
    // 소설 모임 묶음 안에 1·2회차 로그북이 회차 순서로 있음
    const novel = screen.getByRole('heading', { name: '소설 모임' }).closest('section')!;
    expect(within(novel).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      '1회차 · 1회차 주제',
      '2회차 · 2회차 주제',
    ]);
    expect(within(novel).getByText('소설 모임 1회차 기록')).toBeInTheDocument();
    expect(within(novel).getByText('확인 완료')).toBeInTheDocument();
    expect(within(novel).getByText('확인 대기')).toBeInTheDocument();
  });

  it('읽기 전용이라 수정·삭제 입력창이 없고, 작성 화면 내용은 가려짐', async () => {
    serve();
    server.use(http.get(`${API}/logbook/mine`, () => ok(groups)));
    renderView();
    await screen.findByRole('heading', { name: '3회차 · 3회차 주제' });

    await openMine();
    await screen.findByRole('heading', { name: '과학 모임' });

    // 제출한 로그북 안에는 입력창·삭제 버튼이 없음
    for (const title of ['과학 모임', '소설 모임', '역사 모임']) {
      const group = screen.getByRole('heading', { name: title }).closest('section')!;
      expect(within(group).queryByRole('textbox')).not.toBeInTheDocument();
      expect(within(group).queryByRole('button')).not.toBeInTheDocument();
    }
    // 작성 영역은 입력을 유지하려고 DOM에는 남기되 화면에서는 가려짐
    expect(screen.getByLabelText('나의 독서 기록')).not.toBeVisible();
    expect(screen.queryByRole('heading', { name: '3회차 · 3회차 주제' })).not.toBeInTheDocument();
  });

  it('다른 진행 중 모임에는 작성 링크를 주고, 현재 모임과 완료된 모임에는 주지 않음', async () => {
    serve();
    server.use(http.get(`${API}/logbook/mine`, () => ok(groups)));
    renderView();
    await screen.findByRole('heading', { name: '3회차 · 3회차 주제' });

    await openMine();
    await screen.findByRole('heading', { name: '과학 모임' });

    const links = screen.getAllByRole('link', { name: '로그북 작성하기' });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/meetups/2/logbooks');
  });

  it('제출한 로그북이 없으면 안내함', async () => {
    serve();
    server.use(http.get(`${API}/logbook/mine`, () => ok([])));
    renderView();
    await screen.findByRole('heading', { name: '3회차 · 3회차 주제' });

    await openMine();

    expect(await screen.findByText('아직 제출한 로그북이 없어요.')).toBeInTheDocument();
  });
});
