#!/usr/bin/env node
/*
 * 테스트 문서 생성기
 * 세 테스트 도구의 실행 결과(JSON)에서 케이스를 뽑아 단계별 테스트 문서를 만듦.
 * 결과에서 직접 뽑으므로 문서의 케이스 수가 실제 실행 수와 항상 일치함.
 *
 * 사용: node docs/tools/generate-test-docs.js --be be.json --fe fe.json --e2e e2e.json [--out "docs/테스트"]
 * 보통은 docs/tools/generate-test-docs.sh로 테스트 실행부터 한 번에 수행함.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, cur, i, arr) => (cur.startsWith('--') ? [...acc, [cur.slice(2), arr[i + 1]]] : acc), []));
for (const key of ['be', 'fe', 'e2e']) if (!args[key]) throw new Error(`--${key} 결과 파일이 필요함`);
const OUT = path.resolve(ROOT, args.out || 'docs/테스트');

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const sh = (cmd) => { try { return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return '-'; } };

// ───────────────────────── 시나리오 정의 ─────────────────────────
// match(file, topDescribe) 가 먼저 참인 항목에 케이스가 배정됨 (구체적인 조건을 앞에 둠)
const f = (p) => (file) => file === p;
const SCENARIOS = [
  // ── 단위 ──
  { stage: 'unit', id: 'U-01', title: 'BE 인증 미들웨어', purpose: 'Authorization: Bearer 토큰 검증 (헤더 없음·형식 오류·위조·만료·정상)', reqs: ['NFR-SEC-001', 'REQ-MEM-001'], match: f('be/tests/unit/authorization.test.js') },
  { stage: 'unit', id: 'U-02', title: 'BE 서비스 권한·상태 분기', purpose: '신청·로그북·후기·삭제 서비스의 권한(캡틴/크루), 상태, 정원, 소프트 삭제 복구 로직', reqs: ['REQ-PAY-001', 'REQ-PAY-002', 'REQ-SES-002', 'REQ-SES-003', 'REQ-REV-001', 'REQ-MEM-003', 'REQ-GRP-005'], match: f('be/tests/unit/member.test.js') },
  { stage: 'unit', id: 'U-03', title: 'BE 메일·회차 완료 배치 서비스', purpose: 'Zoom 메일(D-1·당일, 승인자만), 과제 안내 메일(D-3), 회차 완료(KST 익일). 메일은 대체하고 발송 호출을 검증', reqs: ['REQ-SES-001', 'REQ-SES-004', 'REQ-BAT-001'], match: f('be/tests/api/mail-batch.test.js') },
  { stage: 'unit', id: 'U-04', title: 'BE 모집 마감일 판정', purpose: '모집 마감일이 첫 회차 시작 시각(KST)보다 이전인지 판정하는 순수 함수', reqs: ['REQ-GRP-001', 'REQ-PAY-002'], match: (file, d) => file === 'be/tests/api/meetup-deadline.test.js' && d === 'isDeadlineBeforeFirstSession' },
  { stage: 'unit', id: 'U-05', title: 'BE 이름 마스킹', purpose: '공개 후기에 표시할 이름을 가리는 순수 함수', reqs: ['REQ-REV-001'], match: (file, d) => file === 'be/tests/api/review-public.test.js' && d === 'maskName' },
  { stage: 'unit', id: 'U-06', title: 'FE 공통 API 클라이언트', purpose: '토큰 첨부, 401 자동 로그아웃, 403 유지, 오류 메시지, 페이지 이어붙이기·무한 반복 방지, 요청 취소', reqs: ['NFR-SEC-001', 'NFR-PER-001'], match: f('fe/src/shared/api/client.test.ts') },
  { stage: 'unit', id: 'U-07', title: 'FE 모임 API 모듈', purpose: '이미지 업로드(Blob URL), 목록·상세 조회와 변환, 신청·수정, 4개 API의 401 처리', reqs: ['REQ-GRP-001', 'REQ-GRP-002', 'REQ-GRP-003', 'REQ-GRP-004', 'REQ-PAY-001'], match: f('fe/src/features/meetup/api/meetupApi.test.ts') },
  { stage: 'unit', id: 'U-08', title: 'FE 회원가입 입력 검증', purpose: '아이디·비밀번호·이메일·닉네임·성별·연령대·장르·독서량 규칙(경계값 포함)', reqs: ['REQ-MEM-002'], match: f('fe/src/features/auth/lib/signupValidation.test.ts') },
  { stage: 'unit', id: 'U-09', title: 'FE 모임 등록 입력 검증', purpose: '필수값, 인원 4~8명, 금액, 마감일, 4회차, 과거 날짜', reqs: ['REQ-GRP-001'], match: f('fe/src/features/meetup/lib/meetupValidation.test.ts') },
  { stage: 'unit', id: 'U-10', title: 'FE 로그북 작성 대상 회차 판정', purpose: 'KST 오늘 이후 첫 회차를 작성 대상으로 고르는 로직', reqs: ['REQ-SES-002'], match: f('fe/src/features/logbook/lib/targetSession.test.ts') },
  { stage: 'unit', id: 'U-11', title: 'FE 후기 표시 변환', purpose: '이름 마스킹, 표시용 후기 목록 변환', reqs: ['REQ-REV-001'], match: f('fe/src/features/review/lib/reviewDisplay.test.ts') },
  // ── 통합 ──
  { stage: 'integration', level: 'A', id: 'I-01', title: '인증·회원 API', purpose: '회원가입(규칙·중복), 아이디 확인, 로그인(토큰·비밀번호 비노출), 인증 미들웨어, 정보 수정, 탈퇴', reqs: ['REQ-MEM-001', 'REQ-MEM-002', 'NFR-SEC-001'], match: f('be/tests/api/auth.test.js') },
  { stage: 'integration', level: 'A', id: 'I-02', title: '마이페이지·신청자 조회 API', purpose: '내 정보, 캡틴/크루 모임 목록(페이징), 신청자 목록, 회차 조회 권한', reqs: ['REQ-MEM-003', 'REQ-GRP-005'], match: (file) => file === 'be/tests/api/member.test.js' || file === 'be/tests/unit/member-profile.test.js' },
  { stage: 'integration', level: 'A', id: 'I-03', title: '모임 API (등록·조회·수정·신청·이미지)', purpose: '개설 검증, 목록·상세 통계, 수정 권한, 신청과 정원 마감, 이미지 업로드(Blob 대체)', reqs: ['REQ-GRP-001', 'REQ-GRP-002', 'REQ-GRP-003', 'REQ-GRP-004', 'REQ-PAY-001', 'REQ-PAY-002'], match: f('be/tests/api/meetup.test.js') },
  { stage: 'integration', level: 'A', id: 'I-04', title: '모집 마감일·첫 회차 검증 API', purpose: '모임 등록·수정 시 마감일이 첫 회차보다 앞서는지 검증', reqs: ['REQ-GRP-001', 'REQ-GRP-004', 'REQ-PAY-002'], match: f('be/tests/api/meetup-deadline.test.js') },
  { stage: 'integration', level: 'A', id: 'I-05', title: '로그북 제출·승인 API', purpose: '제출·수정·삭제·복구, 접근 권한, 제출 현황, 모임장 숙제 확인 완료·취소', reqs: ['REQ-SES-002', 'REQ-SES-003', 'REQ-GRP-005'], match: f('be/tests/api/logbook.test.js') },
  { stage: 'integration', level: 'A', id: 'I-06', title: '제출한 로그북 모아보기 API', purpose: '여러 모임의 내 로그북을 모임 단위로 묶어 반환', reqs: ['REQ-SES-002'], match: f('be/tests/api/logbook-mine.test.js') },
  { stage: 'integration', level: 'A', id: 'I-07', title: '후기 API', purpose: '종료된 모임에서 크루만 작성, 별점·내용 검증, 중복·복구, 수정·삭제, 조회 권한', reqs: ['REQ-REV-001'], match: f('be/tests/api/review.test.js') },
  { stage: 'integration', level: 'A', id: 'I-08', title: '공개 후기 API', purpose: '로그인 없이 조회, 이름 마스킹, 목록 구성', reqs: ['REQ-REV-001'], match: f('be/tests/api/review-public.test.js') },
  { stage: 'integration', level: 'A', id: 'I-09', title: '배치·스케줄러 API', purpose: '배치 키 인증(없음·틀림·JWT 거부), 실행·실패 응답, 메일 발송 실패의 500 응답', reqs: ['REQ-BAT-001', 'REQ-PAY-002', 'REQ-SES-001', 'REQ-SES-004', 'NFR-SEC-001', 'NFR-REL-001'], match: f('be/tests/api/batch.test.js') },
  { stage: 'integration', level: 'B', id: 'I-10', title: '배치 SQL·메일·승인 흐름 (실제 PostgreSQL)', purpose: '모집 마감·시작·완료 SQL, 회차 완료(UTC 서버 재현), 제출→승인→Zoom 메일 전체 흐름, 과제 안내 메일 대상 선별', reqs: ['REQ-PAY-002', 'REQ-BAT-001', 'REQ-SES-001', 'REQ-SES-004', 'NFR-REL-001'], match: f('be/tests/integration/batch-sql.test.js') },
  { stage: 'integration', level: 'B', id: 'I-11', title: 'DB 스키마 점검 도구 (실제 PostgreSQL)', purpose: 'db:check가 모델과 스키마 차이를 보고하고 스키마를 고치지 않음', reqs: [], match: f('be/tests/integration/db-check.test.js') },
  { stage: 'integration', level: 'C', id: 'I-12', title: '로그인·인증 라우팅 화면', purpose: '로그인 성공·실패·중복 제출 방지, 비로그인 접근 차단, 401 자동 로그아웃', reqs: ['REQ-MEM-001', 'REQ-MEM-003'], match: (file) => file === 'fe/src/app/router/RequireAuth.test.tsx' || file === 'fe/src/features/auth/components/login/LoginView.test.tsx' },
  { stage: 'integration', level: 'C', id: 'I-13', title: '모임 목록 화면', purpose: '카드 표시, 상태 표기, 로딩·빈 상태·오류, 검색', reqs: ['REQ-GRP-002'], match: f('fe/src/features/meetup/components/list/MeetupListView.test.tsx') },
  { stage: 'integration', level: 'C', id: 'I-14', title: '모임 상세·참여 신청 화면', purpose: '상세 표시, 비로그인 신청 시 로그인 이동, 신청 성공·오류, 만료 처리, 캡틴 버튼 상태', reqs: ['REQ-GRP-003', 'REQ-PAY-001', 'REQ-MEM-001'], match: f('fe/src/features/meetup/components/detail/MeetupDetailView.test.tsx') },
  { stage: 'integration', level: 'C', id: 'I-15', title: '로그북 작성·모아보기 화면', purpose: '작성 탭(대상 회차·제출·수정·삭제)과 제출한 로그북 탭(모임 단위 묶음)', reqs: ['REQ-SES-002'], match: f('fe/src/features/logbook/components/mine/MyLogbooksView.test.tsx') },
  { stage: 'integration', level: 'C', id: 'I-16', title: '로그북 확인·승인 화면', purpose: '캡틴이 로그북을 읽고 숙제 확인 완료·취소, 실패 메시지, 중복 클릭 방지', reqs: ['REQ-SES-003', 'REQ-GRP-005'], match: f('fe/src/features/logbook/components/review/LogbookReviewView.test.tsx') },
  { stage: 'integration', level: 'C', id: 'I-17', title: '홈 항해일지(후기) 화면', purpose: '공개 후기 캐러셀 표시, 실데이터·기본 문구 전환, 자동 전환', reqs: ['REQ-REV-001'], match: f('fe/src/features/review/components/ReviewSection.test.tsx') },
  { stage: 'integration', level: 'C', id: 'I-18', title: '회원정보 화면', purpose: '텍스트 표시, 수정 폼 열기·저장, 비밀번호 변경, 탈퇴 모달', reqs: ['REQ-MEM-003'], match: f('fe/src/features/user/components/ProfileView.test.tsx') },
  // ── 시스템(E2E) ──
  { stage: 'system', id: 'S-01', title: '스모크 (favicon·로고·홈)', purpose: '프로덕션 빌드 FE가 뜨고 favicon·로고가 실제로 로딩되는지', reqs: [], match: f('fe/e2e/smoke.spec.ts') },
  { stage: 'system', id: 'S-02', title: '캡틴 시나리오', purpose: '가입·로그인 → 모임 개설 → 상세·수정 → 마이페이지 → 크루 로그북 승인 → 종료 후 후기 조회', reqs: [], match: f('fe/e2e/captain.spec.ts') },
  { stage: 'system', id: 'S-03', title: '크루 시나리오', purpose: '비로그인 신청 흐름, 가입 검증, 신청 오류, 로그북 작성·수정·삭제, 후기, 회원정보·탈퇴, 토큰 만료', reqs: [], match: f('fe/e2e/crew.spec.ts') },
  // ── 미구현 ──
  { stage: 'todo', id: 'N-01', title: '미구현·해석 필요 요구사항', purpose: '코드에 없는 요구사항과 정책 결정이 필요한 항목 (test.todo)', reqs: [], match: f('be/tests/api/requirements-gaps.test.js') },
];

const STAGE_META = {
  unit: { code: 'UT', name: '단위 테스트' },
  integration: { code: 'IT', name: '통합 테스트' },
  system: { code: 'ST', name: '시스템(E2E) 테스트' },
  todo: { code: 'TODO', name: '미구현 요구사항' },
};
const LEVELS = {
  A: { title: 'A. API 통합 (BE, DB만 대체)', desc: '실제 Express 앱에 HTTP 요청을 보내 라우트·인증·검증·서비스·에러 핸들러를 연결해 검증함. DB 접근만 가짜로 대체함.' },
  B: { title: 'B. DB 통합 (실제 PostgreSQL)', desc: '일회용 PostgreSQL에서 실제 쿼리를 실행함. Sequelize 쿼리와 원시 SQL이 DB에서 맞게 동작하는지 증명함.' },
  C: { title: 'C. 컴포넌트 통합 (FE, API만 대체)', desc: '화면 컴포넌트·라우터·인증 상태를 함께 렌더링하고 API 응답만 MSW로 대체해 사용자 동작을 검증함.' },
};
// 정의서 10장의 파일 단위 요구사항 매핑이 없는 케이스에 쓰는 보조 정보는 시나리오의 reqs를 사용함

// ───────────────────────── 결과 읽기 ─────────────────────────
const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve(p), 'utf8'));
const cases = [];

function addJest(data) {
  for (const r of data.testResults) {
    const file = rel(r.name);
    for (const a of r.assertionResults) {
      const status = a.status === 'passed' ? 'pass' : a.status === 'failed' ? 'fail' : a.status === 'todo' ? 'todo' : 'skip';
      cases.push({ file, path: a.ancestorTitles, name: a.title, status, tool: 'Jest' });
    }
  }
}
function addVitest(data) {
  for (const r of data.testResults) {
    const file = rel(r.name);
    for (const a of r.assertionResults) {
      cases.push({ file, path: a.ancestorTitles, name: a.title, status: a.status === 'passed' ? 'pass' : a.status === 'failed' ? 'fail' : 'skip', tool: 'Vitest' });
    }
  }
}
function addPlaywright(data) {
  const walk = (suite, trail) => {
    for (const spec of suite.specs || []) {
      const test = spec.tests[0];
      const result = test.results[test.results.length - 1];
      const ok = test.status === 'expected';
      cases.push({
        file: `fe/e2e/${spec.file}`, path: trail, name: spec.title, status: ok ? 'pass' : result?.status === 'skipped' ? 'skip' : 'fail',
        tool: 'Playwright', line: spec.line, duration: result?.duration,
      });
    }
    for (const s of suite.suites || []) walk(s, s.title && s.title !== suite.file ? [...trail, s.title] : trail);
  };
  for (const s of data.suites) walk(s, []);
}
addJest(readJson(args.be));
addVitest(readJson(args.fe));
addPlaywright(readJson(args.e2e));

// 시나리오 배정
for (const c of cases) {
  const top = c.path[0] || '';
  const sc = SCENARIOS.find((s) => s.match(c.file, top));
  if (!sc) throw new Error(`시나리오에 배정되지 않은 테스트: ${c.file} > ${c.name} (docs/tools/generate-test-docs.js의 SCENARIOS에 추가 필요)`);
  c.scenario = sc;
  const tags = [...new Set(`${c.path.join(' ')} ${c.name}`.match(/(REQ|NFR)-[A-Z]+-\d+/g) || [])];
  c.reqs = tags; // 케이스 이름에 표기된 요구사항만 (시나리오 단위 요구사항은 시나리오 표에서 보여줌)
}

// 케이스 ID: 단계별 시나리오 순서 → 정의 순서
const idCounters = {};
const ordered = [];
for (const sc of SCENARIOS) {
  const list = cases.filter((c) => c.scenario === sc);
  for (const c of list) {
    const code = STAGE_META[sc.stage].code;
    idCounters[code] = (idCounters[code] || 0) + 1;
    c.id = `${code}-${String(idCounters[code]).padStart(3, '0')}`;
    ordered.push(c);
  }
}

// ───────────────────────── E2E 상세(테스트 가이드 5.7) ─────────────────────────
const e2eSpecs = {}; // 명세 ID → { 사전, 절차, 기대, 요구사항 }
const E2E_TITLE_TO_ID = [
  [/^favicon 링크/, 'S1'], [/^로고 이미지/, 'S2'], [/^홈 화면이 렌더링/, 'S3'],
  [/^C1 회원가입/, 'C1-1'], [/^C1 잘못된/, 'C1-2'], [/^C2 /, 'C2'], [/^C3 /, 'C3'], [/^C4 모임 수정/, 'C4-1'], [/^C4 모임장이 아닌/, 'C4-2'],
  [/^C5 /, 'C5'], [/^C6 /, 'C6'], [/^C7 /, 'C7'],
  [/^K1 /, 'K1'], [/^K2 회원가입 입력/, 'K2-1'], [/^K2 회원가입 성공/, 'K2-2'], [/^K3 /, 'K3'], [/^K4 /, 'K4'],
  [/^K5 로그북 작성/, 'K5-1'], [/^K5 여러 모임/, 'K5-2'], [/^K5 다른 크루/, 'K5-3'], [/^K6 /, 'K6'],
  [/^K7 회원정보/, 'K7-1'], [/^K7 회원탈퇴/, 'K7-2'], [/^K8 /, 'K8'],
];
// 가이드의 'MEM-001, 002' · 'NFR-SEC-001' 표기를 정식 ID 목록으로 변환함
function parseSpecReqs(text) {
  const out = []; let prefix = '';
  for (const tok of String(text).split(',').map((t) => t.trim()).filter((t) => t && t !== '-')) {
    const full = tok.match(/^(NFR-)?([A-Z]+)-(\d+)$/);
    if (full) { prefix = full[2]; out.push(`${full[1] ? 'NFR' : 'REQ'}-${prefix}-${full[3]}`); }
    else if (/^\d+$/.test(tok) && prefix) out.push(`REQ-${prefix}-${tok}`);
  }
  return out;
}
(function loadE2eSpecs() {
  const guide = path.join(ROOT, 'docs/테스트 가이드.md');
  if (!fs.existsSync(guide)) return;
  const text = fs.readFileSync(guide, 'utf8');
  const start = text.indexOf('### 5.7');
  const end = text.indexOf('### 5.8');
  if (start < 0 || end < 0) return;
  const cell = (s) => s.trim();
  for (const line of text.slice(start, end).split('\n')) {
    if (!line.startsWith('|')) continue;
    const cols = line.slice(1, -1).split(' | ').map(cell);
    if (!/^[SCK]\d(-\d)?$/.test(cols[0])) continue;
    if (cols.length === 4) e2eSpecs[cols[0]] = { pre: '-', steps: cols[2], expect: cols[3], reqs: '-' }; // 스모크: ID|테스트|절차|기대
    else if (cols.length >= 6) e2eSpecs[cols[0]] = { pre: cols[2], steps: cols[3], expect: cols[4], reqs: cols[5] };
  }
})();
for (const c of ordered.filter((x) => x.scenario.stage === 'system')) {
  const hit = E2E_TITLE_TO_ID.find(([re]) => re.test(c.name));
  c.specId = hit ? hit[1] : null;
  c.spec = c.specId ? e2eSpecs[c.specId] : null;
  if (c.spec) c.reqs = parseSpecReqs(c.spec.reqs);
}

// ───────────────────────── 집계 ─────────────────────────
const sum = (list) => ({
  total: list.length,
  pass: list.filter((c) => c.status === 'pass').length,
  fail: list.filter((c) => c.status === 'fail').length,
  skip: list.filter((c) => c.status === 'skip').length,
  todo: list.filter((c) => c.status === 'todo').length,
});
const byStage = (stage) => ordered.filter((c) => c.scenario.stage === stage);
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const mark = (s) => ({ pass: '✅', fail: '❌', skip: '⏭', todo: '📝' }[s]);
const verdict = (t) => (t.fail ? '❌ 불합격' : t.skip ? '⏭ 일부 미수행' : '✅ 합격');
const now = new Date();
const kst = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'medium' }).format(now);
const meta = {
  when: `${kst} (KST)`,
  commit: sh('git rev-parse --short HEAD'),
  branch: sh('git branch --show-current'),
  node: process.version,
  pg: sh('pg_ctl --version').replace('pg_ctl (PostgreSQL) ', 'PostgreSQL '),
  os: `${sh('uname -s')} ${sh('uname -m')}`,
  dirty: sh('git status --porcelain -- be/src fe/src be/tests fe/e2e').split('\n').filter(Boolean).length,
};
const headerTable = (docName, extra = []) => [
  '| 항목 | 내용 |', '|---|---|',
  `| 문서 | ${docName} |`, '| 대상 | 쉐어 스토리 (BE: Node.js/Express, FE: React/Vite) |',
  `| 기준 | \`${meta.branch}\` 브랜치, 커밋 \`${meta.commit}\`${meta.dirty ? ` (+ 커밋되지 않은 변경 ${meta.dirty}개 파일)` : ''} |`,
  `| 수행 일시 | ${meta.when} |`, ...extra, '| 생성 방법 | 테스트 실행 결과에서 자동 생성 (`docs/tools/generate-test-docs.sh`) |',
].join('\n');

// 대표 케이스: 시나리오마다 결과 유형을 고르게 최대 N개
const CATEGORIES = [/401|인증|토큰/, /403|권한|거부|캡틴만|모임장이 아닌/, /404|없는|없으면/, /409|충돌|이미|마감|불가/, /400|검증|오류|실패|잘못|유효/, /성공|정상|발송|표시|반환|생성|승인/];
function representative(list, max = 5) {
  const picked = [];
  for (const re of CATEGORIES) {
    const hit = list.find((c) => re.test(c.name) && !picked.includes(c));
    if (hit) picked.push(hit);
    if (picked.length >= max) break;
  }
  for (const c of list) { if (picked.length >= max) break; if (!picked.includes(c)) picked.push(c); }
  return list.filter((c) => picked.includes(c)); // 정의 순서 유지
}
const describeBreakdown = (list) => {
  const map = new Map();
  for (const c of list) { const key = c.path.length ? c.path[0] : '개별 테스트 (describe 없음)'; map.set(key, (map.get(key) || 0) + 1); }
  return [...map.entries()];
};
const short = (r) => r.replace(/^REQ-/, '');
const reqLabel = (c) => (c.reqs.length ? c.reqs.map(short).join(', ') : '-');
const scenarioReqs = (sc, list) => {
  const set = new Set([...sc.reqs, ...list.flatMap((c) => c.reqs)]);
  return set.size ? [...set].sort().map(short).join(', ') : '-';
};

// ───────────────────────── 단계 문서 ─────────────────────────
function scenarioSummaryTable(stage) {
  const rows = ['| ID | 시나리오 | 검증 내용 | 케이스 | 합격 | 불합격 | 요구사항 |', '|---|---|---|---:|---:|---:|---|'];
  for (const sc of SCENARIOS.filter((s) => s.stage === stage)) {
    const list = ordered.filter((c) => c.scenario === sc);
    const t = sum(list);
    rows.push(`| ${sc.id} | ${esc(sc.title)} | ${esc(sc.purpose)} | ${t.total} | ${t.pass} | ${t.fail} | ${scenarioReqs(sc, list)} |`);
  }
  return rows.join('\n');
}
function composition(stage) {
  const out = [];
  for (const sc of SCENARIOS.filter((s) => s.stage === stage)) {
    const list = ordered.filter((c) => c.scenario === sc);
    out.push(`**${sc.id} ${sc.title}** — \`${[...new Set(list.map((c) => c.file))].join('`, `')}\``);
    for (const [k, n] of describeBreakdown(list)) out.push(`- ${k} (${n}건)`);
    out.push('');
  }
  return out.join('\n');
}
function representativeAppendix(stage) {
  const out = [];
  for (const sc of SCENARIOS.filter((s) => s.stage === stage)) {
    const list = ordered.filter((c) => c.scenario === sc);
    const rep = representative(list);
    out.push(`#### ${sc.id} ${sc.title} (대표 ${rep.length}건 / 전체 ${list.length}건)`, '', '| ID | 케이스 | 요구사항 | 결과 |', '|---|---|---|:-:|');
    for (const c of rep) out.push(`| ${c.id} | ${esc([...c.path.slice(0, 1), c.name].join(' › '))} | ${reqLabel(c)} | ${mark(c.status)} |`);
    out.push('');
  }
  return out.join('\n');
}
const resultSection = (stage) => {
  const list = byStage(stage);
  const t = sum(list);
  const fails = list.filter((c) => c.status === 'fail');
  return [
    '| 구분 | 건수 |', '|---|---:|', `| 전체 케이스 | ${t.total} |`, `| 합격 | ${t.pass} |`, `| 불합격 | ${t.fail} |`, `| 미수행(skip) | ${t.skip} |`,
    '', `**종합 판정: ${verdict(t)}**`, '',
    fails.length ? ['**불합격 케이스**', '', ...fails.map((c) => `- ${c.id} ${c.scenario.title} › ${c.name} (\`${c.file}\`)`)].join('\n') : '불합격 케이스 없음.',
  ].join('\n');
};

const FOOT = '\n---\n\n※ 케이스 ID는 문서를 생성할 때 순서대로 부여한 번호이며 테스트가 추가·삭제되면 바뀔 수 있음. 영구적으로 식별할 때는 `파일 + 케이스 이름`을 사용함.\n전체 케이스는 [전체 케이스 목록 (개인용)](./전체%20케이스%20목록_개인용.md)에서 확인함.\n';

function docUnit() {
  const list = byStage('unit');
  const be = list.filter((c) => c.file.startsWith('be/')); const fe = list.filter((c) => c.file.startsWith('fe/'));
  return `# 단위 테스트 명세 및 결과서

${headerTable('단위 테스트', ['| 도구 | Jest (BE), Vitest (FE) |', `| 환경 | ${meta.os}, Node.js ${meta.node} |`])}

## 1. 개요

### 1.1 목적
함수·서비스·모듈 **하나를 외부 의존 없이 격리해** 입력에 대한 결과(반환값, 호출, 예외)가 설계대로인지 검증함. 검증 규칙의 경계값, 권한·상태 분기, 날짜·시간대 계산처럼 빠르게 반복 확인해야 하는 로직을 대상으로 함.

### 1.2 이 프로젝트에서의 범위
| 구분 | 대상 | 외부 의존 처리 |
|---|---|---|
| BE | 인증 미들웨어, 서비스 로직(신청·로그북·후기), 메일·회차 완료 배치 서비스, 순수 함수(모집 마감일 판정, 이름 마스킹) | DB는 가짜 객체로, 메일 발송은 목(mock)으로 대체 |
| FE | 공통 API 클라이언트, 모임 API 모듈, 입력 검증, 회차 판정, 후기 표시 변환 | 네트워크는 MSW로 대체 |

### 1.3 범위에서 제외 (다른 단계에서 검증)
- 라우트·인증·서비스를 연결한 HTTP 동작 → [통합 테스트](./2.%20통합%20테스트.md)
- 실제 DB 쿼리·배치 SQL → [통합 테스트](./2.%20통합%20테스트.md) B
- 화면 렌더링·사용자 동작 → 통합 테스트 C, [시스템 테스트](./3.%20시스템%20E2E%20테스트.md)

## 2. 수행 결과

${resultSection('unit')}

| 영역 | 케이스 | 합격 |
|---|---:|---:|
| BE | ${be.length} | ${sum(be).pass} |
| FE | ${fe.length} | ${sum(fe).pass} |

## 3. 시나리오 요약

${scenarioSummaryTable('unit')}

### 시나리오 구성

${composition('unit')}
## 4. 판정 기준과 한계
- **합격 기준**: 모든 케이스가 통과하고 불합격·미수행이 0건.
- BE 서비스 테스트는 DB를 가짜로 대체하므로 **쿼리의 실제 동작은 증명하지 못함** → 통합 테스트 B가 보완함.
- FE API 모듈 테스트는 네트워크를 대체하므로 **실제 서버 응답 형식과의 일치는 증명하지 못함** → 통합·시스템 테스트가 보완함.
- 날짜 계산은 \`now\`를 고정하고 KST를 명시해 PC 시간대와 무관하게 같은 결과가 나오도록 함.

## 부록 A. 대표 케이스

시나리오마다 결과 유형(인증·권한·없음·충돌·검증·정상)을 고르게 골라 최대 5건씩 수록함.

${representativeAppendix('unit')}
## 부록 B. 재수행 방법

\`\`\`bash
cd be && npm test                      # BE 단위·통합(DB 제외)
cd fe && npm run test:run              # FE 단위·컴포넌트
\`\`\`
단위 테스트만 보려면 \`be/tests/unit\`, \`be/tests/api/mail-batch.test.js\`와 \`fe/src/**/lib\`, \`fe/src/shared\`, \`fe/src/features/meetup/api\` 파일을 실행함.
${FOOT}`;
}

