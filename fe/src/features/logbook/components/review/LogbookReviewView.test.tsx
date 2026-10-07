import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, API } from '../../../../test/server';
import { renderAt, signIn } from '../../../../test/render';
import LogbookReviewView from './LogbookReviewView';

// REQ-SES-003: 모임장이 제출된 독후감을 확인하고 '숙제 확인 완료'로 승인함
const logbook = (over = {}) => ({
  logbook_id: '9', apply_id: '10', meetup_id: '1', session_id: '2', content: '이 책을 읽고 느낀 점',
  submitted_at: '2099-01-08T10:00:00Z', is_approved: false, ...over,
});
const crewRow = (over = {}) => ({ apply_id: '10', user_id: 'crew01', name: '크루', status: 'ING', logbook: logbook(), ...over });

const serve = (rows: unknown[]) =>
  server.use(
    http.get(`${API}/member/meetups/1/sessions`, () =>
      HttpResponse.json({ success: true, document: [{ session_id: '2', meetup_id: '1', session_number: 1, topic: '1장', sch_date: '2099-01-10', sch_day: '토', sch_time: '20:00', sch_st_time: '20:00', sch_ed_time: '22:00', status: 'SCHEDULED' }] }),
    ),
    http.get(`${API}/member/meetups/1/crews`, () =>
      HttpResponse.json({ success: true, document: { items: [], page: 1, limit: 100, total: 0, nextPage: null } }),
    ),
    http.get(`${API}/meetup/1`, () => HttpResponse.json({ success: true, document: { meetup: { title: '소설 모임' } } })),
    http.get(`${API}/logbook/meetups/1/sessions/2`, () =>
      HttpResponse.json({ success: true, document: { items: rows, page: 1, limit: 100, total: rows.length, nextPage: null } }),
    ),
  );

const open = async () => {
  signIn('leader01');
  renderAt(<LogbookReviewView />, { path: '/meetups/:meetupId/logbooks/review', route: '/meetups/1/logbooks/review' });
  await userEvent.setup().click(await screen.findByRole('button', { name: /크루/ }));
};

describe('LogbookReviewView 숙제 확인 완료 (REQ-SES-003)', () => {
  it('제출한 크루의 로그북을 보여주고 아직 미확인 상태를 안내함', async () => {
    serve([crewRow()]);
    await open();

    expect(await screen.findByText('이 책을 읽고 느낀 점')).toBeInTheDocument();
    expect(screen.getByText(/확인을 완료해야 이 크루에게 Zoom 접속 정보가 발송됩니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '숙제 확인 완료' })).toBeEnabled();
  });

  it('버튼을 누르면 승인 API를 호출하고 화면이 확인 완료로 바뀜', async () => {
    serve([crewRow()]);
    let seen: { url: string; auth: string | null; body: unknown } | undefined;
    server.use(
      http.patch(`${API}/logbook/meetups/1/sessions/2/logbooks/9/approval`, async ({ request }) => {
        seen = { url: new URL(request.url).pathname, auth: request.headers.get('Authorization'), body: await request.json() };
        return HttpResponse.json({ success: true, document: { logbook_id: '9', is_approved: true } });
      }),
    );
    await open();

    await userEvent.setup().click(await screen.findByRole('button', { name: '숙제 확인 완료' }));

    expect(await screen.findByRole('button', { name: '확인 취소' })).toBeInTheDocument();
    expect(screen.getByText(/Zoom 접속 정보가 메일로 발송됩니다/)).toBeInTheDocument();
    expect(screen.getAllByText('확인 완료').length).toBeGreaterThan(0); // 목록 배지도 갱신
    expect(seen).toEqual({
      url: '/logbook/meetups/1/sessions/2/logbooks/9/approval',
      auth: 'Bearer test-token',
      body: { is_approved: true },
    });
  });

  it('이미 승인된 로그북은 확인 취소로 되돌릴 수 있음', async () => {
    serve([crewRow({ logbook: logbook({ is_approved: true }) })]);
    let body: unknown;
    server.use(
      http.patch(`${API}/logbook/meetups/1/sessions/2/logbooks/9/approval`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, document: { logbook_id: '9', is_approved: false } });
      }),
    );
    await open();

    await userEvent.setup().click(await screen.findByRole('button', { name: '확인 취소' }));

    expect(await screen.findByRole('button', { name: '숙제 확인 완료' })).toBeInTheDocument();
    expect(body).toEqual({ is_approved: false });
  });

  it('승인에 실패하면 서버 메시지를 보여주고 상태를 바꾸지 않음', async () => {
    serve([crewRow()]);
    server.use(
      http.patch(`${API}/logbook/meetups/1/sessions/2/logbooks/9/approval`, () =>
        HttpResponse.json({ success: false, message: '이 모임의 캡틴만 이용할 수 있습니다.' }, { status: 403 }),
      ),
    );
    await open();

    await userEvent.setup().click(await screen.findByRole('button', { name: '숙제 확인 완료' }));

    expect(await screen.findByText('이 모임의 캡틴만 이용할 수 있습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '숙제 확인 완료' })).toBeEnabled();
  });

  it('요청 중에는 버튼이 비활성화되어 중복 승인을 막음', async () => {
    serve([crewRow()]);
    server.use(
      http.patch(`${API}/logbook/meetups/1/sessions/2/logbooks/9/approval`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ success: true, document: { logbook_id: '9', is_approved: true } });
      }),
    );
    await open();

    await userEvent.setup().click(await screen.findByRole('button', { name: '숙제 확인 완료' }));

    expect(screen.getByRole('button', { name: '처리 중...' })).toBeDisabled();
    await screen.findByRole('button', { name: '확인 취소' });
  });

  it('미제출 크루에게는 승인 버튼이 없음', async () => {
    serve([crewRow({ logbook: null })]);
    await open();

    expect(await screen.findByText('아직 로그북을 제출하지 않았습니다.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: '숙제 확인 완료' })).not.toBeInTheDocument());
  });
});
