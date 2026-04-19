/* ==========================================================================
   Dark Fantasy Roguelike — Run Loop
   Pure functions only. Zero React/Zustand dependency.
   ========================================================================== */

import type {
  RunState,
  BattleState,
  BattleCharacter,
  BattleAlly,
  BattleEnemy,
  BattleLogEntry,
  DraftOption,
  Stats,
  CharacterDef,
} from './types'
import type { RngState } from './rng'
import { pickN, pickNWeighted } from './rng'
import { getCharacterById } from './data/characters'
import { getEnemyById, getEnemyPoolForRound, getEliteEnemyPool } from './data/enemies'
import { getAllyById, ALLIES } from './data/allies'
import { getItemById, ITEMS } from './data/items'
import { SKILLS } from './data/skills'
import { CRAFT_RESULT_IDS, RECIPES } from './data/recipes'
import { applyCraft } from './craft'
import { EVENTS, getEventById } from './data/events'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_ROUNDS = 15
export const MAX_ALLIES = 4

/** 라운드별 적 등장 수 */
const ENEMY_COUNT_BY_ROUND: Record<number, number> = {
  1:  1,
  2:  2,
  3:  1,
  4:  2,
  5:  2,  // 엘리트
  6:  3,
  7:  2,
  8:  3,
  9:  3,
  10: 2,  // 엘리트
  11: 3,
  12: 3,
  13: 3,
  14: 3,
  15: 1,  // 보스전
}

/** 라운드 15은 항상 dragon_lord */
const BOSS_ENEMY_ID = 'dragon_lord'

/** 엘리트 적이 등장하는 라운드 */
const ELITE_ROUNDS = new Set([5, 10])

/** 이벤트가 등장하는 라운드 (전투 완료 후 드래프트 전) */
const EVENT_ROUNDS = new Set([3, 7, 12])

/** 엘리트 스탯 배율 (라운드 스케일링 위에 추가 적용) */
const ELITE_STAT_MULTIPLIER = 1.2

// ---------------------------------------------------------------------------
// Character → BattleCharacter
// ---------------------------------------------------------------------------

/**
 * CharacterDef + 아이템 효과를 반영하여 BattleCharacter 생성
 */
export function createBattleCharacter(
  characterDefId: string,
  skillIds: readonly string[],
  itemIds: readonly string[],
): BattleCharacter {
  const def = getCharacterById(characterDefId)
  if (!def) {
    throw new Error(`Unknown character: ${characterDefId}`)
  }

  // 기본 스탯
  let attack = def.baseStats.attack
  let defense = def.baseStats.defense
  let speed = def.baseStats.speed
  let maxHp = def.baseStats.maxHp
  let maxMp = def.baseStats.maxMp

  // 아이템 stat_boost 효과 적용
  for (const itemId of itemIds) {
    const item = getItemById(itemId)
    if (!item) continue
    for (const eff of item.effects) {
      if (eff.type === 'stat_boost') {
        switch (eff.stat) {
          case 'attack':  attack  += eff.amount; break
          case 'defense': defense += eff.amount; break
          case 'speed':   speed   += eff.amount; break
          case 'maxHp':   maxHp   += eff.amount; break
        }
      }
    }
  }

  const stats: Stats = {
    maxHp,
    hp: maxHp,
    attack,
    defense,
    speed,
    maxMp,
    mp: maxMp,
  }

  return {
    id: 'player',
    defId: def.id,
    name: def.name,
    stats,
    skillIds,
    skillCooldowns: {},
    statusEffects: [],
    element: def.element,
    isAlive: true,
  }
}

// ---------------------------------------------------------------------------
// AllyDef → BattleAlly
// ---------------------------------------------------------------------------

export function createBattleAlly(allyDefId: string, index: number): BattleAlly {
  const def = getAllyById(allyDefId)
  if (!def) {
    throw new Error(`Unknown ally: ${allyDefId}`)
  }
  return {
    id: `ally-${index}`,
    defId: def.id,
    name: def.name,
    stats: {
      maxHp: def.baseStats.maxHp,
      hp: def.baseStats.maxHp,
      attack: def.baseStats.attack,
      defense: def.baseStats.defense,
      speed: def.baseStats.speed,
      maxMp: 0,
      mp: 0,
    },
    action: def.action,
    element: def.element,
    isAlive: true,
    statusEffects: [],
  }
}