function docIntegration() {
  const list = byStage('integration');
  const lv = (l) => list.filter((c) => c.scenario.level === l);
  const levelTable = ['| 구분 | 케이스 | 합격 | 불합격 |', '|---|---:|---:|---:|'];
  for (const l of ['A', 'B', 'C']) { const t = sum(lv(l)); levelTable.push(`| ${LEVELS[l].title} | ${t.total} | ${t.pass} | ${t.fail} |`); }
  const sections = ['A', 'B', 'C'].map((l) => {
    const scs = SCENARIOS.filter((s) => s.stage === 'integration' && s.level === l);
    const rows = ['| ID | 시나리오 | 검증 내용 | 케이스 | 합격 | 불합격 | 요구사항 |', '|---|---|---|---:|---:|---:|---|'];
    for (const sc of scs) {
      const cl = ordered.filter((c) => c.scenario === sc); const t = sum(cl);
      rows.push(`| ${sc.id} | ${esc(sc.title)} | ${esc(sc.purpose)} | ${t.total} | ${t.pass} | ${t.fail} | ${scenarioReqs(sc, cl)} |`);
    }
    return `### 3.${'ABC'.indexOf(l) + 1} ${LEVELS[l].title}\n\n${LEVELS[l].desc}\n\n${rows.join('\n')}`;
  }).join('\n\n');
  const appendix = ['A', 'B', 'C'].map((l) => {
    const scs = SCENARIOS.filter((s) => s.stage === 'integration' && s.level === l);
    const out = [`### 부록 A-${'ABC'.indexOf(l) + 1}. ${LEVELS[l].title}`, ''];
    for (const sc of scs) {
      const cl = ordered.filter((c) => c.scenario === sc); const rep = representative(cl);
      out.push(`#### ${sc.id} ${sc.title} (대표 ${rep.length}건 / 전체 ${cl.length}건)`, '', '| ID | 케이스 | 요구사항 | 결과 |', '|---|---|---|:-:|');
      for (const c of rep) out.push(`| ${c.id} | ${esc([...c.path.slice(0, 1), c.name].join(' › '))} | ${reqLabel(c)} | ${mark(c.status)} |`);
      out.push('');
    }
    return out.join('\n');
  }).join('\n');
  return `# 통합 테스트 시나리오 및 결과서

${headerTable('통합 테스트', ['| 도구 | Jest + Supertest (BE), Jest + 실제 PostgreSQL (DB 통합), Vitest + React Testing Library + MSW (FE) |', `| 환경 | ${meta.os}, Node.js ${meta.node}, ${meta.pg} (일회용) |`])}

## 1. 개요

### 1.1 목적
단위 테스트로 검증한 조각들을 **연결했을 때** 올바르게 동작하는지 검증함. 라우트 → 인증 → 검증 → 서비스 → DB, 화면 → 라우터 → API 호출처럼 계층·모듈 사이의 연결을 대상으로 함.

### 1.2 통합의 세 가지 수준
이 프로젝트의 통합 테스트는 무엇을 연결하고 무엇을 대체하는지에 따라 세 수준으로 나눔.

${['A', 'B', 'C'].map((l) => `- **${LEVELS[l].title}**: ${LEVELS[l].desc}`).join('\n')}

> 코드의 \`be/tests/integration\` 폴더는 위 B(실제 DB)만 가리킴. A는 \`be/tests/api\`, C는 \`fe/src/**/*.test.tsx\`에 있음.

### 1.3 범위에서 제외
- 실제 Azure 서비스(Blob 업로드, SMTP 발송, Functions 타이머) → 배포 후 확인 항목
- 브라우저에서의 전체 사용자 흐름 → [시스템 테스트](./3.%20시스템%20E2E%20테스트.md)

## 2. 수행 결과

${resultSection('integration')}

${levelTable.join('\n')}

## 3. 시나리오 요약

${sections}

### 시나리오 구성

${composition('integration')}
## 4. 판정 기준과 한계
- **합격 기준**: 모든 케이스가 통과하고 불합격·미수행이 0건.
- A·C는 DB·API를 대체하므로 **데이터 계층·실제 서버와의 정합성은 B와 시스템 테스트가 보완**함.
- B는 \`TEST_DATABASE_URL\`(로컬 일회용 DB)이 있을 때만 수행됨. 지정하지 않으면 건너뛰므로 **CI에서는 현재 수행되지 않음** (요구사항 정의서 REQ-OPS-003).
- 서버 시간대 의존 문제는 \`TZ=UTC\` 별도 프로세스로 재현해 검증함 (Azure App Service는 UTC).
- 이미지 업로드는 Blob 서비스를 대체해 **업로드 경로와 오류 응답**만 검증하고 실제 저장은 검증하지 않음.

## 부록 A. 대표 케이스

시나리오마다 결과 유형을 고르게 골라 최대 5건씩 수록함.

${appendix}
## 부록 B. 재수행 방법

\`\`\`bash
cd be && npm test                                                    # A (DB 없이)
cd be && TEST_DATABASE_URL=postgres://postgres@127.0.0.1:54329/postgres npm run test:db   # B (일회용 DB 필요)
cd fe && npm run test:run                                            # C
\`\`\`
일회용 PostgreSQL을 띄우는 방법은 [테스트 가이드](../테스트%20가이드.md) 3.4를 참고함.
${FOOT}`;
}

