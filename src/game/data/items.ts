import type { ItemDef } from '../types'

export const ITEMS: readonly ItemDef[] = [
  {
    id: 'iron_ring',
    name: '철의 반지',
    description: '공격력이 30 증가한다.',
    rarity: 'common',
    effects: [{ type: 'stat_boost', stat: 'attack', amount: 30 }],
  },
  {
    id: 'mana_crystal',
    name: '마나 수정',
    description: '매 턴 MP를 5 회복한다.',
    rarity: 'common',
    effects: [{ type: 'mp_regen', amount: 5 }],
  },
  {
    id: 'tough_armor',
    name: '강철 갑옷',
    description: '방어력이 40 증가한다.',
    rarity: 'common',
    effects: [{ type: 'stat_boost', stat: 'defense', amount: 40 }],
  },
  {
    id: 'vitality_gem',
    name: '생명력 보석',
    description: '최대 HP가 200 증가한다.',
    rarity: 'common',
    effects: [{ type: 'stat_boost', stat: 'maxHp', amount: 200 }],
  },
  {
    id: 'swift_boots',
    name: '질풍의 장화',
    description: '속도가 20 증가한다.',
    rarity: 'common',
    effects: [{ type: 'stat_boost', stat: 'speed', amount: 20 }],
  },
  {
    id: 'whetstone',
    name: '숫돌',
    description: '물리 속성 공격의 피해가 15% 증가한다.',
    rarity: 'common',
    effects: [{ type: 'elemental_damage', element: 'physical', multiplier: 1.15 }],
  },
  {
    id: 'executioner_axe',
    name: '처형자의 도끼',
    description: '적을 처치할 때 HP를 50 회복한다.',
    rarity: 'rare',
    effects: [{ type: 'heal_on_kill', amount: 50 }],
  },
  {
    id: 'flame_shard',
    name: '화염 파편',
    description: '화염 속성 공격의 피해가 25% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_damage', element: 'fire', multiplier: 1.25 }],
  },
  {
    id: 'shadow_gem',
    name: '어둠의 보석',
    description: '어둠 속성 공격의 피해가 25% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_damage', element: 'dark', multiplier: 1.25 }],
  },
  {
    id: 'holy_symbol',
    name: '성스러운 문장',
    description: '빛 속성 공격의 피해가 25% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_damage', element: 'light', multiplier: 1.25 }],
  },
  {
    id: 'tide_pendant',
    name: '조류의 목걸이',
    description: '수계 속성 공격의 피해가 20% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_damage', element: 'water', multiplier: 1.20 }],
  },
  {
    id: 'cooldown_watch',
    name: '마법의 회중시계',
    description: '모든 스킬의 쿨다운이 1 감소한다.',
    rarity: 'rare',
    effects: [{ type: 'skill_cooldown_reduce', amount: 1 }],
  },
  {
    id: 'berserker_heart',
    name: '광전사의 심장',
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
    name: '비전의 마법서',
    description: '매 턴 MP를 10 회복한다.',
    rarity: 'rare',
    effects: [{ type: 'mp_regen', amount: 10 }],
  },
  {
    id: 'dragonscale',
    name: '용의 비늘',
    description: '공격력과 방어력이 각각 50 증가한다.',
    rarity: 'epic',
    effects: [
      { type: 'stat_boost', stat: 'attack', amount: 50 },
      { type: 'stat_boost', stat: 'defense', amount: 50 },
    ],
  },
  {
    id: 'titan_heart',
    name: '타이탄의 심장',
    description: '최대 HP가 500 증가하고 방어력이 30 증가한다.',
    rarity: 'epic',
    effects: [
      { type: 'stat_boost', stat: 'maxHp', amount: 500 },
      { type: 'stat_boost', stat: 'defense', amount: 30 },
    ],
  },
  {
    id: 'death_mask',
    name: '죽음의 가면',
    description: '공격력이 100 증가한다. 전설급 아이템.',
    rarity: 'legendary',
    effects: [{ type: 'stat_boost', stat: 'attack', amount: 100 }],
  },
  // ── 신규 아이템 (Phase 2-2) ──────────────────────────────────────────────
  {
    id: 'vampire_ring',
    name: '흡혈 반지',
    description: '물리 공격으로 가한 피해의 10%를 HP로 흡수한다.',
    rarity: 'rare',
    effects: [{ type: 'lifesteal', element: 'physical', percent: 0.10 }],
  },
  {
    id: 'ancient_scroll',
    name: '고대의 두루마리',
    description: '스킬 사용 시 5% 확률로 MP 소비가 무료가 된다.',
    rarity: 'rare',
    effects: [{ type: 'free_skill_chance', chance: 0.05 }],
  },
  {
    id: 'elemental_core',
    name: '원소의 핵',
    description: '캐릭터 고유 원소와 같은 속성 스킬의 피해가 20% 증가한다.',
    rarity: 'rare',
    effects: [{ type: 'elemental_match_damage', multiplier: 1.20 }],
  },
  {
    id: 'storm_cloak',
    name: '폭풍의 망토',
    description: '속도가 40 증가하고 치명타 확률이 5% 증가한다.',
    rarity: 'rare',
    effects: [
      { type: 'stat_boost', stat: 'speed', amount: 40 },
      { type: 'crit_chance_bonus', amount: 0.05 },
    ],
  },
  {
    id: 'cursed_necklace',
    name: '저주의 목걸이',
    description: '공격력이 80 증가하지만 매 턴 HP가 15 감소한다.',
    rarity: 'epic',
    effects: [
      { type: 'stat_boost', stat: 'attack', amount: 80 },
      { type: 'hp_drain_per_turn', amount: 15 },
    ],
  },
  {
    id: 'revival_potion',
    name: '불사의 묘약',
    description: '전투 중 처음 사망 시 HP 1로 버티고 살아남는다.',
    rarity: 'epic',
    effects: [{ type: 'death_prevention' }],
  },
  {
    id: 'magic_antidote',
    name: '마법 해독제',
    description: '독, 화상, 빙결 상태이상에 면역이 된다.',
    rarity: 'rare',
    effects: [{ type: 'status_immunity', statuses: ['poison', 'burn', 'freeze'] }],
  },
  {
    id: 'time_sand',
    name: '시간의 모래',
    description: '모든 스킬의 쿨다운이 2턴 감소한다.',
    rarity: 'epic',
    effects: [{ type: 'skill_cooldown_reduce', amount: 2 }],
  },
  {
    id: 'heroes_crest',
    name: '용사의 문장',
    description: '보스에게 가하는 피해가 25% 증가한다.',
    rarity: 'epic',
    effects: [{ type: 'boss_damage_bonus', multiplier: 1.25 }],
  },
  {
    id: 'twin_wings',
    name: '쌍둥이 날개',
    description: '치명타 확률이 10% 증가하고 미스가 발생하지 않는다.',
    rarity: 'legendary',
    effects: [
      { type: 'crit_chance_bonus', amount: 0.10 },
      { type: 'miss_immunity' },
    ],
  },
]

export function getItemById(id: string): ItemDef | undefined {
  return ITEMS.find(i => i.id === id)
}
