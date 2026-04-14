# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run test:coverage # Vitest with coverage report (80% threshold on src/game/**)
npm run test:e2e     # Playwright E2E tests
npm run preview      # Preview production build
```

단일 테스트 파일 실행:
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

- **`types.ts`** — 전체 도메인 타입 정의. `RunState`, `BattleState`, `BattleAction`, `SkillEffect`, `AllyAction`, `ItemEffect` 등 모든 타입의 단일 진실 공급원
- **`combat.ts`** — `battleReducer(state, action) → state` 패턴의 순수 함수. 스킬 사용, 적 턴, 상태이상 틱 처리. `calcDamage`, `rollCombat`, `getItemElementMultiplier`, `getStatusBonus` export
- **`run.ts`** — 런 생명주기 순수 함수: `createRun`, `startBattle`, `completeBattle`, `applyDraftChoice`, `handleDefeat`
- **`rng.ts`** — 시드 기반 결정론적 RNG (`RngState` 불변 값 타입). `roll`, `pickN`, `pickNWeighted`, `shuffle`
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
- `battleSpeed: 1 | 1.5 | 2` — 전투 애니메이션 속도 배율 (`setBattleSpeed`로 변경)
- 전투 액션은 모두 `dispatchBattle(action: BattleAction)`으로 처리
- 조건부 렌더링 분기 내에서는 `useRunStore.getState()`로 콜백 추출 (React Hook Rules 준수)

### 화면 라우팅 (`src/App.tsx`)

`run.phase`로 화면을 전환한다. `run === null`일 때 `showCharSelect` 로컬 상태로 타이틀 ↔ 캐릭터 선택 전환.

### 전투 시스템 핵심 규칙

- **라운드 스케일링**: 적 HP/공격력은 `1 + (round - 1) * 0.1` 배율로 강화 (방어력은 고정)
- **라운드 7**: 항상 보스 (`dragon_lord`) 단독 등장. 보스는 `cc_immune` 상태로 스폰
- **적 행동 패턴**: `EnemyDef.actions` 배열을 순환 (`actionIndex`)
- **상태이상 `apply_status`**: `targetMode: 'random'`인 경우 플레이어를 타겟으로 삼을 수 있음 (의도된 설계)
- **드래프트**: 전투 승리 후 스킬/동료/아이템 중 3장 제시. 동료는 최대 4명
- **데미지 공식**: `rawAttack * elementMult * (100 / (100 + defense))`, 최소 1

### apply_status 타겟 규칙 (중요)

`DEBUFF_STATUSES = ['poison', 'burn', 'freeze', 'stun', 'defdown']`

`apply_status` 스킬 효과는 이 목록 기반으로 타겟을 결정한다:
- **디버프** (목록 내) → 선택된 적(`targetId`)에 적용
- **버프** (목록 외, 예: `mana_regen`, `powerup`, `revive`, `regen`) → 시전자 자신(`actorId`)에 적용

`BattleScreen`은 항상 적 ID를 `targetId`로 넘기므로, 버프/디버프 구분은 **`combat.ts`의 `DEBUFF_STATUSES`** 가 단독으로 처리한다.

### 보스 페이즈 시스템 (`BossPhases`)

`EnemyDef.bossPhases`가 정의된 적은 HP 비율에 따라 행동 패턴이 전환된다:
- `phase2HpThreshold` 이하 → 페이즈 2 (액션 배열을 `phase2Actions`로 교체, `actionIndex` 리셋)
- `phase3HpThreshold` 이하 → 페이즈 3 (최종 형태)

페이즈 전환은 `processEnemyTurn` 내부에서 각 적의 행동 직전에 체크된다. `BattleEnemy.bossCurrentPhase`가 현재 페이즈(1/2/3)를 추적한다.

### MP 관리 시스템

MP 회복 경로는 5가지다:

1. **자동 재생 (패시브)**: 매 플레이어 턴 시작 시 MP +3 (`PASSIVE_MP_REGEN_PER_TURN`). `PROCESS_ENEMY_TURN` 처리 후 `player_turn` 전환 시점에 `regenPartyMp` 호출
2. **턴 종료 보너스**: "턴 종료" 버튼 클릭 시 MP +8 (`END_TURN_MP_BONUS`). `END_PLAYER_TURN` 케이스에서 `regenPartyMp` 호출 후 `enemy_turn`으로 전환
3. **킬 보너스**: 적 처치 시 MP +5 (`damage` / `damage_all` 스킬 모두 적용)
4. **mana_regen 상태이상**: `arcane_focus` 스킬로 부여. `tickAllStatusEffects`에서 매 턴 `getStatusBonus`만큼 회복
5. **mp_regen 아이템**: `mana_crystal` 등. `tickAllStatusEffects`에서 매 턴 `item.effect.amount`만큼 회복

**`regenPartyMp(state, amount, logMessage)`**: 생존한 파티원 전체에 amount 회복. maxMp 초과 불가. 실제 회복이 발생한 경우에만 'system' 로그 추가

**아이템 연결 흐름**: `RunState.acquiredItemIds` → `startBattle`에서 `ItemDef[]`로 매핑 → `BattleState.items` → `battleReducer`가 `useSkill` / `processEnemyTurn` / `tickAllStatusEffects` 호출 시 전달

**0MP 기본 공격** (MP 고갈 시 항상 사용 가능):
- `fire_mage` → `basic_ember` (화염 원소)
- `holy_paladin` → `basic_glimmer` (신성 원소)
- `tide_dancer` → `basic_splash` (수계 원소)
- `dark_knight`, `berserker` → `slash` (물리, 원래부터 0MP)

### SkillEffect 종류

모든 variant는 `types.ts`의 `SkillEffect` discriminated union으로 정의된다.

| type | 설명 |
|------|------|
| `damage` | 단일 대상 피해 |
| `damage_all` | 전체 적 피해 |
| `damage_hp_scale` | 시전자 HP가 낮을수록 배율 증가 (`scaledMultiplier = base * (1 + missingHpRatio)`) |
| `heal` | attack 기반 HP 회복 |
| `heal_mp` | MP 회복 |
| `apply_status` | 상태이상 부여 (디버프→적, 버프→자신, 위 규칙 참조) |
| `apply_status_party` | 파티 전원에게 상태이상 부여 |
| `remove_status` | 상태이상 해제 |
| `shield` | 피해 흡수 (flat 또는 attack 배율) |
| `charge` | 다음 `damage`/`damage_all` 스킬에 배율 적립 |
| `summon_ally` | 동료 소환 |
| `spend_hp_gain_mp` | HP 일부 소모 → MP 획득 |
| `execute` | 대상 HP가 `threshold` 이하이면 즉사, 초과이면 공격력 80% 피해 |

### AllyAction 종류

`AllyAction`은 7가지 variant로 구성된다. **switch 문에서 모든 케이스를 처리하지 않으면 TypeScript 빌드가 실패**한다.

```
attack | heal_party | apply_status | apply_status_all
shield_party | buff_party | revive_party
```

`revive_party`: 첫 번째 사망한 파티원을 `healPercent * maxHp`로 부활. `processAllyActions`에서 `aliveParty.length === 0` 가드가 이 케이스를 막지 않도록 예외 처리되어 있음.

### startBattle 특수 처리

`death_prevention` 아이템 보유 시: `startBattle`이 파티 전원에게 `undying` 상태(HP 1 유지)를 부여한 뒤 전투를 시작한다. 아이템 효과가 런타임 상태에 직접 반영되는 유일한 케이스.

### 주요 함수 시그니처

```typescript
// combat.ts exports
export function calcDamage(params: DamageParams): number
export function rollCombat(rng, attackerSpeed, defenderDefense, extraCritChance?, missImmune?): CombatRollResult
export function getItemElementMultiplier(items: readonly ItemDef[], element: Element): number
export function getStatusBonus(effects: readonly StatusEffect[], kind: StatusEffectKind): number
export function battleReducer(state: BattleState, action: BattleAction): BattleState

