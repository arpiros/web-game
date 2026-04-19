# 밸런스 개선 구현 계획 — 15라운드 로그라이크

## 개요

5회 봇 자동 플레이 테스트에서 5명 전원이 15라운드 클리어에 실패(평균 도달 3.8라운드)했다.
본 계획은 근본 원인별로 5개 페이즈에 걸쳐 단계적으로 밸런스를 재조정하여,
**평균 도달 라운드 8+ / 클리어율 20%+** 달성을 목표로 한다.

## 테스트 결과 요약

| 캐릭터 | 도달 라운드 | 누적 피해 | 등급 | 결과 |
|--------|-----------|---------|------|------|
| 칠흑의 기사 | 5 | 6,615 | C | 패배 |
| 불꽃의 마법사 | 5 | 6,437 | C | 패배 |
| 빛의 성기사 | 2 | 1,672 | F | 패배 |
| 조류 무희 | 4 | 5,539 | D | 패배 |
| 광전사 | 3 | 3,551 | D | 패배 |

---

## Phase 1: cursed_knight 힐 너프 (HIGH, 최우선)

### 근본 원인

라운드 3 기준 scale=1.10 적용 시 attack 187, heal_self multiplier 0.5 → 회당 ~94 HP 회복.
3턴 사이클로 배치되어 900 HP 적이 실질적으로 2,700 HP 이상의 체력을 가지는 효과를 낸다.
조류 무희 Round 3 전투에서 50턴+ 소요의 직접 원인.

### 수정 사항

**파일**: `src/game/data/enemies.ts`

**수정 전**:
```typescript
{
  id: 'cursed_knight',
  baseStats: { maxHp: 900, attack: 170, defense: 80, speed: 65 },
  actions: [
    { type: 'attack', element: 'dark', multiplier: 1.4, targetMode: 'highest_attack' },
    { type: 'apply_status', status: 'defdown', duration: 2, value: 30, targetMode: 'random' },
    { type: 'heal_self', multiplier: 0.5 },
  ],
},
```

**수정 후**:
```typescript
{
  id: 'cursed_knight',
  baseStats: { maxHp: 850, attack: 160, defense: 75, speed: 65 },
  actions: [
    { type: 'attack', element: 'dark', multiplier: 1.3, targetMode: 'highest_attack' },
    { type: 'apply_status', status: 'defdown', duration: 2, value: 20, targetMode: 'random' },
    { type: 'attack', element: 'dark', multiplier: 1.1, targetMode: 'random' },
    { type: 'heal_self', multiplier: 0.28 },
  ],
},
```

### 수치 변화

| 항목 | 수정 전 | 수정 후 | 변화 |
|------|---------|---------|------|
| maxHp | 900 | 850 | -5.6% |
| attack | 170 | 160 | -5.9% |
| defense | 80 | 75 | -6.3% |
| 주공격 배율 | 1.4 | 1.3 | -7.1% |
| defdown 값 | 30% | 20% | -10%p |
| heal multiplier | 0.5 | 0.28 | -44% |
| 회당 회복량 (R3) | ~94 HP | ~49 HP | -47.8% |
| 힐 주기 | 3턴 중 1회 | 4턴 중 1회 | +33% 간격 |
| 실효 HP (R3) | ~2,700 | ~1,300 | -52% |

### 테스트 방법

1. 단위 테스트: `cursed_knight` 4턴 시뮬 → heal 발생 1회, 회복량 49±2 확인
2. E2E: Round 3 cursed_knight 포함 전투 평균 턴 수 15턴 이하 확인
3. 회귀: `npm run test` 전체 통과

---

## Phase 2: 광전사 시작 스킬 세트 재조정 (MEDIUM)

### 근본 원인

현재 시작 스킬 `['slash', 'cleave']`는 0 MP 옵션이 `slash` 하나뿐이라,
MP 고갈 시 약한 기본기만 반복하게 된다. 테스트에서 slash 8회 vs cleave 1~2회로 편향됨.
광전사의 컨셉인 "피의 분노"를 살리려면 HP 배율형 스킬이 초반부터 있어야 한다.

### 수정 사항

**파일 1**: `src/game/data/characters.ts` — 광전사 시작 스킬

```typescript
// 수정 전
startingSkillIds: ['slash', 'cleave'],

// 수정 후
startingSkillIds: ['slash', 'bloodlust', 'cleave'],
```

**파일 2**: `src/game/data/skills.ts` — cleave MP 비용 조정

```typescript
// 수정 전
{ id: 'cleave', mpCost: 25, ... }

// 수정 후
{ id: 'cleave', mpCost: 20, ... }
```

**파일 3**: `src/game/data/characters.ts` — bloodlust 드래프트 가중치 제거 (중복 방지)

```typescript
// 수정 전 (드래프트 풀)
bloodlust: 5, death_charge: 5, war_cry: 4, heavy_blow: 4,

// 수정 후
death_charge: 5, war_cry: 4, heavy_blow: 4, frenzy: 4,
```

### 수치 변화

