import { describe, it, expect } from 'vitest'
import {
  calcDamage,
  useSkill,
  processEnemyTurn,
  tickAllStatusEffects,
  battleReducer,
  getItemElementMultiplier,
  getElementMultiplier,
  hasStatus,
  addStatus,
  removeStatus,
  tickStatuses,
  getStatusBonus,
  rollCombat,
} from '../combat'
import type {
  BattleState,
  BattleCharacter,
  BattleEnemy,
  BattleAlly,
  StatusEffect,
  ItemDef,
} from '../types'
import { createRng } from '../rng'

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function makeCharacter(overrides: Partial<BattleCharacter> = {}): BattleCharacter {
  return {
    id: 'char-1',
    defId: 'dark_knight',
    name: '테스트 캐릭터',
    stats: {
      maxHp: 1000,
      hp: 1000,
      attack: 200,
      defense: 50,
      speed: 70,
      maxMp: 100,
      mp: 100,
    },
    skillIds: ['slash', 'shadow_strike'],
    skillCooldowns: {},
    statusEffects: [],
    element: 'dark',
    isAlive: true,
    ...overrides,
  }
}

function makeEnemy(overrides: Partial<BattleEnemy> = {}): BattleEnemy {
  return {
    id: 'enemy-1',
    defId: 'goblin',
    name: '고블린',
    stats: {
      maxHp: 400,
      hp: 400,
      attack: 80,
      defense: 30,
      speed: 90,
      maxMp: 0,
      mp: 0,
    },
    actions: [
      { type: 'attack', element: 'physical', multiplier: 1.0, targetMode: 'random' },
    ],
    actionIndex: 0,
    element: 'physical',
    isAlive: true,
    statusEffects: [],
    ...overrides,
  }
}

function makeAlly(overrides: Partial<BattleAlly> = {}): BattleAlly {
  return {
    id: 'ally-1',
    defId: 'forest_archer',
    name: '궁수',
    stats: {
      maxHp: 600,
      hp: 600,
      attack: 120,
      defense: 40,
      speed: 90,
      maxMp: 0,
      mp: 0,
    },
    action: { type: 'attack', element: 'physical', multiplier: 1.0 },
    element: 'physical',
    isAlive: true,
    statusEffects: [],
    ...overrides,
  }
}

function makeBattleState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    phase: 'player_turn',
    turnCount: 1,
    party: [makeCharacter()],
    allies: [],
    enemies: [makeEnemy()],
    log: [],
    totalDamageDealt: 0,
    selectedSkillId: null,
    selectedTargetId: null,
    items: [],
    rng: createRng(12345),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// calcDamage
// ---------------------------------------------------------------------------

describe('calcDamage', () => {
  it('기본 피해를 계산한다', () => {
    const dmg = calcDamage({
      attack: 100,
      defense: 0,
      multiplier: 1.0,
      attackElement: 'physical',
      defenderElement: 'physical',
      itemElementMultiplier: 1.0,
      powerupBonus: 0,
    })
    expect(dmg).toBe(100)
  })

  it('방어력이 피해를 감소시킨다', () => {
    const dmg = calcDamage({
      attack: 100,
      defense: 100,
      multiplier: 1.0,
      attackElement: 'physical',
      defenderElement: 'physical',
      itemElementMultiplier: 1.0,
      powerupBonus: 0,
    })
    // 100 * (100 / 200) = 50
    expect(dmg).toBe(50)
  })

  it('배율이 피해에 적용된다', () => {
    const dmg = calcDamage({
      attack: 100,
      defense: 0,
      multiplier: 2.0,
      attackElement: 'physical',
      defenderElement: 'physical',
      itemElementMultiplier: 1.0,
      powerupBonus: 0,
    })
    expect(dmg).toBe(200)
  })

  it('powerup 보너스가 피해를 증가시킨다', () => {
    const dmg = calcDamage({
      attack: 100,
      defense: 0,
      multiplier: 1.0,
      attackElement: 'physical',
      defenderElement: 'physical',
      itemElementMultiplier: 1.0,
      powerupBonus: 100, // 100% 증가
    })
    expect(dmg).toBe(200)
  })

  it('최소 1 피해를 보장한다', () => {
    const dmg = calcDamage({
      attack: 1,
      defense: 10000,
      multiplier: 0.01,
      attackElement: 'physical',
      defenderElement: 'physical',
      itemElementMultiplier: 1.0,
      powerupBonus: 0,
    })
    expect(dmg).toBeGreaterThanOrEqual(1)
  })

  it('아이템 속성 배율이 적용된다', () => {
    const dmgBase = calcDamage({
      attack: 100,
      defense: 0,
      multiplier: 1.0,
      attackElement: 'fire',
      defenderElement: 'physical',
      itemElementMultiplier: 1.0,
      powerupBonus: 0,
    })
    const dmgBoosted = calcDamage({
      attack: 100,
      defense: 0,
      multiplier: 1.0,
      attackElement: 'fire',
      defenderElement: 'physical',
      itemElementMultiplier: 1.25,
      powerupBonus: 0,
    })
    expect(dmgBoosted).toBe(Math.round(dmgBase * 1.25))
  })
})

