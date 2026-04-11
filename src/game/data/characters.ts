import type { CharacterDef } from '../types'

export const CHARACTERS: readonly CharacterDef[] = [
  {
    id: 'dark_knight',
    name: '칠흑의 기사',
    title: '어둠 속의 검',
    element: 'dark',
    baseStats: {
      maxHp: 1200,
      attack: 180,
      defense: 90,
      speed: 60,
      maxMp: 100,
    },
    innateSkillId: 'shadow_strike',
    startingSkillIds: ['slash', 'poison_bite'],
    lore: '빛을 잃은 성기사. 어둠의 힘을 받아들여 강대한 힘을 얻었지만, 그 대가로 삶의 기쁨을 잃었다.',
  },
  {
    id: 'fire_mage',
    name: '불꽃의 마법사',
    title: '파멸의 불꽃',
    element: 'fire',
    baseStats: {
      maxHp: 800,
      attack: 220,
      defense: 50,
      speed: 80,
      maxMp: 160,
    },
    innateSkillId: 'flame_strike',
    startingSkillIds: ['fireball', 'ignite'],
    lore: '고대 화염 마법을 연구한 마법사. 폭발적인 마력을 지녔지만 방어는 취약하다.',
  },
  {
    id: 'holy_paladin',
    name: '빛의 성기사',
    title: '신의 방패',
    element: 'light',
    baseStats: {
      maxHp: 1500,
      attack: 140,
      defense: 130,
      speed: 50,
      maxMp: 120,
    },
    innateSkillId: 'holy_strike',
    startingSkillIds: ['divine_heal', 'barrier'],
    lore: '신의 가호를 받은 성기사. 굳건한 방어와 회복 능력으로 파티를 지킨다.',
  },
  {
    id: 'tide_dancer',
    name: '조류 무희',
    title: '흐르는 물의 춤',
    element: 'water',
    baseStats: {
      maxHp: 950,
      attack: 170,
      defense: 70,
      speed: 100,
      maxMp: 140,
    },
    innateSkillId: 'water_lance',
    startingSkillIds: ['heal_water', 'cleanse'],
    lore: '바다의 정령과 계약한 무희. 빠른 속도와 유연한 기술로 전장을 누빈다.',
  },
  {
    id: 'berserker',
    name: '광전사',
    title: '피의 분노',
    element: 'physical',
    baseStats: {
      maxHp: 1100,
      attack: 260,
      defense: 40,
      speed: 70,
      maxMp: 80,
    },
    innateSkillId: 'heavy_blow',
    startingSkillIds: ['slash', 'cleave'],
    lore: '분노를 힘으로 바꾸는 광전사. 방어를 포기하고 오직 공격에만 집중한다.',
  },
]

export function getCharacterById(id: string): CharacterDef | undefined {
  return CHARACTERS.find(c => c.id === id)
}
