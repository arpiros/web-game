import type { EnemyDef } from '../types'

export const ENEMIES: readonly EnemyDef[] = [
  {
    id: 'goblin',
    name: '고블린',
    description: '날카로운 단검으로 공격하는 작은 녀석.',
    element: 'physical',
    baseStats: { maxHp: 400, attack: 80, defense: 30, speed: 90 },
    actions: [
      { type: 'attack', element: 'physical', multiplier: 1.0, targetMode: 'random' },
    ],
    lore: '어두운 동굴에 사는 소형 몬스터.',
  },
  {
    id: 'orc_warrior',
    name: '오크 전사',
    description: '강력한 도끼를 휘두르는 오크.',
    element: 'physical',
    baseStats: { maxHp: 700, attack: 130, defense: 60, speed: 60 },
    actions: [
      { type: 'attack', element: 'physical', multiplier: 1.2, targetMode: 'highest_attack' },
      { type: 'buff_self', status: 'powerup', duration: 2, value: 40 },
    ],
    lore: '전투를 즐기는 오크 부족의 전사.',
  },
  {
    id: 'fire_imp',
    name: '화염 임프',
    description: '화염을 뿜어내는 소형 악마.',
    element: 'fire',
    baseStats: { maxHp: 500, attack: 110, defense: 25, speed: 100 },
    actions: [
      { type: 'attack', element: 'fire', multiplier: 1.0, targetMode: 'random' },
      { type: 'apply_status', status: 'burn', duration: 2, value: 10, targetMode: 'random' },
    ],
    lore: '불지옥에서 소환된 작은 악마.',
  },
  {
    id: 'shadow_wolf',
    name: '어둠 늑대',
    description: '독이 묻은 이빨로 공격하는 늑대.',
    element: 'dark',
    baseStats: { maxHp: 600, attack: 120, defense: 40, speed: 110 },
    actions: [
      { type: 'attack', element: 'dark', multiplier: 1.1, targetMode: 'lowest_hp' },
      { type: 'apply_status', status: 'poison', duration: 3, value: 8, targetMode: 'random' },
    ],
    lore: '어둠의 숲에 사는 저주받은 늑대.',
  },
  {
    id: 'ice_golem',
    name: '얼음 골렘',
    description: '단단한 얼음으로 이루어진 골렘. 느리지만 강력하다.',
    element: 'water',
    baseStats: { maxHp: 1200, attack: 160, defense: 120, speed: 30 },
    actions: [
      { type: 'attack', element: 'water', multiplier: 1.5, targetMode: 'random' },
      { type: 'apply_status', status: 'freeze', duration: 1, value: 0, targetMode: 'random' },
    ],
    lore: '빙하 지대에서 만들어진 마법의 골렘.',
  },
  {
    id: 'cursed_knight',
    name: '저주받은 기사',
    description: '어둠의 힘으로 강화된 타락한 기사.',
    element: 'dark',
    baseStats: { maxHp: 850, attack: 160, defense: 75, speed: 65 },
    actions: [
      { type: 'attack', element: 'dark', multiplier: 1.3, targetMode: 'highest_attack' },
      { type: 'apply_status', status: 'defdown', duration: 2, value: 20, targetMode: 'random' },
      { type: 'attack', element: 'dark', multiplier: 1.1, targetMode: 'random' },
      { type: 'heal_self', multiplier: 0.28 },
    ],
    lore: '빛을 잃고 어둠에 물든 성기사.',
  },
  {
    id: 'demon_mage',
    name: '악마 마법사',
    description: '강력한 마법으로 공격하는 악마족 마법사.',
    element: 'fire',
    baseStats: { maxHp: 800, attack: 200, defense: 50, speed: 85 },
    actions: [
      { type: 'attack_all', element: 'fire', multiplier: 0.8 },
      { type: 'apply_status', status: 'burn', duration: 2, value: 15, targetMode: 'all' },
      { type: 'attack', element: 'dark', multiplier: 1.8, targetMode: 'random' },
    ],
    lore: '마계에서 소환된 마법의 달인.',
  },
  {
    id: 'elder_troll',
    name: '장로 트롤',
    description: '강한 재생 능력을 가진 거대 트롤.',
    element: 'physical',
    baseStats: { maxHp: 2000, attack: 180, defense: 100, speed: 40 },
    actions: [
      { type: 'attack', element: 'physical', multiplier: 1.6, targetMode: 'random' },
      { type: 'heal_self', multiplier: 0.8 },
      { type: 'attack_all', element: 'physical', multiplier: 0.9 },
    ],
    lore: '수백 년을 산 고대 트롤. 엄청난 체력을 지닌다.',
  },
  {
    id: 'lich',
    name: '리치',
    description: '죽음을 넘어선 마법사. 전체 공격이 강력하다.',
    element: 'dark',
    baseStats: { maxHp: 1500, attack: 220, defense: 70, speed: 75 },
    actions: [
      { type: 'attack_all', element: 'dark', multiplier: 1.2 },
      { type: 'apply_status', status: 'poison', duration: 3, value: 12, targetMode: 'all' },
      { type: 'attack', element: 'dark', multiplier: 2.5, targetMode: 'lowest_hp' },
      { type: 'buff_self', status: 'powerup', duration: 2, value: 60 },
    ],
    lore: '불사의 힘을 얻은 고대 마법사.',
  },
  {
    id: 'dragon_lord',
    name: '용군주',
    description: '최강의 존재. HP에 따라 더욱 강력해지는 3단계 형태 변환을 한다.',
    element: 'fire',
    baseStats: { maxHp: 4000, attack: 300, defense: 150, speed: 70 },
    actions: [
      { type: 'attack_all', element: 'fire', multiplier: 1.5 },
      { type: 'attack', element: 'physical', multiplier: 2.2, targetMode: 'highest_attack' },
      { type: 'apply_status', status: 'burn', duration: 3, value: 25, targetMode: 'all' },
      { type: 'buff_self', status: 'powerup', duration: 3, value: 80 },
      { type: 'heal_self', multiplier: 0.6 },
    ],
    bossPhases: {
      phase2HpThreshold: 0.6,
      phase3HpThreshold: 0.3,
      phase2Actions: [
        { type: 'attack_all', element: 'fire', multiplier: 2.0 },
        { type: 'attack', element: 'physical', multiplier: 3.0, targetMode: 'highest_attack' },
        { type: 'apply_status', status: 'burn', duration: 4, value: 35, targetMode: 'all' },
        { type: 'buff_self', status: 'powerup', duration: 2, value: 100 },
      ],
      phase3Actions: [
        { type: 'attack_all', element: 'fire', multiplier: 2.0 },
        { type: 'apply_status', status: 'burn', duration: 5, value: 50, targetMode: 'all' },
        { type: 'attack', element: 'physical', multiplier: 4.0, targetMode: 'lowest_hp' },
        { type: 'attack_all', element: 'fire', multiplier: 1.8 },
        { type: 'buff_self', status: 'powerup', duration: 3, value: 120 },
      ],
    },
    lore: '세계를 불태운다는 전설의 용. 상처를 입을수록 더욱 광폭해진다.',
    isBoss: true,
  },
  {
    id: 'skeleton_archer',
    name: '스켈레톤 궁수',
    description: '빠르고 정확한 화살로 약점을 노리는 언데드 궁수.',
    element: 'physical',
    baseStats: { maxHp: 450, attack: 95, defense: 20, speed: 110 },
    actions: [
      { type: 'attack', element: 'physical', multiplier: 1.1, targetMode: 'lowest_hp' },
      { type: 'apply_status', status: 'defdown', duration: 2, value: 25, targetMode: 'random' },
    ],
    lore: '죽어서도 활시위를 당기는 저주받은 궁수.',
  },
  {
    id: 'flame_phoenix',
    name: '불꽃 피닉스',
    description: '불꽃 속에서 재생하는 전설의 새. 죽음 직전 폭발적인 열기를 방출한다.',
    element: 'fire',
    baseStats: { maxHp: 750, attack: 155, defense: 45, speed: 95 },
    actions: [
      { type: 'attack', element: 'fire', multiplier: 1.3, targetMode: 'random' },
      { type: 'attack_all', element: 'fire', multiplier: 0.9 },
      { type: 'heal_self', multiplier: 0.5 },
    ],
    lore: '화염에서 태어나 화염으로 돌아가는 불사의 새.',
  },
  {
    id: 'dark_vampire',
    name: '어둠 흡혈귀',
    description: '생명력을 빨아들이는 고귀한 흡혈귀. 약한 상대를 집중 사냥한다.',
    element: 'dark',
    baseStats: { maxHp: 820, attack: 165, defense: 65, speed: 85 },
    actions: [
      { type: 'attack', element: 'dark', multiplier: 1.4, targetMode: 'lowest_hp' },
      { type: 'heal_self', multiplier: 0.7 },
      { type: 'apply_status', status: 'defdown', duration: 3, value: 35, targetMode: 'random' },
    ],
    lore: '수백 년간 생명력을 흡수하며 살아온 고대 흡혈귀.',
  },
  {
    id: 'frost_giant',
    name: '서리 거인',
    description: '온몸이 얼음으로 뒤덮인 거대한 존재. 전체 공격으로 아군을 얼린다.',
    element: 'water',
    baseStats: { maxHp: 2600, attack: 230, defense: 145, speed: 35 },
    actions: [
      { type: 'attack_all', element: 'water', multiplier: 1.3 },
      { type: 'apply_status', status: 'freeze', duration: 1, value: 0, targetMode: 'all' },
      { type: 'attack', element: 'physical', multiplier: 1.9, targetMode: 'random' },
    ],
    lore: '빙하 깊숙이 잠들어 있던 원시 거인족.',
  },
  {
    id: 'poison_hydra',
    name: '독 하이드라',
    description: '여러 머리에서 독을 뿜는 거대 히드라. 머리가 잘려도 재생한다.',
    element: 'dark',
    baseStats: { maxHp: 2300, attack: 205, defense: 95, speed: 60 },
    actions: [
      { type: 'attack', element: 'physical', multiplier: 1.2, targetMode: 'random' },
      { type: 'apply_status', status: 'poison', duration: 4, value: 15, targetMode: 'all' },
      { type: 'attack_all', element: 'physical', multiplier: 0.85 },
      { type: 'heal_self', multiplier: 0.4 },
    ],
    lore: '독이 가득한 늪지대에 사는 다두 괴물.',
  },
  {
    id: 'void_lord',
    name: '공허 군주',
    description: '공허에서 소환된 절대적 존재. 방어력을 무너뜨리고 파티를 잠식한다.',
    element: 'dark',
    baseStats: { maxHp: 3500, attack: 285, defense: 135, speed: 60 },
    actions: [
      { type: 'attack_all', element: 'dark', multiplier: 1.3 },
      { type: 'apply_status', status: 'defdown', duration: 3, value: 50, targetMode: 'all' },
      { type: 'attack', element: 'dark', multiplier: 2.6, targetMode: 'highest_attack' },
      { type: 'buff_self', status: 'powerup', duration: 3, value: 70 },
      { type: 'heal_self', multiplier: 0.5 },
    ],
    lore: '세계의 끝에서 온 공허의 군주. 존재 자체가 재앙이다.',
    isBoss: true,
  },
]

