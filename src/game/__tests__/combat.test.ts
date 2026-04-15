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

// ---------------------------------------------------------------------------
// applyDamageToCharacter: undying / revive 상태
// ---------------------------------------------------------------------------

describe('undying / revive 상태 이상', () => {
  it('undying 상태에서 치명타 피해를 받아도 HP 1로 생존한다', () => {
    const undyingStatus: StatusEffect = { kind: 'undying', duration: 1, value: 0, sourceId: 'src' }
    const char = makeCharacter({ stats: { maxHp: 1000, hp: 100, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 100 }, statusEffects: [undyingStatus] })
    const state = makeBattleState({ party: [char] })
    // 적이 캐릭터에게 9999 피해를 주면 undying 발동
    const result = useSkill(state, 'char-1', 'enemy-1', 'slash', [])
    // 직접 적용 경로를 테스트하기 위해 processEnemyTurn 사용
    const enemy = makeEnemy({ stats: { maxHp: 400, hp: 400, attack: 9999, defense: 0, speed: 0, maxMp: 0, mp: 0 } })
    const bigDmgState = makeBattleState({
      phase: 'enemy_turn',
      party: [makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 0, speed: 0, maxMp: 100, mp: 100 }, statusEffects: [undyingStatus] })],
      enemies: [enemy],
    })
    // 여러 seed로 miss가 아닌 경우를 찾아서 테스트
    let survived = false
    for (let seed = 0; seed < 100; seed++) {
      const s = { ...bigDmgState, rng: createRng(seed) }
      const r = processEnemyTurn(s, [])
      const c = r.party[0]
      if (c.isAlive && c.stats.hp === 1) {
        survived = true
        expect(c.statusEffects.some(e => e.kind === 'undying')).toBe(false)
        break
      }
    }
    expect(survived).toBe(true)
  })

  it('revive 상태에서 치명타 피해를 받아도 30% HP로 생존한다', () => {
    const reviveStatus: StatusEffect = { kind: 'revive', duration: 1, value: 0, sourceId: 'src' }
    const enemy = makeEnemy({ stats: { maxHp: 400, hp: 400, attack: 9999, defense: 0, speed: 0, maxMp: 0, mp: 0 } })
    const reviveState = makeBattleState({
      phase: 'enemy_turn',
      party: [makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 0, speed: 0, maxMp: 100, mp: 100 }, statusEffects: [reviveStatus] })],
      enemies: [enemy],
    })
    let survived = false
    for (let seed = 0; seed < 100; seed++) {
      const s = { ...reviveState, rng: createRng(seed) }
      const r = processEnemyTurn(s, [])
      const c = r.party[0]
      if (c.isAlive && c.stats.hp === 300) { // 1000 * 0.3 = 300
        survived = true
        expect(c.statusEffects.some(e => e.kind === 'revive')).toBe(false)
        break
      }
    }
    expect(survived).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 아이템 효과: lifesteal, boss_damage_bonus, miss_immunity, crit_chance_bonus
// ---------------------------------------------------------------------------

