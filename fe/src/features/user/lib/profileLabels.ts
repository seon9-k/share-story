import type { PreferredGenre } from '../../auth';

// 선호 장르 표기. 조회 화면(ProfileInfo)과 수정 폼(ProfileEditForm)이 함께 사용함
export const GENRES: { value: PreferredGenre; label: string }[] = [
  { value: 'NOVEL', label: '소설' },
  { value: 'ECONOMY_BUSINESS', label: '경제·경영' },
  { value: 'SELF_DEVELOPMENT', label: '자기계발' },
  { value: 'IT', label: 'IT' },
  { value: 'ESSAY', label: '에세이' },
  { value: 'TRAVEL_LIFESTYLE', label: '여행·라이프스타일' },
  { value: 'PARENT_CHILD', label: '부모 교육' },
  { value: 'HUMANITIES_PHILOSOPHY', label: '인문·철학' },
  { value: 'SOCIETY', label: '사회' },
  { value: 'SCIENCE', label: '과학' },
  { value: 'HISTORY', label: '역사' },
  { value: 'ETC', label: '그외' },
];