// ---------------------------------------------------------------------------
// EnemyDef → BattleEnemy (라운드 기반 스케일링)
// ---------------------------------------------------------------------------

export function createBattleEnemy(
  enemyDefId: string,
  round: number,
  index: number,
  isElite = false,
): BattleEnemy {
  const def = getEnemyById(enemyDefId)
  if (!def) {
    throw new Error(`Unknown enemy: ${enemyDefId}`)
  }

  // 라운드가 높을수록 스탯 강화 (5% per round after round 1)
  const roundScale = 1 + (round - 1) * 0.05
  // 엘리트는 라운드 스케일 위에 추가 배율 적용
  const scale = isElite ? roundScale * ELITE_STAT_MULTIPLIER : roundScale

  return {
    id: `enemy-${index}`,
    defId: def.id,
    name: def.name,
    isBoss: def.isBoss,
    isElite,
    stats: {
      maxHp:   Math.floor(def.baseStats.maxHp  * scale),
      hp:      Math.floor(def.baseStats.maxHp  * scale),
      attack:  Math.floor(def.baseStats.attack * scale),
      defense: def.baseStats.defense,
      speed:   def.baseStats.speed,
      maxMp:   0,
      mp:      0,
    },
    actions: def.actions,
    actionIndex: 0,
    element: def.element,
    isAlive: true,
    statusEffects: def.id === 'dragon_lord'
      ? [{ kind: 'cc_immune' as const, duration: 999, value: 0, sourceId: 'system' }]
      : [],
    bossPhases: def.bossPhases,
    bossCurrentPhase: def.bossPhases ? 1 : undefined,
  }
}

// ---------------------------------------------------------------------------
// Run 초기화
// ---------------------------------------------------------------------------

export function createRun(characterDefId: string, seed: number): RunState {
  const def = getCharacterById(characterDefId)
  if (!def) {
    throw new Error(`Unknown character: ${characterDefId}`)
  }

  const allSkillIds = [def.innateSkillId, ...def.startingSkillIds]
  const character = createBattleCharacter(characterDefId, allSkillIds, [])

  return {
    phase: 'battle',
    seed,
    round: 1,
    character,
    allies: [],
    acquiredItemIds: [],
    battleState: null,
    totalDamage: 0,
    draftOptions: [],
    maxSingleDamage: 0,
    critCount: 0,
    missCount: 0,
    totalHealing: 0,
    totalTurns: 0,
    skillUseCounts: {},
  }
}

// ---------------------------------------------------------------------------
// 전투 시작 (RunState → BattleState 생성)
// ---------------------------------------------------------------------------

