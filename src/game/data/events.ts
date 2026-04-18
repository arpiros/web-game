/* ==========================================================================
   Dark Fantasy Roguelike — Event Definitions
   전투 사이에 등장하는 랜덤 이벤트 (라운드 2·4)
   ========================================================================== */

import type { EventDef } from '../types'

export const EVENTS: readonly EventDef[] = [
  {
    id: 'abandoned_campfire',
    name: '버려진 야영지',
    flavor: '불씨가 꺼져가는 야영지를 발견했다. 잠시 쉬어갈 수 있을 것 같다.',
    description: '모닥불 곁에서 잠시 피로를 풀 수 있다.',
    choices: [
      {
        id: 'rest_fully',
        label: '충분히 쉬어간다',
        description: 'HP를 최대치의 50%만큼 회복한다.',
        effects: [{ type: 'heal_hp', percent: 0.5 }],
      },
      {
        id: 'meditate',
        label: '명상을 통해 힘을 모은다',
        description: 'HP를 최대치의 20% 회복하고, 공격력이 영구적으로 +25 증가한다.',
        effects: [
          { type: 'heal_hp', percent: 0.2 },
          { type: 'stat_change', stat: 'attack', amount: 25 },
        ],
      },
    ],
  },
  {
    id: 'cursed_altar',
    name: '저주받은 제단',
    flavor: '어둑한 석제 제단 위에 빛나는 스킬 결정체가 놓여 있다. 하지만 무언가 불길한 기운이 감돈다.',
    description: '강력한 스킬을 얻을 수 있지만, 대가가 따른다.',
    choices: [
      {
        id: 'accept_curse',
        label: '저주를 받아들인다',
        description: 'Rare 등급 스킬 1장을 획득한다. 대신 최대 HP가 80 감소한다.',
        effects: [
          { type: 'gain_skill', rarity: 'rare' },
          { type: 'stat_change', stat: 'maxHp', amount: -80 },
        ],
      },
      {
        id: 'purify_altar',
        label: '제단을 정화한다',
        description: '제단을 파괴하여 저주를 봉인한다. 방어력이 영구적으로 +15 증가한다.',
        effects: [{ type: 'stat_change', stat: 'defense', amount: 15 }],
      },
    ],
  },
  {
    id: 'wandering_merchant',
    name: '떠돌이 상인',
    flavor: '"싸게 드리죠! 딱 하나 남았습니다!" 낡은 수레를 끄는 상인이 손짓한다.',
    description: '상인에게서 귀중한 물건을 구할 수 있다.',
    choices: [
      {
        id: 'buy_item',
        label: '물건을 구입한다',
        description: 'Rare 등급 아이템 1개를 획득한다.',
        effects: [{ type: 'gain_item', rarity: 'rare' }],
      },
      {
        id: 'buy_potion',
        label: '회복약을 구입한다',
        description: 'HP를 최대치의 35%만큼 회복한다.',
        effects: [{ type: 'heal_hp', percent: 0.35 }],
      },
    ],
  },
  {
    id: 'ancient_library',
    name: '고대 도서관 폐허',
    flavor: '잿더미 속에서도 글자들이 빛나고 있다. 옛 마법사들의 지식이 남아 있는 것 같다.',
    description: '고대의 비전 지식을 흡수할 수 있다.',
    choices: [
      {
        id: 'study_technique',
        label: '전투 기술을 연구한다',
        description: 'Epic 등급 스킬 1장을 획득한다. 대신 공격력이 -20 감소한다.',
        effects: [
          { type: 'gain_skill', rarity: 'epic' },
          { type: 'stat_change', stat: 'attack', amount: -20 },
        ],
      },
      {
        id: 'absorb_power',
        label: '마력을 흡수한다',
        description: 'HP를 최대치의 30% 회복하고 방어력이 +10 증가한다.',
        effects: [
          { type: 'heal_hp', percent: 0.3 },
          { type: 'stat_change', stat: 'defense', amount: 10 },
        ],
      },
    ],
  },
]

export function getEventById(id: string): EventDef | undefined {
  return EVENTS.find(e => e.id === id)
}