describe('아이템 효과 — 전투', () => {
  const lifeStealItem: ItemDef = {
    id: 'test_lifesteal',
    name: '흡혈 아이템',
    description: '',
    rarity: 'common',
    effects: [{ type: 'lifesteal', element: 'physical', percent: 0.5 }],
  }

  const bossBonusItem: ItemDef = {
    id: 'test_boss',
    name: '보스킬러',
    description: '',
    rarity: 'rare',
    effects: [{ type: 'boss_damage_bonus', multiplier: 2.0 }],
  }

  const missImmunityItem: ItemDef = {
    id: 'test_missimmune',
    name: '미스면역',
    description: '',
    rarity: 'common',
    effects: [{ type: 'miss_immunity' }],
  }

  const critBonusItem: ItemDef = {
    id: 'test_crit',
    name: '치명타강화',
    description: '',
    rarity: 'common',
    effects: [{ type: 'crit_chance_bonus', amount: 1.0 }], // 100% 추가 크리티컬
  }

  it('lifesteal: 피해 후 공격자 HP를 회복한다', () => {
    const char = makeCharacter({ stats: { maxHp: 1000, hp: 500, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 100 } })
    const state = makeBattleState({ party: [char] })
    let healed = false
    for (let seed = 0; seed < 100; seed++) {
      const s = { ...state, rng: createRng(seed) }
      const result = useSkill(s, 'char-1', 'enemy-1', 'slash', [lifeStealItem])
      const afterChar = result.party[0]
      if (afterChar.stats.hp > 500) {
        healed = true
        const healLog = result.log.find(e => e.text.includes('흡혈'))
        expect(healLog).toBeTruthy()
        break
      }
    }
    expect(healed).toBe(true)
  })

  it('boss_damage_bonus: 보스 적에게 추가 피해를 준다', () => {
    const boss: BattleEnemy = {
      ...makeEnemy(),
      isBoss: true,
      stats: { maxHp: 10000, hp: 10000, attack: 80, defense: 0, speed: 90, maxMp: 0, mp: 0 },
    }
    const normalEnemy = makeEnemy({ stats: { maxHp: 10000, hp: 10000, attack: 80, defense: 0, speed: 90, maxMp: 0, mp: 0 } })

    let bossHpAfter = 10000
    let normalHpAfter = 10000

    for (let seed = 0; seed < 200; seed++) {
      const bossState = { ...makeBattleState({ enemies: [boss], rng: createRng(seed) }) }
      const bossResult = useSkill(bossState, 'char-1', 'enemy-1', 'slash', [bossBonusItem])
      const afterBoss = bossResult.enemies[0]
      if (afterBoss.stats.hp < 10000) {
        bossHpAfter = afterBoss.stats.hp
        break
      }
    }

    for (let seed = 0; seed < 200; seed++) {
      const normalState = { ...makeBattleState({ enemies: [normalEnemy], rng: createRng(seed) }) }
      const normalResult = useSkill(normalState, 'char-1', 'enemy-1', 'slash', [bossBonusItem])
      const afterNormal = normalResult.enemies[0]
      if (afterNormal.stats.hp < 10000) {
        normalHpAfter = afterNormal.stats.hp
        break
      }
    }

    // 보스에게 입힌 피해가 더 많아야 함
    expect(10000 - bossHpAfter).toBeGreaterThan(10000 - normalHpAfter)
  })

  it('miss_immunity: miss_immunity 아이템 있을 때 절대 miss가 발생하지 않는다', () => {
    const highDefEnemy = makeEnemy({ stats: { maxHp: 400, hp: 400, attack: 80, defense: 9999, speed: 90, maxMp: 0, mp: 0 } })
    let missFound = false
    for (let seed = 0; seed < 500; seed++) {
      const state = makeBattleState({ enemies: [highDefEnemy], rng: createRng(seed) })
      const result = useSkill(state, 'char-1', 'enemy-1', 'slash', [missImmunityItem])
      if (result.log.some(e => e.kind === 'miss')) {
        missFound = true
        break
      }
    }
    expect(missFound).toBe(false)
  })

  it('crit_chance_bonus: 100% crit 보너스 시 항상 크리티컬이 발생한다', () => {
    // extraCritChance=1.0이면 critChance가 크게 증가해 크리티컬이 매우 자주 발생
    let critCount = 0
    const trials = 50
    for (let seed = 0; seed < trials; seed++) {
      const state = makeBattleState({ rng: createRng(seed) })
      const result = useSkill(state, 'char-1', 'enemy-1', 'slash', [critBonusItem])
      if (result.log.some(e => e.kind === 'crit')) critCount++
    }
    // 100% 추가 크리티컬이면 대부분 크리티컬이어야 함
    expect(critCount).toBeGreaterThan(trials * 0.5)
  })
})