export function startBattle(runState: RunState, rng: RngState): [BattleState, RngState] {
  const { round } = runState
  const enemyCount = ENEMY_COUNT_BY_ROUND[round] ?? 3

  let currentRng = rng
  let enemies: BattleEnemy[]

  if (round === MAX_ROUNDS) {
    // 보스전
    enemies = [createBattleEnemy(BOSS_ENEMY_ID, round, 0)]
  } else if (ELITE_ROUNDS.has(round)) {
    // 엘리트 라운드: 엘리트 1마리 + 나머지 일반 적
    const elitePool = getEliteEnemyPool()
    const [pickedElites, rng2] = pickN(currentRng, elitePool, 1)
    currentRng = rng2

    const normalCount = enemyCount - 1
    const normalPool = getEnemyPoolForRound(round)
    const [pickedNormals, rng3] = pickN(currentRng, normalPool, Math.min(normalCount, normalPool.length))
    currentRng = rng3

    enemies = [
      createBattleEnemy(pickedElites[0].id, round, 0, true),
      ...pickedNormals.map((def, i) => createBattleEnemy(def.id, round, i + 1)),
    ]
  } else {
    const pool = getEnemyPoolForRound(round)
    const [picked, nextRng] = pickN(currentRng, pool, Math.min(enemyCount, pool.length))
    currentRng = nextRng
    enemies = picked.map((def, i) => createBattleEnemy(def.id, round, i))
  }

  const acquiredItems = runState.acquiredItemIds
    .map(id => getItemById(id))
    .filter((item): item is NonNullable<typeof item> => item !== undefined)

  const hasDeathPrevention = acquiredItems.some(item =>
    item.effects.some(eff => eff.type === 'death_prevention')
  )

  const partyWithBuffs = hasDeathPrevention
    ? [runState.character].map(c =>
        c.isAlive
          ? {
              ...c,
              statusEffects: [
                ...c.statusEffects,
                { kind: 'undying' as const, duration: 999, value: 0, sourceId: 'system' },
              ],
            }
          : c
      )
    : [runState.character]

  const alliesWithBuffs = hasDeathPrevention
    ? runState.allies.map(a =>
        a.isAlive
          ? {
              ...a,
              statusEffects: [
                ...a.statusEffects,
                { kind: 'undying' as const, duration: 999, value: 0, sourceId: 'system' },
              ],
            }
          : a
      )
    : runState.allies

  const startLog: BattleLogEntry[] = [
    {
      id: `log-start-${round}`,
      kind: 'system',
      text: `라운드 ${round} 시작!`,
    },
  ]
  if (ELITE_ROUNDS.has(round)) {
    startLog.push({
      id: `log-elite-${round}`,
      kind: 'system',
      text: '⚔ 엘리트 조우! 강적이 나타났다. 처치 시 추가 보상을 획득한다.',
    })
  }
  if (hasDeathPrevention) {
    startLog.push({
      id: `log-undying-${round}`,
      kind: 'system',
      text: '수호의 부적: 파티 전원이 불사 상태가 됩니다!',
    })
  }

  const battleState: BattleState = {
    phase: 'player_turn',
    turnCount: 0,
    party: partyWithBuffs,
    allies: alliesWithBuffs,
    enemies,
    log: startLog,
    totalDamageDealt: 0,
    selectedSkillId: null,
    selectedTargetId: null,
    items: acquiredItems,
    rng: currentRng,
    skillUseCounts: {},
  }

  return [battleState, currentRng]
}

// ---------------------------------------------------------------------------
// 전투 완료 처리 (victory → draft 또는 result)
// ---------------------------------------------------------------------------

/** 배틀 로그에서 통계를 집계한다 */
function accumulateBattleStats(
  runState: RunState,
  battleState: BattleState,
  newTotalDamage: number,
): Pick<RunState, 'totalDamage' | 'maxSingleDamage' | 'critCount' | 'missCount' | 'totalHealing' | 'totalTurns' | 'skillUseCounts'> {
  let maxSingleDamage = runState.maxSingleDamage
  let critCount = runState.critCount
  let missCount = runState.missCount
  let totalHealing = runState.totalHealing

  for (const entry of battleState.log) {
    if (entry.kind === 'crit') {
      critCount++
      if ((entry.value ?? 0) > maxSingleDamage) maxSingleDamage = entry.value ?? 0
    } else if (entry.kind === 'damage') {
      if ((entry.value ?? 0) > maxSingleDamage) maxSingleDamage = entry.value ?? 0
    } else if (entry.kind === 'miss') {
      missCount++
    } else if (entry.kind === 'heal') {
      totalHealing += entry.value ?? 0
    }
  }

  // skillUseCounts 병합
  const merged: Record<string, number> = { ...runState.skillUseCounts }
  for (const [skillId, count] of Object.entries(battleState.skillUseCounts ?? {})) {
    merged[skillId] = (merged[skillId] ?? 0) + count
  }

  return {
    totalDamage: newTotalDamage,
    maxSingleDamage,
    critCount,
    missCount,
    totalHealing,
    totalTurns: runState.totalTurns + battleState.turnCount,
    skillUseCounts: merged,
  }
}

