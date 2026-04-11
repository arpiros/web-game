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
  DraftOption,
  Stats,
} from './types'
import type { RngState } from './rng'
import { pickN } from './rng'
import { getCharacterById } from './data/characters'
import { getEnemyById, getEnemyPoolForRound } from './data/enemies'
import { getAllyById, ALLIES } from './data/allies'
import { getItemById, ITEMS } from './data/items'
import { SKILLS } from './data/skills'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_ROUNDS = 7
export const MAX_ALLIES = 4

/** 라운드별 적 등장 수 */
const ENEMY_COUNT_BY_ROUND: Record<number, number> = {
  1: 1,
  2: 2,
  3: 2,
  4: 3,
  5: 3,
  6: 3,
  7: 1, // 보스전
}

/** 라운드 7은 항상 dragon_lord */
const BOSS_ENEMY_ID = 'dragon_lord'

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
    if (item.effect.type === 'stat_boost') {
      switch (item.effect.stat) {
        case 'attack':  attack  += item.effect.amount; break
        case 'defense': defense += item.effect.amount; break
        case 'speed':   speed   += item.effect.amount; break
        case 'maxHp':   maxHp   += item.effect.amount; break
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
): BattleEnemy {
  const def = getEnemyById(enemyDefId)
  if (!def) {
    throw new Error(`Unknown enemy: ${enemyDefId}`)
  }

  // 라운드가 높을수록 스탯 강화 (10% per round after round 1)
  const scale = 1 + (round - 1) * 0.1

  return {
    id: `enemy-${index}`,
    defId: def.id,
    name: def.name,
    stats: {
      maxHp:   Math.floor(def.baseStats.maxHp   * scale),
      hp:      Math.floor(def.baseStats.maxHp   * scale),
      attack:  Math.floor(def.baseStats.attack  * scale),
      defense: Math.floor(def.baseStats.defense * scale),
      speed:   def.baseStats.speed,
      maxMp:   0,
      mp:      0,
    },
    actions: def.actions,
    actionIndex: 0,
    element: def.element,
    isAlive: true,
    statusEffects: [],
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
  } else {
    const pool = getEnemyPoolForRound(round)
    const [picked, nextRng] = pickN(currentRng, pool, Math.min(enemyCount, pool.length))
    currentRng = nextRng
    enemies = picked.map((def, i) => createBattleEnemy(def.id, round, i))
  }

  const acquiredItems = runState.acquiredItemIds
    .map(id => getItemById(id))
    .filter((item): item is NonNullable<typeof item> => item !== undefined)

  const battleState: BattleState = {
    phase: 'player_turn',
    turnCount: 0,
    party: [runState.character],
    allies: runState.allies,
    enemies,
    log: [
      {
        id: `log-start-${round}`,
        kind: 'system',
        text: `라운드 ${round} 시작!`,
      },
    ],
    totalDamageDealt: 0,
    selectedSkillId: null,
    selectedTargetId: null,
    items: acquiredItems,
  }

  return [battleState, currentRng]
}

// ---------------------------------------------------------------------------
// 전투 완료 처리 (victory → draft 또는 result)
// ---------------------------------------------------------------------------

export function completeBattle(
  runState: RunState,
  battleState: BattleState,
  rng: RngState,
): [RunState, RngState] {
  const newTotalDamage = runState.totalDamage + battleState.totalDamageDealt

  // 마지막 라운드 클리어 → 게임 클리어
  if (runState.round >= MAX_ROUNDS) {
    return [
      {
        ...runState,
        phase: 'result',
        battleState: null,
        totalDamage: newTotalDamage,
        isVictory: true,
      },
      rng,
    ]
  }

  // 드래프트 옵션 생성
  const [draftOptions, nextRng] = generateDraftOptions(runState, rng)

  return [
    {
      ...runState,
      phase: 'draft',
      round: runState.round + 1,
      character: battleState.party[0],
      battleState: null,
      totalDamage: newTotalDamage,
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
      if (item && item.effect.type === 'stat_boost') {
        const { stat, amount } = item.effect
        const stats = { ...character.stats }
        switch (stat) {
          case 'attack':  stats.attack  = stats.attack  + amount; break
          case 'defense': stats.defense = stats.defense + amount; break
          case 'speed':   stats.speed   = stats.speed   + amount; break
          case 'maxHp': {
            stats.maxHp = stats.maxHp + amount
            stats.hp    = Math.min(stats.hp + amount, stats.maxHp)
            break
          }
        }
        // Stats는 readonly이므로 새 객체 생성
        character = { ...character, stats: stats as typeof character.stats }
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
// 드래프트 옵션 생성
// ---------------------------------------------------------------------------

const DRAFT_COUNT = 3

export function generateDraftOptions(
  runState: RunState,
  rng: RngState,
): [DraftOption[], RngState] {
  const ownedSkillIds = new Set(runState.character.skillIds)
  const ownedAllyIds = new Set(runState.allies.map(a => a.defId))
  const ownedItemIds = new Set(runState.acquiredItemIds)

  // 획득 가능한 스킬 (이미 보유한 스킬 제외)
  const availableSkills = SKILLS.filter(s => !ownedSkillIds.has(s.id))

  // 획득 가능한 동료 (이미 보유, 파티 풀인 경우 제외)
  const canAddAlly = runState.allies.length < MAX_ALLIES
  const availableAllies = canAddAlly
    ? ALLIES.filter(a => !ownedAllyIds.has(a.id))
    : []

  // 획득 가능한 아이템 (이미 보유한 아이템 제외)
  const availableItems = ITEMS.filter(i => !ownedItemIds.has(i.id))

  // 전체 후보풀 구성 (DraftOption 형식)
  const pool: DraftOption[] = [
    ...availableSkills.map(s => ({ type: 'skill' as const, skillId: s.id })),
    ...availableAllies.map(a => ({ type: 'ally' as const, allyId: a.id })),
    ...availableItems.map(i => ({ type: 'item' as const, itemId: i.id })),
  ]

  if (pool.length === 0) {
    return [[], rng]
  }

  const [picked, nextRng] = pickN(rng, pool, Math.min(DRAFT_COUNT, pool.length))
  return [picked, nextRng]
}

// ---------------------------------------------------------------------------
// 패배 처리
// ---------------------------------------------------------------------------

export function handleDefeat(runState: RunState, battleState: BattleState): RunState {
  return {
    ...runState,
    phase: 'result',
    totalDamage: runState.totalDamage + battleState.totalDamageDealt,
    battleState: null,
    isVictory: false,
  }
}
