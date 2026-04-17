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