| 항목 | 수정 전 | 수정 후 | 변화 |
|------|---------|---------|------|
| 시작 스킬 수 | 2 | 3 | +1 |
| cleave MP 비용 | 25 | 20 | -20% |
| MP 120 기준 cleave 사용 횟수 | 4.8회 | 6회 | +25% |
| HP 저하 시 딜 옵션 | 없음 | bloodlust | 신규 |

### 테스트 방법

1. 광전사 생성 시 시작 스킬 배열에 `bloodlust` 포함 확인
2. cleave 사용 후 MP 20 감소 확인
3. bloodlust가 드래프트 풀에 중복 등장하지 않는지 확인

---

## Phase 3: 빛의 성기사 공격력 및 시작 스킬 집중도 개선 (MEDIUM)

### 근본 원인

- 공격력 165 — 5명 중 최저
- 시작 스킬 4개로 초반 MP 분산, 공격 기회 부족
- `barrier`(25 MP) 초반 보유 시 공격 스킬 사용 여력 없음 → 딜 부족 → Round 2 탈락

### 수정 사항

**파일**: `src/game/data/characters.ts`

```typescript
// 수정 전
baseStats: { maxHp: 1350, attack: 165, defense: 110, speed: 50, maxMp: 120 },
startingSkillIds: ['divine_heal', 'barrier', 'basic_glimmer', 'smite'],

// 수정 후
baseStats: { maxHp: 1400, attack: 185, defense: 110, speed: 55, maxMp: 130 },
startingSkillIds: ['divine_heal', 'basic_glimmer', 'smite'],
```

`barrier`는 드래프트 풀에 그대로 남아 있어 필요 시 획득 가능.

### 수치 변화

| 항목 | 수정 전 | 수정 후 | 변화 |
|------|---------|---------|------|
| attack | 165 | 185 | +12.1% |
| maxHp | 1350 | 1400 | +3.7% |
| speed | 50 | 55 | +10% |
| maxMp | 120 | 130 | +8.3% |
| 시작 스킬 수 | 4 | 3 | -1 (barrier 제거) |
| 라운드 1 예상 턴 피해 | ~200 | ~230 | +15% |

공격력 185는 여전히 5명 중 4위 (광전사 230, 칠흑 210, 마법사 195 순).

### 테스트 방법

1. 성기사 생성 시 `startingSkillIds.length === 3` 확인
2. 성기사 공격력 185 기반 `calcDamage` 기대값 검증
3. 10회 봇 플레이 시 라운드 3+ 도달률 50%+ 확인

---

## Phase 4: 라운드 3~5 난이도 곡선 완화 (MEDIUM)

### 근본 원인

- 라운드 3부터 즉시 전체 MID 풀 노출 + 2체 배치
- MID 풀에 회복/재생 보유 적이 4체: cursed_knight, flame_phoenix, dark_vampire, demon_mage
- 플레이어는 2회 드래프트(R1+R2)만으로 대응해야 함

### 수정 사항

**파일 1**: `src/game/data/enemies.ts` — MID 풀 2단계 분할

```typescript
// 수정 전
const EARLY_ENEMY_IDS = ['goblin', 'fire_imp', 'shadow_wolf', 'skeleton_archer']
const MID_ENEMY_IDS = ['orc_warrior', 'ice_golem', 'cursed_knight', 'demon_mage', 'flame_phoenix', 'dark_vampire']
const LATE_ENEMY_IDS = ['elder_troll', 'lich', 'frost_giant', 'poison_hydra', 'void_lord', 'dragon_lord']

export function getEnemyPoolForRound(round: number): readonly EnemyDef[] {
  if (round <= 2) return ENEMIES.filter(e => EARLY_ENEMY_IDS.includes(e.id))
  if (round <= 5) return ENEMIES.filter(e => [...EARLY_ENEMY_IDS, ...MID_ENEMY_IDS].includes(e.id))
  return ENEMIES.filter(e => MID_ENEMY_IDS.includes(e.id) || LATE_ENEMY_IDS.includes(e.id))
}

// 수정 후
const EARLY_ENEMY_IDS = ['goblin', 'fire_imp', 'shadow_wolf', 'skeleton_archer']
const MID_EASY_ENEMY_IDS = ['orc_warrior', 'ice_golem', 'flame_phoenix']
const MID_HARD_ENEMY_IDS = ['cursed_knight', 'demon_mage', 'dark_vampire']
const LATE_ENEMY_IDS = ['elder_troll', 'lich', 'frost_giant', 'poison_hydra', 'void_lord', 'dragon_lord']

export function getEnemyPoolForRound(round: number): readonly EnemyDef[] {
  if (round <= 2) return ENEMIES.filter(e => EARLY_ENEMY_IDS.includes(e.id))
  if (round === 3) return ENEMIES.filter(e => [...EARLY_ENEMY_IDS, ...MID_EASY_ENEMY_IDS].includes(e.id))
  if (round <= 5) return ENEMIES.filter(e => [...EARLY_ENEMY_IDS, ...MID_EASY_ENEMY_IDS, ...MID_HARD_ENEMY_IDS].includes(e.id))
  return ENEMIES.filter(e => [...MID_EASY_ENEMY_IDS, ...MID_HARD_ENEMY_IDS, ...LATE_ENEMY_IDS].includes(e.id))
}
```

