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
    draftWeights: {
      // 스킬
      void_blade: 5, blood_pact: 5, soul_drain: 4, dark_nova: 4,
      annihilation: 4, poison_bite: 4, thousand_blades: 4, charge_strike: 3,
      heavy_blow: 3,
      // 아이템
      shadow_gem: 5, vampire_ring: 4, cursed_necklace: 4, whetstone: 4,
      iron_ring: 3, dragonscale: 3,
      // 동료
      shadow_assassin: 5, blood_knight: 5, poison_witch: 4,
    },
  },
  {
    id: 'fire_mage',
    name: '불꽃의 마법사',
    title: '파멸의 불꽃',
    element: 'fire',
    baseStats: {
      maxHp: 950,
      attack: 200,
      defense: 50,
      speed: 80,
      maxMp: 140,
    },
    innateSkillId: 'flame_strike',
    startingSkillIds: ['fireball', 'ignite', 'basic_ember'],
    lore: '고대 화염 마법을 연구한 마법사. 폭발적인 마력을 지녔지만 방어는 취약하다.',
    draftWeights: {
      // 스킬
      mana_burst: 5, phoenix_rebirth: 5, eruption: 4, inferno: 4,
      fireball: 4, arcane_focus: 4, meditate: 4, ignite: 3,
      // 아이템
      flame_shard: 5, arcane_tome: 5, mana_crystal: 4, time_sand: 4,
      cooldown_watch: 4,
      // 동료
      fire_spirit: 5, ancient_dragon: 5, battle_bard: 3,
    },
  },
  {
    id: 'holy_paladin',
    name: '빛의 성기사',
    title: '신의 방패',
    element: 'light',
    baseStats: {
      maxHp: 1400,
      attack: 185,
      defense: 110,
      speed: 55,
      maxMp: 130,
    },
    innateSkillId: 'holy_strike',
    startingSkillIds: ['divine_heal', 'basic_glimmer', 'smite'],
    lore: '신의 가호를 받은 성기사. 굳건한 방어와 회복 능력으로 파티를 지킨다.',
    draftWeights: {
      // 스킬
      holy_aura: 5, divine_judgment: 5, radiance: 4, judgment: 4,
      divine_heal: 4, barrier: 4, cleanse: 3, smite: 3,
      // 아이템
      holy_symbol: 5, tough_armor: 4, vitality_gem: 4, titan_heart: 4,
      magic_antidote: 3, heroes_crest: 3,
      // 동료
      battle_cleric: 5, guardian_angel: 5, iron_guardian: 4, storm_mage: 4,
    },
  },
  {
    id: 'tide_dancer',
    name: '조류 무희',
    title: '흐르는 물의 춤',
    element: 'water',
    baseStats: {
      maxHp: 950,
      attack: 185,
      defense: 70,
      speed: 100,
      maxMp: 140,
    },
    innateSkillId: 'water_lance',
    startingSkillIds: ['heal_water', 'cleanse', 'basic_splash'],
    lore: '바다의 정령과 계약한 무희. 빠른 속도와 유연한 기술로 전장을 누빈다.',
    draftWeights: {
      // 스킬
      tsunami_dance: 5, current_step: 5, riptide: 4, tidal_wave: 4,
      heal_water: 4, cleanse: 4, arcane_focus: 3, meditate: 3,
      // 아이템
      tide_pendant: 5, swift_boots: 4, storm_cloak: 4, cooldown_watch: 3,
      arcane_tome: 3,
      // 동료
      ice_witch: 5, battle_cleric: 4,
    },
  },
  {
    id: 'berserker',
    name: '광전사',
    title: '피의 분노',
    element: 'physical',
    baseStats: {
      maxHp: 1100,
      attack: 230,
      defense: 55,
      speed: 70,
      maxMp: 120,
    },
    innateSkillId: 'heavy_blow',
    startingSkillIds: ['slash', 'bloodlust', 'cleave'],
    lore: '분노를 힘으로 바꾸는 광전사. 방어를 포기하고 오직 공격에만 집중한다.',
    draftWeights: {
      // 스킬
      death_charge: 5, war_cry: 4, heavy_blow: 4,
      cleave: 4, charge_strike: 4, thousand_blades: 4, power_surge: 4,
      // 아이템
      berserker_heart: 5, whetstone: 4, iron_ring: 4, executioner_axe: 4,
      cursed_necklace: 4, twin_wings: 3,
      // 동료
      forest_archer: 4, blood_knight: 4, iron_guardian: 3, battle_bard: 3,
    },
  },
]

export function getCharacterById(id: string): CharacterDef | undefined {
  return CHARACTERS.find(c => c.id === id)
}
