import type { AllyDef } from '../types'

export const ALLIES: readonly AllyDef[] = [
  {
    id: 'forest_archer',
    name: '숲의 궁수',
    description: '매 턴 가장 낮은 HP의 적을 조준하여 화살을 쏜다.',
    element: 'physical',
    rarity: 'common',
    baseStats: { maxHp: 600, attack: 120, defense: 40, speed: 90 },
    action: { type: 'attack', element: 'physical', multiplier: 1.0 },
  },
  {
    id: 'battle_cleric',
    name: '전투 성직자',
    description: '매 턴 파티 중 HP가 가장 낮은 캐릭터를 치유한다.',
    element: 'light',
    rarity: 'rare',
    baseStats: { maxHp: 700, attack: 100, defense: 60, speed: 70 },
    action: { type: 'heal_party', multiplier: 1.2 },
  },
  {
    id: 'shadow_assassin',
    name: '그림자 암살자',
    description: '매 턴 독을 묻힌 단검으로 단일 적을 공격한다.',
    element: 'dark',
    rarity: 'rare',
    baseStats: { maxHp: 500, attack: 160, defense: 30, speed: 110 },
    action: { type: 'apply_status', status: 'poison', duration: 2, value: 8 },
  },
  {
    id: 'iron_guardian',
    name: '철벽 수호자',
    description: '매 턴 파티 전체에 방어막을 부여한다.',
    element: 'physical',
    rarity: 'rare',
    baseStats: { maxHp: 1000, attack: 80, defense: 150, speed: 40 },
    action: { type: 'shield_party', amount: 80 },
  },
  {
    id: 'fire_spirit',
    name: '화염 정령',
    description: '매 턴 전체 적에게 화염 피해를 준다.',
    element: 'fire',
    rarity: 'rare',
    baseStats: { maxHp: 550, attack: 140, defense: 20, speed: 85 },
    action: { type: 'attack', element: 'fire', multiplier: 0.7 },
  },
  {
    id: 'ice_witch',
    name: '빙결 마녀',
    description: '매 턴 단일 적에게 빙결을 부여한다.',
    element: 'water',
    rarity: 'epic',
    baseStats: { maxHp: 600, attack: 130, defense: 35, speed: 75 },
    action: { type: 'apply_status', status: 'freeze', duration: 1, value: 0 },
  },
  {
    id: 'blood_knight',
    name: '피의 기사',
    description: '매 턴 강력한 물리 공격으로 적을 공격한다.',
    element: 'dark',
    rarity: 'epic',
    baseStats: { maxHp: 900, attack: 200, defense: 70, speed: 60 },
    action: { type: 'attack', element: 'dark', multiplier: 1.4 },
  },
  {
    id: 'ancient_dragon',
    name: '고대 용',
    description: '매 턴 전체 적에게 화염 브레스를 내뿜는다. 매우 강력.',
    element: 'fire',
    rarity: 'legendary',
    baseStats: { maxHp: 1500, attack: 280, defense: 100, speed: 55 },
    action: { type: 'attack', element: 'fire', multiplier: 2.0 },
  },
]

export function getAllyById(id: string): AllyDef | undefined {
  return ALLIES.find(a => a.id === id)
}
