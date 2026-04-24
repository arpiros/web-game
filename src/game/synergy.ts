/* ==========================================================================
   Dark Fantasy Roguelike — Elemental Synergy System
   Pure functions. No React/Zustand dependency.
   ========================================================================== */

import type { BattleCharacter, BattleAlly, Element } from './types'

// ---------------------------------------------------------------------------
// Synergy Definitions
// ---------------------------------------------------------------------------

export type SynergyId =
  | 'steam_explosion'   // fire + water
  | 'chaos'             // dark + light
  | 'doom_strike'       // physical + dark
  | 'holy_water'        // water + light
  | 'blazing_warrior'   // physical + fire
  | 'frost_guard'       // physical + water
  | 'holy_strike'       // physical + light
  | 'cursed_inferno'    // fire + dark
  | 'sacred_flame'      // fire + light
  | 'abyssal_wave'      // water + dark

export interface Synergy {
  readonly id: SynergyId
  readonly name: string
  readonly description: string
  readonly elements: readonly [Element, Element]
}

export const SYNERGIES: readonly Synergy[] = [
  {
    id: 'steam_explosion',
    name: '증기 폭발',
    description: '화염 스킬이 빙결된 적을 공격할 때 피해 +50%',
    elements: ['fire', 'water'],
  },
  {
    id: 'chaos',
    name: '카오스',
    description: '매 턴 종료 시 랜덤 적에게 최대 HP 15% 피해',
    elements: ['dark', 'light'],
  },
  {
    id: 'doom_strike',
    name: '파멸의 일격',
    description: '크리티컬 발생 시 대상에게 독(3턴) 자동 부여',
    elements: ['physical', 'dark'],
  },
  {
    id: 'holy_water',
    name: '성수',
    description: '회복 스킬 효과 +30%',
    elements: ['water', 'light'],
  },
  {
    id: 'blazing_warrior',
    name: '불꽃 전사',
    description: '물리 스킬이 화상 상태인 적을 공격할 때 피해 +50%',
    elements: ['physical', 'fire'],
  },
  {
    id: 'frost_guard',
    name: '빙결 방어',
    description: '물리 스킬 사용 시 자신에게 방어막(공격력×0.3) 부여',
    elements: ['physical', 'water'],
  },
  {
    id: 'holy_strike',
    name: '성스러운 타격',
    description: '물리 크리티컬 발생 시 대상에게 기절(1턴) 자동 부여',
    elements: ['physical', 'light'],
  },
  {
    id: 'cursed_inferno',
    name: '저주의 화염',
    description: '화염 스킬이 독 상태인 적을 공격할 때 피해 +50%',
    elements: ['fire', 'dark'],
  },
  {
    id: 'sacred_flame',
    name: '성화',
    description: '화염 스킬 사용 후 자신에게 재생(3턴) 부여',
    elements: ['fire', 'light'],
  },
  {
    id: 'abyssal_wave',
    name: '심연의 파도',
    description: '수계 스킬 적중 시 대상에게 방어력 감소(2턴) 자동 부여',
    elements: ['water', 'dark'],
  },
]

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

export function getActiveElements(
  party: readonly BattleCharacter[],
  allies: readonly BattleAlly[],
): ReadonlySet<Element> {
  const elements = new Set<Element>()
  for (const c of party) {
    if (c.isAlive) elements.add(c.element)
  }
  for (const a of allies) {
    if (a.isAlive) elements.add(a.element)
  }
  return elements
}

export function getActiveSynergies(
  party: readonly BattleCharacter[],
  allies: readonly BattleAlly[],
): readonly Synergy[] {
  const elements = getActiveElements(party, allies)
  return SYNERGIES.filter(s => s.elements.every(e => elements.has(e)))
}

export function hasSynergy(
  party: readonly BattleCharacter[],
  allies: readonly BattleAlly[],
  id: SynergyId,
): boolean {
  return getActiveSynergies(party, allies).some(s => s.id === id)
}