// ---------------------------------------------------------------------------
// 엘리트 적 (라운드 3, 5에 등장 — 일반 적보다 강하고 보스보다 약함)
// ---------------------------------------------------------------------------

export const ELITE_ENEMIES: readonly EnemyDef[] = [
  {
    id: 'iron_golem',
    name: '강철 골렘',
    description: '마법으로 단조된 철의 거인. 두꺼운 방어를 뚫기 어렵다.',
    element: 'physical',
    tier: 'elite',
    baseStats: { maxHp: 1100, attack: 160, defense: 100, speed: 40 },
    actions: [
      { type: 'attack', element: 'physical', multiplier: 1.5, targetMode: 'highest_attack' },
      { type: 'attack_all', element: 'physical', multiplier: 0.8 },
      { type: 'buff_self', status: 'powerup', duration: 2, value: 50 },
    ],
    lore: '고대 연금술사가 만든 무적의 철 수호자. 한 번 명령을 받으면 멈추지 않는다.',
  },
  {
    id: 'shadow_stalker',
    name: '암흑 추적자',
    description: '어둠 속에서 나타나 급소를 노리는 암살자.',
    element: 'dark',
    tier: 'elite',
    baseStats: { maxHp: 950, attack: 165, defense: 55, speed: 130 },
    actions: [
      { type: 'attack', element: 'dark', multiplier: 1.6, targetMode: 'lowest_hp' },
      { type: 'apply_status', status: 'poison', duration: 3, value: 12, targetMode: 'random' },
      { type: 'apply_status', status: 'defdown', duration: 2, value: 40, targetMode: 'random' },
      { type: 'attack', element: 'physical', multiplier: 1.3, targetMode: 'highest_attack' },
    ],
    lore: '빛이 닿지 않는 곳에서 태어났다. 먹이가 약해지는 순간을 기다린다.',
  },
  {
    id: 'volcanic_wyvern',
    name: '화산 와이번',
    description: '화산의 열기를 몸에 두른 날개 달린 파충류.',
    element: 'fire',
    tier: 'elite',
    baseStats: { maxHp: 1050, attack: 160, defense: 70, speed: 85 },
    actions: [
      { type: 'attack_all', element: 'fire', multiplier: 1.2 },
      { type: 'apply_status', status: 'burn', duration: 3, value: 20, targetMode: 'all' },
      { type: 'attack', element: 'fire', multiplier: 1.8, targetMode: 'random' },
      { type: 'heal_self', multiplier: 0.5 },
    ],
    lore: '화산 심층에서 서식하는 아룡. 화염 브레스로 적을 소각시킨다.',
  },
]