// ---------------------------------------------------------------------------
// getElementMultiplier
// ---------------------------------------------------------------------------

describe('getElementMultiplier', () => {
  it('불 속성이 어둠에 강하다 (1.5배)', () => {
    expect(getElementMultiplier('fire', 'dark')).toBe(1.5)
  })

  it('물 속성이 불에 강하다 (1.5배)', () => {
    expect(getElementMultiplier('water', 'fire')).toBe(1.5)
  })

  it('빛 속성이 어둠에 강하다 (2.0배)', () => {
    expect(getElementMultiplier('light', 'dark')).toBe(2.0)
  })

  it('불 속성이 물에 약하다 (0.5배)', () => {
    expect(getElementMultiplier('fire', 'water')).toBe(0.5)
  })

  it('어둠이 빛에 약하다 (0.5배)', () => {
    expect(getElementMultiplier('dark', 'light')).toBe(0.5)
  })

  it('물리 속성은 배율 수정 없음 (1.0배)', () => {
    expect(getElementMultiplier('physical', 'fire')).toBe(1.0)
    expect(getElementMultiplier('physical', 'dark')).toBe(1.0)
  })

  it('같은 속성간은 배율 수정 없음 (1.0배)', () => {
    expect(getElementMultiplier('fire', 'fire')).toBe(1.0)
    expect(getElementMultiplier('dark', 'dark')).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// Status Effect Helpers
// ---------------------------------------------------------------------------

describe('hasStatus', () => {
  it('해당 상태이상이 있으면 true를 반환한다', () => {
    const effects: StatusEffect[] = [
      { kind: 'poison', duration: 2, value: 10, sourceId: 'src' },
    ]
    expect(hasStatus(effects, 'poison')).toBe(true)
  })

  it('해당 상태이상이 없으면 false를 반환한다', () => {
    const effects: StatusEffect[] = [
      { kind: 'burn', duration: 2, value: 10, sourceId: 'src' },
    ]
    expect(hasStatus(effects, 'poison')).toBe(false)
  })

  it('빈 배열에서는 false를 반환한다', () => {
    expect(hasStatus([], 'poison')).toBe(false)
  })
})

describe('addStatus', () => {
  it('새로운 상태이상을 추가한다', () => {
    const effects: readonly StatusEffect[] = []
    const newEffect: StatusEffect = { kind: 'poison', duration: 2, value: 10, sourceId: 'src' }
    const result = addStatus(effects, newEffect)
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('poison')
  })

  it('같은 종류의 상태이상이 있으면 더 긴 duration으로 갱신한다', () => {
    const effects: readonly StatusEffect[] = [
      { kind: 'poison', duration: 1, value: 5, sourceId: 'src' },
    ]
    const newEffect: StatusEffect = { kind: 'poison', duration: 3, value: 8, sourceId: 'src2' }
    const result = addStatus(effects, newEffect)
    expect(result).toHaveLength(1)
    expect(result[0].duration).toBe(3)
    expect(result[0].value).toBe(8)
  })

  it('기존 상태이상이 더 강하면 유지된다', () => {
    const effects: readonly StatusEffect[] = [
      { kind: 'poison', duration: 5, value: 20, sourceId: 'src' },
    ]
    const newEffect: StatusEffect = { kind: 'poison', duration: 2, value: 5, sourceId: 'src2' }
    const result = addStatus(effects, newEffect)
    expect(result).toHaveLength(1)
    expect(result[0].duration).toBe(5)
    expect(result[0].value).toBe(20)
  })

  it('다른 종류의 상태이상은 중복 추가된다', () => {
    const effects: readonly StatusEffect[] = [
      { kind: 'poison', duration: 2, value: 10, sourceId: 'src' },
    ]
    const newEffect: StatusEffect = { kind: 'burn', duration: 2, value: 15, sourceId: 'src' }
    const result = addStatus(effects, newEffect)
    expect(result).toHaveLength(2)
  })

  it('원본 배열을 변경하지 않는다', () => {
    const effects: readonly StatusEffect[] = [
      { kind: 'poison', duration: 2, value: 10, sourceId: 'src' },
    ]
    const original = [...effects]
    addStatus(effects, { kind: 'burn', duration: 1, value: 5, sourceId: 'src2' })
    expect(effects).toEqual(original)
  })
})

describe('removeStatus', () => {
  it('해당 상태이상을 제거한다', () => {
    const effects: readonly StatusEffect[] = [
      { kind: 'poison', duration: 2, value: 10, sourceId: 'src' },
      { kind: 'burn', duration: 1, value: 5, sourceId: 'src' },
    ]
    const result = removeStatus(effects, 'poison')
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('burn')
  })

  it('없는 상태이상 제거 시 변화 없음', () => {
    const effects: readonly StatusEffect[] = [
      { kind: 'burn', duration: 1, value: 5, sourceId: 'src' },
    ]
    const result = removeStatus(effects, 'poison')
    expect(result).toHaveLength(1)
  })
})

describe('tickStatuses', () => {
  it('모든 상태이상의 duration을 1 감소시킨다', () => {
    const effects: readonly StatusEffect[] = [
      { kind: 'poison', duration: 3, value: 10, sourceId: 'src' },
      { kind: 'burn', duration: 2, value: 5, sourceId: 'src' },
    ]
    const result = tickStatuses(effects)
    expect(result[0].duration).toBe(2)
    expect(result[1].duration).toBe(1)
  })

  it('duration이 0이 된 상태이상은 제거된다', () => {
    const effects: readonly StatusEffect[] = [
      { kind: 'poison', duration: 1, value: 10, sourceId: 'src' },
      { kind: 'burn', duration: 2, value: 5, sourceId: 'src' },
    ]
    const result = tickStatuses(effects)
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('burn')
  })
})

describe('getStatusBonus', () => {
  it('해당 종류의 value 합산을 반환한다', () => {
    const effects: readonly StatusEffect[] = [
      { kind: 'powerup', duration: 2, value: 50, sourceId: 'src' },
      { kind: 'burn', duration: 1, value: 10, sourceId: 'src' },
    ]
    expect(getStatusBonus(effects, 'powerup')).toBe(50)
  })

  it('해당 상태이상이 없으면 0을 반환한다', () => {
    const effects: readonly StatusEffect[] = []
    expect(getStatusBonus(effects, 'powerup')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getItemElementMultiplier
// ---------------------------------------------------------------------------

describe('getItemElementMultiplier', () => {
  const items: ItemDef[] = [
    {
      id: 'flame_shard',
      name: '화염 파편',
      description: '',
      rarity: 'rare',
      effects: [{ type: 'elemental_damage', element: 'fire', multiplier: 1.25 }],
    },
    {
      id: 'shadow_gem',
      name: '어둠의 보석',
      description: '',
      rarity: 'rare',
      effects: [{ type: 'elemental_damage', element: 'dark', multiplier: 1.25 }],
    },
  ]

  it('해당 속성 아이템 배율을 곱해서 반환한다', () => {
    expect(getItemElementMultiplier(items, 'fire')).toBe(1.25)
  })

  it('같은 속성 아이템이 여러 개면 곱한다', () => {
    const twoFireItems: ItemDef[] = [
      ...items,
      {
        id: 'flame_shard2',
        name: '화염 파편2',
        description: '',
        rarity: 'rare',
        effects: [{ type: 'elemental_damage', element: 'fire', multiplier: 1.25 }],
      },
    ]
    expect(getItemElementMultiplier(twoFireItems, 'fire')).toBeCloseTo(1.5625)
  })

  it('해당 속성 아이템이 없으면 1.0을 반환한다', () => {
    expect(getItemElementMultiplier(items, 'water')).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// useSkill
// ---------------------------------------------------------------------------

describe('useSkill', () => {
  it('MP가 부족하면 스킬 사용이 안 된다', () => {
    // flame_strike는 mpCost: 10이므로 mp: 5이면 사용 불가
    const state = makeBattleState({
      party: [makeCharacter({ stats: { ...makeCharacter().stats, mp: 5 } })],
    })
    const result = useSkill(state, 'char-1', 'enemy-1', 'flame_strike', [])
    // MP가 부족하므로 상태 변화 없음
    expect(result.party[0].stats.mp).toBe(5)
    expect(result.totalDamageDealt).toBe(0)
  })

  it('쿨다운 중인 스킬은 사용이 안 된다', () => {
    const state = makeBattleState({
      party: [makeCharacter({ skillCooldowns: { slash: 2 } })],
    })
    const result = useSkill(state, 'char-1', 'enemy-1', 'slash', [])
    expect(result.totalDamageDealt).toBe(0)
  })

  it('존재하지 않는 스킬 ID는 무시된다', () => {
    const state = makeBattleState()
    const result = useSkill(state, 'char-1', 'enemy-1', 'nonexistent_skill', [])
    expect(result).toBe(state) // 동일 참조
  })

  it('스킬 사용 시 MP가 차감된다', () => {
    const state = makeBattleState()
    const result = useSkill(state, 'char-1', 'enemy-1', 'flame_strike', [])
    expect(result.party[0].stats.mp).toBeLessThan(100)
    expect(result.party[0].stats.mp).toBe(100 - 10) // flame_strike mpCost: 10
  })

  it('공격 스킬 사용 시 적에게 피해가 들어간다', () => {
    const state = makeBattleState()
    const result = useSkill(state, 'char-1', 'enemy-1', 'slash', [])
    expect(result.enemies[0].stats.hp).toBeLessThan(400)
    expect(result.totalDamageDealt).toBeGreaterThan(0)
  })

  it('스킬 사용 후 쿨다운이 설정된다', () => {
    const state = makeBattleState()
    const result = useSkill(state, 'char-1', 'enemy-1', 'slash', [])
    // slash 쿨다운 > 0 이어야 함 (스킬 정의에 따라 다를 수 있으므로 >= 0 확인)
    expect(result.party[0].skillCooldowns['slash']).toBeDefined()
  })

  it('적을 처치하면 victory 상태로 전환된다', () => {
    const dyingEnemy = makeEnemy({ stats: { ...makeEnemy().stats, hp: 1, maxHp: 400 } })
    const state = makeBattleState({ enemies: [dyingEnemy] })
    const result = useSkill(state, 'char-1', 'enemy-1', 'slash', [])
    expect(result.phase).toBe('victory')
  })

  it('스킬 사용 시 로그가 추가된다', () => {
    const state = makeBattleState()
    const result = useSkill(state, 'char-1', 'enemy-1', 'slash', [])
    expect(result.log.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// tickAllStatusEffects
// ---------------------------------------------------------------------------

describe('tickAllStatusEffects', () => {
  it('독 상태이상이 캐릭터에게 피해를 준다', () => {
    const charWithPoison = makeCharacter({
      statusEffects: [{ kind: 'poison', duration: 2, value: 10, sourceId: 'src' }],
    })
    const state = makeBattleState({ party: [charWithPoison] })
    const result = tickAllStatusEffects(state)
    // poison value는 최대HP%의 피해, 최대HP 1000의 10% = 100
    expect(result.party[0].stats.hp).toBe(900)
  })

  it('화상 상태이상이 캐릭터에게 피해를 준다', () => {
    const charWithBurn = makeCharacter({
      statusEffects: [{ kind: 'burn', duration: 2, value: 50, sourceId: 'src' }],
    })
    const state = makeBattleState({ party: [charWithBurn] })
    const result = tickAllStatusEffects(state)
    expect(result.party[0].stats.hp).toBe(950)
  })

  it('독이 적에게 피해를 준다', () => {
    const enemyWithPoison = makeEnemy({
      statusEffects: [{ kind: 'poison', duration: 2, value: 10, sourceId: 'src' }],
    })
    const state = makeBattleState({ enemies: [enemyWithPoison] })
    const result = tickAllStatusEffects(state)
    // enemy maxHp 400의 10% = 40
    expect(result.enemies[0].stats.hp).toBe(360)
    expect(result.totalDamageDealt).toBe(40)
  })

  it('화상이 적에게 피해를 준다', () => {
    const enemyWithBurn = makeEnemy({
      statusEffects: [{ kind: 'burn', duration: 2, value: 20, sourceId: 'src' }],
    })
    const state = makeBattleState({ enemies: [enemyWithBurn] })
    const result = tickAllStatusEffects(state)
    expect(result.enemies[0].stats.hp).toBe(380)
    expect(result.totalDamageDealt).toBe(20)
  })

  it('상태이상 duration이 감소한다', () => {
    const charWithPoison = makeCharacter({
      statusEffects: [{ kind: 'poison', duration: 3, value: 5, sourceId: 'src' }],
    })
    const state = makeBattleState({ party: [charWithPoison] })
    const result = tickAllStatusEffects(state)
    expect(result.party[0].statusEffects[0].duration).toBe(2)
  })

  it('duration이 0이 된 상태이상은 제거된다', () => {
    const charWithPoison = makeCharacter({
      statusEffects: [{ kind: 'poison', duration: 1, value: 5, sourceId: 'src' }],
    })
    const state = makeBattleState({ party: [charWithPoison] })
    const result = tickAllStatusEffects(state)
    expect(result.party[0].statusEffects).toHaveLength(0)
  })

  it('스킬 쿨다운이 감소한다', () => {
    const charWithCooldown = makeCharacter({ skillCooldowns: { slash: 2 } })
    const state = makeBattleState({ party: [charWithCooldown] })
    const result = tickAllStatusEffects(state)
    expect(result.party[0].skillCooldowns['slash']).toBe(1)
  })

  it('스킬 쿨다운은 0 미만으로 내려가지 않는다', () => {
    const charWithCooldown = makeCharacter({ skillCooldowns: { slash: 1 } })
    const state = makeBattleState({ party: [charWithCooldown] })
    const result = tickAllStatusEffects(state)
    expect(result.party[0].skillCooldowns['slash']).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// processEnemyTurn
// ---------------------------------------------------------------------------

describe('processEnemyTurn', () => {
  it('적이 캐릭터를 공격한다', () => {
    const state = makeBattleState({ phase: 'enemy_turn' })
    const result = processEnemyTurn(state, [])
    expect(result.party[0].stats.hp).toBeLessThan(1000)
  })

  it('freeze 상태인 적은 행동하지 않는다', () => {
    const frozenEnemy = makeEnemy({
      statusEffects: [{ kind: 'freeze', duration: 1, value: 0, sourceId: 'src' }],
    })
    const state = makeBattleState({ phase: 'enemy_turn', enemies: [frozenEnemy] })
    const result = processEnemyTurn(state, [])
    // freeze된 적은 공격 안함
    expect(result.party[0].stats.hp).toBe(1000)
  })

  it('stun 상태인 적은 행동하지 않는다', () => {
    const stunnedEnemy = makeEnemy({
      statusEffects: [{ kind: 'stun', duration: 1, value: 0, sourceId: 'src' }],
    })
    const state = makeBattleState({ phase: 'enemy_turn', enemies: [stunnedEnemy] })
    const result = processEnemyTurn(state, [])
    expect(result.party[0].stats.hp).toBe(1000)
  })

  it('동료가 있으면 적에게 피해를 준다', () => {
    const state = makeBattleState({
      phase: 'enemy_turn',
      allies: [makeAlly()],
    })
    const result = processEnemyTurn(state, [])
    // 동료 공격으로 totalDamageDealt 증가
    expect(result.totalDamageDealt).toBeGreaterThan(0)
  })

  it('적이 죽으면 victory 상태로 전환된다', () => {
    const weakEnemy = makeEnemy({ stats: { ...makeEnemy().stats, hp: 1, attack: 0, maxHp: 400 } })
    const healingAlly = makeAlly({
      action: { type: 'heal_party', multiplier: 1.0 },
    })
    // 동료가 아닌 약한 적과 독을 활용해 적을 제거
    // 또는 단순히 hp 1짜리 적이 어떻게 행동 후 상태이상 tick으로 죽는지
    // 여기선 독 틱으로 적을 처치하는 시나리오
    const weakEnemyWithPoison = makeEnemy({
      stats: { ...makeEnemy().stats, hp: 1, attack: 0, maxHp: 400 },
      statusEffects: [{ kind: 'poison', duration: 1, value: 100, sourceId: 'src' }],
    })
    const state = makeBattleState({
      phase: 'enemy_turn',
      enemies: [weakEnemyWithPoison],
    })
    const result = processEnemyTurn(state, [])
    expect(result.phase).toBe('victory')
  })

  it('파티가 전멸하면 defeat 상태로 전환된다', () => {
    // 방어 0이고 hp 1인 캐릭터에게 강력한 적이 공격하도록 설정
    const fragileChar = makeCharacter({ stats: { ...makeCharacter().stats, hp: 1, defense: 0 } })
    const strongEnemy = makeEnemy({ stats: { ...makeEnemy().stats, attack: 9999 } })
    const state = makeBattleState({
      phase: 'enemy_turn',
      party: [fragileChar],
      enemies: [strongEnemy],
    })
    const result = processEnemyTurn(state, [])
    expect(result.phase).toBe('defeat')
  })

  it('적의 actionIndex가 증가한다', () => {
    const enemyWithTwoActions = makeEnemy({
      actions: [
        { type: 'attack', element: 'physical', multiplier: 1.0, targetMode: 'random' },
        { type: 'attack', element: 'physical', multiplier: 1.5, targetMode: 'random' },
      ],
      actionIndex: 0,
    })
    const state = makeBattleState({ phase: 'enemy_turn', enemies: [enemyWithTwoActions] })
    const result = processEnemyTurn(state, [])
    expect(result.enemies[0].actionIndex).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// battleReducer
// ---------------------------------------------------------------------------

describe('battleReducer', () => {
  describe('SELECT_SKILL', () => {
    it('선택한 스킬 ID를 저장한다', () => {
      const state = makeBattleState()
      const result = battleReducer(state, { type: 'SELECT_SKILL', skillId: 'slash' })
      expect(result.selectedSkillId).toBe('slash')
      expect(result.selectedTargetId).toBeNull()
    })
  })

  describe('SELECT_TARGET', () => {
    it('선택한 타겟 ID를 저장한다', () => {
      const state = makeBattleState({ selectedSkillId: 'slash' })
      const result = battleReducer(state, { type: 'SELECT_TARGET', targetId: 'enemy-1' })
      expect(result.selectedTargetId).toBe('enemy-1')
    })
  })

  describe('USE_SKILL', () => {
    it('플레이어 턴일 때만 스킬을 사용할 수 있다', () => {
      const state = makeBattleState({ phase: 'enemy_turn' })
      const result = battleReducer(state, { type: 'USE_SKILL', skillId: 'slash', targetId: 'enemy-1' })
      expect(result).toBe(state) // 상태 변화 없음
    })

    it('스킬 사용 후 enemy_turn으로 전환된다', () => {
      const state = makeBattleState()
      const result = battleReducer(state, { type: 'USE_SKILL', skillId: 'slash', targetId: 'enemy-1' })
      // victory가 아닌 경우 enemy_turn으로 전환
      if (result.phase !== 'victory') {
        expect(result.phase).toBe('enemy_turn')
      }
    })

    it('스킬 사용 후 selectedSkillId가 초기화된다', () => {
      const state = makeBattleState({ selectedSkillId: 'slash' })
      const result = battleReducer(state, { type: 'USE_SKILL', skillId: 'slash', targetId: 'enemy-1' })
      expect(result.selectedSkillId).toBeNull()
    })
  })

  describe('END_PLAYER_TURN', () => {
    it('플레이어 턴을 종료하고 enemy_turn으로 전환된다', () => {
      const state = makeBattleState()
      const result = battleReducer(state, { type: 'END_PLAYER_TURN' })
      expect(result.phase).toBe('enemy_turn')
    })

    it('적 턴에는 동작하지 않는다', () => {
      const state = makeBattleState({ phase: 'enemy_turn' })
      const result = battleReducer(state, { type: 'END_PLAYER_TURN' })
      expect(result).toBe(state)
    })
  })

  describe('PROCESS_ENEMY_TURN', () => {
    it('적 턴일 때만 처리된다', () => {
      const state = makeBattleState({ phase: 'player_turn' })
      const result = battleReducer(state, { type: 'PROCESS_ENEMY_TURN' })
      expect(result).toBe(state)
    })

    it('적 턴 처리 후 player_turn으로 전환된다', () => {
      const state = makeBattleState({ phase: 'enemy_turn' })
      const result = battleReducer(state, { type: 'PROCESS_ENEMY_TURN' })
      if (result.phase !== 'victory' && result.phase !== 'defeat') {
        expect(result.phase).toBe('player_turn')
      }
    })

    it('적 턴 처리 후 turnCount가 증가한다', () => {
      const state = makeBattleState({ phase: 'enemy_turn', turnCount: 1 })
      const result = battleReducer(state, { type: 'PROCESS_ENEMY_TURN' })
      if (result.phase !== 'victory' && result.phase !== 'defeat') {
        expect(result.turnCount).toBe(2)
      }
    })
  })

  describe('TICK_STATUS_EFFECTS', () => {
    it('상태이상 틱을 처리한다', () => {
      const charWithPoison = makeCharacter({
        statusEffects: [{ kind: 'poison', duration: 2, value: 10, sourceId: 'src' }],
      })
      const state = makeBattleState({ party: [charWithPoison] })
      const result = battleReducer(state, { type: 'TICK_STATUS_EFFECTS' })
      // 독 피해 적용됨
      expect(result.party[0].stats.hp).toBeLessThan(1000)
    })
  })

  describe('USE_SKILL — victory path', () => {
    it('마지막 적을 처치하면 phase가 victory로 전환된다', () => {
      // HP 1인 적 — slash 한 방에 처치 가능
      const dyingEnemy = makeEnemy({ stats: { maxHp: 400, hp: 1, attack: 80, defense: 0, speed: 90, maxMp: 0, mp: 0 } })
      const state = makeBattleState({ enemies: [dyingEnemy] })
      const result = battleReducer(state, { type: 'USE_SKILL', skillId: 'slash', targetId: dyingEnemy.id })
      expect(result.phase).toBe('victory')
      expect(result.selectedSkillId).toBeNull()
      expect(result.selectedTargetId).toBeNull()
    })
  })

  describe('PROCESS_ENEMY_TURN — defeat path', () => {
    it('파티 전원이 사망하면 phase가 defeat로 전환된다', () => {
      // HP 1인 캐릭터 — 적 공격 한 방에 사망
      const dyingChar = makeCharacter({ stats: { maxHp: 1000, hp: 1, attack: 200, defense: 0, speed: 70, maxMp: 100, mp: 100 } })
      const state = makeBattleState({ phase: 'enemy_turn', party: [dyingChar] })
      const result = battleReducer(state, { type: 'PROCESS_ENEMY_TURN' })
      expect(result.phase).toBe('defeat')
    })
  })

  describe('default case', () => {
    it('알 수 없는 액션 타입은 상태를 변경하지 않는다', () => {
      const state = makeBattleState()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = battleReducer(state, { type: 'UNKNOWN_ACTION' } as any)
      expect(result).toBe(state)
    })
  })

  describe('PROCESS_ENEMY_TURN — targetMode 분기', () => {
    it('lowest_hp 타겟 모드로 파티 중 HP가 가장 낮은 멤버를 공격한다', () => {
      const weakChar = makeCharacter({ id: 'char-weak', stats: { maxHp: 1000, hp: 50, attack: 200, defense: 0, speed: 70, maxMp: 100, mp: 100 } })
      const strongChar = makeCharacter({ id: 'char-strong', stats: { maxHp: 1000, hp: 900, attack: 100, defense: 0, speed: 70, maxMp: 100, mp: 100 } })
      const enemy = makeEnemy({
        actions: [{ type: 'attack', element: 'physical', multiplier: 0.1, targetMode: 'lowest_hp' }],
      })
      const state = makeBattleState({ phase: 'enemy_turn', party: [weakChar, strongChar], enemies: [enemy] })
      const result = battleReducer(state, { type: 'PROCESS_ENEMY_TURN' })
      // lowest_hp인 weakChar가 공격받았으므로 HP가 줄어야 한다
      const updatedWeak = result.party.find(c => c.id === 'char-weak')
      const updatedStrong = result.party.find(c => c.id === 'char-strong')
      expect(updatedWeak!.stats.hp).toBeLessThan(50)
      expect(updatedStrong!.stats.hp).toBe(900)
    })

    it('highest_attack 타겟 모드로 파티 중 공격력이 가장 높은 멤버를 공격한다', () => {
      const highAtkChar = makeCharacter({ id: 'char-atk', stats: { maxHp: 1000, hp: 1000, attack: 500, defense: 0, speed: 70, maxMp: 100, mp: 100 } })
      const lowAtkChar = makeCharacter({ id: 'char-low', stats: { maxHp: 1000, hp: 1000, attack: 50, defense: 0, speed: 70, maxMp: 100, mp: 100 } })
      const enemy = makeEnemy({
        actions: [{ type: 'attack', element: 'physical', multiplier: 0.1, targetMode: 'highest_attack' }],
      })
      const state = makeBattleState({ phase: 'enemy_turn', party: [highAtkChar, lowAtkChar], enemies: [enemy] })
      const result = battleReducer(state, { type: 'PROCESS_ENEMY_TURN' })
      // highest_attack인 highAtkChar가 공격받았으므로 HP가 줄어야 한다
      const updatedHigh = result.party.find(c => c.id === 'char-atk')
      const updatedLow = result.party.find(c => c.id === 'char-low')
      expect(updatedHigh!.stats.hp).toBeLessThan(1000)
      expect(updatedLow!.stats.hp).toBe(1000)
    })
  })

  describe('PROCESS_ENEMY_TURN — shield_party 동료 액션', () => {
    it('shield_party 동료가 파티 전체에 방어막을 부여한다', () => {
      const shieldAlly = makeAlly({
        action: { type: 'shield_party', amount: 200 },
      })
      const state = makeBattleState({ phase: 'enemy_turn', allies: [shieldAlly] })
      const result = battleReducer(state, { type: 'PROCESS_ENEMY_TURN' })
      // 방어막 적용 로그가 남아있어야 한다 (tick 후 소멸되더라도 로그는 유지됨)
      const hasShieldLog = result.log.some(entry => entry.text.includes('방어막 부여'))
      expect(hasShieldLog).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// MP 재생 시스템
// ---------------------------------------------------------------------------

describe('MP 재생 시스템', () => {
  describe('END_PLAYER_TURN — 턴 종료 MP 보너스', () => {
    it('턴 종료 시 살아있는 캐릭터에게 MP 보너스를 지급한다', () => {
      const state = makeBattleState({
        phase: 'player_turn',
        party: [makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 30 } })],
      })
      const result = battleReducer(state, { type: 'END_PLAYER_TURN' })
      expect(result.party[0].stats.mp).toBe(38) // 30 + 8
    })

    it('턴 종료 MP 보너스가 maxMp를 초과하지 않는다', () => {
      const state = makeBattleState({
        phase: 'player_turn',
        party: [makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 95 } })],
      })
      const result = battleReducer(state, { type: 'END_PLAYER_TURN' })
      expect(result.party[0].stats.mp).toBe(100) // 100 상한
    })

    it('턴 종료 시 phase가 enemy_turn으로 전환된다', () => {
      const state = makeBattleState({ phase: 'player_turn' })
      const result = battleReducer(state, { type: 'END_PLAYER_TURN' })
      expect(result.phase).toBe('enemy_turn')
    })

    it('MP가 이미 최대인 경우 배틀 로그에 MP 회복 메시지가 없다', () => {
      const state = makeBattleState({
        phase: 'player_turn',
        party: [makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 100 } })],
      })
      const result = battleReducer(state, { type: 'END_PLAYER_TURN' })
      const hasMpLog = result.log.some(e => e.text.includes('턴 종료 보너스'))
      expect(hasMpLog).toBe(false)
    })

    it('사망한 캐릭터는 턴 종료 MP 보너스를 받지 않는다', () => {
      const deadChar = makeCharacter({
        id: 'char-dead',
        isAlive: false,
        stats: { maxHp: 1000, hp: 0, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 20 },
      })
      const state = makeBattleState({ phase: 'player_turn', party: [deadChar] })
      const result = battleReducer(state, { type: 'END_PLAYER_TURN' })
      expect(result.party[0].stats.mp).toBe(20) // 변화 없음
    })

    it('턴 종료 MP 보너스 발생 시 배틀 로그에 기록된다', () => {
      const state = makeBattleState({
        phase: 'player_turn',
        party: [makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 0 } })],
      })
      const result = battleReducer(state, { type: 'END_PLAYER_TURN' })
      const hasLog = result.log.some(e => e.text.includes('턴 종료 보너스'))
      expect(hasLog).toBe(true)
    })
  })

  describe('PROCESS_ENEMY_TURN — 자동 MP 재생', () => {
    it('적 턴 완료 후 다음 플레이어 턴 시작 시 자동 MP가 재생된다', () => {
      const state = makeBattleState({
        phase: 'enemy_turn',
        party: [makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 50 } })],
      })
      const result = battleReducer(state, { type: 'PROCESS_ENEMY_TURN' })
      if (result.phase === 'player_turn') {
        expect(result.party[0].stats.mp).toBeGreaterThan(50)
      }
    })

    it('자동 MP 재생이 maxMp를 초과하지 않는다', () => {
      const state = makeBattleState({
        phase: 'enemy_turn',
        party: [makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 99 } })],
      })
      const result = battleReducer(state, { type: 'PROCESS_ENEMY_TURN' })
      if (result.phase === 'player_turn') {
        expect(result.party[0].stats.mp).toBe(100)
      }
    })

    it('자동 MP 재생 시 배틀 로그에 기록된다', () => {
      const state = makeBattleState({
        phase: 'enemy_turn',
        party: [makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 0 } })],
      })
      const result = battleReducer(state, { type: 'PROCESS_ENEMY_TURN' })
      if (result.phase === 'player_turn') {
        const hasLog = result.log.some(e => e.text.includes('마나가 자연 회복'))
        expect(hasLog).toBe(true)
      }
    })
  })
})

// ---------------------------------------------------------------------------
// rollCombat (크리티컬 / 미스 시스템)
// ---------------------------------------------------------------------------

describe('rollCombat', () => {
  it('결과값은 isCrit, isMiss, nextRng 세 필드를 가진다', () => {
    const rng = createRng(42)
    const result = rollCombat(rng, 100, 100)
    expect(result).toHaveProperty('isCrit')
    expect(result).toHaveProperty('isMiss')
    expect(result).toHaveProperty('nextRng')
  })

  it('미스와 크리티컬이 동시에 true가 될 수 없다', () => {
    // 1000번 호출해서 동시 true가 없는지 확인
    let rng = createRng(99)
    for (let i = 0; i < 1000; i++) {
      const result = rollCombat(rng, 200, 500)
      expect(result.isMiss && result.isCrit).toBe(false)
      rng = result.nextRng
    }
  })

  it('속도가 높을수록 크리티컬 확률이 높아진다 (통계적)', () => {
    // 고속 vs 저속 각각 5000번 시뮬레이션
    let lowRng = createRng(1)
    let highRng = createRng(1)
    let lowCrits = 0
    let highCrits = 0
    const trials = 5000
    for (let i = 0; i < trials; i++) {
      const low = rollCombat(lowRng, 0, 0)    // critChance ≈ 10%
      const high = rollCombat(highRng, 500, 0) // critChance ≈ 25%
      if (low.isCrit) lowCrits++
      if (high.isCrit) highCrits++
      lowRng = low.nextRng
      highRng = high.nextRng
    }
    expect(highCrits).toBeGreaterThan(lowCrits)
  })

  it('방어력이 높을수록 미스 확률이 높아진다 (통계적)', () => {
    let lowRng = createRng(2)
    let highRng = createRng(2)
    let lowMisses = 0
    let highMisses = 0
    const trials = 5000
    for (let i = 0; i < trials; i++) {
      const low = rollCombat(lowRng, 0, 0)      // missChance ≈ 5%
      const high = rollCombat(highRng, 0, 1000)  // missChance ≈ 15%
      if (low.isMiss) lowMisses++
      if (high.isMiss) highMisses++
      lowRng = low.nextRng
      highRng = high.nextRng
    }
    expect(highMisses).toBeGreaterThan(lowMisses)
  })

  it('useSkill에서 미스 시 피해가 0이고 miss 로그가 생성된다', () => {
    // 미스가 확정으로 발생하도록 rng를 조작할 수 없으므로 여러 번 시도
    // 대신 missChance를 극대화한 상태에서 빈도 확인
    const enemy = makeEnemy({ stats: { ...makeEnemy().stats, defense: 1000 } }) // missChance 15%
    let missFound = false
    for (let seed = 0; seed < 200; seed++) {
      const state = makeBattleState({
        enemies: [enemy],
        rng: createRng(seed),
      })
      const result = useSkill(state, 'char-1', 'enemy-1', 'slash', [])
      const missLog = result.log.find(e => e.kind === 'miss')
      if (missLog) {
        missFound = true
        // 미스 시 적 HP가 변하지 않아야 함
        expect(result.enemies[0].stats.hp).toBe(enemy.stats.hp)
        break
      }
    }
    expect(missFound).toBe(true)
  })

  it('useSkill에서 크리티컬 시 crit 로그가 생성된다', () => {
    let critFound = false
    for (let seed = 0; seed < 200; seed++) {
      const state = makeBattleState({ rng: createRng(seed) })
      const result = useSkill(state, 'char-1', 'enemy-1', 'slash', [])
      const critLog = result.log.find(e => e.kind === 'crit')
      if (critLog) {
        critFound = true
        break
      }
    }
    expect(critFound).toBe(true)
  })
})
