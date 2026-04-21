# UI 재점검 보고서

> 분석 기준: 소스 코드 정적 분석 (2026-04-21)
> 대상: TitleScreen, CharacterSelectScreen, BattleScreen, DraftScreen, EventScreen, ResultScreen

---

## 1. TitleScreen (`src/App.tsx` 인라인)

### 문제점

| # | 문제 | 위치 |
|---|------|------|
| T-1 | 배경이 단색(`--color-bg`)뿐 — 분위기가 없음 | App.tsx |
| T-2 | 타이틀 텍스트 "Dark Roguelike"가 임시 문구처럼 보임 (게임 설정 반영 안 됨) | App.tsx |
| T-3 | 버튼 하나("시작하기")만 존재 — 설정, 크레딧 없음 | App.tsx |
| T-4 | 버전 뱃지 외 시각적 요소 전무 — 로고, 일러스트, 파티클 없음 | App.tsx |

### 개선 제안

- 배경에 `radial-gradient` 또는 SVG 노이즈 텍스처 추가
- 타이틀 폰트(`Cinzel Decorative`)로 게임 고유 이름 표시
- 타이틀 진입 시 페이드인 애니메이션

---

## 2. CharacterSelectScreen (`src/screens/CharacterSelectScreen.tsx`)

### 문제점

| # | 문제 | 세부 내용 |
|---|------|-----------|
| C-1 | 카드 너비 고정 `210px` | 넓은 화면에서 카드들이 좌측 정렬되어 공백 과다 |
| C-2 | 초상화/아이콘 영역 없음 | 캐릭터 시각적 식별 불가 — 텍스트만으로 구분 |
| C-3 | 능력치가 숫자 그대로 나열 | HP "420", 공격 "85" — 시각적 비교 불가 (바 없음) |
| C-4 | 선택 중인 카드 시각 피드백 없음 | 확인 전까지 선택 상태 표시 미흡 |
| C-5 | hover 상태를 `onMouseEnter/Leave` JS로 처리 | CSS `:hover`로 대체하면 성능 향상 + 코드 단순화 |
| C-6 | 로어 텍스트 `--text-xs` — 매우 작아 가독성 저하 | 최소 `--text-sm` 권장 |
| C-7 | 스킬 목록이 ID 그대로 노출될 가능성 | 데이터 연동 확인 필요 |

### 개선 제안

- `minWidth: 200px` + `flex-wrap` 으로 반응형 그리드
- 능력치 항목에 `<progress>` 또는 CSS 바 추가
- 선택 시 카드에 `--color-accent` 테두리 + 미세한 scale 애니메이션

---

## 3. BattleScreen (`src/screens/BattleScreen.tsx`)

가장 긴 화면(1311줄)이며 이슈도 가장 많다.

### 문제점

| # | 문제 | 코드 위치 |
|---|------|-----------|
| B-1 | SkillBar 컨테이너 `height: 140px`, 버튼은 `88px` — 52px 낭비 | SkillBar 컴포넌트 |
| B-2 | 스킬 이름 `maxWidth: '80px'` + ellipsis — 이름이 잘림 | SkillButton 내부 |
| B-3 | EnemyCard 고정 `140px` — 적이 많아지면 UI 압박 | EnemyCard |
| ~~B-4~~ ✅ | ~~적 HP 바 두께 `5px` — 시각적으로 너무 얇음~~ → `8px`로 수정 완료 | EnemyCard HP bar |
| B-5 | EnemyIntentBadge 폰트 `0.55rem` / `0.6rem` — 토큰 미사용 raw 값 | IntentBadge |
| B-6 | ResourceBar 레이블 `0.6rem` — 가독성 위험 | ResourceBar |
| B-7 | DamagePopup `bottom: '30%'` 절대 위치 — 카드 내용과 겹칠 수 있음 | DamagePopup |
| B-8 | 상태이상 툴팁 `position: 'fixed'` — 경계 근처에서 화면 밖으로 나감 | StatusTooltip |
| ~~B-9~~ ✅ | ~~BattleLog가 업데이트 시 상단으로 스크롤 — 최신 로그가 위(직관과 반대)~~ → 하단 자동 스크롤 수정 완료 | BattleLog |
| B-10 | SpeedControl 폰트 `0.6rem` — 토큰 미사용 | SpeedControl |
| B-11 | 15라운드(보스) 진입 시 시각적 알림 없음 | BattleScreen 전환부 |
| B-12 | 스킬 쿨다운 표시 방식 불명확 (숫자 오버레이만) | SkillButton |

### 개선 제안

- SkillBar 높이를 버튼 높이 + padding으로 계산 (고정값 제거)
- 스킬 이름 `maxWidth` → `minWidth: 0` + `flex-shrink` 로 유연하게
- HP 바 두께 `8px` 이상으로 증가
- `0.55rem` / `0.6rem` 사용처를 `--text-xxs` 토큰으로 일원화
- BattleLog는 하단 스크롤 (`scrollTop = scrollHeight`)로 변경
- 보스 진입 시 화면 전체 오버레이 연출 (1~2초 표시 후 자동 해제)

---

## 4. DraftScreen (`src/screens/DraftScreen.tsx`)

### 문제점

| # | 문제 | 세부 내용 |
|---|------|-----------|
| D-1 | 탭(스킬/동료/아이템) 활성 상태가 배경색 변화만 — 시각적 강조 약함 | Tab 컴포넌트 |
| D-2 | 리롤 잔여 횟수가 헤더 텍스트에만 표시 — 카드별 리롤 버튼과 연결이 부족 | DraftHeader |
| D-3 | HealSkipCard가 드래프트 카드 아래에 위치 — 존재를 모를 수 있음 | 레이아웃 |
| D-4 | 드래프트 카드 레이어 간 높이 불일치 가능성 (이전 패치로 일부 해결됨) | DraftCard |
| D-5 | 아이템/동료 카드에 시각적 등급 표시 없음 | DraftCard |