// 라운드에 따른 적 선택 (낮은 라운드 = 약한 적)
const EARLY_ENEMY_IDS = ['goblin', 'fire_imp', 'shadow_wolf', 'skeleton_archer']
const MID_EASY_ENEMY_IDS = ['orc_warrior', 'ice_golem', 'flame_phoenix']
const MID_HARD_ENEMY_IDS = ['cursed_knight', 'demon_mage', 'dark_vampire']
const LATE_ENEMY_IDS = ['elder_troll', 'lich', 'frost_giant', 'poison_hydra', 'void_lord', 'dragon_lord']

export function getEnemyPoolForRound(round: number): readonly EnemyDef[] {
  if (round <= 2) {
    return ENEMIES.filter(e => EARLY_ENEMY_IDS.includes(e.id))
  }
  if (round === 3) {
    return ENEMIES.filter(e => [...EARLY_ENEMY_IDS, ...MID_EASY_ENEMY_IDS].includes(e.id))
  }
  if (round <= 5) {
    return ENEMIES.filter(e => [...EARLY_ENEMY_IDS, ...MID_EASY_ENEMY_IDS, ...MID_HARD_ENEMY_IDS].includes(e.id))
  }
  return ENEMIES.filter(e => [...MID_EASY_ENEMY_IDS, ...MID_HARD_ENEMY_IDS, ...LATE_ENEMY_IDS].includes(e.id))
}

export function getEliteEnemyPool(): readonly EnemyDef[] {
  return ELITE_ENEMIES
}

export function getEnemyById(id: string): EnemyDef | undefined {
  return ENEMIES.find(e => e.id === id) ?? ELITE_ENEMIES.find(e => e.id === id)
}
