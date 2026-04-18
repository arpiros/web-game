import type { CraftRecipe } from '../types'

export const RECIPES: readonly CraftRecipe[] = [
  // ── 스킬 레시피 ─────────────────────────────────────────────────────────
  {
    id: 'recipe_void_annihilation',
    name: '허공 전멸 조합',
    description: '그림자 타격 + 전멸 → 허공 전멸',
    category: 'skill',
    ingredients: ['shadow_strike', 'annihilation'],
    resultId: 'void_annihilation',
  },
  {
    id: 'recipe_holy_inferno',
    name: '성화 지옥불 조합',
    description: '파이어볼 + 광휘 → 성화 지옥불',
    category: 'skill',
    ingredients: ['fireball', 'radiance'],
    resultId: 'holy_inferno',
  },
  {
    id: 'recipe_storm_blade',
    name: '폭풍 검기 조합',
    description: '참격 + 해일 → 폭풍 검기',
    category: 'skill',
    ingredients: ['slash', 'tidal_wave'],
    resultId: 'storm_blade',
  },
  {
    id: 'recipe_dark_heal',
    name: '암흑 치유 조합',
    description: '영혼 흡수 + 신성 치유 → 암흑 치유',
    category: 'skill',
    ingredients: ['soul_drain', 'divine_heal'],
    resultId: 'dark_heal',
  },
  {
    id: 'recipe_berserker_rage',
    name: '광전사의 분노 조합',
    description: '피의 광기 + 절사 돌격 → 광전사의 분노',
    category: 'skill',
    ingredients: ['bloodlust', 'death_charge'],
    resultId: 'berserker_rage',
  },
  // ── 아이템 레시피 ────────────────────────────────────────────────────────
  {
    id: 'recipe_dragon_blade',
    name: '용의 검 조합',
    description: '철의 반지 + 화염 파편 → 용의 검',
    category: 'item',
    ingredients: ['iron_ring', 'flame_shard'],
    resultId: 'dragon_blade',
  },
  {
    id: 'recipe_immortal_armor',
    name: '불사의 갑옷 조합',
    description: '강철 갑옷 + 불사의 묘약 → 불사의 갑옷',
    category: 'item',
    ingredients: ['tough_armor', 'revival_potion'],
    resultId: 'immortal_armor',
  },
  {
    id: 'recipe_archmage_tome',
    name: '대마법사의 마법서 조합',
    description: '비전의 마법서 + 마나 수정 → 대마법사의 마법서',
    category: 'item',
    ingredients: ['arcane_tome', 'mana_crystal'],
    resultId: 'archmage_tome',
  },
]

/** 조합으로만 얻을 수 있는 결과물 ID 집합 — 드래프트 풀에서 제외하는 데 사용 */
export const CRAFT_RESULT_IDS: ReadonlySet<string> = new Set(
  RECIPES.map(r => r.resultId),
)
