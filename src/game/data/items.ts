import type { ItemDef } from '../types'

export const ITEMS: readonly ItemDef[] = [
  {
    id: 'iron_ring',
    name: '길드의 철반지',
    description: '공격력이 30 증가한다.',
    rarity: 'common',
    effects: [{ type: 'stat_boost', stat: 'attack', amount: 30 }],
  },
  {
    id: 'mana_crystal',
    name: '청마나 결정',
    description: '매 턴 MP를 5 회복한다.',
    rarity: 'common',
    effects: [{ type: 'mp_regen', amount: 5 }],
  },
  {
    id: 'tough_armor',
    name: '하층 수호갑',
    description: '방어력이 40 증가한다.',
    rarity: 'common',
    effects: [{ type: 'stat_boost', stat: 'defense', amount: 40 }],
  },
  {
    id: 'vitality_gem',
    name: '생명의 홍옥',
    description: '최대 HP가 200 증가한다.',
    rarity: 'common',
    effects: [{ type: 'stat_boost', stat: 'maxHp', amount: 200 }],
  },
  {
    id: 'swift_boots',
    name: '바람깃 장화',
    description: '속도가 20 증가한다.',
    rarity: 'common',
    effects: [{ type: 'stat_boost', stat: 'speed', amount: 20 }],
  },
  {
    id: 'whetstone',
    name: '기사단 숫돌',
    description: '물리 속성 공격의 피해가 15% 증가한다.',
    rarity: 'common',
    effects: [{ type: 'elemental_damage', element: 'physical', multiplier: 1.15 }],
  },
  {
    id: 'executioner_axe',
    name: '전장 처형도끼',
    description: '적을 처치할 때 HP를 50 회복한다.',
    rarity: 'rare',
    effects: [{ type: 'heal_on_kill', amount: 50 }],
  },
  {
    id: 'flame_shard',
    name: '적련 파편',
    description: '화염 속성 공격의 피해가 25% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_damage', element: 'fire', multiplier: 1.25 }],
  },
  {
    id: 'shadow_gem',
    name: '흑백합 보석',
    description: '어둠 속성 공격의 피해가 25% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_damage', element: 'dark', multiplier: 1.25 }],
  },
  {
    id: 'holy_symbol',
    name: '성백 문장',
    description: '빛 속성 공격의 피해가 25% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_damage', element: 'light', multiplier: 1.25 }],
  },
  {
    id: 'tide_pendant',
    name: '해류 목걸이',
    description: '수계 속성 공격의 피해가 20% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_damage', element: 'water', multiplier: 1.20 }],
  },
  {
    id: 'cooldown_watch',
    name: '학원 회중시계',
    description: '모든 스킬의 쿨다운이 1 감소한다.',
    rarity: 'rare',
    effects: [{ type: 'skill_cooldown_reduce', amount: 1 }],
  },
  {
    id: 'berserker_heart',
    name: '붉은 전장의 심장',
    description: 'HP가 30% 미만일 때 공격력이 100% 증가한다.',
    rarity: 'epic',
    effects: [
      {
        type: 'on_low_hp',
        threshold: 0.3,
        effect: { type: 'apply_status', status: 'powerup', duration: 1, value: 100 },
      },
    ],
  },
  {
    id: 'arcane_tome',
    name: '금서 사본',
    description: '매 턴 MP를 10 회복한다.',
    rarity: 'rare',
    effects: [{ type: 'mp_regen', amount: 10 }],
  },
  {
    id: 'dragonscale',
    name: '용혈 비늘',
    description: '공격력과 방어력이 각각 50 증가한다.',
    rarity: 'epic',
    effects: [
      { type: 'stat_boost', stat: 'attack', amount: 50 },
      { type: 'stat_boost', stat: 'defense', amount: 50 },
    ],
  },
  {
    id: 'titan_heart',
    name: '거신 심핵',
    description: '최대 HP가 500 증가하고 방어력이 30 증가한다.',
    rarity: 'epic',
    effects: [
      { type: 'stat_boost', stat: 'maxHp', amount: 500 },
      { type: 'stat_boost', stat: 'defense', amount: 30 },
    ],
  },
  {
    id: 'death_mask',
    name: '망자의 무도 가면',
    description: '공격력이 100 증가한다. 전설급 아이템.',
    rarity: 'legendary',
    effects: [{ type: 'stat_boost', stat: 'attack', amount: 100 }],
  },
  // ── 신규 아이템 (Phase 2-2) ──────────────────────────────────────────────
  {
    id: 'vampire_ring',
    name: '밤피의 반지',
    description: '물리 공격으로 가한 피해의 10%를 HP로 흡수한다.',
    rarity: 'rare',
    effects: [{ type: 'lifesteal', element: 'physical', percent: 0.10 }],
  },
  {
    id: 'ancient_scroll',
    name: '첨탑 고문서',
    description: '스킬 사용 시 5% 확률로 MP 소비가 무료가 된다.',
    rarity: 'rare',
    effects: [{ type: 'free_skill_chance', chance: 0.05 }],
  },
  {
    id: 'elemental_core',
    name: '오원소 심핵',
    description: '캐릭터 고유 원소와 같은 속성 스킬의 피해가 20% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_match_damage', multiplier: 1.20 }],
  },
  {
    id: 'storm_cloak',
    name: '창뢰 망토',
    description: '속도가 40 증가하고 치명타 확률이 5% 증가한다.',
    rarity: 'rare',
    effects: [
      { type: 'stat_boost', stat: 'speed', amount: 40 },
      { type: 'crit_chance_bonus', amount: 0.05 },
    ],
  },
  {
    id: 'cursed_necklace',
    name: '저주 사슬목걸이',
    description: '공격력이 80 증가하지만 매 턴 HP가 15 감소한다.',
    rarity: 'epic',
    effects: [
      { type: 'stat_boost', stat: 'attack', amount: 80 },
      { type: 'hp_drain_per_turn', amount: 15 },
    ],
  },
  {
    id: 'revival_potion',
    name: '불사조 묘약',
    description: '전투 중 처음 사망 시 HP 1로 버티고 살아남는다.',
    rarity: 'epic',
    effects: [{ type: 'death_prevention' }],
  },
  {
    id: 'magic_antidote',
    name: '성수 해독약',
    description: '독, 화상, 빙결 상태이상에 면역이 된다.',
    rarity: 'rare',
    effects: [{ type: 'status_immunity', statuses: ['poison', 'burn', 'freeze'] }],
  },
  {
    id: 'time_sand',
    name: '시계탑의 모래',
    description: '모든 스킬의 쿨다운이 2턴 감소한다.',
    rarity: 'epic',
    effects: [{ type: 'skill_cooldown_reduce', amount: 2 }],
  },
  {
    id: 'heroes_crest',
    name: '등반자의 문장',
    description: '보스에게 가하는 피해가 25% 증가한다.',
    rarity: 'epic',
    effects: [{ type: 'boss_damage_bonus', multiplier: 1.25 }],
  },
  {
    id: 'twin_wings',
    name: '쌍익 부적',
    description: '치명타 확률이 10% 증가하고 미스가 발생하지 않는다.',
    rarity: 'legendary',
    effects: [
      { type: 'crit_chance_bonus', amount: 0.10 },
      { type: 'miss_immunity' },
    ],
  },
  {
    id: 'frost_gem',
    name: '빙성 보석',
    description: '수계 속성 공격의 피해가 25% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_damage', element: 'water', multiplier: 1.25 }],
  },
  // ── 조합 전용 (Craft-only) 아이템 ────────────────────────────────────────
  {
    id: 'dragon_blade',
    name: '용혈검 아르데라',
    description: '공격력이 60 증가하고 화염 속성 공격의 피해가 30% 증가한다.',
    rarity: 'legendary',
    effects: [
      { type: 'stat_boost', stat: 'attack', amount: 60 },
      { type: 'elemental_damage', element: 'fire', multiplier: 1.30 },
    ],
  },
  {
    id: 'immortal_armor',
    name: '불사 성갑',
    description: '방어력이 60 증가하고 전투 중 첫 사망 시 HP 1로 살아남는다.',
    rarity: 'legendary',
    effects: [
      { type: 'stat_boost', stat: 'defense', amount: 60 },
      { type: 'death_prevention' },
    ],
  },
  {
    id: 'archmage_tome',
    name: '대마도 금서',
    description: '매 턴 MP를 20 회복한다.',
    rarity: 'legendary',
    effects: [{ type: 'mp_regen', amount: 20 }],
  },
  {
    id: 'night_blade',
    name: '야영검 녹스',
    description: '공격력이 70 증가하고 어둠 속성 공격의 피해가 30% 증가한다.',
    rarity: 'legendary',
    effects: [
      { type: 'stat_boost', stat: 'attack', amount: 70 },
      { type: 'elemental_damage', element: 'dark', multiplier: 1.30 },
    ],
  },
  {
    id: 'life_crystal',
    name: '생명의 청홍정',
    description: '최대 HP가 350 증가하고 매 턴 MP를 8 회복한다.',
    rarity: 'epic',
    effects: [
      { type: 'stat_boost', stat: 'maxHp', amount: 350 },
      { type: 'mp_regen', amount: 8 },
    ],
  },
  {
    id: 'pyroclast_orb',
    name: '화산탄 성구',
    description: '화염 속성 공격의 피해가 40% 증가하고 물리 속성 공격의 피해가 25% 증가한다.',
    rarity: 'legendary',
    effects: [
      { type: 'elemental_damage', element: 'fire', multiplier: 1.40 },
      { type: 'elemental_damage', element: 'physical', multiplier: 1.25 },
    ],
  },

  // ── 신규 아이템 ────────────────────────────────────────────────
  {
    id: 'sacred_lance',
    name: '성백창 리제아',
    description: '빛 속성 공격의 피해가 30% 증가하고 공격력이 60 증가한다.',
    rarity: 'legendary',
    effects: [
      { type: 'elemental_damage', element: 'light', multiplier: 1.30 },
      { type: 'stat_boost', stat: 'attack', amount: 60 },
    ],
  },
  {
    id: 'glacial_crown',
    name: '빙하성 왕관',
    description: '수계 속성 공격의 피해가 40% 증가하고 물리 속성 공격의 피해가 20% 증가한다.',
    rarity: 'legendary',
    effects: [
      { type: 'elemental_damage', element: 'water', multiplier: 1.40 },
      { type: 'elemental_damage', element: 'physical', multiplier: 1.20 },
    ],
  },
  {
    id: 'bloodstone_ring',
    name: '혈석 계약반지',
    description: '공격력이 40 증가하고 어둠 속성 공격 시 피해의 15%를 HP로 흡수한다.',
    rarity: 'epic',
    effects: [
      { type: 'stat_boost', stat: 'attack', amount: 40 },
      { type: 'lifesteal', element: 'dark', percent: 0.15 },
    ],
  },
  {
    id: 'speed_talisman',
    name: '순풍 부적',
    description: '속도가 30 증가하고 치명타 확률이 7% 증가한다.',
    rarity: 'rare',
    effects: [
      { type: 'stat_boost', stat: 'speed', amount: 30 },
      { type: 'crit_chance_bonus', amount: 0.07 },
    ],
  },
  {
    id: 'champion_belt',
    name: '투기장 허리띠',
    description: '최대 HP가 250 증가하고 공격력이 30 증가한다.',
    rarity: 'rare',
    effects: [
      { type: 'stat_boost', stat: 'maxHp', amount: 250 },
      { type: 'stat_boost', stat: 'attack', amount: 30 },
    ],
  },
  {
    id: 'grand_tome',
    name: '마도원전',
    description: '매 턴 MP가 12 회복되고 스킬 쿨다운이 1 감소한다.',
    rarity: 'epic',
    effects: [
      { type: 'mp_regen', amount: 12 },
      { type: 'skill_cooldown_reduce', amount: 1 },
    ],
  },
  {
    id: 'stun_ward',
    name: '정신 방호부',
    description: '방어력이 30 증가하고 기절 및 방어력 감소 상태이상에 면역이 된다.',
    rarity: 'rare',
    effects: [
      { type: 'stat_boost', stat: 'defense', amount: 30 },
      { type: 'status_immunity', statuses: ['stun', 'defdown'] },
    ],
  },
  {
    id: 'warrior_seal',
    name: '용병대 인장',
    description: '공격력이 60 증가하지만 매 턴 HP가 10 감소한다.',
    rarity: 'epic',
    effects: [
      { type: 'stat_boost', stat: 'attack', amount: 60 },
      { type: 'hp_drain_per_turn', amount: 10 },
    ],
  },
  {
    id: 'ancient_seal',
    name: '첨탑 봉인석',
    description: '모든 속성 공격의 피해가 20% 증가한다.',
    rarity: 'legendary',
    effects: [
      { type: 'elemental_damage', element: 'physical', multiplier: 1.20 },
      { type: 'elemental_damage', element: 'fire', multiplier: 1.20 },
      { type: 'elemental_damage', element: 'water', multiplier: 1.20 },
      { type: 'elemental_damage', element: 'dark', multiplier: 1.20 },
      { type: 'elemental_damage', element: 'light', multiplier: 1.20 },
    ],
  },
  {
    id: 'void_crystal',
    name: '공허 결정',
    description: '어둠 속성 공격의 피해가 30% 증가하고 스킬 사용 시 8% 확률로 MP를 소모하지 않는다.',
    rarity: 'epic',
    effects: [
      { type: 'elemental_damage', element: 'dark', multiplier: 1.30 },
      { type: 'free_skill_chance', chance: 0.08 },
    ],
  },
]

export function getItemById(id: string): ItemDef | undefined {
  return ITEMS.find(i => i.id === id)
}