// run.ts exports
export function createBattleCharacter(defId, skillIds, itemIds): BattleCharacter
export function createBattleAlly(allyDefId, index): BattleAlly
export function createBattleEnemy(enemyDefId, round, index): BattleEnemy
export function startBattle(run, rng): [BattleState, RngState]
export function completeBattle(run, battleState, rng): [RunState, RngState]
export function applyDraftChoice(run, optionIndex): RunState
export function handleDefeat(run, battleState): RunState

// rng.ts exports
export function roll(rng, chancePercent): [boolean, RngState]
export function pickN(rng, pool, n): [T[], RngState]
export function pickNWeighted(rng, items, weights, n): [T[], RngState]  // 가중치 드래프트에 사용
export function shuffle(rng, items): [T[], RngState]
```

### 테스트 구조 (`src/game/__tests__/`)

`combat.test.ts`에 헬퍼 팩토리 함수가 정의되어 있다:

```typescript
makeCharacter(overrides?)   // 기본: id='char-1', defId='dark_knight', skillIds=['slash','shadow_strike'], mp=100
makeEnemy(overrides?)       // 기본: id='enemy-1', defId='goblin'
makeAlly(overrides?)        // 기본: id='ally-1', action={type:'attack',element:'physical',multiplier:1.0}
makeBattleState(overrides?) // 기본: phase='player_turn', party=[makeCharacter()], enemies=[makeEnemy()]
```

### 스타일 시스템 (`src/styles/`)

- `tokens.css` — OKLCH 색상, 타이포그래피 (`clamp`), 간격, 반경 등 CSS 변수 정의
- `typography.css` — 기본 타이포그래피 리셋
- `global.css` — `@import` 집약, 기본 body 스타일

### 배포

GitHub Actions → GitHub Pages (`npm run build` → `dist/` 배포)