function e2eAppendix(withAll) {
  const out = [];
  for (const sc of SCENARIOS.filter((s) => s.stage === 'system')) {
    const cl = ordered.filter((c) => c.scenario === sc);
    out.push(`### ${sc.id} ${sc.title} (${cl.length}건)`, '');
    out.push('| ID | 케이스 | 사전 조건 | 수행 절차 | 기대 결과 | 요구사항 | 결과 |', '|---|---|---|---|---|---|:-:|');
    for (const c of cl) {
      const s = c.spec || { pre: '-', steps: '-', expect: '-', reqs: '-' };
      out.push(`| ${c.id}<br>(${c.specId || '-'}) | ${esc(c.name)} | ${esc(s.pre)} | ${esc(s.steps)} | ${esc(s.expect)} | ${esc(s.reqs !== '-' ? s.reqs : reqLabel(c))} | ${mark(c.status)} |`);
    }
    out.push('');
  }
  return out.join('\n');
}

function docSystem() {
  const list = byStage('system');
  const totalSec = (list.reduce((a, c) => a + (c.duration || 0), 0) / 1000).toFixed(0);
  return `# 시스템(E2E) 테스트 시나리오 및 결과서

${headerTable('시스템(E2E) 테스트', ['| 도구 | Playwright (Chromium) |', `| 환경 | ${meta.os}, Node.js ${meta.node}, ${meta.pg} (일회용), 실제 BE + 프로덕션 빌드 FE |`])}

## 1. 개요

### 1.1 목적
실제 브라우저로 화면을 조작해 **사용자 관점의 전체 흐름**이 끝까지 동작하는지 검증함. 프론트엔드, 백엔드, 데이터베이스를 모두 실제로 연결한 상태에서 캡틴(모임장)과 크루(신청자)의 시나리오를 수행함.

### 1.2 수행 환경
| 구성 | 내용 |
|---|---|
| 데이터베이스 | 실행마다 새로 만드는 일회용 PostgreSQL (UTC) |
| 백엔드 | 실제 \`src/server.js\`. Azure·SMTP 설정은 빈 값으로 막아 외부 자원에 접근하지 않음 |
| 프론트엔드 | 배포와 같은 **프로덕션 빌드**를 \`vite preview\`로 서빙 |
| 브라우저 | Chromium (헤드리스), 한국어·Asia/Seoul |
| 실행 | \`cd fe && npm run test:e2e\` (서버 3개를 자동으로 띄우고 종료함) |

### 1.3 테스트 데이터 원칙
사전 조건(계정·모임·신청)은 BE API로 빠르게 만들고, **검증하려는 동작만 화면으로** 수행함. 종료된 모임처럼 API로 만들 수 없는 상태만 임시 DB에 직접 반영함. 각 테스트는 고유한 계정·모임을 새로 만들어 서로 영향을 주지 않음.

## 2. 수행 결과

${resultSection('system')}

총 수행 시간은 약 ${totalSec}초임.

## 3. 시나리오 요약

${scenarioSummaryTable('system')}

| 시나리오 | 흐름 |
|---|---|
| 캡틴 (S-02) | C1 가입·로그인 → C2 모임 개설 → C3 상세 → C4 수정·권한 → C5 크루 목록 → C6 숙제 승인·취소 → C7 종료 후 후기 조회 (앞 단계 모임을 이어서 사용) |
| 크루 (S-03) | K1 비로그인 신청, K2 가입 검증, K3 신청 오류, K4 마이페이지, K5 로그북, K6 후기, K7 정보 수정·탈퇴, K8 토큰 만료 (각각 독립) |

## 4. 판정 기준과 한계
- **합격 기준**: 모든 케이스가 통과하고 불합격·미수행이 0건.
- **파일 업로드는 검증하지 못함**: 로컬에 Azure 자격 증명이 없어 모임 개설 시 이미지 URL 직접 입력으로 대체함.
- **메일 발송은 확인하지 못함**: SMTP 설정이 없음.
- 로컬 환경 한정임. 배포된 Azure(staging·Static Web Apps), 모바일 화면, Chromium 외 브라우저는 검증하지 않음.
- 앱 코드를 일부러 망가뜨려 테스트가 실패하는지 확인하는 변조 검증을 수행함 (비로그인 신청 이동, 승인 버튼 문구, 재제출 시 승인 해제).

## 부록 A. 케이스 명세

시스템 테스트는 케이스 수가 적어 전체를 수록함. 사전 조건·절차·기대 결과의 원본은 [테스트 가이드](../테스트%20가이드.md) 5.7임.

${e2eAppendix()}
## 부록 B. 재수행 방법

\`\`\`bash
cd fe
npm run test:e2e                          # 전체
npx playwright test e2e/crew.spec.ts      # 파일 하나
npx playwright test --ui                  # 골라서 실행·단계별 화면 확인
\`\`\`
실패 시 \`fe/e2e/.artifacts/\`에 스크린샷과 트레이스가 남음. 자세한 방법은 [테스트 가이드](../테스트%20가이드.md) 5.6을 참고함.
${FOOT}`;
}

