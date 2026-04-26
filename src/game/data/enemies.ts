import type { EnemyDef } from '../types'

export const ENEMIES: readonly EnemyDef[] = [
  {
    id: 'goblin',
    name: '고블린',
    description: '날카로운 단검으로 공격하는 작은 녀석.',
    element: 'physical',
    baseStats: { maxHp: 400, attack: 70, defense: 30, speed: 90 },
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
    baseStats: { maxHp: 700, attack: 110, defense: 60, speed: 60 },
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
    baseStats: { maxHp: 500, attack: 95, defense: 25, speed: 100 },
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
    baseStats: { maxHp: 600, attack: 100, defense: 40, speed: 110 },
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
    baseStats: { maxHp: 1200, attack: 135, defense: 120, speed: 30 },
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
    baseStats: { maxHp: 850, attack: 135, defense: 75, speed: 65 },
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
    baseStats: { maxHp: 800, attack: 170, defense: 50, speed: 85 },
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
    baseStats: { maxHp: 2000, attack: 155, defense: 100, speed: 40 },
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
    baseStats: { maxHp: 1500, attack: 185, defense: 70, speed: 75 },
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
    baseStats: { maxHp: 4000, attack: 255, defense: 150, speed: 70 },
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
    baseStats: { maxHp: 450, attack: 80, defense: 20, speed: 110 },
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
    baseStats: { maxHp: 750, attack: 130, defense: 45, speed: 95 },
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
    baseStats: { maxHp: 820, attack: 140, defense: 65, speed: 85 },
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
    baseStats: { maxHp: 2600, attack: 195, defense: 145, speed: 35 },
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
    baseStats: { maxHp: 2300, attack: 175, defense: 95, speed: 60 },
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
    baseStats: { maxHp: 3500, attack: 240, defense: 135, speed: 60 },
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
// 미니보스 적 (라운드 8, 14, 19, 27 단독 등장 — 엘리트보다 강하고 보스보다 약함)
// ---------------------------------------------------------------------------

export const MINI_BOSS_ENEMIES: readonly EnemyDef[] = [
  {
    id: 'warlord',
    name: '전쟁군주',
    description: '수많은 전장을 누빈 전쟁의 화신. 자신을 강화할수록 위협적으로 변한다.',
    element: 'physical',
    tier: 'elite',
    baseStats: { maxHp: 2200, attack: 190, defense: 90, speed: 75 },
    actions: [
      { type: 'attack', element: 'physical', multiplier: 1.8, targetMode: 'highest_attack' },
      { type: 'buff_self', status: 'powerup', duration: 3, value: 60 },
      { type: 'attack_all', element: 'physical', multiplier: 1.0 },
      { type: 'attack', element: 'physical', multiplier: 2.2, targetMode: 'lowest_hp' },
      { type: 'apply_status', status: 'defdown', duration: 2, value: 40, targetMode: 'all' },
    ],
    lore: '패배를 모르는 장수. 피를 볼수록 강해진다.',
    isBoss: true,
  },
  {
    id: 'plague_witch',
    name: '역병 마녀',
    description: '오염된 마법으로 독과 화염을 뒤섞는 어둠의 술사.',
    element: 'dark',
    tier: 'elite',
    baseStats: { maxHp: 1900, attack: 200, defense: 70, speed: 95 },
    actions: [
      { type: 'apply_status', status: 'poison', duration: 4, value: 15, targetMode: 'all' },
      { type: 'attack', element: 'dark', multiplier: 1.6, targetMode: 'random' },
      { type: 'apply_status', status: 'burn', duration: 3, value: 20, targetMode: 'all' },
      { type: 'attack_all', element: 'dark', multiplier: 1.2 },
      { type: 'heal_self', multiplier: 0.3 },
    ],
    lore: '세상의 질병을 모두 수집한 마녀. 그녀가 지나간 자리엔 꽃도 피지 않는다.',
    isBoss: true,
  },
  {
    id: 'frost_wyrm',
    name: '서리 와이번',
    description: '빙하를 서식지로 삼는 거대한 냉기 용. 접근을 차단하며 파티를 얼린다.',
    element: 'water',
    tier: 'elite',
    baseStats: { maxHp: 2500, attack: 170, defense: 110, speed: 55 },
    actions: [
      { type: 'attack_all', element: 'water', multiplier: 1.1 },
      { type: 'apply_status', status: 'freeze', duration: 2, value: 0, targetMode: 'random' },
      { type: 'apply_status', status: 'freeze', duration: 2, value: 0, targetMode: 'random' },
      { type: 'attack', element: 'water', multiplier: 2.4, targetMode: 'highest_attack' },
      { type: 'buff_self', status: 'powerup', duration: 2, value: 50 },
    ],
    lore: '영원한 겨울을 몰고 다니는 와이번. 그 숨결이 닿으면 모든 것이 얼어붙는다.',
    isBoss: true,
  },
]

// ---------------------------------------------------------------------------
// 엘리트 적 (라운드 5, 10에 등장 — 일반 적보다 강하고 보스보다 약함)
// ---------------------------------------------------------------------------

export const ELITE_ENEMIES: readonly EnemyDef[] = [
  {
    id: 'iron_golem',
    name: '강철 골렘',
    description: '마법으로 단조된 철의 거인. 두꺼운 방어를 뚫기 어렵다.',
    element: 'physical',
    tier: 'elite',
    baseStats: { maxHp: 1100, attack: 135, defense: 100, speed: 40 },
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
    baseStats: { maxHp: 950, attack: 140, defense: 55, speed: 130 },
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
    baseStats: { maxHp: 1050, attack: 135, defense: 70, speed: 85 },
    actions: [
      { type: 'attack_all', element: 'fire', multiplier: 1.2 },
      { type: 'apply_status', status: 'burn', duration: 3, value: 20, targetMode: 'all' },
      { type: 'attack', element: 'fire', multiplier: 1.8, targetMode: 'random' },
      { type: 'heal_self', multiplier: 0.5 },
    ],
    lore: '화산 심층에서 서식하는 아룡. 화염 브레스로 적을 소각시킨다.',
  },
  {
    id: 'storm_giant',
    name: '폭풍 거인',
    description: '번개를 휘두르는 거대한 엘리트 존재.',
    element: 'light',
    tier: 'elite',
    baseStats: { maxHp: 1200, attack: 150, defense: 85, speed: 70 },
    actions: [
      { type: 'attack_all', element: 'light', multiplier: 1.1 },
      { type: 'apply_status', status: 'stun', duration: 1, value: 0, targetMode: 'all' },
      { type: 'attack', element: 'light', multiplier: 1.9, targetMode: 'random' },
    ],
    lore: '폭풍의 화신. 그 일격은 천지를 가른다.',
  },
  {
    id: 'corrupted_paladin',
    name: '타락한 성기사',
    description: '어둠에 물든 성기사. 강력한 암흑 공격과 자기 치유를 겸비한다.',
    element: 'dark',
    tier: 'elite',
    baseStats: { maxHp: 1100, attack: 155, defense: 90, speed: 65 },
    actions: [
      { type: 'attack', element: 'dark', multiplier: 1.5, targetMode: 'highest_attack' },
      { type: 'apply_status', status: 'defdown', duration: 2, value: 35, targetMode: 'random' },
      { type: 'heal_self', multiplier: 0.4 },
      { type: 'buff_self', status: 'powerup', duration: 2, value: 40 },
    ],
    lore: '성전의 영웅이었으나 금단의 힘에 손을 뻗었다.',
  },
]

// ── 신규 일반 적 ────────────────────────────────────────────────
const ENEMIES_EXTRA: readonly EnemyDef[] = [
  {
    id: 'thunder_drake',
    name: '번개 드래곤',
    description: '번개를 뿜어내는 소형 용족.',
    element: 'fire',
    tier: 'normal',
    baseStats: { maxHp: 1100, attack: 170, defense: 70, speed: 90 },
    actions: [
      { type: 'attack', element: 'fire', multiplier: 1.4, targetMode: 'random' },
      { type: 'attack_all', element: 'fire', multiplier: 0.9 },
      { type: 'apply_status', status: 'burn', duration: 2, value: 18, targetMode: 'all' },
    ],
    lore: '화염과 번개를 동시에 내뿜는 희귀한 용족.',
  },
  {
    id: 'sea_serpent',
    name: '바다 뱀',
    description: '심해에서 올라온 거대한 수계 괴수.',
    element: 'water',
    tier: 'normal',
    baseStats: { maxHp: 1400, attack: 150, defense: 110, speed: 70 },
    actions: [
      { type: 'attack', element: 'water', multiplier: 1.3, targetMode: 'random' },
      { type: 'apply_status', status: 'freeze', duration: 1, value: 0, targetMode: 'all' },
      { type: 'attack_all', element: 'water', multiplier: 0.8 },
    ],
    lore: '고대 해저에서 깨어난 뱀. 보는 이를 공포에 빠뜨린다.',
  },
  {
    id: 'abyssal_horror',
    name: '심연의 공포',
    description: '심연에서 태어난 어둠의 존재. 전체 공격과 방어력 감소를 구사한다.',
    element: 'dark',
    tier: 'normal',
    baseStats: { maxHp: 1800, attack: 185, defense: 90, speed: 55 },
    actions: [
      { type: 'attack_all', element: 'dark', multiplier: 1.1 },
      { type: 'apply_status', status: 'defdown', duration: 3, value: 40, targetMode: 'all' },
      { type: 'attack', element: 'dark', multiplier: 2.2, targetMode: 'lowest_hp' },
    ],
    lore: '어둠 그 자체가 형상을 이룬 것. 이름을 부르면 반응한다.',
  },
  {
    id: 'celestial_sentinel',
    name: '천상의 파수꾼',
    description: '빛의 신전을 지키는 불사의 전사.',
    element: 'light',
    tier: 'normal',
    baseStats: { maxHp: 1600, attack: 160, defense: 130, speed: 50 },
    actions: [
      { type: 'attack', element: 'light', multiplier: 1.5, targetMode: 'highest_attack' },
      { type: 'buff_self', status: 'powerup', duration: 2, value: 50 },
      { type: 'heal_self', multiplier: 0.4 },
    ],
    lore: '신성한 성역의 수호자. 침입자를 용서하지 않는다.',
  },
  {
    id: 'bone_colossus',
    name: '뼈 거신',
    description: '무수한 뼈로 이루어진 거대한 언데드. 압도적인 체력과 방어력을 자랑한다.',
    element: 'physical',
    tier: 'normal',
    baseStats: { maxHp: 2200, attack: 180, defense: 120, speed: 35 },
    actions: [
      { type: 'attack', element: 'physical', multiplier: 1.8, targetMode: 'random' },
      { type: 'attack_all', element: 'physical', multiplier: 0.9 },
      { type: 'buff_self', status: 'powerup', duration: 2, value: 60 },
    ],
    lore: '전쟁터에 쌓인 영혼들이 하나의 거구를 이루었다.',
  },
  {
    id: 'tidal_serpent',
    name: '조류 바다뱀',
    description: '강력한 물의 기운을 두른 심해 뱀. 냉기와 방어력 감소로 파티를 잠식한다.',
    element: 'water',
    tier: 'normal',
    baseStats: { maxHp: 1400, attack: 145, defense: 80, speed: 90 },
    actions: [
      { type: 'attack', element: 'water', multiplier: 1.3, targetMode: 'random' },
      { type: 'apply_status', status: 'freeze', duration: 1, value: 0, targetMode: 'random' },
      { type: 'attack_all', element: 'water', multiplier: 0.85 },
      { type: 'apply_status', status: 'defdown', duration: 2, value: 20, targetMode: 'random' },
    ],
    lore: '해류를 타고 나타나는 심해의 뱀. 조류를 자유롭게 조종한다.',
  },
  {
    id: 'radiant_guardian',
    name: '빛의 수호자',
    description: '신성한 빛으로 무장한 강력한 수호자. 스턴과 자기 강화를 구사한다.',
    element: 'light',
    tier: 'normal',
    baseStats: { maxHp: 2200, attack: 170, defense: 100, speed: 50 },
    actions: [
      { type: 'attack', element: 'light', multiplier: 1.6, targetMode: 'highest_attack' },
      { type: 'apply_status', status: 'stun', duration: 1, value: 0, targetMode: 'random' },
      { type: 'buff_self', status: 'powerup', duration: 2, value: 60 },
      { type: 'heal_self', multiplier: 0.35 },
    ],
    lore: '고대 신전의 영원한 수호자. 빛이 닿는 한 죽지 않는다.',
  },
]

// 모든 일반 적 = 기존 ENEMIES + 신규
const ALL_ENEMIES: readonly EnemyDef[] = [...ENEMIES, ...ENEMIES_EXTRA]

// 라운드에 따른 적 선택 (낮은 라운드 = 약한 적)
const EARLY_ENEMY_IDS = ['goblin', 'fire_imp', 'shadow_wolf', 'skeleton_archer']
const MID_EASY_ENEMY_IDS = ['orc_warrior', 'ice_golem', 'flame_phoenix', 'thunder_drake', 'sea_serpent']
const MID_HARD_ENEMY_IDS = ['cursed_knight', 'demon_mage', 'dark_vampire', 'tidal_serpent']
const LATE_ENEMY_IDS = ['elder_troll', 'lich', 'frost_giant', 'poison_hydra', 'abyssal_horror', 'celestial_sentinel', 'bone_colossus', 'radiant_guardian']
// void_lord·dragon_lord는 R13+ 전용 — 조기 스폰 시 R6 스케일(×1.15)에서 즉사 위험
const LATE_BOSS_TIER_IDS = ['void_lord', 'dragon_lord']

export function getEnemyPoolForRound(round: number): readonly EnemyDef[] {
  if (round <= 2) {
    return ALL_ENEMIES.filter(e => EARLY_ENEMY_IDS.includes(e.id))
  }
  if (round === 3) {
    return ALL_ENEMIES.filter(e => [...EARLY_ENEMY_IDS, ...MID_EASY_ENEMY_IDS].includes(e.id))
  }
  if (round <= 5) {
    return ALL_ENEMIES.filter(e => [...EARLY_ENEMY_IDS, ...MID_EASY_ENEMY_IDS, ...MID_HARD_ENEMY_IDS].includes(e.id))
  }
  if (round <= 9) {
    return ALL_ENEMIES.filter(e => [...MID_EASY_ENEMY_IDS, ...MID_HARD_ENEMY_IDS].includes(e.id))
  }
  if (round >= 13) {
    return ALL_ENEMIES.filter(e => [...MID_HARD_ENEMY_IDS, ...LATE_ENEMY_IDS, ...LATE_BOSS_TIER_IDS].includes(e.id))
  }
  return ALL_ENEMIES.filter(e => [...MID_HARD_ENEMY_IDS, ...LATE_ENEMY_IDS].includes(e.id))
}

export function getEliteEnemyPool(): readonly EnemyDef[] {
  return ELITE_ENEMIES
}

export function getEnemyById(id: string): EnemyDef | undefined {
  return ALL_ENEMIES.find(e => e.id === id) ?? ELITE_ENEMIES.find(e => e.id === id) ?? MINI_BOSS_ENEMIES.find(e => e.id === id)
}
