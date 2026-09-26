import type { MeetupDetail } from '../types/meetupDetail';

export const meetupDetailMocks: Record<number, MeetupDetail> = {
  5: {
    id: 5,
    title: '퇴근 후, 함께 읽는 네 번의 저녁',
    book: '함께 읽는 시간',
    captain: '책읽는밤',
    intro: '책 한 권을 천천히 읽고, 매주 서로의 생각을 나누는 온라인 독서 항해입니다.',
    location: '온라인(Zoom)',
    time: '20:00–21:30',
    appliedMembers: 6,
    maxMembers: 8,
    deadline: '10.03 23:59',
    price: 40000,
    payment: '일시납',
    status: '모집 중',
    image:
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=560&fit=crop&auto=format',

    sessions: [
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
    ],

    stats: {
      age: [
        { label: '20대', count: 3 },
        { label: '30대', count: 2 },
        { label: '40대', count: 1 },
      ],
      gender: [
        { label: '여성', count: 3 },
        { label: '남성', count: 3 },
      ],
      reading: [
        { label: '1–2권', count: 4 },
        { label: '3–4권', count: 2 },
      ],
    },

    relatedMeetups: [
      {
        title: '문장으로 쉬어 가는 밤',
        book: '고요한 문장들',
        image:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=140&fit=crop&auto=format',
      },
      {
        title: '책에서 시작한 대화',
        book: '오늘의 대화',
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=140&fit=crop&auto=format',
      },
      {
        title: '천천히 읽는 주말',
        book: '조금 느린 독서',
        image:
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=100&h=140&fit=crop&auto=format',
      },
    ],
  },
};

export const defaultMeetupDetail: MeetupDetail = {
  id: 1,
  title: '싯다르타 독서회',
  book: '싯다르타',
  captain: '책읽는밤',
  intro: '헤르만 헤세의 싯다르타를 함께 읽으며 삶의 의미를 탐구하는 항해입니다.',
  location: '온라인(Zoom)',
  time: '20:00–21:00',
  appliedMembers: 6,
  maxMembers: 8,
  deadline: '11.20 23:59',
  price: 40000,
  payment: '일시납',
  status: '모집 중',
  image:
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=560&fit=crop&auto=format',

  sessions: [
    {
      number: 1,
      date: '11.25',
      topic: '첫인상',
    },
    {
      number: 2,
      date: '12.30',
      topic: '인상 깊은 문장',
    },
    {
      number: 3,
      date: '27.01.27',
      topic: '주제와 질문',
    },
    {
      number: 4,
      date: '27.02.24',
      topic: '우리의 해석',
    },
  ],

  stats: {
    age: [
      { label: '20대', count: 3 },
      { label: '30대', count: 2 },
      { label: '40대', count: 1 },
    ],
    gender: [
      { label: '여성', count: 4 },
      { label: '남성', count: 2 },
    ],
    reading: [
      { label: '1–2권', count: 3 },
      { label: '3–4권', count: 3 },
    ],
  },

  relatedMeetups: [
    {
      title: '철학의 숲',
      book: '소크라테스의 변명',
      image:
        'https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=100&h=140&fit=crop&auto=format',
    },
    {
      title: '문장으로 쉬어 가는 밤',
      book: '고요한 문장들',
      image:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=140&fit=crop&auto=format',
    },
    {
      title: '천천히 읽는 주말',
      book: '조금 느린 독서',
      image:
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=100&h=140&fit=crop&auto=format',
    },
  ],
};