### 개선 제안

- 활성 탭에 `border-bottom: 2px solid var(--color-accent)` 추가
- 리롤 횟수를 각 카드 리롤 버튼 옆에 뱃지로 표시
- HealSkipCard를 상단 또는 사이드바로 이동해 항상 노출

---

## 5. EventScreen (`src/screens/EventScreen.tsx`)

### 문제점

| # | 문제 | 세부 내용 |
|---|------|-----------|
| E-1 | 선택지 카드 `flex: '1 1 260px'` — 3개일 때 불균등 배치 가능 | 선택지 레이아웃 |
| E-2 | `effectColor()` 함수가 하드코딩 OKLCH 리터럴 사용 | 토큰 미사용 |
| E-3 | 현재 라운드 진행 상황 표시 없음 | 헤더 영역 |
| E-4 | 이벤트 이미지/일러스트 없음 — 텍스트만으로 몰입도 저하 | 이벤트 카드 |
| E-5 | 선택지 효과 프리뷰가 작은 텍스트로만 표시 | 선택지 카드 |

### 개선 제안

- 선택지 컨테이너를 `display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))` 로 변경
- `effectColor()` → `--color-buff`, `--color-debuff` 토큰 사용
- 상단에 라운드 진행 바(현재/최대) 추가

---

## 6. ResultScreen (`src/screens/ResultScreen.tsx`)

### 문제점

| # | 문제 | 세부 내용 |
|---|------|-----------|
| R-1 | 통계 패널 `minWidth: '420px'` — 좁은 화면에서 overflow 위험 | 통계 섹션 |
| R-2 | 승리/패배 구분 애니메이션 없음 — 정적 텍스트 표시뿐 | 결과 헤더 |
| R-3 | 획득 아이템이 단순 텍스트 칩 — 희귀도 색상 코딩 없음 | 아이템 목록 |
| R-4 | 행동 버튼이 "처음으로" 하나뿐 — 재시도(같은 캐릭터) 버튼 없음 | 버튼 영역 |
| R-5 | `clearRating` 임계값 하드코딩 (`>= 12`, `>= 8` 등) | ResultScreen.tsx |
| R-6 | 승리 시 파티클이나 이펙트 없음 — 무게감 부족 | 전체 화면 |

### 개선 제안

- `minWidth` 제거, `width: min(420px, 100%)` 로 반응형 처리
- 승리 시 CSS 키프레임 `@keyframes` 이펙트(금빛 파티클 등) 추가
- 아이템 희귀도를 `--color-rare`, `--color-epic` 등 토큰으로 색상 구분
- "같은 캐릭터로 재시작" 버튼 추가

---

## 7. 공통/횡단 이슈

### ~~7-1. 토큰 미활용 — raw 폰트 사이즈~~ ✅ 완료

~~컴포넌트 전반에 `0.55rem`, `0.6rem`, `0.7rem` 등의 raw 값이 산발적으로 사용됨.~~
`tokens.css`에 `--text-xxs: clamp(0.6rem, 0.55rem + 0.2vw, 0.7rem)` 추가, 전체 raw 사용처를 토큰으로 일원화 완료.

### 7-2. Hover 상태를 JS로 처리

`onMouseEnter` / `onMouseLeave`로 인라인 스타일을 교체하는 패턴이 다수 존재.
CSS `:hover` 또는 Tailwind `hover:` 유틸리티로 전환하면 코드 간소화 + 성능 개선.

### 7-3. 접근성(Accessibility) 부재

- `<button>`에 `aria-label` 없음 (아이콘만 있는 버튼 포함)
- 색상만으로 상태 구분 (색맹 사용자 대응 미흡)
- 키보드 포커스 스타일 미정의

### 7-4. 반응형 대응 부족

- 다수 컴포넌트가 고정 px 사용 (`210px`, `140px`, `420px`)
- 모바일/태블릿 뷰포트 미고려

### 7-5. 인라인 스타일 vs CSS 클래스

전 화면이 인라인 스타일(`style={{ }}`) 중심. 토큰 변경이 전파되지 않고 CSS DevTools 디버깅도 어려움.
CSS 클래스 + 토큰 조합으로 점진적 전환 권장.

---

## 우선순위 정리

| 순위 | 항목 | 임팩트 | 난이도 |
|------|------|--------|--------|
| ~~🔴 High~~ ✅ | ~~B-9 BattleLog 스크롤 방향~~ | UX 혼란 | 낮음 |
| ~~🔴 High~~ ✅ | ~~B-4 HP 바 두께~~ | 가독성 | 낮음 |
| ~~🔴 High~~ ✅ | ~~7-1 `--text-xxs` 토큰 통일~~ | 일관성 | 낮음 |
| 🟡 Medium | B-11 보스 진입 연출 | 몰입도 | 중간 |
| 🟡 Medium | C-2 캐릭터 초상화 | 시각 식별 | 중간 |
| 🟡 Medium | R-2 결과 화면 애니메이션 | 감성 | 중간 |
| 🟡 Medium | D-3 HealSkipCard 위치 개선 | 발견성 | 낮음 |
| 🟢 Low | T-1 타이틀 배경 분위기 | 첫인상 | 낮음 |
| 🟢 Low | R-4 재시작 버튼 추가 | 편의성 | 낮음 |
| 🟢 Low | 7-3 접근성 aria 추가 | 포용성 | 중간 |
