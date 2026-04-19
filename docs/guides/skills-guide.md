# Claude Code 스킬 사용 가이드

이 문서는 web-game 프로젝트에서 사용할 수 있는 Claude Code 스킬 목록과
각 스킬의 사용 시점, 호출 방법을 설명한다.

---

## 스킬이란?

Claude Code 스킬은 반복적인 작업 패턴을 문서화한 가이드다.
Claude가 스킬을 불러오면 해당 스킬의 절차와 코드 예시를 따라 작업을 수행한다.

**호출 방법**: 대화 중 스킬 이름을 언급하거나, 아래 명령어로 명시적으로 호출한다.

```
/skill <스킬-이름>
```

---

## 스킬 목록

### 1. `plan-file-driven-dev`

**목적**: 새 기능을 구현하기 전에 `docs/plan-*.md` 계획 파일을 먼저 작성하고,
완료 후 상태를 업데이트하는 워크플로우를 안내한다.

**이럴 때 사용**:
- 새 기능 구현을 시작하기 전
- 큰 변경 사항을 단계별로 나눌 때
- 진행 상황을 추적하고 싶을 때

**계획 파일 구조**:
```markdown
# 플랜: {기능명}
상태: 🔄 진행 중

## 목표
## 구현 단계
- [ ] Step 1
- [ ] Step 2
```

**완료 후**: `상태: ✅ 완료`로 변경, 모든 단계를 `[x]`로 처리

---

### 2. `game-balance-tuner`

**목적**: 라운드 수, 적 스케일링 배율, 엘리트 라운드 배치, 보스 등장 시점 등
게임 밸런스 수치를 조정하는 방법을 안내한다.

**이럴 때 사용**:
- 라운드 수를 늘리거나 줄일 때
- 적의 HP/공격력 스케일링 비율을 바꿀 때
- 엘리트 라운드 위치를 변경할 때
- 보스 등장 조건을 수정할 때

**핵심 수정 파일**: `src/game/run.ts`

**관련 상수**:
```typescript
const TOTAL_ROUNDS = 15
const SCALE_PER_ROUND = 0.05   // 5%씩 증가
const ELITE_ROUNDS = [5, 10]   // 엘리트 등장 라운드
const BOSS_ROUND = 15          // 보스 라운드
```

---

### 3. `roguelike-content-adder`

**목적**: 새 스킬, 아이템, 적, 동료를 데이터 파일에 추가하는 절차와
타입 정의, 필수 필드, 밸런스 가이드라인을 제공한다.

**이럴 때 사용**:
- 새 스킬을 `skills.ts`에 추가할 때
- 새 아이템을 `items.ts`에 추가할 때
- 새 적을 `enemies.ts`에 추가할 때
- 새 동료를 `allies.ts`에 추가할 때

**데이터 파일 위치**:
```
src/game/data/
├── skills.ts    ← 스킬 정의
├── items.ts     ← 아이템 정의
├── enemies.ts   ← 적 정의
└── allies.ts    ← 동료 정의
```

**주의**: 콘텐츠 추가 후 반드시 `game-improvement-tracker` 스킬로
GAME_IMPROVEMENT_PLAN.md의 카운트를 업데이트할 것.

---

### 4. `battle-tooltip-pattern`

**목적**: `BattleScreen.tsx`에서 스킬 버튼 hover 시 나타나는 커스텀 툴팁을
구현하는 패턴을 안내한다. 브라우저 기본 `title` attribute 대신
스타일된 패널을 표시하는 방법을 다룬다.

**이럴 때 사용**:
- 전투 화면의 스킬 버튼에 새 정보를 툴팁으로 추가할 때
- 툴팁 내용(예상 데미지, 쿨다운 등)을 수정할 때
- 다른 UI 요소에 hover 툴팁을 추가할 때

**핵심 패턴**:
```typescript
// SkillBar에 state 추가
const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null)

// 버튼에 이벤트 추가
onMouseEnter={() => setHoveredSkillId(skill.id)}
onMouseLeave={() => setHoveredSkillId(null)}

// 툴팁 컴포넌트 (position: absolute, bottom: 100%)
{hoveredSkillId && <SkillTooltip skill={...} character={...} enemy={...} />}
```

---

### 5. `draft-card-enrichment`

**목적**: `DraftScreen.tsx`의 드래프트 카드(SkillCard / ItemCard / AllyCard)에
새로운 정보 배지나 표시를 추가하는 방법을 안내한다.

**이럴 때 사용**:
- 드래프트 카드에 새 배지나 라벨을 추가할 때
- "보유중" 같은 소유 상태를 표시할 때
- 동료 카드에 행동 정보를 추가할 때
- 원소 시너지 배지를 추가할 때

**핵심 패턴**:
```typescript
// CardWrapper (position: relative) 내부에서
// position: absolute 로 배지 배치
const OWNED_BADGE: React.CSSProperties = {
  position: 'absolute',
  top: 'var(--space-2)',
  right: 'var(--space-2)',
  pointerEvents: 'none',
  // ...
}
```

**데이터 흐름**: `DraftScreen` → `DraftCard` → `SkillCard/AllyCard/ItemCard`

---

### 6. `game-improvement-tracker`

**목적**: 기능 구현 완료 후 `GAME_IMPROVEMENT_PLAN.md`를 정확하게 업데이트하는
절차를 안내한다. 카운트 테이블 갱신, 항목 이동, 서식 정리를 다룬다.

**이럴 때 사용**:
- 새 스킬/아이템/적/동료를 추가한 후
- 새 게임 기능을 완료한 후
- `🔄 진행 예정` 항목을 `✅ 완료` 항목으로 옮길 때

**3단계 절차**:
1. 현재 구현 상태 테이블의 카운트 업데이트
2. 완료된 항목을 `🔄` 섹션에서 `✅` 섹션으로 이동
3. 완료 항목 서식: `- [x] **기능명** — 한 줄 설명`

---

## 전형적인 작업 흐름

### 새 콘텐츠 추가 시

```
1. plan-file-driven-dev    → docs/plan-{기능명}.md 작성
2. roguelike-content-adder → 데이터 파일에 콘텐츠 추가
3. game-improvement-tracker → GAME_IMPROVEMENT_PLAN.md 업데이트
4. plan-file-driven-dev    → 계획 파일 상태 ✅ 완료로 변경
```

### 밸런스 조정 시

```
1. plan-file-driven-dev    → 변경 의도 문서화
2. game-balance-tuner      → run.ts 수치 조정
3. game-improvement-tracker → 완료 항목 기록
```

### UI 개선 시

```
1. plan-file-driven-dev    → 변경 범위 문서화
2. battle-tooltip-pattern  → 전투 화면 툴팁 추가
   또는
   draft-card-enrichment   → 드래프트 카드 배지 추가
3. game-improvement-tracker → 완료 항목 기록
```

---

## 스킬 파일 위치

```
~/.claude/skills/
├── game-balance-tuner/SKILL.md
├── roguelike-content-adder/SKILL.md
├── plan-file-driven-dev/SKILL.md
├── battle-tooltip-pattern/SKILL.md
├── draft-card-enrichment/SKILL.md
└── game-improvement-tracker/SKILL.md
```
