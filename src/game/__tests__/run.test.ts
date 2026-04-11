import { describe, it, expect } from 'vitest'
import {
  createRun,
  startBattle,
  completeBattle,
  applyDraftChoice,
  handleDefeat,
  generateDraftOptions,
  createBattleCharacter,
  createBattleAlly,
  createBattleEnemy,
  MAX_ROUNDS,
  MAX_ALLIES,
} from '../run'
import { createRng } from '../rng'
import type { RunState, BattleState } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRng() {
  return createRng(12345)
}

function makeRun(characterId = 'dark_knight'): RunState {
  return createRun(characterId, 42)
}

function makeCompletedBattleState(overrides: Partial<BattleState> = {}): BattleState {
  const defaultParty = overrides.party ?? [createBattleCharacter('dark_knight', ['slash', 'shield_bash'], [])]
  return {
    phase: 'victory',
    turnCount: 5,
    party: defaultParty,
    allies: [],
    enemies: [],
    log: [],
    totalDamageDealt: 500,
    selectedSkillId: null,
    selectedTargetId: null,
    items: [],
    ...overrides,
    party: overrides.party ?? defaultParty,
  }
}

// ---------------------------------------------------------------------------
// createBattleCharacter
// ---------------------------------------------------------------------------

describe('createBattleCharacter', () => {
  it('유효한 캐릭터 ID로 BattleCharacter를 생성한다', () => {
    const char = createBattleCharacter('dark_knight', ['slash'], [])
    expect(char.defId).toBe('dark_knight')
    expect(char.isAlive).toBe(true)
    expect(char.skillIds).toContain('slash')
    expect(char.stats.hp).toBe(char.stats.maxHp)
    expect(char.stats.mp).toBe(char.stats.maxMp)
  })

  it('stat_boost 아이템이 스탯에 반영된다', () => {
    const base = createBattleCharacter('dark_knight', [], [])
    const withItem = createBattleCharacter('dark_knight', [], ['iron_ring'])
    expect(withItem.stats.attack).toBe(base.stats.attack + 30)
  })

  it('defense 아이템이 반영된다', () => {
    const base = createBattleCharacter('dark_knight', [], [])
    const withItem = createBattleCharacter('dark_knight', [], ['tough_armor'])
    expect(withItem.stats.defense).toBe(base.stats.defense + 40)
  })

  it('speed 아이템이 반영된다', () => {
    const base = createBattleCharacter('dark_knight', [], [])
    const withItem = createBattleCharacter('dark_knight', [], ['swift_boots'])
    expect(withItem.stats.speed).toBe(base.stats.speed + 20)
  })

  it('maxHp 아이템이 반영된다', () => {
    const base = createBattleCharacter('dark_knight', [], [])
    const withItem = createBattleCharacter('dark_knight', [], ['vitality_gem'])
    expect(withItem.stats.maxHp).toBe(base.stats.maxHp + 200)
  })

  it('존재하지 않는 캐릭터 ID는 에러를 던진다', () => {
    expect(() => createBattleCharacter('nonexistent', [], [])).toThrow()
  })
})

// ---------------------------------------------------------------------------
// createBattleAlly
// ---------------------------------------------------------------------------