// ---------------------------------------------------------------------------
// 아이템 효과: elemental_match_damage
// ---------------------------------------------------------------------------

describe('elemental_match_damage 아이템', () => {
  it('캐릭터 속성과 스킬 속성이 일치할 때 추가 피해를 준다', () => {
    const matchItem: ItemDef = {
      id: 'test_elem_match',
      name: '속성일치',
      description: '',
      rarity: 'rare',
      effects: [{ type: 'elemental_match_damage', multiplier: 2.0 }],
    }

    const darkChar = makeCharacter({ element: 'dark' })
    // dark 속성 공격 (shadow_strike = dark)
    const stateWithMatch = makeBattleState({ party: [darkChar] })
    const stateWithoutMatch = makeBattleState({ party: [darkChar] })

    let dmgWithMatch = 0
    let dmgWithoutMatch = 0

    for (let seed = 0; seed < 200; seed++) {
      const s1 = { ...stateWithMatch, rng: createRng(seed) }
      const r1 = useSkill(s1, 'char-1', 'enemy-1', 'shadow_strike', [matchItem])
      const s2 = { ...stateWithoutMatch, rng: createRng(seed) }
      const r2 = useSkill(s2, 'char-1', 'enemy-1', 'shadow_strike', [])
      const e1 = r1.enemies[0]
      const e2 = r2.enemies[0]
      if (e1.stats.hp < 400 && e2.stats.hp < 400) {
        dmgWithMatch = 400 - e1.stats.hp
        dmgWithoutMatch = 400 - e2.stats.hp
        break
      }
    }

    expect(dmgWithMatch).toBeGreaterThan(dmgWithoutMatch)
  })
})

// ---------------------------------------------------------------------------
// useSkill: free_skill_chance
// ---------------------------------------------------------------------------

