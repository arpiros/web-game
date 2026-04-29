import type { CraftRecipe } from '../types'

export const RECIPES: readonly CraftRecipe[] = [
  // ── 스킬 레시피 ─────────────────────────────────────────────────────────
  {
    id: 'recipe_void_annihilation',
    name: '흑백합 종언 조합',
    description: '암영참 + 종언의 별 → 흑백합 종언',
    category: 'skill',
    ingredients: ['shadow_strike', 'annihilation'],
    resultId: 'void_annihilation',
  },
  {
    id: 'recipe_holy_inferno',
    name: '성염 심판 조합',
    description: '적련구 + 창성광휘 → 성염 심판',
    category: 'skill',
    ingredients: ['fireball', 'radiance'],
    resultId: 'holy_inferno',
  },
  {
    id: 'recipe_storm_blade',
    name: '창뢰검무 조합',
    description: '검로 베기 + 해일장막 → 창뢰검무',
    category: 'skill',
    ingredients: ['slash', 'tidal_wave'],
    resultId: 'storm_blade',
  },
  {
    id: 'recipe_dark_heal',
    name: '흑성 흡수 조합',
    description: '영혼갈증 + 성백 치유 → 흑성 흡수',
    category: 'skill',
    ingredients: ['soul_drain', 'divine_heal'],
    resultId: 'dark_heal',
  },
  {
    id: 'recipe_berserker_rage',
    name: '붉은 전장 광휘 조합',
    description: '전귀의 웃음 + 사선 돌파 → 붉은 전장 광휘',
    category: 'skill',
    ingredients: ['bloodlust', 'death_charge'],
    resultId: 'berserker_rage',
  },
  // ── 아이템 레시피 ────────────────────────────────────────────────────────
  {
    id: 'recipe_dragon_blade',
    name: '용혈검 아르데라 조합',
    description: '길드의 철반지 + 적련 파편 → 용혈검 아르데라',
    category: 'item',
    ingredients: ['iron_ring', 'flame_shard'],
    resultId: 'dragon_blade',
  },
  {
    id: 'recipe_immortal_armor',
    name: '불사 성갑 조합',
    description: '하층 수호갑 + 불사조 묘약 → 불사 성갑',
    category: 'item',
    ingredients: ['tough_armor', 'revival_potion'],
    resultId: 'immortal_armor',
  },
  {
    id: 'recipe_archmage_tome',
    name: '대마도 금서 조합',
    description: '금서 사본 + 청마나 결정 → 대마도 금서',
    category: 'item',
    ingredients: ['arcane_tome', 'mana_crystal'],
    resultId: 'archmage_tome',
  },
  // ── 신규 스킬 레시피 ─────────────────────────────────────────────────────
  {
    id: 'recipe_steam_surge',
    name: '증기대폭주 조합',
    description: '적련구 + 해일장막 → 증기대폭주',
    category: 'skill',
    ingredients: ['fireball', 'tidal_wave'],
    resultId: 'steam_surge',
  },
  {
    id: 'recipe_phantom_strike',
    name: '환영독참 조합',
    description: '암영참 + 독아각인 → 환영독참',
    category: 'skill',
    ingredients: ['shadow_strike', 'poison_bite'],
    resultId: 'phantom_strike',
  },
  {
    id: 'recipe_titan_smash',
    name: '거신 분쇄 조합',
    description: '파쇄 일격 + 전열 가르기 → 거신 분쇄',
    category: 'skill',
    ingredients: ['heavy_blow', 'cleave'],
    resultId: 'titan_smash',
  },
  {
    id: 'recipe_holy_tide',
    name: '성조의 기도 조합',
    description: '정화의 비 + 성백 치유 → 성조의 기도',
    category: 'skill',
    ingredients: ['cleanse', 'divine_heal'],
    resultId: 'holy_tide',
  },
  {
    id: 'recipe_void_lance',
    name: '공허관통창 조합',
    description: '영혼갈증 + 암흑신성 → 공허관통창',
    category: 'skill',
    ingredients: ['soul_drain', 'dark_nova'],
    resultId: 'void_lance',
  },
  // ── 신규 아이템 레시피 ────────────────────────────────────────────────────
  {
    id: 'recipe_night_blade',
    name: '야영검 녹스 조합',
    description: '길드의 철반지 + 흑백합 보석 → 야영검 녹스',
    category: 'item',
    ingredients: ['iron_ring', 'shadow_gem'],
    resultId: 'night_blade',
  },
  {
    id: 'recipe_life_crystal',
    name: '생명의 청홍정 조합',
    description: '생명의 홍옥 + 청마나 결정 → 생명의 청홍정',
    category: 'item',
    ingredients: ['vitality_gem', 'mana_crystal'],
    resultId: 'life_crystal',
  },
  {
    id: 'recipe_pyroclast_orb',
    name: '화산탄 성구 조합',
    description: '적련 파편 + 기사단 숫돌 → 화산탄 성구',
    category: 'item',
    ingredients: ['flame_shard', 'whetstone'],
    resultId: 'pyroclast_orb',
  },
]

/** 조합으로만 얻을 수 있는 결과물 ID 집합 — 드래프트 풀에서 제외하는 데 사용 */
export const CRAFT_RESULT_IDS: ReadonlySet<string> = new Set(
  RECIPES.map(r => r.resultId),
)
