import type { SkillDef } from '../types'

export const SKILLS: readonly SkillDef[] = [
  // -------------------------------------------------------------------------
  // 물리 계열
  // -------------------------------------------------------------------------
  {
    id: 'slash',
    name: '참격',
    description: '단일 적에게 공격력의 120% 물리 피해를 준다.',
    mpCost: 0,
    cooldown: 0,
    effects: [{ type: 'damage', element: 'physical', multiplier: 1.2 }],
    element: 'physical',
    rarity: 'common',
  },
  {
    id: 'heavy_blow',
    name: '강타',
    description: '단일 적에게 공격력의 200% 물리 피해를 준다.',
    mpCost: 20,
    cooldown: 1,
    effects: [{ type: 'damage', element: 'physical', multiplier: 2.0 }],
    element: 'physical',
    rarity: 'rare',
  },
  {
    id: 'cleave',
    name: '휩쓸기',
    description: '전체 적에게 공격력의 100% 물리 피해를 준다.',
    mpCost: 25,
    cooldown: 3,
    effects: [{ type: 'damage_all', element: 'physical', multiplier: 1.0 }],
    element: 'physical',
    rarity: 'rare',
  },
  {
    id: 'charge_strike',
    name: '차지 스트라이크',
    description: '2턴 후 공격력의 350% 물리 피해를 준다. 이번 턴 공격력 충전.',
    mpCost: 15,
    cooldown: 4,
    effects: [
      { type: 'charge', multiplier: 3.5 },
    ],
    element: 'physical',
    rarity: 'epic',
  },
  {
    id: 'thousand_blades',
    name: '천도참격',
    description: '단일 적에게 공격력의 450% 물리 피해. 적에게 방어력 감소를 부여.',
    mpCost: 40,
    cooldown: 5,
    effects: [
      { type: 'damage', element: 'physical', multiplier: 4.5 },
      { type: 'apply_status', status: 'defdown', duration: 2, value: 30 },
    ],
    element: 'physical',
    rarity: 'legendary',
  },

  // -------------------------------------------------------------------------
  // 화염 계열
  // -------------------------------------------------------------------------
  {
    id: 'basic_ember',
    name: '기본 불꽃',
    description: '단일 적에게 공격력의 65% 화염 피해를 준다. MP 없이 사용 가능.',
    mpCost: 0,
    cooldown: 0,
    effects: [{ type: 'damage', element: 'fire', multiplier: 0.65 }],
    element: 'fire',
    rarity: 'common',
  },
  {
    id: 'flame_strike',
    name: '화염 타격',
    description: '단일 적에게 공격력의 130% 화염 피해를 준다.',
    mpCost: 10,
    cooldown: 0,
    effects: [{ type: 'damage', element: 'fire', multiplier: 1.3 }],
    element: 'fire',
    rarity: 'common',
  },
  {
    id: 'fireball',
    name: '파이어볼',
    description: '전체 적에게 공격력의 100% 화염 피해를 주고 화상을 부여.',
    mpCost: 30,
    cooldown: 3,
    effects: [
      { type: 'damage_all', element: 'fire', multiplier: 1.0 },
      { type: 'apply_status', status: 'burn', duration: 2, value: 15 },
    ],
    element: 'fire',
    rarity: 'rare',
  },
  {
    id: 'ignite',
    name: '점화',
    description: '단일 적에게 강한 화상을 부여한다. (3턴, 20 고정 피해)',
    mpCost: 15,
    cooldown: 2,
    effects: [
      { type: 'apply_status', status: 'burn', duration: 3, value: 20 },
    ],
    element: 'fire',
    rarity: 'common',
  },
  {
    id: 'eruption',
    name: '화산 폭발',
    description: '전체 적에게 공격력의 180% 화염 피해. 자신에게도 공격력 버프.',
    mpCost: 45,
    cooldown: 5,
    effects: [
      { type: 'damage_all', element: 'fire', multiplier: 1.8 },
      { type: 'apply_status', status: 'powerup', duration: 2, value: 50 },
    ],
    element: 'fire',
    rarity: 'epic',
  },
  {
    id: 'inferno',
    name: '인페르노',
    description: '전체 적에게 공격력의 400% 화염 피해. 화상 3턴 부여.',
    mpCost: 60,
    cooldown: 6,
    effects: [
      { type: 'damage_all', element: 'fire', multiplier: 4.0 },
      { type: 'apply_status', status: 'burn', duration: 3, value: 30 },
    ],
    element: 'fire',
    rarity: 'legendary',
  },

  // -------------------------------------------------------------------------
  // 물 계열
  // -------------------------------------------------------------------------
  {
    id: 'basic_splash',
    name: '기본 물방울',
    description: '단일 적에게 공격력의 65% 수속 피해를 준다. MP 없이 사용 가능.',
    mpCost: 0,
    cooldown: 0,
    effects: [{ type: 'damage', element: 'water', multiplier: 0.65 }],
    element: 'water',
    rarity: 'common',
  },
  {
    id: 'water_lance',
    name: '수류창',
    description: '단일 적에게 공격력의 130% 수속 피해.',
    mpCost: 10,
    cooldown: 0,
    effects: [{ type: 'damage', element: 'water', multiplier: 1.3 }],
    element: 'water',
    rarity: 'common',
  },
  {
    id: 'tidal_wave',
    name: '해일',
    description: '전체 적에게 공격력의 120% 수속 피해. 냉기 부여.',
    mpCost: 35,
    cooldown: 4,
    effects: [
      { type: 'damage_all', element: 'water', multiplier: 1.2 },
      { type: 'apply_status', status: 'freeze', duration: 1, value: 0 },
    ],
    element: 'water',
    rarity: 'epic',
  },
  {
    id: 'heal_water',
    name: '물의 치유',
    description: '자신의 공격력 기반으로 HP를 회복한다.',
    mpCost: 20,
    cooldown: 2,
    effects: [{ type: 'heal', multiplier: 1.8 }],
    element: 'water',
    rarity: 'common',
  },
  {
    id: 'cleanse',
    name: '정화',
    description: '독/화상 상태이상을 제거하고 HP를 소량 회복.',
    mpCost: 15,
    cooldown: 2,
    effects: [
      { type: 'remove_status', status: 'poison' },
      { type: 'remove_status', status: 'burn' },
      { type: 'heal', multiplier: 0.5 },
    ],
    element: 'water',
    rarity: 'rare',
  },
  {
    id: 'barrier',
    name: '방어막',
    description: '피해를 300 흡수하는 방어막을 생성한다.',
    mpCost: 25,
    cooldown: 3,
    effects: [{ type: 'shield', amount: 300, flat: true }],
    element: 'water',
    rarity: 'rare',
  },

  // -------------------------------------------------------------------------
  // 어둠 계열
  // -------------------------------------------------------------------------
  {
    id: 'shadow_strike',
    name: '그림자 타격',
    description: '단일 적에게 공격력의 140% 어둠 피해.',
    mpCost: 15,
    cooldown: 1,
    effects: [{ type: 'damage', element: 'dark', multiplier: 1.4 }],
    element: 'dark',
    rarity: 'common',
  },
  {
    id: 'poison_bite',
    name: '독 이빨',
    description: '단일 적에게 독을 부여한다. (3턴, HP 6% 피해)',
    mpCost: 10,
    cooldown: 2,
    effects: [
      { type: 'apply_status', status: 'poison', duration: 3, value: 6 },
    ],
    element: 'dark',
    rarity: 'common',
  },
  {
    id: 'soul_drain',
    name: '영혼 흡수',
    description: '단일 적에게 공격력의 160% 어둠 피해. 피해의 30%를 HP로 흡수.',
    mpCost: 25,
    cooldown: 3,
    effects: [
      { type: 'damage', element: 'dark', multiplier: 1.6 },
      { type: 'heal', multiplier: 0.48 },
    ],
    element: 'dark',
    rarity: 'rare',
  },
  {
    id: 'dark_nova',
    name: '다크 노바',
    description: '전체 적에게 공격력의 200% 어둠 피해. 전체에 기절 부여.',
    mpCost: 45,
    cooldown: 5,
    effects: [
      { type: 'damage_all', element: 'dark', multiplier: 2.0 },
      { type: 'apply_status', status: 'stun', duration: 1, value: 0 },
    ],
    element: 'dark',
    rarity: 'epic',
  },
  {
    id: 'annihilation',
    name: '전멸',
    description: '전체 적에게 공격력의 550% 어둠 피해.',
    mpCost: 70,
    cooldown: 7,
    effects: [
      { type: 'damage_all', element: 'dark', multiplier: 5.5 },
    ],
    element: 'dark',
    rarity: 'legendary',
  },

  // -------------------------------------------------------------------------
  // 빛 계열
  // -------------------------------------------------------------------------
  {
    id: 'basic_glimmer',
    name: '기본 성광',
    description: '단일 적에게 공격력의 65% 빛 피해를 준다. MP 없이 사용 가능.',
    mpCost: 0,
    cooldown: 0,
    effects: [{ type: 'damage', element: 'light', multiplier: 0.65 }],
    element: 'light',
    rarity: 'common',
  },
  {
    id: 'holy_strike',
    name: '성광 타격',
    description: '단일 적에게 공격력의 130% 빛 피해.',
    mpCost: 10,
    cooldown: 0,
    effects: [{ type: 'damage', element: 'light', multiplier: 1.3 }],
    element: 'light',
    rarity: 'common',
  },
  {
    id: 'smite',
    name: '신벌',
    description: '단일 적에게 공격력의 150% 빛 피해를 준다.',
    mpCost: 15,
    cooldown: 1,
    effects: [{ type: 'damage', element: 'light', multiplier: 1.5 }],
    element: 'light',
    rarity: 'common',
  },
  {
    id: 'divine_heal',
    name: '신성 치유',
    description: '공격력의 180%만큼 HP를 회복하고 독/화상을 제거.',
    mpCost: 35,
    cooldown: 3,
    effects: [
      { type: 'heal', multiplier: 1.8 },
      { type: 'remove_status', status: 'poison' },
      { type: 'remove_status', status: 'burn' },
    ],
    element: 'light',
    rarity: 'rare',
  },
  {
    id: 'radiance',
    name: '광휘',
    description: '전체 적에게 공격력의 150% 빛 피해. 자신의 방어막 생성.',
    mpCost: 40,
    cooldown: 4,
    effects: [
      { type: 'damage_all', element: 'light', multiplier: 1.5 },
      { type: 'shield', amount: 1.5 },
    ],
    element: 'light',
    rarity: 'epic',
  },
  {
    id: 'judgment',
    name: '최후의 심판',
    description: '단일 적에게 공격력의 550% 빛 피해.',
    mpCost: 80,
    cooldown: 8,
    effects: [
      { type: 'damage', element: 'light', multiplier: 5.5 },
    ],
    element: 'light',
    rarity: 'legendary',
  },

  // -------------------------------------------------------------------------
  // 유틸
  // -------------------------------------------------------------------------
  {
    id: 'meditate',
    name: '명상',
    description: 'MP를 25 회복한다. 쿨다운 3턴.',
    mpCost: 0,
    cooldown: 3,
    effects: [{ type: 'heal_mp', amount: 25 }],
    element: 'physical',
    rarity: 'common',
  },
  {
    id: 'arcane_focus',
    name: '마나 집중',
    description: '3턴간 매 턴 8 MP를 회복하는 마나 재생 상태가 된다.',
    mpCost: 0,
    cooldown: 4,
    effects: [{ type: 'apply_status', status: 'mana_regen', duration: 3, value: 8 }],
    element: 'physical',
    rarity: 'rare',
  },
  {
    id: 'mp_restore',
    name: 'MP 회복',
    description: 'MP를 30 회복한다.',
    mpCost: 0,
    cooldown: 3,
    effects: [{ type: 'heal_mp', amount: 30 }],
    element: 'physical',
    rarity: 'common',
  },
  {
    id: 'power_surge',
    name: '파워 서지',
    description: '2턴간 공격력이 80% 증가한다.',
    mpCost: 20,
    cooldown: 4,
    effects: [{ type: 'apply_status', status: 'powerup', duration: 2, value: 80 }],
    element: 'physical',
    rarity: 'rare',
  },

  // -------------------------------------------------------------------------
  // 칠흑의 기사 전용
  // -------------------------------------------------------------------------
  {
    id: 'void_blade',
    name: '공허 검격',
    description: '어둠과 물리 속성으로 2연격. 각 타격이 속성 저항에 개별 계산된다. 합산 공격력의 150%.',
    mpCost: 20,
    cooldown: 2,
    effects: [
      { type: 'damage', element: 'dark', multiplier: 0.75 },
      { type: 'damage', element: 'physical', multiplier: 0.75 },
    ],
    element: 'dark',
    rarity: 'rare',
  },
  {
    id: 'blood_pact',
    name: '피의 계약',
    description: '최대 HP의 20%를 소모해 MP 40을 즉시 획득한다. 자신을 사망시키지 않는다.',
    mpCost: 0,
    cooldown: 3,
    effects: [{ type: 'spend_hp_gain_mp', hpPercent: 0.2, mpGain: 40 }],
    element: 'dark',
    rarity: 'rare',
  },

  // -------------------------------------------------------------------------
  // 불꽃의 마법사 전용
  // -------------------------------------------------------------------------
  {
    id: 'mana_burst',
    name: '마나 폭발',
    description: '막대한 MP를 소진해 전체 적에게 공격력의 250% 화염 피해를 가한다.',
    mpCost: 60,
    cooldown: 4,
    effects: [{ type: 'damage_all', element: 'fire', multiplier: 2.5 }],
    element: 'fire',
    rarity: 'epic',
  },
  {
    id: 'phoenix_rebirth',
    name: '불사조의 부활',
    description: '자신에게 부활 효과를 부여한다. 다음 사망 시 HP 30%로 1회 부활한다.',
    mpCost: 30,
    cooldown: 6,
    effects: [{ type: 'apply_status', status: 'revive', duration: 99, value: 1 }],
    element: 'fire',
    rarity: 'epic',
  },

  // -------------------------------------------------------------------------
  // 빛의 성기사 전용
  // -------------------------------------------------------------------------
  {
    id: 'holy_aura',
    name: '성스러운 오라',
    description: '파티 전원에게 3턴간 매 턴 HP를 회복하는 재생 효과를 부여한다.',
    mpCost: 25,
    cooldown: 3,
    effects: [{ type: 'apply_status_party', status: 'regen', duration: 3, value: 15 }],
    element: 'light',
    rarity: 'rare',
  },
  {
    id: 'divine_judgment',
    name: '신성한 심판',
    description: '적 HP가 25% 이하이면 즉사시킨다. 조건 미달 시 공격력의 80% 피해.',
    mpCost: 35,
    cooldown: 4,
    effects: [{ type: 'execute', threshold: 0.25 }],
    element: 'light',
    rarity: 'epic',
  },

  // -------------------------------------------------------------------------
  // 조류 무희 전용
  // -------------------------------------------------------------------------
  {
    id: 'tsunami_dance',
    name: '해일 춤',
    description: '전체 적에게 공격력의 140% 수계 피해를 주고 모든 적을 1턴 빙결시킨다.',
    mpCost: 35,
    cooldown: 4,
    effects: [
      { type: 'damage_all', element: 'water', multiplier: 1.4 },
      { type: 'apply_status', status: 'freeze', duration: 1, value: 0 },
    ],
    element: 'water',
    rarity: 'epic',
  },
  {
    id: 'current_step',
    name: '조류 발걸음',
    description: '파티 전원의 공격력을 2턴간 60% 증폭시킨다.',
    mpCost: 30,
    cooldown: 3,
    effects: [{ type: 'apply_status_party', status: 'powerup', duration: 2, value: 60 }],
    element: 'water',
    rarity: 'rare',
  },
  {
    id: 'riptide',
    name: '격류',
    description: '단일 적에게 물리 100% + 수계 100%의 연속 타격. 빙결 부여.',
    mpCost: 30,
    cooldown: 3,
    effects: [
      { type: 'damage', element: 'physical', multiplier: 1.0 },
      { type: 'damage', element: 'water', multiplier: 1.0 },
      { type: 'apply_status', status: 'freeze', duration: 1, value: 0 },
    ],
    element: 'water',
    rarity: 'rare',
  },

  // -------------------------------------------------------------------------
  // 광전사 전용
  // -------------------------------------------------------------------------
  {
    id: 'bloodlust',
    name: '피의 광기',
    description: '적에게 공격력의 150% 물리 피해를 주고 자신의 공격력이 3턴간 60% 증가한다.',
    mpCost: 20,
    cooldown: 3,
    effects: [
      { type: 'damage', element: 'physical', multiplier: 1.5 },
      { type: 'apply_status', status: 'powerup', duration: 3, value: 60 },
    ],
    element: 'physical',
    rarity: 'rare',
  },
  {
    id: 'death_charge',
    name: '절사 돌격',
    description: 'HP가 낮을수록 강해지는 물리 돌격. HP가 1%면 공격력의 최대 500% 피해.',
    mpCost: 20,
    cooldown: 2,
    effects: [{ type: 'damage_hp_scale', element: 'physical', baseMultiplier: 2.5 }],
    element: 'physical',
    rarity: 'rare',
  },
  {
    id: 'war_cry',
    name: '전투 함성',
    description: '파티 전원의 공격력을 3턴간 40% 증폭시키고 자신의 방어력을 일시적으로 강화한다.',
    mpCost: 25,
    cooldown: 4,
    effects: [
      { type: 'apply_status_party', status: 'powerup', duration: 3, value: 40 },
      { type: 'apply_status', status: 'powerup', duration: 2, value: 30 },
    ],
    element: 'physical',
    rarity: 'epic',
  },
]

export function getSkillById(id: string): SkillDef | undefined {
  return SKILLS.find(s => s.id === id)
}