**파일 2**: `src/game/run.ts` — 라운드 3 적 수 축소

```typescript
// 수정 전
3: 2,

// 수정 후
3: 1,
```

**파일 3**: `src/game/run.ts` — 전투 후 회복률 상향

```typescript
// 수정 전
const VICTORY_HEAL_RATIO = 0.25

// 수정 후
const VICTORY_HEAL_RATIO = 0.35
```

### 수치 변화

| 항목 | 수정 전 | 수정 후 | 변화 |
|------|---------|---------|------|
| R3 적 수 | 2 | 1 | -50% |
| R3에 cursed_knight 등장 | 예 | 아니오 | 제거 |
| R3에 dark_vampire 등장 | 예 | 아니오 | 제거 |
| 전투 후 HP 회복률 | 25% | 35% | +40% |

### 테스트 방법

1. `getEnemyPoolForRound(3)` 결과에 `cursed_knight`, `dark_vampire` 미포함 확인
2. `ENEMY_COUNT_BY_ROUND[3] === 1` 확인
3. 25회 봇 시뮬레이션 → 라운드 5 도달률 80%+

---

## Phase 5: 초반 생존 아이템 드래프트 가중치 상향 (LOW)

### 근본 원인

라운드 1~4 구간에서도 공격 특화 아이템이 섞여 나와 생존형 아이템(`vitality_gem`, `tough_armor`, `mana_crystal`) 획득 기회가 낮다.

### 수정 사항

**파일**: `src/game/run.ts` — `generateDraftOptions` 내부 가중치 보정

```typescript
const EARLY_SURVIVAL_BONUS_ITEMS = new Set([
  'vitality_gem', 'tough_armor', 'mana_crystal', 'iron_ring',
])
const EARLY_SURVIVAL_ROUND_CAP = 4
const EARLY_SURVIVAL_WEIGHT_BONUS = 2

function getItemDraftWeight(item: ItemDef, round: number, charWeights: Record<string, number>): number {
  let weight = charWeights[item.id] ?? 1
  if (round <= EARLY_SURVIVAL_ROUND_CAP && EARLY_SURVIVAL_BONUS_ITEMS.has(item.id)) {
    weight += EARLY_SURVIVAL_WEIGHT_BONUS
  }
  return weight
}
```

### 수치 변화

| 항목 | 수정 전 | 수정 후 | 변화 |
|------|---------|---------|------|
| R1~4 생존 아이템 가중치 | 4 | 6 | +50% |
| R5+ 가중치 | 4 | 4 | 변화 없음 |

> Phase 1~4 완료 후 재시뮬레이션하여 필요성 판단 권장.

---

## 구현 순서 요약

| Phase | 우선순위 | 난이도 | 예상 작업 시간 | 독립 머지 |
|-------|---------|--------|----------------|-----------|
| Phase 1: cursed_knight 너프 | HIGH | Low | 30분 | O |
| Phase 2: 광전사 스킬 세트 | MEDIUM | Low-Med | 45분 | O |
| Phase 3: 성기사 스탯/스킬 | MEDIUM | Low | 30분 | O |
| Phase 4: 라운드 3~5 곡선 | MEDIUM | Low | 60분 | O |
| Phase 5: 드래프트 가중치 | LOW | Medium | 60분 | O |

---

## 성공 기준

- [ ] cursed_knight 힐 주기 4턴, 회당 ~50 HP
- [ ] 광전사 시작 스킬에 `bloodlust` 포함, `cleave` MP 20
- [ ] 성기사 공격력 185, 시작 스킬 3개
- [ ] 라운드 3 적 수 1체, cursed_knight/dark_vampire 미등장
- [ ] 전투 후 회복률 35%
- [ ] 단위 테스트 80%+ 커버리지 유지
- [ ] 25회 봇 시뮬레이션에서 라운드 5 도달률 80%+
- [ ] 25회 봇 시뮬레이션에서 라운드 10 도달률 30%+
- [ ] 25회 봇 시뮬레이션에서 라운드 15 클리어 1회 이상

---

## 위험 요소

| 위험 | 완화 |
|------|------|
| cursed_knight 너프 과도 → 중반 지루함 | 회복량 0 대신 0.28 유지, 4번째 액션 추가로 턴 효율 보존 |
| 성기사 공격력 버프 → 물리 캐릭 대비 역전 | 원소 매치(빛>어둠 1.75x) 유지, 공격력 185는 여전히 4위 |
| MID 풀 분할 → 라운드 4~5 급상승 | Phase 1 너프로 cursed_knight 자체 위협도 감소 |

---

## 관련 파일

- `src/game/data/enemies.ts` — Phase 1, 4
- `src/game/data/characters.ts` — Phase 2, 3
- `src/game/data/skills.ts` — Phase 2
- `src/game/run.ts` — Phase 4, 5
- `src/game/__tests__/combat.test.ts` — 테스트 전 구간