export function completeBattle(
  runState: RunState,
  battleState: BattleState,
  rng: RngState,
): [RunState, RngState] {
  const newTotalDamage = runState.totalDamage + battleState.totalDamageDealt
  const stats = accumulateBattleStats(runState, battleState, newTotalDamage)

  // 마지막 라운드 클리어 → 게임 클리어
  if (runState.round >= MAX_ROUNDS) {
    return [
      {
        ...runState,
        ...stats,
        phase: 'result',
        battleState: null,
        isVictory: true,
      },
      rng,
    ]
  }

  // 엘리트 처치 시 추가 드래프트 옵션 +1
  const hadElite = battleState.enemies.some(e => e.isElite)
  const draftCount = hadElite ? DRAFT_COUNT + 1 : DRAFT_COUNT

  // 드래프트 옵션 생성
  const [draftOptions, nextRng] = generateDraftOptions(runState, rng, draftCount)

  // 전투 클리어 보상: 최대 HP의 35% 회복
  const VICTORY_HEAL_RATIO = 0.35
  const survivingChar = battleState.party[0]
  const victoryHeal = Math.floor(survivingChar.stats.maxHp * VICTORY_HEAL_RATIO)
  const healedCharacter = {
    ...survivingChar,
    stats: {
      ...survivingChar.stats,
      hp: Math.min(survivingChar.stats.maxHp, survivingChar.stats.hp + victoryHeal),
    },
  }

  const nextRound = runState.round + 1

  // 이벤트 라운드 전환: 드래프트 전에 이벤트 화면 삽입
  if (EVENT_ROUNDS.has(runState.round)) {
    const [pickedEvents, eventRng] = pickN(nextRng, EVENTS, 1)
    const eventId = pickedEvents[0].id
    return [
      {
        ...runState,
        ...stats,
        phase: 'event',
        round: nextRound,
        character: healedCharacter,
        battleState: null,
        draftOptions,
        currentEventId: eventId,
      },
      eventRng,
    ]
  }

  return [
    {
      ...runState,
      ...stats,
      phase: 'draft',
      round: nextRound,
      character: healedCharacter,
      battleState: null,
      draftOptions,
    },
    nextRng,
  ]
}

// ---------------------------------------------------------------------------
// 드래프트 옵션 선택 적용
// ---------------------------------------------------------------------------

export function applyDraftChoice(runState: RunState, choiceIndex: number): RunState {
  const choice = runState.draftOptions[choiceIndex]
  if (!choice) return runState

  let { character, allies, acquiredItemIds } = runState

  switch (choice.type) {
    case 'skill': {
      const newSkillIds = [...character.skillIds, choice.skillId]
      character = { ...character, skillIds: newSkillIds }
      break
    }
    case 'ally': {
      if (allies.length < MAX_ALLIES) {
        const newAlly = createBattleAlly(choice.allyId, allies.length)
        allies = [...allies, newAlly]
      }
      break
    }
    case 'item': {
      acquiredItemIds = [...acquiredItemIds, choice.itemId]
      // stat_boost 아이템은 즉시 캐릭터 스탯에 반영
      const item = getItemById(choice.itemId)
      if (item) {
        const stats = { ...character.stats }
        let changed = false
        for (const eff of item.effects) {
          if (eff.type === 'stat_boost') {
            changed = true
            switch (eff.stat) {
              case 'attack':  stats.attack  = stats.attack  + eff.amount; break
              case 'defense': stats.defense = stats.defense + eff.amount; break
              case 'speed':   stats.speed   = stats.speed   + eff.amount; break
              case 'maxHp': {
                stats.maxHp = stats.maxHp + eff.amount
                stats.hp    = Math.min(stats.hp + eff.amount, stats.maxHp)
                break
              }
            }
          }
        }
        if (changed) {
          character = { ...character, stats: stats as typeof character.stats }
        }
      }
      break
    }
  }

  return {
    ...runState,
    phase: 'battle',
    character,
    allies,
    acquiredItemIds,
    draftOptions: [],
  }
}

// ---------------------------------------------------------------------------
// 조합(Craft) 선택
// ---------------------------------------------------------------------------

/**
 * 레시피로 조합을 수행하고 바로 다음 전투 phase로 전환한다.
 * 조합 1회 = 드래프트 보상 1회 포기이므로 draftOptions를 비운다.
 */
export function applyCraftChoice(runState: RunState, recipeId: string): RunState {
  const recipe = RECIPES.find(r => r.id === recipeId)
  if (!recipe) return runState

  const { skillIds, itemIds } = applyCraft(
    recipe,
    runState.character.skillIds,
    runState.acquiredItemIds,
  )

  let { character, acquiredItemIds } = runState

  // stat_boost 아이템이 결과물인 경우 스탯 즉시 반영
  if (recipe.category === 'item') {
    const item = getItemById(recipe.resultId)
    if (item) {
      const stats = { ...character.stats }
      let changed = false
      for (const eff of item.effects) {
        if (eff.type === 'stat_boost') {
          changed = true
          switch (eff.stat) {
            case 'attack':  stats.attack  = stats.attack  + eff.amount; break
            case 'defense': stats.defense = stats.defense + eff.amount; break
            case 'speed':   stats.speed   = stats.speed   + eff.amount; break
            case 'maxHp': {
              stats.maxHp = stats.maxHp + eff.amount
              stats.hp    = Math.min(stats.hp + eff.amount, stats.maxHp)
              break
            }
          }
        }
      }
      if (changed) {
        character = { ...character, stats: stats as typeof character.stats }
      }
    }
  }

  character = { ...character, skillIds }
  acquiredItemIds = itemIds as string[]

  return {
    ...runState,
    phase: 'battle',
    character,
    acquiredItemIds,
    draftOptions: [],
  }
}