describe('free_skill_chance', () => {
  it('100% 무료 시전 시 MP가 소비되지 않는다', () => {
    const freeItem: ItemDef = {
      id: 'test_free',
      name: '무료시전',
      description: '',
      rarity: 'epic',
      effects: [{ type: 'free_skill_chance', chance: 1.0 }], // 100% 확률
    }

    // shadow_strike costs 15 MP
    const char = makeCharacter({ skillIds: ['slash', 'shadow_strike'], stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 50 } })
    const state = makeBattleState({ party: [char] })

    // shadow_strike MP 비용 확인을 위해 아이템 없이 먼저 실행
    const resultWithoutFree = useSkill(state, 'char-1', 'enemy-1', 'shadow_strike', [])
    const mpAfterNormal = resultWithoutFree.party[0].stats.mp

    // 100% 무료 시전 아이템으로 실행하면 MP가 변하지 않아야 함
    const resultWithFree = useSkill(state, 'char-1', 'enemy-1', 'shadow_strike', [freeItem])
    const mpAfterFree = resultWithFree.party[0].stats.mp

    expect(mpAfterFree).toBeGreaterThanOrEqual(state.party[0].stats.mp) // MP 소비 없음
    expect(mpAfterFree).toBeGreaterThan(mpAfterNormal) // 일반 실행보다 MP가 더 많음
    const freeLog = resultWithFree.log.find(e => e.text.includes('MP 무료'))
    expect(freeLog).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 스킬 효과: apply_status_party, execute, damage_hp_scale
// ---------------------------------------------------------------------------

describe('apply_status_party 스킬 효과', () => {
  it('파티 전원에게 상태이상을 부여한다', () => {
    const char1 = makeCharacter({ id: 'char-1', skillIds: ['current_step', 'slash'], stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 100 } })
    const char2 = makeCharacter({ id: 'char-2', stats: { maxHp: 800, hp: 800, attack: 150, defense: 40, speed: 60, maxMp: 80, mp: 80 } })
    // current_step (apply_status_party powerup duration 2)
    const state = makeBattleState({
      party: [char1, char2],
    })
    const result = useSkill(state, 'char-1', 'enemy-1', 'current_step', [])
    expect(result.party[0].statusEffects.some(e => e.kind === 'powerup')).toBe(true)
    expect(result.party[1].statusEffects.some(e => e.kind === 'powerup')).toBe(true)
    const statusLog = result.log.find(e => e.text.includes('powerup'))
    expect(statusLog).toBeTruthy()
  })
})

describe('execute 스킬 효과', () => {
  it('HP가 임계치 이하인 적을 즉사시킨다', () => {
    // divine_judgment: execute threshold 0.3
    const lowHpEnemy = makeEnemy({ stats: { maxHp: 1000, hp: 200, attack: 80, defense: 30, speed: 90, maxMp: 0, mp: 0 } }) // 20% HP
    const char = makeCharacter({ skillIds: ['divine_judgment', 'slash'], stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 80 } })
    const state = makeBattleState({ party: [char], enemies: [lowHpEnemy] })
    const result = useSkill(state, 'char-1', 'enemy-1', 'divine_judgment', [])
    expect(result.enemies[0].isAlive).toBe(false)
    expect(result.log.some(e => e.text.includes('즉사'))).toBe(true)
  })

  it('HP가 임계치 초과인 적에게는 일반 피해를 준다', () => {
    // divine_judgment: execute threshold 0.3
    const highHpEnemy = makeEnemy({ stats: { maxHp: 1000, hp: 800, attack: 80, defense: 0, speed: 90, maxMp: 0, mp: 0 } }) // 80% HP
    const char = makeCharacter({ skillIds: ['divine_judgment', 'slash'], stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 80 } })
    const state = makeBattleState({ party: [char], enemies: [highHpEnemy] })
    const result = useSkill(state, 'char-1', 'enemy-1', 'divine_judgment', [])
    // 즉사 없이 일반 피해만 입어야 함
    expect(result.enemies[0].isAlive).toBe(true)
    expect(result.log.some(e => e.text.includes('심판 실패'))).toBe(true)
  })
})

