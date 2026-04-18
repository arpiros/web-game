# 구현 계획: 아이템·스킬 조합(Forge) 시스템

## 핵심 설계 결정

**별도 phase 추가 대신 드래프트 통합**
- `RunPhase` 타입 변경 없음 → App.tsx, runStore.ts 등 연쇄 수정 불필요
- 전투 승리 → "보상 선택 or 조합" 단일 의사결정 지점
- **조합 1회 = 드래프트 보상 1회 포기** (상호 배타적) — 밸런스 유지

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/game/types.ts` | `CraftRecipe` 타입 추가 |
| `src/game/data/recipes.ts` (신규) | 레시피 데이터 8~10개 |
| `src/game/data/skills.ts` | 조합 전용 스킬 5개 추가 |
| `src/game/data/items.ts` | 조합 전용 아이템 3개 추가 |
| `src/game/craft.ts` (신규) | 순수 함수: `getAvailableRecipes`, `applyCraft` |
| `src/game/run.ts` | `applyCraftChoice` 추가, 드래프트 풀 필터링 |
| `src/state/runStore.ts` | `craftAndAdvance` 액션 추가 |
| `src/screens/DraftScreen.tsx` | 조합 탭 UI + `RecipeCard` 컴포넌트 추가 |
| `src/game/__tests__/craft.test.ts` (신규) | 조합 로직 단위 테스트 |
| `src/game/__tests__/run.test.ts` | `applyCraftChoice` 테스트 추가 |

---

## Phase별 구현 순서

### Phase 1 — 데이터 레이어

#### 1. `types.ts` — `CraftRecipe` 인터페이스 추가

```typescript
export type CraftCategory = 'skill' | 'item'

export interface CraftRecipe {
  readonly id: EntityId
  readonly name: string
  readonly description: string
  readonly category: CraftCategory
  readonly ingredients: readonly [EntityId, EntityId]
  readonly resultId: EntityId
}
```

#### 2. `data/recipes.ts` — `RECIPES` 배열 + `CRAFT_RESULT_IDS` Set export

#### 3. `data/skills.ts` / `data/items.ts` — 조합 전용 결과물 추가 (epic/legendary 등급)

**초기 레시피:**

| 재료 1 | 재료 2 | 결과 | 효과 |
|--------|--------|------|------|
| `shadow_strike` | `annihilation` | `void_annihilation` | 전체 550% 어둠 피해 |
| `fireball` | `radiance` | `holy_inferno` | 전체 300% 화염+빛 + 화상+방어막 |
| `slash` | `tidal_wave` | `storm_blade` | 단일 350% 물리+수계 2연격 + 빙결 |
| `soul_drain` | `divine_heal` | `dark_heal` | 200% 피해 + 200% 힐 |
| `bloodlust` | `death_charge` | `berserker_rage` | HP 비례 500% 물리 + 3턴 파워업 |
| `iron_ring` | `flame_shard` | `dragon_blade` | 공격력+60, 화염 피해 +30% |
| `tough_armor` | `revival_potion` | `immortal_armor` | 방어력+60, 사망방지 |
| `arcane_tome` | `mana_crystal` | `archmage_tome` | 매 턴 MP 20 회복 |

### Phase 2 — 순수 로직

#### 4. `craft.ts`

```typescript
export function getAvailableRecipes(
  ownedSkillIds: readonly string[],
  ownedItemIds: readonly string[],
): readonly CraftRecipe[]

export function applyCraft(
  recipe: CraftRecipe,
  skillIds: readonly string[],
  itemIds: readonly string[],
): { skillIds: readonly string[]; itemIds: readonly string[] }
```

#### 5. `run.ts` 수정
- `applyCraftChoice(runState, recipeId) -> RunState`
- `generateDraftOptions`에서 `CRAFT_RESULT_IDS` 제외

### Phase 3 — Store

#### 6. `runStore.ts` — `craftAndAdvance(recipeId)` 액션

```typescript
craftAndAdvance: (recipeId) => {
  const { run, rng } = get()
  if (!run || run.phase !== 'draft') return
  const craftedRun = applyCraftChoice(run, recipeId)
  const [battleState, nextRng] = startBattle(craftedRun, rng)
  set({ rng: nextRng, run: { ...craftedRun, battleState } })
},
```

### Phase 4 — UI

#### 7. `DraftScreen.tsx`
- "보상 선택" / "조합" 탭 토글
- 가용 레시피 없으면 조합 탭 비활성
- `RecipeCard`: 재료A + 재료B → 결과물 형태 표시
- 조합 전 "재료 2개가 사라집니다" 확인

### Phase 5 — 테스트

#### 8. `craft.test.ts` 단위 테스트
- 재료 2개 보유 → 레시피 반환
- 재료 1개만 보유 → 미반환
- `applyCraft` 후 재료 제거 + 결과물 추가 확인

#### 9. `run.test.ts` 추가
- `applyCraftChoice` 후 `phase === 'battle'` 확인
- `generateDraftOptions` 필터링 확인

---

## 리스크

| 리스크 | 수준 | 대응 |
|--------|------|------|
| 조합 결과물 밸런스 | Medium | 높은 MP/쿨다운, 기존 legendary 대비 1.5배 이내 |
| 재료 소모 후 스킬 부족 | Medium | 조합 전 확인 문구 표시 |
| 드래프트 풀 감소 | Low | 결과물 8개는 전체 풀 50+ 대비 무시 가능 |
