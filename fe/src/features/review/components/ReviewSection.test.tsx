import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReviewSection from './ReviewSection';
import { fetchHighlightReviews, type HighlightReview } from '../api/publicReviews';
import { reviewMocks } from '../mocks/reviewMocks';

vi.mock('../api/publicReviews', () => ({ fetchHighlightReviews: vi.fn() }));
const fetchMock = vi.mocked(fetchHighlightReviews);

const INTERVAL = 4500;
const real = (id: number): HighlightReview => ({
  review_id: String(id),
  content: `실제 후기 ${id}`,
  rating: 5,
  reviewer_name: `홍*${id}`,
  meetup_title: '소설의 바다',
});

// jsdom은 matchMedia가 없어 모바일(1장씩 표시)·모션 허용으로 동작함
async function renderSection(items: HighlightReview[] | Error) {
  if (items instanceof Error) fetchMock.mockRejectedValue(items);
  else fetchMock.mockResolvedValue(items);
  const view = render(<ReviewSection />);
  await act(async () => {}); // 조회 결과 반영
  return view;
}

const track = (container: HTMLElement) => container.querySelector<HTMLElement>('[style*="--index"]')!;
const indexOf = (container: HTMLElement) => track(container).style.getPropertyValue('--index');
const tick = (ms = INTERVAL) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('홈 항해일지 캐러셀', () => {
  it('실제 리뷰가 없으면 목업을 이름을 가려서 보여줌', async () => {
    await renderSection([]);

    expect(screen.getAllByText('김*연').length).toBeGreaterThan(0);
    expect(screen.queryByText(reviewMocks[0].name)).not.toBeInTheDocument();
    expect(screen.getAllByText(reviewMocks[0].text).length).toBeGreaterThan(0);
  });

  it('조회에 실패해도 목업을 보여줌', async () => {
    await renderSection(new Error('network'));

    expect(screen.getAllByText('김*연').length).toBeGreaterThan(0);
  });

  it('실제 리뷰가 있으면 목업 대신 실제 리뷰를 보여줌', async () => {
    await renderSection([real(1), real(2)]);

    expect(screen.getAllByText('실제 후기 1').length).toBeGreaterThan(0);
    expect(screen.queryByText('김*연')).not.toBeInTheDocument();
  });

  it('일정 간격마다 다음 카드로 이동함', async () => {
    const { container } = await renderSection([]);
    expect(indexOf(container)).toBe('0');

    tick();
    expect(indexOf(container)).toBe('1');
    tick();
    expect(indexOf(container)).toBe('2');
  });

  it('마지막 카드 뒤에는 애니메이션 없이 처음으로 돌아가 계속 순환함', async () => {
    const { container } = await renderSection([]);
    const count = reviewMocks.length;

    tick(INTERVAL * count);
    expect(indexOf(container)).toBe(String(count)); // 복제된 첫 카드 위치
    fireEvent.transitionEnd(track(container));

    expect(indexOf(container)).toBe('0');
    expect(track(container).className).not.toMatch(/animate/);
    tick();
    expect(indexOf(container)).toBe('1');
  });

  it('transitionend가 누락돼도 다음 tick에서 처음으로 보정됨', async () => {
    const { container } = await renderSection([]);

    tick(INTERVAL * reviewMocks.length);
    tick();

    expect(indexOf(container)).toBe('0');
  });

  it('마우스를 올리면 멈추고 벗어나면 다시 돌아감', async () => {
    const { container } = await renderSection([]);
    const viewport = track(container).parentElement!;

    fireEvent.mouseEnter(viewport);
    tick(INTERVAL * 3);
    expect(indexOf(container)).toBe('0');

    fireEvent.mouseLeave(viewport);
    tick();
    expect(indexOf(container)).toBe('1');
  });

  it('카드가 한 화면에 다 보이는 개수 이하이면 이동하지 않음', async () => {
    const { container } = await renderSection([real(1)]);

    tick(INTERVAL * 3);

    expect(indexOf(container)).toBe('0');
  });

  it('복제된 카드는 스크린리더에서 숨김', async () => {
    const { container } = await renderSection([]);

    const hidden = container.querySelectorAll('[aria-hidden="true"]:not([class*="quote"]):not([class*="avatar"])');
    expect(hidden).toHaveLength(1); // 모바일(1장 표시) 기준 복제 1개
  });
});