// ---------------------------------------------------------------------------
// 이벤트 선택 적용
// ---------------------------------------------------------------------------

export function applyEventChoice(
  runState: RunState,
  choiceId: string,
  rng: RngState,
): [RunState, RngState] {
  const event = runState.currentEventId ? getEventById(runState.currentEventId) : undefined
  if (!event) {
    return [{ ...runState, phase: 'draft', currentEventId: undefined }, rng]
  }

  const choice = event.choices.find(c => c.id === choiceId)
  if (!choice) {
    return [{ ...runState, phase: 'draft', currentEventId: undefined }, rng]
  }

  let { character, acquiredItemIds } = runState
  let currentRng = rng

  for (const effect of choice.effects) {
    switch (effect.type) {
      case 'heal_hp': {
        const healAmount = Math.floor(character.stats.maxHp * effect.percent)
        character = {
          ...character,
          stats: {
            ...character.stats,
            hp: Math.min(character.stats.maxHp, character.stats.hp + healAmount),
          },
        }
        break
      }
      case 'stat_change': {
        const stats = { ...character.stats }
        switch (effect.stat) {
          case 'attack':  stats.attack  = Math.max(1, stats.attack  + effect.amount); break
          case 'defense': stats.defense = Math.max(0, stats.defense + effect.amount); break
          case 'maxHp': {
            const newMaxHp = Math.max(1, stats.maxHp + effect.amount)
            stats.maxHp = newMaxHp
            stats.hp = Math.max(1, Math.min(stats.hp, newMaxHp))
            break
          }
        }
        character = { ...character, stats: stats as typeof character.stats }
        break
      }
      case 'gain_skill': {
        const ownedSkillIds = new Set(character.skillIds)
        const pool = SKILLS.filter(
          s => s.rarity === effect.rarity && !ownedSkillIds.has(s.id)
        )
        if (pool.length > 0) {
          const [picked, nextRng] = pickN(currentRng, pool, 1)
          currentRng = nextRng
          character = { ...character, skillIds: [...character.skillIds, picked[0].id] }
        }
        break
      }
      case 'gain_item': {
        const pool = ITEMS.filter(i => i.rarity === effect.rarity)
        if (pool.length > 0) {
          const [picked, nextRng] = pickN(currentRng, pool, 1)
          currentRng = nextRng
          const item = picked[0]
          acquiredItemIds = [...acquiredItemIds, item.id]
          // stat_boost 즉시 반영
          const stats = { ...character.stats }
          let changed = false
          for (const eff of item.effects) {
            if (eff.type === 'stat_boost') {
              changed = true
              switch (eff.stat) {
                case 'attack':  stats.attack  = stats.attack  + eff.amount; break
                case 'defense': stats.defense = stats.defense + eff.amount; break
                case 'speed':   stats.speed   = stats.speed   + eff.amount; break
                case 'maxHp': {
                  stats.maxHp = stats.maxHp + eff.amount
                  stats.hp    = Math.min(stats.hp + eff.amount, stats.maxHp)
                  break
                }
              }
            }
          }
          if (changed) {
            character = { ...character, stats: stats as typeof character.stats }
          }
        }
        break
      }
      case 'nothing':
        break
    }
  }

  return [
    {
      ...runState,
      phase: 'draft',
      character,
      acquiredItemIds,
      currentEventId: undefined,
    },
    currentRng,
  ]
}

// ---------------------------------------------------------------------------
// 드래프트 옵션 생성
// ---------------------------------------------------------------------------

const DRAFT_COUNT = 3

// 캐릭터 원소와 스킬/동료 원소가 일치할 때 적용되는 가중치 배율
const ELEMENT_MATCH_WEIGHT = 3

