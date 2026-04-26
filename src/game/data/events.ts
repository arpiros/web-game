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
  {
    id: 'fallen_hero',
    name: '쓰러진 영웅',
    flavor: '전장에 쓰러진 기사의 유해 곁에 낡은 갑옷과 무기가 남아 있다.',
    description: '쓰러진 영웅의 유물을 취할 수 있다.',
    choices: [
      {
        id: 'take_equipment',
        label: '장비를 취한다',
        description: '공격력 +20, 방어력 +10이 영구 증가한다.',
        effects: [
          { type: 'stat_change', stat: 'attack', amount: 20 },
          { type: 'stat_change', stat: 'defense', amount: 10 },
        ],
      },
      {
        id: 'pray_for_hero',
        label: '영웅을 위해 기도한다',
        description: '영웅의 기억에서 Rare 등급 스킬 1장을 전수받는다.',
        effects: [{ type: 'gain_skill', rarity: 'rare' }],
      },
    ],
  },
  {
    id: 'mysterious_spring',
    name: '신비로운 샘',
    flavor: '숲 속 깊은 곳에서 맑은 물이 솟아오른다. 기묘한 빛이 물속에서 일렁인다.',
    description: '신비로운 샘물로 몸을 회복할 수 있다.',
    choices: [
      {
        id: 'dive_in',
        label: '풍덩 뛰어든다',
        description: 'HP를 최대치의 60%만큼 회복한다.',
        effects: [{ type: 'heal_hp', percent: 0.6 }],
      },
      {
        id: 'drink_carefully',
        label: '조심스럽게 물을 마신다',
        description: 'HP를 30% 회복하고, 최대 HP +100, 공격력 -10이 영구 적용된다.',
        effects: [
          { type: 'heal_hp', percent: 0.3 },
          { type: 'stat_change', stat: 'maxHp', amount: 100 },
          { type: 'stat_change', stat: 'attack', amount: -10 },
        ],
      },
    ],
  },
  {
    id: 'dark_pact',
    name: '어둠과의 계약',
    flavor: '어둠 속에서 속삭임이 들려온다. "힘을 원한다면… 대가를 치러라."',
    description: '어둠의 존재와 계약하여 힘을 얻을 수 있다.',
    choices: [
      {
        id: 'accept_pact',
        label: '계약한다',
        description: 'Epic 등급 스킬 1장을 획득한다. 대신 최대 HP가 100 감소한다.',
        effects: [
          { type: 'gain_skill', rarity: 'epic' },
          { type: 'stat_change', stat: 'maxHp', amount: -100 },
        ],
      },
      {
        id: 'reject_and_plunder',
        label: '거절하고 힘만 빼앗는다',
        description: '공격력 +30, 방어력 -20이 영구 적용된다.',
        effects: [
          { type: 'stat_change', stat: 'attack', amount: 30 },
          { type: 'stat_change', stat: 'defense', amount: -20 },
        ],
      },
    ],
  },
  {
    id: 'ancestral_shrine',
    name: '조상의 신사',
    flavor: '오래된 신사 앞에 공물이 놓여 있다. 조상의 기운이 느껴진다.',
    description: '조상의 가호를 받거나 유물을 가져갈 수 있다.',
    choices: [
      {
        id: 'offer_prayer',
        label: '경배를 올린다',
        description: '방어력이 영구적으로 +25 증가한다.',
        effects: [{ type: 'stat_change', stat: 'defense', amount: 25 }],
      },
      {
        id: 'take_relic',
        label: '유물을 가져간다',
        description: 'Rare 등급 아이템 1개를 획득한다. 최대 HP가 50 감소한다.',
        effects: [
          { type: 'gain_item', rarity: 'rare' },
          { type: 'stat_change', stat: 'maxHp', amount: -50 },
        ],
      },
    ],
  },
]

export function getEventById(id: string): EventDef | undefined {
  return EVENTS.find(e => e.id === id)
}