// ───────────────────────── 전체 케이스 목록(개인용) ─────────────────────────
const slug = (s) => s.replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-').toLowerCase();
function docAll() {
  const toc = [];
  const body = [];
  for (const stage of ['unit', 'integration', 'system', 'todo']) {
    const list = byStage(stage);
    const t = sum(list);
    const h = `${STAGE_META[stage].name} (${t.total}건)`;
    toc.push(`- [${h}](#${slug(h)})`);
    body.push(`## ${h}`, '');
    if (stage === 'todo') body.push('코드에 구현이 없거나 정책 결정이 필요한 요구사항. 테스트가 아니라 **미구현 항목 목록**이며 구현되면 실제 테스트로 바꿈.', '');
    else body.push(`합격 ${t.pass} / 불합격 ${t.fail} / 미수행 ${t.skip}`, '');
    for (const sc of SCENARIOS.filter((s) => s.stage === stage)) {
      const cl = ordered.filter((c) => c.scenario === sc);
      const sh2 = `${sc.id} ${sc.title} (${cl.length}건)`;
      toc.push(`  - [${sh2}](#${slug(sh2)})`);
      body.push(`### ${sh2}`, '', `${sc.purpose}`, '');
      if (stage === 'system') {
        body.push('| ID | 케이스 | 사전 조건 | 수행 절차 | 기대 결과 | 요구사항 | 결과 |', '|---|---|---|---|---|---|:-:|');
        for (const c of cl) {
          const s = c.spec || { pre: '-', steps: '-', expect: '-', reqs: '-' };
          body.push(`| ${c.id} | ${esc(c.name)} | ${esc(s.pre)} | ${esc(s.steps)} | ${esc(s.expect)} | ${esc(s.reqs !== '-' ? s.reqs : reqLabel(c))} | ${mark(c.status)} |`);
        }
      } else {
        body.push('| ID | 구성 › 케이스 | 파일 | 요구사항 | 결과 |', '|---|---|---|---|:-:|');
        for (const c of cl) body.push(`| ${c.id} | ${esc([...c.path, c.name].join(' › '))} | \`${path.basename(c.file)}\` | ${reqLabel(c)} | ${mark(c.status)} |`);
      }
      body.push('');
    }
  }
  const all = sum(ordered.filter((c) => c.scenario.stage !== 'todo'));
  const reqTable = requirementMatrix();
  return `# 전체 케이스 목록 (개인용)

${headerTable('전체 케이스 목록 (개인 확인용)')}

단계별 문서는 시나리오 단위로 요약하고 케이스는 대표만 싣지만, 이 문서는 **모든 케이스를 빠짐없이** 수록함.

| 구분 | 케이스 |
|---|---:|
${['unit', 'integration', 'system', 'todo'].map((s) => `| ${STAGE_META[s].name} | ${byStage(s).length} |`).join('\n')}
| **합계** | **${ordered.length}** |

실행 케이스 ${all.total}건 중 합격 ${all.pass}, 불합격 ${all.fail}, 미수행 ${all.skip}. 범례: ✅ 합격 · ❌ 불합격 · ⏭ 미수행 · 📝 미구현(todo)

## 목차

${toc.join('\n')}
- [요구사항 추적표](#요구사항-추적표-요구사항--검증-시나리오)

${body.join('\n')}
## 요구사항 추적표 (요구사항 → 검증 시나리오)

${reqTable}
${FOOT.replace('\n전체 케이스는 [전체 케이스 목록 (개인용)](./전체%20케이스%20목록_개인용.md)에서 확인함.\n', '\n')}`;
}

