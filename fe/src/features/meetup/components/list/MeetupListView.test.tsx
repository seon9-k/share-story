import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { server, API } from '../../../../test/server';
import MeetupListView from './MeetupListView';

const item = (over: Record<string, unknown> = {}) => ({
  meetup_id: 1, title: '소설 모임', book_title: '채식주의자',
  book_image_url: 'https://stasharestory.blob.core.windows.net/images/a.png',
  min_capacity: 4, max_capacity: 8, status: 'RECRUITING', leader_name: '모임장',
  sch_st_date: '2099-01-10', sch_ed_date: '2099-02-07', sch_day: '토', sch_time: '20:00',
  ...over,
});

const listOf = (items: unknown[]) =>
  http.get(`${API}/meetup`, () => HttpResponse.json({ success: true, document: { items } }));

const renderList = () =>
  render(
    <MemoryRouter>
      <MeetupListView />
    </MemoryRouter>,
  );

describe('MeetupListView (REQ-GRP-002 모임 목록)', () => {
  it('카드에 도서 이미지·모임명·도서명·인원·일정을 표시함', async () => {
    server.use(listOf([item()]));
    renderList();

    expect(await screen.findByRole('heading', { name: '소설 모임' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '채식주의자' })).toHaveAttribute(
      'src',
      'https://stasharestory.blob.core.windows.net/images/a.png',
    );
    expect(screen.getByText('도서: 채식주의자')).toBeInTheDocument();
    expect(screen.getByText('인원 4~8명')).toBeInTheDocument();
    expect(screen.getByText('승선 대기')).toBeInTheDocument();
    expect(screen.getByText('총 1개의 항해')).toBeInTheDocument();
  });

  it('카드를 누르면 상세 경로 링크로 연결됨', async () => {
    server.use(listOf([item({ meetup_id: 7 })]));
    renderList();

    expect(await screen.findByRole('link', { name: /소설 모임/ })).toHaveAttribute('href', '/meetups/7');
  });

  it('이미지가 없으면 기본 이미지를 사용함', async () => {
    server.use(listOf([item({ book_image_url: null })]));
    renderList();

    expect(await screen.findByRole('img', { name: '채식주의자' })).toHaveAttribute('src', expect.stringContaining('unsplash'));
  });

  it.each([
    ['RECRUITING', '승선 대기'],
    ['CLOSED', '승선 마감'],
    ['IN_PROGRESS', '항해 중'],
    ['COMPLETED', '항해 완료'],
  ])('상태 %s → %s 표시', async (status, label) => {
    server.use(listOf([item({ status })]));
    renderList();

    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  // 마감 배치(10분 주기)가 돌기 전에도 마감 일시가 지났으면 화면에서는 마감으로 보여줌
  it.each([
    ['마감 일시가 지난 RECRUITING', '2000-01-01T00:00:00Z', '승선 마감'],
    ['마감 일시가 남은 RECRUITING', '2099-01-01T00:00:00Z', '승선 대기'],
    ['마감 일시 정보가 없는 RECRUITING', null, '승선 대기'],
  ])('%s → %s 표시', async (_name, deadline, label) => {
    server.use(listOf([item({ status: 'RECRUITING', deadline })]));
    renderList();

    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it('로딩 중에는 안내 문구를 보여줌', () => {
    server.use(listOf([]));
    renderList();
    expect(screen.getByText('항해 목록을 불러오는 중입니다.')).toBeInTheDocument();
  });

  it('목록이 비어 있으면 빈 상태를 보여줌', async () => {
    server.use(listOf([]));
    renderList();

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('총 0개의 항해')).toBeInTheDocument();
  });

  it('조회에 실패하면 서버 메시지와 함께 오류를 보여줌', async () => {
    server.use(
      http.get(`${API}/meetup`, () =>
        HttpResponse.json({ success: false, message: '모임 목록 조회에 실패하였습니다.' }, { status: 500 }),
      ),
    );
    renderList();

    expect(await screen.findByText('목록 조회에 실패했습니다.')).toBeInTheDocument();
    expect(screen.getByText('모임 목록 조회에 실패하였습니다.')).toBeInTheDocument();
  });

  it('검색어로 모임명 또는 도서명을 필터링함', async () => {
    server.use(
      listOf([
        item({ meetup_id: 1, title: '소설 모임', book_title: '채식주의자' }),
        item({ meetup_id: 2, title: '경제 모임', book_title: '부의 추월차선' }),
      ]),
    );
    renderList();
    await screen.findByRole('heading', { name: '소설 모임' });
    const user = userEvent.setup();
    const search = screen.getByRole('searchbox', { name: '항해 검색' });

    await user.type(search, '추월');
    expect(screen.queryByRole('heading', { name: '소설 모임' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '경제 모임' })).toBeInTheDocument();
    expect(screen.getByText('총 1개의 항해')).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, '없는검색어');
    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('항해 개설 링크가 있음', async () => {
    server.use(listOf([]));
    renderList();
    expect(await screen.findByRole('link', { name: '항해 개설' })).toHaveAttribute('href', '/meetups/create');
  });
});
