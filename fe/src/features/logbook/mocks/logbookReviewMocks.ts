import type { CrewLogbookReport, LogbookSession } from '../types/logbookReview';

export const crewLogbookReportMocks: CrewLogbookReport[] = [
  // 1회차
  {
    id: 1,
    crewId: 1,
    sessionNumber: 1,
    label: '크루 01',
    chars: 523,
    submittedAt: '10.03 18:32',
    status: '검토 대기',
    content:
      '가장 인상 깊었던 부분은 인물이 자신의 생각을 바꾸는 장면입니다. 처음에는 단순히 성장 소설로 읽었지만, 점점 각 인물의 선택 하나하나가 주제를 향해 수렴하는 구조가 보였습니다. 특히 주인공이 실패를 통해서만 진정한 의미를 발견하게 되는 여정이 묵직하게 다가왔습니다.',
  },
  {
    id: 2,
    crewId: 2,
    sessionNumber: 1,
    label: '크루 02',
    chars: 412,
    submittedAt: '10.02 21:10',
    status: '승인 완료',
    content:
      '책을 읽으며 내내 "나라면 어떤 선택을 했을까"를 생각했습니다. 문장들이 간결하면서도 깊어서 천천히 음미하며 읽었습니다.',
  },
  {
    id: 3,
    crewId: 3,
    sessionNumber: 1,
    label: '크루 03',
    chars: 0,
    submittedAt: null,
    status: '미제출',
    content: '',
  },

  // 2회차
  {
    id: 4,
    crewId: 1,
    sessionNumber: 2,
    label: '크루 01',
    chars: 461,
    submittedAt: '10.10 19:14',
    status: '검토 대기',
    content: '두 번째 회차에서는 인상 깊었던 문장을 중심으로 생각을 정리했습니다.',
  },
  {
    id: 5,
    crewId: 2,
    sessionNumber: 2,
    label: '크루 02',
    chars: 0,
    submittedAt: null,
    status: '미제출',
    content: '',
  },
  {
    id: 6,
    crewId: 3,
    sessionNumber: 2,
    label: '크루 03',
    chars: 438,
    submittedAt: '10.11 20:03',
    status: '검토 대기',
    content: '이번 회차에서는 같은 문장도 사람마다 다르게 받아들일 수 있다는 점이 흥미로웠습니다.',
  },
];

export const logbookSessionMocks: LogbookSession[] = [
  {
    number: 1,
    date: '10.06',
    topic: '첫인상과 인물',
  },
  {
    number: 2,
    date: '10.13',
    topic: '인상 깊은 문장',
  },
  {
    number: 3,
    date: '10.20',
    topic: '주제와 질문',
  },
  {
    number: 4,
    date: '10.27',
    topic: '우리의 해석',
  },
];

export const confirmedCrewCountMock = 6;

export const logbookReviewsByMeetup: Record<
  number,
  | {
      meetupId: number;
      title: string;
      confirmedCount: number;
      sessions: LogbookSession[];
      reports: CrewLogbookReport[];
    }
  | undefined
> = {
  10: {
    meetupId: 10,
    title: '퇴근 후, 함께 읽는 네 번의 저녁',
    confirmedCount: confirmedCrewCountMock,
    sessions: logbookSessionMocks,
    reports: crewLogbookReportMocks,
  },
  11: {
    meetupId: 11,
    title: '문장으로 쉬어 가는 밤',
    confirmedCount: 8,
    sessions: [{ number: 1, date: '09.16', topic: '첫 만남과 문장' }],
    reports: [],
  },
  12: {
    meetupId: 12,
    title: '천천히 읽는 주말',
    confirmedCount: 6,
    sessions: [{ number: 1, date: '08.08', topic: '함께 읽은 주말' }],
    reports: [],
  },
};