// 정의서 요약표에서 요구사항 이름·구현 상태를 읽음
function loadRequirements() {
  const doc = path.join(ROOT, 'docs/요구사항 정의서.md');
  const list = new Map();
  if (!fs.existsSync(doc)) return list;
  for (const line of fs.readFileSync(doc, 'utf8').split('\n')) {
    const m = line.match(/^\|\s*((?:REQ|NFR)-[A-Z]+-\d+)\s*\|\s*([^|]+?)\s*\|\s*(✅|🔶|❌)/);
    if (m && !list.has(m[1])) list.set(m[1], { name: m[2], status: m[3] });
  }
  return list;
}
const UNCOVERED_NOTE = {
  'REQ-SES-005': '범위 밖 (Zoom 접속은 외부 서비스)',
  'NFR-USA-001': '도넛 차트 렌더링 테스트 없음',
};
function requirementMatrix() {
  const reqs = loadRequirements();
  const cover = new Map(); // 요구사항 → { unit: Set, integration: Set, system: Set }
  for (const c of ordered.filter((x) => x.scenario.stage !== 'todo')) {
    for (const r of new Set([...c.reqs, ...(c.scenario.stage === 'system' ? [] : c.scenario.reqs)])) {
      const e = cover.get(r) || { unit: new Set(), integration: new Set(), system: new Set() };
      e[c.scenario.stage].add(c.scenario.id);
      cover.set(r, e);
    }
  }
  const ids = new Set([...reqs.keys(), ...cover.keys()]);
  const cell = (set) => (set && set.size ? [...set].join(', ') : '—');
  const rows = ['| 요구사항 | 이름 | 구현 | 단위 | 통합 | 시스템 |', '|---|---|:-:|---|---|---|'];
  const gaps = [];
  for (const r of [...ids].sort()) {
    const e = cover.get(r);
    const info = reqs.get(r) || { name: '-', status: '-' };
    if (!e) gaps.push(r);
    rows.push(`| ${r} | ${esc(info.name)} | ${info.status} | ${cell(e?.unit)} | ${cell(e?.integration)} | ${cell(e?.system)} |`);
  }
  rows.push('', '> 각 칸은 해당 요구사항을 검증하는 **시나리오 ID**임 (케이스 이름의 요구사항 ID, 시나리오의 대표 요구사항, 시스템 테스트는 케이스별 명세 기준). 구현: ✅ 구현 · 🔶 부분 구현 · ❌ 미구현 (요구사항 정의서 기준). 🔶인 요구사항은 **구현된 범위**만 검증함.');
  if (gaps.length) rows.push('', `**검증 시나리오가 없는 요구사항**: ${gaps.map((g) => `${g}${UNCOVERED_NOTE[g] ? ` (${UNCOVERED_NOTE[g]})` : ''}`).join(', ')}`);
  return rows.join('\n');
}

