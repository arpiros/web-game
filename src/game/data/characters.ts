import type { CharacterDef } from '../types'

export const CHARACTERS: readonly CharacterDef[] = [
  {
    id: 'dark_knight',
    name: '세리아',
    title: '칠흑의 기사',
    element: 'dark',
    baseStats: {
      maxHp: 1200,
      attack: 180,
      defense: 90,
      speed: 60,
      maxMp: 120,
    },
    innateSkillId: 'shadow_strike',
    startingSkillIds: ['slash', 'poison_bite'],
    lore: '몰락한 성기사단 출신의 과묵한 기사. 누군가를 살리기 위해 어둠을 받아들였고, 잃어버린 감정을 되찾으려 회색 첨탑에 오른다.',
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
    name: '에밀리아',
    title: '불꽃의 마법사',
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
    lore: '왕립 마법 학원에서 추방된 천재 마법사. 오만해 보이지만 인정받고 싶은 마음이 강하며, 자신의 불꽃이 저주가 아님을 증명하려 한다.',
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
    name: '리제롯테',
    title: '빛의 성기사',
    element: 'light',
    baseStats: {
      maxHp: 1400,
      attack: 185,
      defense: 110,
      speed: 65,
      maxMp: 130,
    },
    innateSkillId: 'holy_strike',
    startingSkillIds: ['divine_heal', 'basic_glimmer', 'smite'],
    lore: '교회의 선택을 받은 성실한 성기사. 예의 바르고 책임감이 강하지만, 숨겨진 신탁의 진실을 확인하기 위해 첨탑으로 향한다.',
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
    name: '미레유',
    title: '조류 무희',
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
    lore: '바다 정령과 계약한 항구 도시의 무희. 부드럽게 웃지만 집요한 면이 있으며, 고향 바다를 잠식한 저주의 근원을 찾고 있다.',
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
    name: '프레데리카',
    title: '광전사',
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
    lore: '전쟁터에서 살아남은 호쾌한 전사. 웃으며 앞장서지만 분노를 멈추는 법을 몰라, 자신의 피에 새겨진 전장의 저주를 끊으려 한다.',
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