const EARLY_SURVIVAL_BONUS_ITEMS = new Set([
  'vitality_gem', 'tough_armor', 'mana_crystal', 'iron_ring',
])
const EARLY_SURVIVAL_ROUND_CAP = 4
const EARLY_SURVIVAL_WEIGHT_BONUS = 2
// 캐릭터 원소와 관련 있는 원소 쌍 (예: dark <-> physical, fire <-> light 반대)
const ELEMENT_AFFINITY: Readonly<Record<string, readonly string[]>> = {
  fire:     ['fire'],
  dark:     ['dark', 'physical'],
  light:    ['light', 'water'],
  water:    ['water', 'light'],
  physical: ['physical', 'dark'],
}

function getDraftWeight(
  option: DraftOption,
  characterDef: CharacterDef,
  round: number,
): number {
  const affinity = ELEMENT_AFFINITY[characterDef.element] ?? [characterDef.element]
  const weights = characterDef.draftWeights ?? {}

  if (option.type === 'skill') {
    if (weights[option.skillId] !== undefined) return weights[option.skillId]
    const skill = SKILLS.find(s => s.id === option.skillId)
    if (skill && affinity.includes(skill.element)) return ELEMENT_MATCH_WEIGHT
  }

  if (option.type === 'ally') {
    if (weights[option.allyId] !== undefined) return weights[option.allyId]
    const ally = ALLIES.find(a => a.id === option.allyId)
    if (ally && affinity.includes(ally.element)) return ELEMENT_MATCH_WEIGHT
  }

  if (option.type === 'item') {
    const base = weights[option.itemId] ?? 1
    const bonus = round <= EARLY_SURVIVAL_ROUND_CAP && EARLY_SURVIVAL_BONUS_ITEMS.has(option.itemId)
      ? EARLY_SURVIVAL_WEIGHT_BONUS
      : 0
    return base + bonus
  }

  return 1
}

export function generateDraftOptions(
  runState: RunState,
  rng: RngState,
  count = DRAFT_COUNT,
): [DraftOption[], RngState] {
  const ownedSkillIds = new Set(runState.character.skillIds)
  const ownedAllyIds = new Set(runState.allies.map(a => a.defId))
  const ownedItemIds = new Set(runState.acquiredItemIds)

  // 획득 가능한 스킬 (이미 보유한 스킬 제외, 조합 전용 결과물 제외)
  const availableSkills = SKILLS.filter(
    s => !ownedSkillIds.has(s.id) && !CRAFT_RESULT_IDS.has(s.id),
  )

  // 획득 가능한 동료 (이미 보유, 파티 풀인 경우 제외)
  const canAddAlly = runState.allies.length < MAX_ALLIES
  const availableAllies = canAddAlly
    ? ALLIES.filter(a => !ownedAllyIds.has(a.id))
    : []

  // 획득 가능한 아이템 (이미 보유한 아이템 제외, 조합 전용 결과물 제외)
  const availableItems = ITEMS.filter(
    i => !ownedItemIds.has(i.id) && !CRAFT_RESULT_IDS.has(i.id),
  )

  // 전체 후보풀 구성 (DraftOption 형식)
  const pool: DraftOption[] = [
    ...availableSkills.map(s => ({ type: 'skill' as const, skillId: s.id })),
    ...availableAllies.map(a => ({ type: 'ally' as const, allyId: a.id })),
    ...availableItems.map(i => ({ type: 'item' as const, itemId: i.id })),
  ]

  if (pool.length === 0) {
    return [[], rng]
  }

  const characterDef = getCharacterById(runState.character.defId) ?? { element: runState.character.element, draftWeights: {} } as CharacterDef
  const weights = pool.map(option => getDraftWeight(option, characterDef, runState.round))

  const [picked, nextRng] = pickNWeighted(rng, pool, weights, Math.min(count, pool.length))
  return [picked, nextRng]
}

// ---------------------------------------------------------------------------
// 패배 처리
// ---------------------------------------------------------------------------

export function handleDefeat(runState: RunState, battleState: BattleState): RunState {
  const newTotalDamage = runState.totalDamage + battleState.totalDamageDealt
  const stats = accumulateBattleStats(runState, battleState, newTotalDamage)
  return {
    ...runState,
    ...stats,
    phase: 'result',
    battleState: null,
    isVictory: false,
  }
}