describe('createBattleAlly', () => {
  it('유효한 동료 ID로 BattleAlly를 생성한다', () => {
    const ally = createBattleAlly('forest_archer', 0)
    expect(ally.defId).toBe('forest_archer')
    expect(ally.isAlive).toBe(true)
    expect(ally.id).toBe('ally-0')
  })

  it('index에 따라 고유 id를 부여한다', () => {
    const ally1 = createBattleAlly('forest_archer', 0)
    const ally2 = createBattleAlly('battle_cleric', 1)
    expect(ally1.id).toBe('ally-0')
    expect(ally2.id).toBe('ally-1')
  })

  it('존재하지 않는 동료 ID는 에러를 던진다', () => {
    expect(() => createBattleAlly('unknown_ally', 0)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// createBattleEnemy
// ---------------------------------------------------------------------------

describe('createBattleEnemy', () => {
  it('유효한 적 ID로 BattleEnemy를 생성한다', () => {
    const enemy = createBattleEnemy('goblin', 1, 0)
    expect(enemy.defId).toBe('goblin')
    expect(enemy.isAlive).toBe(true)
    expect(enemy.id).toBe('enemy-0')
  })

  it('라운드가 높을수록 스탯이 강화된다', () => {
    const r1 = createBattleEnemy('goblin', 1, 0)
    const r5 = createBattleEnemy('goblin', 5, 0)
    expect(r5.stats.maxHp).toBeGreaterThan(r1.stats.maxHp)
    expect(r5.stats.attack).toBeGreaterThan(r1.stats.attack)
  })

  it('라운드 1은 기본 스탯이다 (배율 1.0)', () => {
    const enemy = createBattleEnemy('goblin', 1, 0)
    // round 1: scale = 1 + (1-1)*0.1 = 1.0
    expect(enemy.stats.maxHp).toBe(400) // goblin baseStats.maxHp = 400
  })

  it('존재하지 않는 적 ID는 에러를 던진다', () => {
    expect(() => createBattleEnemy('unknown_enemy', 1, 0)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// createRun
// ---------------------------------------------------------------------------

describe('createRun', () => {
  it('phase가 battle로 시작된다', () => {
    const run = makeRun()
    expect(run.phase).toBe('battle')
  })

  it('라운드 1로 시작된다', () => {
    expect(makeRun().round).toBe(1)
  })

  it('totalDamage가 0으로 시작된다', () => {
    expect(makeRun().totalDamage).toBe(0)
  })

  it('allies가 빈 배열로 시작된다', () => {
    expect(makeRun().allies).toHaveLength(0)
  })

  it('캐릭터의 innateSkill이 skillIds에 포함된다', () => {
    const run = makeRun('dark_knight')
    expect(run.character.skillIds).toContain('shadow_strike') // dark_knight innateSkillId
  })

  it('존재하지 않는 캐릭터 ID는 에러를 던진다', () => {
    expect(() => createRun('nobody', 1)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// startBattle
// ---------------------------------------------------------------------------

describe('startBattle', () => {
  it('BattleState를 생성하고 phase가 player_turn이다', () => {
    const run = makeRun()
    const [battle] = startBattle(run, makeRng())
    expect(battle.phase).toBe('player_turn')
  })

  it('라운드 1 — 초반 적이 1명 등장한다', () => {
    const run = makeRun()
    const [battle] = startBattle(run, makeRng())
    expect(battle.enemies.length).toBe(1)
  })

  it('라운드 7 — 보스 dragon_lord 단독 등장한다', () => {
    const run = { ...makeRun(), round: MAX_ROUNDS }
    const [battle] = startBattle(run, makeRng())
    expect(battle.enemies).toHaveLength(1)
    expect(battle.enemies[0].defId).toBe('dragon_lord')
  })

  it('시작 로그에 라운드 시작 메시지가 있다', () => {
    const run = makeRun()
    const [battle] = startBattle(run, makeRng())
    expect(battle.log[0].text).toContain('라운드 1')
  })

  it('party에 캐릭터가 포함된다', () => {
    const run = makeRun()
    const [battle] = startBattle(run, makeRng())
    expect(battle.party).toHaveLength(1)
    expect(battle.party[0].defId).toBe('dark_knight')
  })
})

// ---------------------------------------------------------------------------
// completeBattle
// ---------------------------------------------------------------------------

describe('completeBattle', () => {
  it('마지막 라운드가 아니면 draft 페이즈로 전환된다', () => {
    const run = makeRun()
    const battleState = makeCompletedBattleState()
    const [nextRun] = completeBattle(run, battleState, makeRng())
    expect(nextRun.phase).toBe('draft')
  })

  it('마지막 라운드 클리어 시 result 페이즈로 전환된다', () => {
    const run = { ...makeRun(), round: MAX_ROUNDS }
    const battleState = makeCompletedBattleState()
    const [nextRun] = completeBattle(run, battleState, makeRng())
    expect(nextRun.phase).toBe('result')
    expect(nextRun.isVictory).toBe(true)
  })

  it('totalDamage가 누적된다', () => {
    const run = makeRun()
    const battleState = makeCompletedBattleState({ totalDamageDealt: 500 })
    const [nextRun] = completeBattle(run, battleState, makeRng())
    expect(nextRun.totalDamage).toBe(500)
  })

  it('draft 페이즈에서 round가 1 증가한다', () => {
    const run = makeRun()
    const [nextRun] = completeBattle(run, makeCompletedBattleState(), makeRng())
    expect(nextRun.round).toBe(2)
  })

  it('draft 옵션이 생성된다', () => {
    const run = makeRun()
    const [nextRun] = completeBattle(run, makeCompletedBattleState(), makeRng())
    expect(nextRun.draftOptions.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// handleDefeat
// ---------------------------------------------------------------------------

describe('handleDefeat', () => {
  it('result 페이즈로 전환되고 isVictory가 false다', () => {
    const run = makeRun()
    const battleState = makeCompletedBattleState({ totalDamageDealt: 300 })
    const result = handleDefeat(run, battleState)
    expect(result.phase).toBe('result')
    expect(result.isVictory).toBe(false)
  })

  it('totalDamage가 누적된다', () => {
    const run = { ...makeRun(), totalDamage: 100 }
    const battleState = makeCompletedBattleState({ totalDamageDealt: 300 })
    const result = handleDefeat(run, battleState)
    expect(result.totalDamage).toBe(400)
  })

  it('battleState가 null로 정리된다', () => {
    const run = makeRun()
    const result = handleDefeat(run, makeCompletedBattleState())
    expect(result.battleState).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// applyDraftChoice
// ---------------------------------------------------------------------------

describe('applyDraftChoice', () => {
  it('skill 선택 시 skillIds에 스킬이 추가된다', () => {
    const run = makeRun()
    const [runWithDraft] = completeBattle(run, makeCompletedBattleState(), makeRng())
    const skillOption = runWithDraft.draftOptions.find(o => o.type === 'skill')
    if (!skillOption || skillOption.type !== 'skill') return

    const idx = runWithDraft.draftOptions.indexOf(skillOption)
    const result = applyDraftChoice(runWithDraft, idx)
    expect(result.character.skillIds).toContain(skillOption.skillId)
    expect(result.phase).toBe('battle')
  })

  it('ally 선택 시 allies에 동료가 추가된다', () => {
    const run = makeRun()
    // 드래프트 옵션에서 ally가 나올 때까지 시드를 바꿔서 찾는다
    let allyIdx = -1
    let runWithDraft = makeRun()
    for (let seed = 0; seed < 100; seed++) {
      const rng = createRng(seed)
      const [r] = completeBattle(run, makeCompletedBattleState(), rng)
      const idx = r.draftOptions.findIndex(o => o.type === 'ally')
      if (idx !== -1) {
        allyIdx = idx
        runWithDraft = r
        break
      }
    }
    if (allyIdx === -1) return // ally 옵션이 없는 경우 skip

    const result = applyDraftChoice(runWithDraft, allyIdx)
    expect(result.allies.length).toBe(1)
  })

  it('item 선택 시 acquiredItemIds에 아이템이 추가된다', () => {
    // mana_crystal은 mp_regen 타입 — stat_boost가 아니므로 스탯 계산 없이 추가만 된다
    const run: RunState = {
      ...makeRun(),
      draftOptions: [{ type: 'item', itemId: 'mana_crystal' }],
    }
    const result = applyDraftChoice(run, 0)
    expect(result.acquiredItemIds).toContain('mana_crystal')
  })

  it('stat_boost 아이템은 캐릭터 스탯에 즉시 반영된다', () => {
    // iron_ring: attack +30
    const run: RunState = {
      ...makeRun(),
      draftOptions: [{ type: 'item', itemId: 'iron_ring' }],
    }
    const originalAttack = run.character.stats.attack
    const result = applyDraftChoice(run, 0)
    expect(result.character.stats.attack).toBe(originalAttack + 30)
  })

  it('maxHp 아이템은 현재 HP도 증가시킨다', () => {
    const run: RunState = {
      ...makeRun(),
      draftOptions: [{ type: 'item', itemId: 'vitality_gem' }],
    }
    const originalHp = run.character.stats.hp
    const result = applyDraftChoice(run, 0)
    expect(result.character.stats.hp).toBe(originalHp + 200)
  })

  it('잘못된 인덱스는 상태를 변경하지 않는다', () => {
    const run = makeRun()
    const result = applyDraftChoice(run, 99)
    expect(result).toBe(run)
  })

  it('선택 후 draftOptions가 초기화된다', () => {
    const run: RunState = {
      ...makeRun(),
      draftOptions: [{ type: 'item', itemId: 'iron_ring' }],
    }
    const result = applyDraftChoice(run, 0)
    expect(result.draftOptions).toHaveLength(0)
  })

  it('동료가 MAX_ALLIES에 달하면 ally 선택이 무시된다', () => {
    const fullAllies = Array.from({ length: MAX_ALLIES }, (_, i) =>
      createBattleAlly('forest_archer', i),
    )
    const run: RunState = {
      ...makeRun(),
      allies: fullAllies,
      draftOptions: [{ type: 'ally', allyId: 'battle_cleric' }],
    }
    const result = applyDraftChoice(run, 0)
    expect(result.allies.length).toBe(MAX_ALLIES)
  })
})

// ---------------------------------------------------------------------------
// generateDraftOptions
// ---------------------------------------------------------------------------

describe('generateDraftOptions', () => {
  it('3개 이하의 옵션을 반환한다', () => {
    const run = makeRun()
    const [options] = generateDraftOptions(run, makeRng())
    expect(options.length).toBeGreaterThan(0)
    expect(options.length).toBeLessThanOrEqual(3)
  })

  it('이미 보유한 스킬은 제외된다', () => {
    const run = makeRun('dark_knight')
    const ownedSkillIds = new Set(run.character.skillIds)
    const [options] = generateDraftOptions(run, makeRng())
    const skillOptions = options.filter(o => o.type === 'skill')
    for (const opt of skillOptions) {
      if (opt.type === 'skill') {
        expect(ownedSkillIds.has(opt.skillId)).toBe(false)
      }
    }
  })

  it('동료가 MAX_ALLIES에 달하면 ally 옵션이 없다', () => {
    const fullAllies = Array.from({ length: MAX_ALLIES }, (_, i) =>
      createBattleAlly('forest_archer', i),
    )
    const run: RunState = { ...makeRun(), allies: fullAllies }
    const [options] = generateDraftOptions(run, makeRng())
    expect(options.some(o => o.type === 'ally')).toBe(false)
  })
})