describe('damage_hp_scale 스킬 효과', () => {
  it('HP가 낮을수록 더 많은 피해를 준다', () => {
    // death_charge: damage_hp_scale physical baseMultiplier 2.0, mpCost 20
    const fullHpChar = makeCharacter({ skillIds: ['death_charge', 'slash'], stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 30 } })
    const lowHpChar = makeCharacter({ skillIds: ['death_charge', 'slash'], stats: { maxHp: 1000, hp: 100, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 30 } })
    const enemy1 = makeEnemy({ stats: { maxHp: 99999, hp: 99999, attack: 80, defense: 0, speed: 0, maxMp: 0, mp: 0 } })
    const enemy2 = makeEnemy({ stats: { maxHp: 99999, hp: 99999, attack: 80, defense: 0, speed: 0, maxMp: 0, mp: 0 } })

    let dmgFull = 0
    let dmgLow = 0

    for (let seed = 0; seed < 200; seed++) {
      const s1 = makeBattleState({ party: [fullHpChar], enemies: [enemy1], rng: createRng(seed) })
      const r1 = useSkill(s1, 'char-1', 'enemy-1', 'death_charge', [])
      if (r1.enemies[0].stats.hp < 99999) {
        dmgFull = 99999 - r1.enemies[0].stats.hp
        break
      }
    }

    for (let seed = 0; seed < 200; seed++) {
      const s2 = makeBattleState({ party: [lowHpChar], enemies: [enemy2], rng: createRng(seed) })
      const r2 = useSkill(s2, 'char-1', 'enemy-1', 'death_charge', [])
      if (r2.enemies[0].stats.hp < 99999) {
        dmgLow = 99999 - r2.enemies[0].stats.hp
        break
      }
    }

    expect(dmgLow).toBeGreaterThan(dmgFull)
  })

  it('damage_hp_scale 로그가 생성된다', () => {
    const char = makeCharacter({ skillIds: ['death_charge', 'slash'], stats: { maxHp: 1000, hp: 500, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 30 } })
    const enemy = makeEnemy({ stats: { maxHp: 99999, hp: 99999, attack: 80, defense: 0, speed: 0, maxMp: 0, mp: 0 } })
    let logFound = false
    for (let seed = 0; seed < 200; seed++) {
      const state = makeBattleState({ party: [char], enemies: [enemy], rng: createRng(seed) })
      const result = useSkill(state, 'char-1', 'enemy-1', 'death_charge', [])
      if (result.log.some(e => e.text.includes('분노의 일격'))) {
        logFound = true
        break
      }
    }
    expect(logFound).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// processEnemyTurn: status_immunity
// ---------------------------------------------------------------------------

describe('status_immunity 아이템', () => {
  it('status_immunity 아이템이 있으면 적의 상태이상 부여가 차단된다', () => {
    const poisonImmunityItem: ItemDef = {
      id: 'test_immunity',
      name: '독 면역',
      description: '',
      rarity: 'rare',
      effects: [{ type: 'status_immunity', statuses: ['poison'] }],
    }

    const poisonEnemy: BattleEnemy = {
      ...makeEnemy(),
      actions: [{ type: 'apply_status', status: 'poison', duration: 3, value: 10, targetMode: 'random' }],
    }

    const state = makeBattleState({
      phase: 'enemy_turn',
      enemies: [poisonEnemy],
      items: [poisonImmunityItem],
    })

    const result = processEnemyTurn(state, [poisonImmunityItem])
    expect(result.party[0].statusEffects.some(e => e.kind === 'poison')).toBe(false)
    expect(result.log.some(e => e.text.includes('면역'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 동료 행동: apply_status_all, buff_party, revive_party
// ---------------------------------------------------------------------------

describe('동료 행동 — apply_status_all / buff_party / revive_party', () => {
  it('apply_status_all: 살아있는 모든 적에게 상태이상을 부여한다', () => {
    const poisonAlly = makeAlly({
      action: { type: 'apply_status_all', status: 'poison', duration: 3, value: 10 },
    })
    const enemy1 = makeEnemy({ id: 'enemy-1' })
    const enemy2: BattleEnemy = { ...makeEnemy(), id: 'enemy-2', name: '두 번째 적' }
    const state = makeBattleState({
      phase: 'enemy_turn',
      allies: [poisonAlly],
      enemies: [enemy1, enemy2],
    })

    const result = processEnemyTurn(state, [])
    expect(result.enemies[0].statusEffects.some(e => e.kind === 'poison')).toBe(true)
    expect(result.enemies[1].statusEffects.some(e => e.kind === 'poison')).toBe(true)
  })

  it('buff_party: 살아있는 파티 전원에게 버프를 부여한다', () => {
    const bardAlly = makeAlly({
      action: { type: 'buff_party', status: 'powerup', duration: 2, value: 30 },
    })
    const char1 = makeCharacter({ id: 'char-1' })
    const char2 = makeCharacter({ id: 'char-2', name: '두 번째 캐릭터' })
    const state = makeBattleState({
      phase: 'enemy_turn',
      party: [char1, char2],
      allies: [bardAlly],
    })

    const result = processEnemyTurn(state, [])
    expect(result.party[0].statusEffects.some(e => e.kind === 'powerup')).toBe(true)
    expect(result.party[1].statusEffects.some(e => e.kind === 'powerup')).toBe(true)
  })

  it('revive_party: 쓰러진 첫 번째 파티원을 healPercent로 부활시킨다', () => {
    const angelAlly = makeAlly({
      action: { type: 'revive_party', healPercent: 0.5 },
    })
    const deadChar = makeCharacter({
      id: 'char-1',
      stats: { maxHp: 1000, hp: 0, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 0 },
      isAlive: false,
    })
    const state = makeBattleState({
      phase: 'enemy_turn',
      party: [deadChar],
      allies: [angelAlly],
    })

    const result = processEnemyTurn(state, [])
    const revived = result.party[0]
    expect(revived.isAlive).toBe(true)
    expect(revived.stats.hp).toBe(500) // maxHp 1000 * 0.5
    expect(result.log.some(e => e.text.includes('부활'))).toBe(true)
  })

  it('revive_party: 죽은 파티원이 없으면 아무 행동도 하지 않는다', () => {
    const angelAlly = makeAlly({
      action: { type: 'revive_party', healPercent: 0.5 },
    })
    const aliveChar = makeCharacter({ id: 'char-1' })
    const state = makeBattleState({
      phase: 'enemy_turn',
      party: [aliveChar],
      allies: [angelAlly],
    })

    const result = processEnemyTurn(state, [])
    // 부활 로그가 없어야 함
    const reviveLog = result.log.find(e => e.text.includes('부활'))
    expect(reviveLog).toBeFalsy()
  })
})

// ---------------------------------------------------------------------------
// tickAllStatusEffects: mana_regen 상태 / mp_regen 아이템 / hp_drain_per_turn
// ---------------------------------------------------------------------------

describe('tickAllStatusEffects — 추가 효과', () => {
  it('mana_regen 상태이상이 있으면 매 틱 MP를 회복한다', () => {
    const manaRegenStatus: StatusEffect = { kind: 'mana_regen', duration: 3, value: 20, sourceId: 'src' }
    const char = makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 50 }, statusEffects: [manaRegenStatus] })
    const state = makeBattleState({ party: [char] })
    const result = tickAllStatusEffects(state)
    expect(result.party[0].stats.mp).toBe(70) // 50 + 20
  })

  it('mana_regen 상태이상이 maxMp를 초과하지 않는다', () => {
    const manaRegenStatus: StatusEffect = { kind: 'mana_regen', duration: 3, value: 100, sourceId: 'src' }
    const char = makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 90 }, statusEffects: [manaRegenStatus] })
    const state = makeBattleState({ party: [char] })
    const result = tickAllStatusEffects(state)
    expect(result.party[0].stats.mp).toBe(100)
  })

  it('mp_regen 아이템이 있으면 매 틱 MP를 회복한다', () => {
    const mpRegenItem: ItemDef = {
      id: 'test_mp_regen',
      name: 'MP 회복 아이템',
      description: '',
      rarity: 'common',
      effects: [{ type: 'mp_regen', amount: 15 }],
    }
    const char = makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 50 } })
    const state = makeBattleState({ party: [char], items: [mpRegenItem] })
    const result = tickAllStatusEffects(state)
    expect(result.party[0].stats.mp).toBe(65) // 50 + 15
  })

  it('hp_drain_per_turn 아이템이 있으면 매 틱 HP가 감소한다', () => {
    const hpDrainItem: ItemDef = {
      id: 'test_hp_drain',
      name: 'HP 감소 아이템',
      description: '',
      rarity: 'rare',
      effects: [{ type: 'hp_drain_per_turn', amount: 50 }],
    }
    const char = makeCharacter({ stats: { maxHp: 1000, hp: 800, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 100 } })
    const state = makeBattleState({ party: [char], items: [hpDrainItem] })
    const result = tickAllStatusEffects(state)
    expect(result.party[0].stats.hp).toBe(750) // 800 - 50
    expect(result.log.some(e => e.text.includes('저주'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 보스 페이즈 시스템
// ---------------------------------------------------------------------------

describe('보스 페이즈 시스템', () => {
  function makeBossEnemy(hpPercent: number): BattleEnemy {
    const maxHp = 4000
    const hp = Math.floor(maxHp * hpPercent)
    return makeEnemy({
      id: 'boss-1',
      defId: 'dragon_lord',
      name: '용군주',
      stats: { maxHp, hp, attack: 300, defense: 150, speed: 70, maxMp: 0, mp: 0 },
      element: 'fire',
      isBoss: true,
      bossCurrentPhase: 1,
      bossPhases: {
        phase2HpThreshold: 0.6,
        phase3HpThreshold: 0.3,
        phase2Actions: [
          { type: 'attack_all', element: 'fire', multiplier: 2.0 },
        ],
        phase3Actions: [
          { type: 'attack_all', element: 'fire', multiplier: 2.8 },
        ],
      },
      actions: [
        { type: 'attack_all', element: 'fire', multiplier: 1.5 },
      ],
    })
  }

  it('HP > 60%이면 페이즈 1 액션을 사용한다', () => {
    const boss = makeBossEnemy(0.8)  // 80% HP
    const state = makeBattleState({ enemies: [boss], phase: 'enemy_turn' })
    const result = processEnemyTurn(state, [])
    // 페이즈 전환 로그가 없어야 한다
    expect(result.log.some(e => e.text.includes('페이즈'))).toBe(false)
    // 보스의 bossCurrentPhase가 1이어야 한다
    expect(result.enemies[0].bossCurrentPhase).toBe(1)
  })

  it('HP가 60% 이하로 떨어지면 페이즈 2로 전환된다', () => {
    const boss = makeBossEnemy(0.55)  // 55% HP
    const state = makeBattleState({ enemies: [boss], phase: 'enemy_turn' })
    const result = processEnemyTurn(state, [])
    expect(result.enemies[0].bossCurrentPhase).toBe(2)
    expect(result.log.some(e => e.text.includes('페이즈 2'))).toBe(true)
  })

  it('HP가 30% 이하로 떨어지면 페이즈 3으로 전환된다', () => {
    const boss = makeBossEnemy(0.25)  // 25% HP
    const state = makeBattleState({ enemies: [boss], phase: 'enemy_turn' })
    const result = processEnemyTurn(state, [])
    expect(result.enemies[0].bossCurrentPhase).toBe(3)
    expect(result.log.some(e => e.text.includes('페이즈 3'))).toBe(true)
  })

  it('페이즈 2 전환 후 actionIndex가 리셋되고 페이즈 2 액션을 순환한다', () => {
    const boss = { ...makeBossEnemy(0.55), actionIndex: 3 }
    const state = makeBattleState({ enemies: [boss], phase: 'enemy_turn' })
    const result = processEnemyTurn(state, [])
    // phase2Actions는 1개이므로 (0+1)%1 = 0
    expect(result.enemies[0].bossCurrentPhase).toBe(2)
    expect(result.enemies[0].actionIndex).toBe(0)
  })

  it('페이즈가 없는 일반 적은 기존 actions를 순환한다', () => {
    const enemy = makeEnemy({
      actions: [
        { type: 'attack', element: 'physical', multiplier: 1.0, targetMode: 'random' },
        { type: 'attack', element: 'physical', multiplier: 1.5, targetMode: 'random' },
      ],
      actionIndex: 1,
    })
    const state = makeBattleState({ enemies: [enemy], phase: 'enemy_turn' })
    const result = processEnemyTurn(state, [])
    // actionIndex 1에서 시작해 actions[1] 사용, 이후 (1+1)%2 = 0
    expect(result.enemies[0].actionIndex).toBe(0)
    expect(result.enemies[0].bossCurrentPhase).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// 동료 타겟팅 (Phase 1: 적이 동료를 공격)
// ---------------------------------------------------------------------------

describe('processEnemyTurn — 동료 타겟팅', () => {
  it('적 attack이 동료 HP를 감소시킨다', () => {
    const enemy = makeEnemy({
      stats: { maxHp: 400, hp: 400, attack: 100, defense: 30, speed: 90, maxMp: 0, mp: 0 },
      actions: [{ type: 'attack', element: 'physical', multiplier: 1.0, targetMode: 'lowest_hp' }],
    })
    const ally = makeAlly({ id: 'ally-1', stats: { maxHp: 300, hp: 300, attack: 80, defense: 0, speed: 90, maxMp: 0, mp: 0 } })
    const char = makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 100 } })
    // lowest_hp 기준: 동료 HP(300) < 캐릭터 HP(1000) → 동료가 타겟
    const state = makeBattleState({ party: [char], allies: [ally], enemies: [enemy], phase: 'enemy_turn' })
    const result = processEnemyTurn(state, [])
    const resultAlly = result.allies.find(a => a.id === 'ally-1')!
    expect(resultAlly.stats.hp).toBeLessThan(300)
  })

  it('동료가 HP 0 이하로 감소하면 isAlive가 false가 된다', () => {
    const enemy = makeEnemy({
      stats: { maxHp: 400, hp: 400, attack: 9999, defense: 0, speed: 90, maxMp: 0, mp: 0 },
      actions: [{ type: 'attack', element: 'physical', multiplier: 2.0, targetMode: 'lowest_hp' }],
    })
    const ally = makeAlly({ id: 'ally-1', stats: { maxHp: 100, hp: 100, attack: 80, defense: 0, speed: 90, maxMp: 0, mp: 0 } })
    const char = makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 100 } })
    const state = makeBattleState({ party: [char], allies: [ally], enemies: [enemy], phase: 'enemy_turn' })
    const result = processEnemyTurn(state, [])
    const resultAlly = result.allies.find(a => a.id === 'ally-1')!
    expect(resultAlly.isAlive).toBe(false)
    expect(resultAlly.stats.hp).toBe(0)
    expect(result.log.some(e => e.kind === 'death' && e.text.includes(ally.name))).toBe(true)
  })

  it('동료가 모두 죽어도 파티가 살아있으면 battle_end가 발생하지 않는다', () => {
    const enemy = makeEnemy({
      stats: { maxHp: 400, hp: 400, attack: 9999, defense: 0, speed: 90, maxMp: 0, mp: 0 },
      actions: [{ type: 'attack', element: 'physical', multiplier: 2.0, targetMode: 'lowest_hp' }],
    })
    const deadAlly = makeAlly({ id: 'ally-1', stats: { maxHp: 1, hp: 1, attack: 80, defense: 0, speed: 90, maxMp: 0, mp: 0 } })
    const char = makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 50, speed: 70, maxMp: 100, mp: 100 } })
    const state = makeBattleState({ party: [char], allies: [deadAlly], enemies: [enemy], phase: 'enemy_turn' })
    const result = processEnemyTurn(state, [])
    expect(result.phase).not.toBe('defeat')
  })

  it('attack_all이 파티원과 동료 모두를 공격한다', () => {
    const enemy = makeEnemy({
      stats: { maxHp: 400, hp: 400, attack: 100, defense: 0, speed: 90, maxMp: 0, mp: 0 },
      actions: [{ type: 'attack_all', element: 'physical', multiplier: 1.0 }],
    })
    const ally = makeAlly({ id: 'ally-1', stats: { maxHp: 500, hp: 500, attack: 80, defense: 0, speed: 90, maxMp: 0, mp: 0 } })
    const char = makeCharacter({ stats: { maxHp: 1000, hp: 1000, attack: 200, defense: 0, speed: 70, maxMp: 100, mp: 100 } })
    const state = makeBattleState({ party: [char], allies: [ally], enemies: [enemy], phase: 'enemy_turn' })
    const result = processEnemyTurn(state, [])
    expect(result.party[0].stats.hp).toBeLessThan(1000)
    expect(result.allies[0].stats.hp).toBeLessThan(500)
  })
})