// ───────────────────────── README ─────────────────────────
function docReadme() {
  const rows = ['| 단계 | 문서 | 케이스 | 합격 | 불합격 | 판정 |', '|---|---|---:|---:|---:|---|'];
  const link = { unit: '[1. 단위 테스트](./1.%20단위%20테스트.md)', integration: '[2. 통합 테스트](./2.%20통합%20테스트.md)', system: '[3. 시스템 E2E 테스트](./3.%20시스템%20E2E%20테스트.md)' };
  for (const s of ['unit', 'integration', 'system']) { const t = sum(byStage(s)); rows.push(`| ${STAGE_META[s].name} | ${link[s]} | ${t.total} | ${t.pass} | ${t.fail} | ${verdict(t)} |`); }
  const run = sum(ordered.filter((c) => c.scenario.stage !== 'todo'));
  rows.push(`| **합계** | | **${run.total}** | **${run.pass}** | **${run.fail}** | **${verdict(run)}** |`);
  return `# 테스트 문서

${headerTable('테스트 문서 목차')}

## 문서 구성

${rows.join('\n')}

| 문서 | 용도 |
|---|---|
| [전체 케이스 목록 (개인용)](./전체%20케이스%20목록_개인용.md) | 모든 케이스 ${ordered.length}건 전수 수록 (미구현 ${byStage('todo').length}건 포함) |
| [테스트 가이드](../테스트%20가이드.md) | 테스트를 **작성·실행하는 방법** (개발자용) |
| [요구사항 정의서](../요구사항%20정의서.md) | 요구사항과 구현 현황 |

## 세 단계의 구분

| 단계 | 검증하는 것 | 대체하는 것 | 속도 |
|---|---|---|---|
| 단위 | 함수·서비스·모듈 하나 | DB, 네트워크, 메일 | 매우 빠름 |
| 통합 | 계층·모듈을 연결한 동작 (API, 실제 DB, 화면) | A: DB / B: 없음(실제 DB) / C: API | 빠름 |
| 시스템(E2E) | 실제 브라우저의 사용자 시나리오 전체 | 없음 (외부 Azure·SMTP 제외) | 느림 (약 30초) |

## 요구사항 추적표 (요구사항 → 검증 시나리오)

${requirementMatrix()}

## 검증하지 못한 항목
- 실제 SMTP 메일 발송 (운영 설정 없음)
- 실제 Azure Blob 업로드 (모임 개설 E2E는 이미지 URL 입력으로 대체)
- Azure Functions 타이머의 실제 실행 시각
- 배포된 환경(staging, Static Web Apps), 모바일 화면, Chromium 외 브라우저

## 문서 다시 만들기

\`\`\`bash
bash docs/tools/generate-test-docs.sh
\`\`\`
임시 PostgreSQL을 띄워 세 도구를 실행하고, 결과를 이 폴더의 문서로 다시 생성함. 필요한 것은 [테스트 가이드](../테스트%20가이드.md) 2장의 사전 준비와 같음. 시나리오 설명을 바꾸려면 \`docs/tools/generate-test-docs.js\`의 \`SCENARIOS\`를 수정함.
`;
}

// ───────────────────────── 쓰기 ─────────────────────────
fs.mkdirSync(OUT, { recursive: true });
for (const old of fs.readdirSync(OUT)) if (old.endsWith('.md')) fs.rmSync(path.join(OUT, old)); // 이름이 바뀐 이전 문서가 남지 않게 정리
const files = {
  'README.md': docReadme(),
  '1. 단위 테스트.md': docUnit(),
  '2. 통합 테스트.md': docIntegration(),
  '3. 시스템 E2E 테스트.md': docSystem(),
  '전체 케이스 목록_개인용.md': docAll(),
};
for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), content.replace(/\n{3,}/g, '\n\n'));
const t = sum(ordered);
console.log(`생성 완료: ${rel(OUT)}  (케이스 ${t.total}: 합격 ${t.pass}, 불합격 ${t.fail}, 미수행 ${t.skip}, todo ${t.todo})`);
for (const s of ['unit', 'integration', 'system', 'todo']) console.log(`  ${STAGE_META[s].name}: ${byStage(s).length}`);
