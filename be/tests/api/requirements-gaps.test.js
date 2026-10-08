// 요구사항 정의서 대비 미구현·불일치 항목. 구현되면 해당 항목을 실제 테스트로 바꿀 것 (jest 출력의 "todo"로 표시됨)

describe('미구현 요구사항', () => {
  test.todo('REQ-MEM-001 카카오 소셜 로그인 (POST /auth/kakao 없음. users.social_provider/social_id 컬럼만 존재)');
  test.todo('REQ-PAY-001 결제(페이게이트) 연동 — 신청은 payment_status PENDING 고정 응답뿐이며 결제 API 없음');
  test.todo('REQ-SES-002 독후감 최소 400자 검증 — PUT /logbook/.../me는 빈 문자열만 거부함');
  test.todo('REQ-SES-002 독후감 제출 마감(모임 2일 전) 검증 — 제출 시점 제한 없음');
  test.todo('REQ-GRP-005 신청자 목록에 성별·독서량·신청일자 포함 — 현재 apply_id, user_id, name, status만 반환');
  test.todo('REQ-GRP-002 모임 목록 정렬 기준·무한 스크롤(요구사항에 "확인 필요"로 표기됨) — 현재 created_at DESC 페이징');
  test.todo('REQ-GRP-003 모임 상세의 총 금액/월 금액/납부 방법/장소/환불 안내 — price 단일 값, 장소·납부 방법은 FE 고정 문구');
  test.todo('REQ-GRP-003 추천 모임 3개 — FE relatedMeetups는 항상 빈 배열');
});

describe('요구사항 해석 확인 필요', () => {
  test.todo('REQ-GRP-001 "4~6회차"로 적혀 있으나 BE는 정확히 4회차만 허용 (ERD·배치 설명은 4회차)');
  test.todo('REQ-PAY-002 "최소/최대 인원 충족 시 마감" — 현재는 최대 인원 도달 또는 마감일 경과 시에만 CLOSED. 마감일에 최소 인원(4명) 미달이어도 그대로 진행됨');
  test.todo('REQ-MEM-002 가입 항목이 문서와 다름 — 아이디(user_id)와 장르 최대 2개가 추가되고 이메일은 도메인 선택 방식');
});
