# ShareStory 프로젝트 디렉터리 구조 가이드

| 항목             | 내용                                                            |
| ---------------- | --------------------------------------------------------------- |
| 문서 버전        | 1.0                                                             |
| 기준일           | 2026-09-21                                                      |
| 저장 위치        | `docs/project-structure.md`                                     |
| 기준 자료        | 팀에서 공유한 최신 `share-story` 디렉터리 트리                  |
| 적용 범위        | 백엔드·프론트엔드 파일 배치, 역할 구분, 공통 포맷 관리          |
| 코드 스타일 도구 | Prettier 우선 적용. ESLint·Husky·lint-staged의 추가 도입은 보류 |

> **현재 구조를 설명하는 문서다. 폴더를 다시 재설계하거나 기존 파일을 일괄 이동하는 지침이 아니다.**
> 파일·폴더의 배치는 제공된 트리를 기준으로 한다. 각 영역의 책임과 개발 규칙은 팀 적용을 위한 권장 기준이며, 실제 코드가 이미 해당 책임을 구현했다는 뜻은 아니다.
> 소스 내용, 의존성 버전, 실행 스크립트 전체, 빌드·테스트 결과는 이 문서 작성 과정에서 검증하지 않았다.

## 바로가기

[전체 트리](#2-전체-디렉터리-구조) · [루트 설정](#3-루트-및-공통-설정) · [백엔드](#4-백엔드-구조와-책임) · [데이터베이스](#5-데이터베이스-관리-영역) · [프론트엔드](#6-프론트엔드-구조와-책임)

[파일 배치 기준](#7-새로운-파일의-위치를-정하는-기준) · [Prettier·Git](#8-prettier-및-git-관리) · [실행·검증](#9-실행-위치와-검증-순서) · [체크리스트](#10-공유-전-확인-및-남은-결정사항)

## 1. 구조의 기본 원칙

ShareStory는 하나의 저장소 안에서 `be/`와 `fe/`를 구분한다. 백엔드는 업무별 `modules/`를 중심으로, 프론트엔드는 `app/`, `pages/`, `features/`, `shared/`를 중심으로 코드를 배치한다.

| 구분                 | 이 문서의 기준                                            |
| -------------------- | --------------------------------------------------------- |
| 백엔드 업무 코드     | `be/src/modules/{업무}/`에 모은다.                        |
| 데이터베이스 모델    | `be/src/models/`에서 관리한다.                            |
| DB 변경 이력         | `be/database/migrations/`에서 관리한다.                   |
| 백엔드 테스트        | `be/tests/`에 둔다.                                       |
| 프론트엔드 화면      | `fe/src/pages/{페이지명}/{페이지명}.tsx`에 둔다.          |
| 프론트엔드 업무 코드 | `fe/src/features/{업무}/`에 모은다.                       |
| 프론트엔드 공통 코드 | `fe/src/shared/`에서 관리한다.                            |
| 코드 포맷            | 루트의 `.prettierrc`와 `.prettierignore`를 기준으로 한다. |

기술 기준은 앞서 정한 React·TypeScript·Vite, Node.js·Express·TypeScript·Sequelize·Multer, MySQL이다. 이 문서는 각 도구의 설치 버전이나 Azure 배포 설정을 확정하지 않는다.

**문서를 읽는 기준:** 전체 트리는 현재 배치이고, 아래의 역할 설명과 예시는 파일을 어디에 작성할지 판단하기 위한 기준이다. 세부 기능, API 경로, DB 컬럼과 상태 전이는 해당 설계 문서에서 별도로 정한다.

## 2. 전체 디렉터리 구조

아래 트리는 제공된 구조를 유지한 것이다. `docs/project-structure.md`만 이번에 추가할 문서로 표시했다. 들여쓰기용 HTML 표기와 줄 끝의 붙여넣기 기호는 정리했으며, 입력의 `Review\.ts`는 앞서 공유된 파일명과 같은 `Review.ts`로 표기했다.

```text
share-story/
├── .vscode/                                                     # VS Code 프로젝트 설정
│   └── settings.json
├── be/                                                          # 백엔드
│   ├── database/                                                # DB 변경·초기 데이터 관리
│   │   ├── config/                                              # 마이그레이션 실행 설정
│   │   ├── migrations/                                          # DB 스키마 변경 이력
│   │   ├── reference/                                           # 참고 SQL·설계 자료
│   │   └── seeders/                                             # 초기·개발·테스트 데이터
│   ├── files/                                                   # 파일 보관 영역 — 실제 용도 확인 필요
│   ├── scripts/                                                 # 백엔드 보조 스크립트
│   ├── src/
│   │   ├── common/
│   │   │   ├── errors/                                          # 공통 오류 정의
│   │   │   └── middleware/                                      # 인증·오류 처리·업로드 미들웨어
│   │   ├── config/                                              # 서버 실행 설정
│   │   ├── jobs/
│   │   │   └── handlers/                                        # 예약·자동 작업 처리
│   │   ├── models/                                              # Sequelize 모델
│   │   │   ├── Enrollment.ts
│   │   │   ├── Group.ts
│   │   │   ├── GroupSession.ts
│   │   │   ├── Logbook.ts
│   │   │   ├── Payment.ts
│   │   │   ├── Review.ts
│   │   │   ├── User.ts
│   │   │   └── index.ts                                         # 모델 초기화·연관관계 구성 진입점
│   │   ├── modules/                                             # 업무별 라우터·컨트롤러·서비스
│   │   │   ├── auth/
│   │   │   ├── enrollments/
│   │   │   ├── group-sessions/
│   │   │   ├── groups/
│   │   │   │   ├── group.controller.ts
│   │   │   │   ├── group.routes.ts
│   │   │   │   ├── group.service.ts
│   │   │   │   ├── group.types.ts
│   │   │   │   └── group.validation.ts
│   │   │   ├── logbooks/
│   │   │   ├── my-page/
│   │   │   ├── notifications/
│   │   │   ├── payments/
│   │   │   ├── reviews/
│   │   │   └── users/
│   │   ├── types/                                               # 백엔드 공통 타입
│   │   ├── workflows/                                           # 여러 업무를 연결하는 처리
│   │   ├── app.ts                                               # Express 앱 구성
│   │   └── server.ts                                            # 서버 실행·초기화
│   ├── tests/                                                   # 백엔드 테스트
│   ├── .env.example
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   ├── swagger.yaml                                             # API 명세 파일
│   └── tsconfig.json
├── docs/                                                        # 팀 공유 문서
│   └── project-structure.md                                     # 이 문서 — 이번에 추가
├── fe/                                                          # 프론트엔드
│   ├── public/                                                  # 공개 정적 파일
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── app/                                                 # 앱 전체 조립
│   │   │   ├── router/                                          # 화면 라우팅 설정
│   │   │   └── App.tsx
│   │   ├── features/                                            # 업무별 UI·API 호출·훅
│   │   │   ├── auth/
│   │   │   │   ├── api/
│   │   │   │   ├── components/
│   │   │   │   │   └── LoginForm.tsx
│   │   │   │   ├── hooks/
│   │   │   │   └── types/
│   │   │   ├── enrollments/
│   │   │   ├── group-sessions/
│   │   │   ├── groups/
│   │   │   │   ├── api/
│   │   │   │   │   └── groupApi.ts
│   │   │   │   ├── components/
│   │   │   │   │   └── GroupCard.tsx
│   │   │   │   ├── hooks/
│   │   │   │   └── types/
│   │   │   ├── logbooks/
│   │   │   ├── my-page/
│   │   │   ├── payments/
│   │   │   ├── reviews/
│   │   │   └── users/
│   │   ├── pages/                                               # 화면 단위 조립
│   │   │   ├── GroupDetailPage/
│   │   │   │   └── GroupDetailPage.tsx
│   │   │   ├── GroupListPage/
│   │   │   │   └── GroupListPage.tsx
│   │   │   ├── HomePage/
│   │   │   │   └── HomePage.tsx
│   │   │   ├── LoginPage/
│   │   │   │   └── LoginPage.tsx
│   │   │   └── MyPage/
│   │   │       └── MyPage.tsx
│   │   ├── shared/
│   │   │   ├── assets/                                          # 소스에서 사용하는 이미지·아이콘
│   │   │   │   ├── hero.png
│   │   │   │   ├── react.svg
│   │   │   │   └── vite.svg
│   │   │   ├── lib/                                             # 공통 함수·클라이언트 설정
│   │   │   ├── styles/                                          # 현재 공통 스타일 배치
│   │   │   │   ├── App.css
│   │   │   │   └── global.css
│   │   │   └── ui/                                              # 업무에 종속되지 않는 UI
│   │   │       ├── Button.tsx
│   │   │       └── Modal.tsx
│   │   └── main.tsx                                             # React 진입점
│   ├── .DS_Store                                                # 로컬 시스템 파일 — Git 제외 대상
│   ├── .env.example
│   ├── .gitignore
│   ├── eslint.config.js                                         # 기존 파일 유지 — 린트 도입은 보류
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── .gitignore
├── .prettierignore                                              # 포맷 제외 대상
├── .prettierrc                                                  # 팀 공통 포맷 설정
├── package-lock.json
└── package.json                                                 # 루트 공통 도구·명령
```

`App.css`, `groupApi.ts`, `GroupDetailPage` 등 기존 이름은 그대로 유지한다. `react.svg`, `vite.svg`도 사용 여부를 확인하지 않은 상태에서 삭제 대상으로 확정하지 않는다. 트리의 폴더나 파일이 존재한다는 사실만으로 해당 기능의 구현 완료 여부를 판단하지 않는다.

## 3. 루트 및 공통 설정

### 3.1 주요 디렉터리와 파일

| 경로                    | 역할과 관리 기준                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `be/`                   | API, 업무 처리, DB 접근 등 백엔드 영역이다.                                                       |
| `fe/`                   | 화면, 사용자 입력, 서버 API 호출 등 프론트엔드 영역이다.                                          |
| `docs/`                 | 팀 공유 문서를 보관한다. 구조가 바뀌면 이 문서도 함께 수정한다.                                   |
| `.vscode/settings.json` | VS Code의 프로젝트 설정 파일이다. 저장 시 포맷 동작은 실제 설정 내용과 확장 설치 상태를 확인한다. |
| `.prettierrc`           | 팀 공통 포맷 규칙의 기준 파일이다. 구체적인 옵션값은 실제 파일을 확인한다.                        |
| `.prettierignore`       | 생성물·업로드 파일 등 포맷에서 제외할 경로를 관리한다.                                            |
| `.gitignore`            | 저장소 공통의 Git 제외 규칙을 관리한다.                                                           |
| `package.json`          | 루트 공통 도구와 명령을 관리한다. 현재 안내된 포맷 명령도 여기에 있다.                            |
| `package-lock.json`     | 루트 패키지의 설치 의존성 정보를 기록하는 파일이다.                                               |

### 3.2 세 위치의 `package.json`과 잠금 파일

현재는 루트, `be/`, `fe/`에 각각 `package.json`과 `package-lock.json`이 있다. 이번 구조 정리에서는 이 파일들을 그대로 유지한다.

| 위치                          | 담당 범위                     |
| ----------------------------- | ----------------------------- |
| `share-story/package.json`    | 공통 도구·포맷 명령           |
| `share-story/be/package.json` | 백엔드 의존성과 실행 명령     |
| `share-story/fe/package.json` | 프론트엔드 의존성과 실행 명령 |

`package-lock.json`은 설치된 의존성 트리를 기록해 재현 가능한 설치를 돕는다. 잠금 파일의 Git 공유 여부와 Prettier 포맷 제외 여부는 서로 다른 문제다. **포맷 대상에서 제외한다는 이유로 Git에서도 제외하지 않는다.** [8]

또한 `be/`와 `fe/`가 같은 저장소에 있다고 해서 npm workspaces가 자동으로 설정되는 것은 아니다. workspaces는 `package.json`의 별도 설정을 사용하는 기능이다. 실제 설정을 확인하기 전에는 루트에서 한 번 설치하면 FE·BE 의존성까지 모두 설치된다고 가정하지 않는다. 잠금 파일 통합도 별도 변경으로 다룬다. [9]

## 4. 백엔드 구조와 책임

### 4.1 `app.ts`와 `server.ts`

| 파일               | 권장 책임                                                             | 피할 내용                                                    |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `be/src/app.ts`    | Express 앱 생성, 공통 미들웨어 등록, 업무 라우터 연결, 오류 처리 연결 | 개별 업무 로직과 서버 시작 처리를 한 파일에 몰아넣지 않는다. |
| `be/src/server.ts` | 환경 설정과 DB·모델 초기화 조립, 서버 시작, 시작 실패·종료 처리       | API별 요청 처리와 화면별 로직을 작성하지 않는다.             |

권장 분담은 **`app.ts`는 앱을 구성하고, `server.ts`는 앱을 실행하는 것**이다. 실제 실행 명령이 `server.ts` 또는 해당 빌드 결과를 가리키는지는 `be/package.json`에서 확인해야 한다.

Express의 API 경로는 `app.get`, `app.post`, 라우터 등록 등의 코드로 연결한다. `modules/groups/`라는 폴더를 만드는 것만으로 모임 API가 등록되는 것은 아니다. [1]

### 4.2 `config`, `common`, `types`

| 경로                     | 권장 책임                               | 배치 예시                                          |
| ------------------------ | --------------------------------------- | -------------------------------------------------- |
| `src/config/`            | 실행 시 환경변수, 서버·DB 연결 설정     | 환경변수 읽기·검증, CORS 설정, Sequelize 연결 설정 |
| `src/common/errors/`     | 여러 업무에서 사용하는 공통 오류 정의   | 공통 오류 클래스, 오류 응답에 사용할 공통 정보     |
| `src/common/middleware/` | 여러 API에서 사용하는 Express 미들웨어  | 인증 확인, 공통 오류 처리, 업로드 처리             |
| `src/types/`             | 여러 백엔드 영역에서 사용하는 공통 타입 | 공통 응답 타입, 요청 객체 확장 타입                |

위 예시는 해당 파일이 이미 존재한다는 뜻이 아니다. 특정 업무에서만 쓰는 검증 규칙이나 타입은 그 업무의 `modules/` 안에 둔다. 예를 들어 모임 입력 검증은 `group.validation.ts`, 모임 전용 타입은 `group.types.ts`가 담당한다.

Multer는 `multipart/form-data` 형식의 업로드 요청을 처리하는 미들웨어다. 공통 업로드 처리는 `common/middleware/`에 둘 수 있지만, 업로드가 필요한 라우트에만 연결하고 용량·파일 개수 등 제한을 설정한다. `be/files/`가 실제 저장 경로인지는 Multer 설정 내용을 확인해야 한다. [2]

### 4.3 `models`와 `modules`의 차이

| 구분           | `models/`                           | `modules/`                                 |
| -------------- | ----------------------------------- | ------------------------------------------ |
| 분류 기준      | 데이터 구조                         | 업무 기능                                  |
| 대표 파일      | `Group.ts`                          | `group.service.ts`                         |
| 담당 내용      | Sequelize 모델 정의와 연관관계 구성 | API 입력·출력, 업무 규칙, 조회·변경 처리   |
| 이 문서의 기준 | 테이블을 표현하는 모델을 둔다.      | 실제 사용자의 행동을 처리하는 코드를 둔다. |

Sequelize 모델은 데이터베이스 테이블을 표현하는 추상화다. 다만 `Group.ts`라는 파일명만으로 실제 테이블명, 컬럼, 외래키를 확정할 수는 없다. 해당 사항은 모델 정의와 DB 설계를 확인한다. [3]

현재 모델 파일은 `User.ts`, `Group.ts`, `GroupSession.ts`, `Enrollment.ts`, `Payment.ts`, `Logbook.ts`, `Review.ts`다. `models/index.ts`는 이 모델들의 초기화와 연관관계를 한곳에서 조립하는 진입점으로 사용하도록 권장한다.

**업무 규칙은 서비스에 두고, 데이터 구조는 모델에 둔다.** 예를 들어 모집 마감 여부나 신청 가능 여부를 판단하는 처리는 `modules/`의 업무 코드에 둔다. 모델은 HTTP 요청·응답 객체를 직접 다루지 않는 기준으로 작성한다.

### 4.4 업무 모듈의 내부 구성

현재 `groups/`에 있는 파일을 다른 업무 모듈의 작성 기준으로 사용한다.

| 파일                  | 권장 책임                                                 |
| --------------------- | --------------------------------------------------------- |
| `group.routes.ts`     | HTTP 메서드·경로와 미들웨어·컨트롤러를 연결한다.          |
| `group.controller.ts` | 검증된 요청값을 서비스에 전달하고 HTTP 응답을 구성한다.   |
| `group.service.ts`    | 업무 조건 확인, 데이터 조회·변경 등 모임 업무를 처리한다. |
| `group.validation.ts` | 요청 파라미터·본문·쿼리의 형식과 필수값을 검증한다.       |
| `group.types.ts`      | 모임 업무에서 사용하는 타입을 정의한다.                   |

`validation`은 입력의 형식을 검증하고, `service`는 DB 상태 등을 이용해 업무적으로 가능한 행동인지 판단하는 기준으로 구분한다. 검증 도구와 연결 방식은 실제 구현에서 정한다.

기본적인 요청 처리 흐름의 예시는 다음과 같다. 이 흐름은 권장 역할 분담이며 실제 코드 연결을 확인한 결과는 아니다.

```text
HTTP 요청
  → app.ts에 등록된 업무 라우터
  → 필요한 인증·입력 검증
  → controller
  → service
  → Sequelize model을 통한 DB 접근
  → controller의 HTTP 응답
```

다른 모듈에도 처음부터 다섯 파일을 모두 만들 필요는 없다. 실제 책임이 생기는 파일부터 작성하고, 한 파일에 역할이 과도하게 모이면 분리한다.

### 4.5 업무별 분담 기준

아래 내용은 현재 폴더 이름과 앞서 정한 서비스 영역에 따른 **권장 책임 구분**이다. 각 기능의 제공 여부나 구현 완료를 의미하지 않는다.

| 모듈              | 담당 영역                                | 구분할 경계                                                    |
| ----------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `auth/`           | 로그인·로그아웃 등 인증                  | 프로필 관리와 구분한다. 토큰·세션 방식은 별도 확정한다.        |
| `users/`          | 회원가입, 회원정보와 프로필 관리         | 인증 절차 자체는 `auth/`와 역할을 나눈다.                      |
| `groups/`         | 독서모임 자체의 정보와 관리              | 개별 회차는 `group-sessions/`에서 다룬다.                      |
| `group-sessions/` | 모임의 개별 회차·일정 정보               | 모임 전체 정보와 구분한다.                                     |
| `enrollments/`    | 신청·취소·참여 관계                      | 결제 상태와 신청·참여 상태를 혼동하지 않는다.                  |
| `payments/`       | 결제 내역과 결제·환불 업무               | 외부 결제사 통신과 내부 업무 규칙을 한 함수에 몰아넣지 않는다. |
| `logbooks/`       | 활동 기록·항해일지                       | 후기와 목적을 구분한다.                                        |
| `reviews/`        | 후기 작성·조회·관리                      | 활동 기록 자체는 `logbooks/`와 구분한다.                       |
| `my-page/`        | 사용자 관점의 여러 업무 데이터 조회·조합 | 회원정보 변경·결제 취소 등의 처리 로직을 중복 작성하지 않는다. |
| `notifications/`  | 알림 데이터와 읽음 처리 등               | 메일·실시간 전송 도입 여부는 별도 설계한다.                    |

특히 마이페이지에 표시되는 기능이라고 해서 모든 처리를 `my-page/`에 넣지는 않는다. 프로필 변경은 `users/`, 신청 취소는 `enrollments/`, 결제 처리는 `payments/`처럼 원래 업무의 책임을 유지한다.

### 4.6 `workflows`와 `jobs`

| 경로                 | 권장 책임                                     | 예시 — 실제 요구사항 확인 후 구현                    |
| -------------------- | --------------------------------------------- | ---------------------------------------------------- |
| `src/workflows/`     | 여러 모듈의 처리를 한 업무 흐름으로 조립한다. | 신청 상태 변경과 관련 기록·알림 생성을 조정하는 처리 |
| `src/jobs/handlers/` | 예약·자동 실행 작업의 처리 함수를 둔다.       | 모집 종료 확인, 만료 처리, 일정 알림                 |

단일 업무의 단순 조회·수정은 우선 해당 `service`에 둔다. 여러 모듈을 조율해야 할 때 `workflow`를 사용한다. 작업 실행 주기와 스케줄러 등록은 `jobs/`에서 관리하도록 권장하되, 스케줄러 도구나 실행 환경이 이미 설정되어 있다고 가정하지 않는다.

권장 호출 방향은 다음과 같다.

```text
controller → 해당 service → models
controller → workflow → 여러 service → models
job handler → service 또는 workflow
```

이 방향을 사용할 때 `service`가 자신을 조립하는 `workflow`를 다시 호출하지 않도록 한다. HTTP 응답은 컨트롤러가, 자동 작업의 실행 결과 처리는 작업 실행 측이 담당하도록 구분한다.

**트랜잭션 유의사항:** Sequelize 트랜잭션에 참여하는 DB 변경은 같은 트랜잭션 범위에서 처리해야 한다. 외부 결제 승인이나 메일 발송까지 DB 롤백만으로 취소된다고 설계하지 않는다. 외부 호출 실패·재시도·취소는 별도의 흐름으로 정한다. [5]

### 4.7 백엔드의 나머지 영역

| 경로               | 관리 기준                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `be/files/`        | 실제 사용 목적은 미확인이다. 로컬 업로드·임시 파일 보관에 사용한다면 생성 파일의 Git 제외와 정리 정책을 정한다. 코드 파일을 보관하는 곳과 구분한다. |
| `be/scripts/`      | 백엔드 전용 보조 작업을 둔다. 사용자가 API로 요청하는 업무 처리는 `src/modules/`에 둔다.                                                            |
| `be/tests/`        | 백엔드 테스트를 둔다. 테스트 도구·실행 명령·하위 분류는 테스트를 추가하면서 정한다.                                                                 |
| `be/swagger.yaml`  | 현재 API 명세 파일 위치를 유지한다. 라우트·요청·응답이 바뀌면 관련 명세도 함께 수정한다. Swagger 화면 제공 여부는 별도 코드 확인이 필요하다.        |
| `be/.env.example`  | 필요한 환경변수 이름과 비밀이 아닌 예시를 공유한다. 실제 비밀번호·키를 넣지 않는다.                                                                 |
| `be/tsconfig.json` | 백엔드 TypeScript 설정을 유지한다. 실제 컴파일 대상과 출력 위치는 파일 내용을 확인한다.                                                             |

현재 트리에는 외부 서비스 전용 `infrastructure/`가 없다. 이 문서에서는 새 폴더를 필수로 추가하지 않는다. 외부 연동 코드를 작성할 때 담당 업무와 공통 사용 범위를 확인한 후, 필요한 경우 별도 변경으로 위치를 정한다.

## 5. 데이터베이스 관리 영역

### 5.1 세 위치를 구분한다

| 위치             | 관리하는 것                                    |
| ---------------- | ---------------------------------------------- |
| `be/src/config/` | 실행 중인 서버의 환경·DB 연결 설정             |
| `be/src/models/` | 애플리케이션에서 사용하는 Sequelize 모델       |
| `be/database/`   | 스키마 변경 이력, 초기 데이터와 관련 실행 설정 |

`be/src/config/`와 `be/database/config/`는 각각 서버 실행과 DB 관리 도구 실행이라는 사용 맥락을 구분하는 위치다. 동일한 DB 접속 정보는 같은 환경변수 기준을 사용하도록 하며, 비밀번호를 두 설정에 하드코딩하지 않는다.

### 5.2 `database/` 내부 기준

| 경로          | 권장 책임                                                    |
| ------------- | ------------------------------------------------------------ |
| `config/`     | 마이그레이션·초기 데이터 실행 도구가 사용하는 환경·경로 설정 |
| `migrations/` | 테이블·컬럼·인덱스 등 스키마 변경 이력                       |
| `reference/`  | 참고 SQL, 과거 설계 자료. 자동 실행 대상과 구분              |
| `seeders/`    | 공통 코드나 개발·테스트 초기 데이터. 대상 환경을 구분해 관리 |

마이그레이션은 데이터베이스 변경을 이력으로 관리하는 수단이다. 폴더만 생성한다고 DB가 바뀌거나 변경 파일이 자동 실행되는 것은 아니다. 현재의 `be/database/migrations/`를 실행 도구가 찾도록 설정해야 한다. 실행 도구, JS·TS 실행 방식, 명령은 실제 패키지와 설정을 확인한 뒤 정한다. [4]

팀 기준으로 이미 공유·적용된 마이그레이션은 임의로 덮어쓰기보다 새로운 변경 파일을 추가한다. 모델의 필드 변경과 DB 변경 이력이 필요한지 함께 검토하고, 참고 SQL을 운영 DB에 임의로 실행하지 않는다.

## 6. 프론트엔드 구조와 책임

### 6.1 `main`, `app`, `pages`, `features`, `shared`

| 경로              | 권장 책임                                                                              |
| ----------------- | -------------------------------------------------------------------------------------- |
| `src/main.tsx`    | React 화면을 시작하고 최상위 앱·전역 스타일을 연결한다.                                |
| `src/app/App.tsx` | 앱 전체 구성을 조립한다. 개별 화면의 업무 로직을 몰아넣지 않는다.                      |
| `src/app/router/` | 화면 경로와 페이지 연결을 관리한다. 사용할 라우팅 라이브러리는 실제 의존성을 확인한다. |
| `src/pages/`      | 하나의 화면을 기능 컴포넌트·공통 UI로 조립한다.                                        |
| `src/features/`   | 업무별 컴포넌트, API 호출, 훅, 타입을 모은다.                                          |
| `src/shared/`     | 특정 업무에 종속되지 않는 UI·함수·스타일·리소스를 관리한다.                            |

팀의 기본 참조 방향은 다음과 같이 권장한다. `pages`가 `shared`를 직접 사용하는 것도 가능하다.

```text
main → app → pages → features → shared
                  └──────────→ shared
```

`shared`에서 업무별 `features`나 화면 `pages`를 참조하지 않는다. `features`에서도 자신을 사용하는 페이지를 가져오지 않는다. 여러 기능을 조립하는 코드는 우선 `pages` 또는 `app`에 둔다.

### 6.2 현재 페이지 구성

| 파일                                        | 화면 역할 기준  |
| ------------------------------------------- | --------------- |
| `pages/HomePage/HomePage.tsx`               | 메인 화면       |
| `pages/LoginPage/LoginPage.tsx`             | 로그인 화면     |
| `pages/GroupListPage/GroupListPage.tsx`     | 모임 목록 화면  |
| `pages/GroupDetailPage/GroupDetailPage.tsx` | 모임 상세 화면  |
| `pages/MyPage/MyPage.tsx`                   | 마이페이지 화면 |

페이지 폴더 이름과 대표 파일 이름을 동일하게 유지한다. 현재 공유된 페이지 이름은 이 기준에 맞으므로 다시 바꾸지 않는다.

**이 표는 URL 명세가 아니다.** `/login`, `/groups` 등의 주소나 파일 기반 자동 라우팅 사용 여부는 현재 트리만으로 알 수 없다. 실제 URL은 `app/router/` 등의 라우팅 코드와 화면·API 명세에서 별도로 확인한다.

### 6.3 업무별 `features`

| 하위 영역     | 권장 책임                                  | 현재 트리의 예                                                     |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| `api/`        | 해당 업무의 백엔드 API 호출                | `groups/api/groupApi.ts`                                           |
| `components/` | 해당 업무에 종속된 화면 요소               | `auth/components/LoginForm.tsx`, `groups/components/GroupCard.tsx` |
| `hooks/`      | 해당 업무의 상태·호출 흐름을 재사용하는 훅 | 현재 파일명은 표시되지 않음                                        |
| `types/`      | 해당 업무의 프론트엔드 타입                | 현재 파일명은 표시되지 않음                                        |

`GroupCard`가 홈과 모임 목록 양쪽에서 사용되더라도 모임 업무에 종속되어 있다면 `features/groups/`에 둔다. **여러 화면에서 사용한다는 이유만으로 무조건 `shared/`로 이동하지 않는다.**

FE와 BE의 업무 이름은 가능한 한 일치시키되 폴더 수를 억지로 맞추지 않는다. 현재 BE에는 `notifications/`가 있지만 FE에는 없다. 알림 UI가 필요할 때 프론트엔드 배치를 정하면 된다.

### 6.4 공통 코드와 스타일

| 경로                       | 기준                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `shared/ui/Button.tsx`     | 업무를 모르는 공통 버튼. 모임 신청 API 등을 직접 호출하는 역할은 기능 컴포넌트에 둔다.                            |
| `shared/ui/Modal.tsx`      | 업무를 모르는 공통 모달. 내용과 동작은 사용하는 기능에서 전달한다.                                                |
| `shared/lib/`              | 여러 기능이 사용하는 공통 함수·HTTP 클라이언트 설정 후보 영역. 특정 라이브러리가 설치되어 있다고 가정하지 않는다. |
| `shared/styles/global.css` | 전역 스타일을 관리하는 위치로 사용한다.                                                                           |
| `shared/styles/App.css`    | 현재 위치와 이름을 유지한다. 실제 내용에 따라 나중에 책임을 조정한다.                                             |
| `shared/assets/`           | 소스에서 참조하는 공통 이미지·아이콘을 둔다.                                                                      |

`App.css`를 다시 이동하거나 `app.css`로 이름을 바꾸는 것은 이번 문서 적용의 필수 작업이 아니다. `react.svg`와 `vite.svg`도 실제 `import`·CSS 참조를 확인한 뒤 정리한다.

### 6.5 `public`과 `shared/assets`의 차이

Vite의 기본 `public/`은 파일을 그대로 제공하고 빌드 결과에 복사하는 정적 파일 영역이다. 소스에서 가져오는 이미지 등은 `import`나 CSS `url()`을 통해 Vite의 자산 처리 대상이 된다. [6]

| 경로                    | 현재 파일                           | 사용 기준                        |
| ----------------------- | ----------------------------------- | -------------------------------- |
| `fe/public/`            | `favicon.svg`, `icons.svg`          | 파일명을 유지하는 공개 정적 파일 |
| `fe/src/shared/assets/` | `hero.png`, `react.svg`, `vite.svg` | 소스에서 참조하는 이미지·아이콘  |

기본 `publicDir`와 루트 경로 제공을 전제로 `public/favicon.svg`는 `/favicon.svg`로 참조한다. 다른 기본 경로로 배포하는 경우에는 실제 Vite `base` 설정에 맞춰 확인한다. [6]

아래는 **현재 배치를 기준으로 계산한 경로 예시**다. 기존 코드에 이미 같은 `import`가 있다는 뜻은 아니며, 사용하지 않는 파일의 `import`를 새로 추가할 필요도 없다.

| 사용하는 파일                               | 대상 파일                                      | 상대 경로 예시                               |
| ------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| `src/main.tsx`                              | `src/app/App.tsx`                              | `./app/App`                                  |
| `src/main.tsx`                              | `src/shared/styles/global.css`                 | `./shared/styles/global.css`                 |
| `src/app/App.tsx`                           | `src/shared/styles/App.css`                    | `../shared/styles/App.css`                   |
| `src/app/App.tsx`                           | `src/shared/assets/hero.png`                   | `../shared/assets/hero.png`                  |
| `src/pages/GroupListPage/GroupListPage.tsx` | `src/features/groups/components/GroupCard.tsx` | `../../features/groups/components/GroupCard` |
| `src/shared/styles/App.css`                 | `src/shared/assets/hero.png`                   | `url('../assets/hero.png')`                  |

별칭 경로인 `@/` 사용 여부는 확인되지 않았으므로, 이 문서는 별칭 설정을 전제로 하지 않는다. 경로 수정 시에는 파일명의 대소문자도 실제 이름과 일치시킨다.

### 6.6 프론트엔드 설정 파일

| 파일                    | 관리 기준                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `fe/index.html`         | 현재 프론트엔드 HTML 진입 파일을 유지한다. `main.tsx` 연결은 실제 내용을 확인한다.   |
| `fe/vite.config.ts`     | Vite 설정을 관리한다. 별칭·프록시·배포 기본 경로의 설정 여부는 미확인이다.           |
| `fe/tsconfig.json`      | 현재 TypeScript 설정 파일이다. 다른 설정과의 연결 방식은 실제 내용을 확인한다.       |
| `fe/tsconfig.app.json`  | 프론트엔드 앱 코드용 설정으로 관리한다. 실제 적용 대상은 파일 내용을 확인한다.       |
| `fe/tsconfig.node.json` | Vite 설정 등 도구 코드용 설정으로 관리한다. 실제 적용 대상은 파일 내용을 확인한다.   |
| `fe/eslint.config.js`   | 기존 파일을 유지한다. 이번에는 팀 공통 린트 규칙이나 커밋 훅을 새로 도입하지 않는다. |
| `fe/.env.example`       | 프론트엔드 환경변수 예시를 관리한다. 비밀정보는 포함하지 않는다.                     |

Vite가 클라이언트 코드에 노출하는 환경변수에는 비밀정보를 넣지 않는다. 특히 기본적으로 `VITE_` 접두사가 붙은 변수는 클라이언트에 노출될 수 있으므로 DB 비밀번호, 결제 비밀키 등을 넣지 않는다. [12]

## 7. 새로운 파일의 위치를 정하는 기준

### 7.1 파일 배치 빠른 참고

| 작성할 내용                      | 배치 위치                                         |
| -------------------------------- | ------------------------------------------------- |
| 모임 API의 경로 연결             | `be/src/modules/groups/group.routes.ts`           |
| 모임 요청·응답 처리              | `be/src/modules/groups/group.controller.ts`       |
| 모임 신청 가능 여부 등 업무 판단 | 담당 업무의 `be/src/modules/.../*.service.ts`     |
| 모임 데이터 구조 정의            | `be/src/models/Group.ts`                          |
| DB 스키마 변경                   | `be/database/migrations/`                         |
| 여러 업무가 연결된 처리          | `be/src/workflows/`                               |
| 예약 작업 처리                   | `be/src/jobs/handlers/`                           |
| 로그인 화면 전체 구성            | `fe/src/pages/LoginPage/LoginPage.tsx`            |
| 로그인 입력 폼                   | `fe/src/features/auth/components/LoginForm.tsx`   |
| 모임 API 호출                    | `fe/src/features/groups/api/groupApi.ts`          |
| 모임 카드                        | `fe/src/features/groups/components/GroupCard.tsx` |
| 업무 공통 버튼·모달              | `fe/src/shared/ui/`                               |
| 공통 이미지                      | `fe/src/shared/assets/`                           |
| 구조·협업 설명                   | `docs/`                                           |

### 7.2 파일명 기준

| 대상                | 기준                            | 현재 예시                     |
| ------------------- | ------------------------------- | ----------------------------- |
| 업무 폴더           | 소문자, 여러 단어는 하이픈 연결 | `group-sessions`, `my-page`   |
| Sequelize 모델 파일 | PascalCase                      | `GroupSession.ts`             |
| 백엔드 역할별 파일  | 업무명과 역할을 점으로 구분     | `group.controller.ts`         |
| React 컴포넌트      | PascalCase                      | `LoginForm.tsx`, `Button.tsx` |
| 페이지 폴더와 파일  | 동일한 PascalCase 이름          | `HomePage/HomePage.tsx`       |
| 프론트엔드 API 파일 | 현재 camelCase 기준 유지        | `groupApi.ts`                 |
| 기존 CSS            | 현재 이름을 유지                | `App.css`, `global.css`       |

명명 규칙을 맞추기 위해 이미 공유된 파일명을 반복적으로 바꾸지 않는다. 새로운 파일은 해당 영역의 기존 방식에 맞추고, 일괄 이름 변경이 필요하면 별도 변경으로 진행한다.

### 7.3 참조와 중복에 관한 기준

백엔드 서비스는 HTTP 요청·응답 처리를 컨트롤러에 맡기고, 업무 처리에 필요한 값만 전달받도록 권장한다. 프론트엔드는 백엔드의 Sequelize 모델이나 서버 설정 파일을 직접 가져오지 않고 API를 통해 데이터를 주고받는다.

타입과 UI도 책임을 기준으로 배치한다. 한 업무에서만 사용하는 타입은 그 업무 폴더에, 여러 업무에서 정말 공통인 타입은 공통 영역에 둔다. 비슷해 보이는 코드라도 업무 의미가 다르면 무리하게 하나의 공통 함수로 합치지 않는다.

빈 폴더를 유지하기 위한 파일이나 사용하지 않는 예시 파일을 계속 늘리기보다, 실제 구현에 필요한 파일부터 추가한다. 현재 폴더 구조가 상세하다는 이유만으로 모든 영역을 동시에 구현할 필요는 없다.

## 8. Prettier 및 Git 관리

### 8.1 이번 적용 범위

현재 팀의 도입 범위는 **Prettier를 통한 코드 포맷 통일**이다. ESLint·Husky·lint-staged는 이번에 추가하지 않는다. 기존 `fe/eslint.config.js`의 존재만으로 린트가 자동 실행되는지 판단할 수 없으며, 그 여부는 스크립트·에디터 설정·빌드 설정을 확인한다.

앞서 공유된 루트 `package.json`의 포맷 명령은 다음과 같다. 전체 파일을 이 내용으로 덮어쓰지 말고 기존 다른 항목을 유지한다.

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

실행 위치는 **`share-story/` 루트**다.

```bash
# 파일을 수정하지 않고 포맷 상태 확인
npm run format:check

# 지원 파일에 포맷 적용 — 파일 내용이 변경될 수 있음
npm run format
```

`--write`는 파일을 수정하고, `--check`는 포맷 상태를 검사한다. `.`을 대상으로 실행하면 하위 폴더의 지원 파일도 처리하므로 `.prettierignore`의 제외 범위를 확인한다. 포맷 검사는 앱 실행·타입 검사·API 동작 검증을 대신하지 않는다. [10]

### 8.2 제외할 파일을 확인한다

| 대상                                    | 관리 기준                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `node_modules/`, 빌드 결과, 테스트 결과 | Git·포맷 제외 규칙을 확인한다.                                                                           |
| 실제 `.env` 파일                        | 비밀정보가 Git에 포함되지 않도록 관리한다.                                                               |
| `.env.example`                          | 비밀이 아닌 예시를 담아 공유한다.                                                                        |
| `package-lock.json`                     | 의존성 잠금 파일은 유지한다. 포맷에서 제외할 수 있지만 Git 제외와 혼동하지 않는다.                       |
| `be/files/` 내부 생성 파일              | 실제 용도를 확인한 후 업로드·임시 생성물의 제외 정책을 정한다. 테스트용 원본까지 무조건 제외하지 않는다. |
| `.DS_Store`                             | 공유 소스가 아니므로 Git에서 제외한다.                                                                   |

Prettier를 루트에서 실행할 때 기본으로 읽는 제외 파일은 그 실행 위치의 `.gitignore`와 `.prettierignore`다. `be/`나 `fe/` 내부의 개별 `.gitignore`만 믿지 말고 필요한 하위 경로를 루트 `.prettierignore`에서도 확인한다. [10]

현재 실제 제외 파일의 내용은 확인하지 않았다. 아래는 루트 `.gitignore`에 필요한 규칙이 있는지 비교하는 **점검 예시**이며, 기존 파일 전체를 교체하는 내용이 아니다. [11]

```gitignore
# 로컬 시스템 파일
.DS_Store

# 의존성·일반적인 생성물
node_modules/
dist/
build/
coverage/

# 실제 환경변수 파일 제외, 예시 파일은 공유
**/.env
**/.env.*
!**/.env.example
```

### 8.3 현재 `fe/.DS_Store` 처리

최신 트리에 `fe/.DS_Store`가 있으므로 전체 트리에도 그대로 표시했다. 이 파일이 로컬에 존재하는 것과 Git에 추적되는 것은 별개다. `.gitignore`는 이미 추적 중인 파일의 추적을 자동 해제하지 않는다. [11]

아래 명령은 루트에서 현재 추적 여부를 확인하는 예시다.

```bash
git ls-files -- fe/.DS_Store
```

해당 파일이 출력된다면, 로컬 파일은 유지하면서 추적만 해제할 때 다음 명령을 사용할 수 있다. 이후 변경사항을 확인하고 커밋한다. [11]

```bash
git rm --cached --ignore-unmatch -- fe/.DS_Store
```

## 9. 실행 위치와 검증 순서

### 9.1 먼저 등록된 명령을 확인한다

`npm run`은 해당 패키지의 `scripts`에 등록된 명령을 실행하며, 명령 이름을 생략하면 사용할 수 있는 스크립트를 보여준다. [7]

아래 명령은 **`share-story/` 루트에서 실행하는 기준**이다.

```bash
# 루트 스크립트 확인
npm run

# 백엔드 스크립트 확인
npm --prefix be run

# 프론트엔드 스크립트 확인
npm --prefix fe run
```

루트의 포맷 명령과 FE·BE의 실행 명령을 혼동하지 않는다. 루트에서 `npm run dev`를 사용할 수 있는지는 루트 스크립트 등록 내용에 달려 있다.

### 9.2 프론트엔드 실행 예시

다음은 `fe/package.json`에 각각 `build`, `dev`가 등록되어 있을 때만 사용하는 예시다. 현재 파일 내용은 미확인이므로 먼저 스크립트 목록을 확인한다.

```bash
# 루트에서 FE 빌드 실행
npm --prefix fe run build

# 루트에서 FE 개발 서버 실행
npm --prefix fe run dev
```

Vite 자체의 TypeScript 변환은 타입 검사가 아니다. 타입 검증이 필요한 경우 `build`에 `tsc` 실행이 포함되어 있는지 또는 별도 타입 검사 명령이 있는지 확인한다. 이는 ESLint의 추가 도입과는 별개다. [13]

### 9.3 백엔드·DB 검증

백엔드는 `be/package.json`에 실제로 등록된 명령을 사용한다. `server.ts`가 실행되며 `app.ts`의 라우터가 연결되는지, 필요한 환경변수와 DB·모델 초기화가 준비되는지 확인한다.

DB 마이그레이션, 시드 데이터, 테스트 명령은 등록 내용을 보지 못했으므로 이 문서에서 임의의 명령을 확정하지 않는다. 특히 운영 데이터에 영향을 줄 수 있는 명령은 실행 대상 환경을 확인한 뒤 사용한다.

### 9.4 변경 확인과 커밋

```bash
# 모두 share-story/ 루트에서 실행
git status --short
git diff --stat
git diff
```

이번처럼 구조를 정리할 때는 기능 수정과 경로 이동을 가능한 한 분리한다. Prettier의 전체 포맷 변경도 기능 변경과 섞지 않는 것을 권장한다.

문서만 추가하는 경우의 예시는 다음과 같다. 다른 변경 파일은 이 명령으로 자동 추가하지 않는다.

```bash
git add docs/project-structure.md
git commit -m "docs: 프로젝트 디렉터리 구조 가이드 추가"
```

## 10. 공유 전 확인 및 남은 결정사항

### 10.1 공유 전 체크리스트

- [ ] 실제 파일 이름과 `import`·CSS 이미지 경로가 일치한다.
- [ ] FE에서 사용하는 페이지·컴포넌트가 실제로 구현되어 있고 필요한 export가 있다.
- [ ] BE 실행 명령, `server.ts`, `app.ts`, 업무 라우터 연결을 확인했다.
- [ ] 모델 초기화·연관관계와 마이그레이션 실행 경로를 확인했다.
- [ ] 등록된 FE·BE 빌드·검증 명령을 실행하고 결과를 확인했다.
- [ ] 루트 Prettier 검사와 Git 변경 목록을 확인했다.
- [ ] 비밀정보, `.DS_Store`, 업로드·임시 생성물이 커밋에 포함되지 않는다.

위 항목은 확인해야 할 목록이며, 이 문서에서 검증 완료한 결과가 아니다.

### 10.2 트리만으로 확정하지 않는 사항

| 항목                 | 별도로 확인할 내용                                     |
| -------------------- | ------------------------------------------------------ |
| 구현 완료 여부       | 현재 파일이 실제 구현인지 자리만 잡은 파일인지 확인    |
| 실행·빌드 방식       | FE·BE `package.json`, TypeScript 설정과 실제 실행 결과 |
| DB 연결·마이그레이션 | 연결 코드, 모델 초기화, 실행 도구와 경로 설정          |
| 인증·결제·알림 방식  | 사용할 방식·외부 서비스와 업무 규칙                    |
| `be/files/` 용도     | Multer 저장 위치, 임시 저장 여부와 파일 정리 정책      |
| URL·API 계약         | 화면 라우팅 코드, API 라우트와 `be/swagger.yaml` 내용  |
| 패키지 통합 여부     | 루트 workspaces 사용 여부와 설치·잠금 파일 운영 방식   |
| 배포 설정            | Azure 리소스, 환경변수, 정적 파일·API 제공 방식        |

현재 구조는 이 문서를 공유하기 위해 다시 변경할 필요가 없다. 추후 실제 구현에서 역할이 겹치거나 외부 연동을 분리할 필요가 생기면 그때 변경 범위와 이유를 문서에 기록한다.

## 11. 문서 유지보수와 참고 자료

### 11.1 문서 변경 원칙

폴더나 파일의 책임을 변경하면 코드 이동과 함께 이 문서를 수정한다. 트리에서 빠진 파일이 생겼다는 이유로 기존 구현을 삭제하지 않으며, 새 폴더를 추가할 때는 무엇을 보관하고 어떤 폴더와 구분되는지 설명한다.

| 버전 | 날짜       | 내용                                                                               |
| ---- | ---------- | ---------------------------------------------------------------------------------- |
| 1.0  | 2026-09-21 | 제공된 최신 구조를 기준으로 최초 작성. 파일 배치·역할·Prettier 범위·확인 항목 정리 |

### 11.2 작성 근거

프로젝트의 경로·파일명은 팀에서 공유한 최신 트리, 기술 및 도입 범위는 앞선 대화에서 정한 내용을 기준으로 했다. 외부 자료는 도구의 일반 동작 설명에만 사용했다. 폴더별 권장 책임과 팀 운영 기준은 이 문서의 제안이며, 공식 문서가 ShareStory의 폴더 구성을 강제한다는 의미가 아니다.

아래 참고 자료는 2026-09-21에 확인했다. Sequelize v6 등 버전이 표시된 문서는 개념 설명에 활용한 것이며, 프로젝트에 해당 버전이 설치되어 있음을 확인한 것은 아니다.

[1]: https://expressjs.com/en/guide/routing/ 'Express — Routing'
[2]: https://expressjs.com/en/resources/middleware/multer/ 'Express — Multer'
[3]: https://sequelize.org/docs/v6/core-concepts/model-basics/ 'Sequelize v6 — Model Basics'
[4]: https://sequelize.org/docs/v6/other-topics/migrations/ 'Sequelize v6 — Migrations'
[5]: https://sequelize.org/docs/v6/other-topics/transactions/ 'Sequelize v6 — Transactions'
[6]: https://vite.dev/guide/assets 'Vite — Static Asset Handling'
[7]: https://docs.npmjs.com/cli/v11/commands/npm-run/ 'npm — npm run'
[8]: https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/ 'npm — package-lock.json'
[9]: https://docs.npmjs.com/cli/v11/using-npm/workspaces/ 'npm — Workspaces'
[10]: https://prettier.io/docs/cli 'Prettier — CLI'
[11]: https://git-scm.com/docs/gitignore 'Git — gitignore'
[12]: https://vite.dev/guide/env-and-mode 'Vite — Env Variables and Modes'
[13]: https://vite.dev/guide/features 'Vite — Features / TypeScript'

| 번호 | 공식 자료                            |
| ---- | ------------------------------------ |
| 1    | [Express — Routing][1]               |
| 2    | [Multer — 업로드 미들웨어][2]        |
| 3    | [Sequelize — Model Basics][3]        |
| 4    | [Sequelize — Migrations][4]          |
| 5    | [Sequelize — Transactions][5]        |
| 6    | [Vite — Static Asset Handling][6]    |
| 7    | [npm — npm run][7]                   |
| 8    | [npm — package-lock.json][8]         |
| 9    | [npm — Workspaces][9]                |
| 10   | [Prettier — CLI][10]                 |
| 11   | [Git — gitignore][11]                |
| 12   | [Vite — Env Variables and Modes][12] |
| 13   | [Vite — Features / TypeScript][13]   |
