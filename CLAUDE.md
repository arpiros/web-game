# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run test:coverage # Vitest with coverage report
npm run test:e2e     # Playwright E2E tests
npm run preview      # Preview production build
```

단일 테스트 실행:
```bash
npx vitest run src/game/__tests__/combat.test.ts
```

## Architecture

### Layered Design (엄격한 의존성 방향)

```
src/game/        ← 순수 TypeScript. React/Zustand 의존성 없음
src/state/       ← Zustand store. game/ 래핑
src/screens/     ← React UI. state/ 구독
src/styles/      ← CSS 디자인 토큰 (OKLCH 기반)
```

### Game Engine (`src/game/`)

게임 로직은 React와 완전히 분리된 순수 함수로 구성된다.

- **`types.ts`** — 전체 도메인 타입 정의. `RunState`, `BattleState`, `BattleAction`, `SkillEffect` 등 모든 타입의 단일 진실 공급원
- **`combat.ts`** — `battleReducer(state, action) → state` 패턴의 순수 함수. 스킬 사용, 적 턴, 상태이상 틱 처리
- **`run.ts`** — 런 생명주기 순수 함수: `createRun`, `startBattle`, `completeBattle`, `applyDraftChoice`, `handleDefeat`
- **`rng.ts`** — 시드 기반 결정론적 RNG (`RngState` 불변 값 타입)
- **`data/`** — 정적 데이터 정의 (skills, characters, allies, items, enemies)

### State Machine (런 흐름)

```
run === null
  → TitleScreen → CharacterSelectScreen
      └─ startRun() → run.phase = 'battle'

run.phase = 'battle'
  → BattleScreen
      ├─ onBattleVictory() → run.phase = 'draft'  (round < 7)
      ├─ onBattleVictory() → run.phase = 'result' (round === 7, isVictory: true)
      └─ onBattleDefeat()  → run.phase = 'result' (isVictory: false)

run.phase = 'draft'
  → DraftScreen
      └─ selectDraft() + advanceToNextBattle() → run.phase = 'battle'

run.phase = 'result'
  → ResultScreen
      └─ resetRun() → run = null
```

### Zustand Store (`src/state/runStore.ts`)

`useRunStore`가 전체 게임 상태의 단일 진실 공급원이다.

- `run: RunState | null` — null이면 타이틀 화면
- `rng: RngState` — 결정론적 재현을 위해 스토어에 보관
- 전투 액션은 모두 `dispatchBattle(action: BattleAction)`으로 처리
- 조건부 렌더링 분기 내에서는 `useRunStore.getState()`로 콜백 추출 (React Hook Rules 준수)

### 화면 라우팅 (`src/App.tsx`)

`run.phase`로 화면을 전환한다. `run === null`일 때 `showCharSelect` 로컬 상태로 타이틀 ↔ 캐릭터 선택 전환.

### 전투 시스템 핵심 규칙

- **라운드 스케일링**: 적 스탯은 `1 + (round - 1) * 0.1` 배율로 강화
- **라운드 7**: 항상 보스 (`dragon_lord`) 단독 등장
- **적 행동 패턴**: `EnemyDef.actions` 배열을 순환 (`actionIndex`)
- **상태이상 `apply_status`**: `targetMode: 'random'`인 경우 플레이어를 타겟으로 삼을 수 있음 (의도된 설계)
- **드래프트**: 전투 승리 후 스킬/동료/아이템 중 3장 제시. 동료는 최대 4명

### MP 관리 시스템

MP 회복 경로는 5가지다:

1. **자동 재생 (패시브)**: 매 플레이어 턴 시작 시 MP +3 (`PASSIVE_MP_REGEN_PER_TURN`). `PROCESS_ENEMY_TURN` 처리 후 `player_turn` 전환 시점에 `regenPartyMp` 호출
2. **턴 종료 보너스**: "턴 종료" 버튼 클릭 시 MP +8 (`END_TURN_MP_BONUS`). `END_PLAYER_TURN` 케이스에서 `regenPartyMp` 호출 후 `enemy_turn`으로 전환
3. **킬 보너스**: 적 처치 시 MP +5 (`damage` / `damage_all` 스킬 모두 적용)
4. **mana_regen 상태이상**: `arcane_focus` 스킬로 부여. `tickAllStatusEffects`에서 매 턴 `getStatusBonus`만큼 회복
5. **mp_regen 아이템**: `mana_crystal` 등. `tickAllStatusEffects`에서 매 턴 `item.effect.amount`만큼 회복

**`regenPartyMp(state, amount, logMessage)`**: 생존한 파티원 전체에 amount 회복. maxMp 초과 불가. 실제 회복이 발생한 경우에만 'system' 로그 추가 (MP가 이미 가득 찬 경우 조용히 no-op)

**아이템 연결 흐름**: `RunState.acquiredItemIds` → `startBattle`에서 `ItemDef[]`로 매핑 → `BattleState.items` → `battleReducer`가 `useSkill` / `processEnemyTurn` / `tickAllStatusEffects` 호출 시 전달

**0MP 기본 공격** (MP 고갈 시 항상 사용 가능):
- `fire_mage` → `basic_ember` (화염 원소 기본기)
- `holy_paladin` → `basic_glimmer` (신성 원소 기본기)
- `tide_dancer` → `basic_splash` (수계 원소 기본기)
- `dark_knight`, `berserker` → `slash` (물리 기본기, 원래부터 0MP)

### 주요 함수 시그니처

```typescript
createBattleCharacter(defId: string, skillIds: readonly string[], itemIds: readonly string[]): BattleCharacter
createBattleAlly(allyDefId: string, index: number): BattleAlly
createBattleEnemy(enemyDefId: string, round: number, index: number): BattleEnemy
battleReducer(state: BattleState, action: BattleAction): BattleState
```

### 스타일 시스템 (`src/styles/`)

- `tokens.css` — OKLCH 색상, 타이포그래피 (`clamp`), 간격, 반경 등 CSS 변수 정의
- `typography.css` — 기본 타이포그래피 리셋
- `global.css` — `@import` 집약, 기본 body 스타일

### 배포

GitHub Actions → GitHub Pages (`npm run build` → `dist/` 배포)
