/* ==========================================================================
   Dark Fantasy Roguelike — Combat Engine
   Pure functions only. No React/Zustand dependency.
   ========================================================================== */

import type {
  BattleState,
  BattleAction,
  BattleCharacter,
  BattleAlly,
  BattleEnemy,
  BattleLogEntry,
  SkillEffect,
  StatusEffect,
  StatusEffectKind,
  Element,
  EntityId,
  ItemDef,
  Stats,
} from './types'
import { roll } from './rng'
import type { RngState } from './rng'
import { getSkillById } from './data/skills'
import { hasSynergy } from './synergy'

// ---------------------------------------------------------------------------
// MP Regeneration Constants
// ---------------------------------------------------------------------------

/** 매 플레이어 턴 시작 시 자동으로 회복되는 MP */
const PASSIVE_MP_REGEN_PER_TURN = 3
/** 턴 종료 버튼 사용 시 추가 회복되는 MP */
const END_TURN_MP_BONUS = 8

/** 적에게 부여하는 디버프 목록. 이 외의 apply_status는 시전자 자신에게 적용 */
const DEBUFF_STATUSES = new Set<StatusEffectKind>(['poison', 'burn', 'freeze', 'stun', 'defdown'])

/** 전투 로그용 상태이상 한국어 이름 */
const STATUS_NAME_KO: Record<string, string> = {
  poison:   '독',
  burn:     '화상',
  freeze:   '빙결',
  stun:     '기절',
  shield:   '방어막',
  regen:    '재생',
  powerup:  '공격력 강화',
  defdown:  '방어력 약화',
  mana_regen: '마나 재생',
  cc_immune: 'CC 면역',
  revive:   '부활',
  undying:  '불사',
  defend:   '방어 태세',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _logIdCounter = 0
function makeLogId(): string {
  return `log-${++_logIdCounter}`
}

function log(
  kind: BattleLogEntry['kind'],
  text: string,
  opts?: { value?: number; sourceId?: EntityId; targetId?: EntityId },
): BattleLogEntry {
  return { id: makeLogId(), kind, text, ...opts }
}

// ---------------------------------------------------------------------------
// Damage Calculation
// ---------------------------------------------------------------------------

const ELEMENT_MULTIPLIERS: Record<Element, Partial<Record<Element, number>>> = {
  fire:     { water: 0.5, dark: 1.5 },
  water:    { fire: 1.5,  light: 0.75 },
  dark:     { light: 0.5, fire: 0.75 },
  light:    { dark: 1.75, water: 1.25 },
  physical: {},
}

function getElementMultiplier(attackElement: Element, defenderElement: Element): number {
  return ELEMENT_MULTIPLIERS[attackElement]?.[defenderElement] ?? 1.0
}

interface DamageParams {
  attack: number
  defense: number
  multiplier: number
  attackElement: Element
  defenderElement: Element
  /** 아이템 속성 배율 (이미 합산된 값) */
  itemElementMultiplier: number
  /** 공격자 powerup 스택 (value = % 증가) */
  powerupBonus: number
}

export function calcDamage(params: DamageParams): number {
  const {
    attack,
    defense,
    multiplier,
    attackElement,
    defenderElement,
    itemElementMultiplier,
    powerupBonus,
  } = params

  const rawAttack = attack * (1 + powerupBonus / 100) * multiplier
  const elementMult = getElementMultiplier(attackElement, defenderElement) * itemElementMultiplier
  // 방어 공식: damage = rawAttack * elementMult * (100 / (100 + defense))
  const defFactor = 100 / (100 + Math.max(0, defense))
  const damage = Math.round(rawAttack * elementMult * defFactor)
  return Math.max(1, damage)
}

// ---------------------------------------------------------------------------
// Critical / Miss Roll
// ---------------------------------------------------------------------------

interface CombatRollResult {
  isCrit: boolean
  isMiss: boolean
  nextRng: RngState
}

/**
 * 공격자 speed와 방어자 defense 기반으로 크리티컬/미스를 결정한다.
 * critChance  = min(25, 10 + (speed / 500) * 15) % + extraCritChance
 * missChance  = min(15,  5 + (defense / 1000) * 10) %
 * @param extraCritChance 추가 치명타 확률 (0.0~1.0). 기본값 0
 * @param missImmune 미스 면역 여부. 기본값 false
 */
export function rollCombat(
  rng: RngState,
  attackerSpeed: number,
  defenderDefense: number,
  extraCritChance = 0,
  missImmune = false,
): CombatRollResult {
  const baseCritChance = Math.min(25, 10 + (attackerSpeed / 500) * 15)
  const critChance = Math.min(100, baseCritChance + extraCritChance * 100)
  const missChance = Math.min(15, 5 + (defenderDefense / 1000) * 10)

  if (!missImmune) {
    const [isMiss, rng1] = roll(rng, missChance)
    if (isMiss) return { isCrit: false, isMiss: true, nextRng: rng1 }
    const [isCrit, rng2] = roll(rng1, critChance)
    return { isCrit, isMiss: false, nextRng: rng2 }
  }

  const [isCrit, rng1] = roll(rng, critChance)
  return { isCrit, isMiss: false, nextRng: rng1 }
}

// ---------------------------------------------------------------------------
// Status Effect Helpers
// ---------------------------------------------------------------------------

function getStatusBonus(effects: readonly StatusEffect[], kind: StatusEffectKind): number {
  return effects
    .filter(e => e.kind === kind)
    .reduce((sum, e) => sum + e.value, 0)
}

function hasStatus(effects: readonly StatusEffect[], kind: StatusEffectKind): boolean {
  return effects.some(e => e.kind === kind)
}

function addStatus(
  effects: readonly StatusEffect[],
  newEffect: StatusEffect,
): readonly StatusEffect[] {
  // 같은 종류가 있으면 남은 턴 수가 더 긴 걸로 갱신
  const existing = effects.findIndex(e => e.kind === newEffect.kind)
  if (existing >= 0) {
    const prev = effects[existing]
    const merged: StatusEffect = {
      ...prev,
      duration: Math.max(prev.duration, newEffect.duration),
      value: Math.max(prev.value, newEffect.value),
    }
    return [...effects.slice(0, existing), merged, ...effects.slice(existing + 1)]
  }
  return [...effects, newEffect]
}

function removeStatus(
  effects: readonly StatusEffect[],
  kind: StatusEffectKind,
): readonly StatusEffect[] {
  return effects.filter(e => e.kind !== kind)
}

function tickStatuses(effects: readonly StatusEffect[]): readonly StatusEffect[] {
  return effects
    .map(e => e.kind === 'cc_immune' ? e : { ...e, duration: e.duration - 1 })
    .filter(e => e.duration > 0)
}

// ---------------------------------------------------------------------------
// Entity Finders
// ---------------------------------------------------------------------------

function findCharacter(state: BattleState, id: EntityId): BattleCharacter | undefined {
  return state.party.find(c => c.id === id)
}

export function findAlly(state: BattleState, id: EntityId): BattleAlly | undefined {
  return state.allies.find(a => a.id === id)
}

function findEnemy(state: BattleState, id: EntityId): BattleEnemy | undefined {
  return state.enemies.find(e => e.id === id)
}

function updateCharacter(
  state: BattleState,
  id: EntityId,
  updater: (c: BattleCharacter) => BattleCharacter,
): BattleState {
  return {
    ...state,
    party: state.party.map(c => (c.id === id ? updater(c) : c)),
  }
}

/**
 * 살아있는 파티 캐릭터 전원의 MP를 amount만큼 회복한다 (maxMp 상한 적용).
 * 실제 회복이 발생한 경우에만 배틀 로그에 기록한다.
 */
function regenPartyMp(state: BattleState, amount: number, logMessage: string): BattleState {
  let next = state
  let anyRecovered = false

  for (const char of state.party) {
    if (!char.isAlive) continue
    const recovered = Math.min(amount, char.stats.maxMp - char.stats.mp)
    if (recovered <= 0) continue
    anyRecovered = true
    next = updateCharacter(next, char.id, c => ({
      ...c,
      stats: { ...c.stats, mp: c.stats.mp + recovered },
    }))
  }

  if (anyRecovered) {
    return { ...next, log: [...next.log, log('system', logMessage)] }
  }
  return next
}

function applyDefendToParty(state: BattleState): BattleState {
  let next = state
  for (const char of state.party) {
    if (!char.isAlive) continue
    next = updateCharacter(next, char.id, c => ({
      ...c,
      statusEffects: addStatus(c.statusEffects, {
        kind: 'defend',
        duration: 1,
        value: 0,
        sourceId: 'system',
      }),
    }))
  }
  return next
}

function updateEnemy(
  state: BattleState,
  id: EntityId,
  updater: (e: BattleEnemy) => BattleEnemy,
): BattleState {
  return {
    ...state,
    enemies: state.enemies.map(e => (e.id === id ? updater(e) : e)),
  }
}

export function updateAlly(
  state: BattleState,
  id: EntityId,
  updater: (a: BattleAlly) => BattleAlly,
): BattleState {
  return {
    ...state,
    allies: state.allies.map(a => (a.id === id ? updater(a) : a)),
  }
}

// ---------------------------------------------------------------------------
// Apply damage / heal to entity
// ---------------------------------------------------------------------------

function applyDamageToCharacter(
  state: BattleState,
  targetId: EntityId,
  damage: number,
): { state: BattleState; actualDamage: number; revived: boolean } {
  const target = findCharacter(state, targetId)
  if (!target || !target.isAlive) return { state, actualDamage: 0, revived: false }

  const shield = getStatusBonus(target.statusEffects, 'shield')
  const absorbed = Math.min(shield, damage)
  const remaining = damage - absorbed
  const isDefending = hasStatus(target.statusEffects, 'defend')
  const afterDefend = isDefending ? Math.max(1, Math.round(remaining * 0.7)) : remaining
  const newHp = Math.max(0, target.stats.hp - afterDefend)
  const actualDamage = afterDefend + absorbed

  const wouldDie = newHp <= 0
  const hasUndying = hasStatus(target.statusEffects, 'undying')
  const hasRevive = hasStatus(target.statusEffects, 'revive')

  const next = updateCharacter(state, targetId, c => {
    const afterShield = absorbed > 0 ? removeStatus(c.statusEffects, 'shield') : c.statusEffects
    if (wouldDie && hasUndying) {
      return {
        ...c,
        stats: { ...c.stats, hp: 1 },
        statusEffects: removeStatus(afterShield, 'undying'),
        isAlive: true,
      }
    }
    if (wouldDie && hasRevive) {
      return {
        ...c,
        stats: { ...c.stats, hp: Math.round(c.stats.maxHp * 0.3) },
        statusEffects: removeStatus(afterShield, 'revive'),
        isAlive: true,
      }
    }
    return {
      ...c,
      stats: { ...c.stats, hp: newHp },
      statusEffects: afterShield,
      isAlive: newHp > 0,
    }
  })

  return { state: next, actualDamage, revived: wouldDie && (hasUndying || hasRevive) }
}

function applyDamageToEnemy(
  state: BattleState,
  targetId: EntityId,
  damage: number,
): { state: BattleState; actualDamage: number } {
  const target = findEnemy(state, targetId)
  if (!target || !target.isAlive) return { state, actualDamage: 0 }

  const newHp = Math.max(0, target.stats.hp - damage)
  const next = updateEnemy(state, targetId, e => ({
    ...e,
    stats: { ...e.stats, hp: newHp },
    isAlive: newHp > 0,
  }))

  return { state: next, actualDamage: damage }
}

function applyDamageToAlly(
  state: BattleState,
  targetId: EntityId,
  damage: number,
): { state: BattleState; actualDamage: number } {
  const target = findAlly(state, targetId)
  if (!target || !target.isAlive) return { state, actualDamage: 0 }

  const shield = getStatusBonus(target.statusEffects, 'shield')
  const absorbed = Math.min(shield, damage)
  const remaining = damage - absorbed
  const isDefending = hasStatus(target.statusEffects, 'defend')
  const afterDefend = isDefending ? Math.max(1, Math.round(remaining * 0.7)) : remaining
  const newHp = Math.max(0, target.stats.hp - afterDefend)
  const actualDamage = afterDefend + absorbed

  const wouldDie = newHp <= 0
  const hasUndying = hasStatus(target.statusEffects, 'undying')
  const hasRevive = hasStatus(target.statusEffects, 'revive')

  const next = updateAlly(state, targetId, a => {
    const afterShield = absorbed > 0 ? removeStatus(a.statusEffects, 'shield') : a.statusEffects
    if (wouldDie && hasUndying) {
      return {
        ...a,
        stats: { ...a.stats, hp: 1 },
        statusEffects: removeStatus(afterShield, 'undying'),
        isAlive: true,
      }
    }
    if (wouldDie && hasRevive) {
      return {
        ...a,
        stats: { ...a.stats, hp: Math.round(a.stats.maxHp * 0.3) },
        statusEffects: removeStatus(afterShield, 'revive'),
        isAlive: true,
      }
    }
    return {
      ...a,
      stats: { ...a.stats, hp: newHp },
      statusEffects: afterShield,
      isAlive: newHp > 0,
    }
  })

  return { state: next, actualDamage }
}

function applyHealToCharacter(
  state: BattleState,
  targetId: EntityId,
  amount: number,
): BattleState {
  const target = findCharacter(state, targetId)
  if (!target || !target.isAlive) return state

  const newHp = Math.min(target.stats.maxHp, target.stats.hp + amount)
  return updateCharacter(state, targetId, c => ({
    ...c,
    stats: { ...c.stats, hp: newHp },
  }))
}

// ---------------------------------------------------------------------------
// Compute item bonuses for a character
// ---------------------------------------------------------------------------

export function getItemElementMultiplier(
  items: readonly ItemDef[],
  element: Element,
  attackerElement?: Element,
): number {
  let mult = 1.0
  for (const item of items) {
    for (const eff of item.effects) {
      if (eff.type === 'elemental_damage' && eff.element === element) {
        mult *= eff.multiplier
      }
      // 캐릭터 고유 원소와 스킬 원소가 일치할 때 추가 배율
      if (eff.type === 'elemental_match_damage' && attackerElement !== undefined && attackerElement === element) {
        mult *= eff.multiplier
      }
    }
  }
  return mult
}

// ---------------------------------------------------------------------------
// Apply a single SkillEffect
// ---------------------------------------------------------------------------

interface ApplyEffectContext {
  actorId: EntityId
  targetId: EntityId
  actorAttack: number
  actorSpeed: number
  actorElement: Element
  targetElement: Element
  items: readonly ItemDef[]
}

function applySkillEffect(
  state: BattleState,
  effect: SkillEffect,
  ctx: ApplyEffectContext,
): { state: BattleState; newLogs: BattleLogEntry[]; totalDamage: number } {
  const { actorId, targetId, actorAttack, actorSpeed, targetElement, items } = ctx
  const newLogs: BattleLogEntry[] = []
  let totalDamage = 0

  const powerupBonus = getStatusBonus(
    findCharacter(state, actorId)?.statusEffects ?? [],
    'powerup',
  )

  switch (effect.type) {
    case 'damage': {
      const target = findEnemy(state, targetId) ?? findCharacter(state, targetId)
      if (!target?.isAlive) break

      // 아이템 보너스 계산
      const extraCritChance = items.reduce((acc, item) => {
        for (const eff of item.effects) {
          if (eff.type === 'crit_chance_bonus') return acc + eff.amount
        }
        return acc
      }, 0)
      const missImmune = items.some(item => item.effects.some(eff => eff.type === 'miss_immunity'))

      // 크리티컬/미스 판정
      const combatRoll = rollCombat(state.rng, actorSpeed, target.stats.defense, extraCritChance, missImmune)
      let currentState = { ...state, rng: combatRoll.nextRng }

      if (combatRoll.isMiss) {
        newLogs.push(log('miss', `${target.name}에게 빗나감!`, { sourceId: actorId, targetId }))
        return { state: currentState, newLogs, totalDamage }
      }

      const itemMult = getItemElementMultiplier(items, effect.element, ctx.actorElement)
      let baseDmg = calcDamage({
        attack: actorAttack,
        defense: target.stats.defense,
        multiplier: effect.multiplier,
        attackElement: effect.element,
        defenderElement: targetElement,
        itemElementMultiplier: itemMult,
        powerupBonus,
      })
      const isCrit = combatRoll.isCrit
      if (isCrit) baseDmg = Math.round(baseDmg * 1.5)

      // 증기 폭발 시너지: 화염 스킬이 빙결된 적을 공격할 때 +50% 피해
      if (effect.element === 'fire' && hasSynergy(currentState.party, currentState.allies, 'steam_explosion')) {
        const frozenEnemy = findEnemy(currentState, targetId)
        if (frozenEnemy && hasStatus(frozenEnemy.statusEffects, 'freeze')) {
          baseDmg = Math.round(baseDmg * 1.5)
        }
      }

      // 보스 대미지 보너스
      const isEnemy = !!findEnemy(currentState, targetId)
      if (isEnemy) {
        const enemyTarget = findEnemy(currentState, targetId)
        if (enemyTarget?.isBoss) {
          const bossMult = items.reduce((acc, item) => {
            for (const eff of item.effects) {
              if (eff.type === 'boss_damage_bonus') return acc * eff.multiplier
            }
            return acc
          }, 1)
          baseDmg = Math.round(baseDmg * bossMult)
        }
      }

      let nextState: BattleState
      let actualDmg: number

      if (isEnemy) {
        const res = applyDamageToEnemy(currentState, targetId, baseDmg)
        nextState = res.state
        actualDmg = res.actualDamage
      } else {
        const res = applyDamageToCharacter(currentState, targetId, baseDmg)
        nextState = res.state
        actualDmg = res.actualDamage
      }

      // 흡혈 처리
      if (isEnemy && actualDmg > 0) {
        for (const item of items) {
          for (const eff of item.effects) {
            if (eff.type === 'lifesteal') {
              const healAmt = Math.round(actualDmg * eff.percent)
              if (healAmt > 0) {
                nextState = applyHealToCharacter(nextState, actorId, healAmt)
                newLogs.push(log('heal', `흡혈: HP ${healAmt} 회복.`, { value: healAmt, sourceId: actorId }))
              }
            }
          }
        }
      }

      // 파멸의 일격 시너지: 크리티컬 발생 시 대상에게 독(3턴) 자동 부여
      if (isCrit && isEnemy && hasSynergy(nextState.party, nextState.allies, 'doom_strike')) {
        const targetAfterDmg = findEnemy(nextState, targetId)
        if (targetAfterDmg?.isAlive) {
          const poisonStatus: StatusEffect = { kind: 'poison', duration: 3, value: 4, sourceId: actorId }
          nextState = updateEnemy(nextState, targetId, e => ({
            ...e,
            statusEffects: addStatus(e.statusEffects, poisonStatus),
          }))
          newLogs.push(log('status_apply', `파멸의 일격! ${target.name}에게 독이 스며든다.`, { sourceId: actorId, targetId }))
        }
      }

      totalDamage += isEnemy ? actualDmg : 0
      if (isCrit) {
        newLogs.push(log('crit', `크리티컬! ${target.name}에게 ${actualDmg} 피해!`, {
          value: actualDmg, sourceId: actorId, targetId,
        }))
      } else {
        newLogs.push(log('damage', `${target.name}에게 ${actualDmg} 피해!`, {
          value: actualDmg, sourceId: actorId, targetId,
        }))
      }

      const deadTarget = isEnemy
        ? nextState.enemies.find(e => e.id === targetId)
        : nextState.party.find(c => c.id === targetId)
      if (!deadTarget?.isAlive) {
        newLogs.push(log('death', `${target.name}이(가) 쓰러졌다!`, { targetId }))
        if (isEnemy) {
          const actor = findCharacter(nextState, actorId)
          if (actor) {
            const newMp = Math.min(actor.stats.maxMp, actor.stats.mp + 5)
            nextState = updateCharacter(nextState, actorId, c => ({
              ...c,
              stats: { ...c.stats, mp: newMp },
            }))
            newLogs.push(log('system', '적 처치! MP +5', { sourceId: actorId }))
            for (const item of items) {
              for (const eff of item.effects) {
                if (eff.type === 'heal_on_kill') {
                  nextState = applyHealToCharacter(nextState, actorId, eff.amount)
                  newLogs.push(log('heal', `처치 보너스: HP ${eff.amount} 회복`, { value: eff.amount, sourceId: actorId }))
                }
              }
            }
          }
        }
      }

      return { state: nextState, newLogs, totalDamage }
    }

    case 'damage_all': {
      let current = state
      const targets = current.enemies.filter(e => e.isAlive)

      // 아이템 보너스 (전체 공격에 공통 적용)
      const extraCritChanceAll = items.reduce((acc, item) => {
        for (const eff of item.effects) {
          if (eff.type === 'crit_chance_bonus') return acc + eff.amount
        }
        return acc
      }, 0)
      const missImmuneAll = items.some(item => item.effects.some(eff => eff.type === 'miss_immunity'))
      const bossMult = items.reduce((acc, item) => {
        for (const eff of item.effects) {
          if (eff.type === 'boss_damage_bonus') return acc * eff.multiplier
        }
        return acc
      }, 1)

      for (const enemy of targets) {
        // 크리티컬/미스 판정
        const combatRoll = rollCombat(current.rng, actorSpeed, enemy.stats.defense, extraCritChanceAll, missImmuneAll)
        current = { ...current, rng: combatRoll.nextRng }

        if (combatRoll.isMiss) {
          newLogs.push(log('miss', `${enemy.name}에게 빗나감!`, { sourceId: actorId, targetId: enemy.id }))
          continue
        }

        const itemMult = getItemElementMultiplier(items, effect.element, ctx.actorElement)
        let baseDmg = calcDamage({
          attack: actorAttack,
          defense: enemy.stats.defense,
          multiplier: effect.multiplier,
          attackElement: effect.element,
          defenderElement: enemy.element,
          itemElementMultiplier: itemMult,
          powerupBonus,
        })
        const isCrit = combatRoll.isCrit
        if (isCrit) baseDmg = Math.round(baseDmg * 1.5)

        // 보스 대미지 보너스
        if (enemy.isBoss) baseDmg = Math.round(baseDmg * bossMult)

        const res = applyDamageToEnemy(current, enemy.id, baseDmg)
        current = res.state
        totalDamage += res.actualDamage

        // 흡혈 처리
        if (res.actualDamage > 0) {
          for (const item of items) {
            for (const eff of item.effects) {
              if (eff.type === 'lifesteal') {
                const healAmt = Math.round(res.actualDamage * eff.percent)
                if (healAmt > 0) {
                  current = applyHealToCharacter(current, actorId, healAmt)
                  newLogs.push(log('heal', `흡혈: HP ${healAmt} 회복.`, { value: healAmt, sourceId: actorId }))
                }
              }
            }
          }
        }

        if (isCrit) {
          newLogs.push(log('crit', `크리티컬! ${enemy.name}에게 ${res.actualDamage} 피해!`, {
            value: res.actualDamage, sourceId: actorId, targetId: enemy.id,
          }))
        } else {
          newLogs.push(log('damage', `${enemy.name}에게 ${res.actualDamage} 피해!`, {
            value: res.actualDamage, sourceId: actorId, targetId: enemy.id,
          }))
        }

        const updatedEnemy = current.enemies.find(e => e.id === enemy.id)
        if (!updatedEnemy?.isAlive) {
          newLogs.push(log('death', `${enemy.name}이(가) 쓰러졌다!`, { targetId: enemy.id }))
          const actor = findCharacter(current, actorId)
          if (actor) {
            const newMp = Math.min(actor.stats.maxMp, actor.stats.mp + 5)
            current = updateCharacter(current, actorId, c => ({
              ...c,
              stats: { ...c.stats, mp: newMp },
            }))
            newLogs.push(log('system', '적 처치! MP +5', { sourceId: actorId }))
            for (const item of items) {
              for (const eff of item.effects) {
                if (eff.type === 'heal_on_kill') {
                  current = applyHealToCharacter(current, actorId, eff.amount)
                  newLogs.push(log('heal', `처치 보너스: HP ${eff.amount} 회복`, { value: eff.amount, sourceId: actorId }))
                }
              }
            }
          }
        }
      }
      return { state: current, newLogs, totalDamage }
    }

    case 'heal': {
      const rawHeal = Math.round(actorAttack * effect.multiplier)
      // 단일 힐 상한: 최대 HP의 40% (무한버티기 방지)
      const healActor = findCharacter(state, actorId)
      const healCap = healActor ? Math.floor(healActor.stats.maxHp * 0.4) : rawHeal
      let healAmount = Math.min(rawHeal, healCap)
      // 성수 시너지: 회복 스킬 효과 +30%
      if (hasSynergy(state.party, state.allies, 'holy_water')) {
        healAmount = Math.round(healAmount * 1.3)
      }
      const next = applyHealToCharacter(state, actorId, healAmount)
      newLogs.push(log('heal', `HP를 ${healAmount} 회복했다.`, {
        value: healAmount, sourceId: actorId, targetId: actorId,
      }))
      return { state: next, newLogs, totalDamage }
    }

    case 'heal_mp': {
      const char = findCharacter(state, actorId)
      if (!char) break
      const newMp = Math.min(char.stats.maxMp, char.stats.mp + effect.amount)
      const next = updateCharacter(state, actorId, c => ({
        ...c,
        stats: { ...c.stats, mp: newMp },
      }))
      newLogs.push(log('system', `MP를 ${effect.amount} 회복했다.`, { sourceId: actorId }))
      return { state: next, newLogs, totalDamage }
    }

    case 'apply_status': {
      const newStatus: StatusEffect = {
        kind: effect.status,
        duration: effect.duration,
        value: effect.value,
        sourceId: actorId,
      }

      const isDebuff = DEBUFF_STATUSES.has(effect.status)
      const isEnemyTarget = !!findEnemy(state, targetId)
      let next = state

      if (isDebuff && isEnemyTarget) {
        // 디버프: 선택된 적에게 부여
        next = updateEnemy(state, targetId, e => ({
          ...e,
          statusEffects: addStatus(e.statusEffects, newStatus),
        }))
      } else {
        // 버프: 시전자 자신에게 부여
        next = updateCharacter(state, actorId, c => ({
          ...c,
          statusEffects: addStatus(c.statusEffects, newStatus),
        }))
      }

      const applyTargetId = isDebuff && isEnemyTarget ? targetId : actorId
      const targetName = isDebuff && isEnemyTarget
        ? findEnemy(next, targetId)?.name
        : findCharacter(next, actorId)?.name
      newLogs.push(log('status_apply', `${targetName ?? '?'}에게 ${STATUS_NAME_KO[effect.status] ?? effect.status} 부여.`, {
        sourceId: actorId, targetId: applyTargetId,
      }))
      return { state: next, newLogs, totalDamage }
    }

    case 'remove_status': {
      const next = updateCharacter(state, actorId, c => ({
        ...c,
        statusEffects: removeStatus(c.statusEffects, effect.status),
      }))
      newLogs.push(log('status_expire', `${STATUS_NAME_KO[effect.status] ?? effect.status} 상태이상이 해제됐다.`, { sourceId: actorId }))
      return { state: next, newLogs, totalDamage }
    }

    case 'shield': {
      const shieldAmount = effect.flat ? effect.amount : Math.round(actorAttack * effect.amount)
      const newStatus: StatusEffect = {
        kind: 'shield',
        duration: 1,
        value: shieldAmount,
        sourceId: actorId,
      }
      const next = updateCharacter(state, actorId, c => ({
        ...c,
        statusEffects: addStatus(c.statusEffects, newStatus),
      }))
      newLogs.push(log('system', `방어막 ${shieldAmount} 생성.`, { sourceId: actorId }))
      return { state: next, newLogs, totalDamage }
    }

    case 'charge': {
      // 차지: 강력 버프(다음 공격 배율만큼 powerup)로 표현
      const pct = Math.round(effect.multiplier * 100)
      const newStatus: StatusEffect = {
        kind: 'powerup',
        duration: 2,
        value: pct,
        sourceId: actorId,
      }
      const next = updateCharacter(state, actorId, c => ({
        ...c,
        statusEffects: addStatus(c.statusEffects, newStatus),
      }))
      newLogs.push(log('system', `공격력이 ${pct}% 충전됐다!`, { sourceId: actorId }))
      return { state: next, newLogs, totalDamage }
    }

    case 'spend_hp_gain_mp': {
      const char = findCharacter(state, actorId)
      if (!char) break
      const hpCost = Math.round(char.stats.maxHp * effect.hpPercent)
      const newHp = Math.max(1, char.stats.hp - hpCost) // 자해로 사망 불가
      const newMp = Math.min(char.stats.maxMp, char.stats.mp + effect.mpGain)
      const next = updateCharacter(state, actorId, c => ({
        ...c,
        stats: { ...c.stats, hp: newHp, mp: newMp },
      }))
      newLogs.push(log('system', `HP ${hpCost}을 희생해 MP ${effect.mpGain}를 획득했다!`, { sourceId: actorId }))
      return { state: next, newLogs, totalDamage }
    }

    case 'apply_status_party': {
      const newStatus: StatusEffect = {
        kind: effect.status,
        duration: effect.duration,
        value: effect.value,
        sourceId: actorId,
      }
      let next = state
      for (const member of state.party) {
        if (!member.isAlive) continue
        next = updateCharacter(next, member.id, c => ({
          ...c,
          statusEffects: addStatus(c.statusEffects, newStatus),
        }))
      }
      newLogs.push(log('status_apply', `파티 전체에 ${STATUS_NAME_KO[effect.status] ?? effect.status} 부여.`, { sourceId: actorId }))
      return { state: next, newLogs, totalDamage }
    }

    case 'execute': {
      const target = findEnemy(state, targetId)
      if (!target) break
      const hpRatio = target.stats.hp / target.stats.maxHp
      if (hpRatio < effect.threshold) {
        // 즉사 처리
        const { state: killed, actualDamage: killDmg } = applyDamageToEnemy(state, targetId, target.stats.hp)
        totalDamage += killDmg
        newLogs.push(log('damage', `신성한 심판! ${target.name}이(가) 즉사했다!`, {
          value: killDmg, sourceId: actorId, targetId,
        }))
        return { state: killed, newLogs, totalDamage }
      } else {
        // 임계치 미달 — 일반 피해
        const actor = findCharacter(state, actorId)
        if (!actor) break
        const dmg = calcDamage({
          attack: actor.stats.attack,
          defense: target.stats.defense,
          multiplier: 0.8,
          attackElement: 'light',
          defenderElement: target.element,
          itemElementMultiplier: getItemElementMultiplier(items, 'light'),
          powerupBonus: getStatusBonus(actor.statusEffects, 'powerup'),
        })
        const { state: hit, actualDamage } = applyDamageToEnemy(state, targetId, dmg)
        totalDamage += actualDamage
        newLogs.push(log('damage', `심판 실패 (HP ${Math.round(hpRatio * 100)}% > ${Math.round(effect.threshold * 100)}%). ${actualDamage} 피해.`, {
          value: actualDamage, sourceId: actorId, targetId,
        }))
        return { state: hit, newLogs, totalDamage }
      }
    }

    case 'damage_hp_scale': {
      const actor = findCharacter(state, actorId)
      const target = findEnemy(state, targetId) ?? findCharacter(state, targetId)
      if (!actor || !target?.isAlive) break
      const missingHpRatio = 1 - actor.stats.hp / actor.stats.maxHp
      const scaledMultiplier = effect.baseMultiplier * (1 + missingHpRatio)
      const dmg = calcDamage({
        attack: actor.stats.attack,
        defense: target.stats.defense,
        multiplier: scaledMultiplier,
        attackElement: effect.element,
        defenderElement: target.element,
        itemElementMultiplier: getItemElementMultiplier(items, effect.element),
        powerupBonus: getStatusBonus(actor.statusEffects, 'powerup'),
      })
      const isEnemy = !!findEnemy(state, targetId)
      let nextState = state
      let actualDmg = 0
      if (isEnemy) {
        const res = applyDamageToEnemy(state, targetId, dmg)
        nextState = res.state
        actualDmg = res.actualDamage
      } else {
        const res = applyDamageToCharacter(state, targetId, dmg)
        nextState = res.state
        actualDmg = res.actualDamage
      }
      totalDamage += actualDmg
      newLogs.push(log('damage', `분노의 일격! ${actualDmg} 피해 (HP ${Math.round((1 - missingHpRatio) * 100)}% 기준).`, {
        value: actualDmg, sourceId: actorId, targetId,
      }))
      return { state: nextState, newLogs, totalDamage }
    }

    default:
      break
  }

  return { state, newLogs, totalDamage }
}

// ---------------------------------------------------------------------------
// Use Skill (player action)
// ---------------------------------------------------------------------------

export function useSkill(
  state: BattleState,
  actorId: EntityId,
  targetId: EntityId,
  skillId: EntityId,
  items: readonly ItemDef[],
): BattleState {
  const actor = findCharacter(state, actorId)
  const skill = getSkillById(skillId)

  if (!actor || !skill || !actor.isAlive) return state
  if (actor.stats.mp < skill.mpCost) return state

  const cooldown = actor.skillCooldowns[skillId] ?? 0
  if (cooldown > 0) return state

  // free_skill_chance: MP 무료 시전 판정
  const freeChance = items.reduce((acc, item) => {
    for (const eff of item.effects) {
      if (eff.type === 'free_skill_chance') return acc + eff.chance
    }
    return acc
  }, 0)
  let [isFree, rngAfterFree] = freeChance > 0 ? roll(state.rng, freeChance * 100) : [false, state.rng]
  let stateWithRng = freeChance > 0 ? { ...state, rng: rngAfterFree } : state

  // MP 소비
  let current = updateCharacter(stateWithRng, actorId, c => ({
    ...c,
    stats: { ...c.stats, mp: isFree ? c.stats.mp : c.stats.mp - skill.mpCost },
    skillCooldowns: {
      ...c.skillCooldowns,
      [skillId]: skill.cooldown,
    },
  }))

  const useLog = isFree
    ? log('system', `${actor.name}이(가) ${skill.name}을(를) 사용! (MP 무료!)`, { sourceId: actorId })
    : log('system', `${actor.name}이(가) ${skill.name}을(를) 사용!`, { sourceId: actorId })

  current = {
    ...current,
    log: [...current.log, useLog],
  }

  const target = findEnemy(current, targetId) ?? findCharacter(current, targetId)
  const targetElement = target?.element ?? 'physical'

  let totalDamage = 0
  const allLogs: BattleLogEntry[] = []

  for (const effect of skill.effects) {
    const res = applySkillEffect(current, effect, {
      actorId,
      targetId,
      actorAttack: actor.stats.attack,
      actorSpeed: actor.stats.speed,
      actorElement: actor.element,
      targetElement,
      items,
    })
    current = res.state
    allLogs.push(...res.newLogs)
    totalDamage += res.totalDamage
  }

  current = {
    ...current,
    log: [...current.log, ...allLogs],
    totalDamageDealt: current.totalDamageDealt + totalDamage,
  }

  // 전투 종료 체크
  current = checkBattleEnd(current)
  return current
}

// ---------------------------------------------------------------------------
// Enemy Turn
// ---------------------------------------------------------------------------

export function processEnemyTurn(state: BattleState, items: readonly ItemDef[]): BattleState {
  let current = state

  for (const enemy of current.enemies) {
    if (!enemy.isAlive) continue
    if (!hasStatus(enemy.statusEffects, 'cc_immune') &&
        (hasStatus(enemy.statusEffects, 'freeze') || hasStatus(enemy.statusEffects, 'stun'))) {
      current = {
        ...current,
        log: [...current.log, log('system', `${enemy.name}은(는) 행동 불능 상태다.`, { targetId: enemy.id })],
      }
      continue
    }

    // 보스 페이즈 전환 체크
    if (enemy.bossPhases && enemy.bossCurrentPhase !== undefined) {
      const hpRatio = enemy.stats.hp / enemy.stats.maxHp
      const { phase2HpThreshold, phase3HpThreshold } = enemy.bossPhases
      let newPhase = enemy.bossCurrentPhase
      if (hpRatio <= phase3HpThreshold && enemy.bossCurrentPhase < 3) {
        newPhase = 3
      } else if (hpRatio <= phase2HpThreshold && enemy.bossCurrentPhase < 2) {
        newPhase = 2
      }
      if (newPhase !== enemy.bossCurrentPhase) {
        current = updateEnemy(current, enemy.id, e => ({
          ...e,
          bossCurrentPhase: newPhase,
          actionIndex: 0,
        }))
        const phaseMsg = newPhase === 2
          ? `${enemy.name}이(가) 분노했다! [페이즈 2]`
          : `${enemy.name}이(가) 극한의 분노에 빠졌다! [페이즈 3 - 최종 형태]`
        current = {
          ...current,
          log: [...current.log, log('system', phaseMsg, { targetId: enemy.id })],
        }
      }
    }

    // 현재 페이즈에 맞는 액션 배열 선택
    const latestEnemy = current.enemies.find(e => e.id === enemy.id) ?? enemy
    const currentActions = (() => {
      if (!latestEnemy.bossPhases || latestEnemy.bossCurrentPhase === undefined) {
        return latestEnemy.actions
      }
      if (latestEnemy.bossCurrentPhase === 3) return latestEnemy.bossPhases.phase3Actions
      if (latestEnemy.bossCurrentPhase === 2) return latestEnemy.bossPhases.phase2Actions
      return latestEnemy.actions
    })()

    const action = currentActions[latestEnemy.actionIndex % currentActions.length]

    // 다음 액션 인덱스 증가
    current = updateEnemy(current, latestEnemy.id, e => ({
      ...e,
      actionIndex: (e.actionIndex + 1) % currentActions.length,
    }))

    const alivePary = current.party.filter(c => c.isAlive)
    if (alivePary.length === 0) break

    const aliveAllies = current.allies.filter(a => a.isAlive)
    const aliveTargets: readonly CombatTarget[] = [...alivePary, ...aliveAllies]

    switch (action.type) {
      case 'attack': {
        const target = selectTarget(aliveTargets, action.targetMode)
        if (!target) break

        const isCharTarget = current.party.some(c => c.id === target.id)

        // 크리티컬/미스 판정 (적 공격)
        const combatRoll = rollCombat(current.rng, enemy.stats.speed, target.stats.defense)
        current = { ...current, rng: combatRoll.nextRng }

        if (combatRoll.isMiss) {
          current = {
            ...current,
            log: [...current.log, log('miss', `${enemy.name}의 공격이 빗나갔다!`, { sourceId: enemy.id, targetId: target.id })],
          }
          break
        }

        const powerupBonus = getStatusBonus(enemy.statusEffects, 'powerup')
        const defdownBonus = getStatusBonus(target.statusEffects, 'defdown')
        const effectiveDef = Math.max(0, target.stats.defense - defdownBonus)

        let dmg = calcDamage({
          attack: enemy.stats.attack,
          defense: effectiveDef,
          multiplier: action.multiplier,
          attackElement: action.element,
          defenderElement: target.element,
          itemElementMultiplier: 1,
          powerupBonus,
        })
        if (combatRoll.isCrit) dmg = Math.round(dmg * 1.5)

        if (isCharTarget) {
          const res = applyDamageToCharacter(current, target.id, dmg)
          const dmgLog = combatRoll.isCrit
            ? log('crit', `크리티컬! ${enemy.name}이(가) ${target.name}에게 ${res.actualDamage} 피해!`, {
                value: res.actualDamage, sourceId: enemy.id, targetId: target.id,
              })
            : log('damage', `${enemy.name}이(가) ${target.name}에게 ${res.actualDamage} 피해!`, {
                value: res.actualDamage, sourceId: enemy.id, targetId: target.id,
              })
          current = { ...res.state, log: [...res.state.log, dmgLog] }
          if (res.revived) {
            current = {
              ...current,
              log: [...current.log, log('system', `${target.name}이(가) 불사조처럼 부활했다!`, { targetId: target.id })],
            }
          } else if (!current.party.find(c => c.id === target.id)?.isAlive) {
            current = {
              ...current,
              log: [...current.log, log('death', `${target.name}이(가) 쓰러졌다!`, { targetId: target.id })],
            }
          }
        } else {
          const res = applyDamageToAlly(current, target.id, dmg)
          const dmgLog = combatRoll.isCrit
            ? log('crit', `크리티컬! ${enemy.name}이(가) ${target.name}에게 ${res.actualDamage} 피해!`, {
                value: res.actualDamage, sourceId: enemy.id, targetId: target.id,
              })
            : log('damage', `${enemy.name}이(가) ${target.name}에게 ${res.actualDamage} 피해!`, {
                value: res.actualDamage, sourceId: enemy.id, targetId: target.id,
              })
          current = { ...res.state, log: [...res.state.log, dmgLog] }
          if (!current.allies.find(a => a.id === target.id)?.isAlive) {
            current = {
              ...current,
              log: [...current.log, log('death', `${target.name}이(가) 쓰러졌다!`, { targetId: target.id })],
            }
          }
        }
        break
      }

      case 'attack_all': {
        for (const member of aliveTargets) {
          const combatRoll = rollCombat(current.rng, enemy.stats.speed, member.stats.defense)
          current = { ...current, rng: combatRoll.nextRng }

          if (combatRoll.isMiss) {
            current = {
              ...current,
              log: [...current.log, log('miss', `${enemy.name}의 공격이 빗나갔다!`, { sourceId: enemy.id, targetId: member.id })],
            }
            continue
          }

          const powerupBonus = getStatusBonus(enemy.statusEffects, 'powerup')
          let dmg = calcDamage({
            attack: enemy.stats.attack,
            defense: member.stats.defense,
            multiplier: action.multiplier,
            attackElement: action.element,
            defenderElement: member.element,
            itemElementMultiplier: 1,
            powerupBonus,
          })
          if (combatRoll.isCrit) dmg = Math.round(dmg * 1.5)

          const isMemberChar = current.party.some(c => c.id === member.id)
          if (isMemberChar) {
            const res = applyDamageToCharacter(current, member.id, dmg)
            const dmgLog = combatRoll.isCrit
              ? log('crit', `크리티컬! ${enemy.name}이(가) ${member.name}에게 ${res.actualDamage} 피해!`, {
                  value: res.actualDamage, sourceId: enemy.id, targetId: member.id,
                })
              : log('damage', `${enemy.name}이(가) ${member.name}에게 ${res.actualDamage} 피해!`, {
                  value: res.actualDamage, sourceId: enemy.id, targetId: member.id,
                })
            current = { ...res.state, log: [...res.state.log, dmgLog] }
            if (res.revived) {
              current = {
                ...current,
                log: [...current.log, log('system', `${member.name}이(가) 불사조처럼 부활했다!`, { targetId: member.id })],
              }
            } else if (!current.party.find(c => c.id === member.id)?.isAlive) {
              current = {
                ...current,
                log: [...current.log, log('death', `${member.name}이(가) 쓰러졌다!`, { targetId: member.id })],
              }
            }
          } else {
            const res = applyDamageToAlly(current, member.id, dmg)
            const dmgLog = combatRoll.isCrit
              ? log('crit', `크리티컬! ${enemy.name}이(가) ${member.name}에게 ${res.actualDamage} 피해!`, {
                  value: res.actualDamage, sourceId: enemy.id, targetId: member.id,
                })
              : log('damage', `${enemy.name}이(가) ${member.name}에게 ${res.actualDamage} 피해!`, {
                  value: res.actualDamage, sourceId: enemy.id, targetId: member.id,
                })
            current = { ...res.state, log: [...res.state.log, dmgLog] }
            if (!current.allies.find(a => a.id === member.id)?.isAlive) {
              current = {
                ...current,
                log: [...current.log, log('death', `${member.name}이(가) 쓰러졌다!`, { targetId: member.id })],
              }
            }
          }
        }
        break
      }

      case 'apply_status': {
        const targets = action.targetMode === 'all' ? alivePary : [selectTarget(alivePary, 'random')].filter(Boolean) as BattleCharacter[]
        const isStatusImmune = items.some(item =>
          item.effects.some(eff => eff.type === 'status_immunity' && eff.statuses.includes(action.status))
        )
        for (const t of targets) {
          if (isStatusImmune) {
            current = {
              ...current,
              log: [...current.log, log('system', `${t.name}의 면역으로 ${STATUS_NAME_KO[action.status] ?? action.status} 부여 차단!`, { targetId: t.id })],
            }
            continue
          }
          const newStatus: StatusEffect = {
            kind: action.status,
            duration: action.duration,
            value: action.value,
            sourceId: enemy.id,
          }
          current = updateCharacter(current, t.id, c => ({
            ...c,
            statusEffects: addStatus(c.statusEffects, newStatus),
          }))
          current = {
            ...current,
            log: [...current.log, log('status_apply', `${t.name}에게 ${STATUS_NAME_KO[action.status] ?? action.status} 부여!`, {
              sourceId: enemy.id, targetId: t.id,
            })],
          }
        }
        break
      }

      case 'heal_self': {
        const healAmount = Math.round(enemy.stats.attack * action.multiplier)
        const newHp = Math.min(enemy.stats.maxHp, enemy.stats.hp + healAmount)
        current = updateEnemy(current, enemy.id, e => ({
          ...e,
          stats: { ...e.stats, hp: newHp },
        }))
        current = {
          ...current,
          log: [...current.log, log('heal', `${enemy.name}이(가) HP를 ${healAmount} 회복!`, {
            value: healAmount, sourceId: enemy.id,
          })],
        }
        break
      }

      case 'buff_self': {
        const newStatus: StatusEffect = {
          kind: action.status,
          duration: action.duration,
          value: action.value,
          sourceId: enemy.id,
        }
        current = updateEnemy(current, enemy.id, e => ({
          ...e,
          statusEffects: addStatus(e.statusEffects, newStatus),
        }))
        current = {
          ...current,
          log: [...current.log, log('system', `${enemy.name}이(가) ${STATUS_NAME_KO[action.status] ?? action.status} 버프 획득!`, {
            sourceId: enemy.id,
          })],
        }
        break
      }
    }
  }

  // 동료 행동
  current = processAllyActions(current, items)

  // 상태이상 틱 (적 턴 종료 시)
  current = tickAllStatusEffects(current)

  // 전투 종료 체크
  current = checkBattleEnd(current)

  return current
}

// ---------------------------------------------------------------------------
// Ally Actions
// ---------------------------------------------------------------------------

function processAllyActions(state: BattleState, _items: readonly ItemDef[]): BattleState {
  let current = state

  for (const ally of current.allies) {
    if (!ally.isAlive) continue

    const action = ally.action
    const aliveParty = current.party.filter(c => c.isAlive)
    // revive_party는 파티 전원 사망 상태에서도 동작해야 함
    if (aliveParty.length === 0 && action.type !== 'revive_party') break

    switch (action.type) {
      case 'attack': {
        const aliveEnemies = current.enemies.filter(e => e.isAlive)
        if (aliveEnemies.length === 0) break
        const target = [...aliveEnemies].sort((a, b) => a.stats.hp - b.stats.hp)[0]
        const { isCrit, isMiss, nextRng } = rollCombat(current.rng, ally.stats.speed, target.stats.defense)
        current = { ...current, rng: nextRng }
        if (isMiss) {
          current = {
            ...current,
            log: [...current.log, log('miss', `${ally.name}의 공격이 빗나갔다!`, { sourceId: ally.id, targetId: target.id })],
          }
          break
        }
        let allyDmg = calcDamage({
          attack: ally.stats.attack,
          defense: target.stats.defense,
          multiplier: action.multiplier,
          attackElement: action.element,
          defenderElement: target.element,
          itemElementMultiplier: 1,
          powerupBonus: 0,
        })
        if (isCrit) allyDmg = Math.round(allyDmg * 1.5)
        const res = applyDamageToEnemy(current, target.id, allyDmg)
        current = {
          ...res.state,
          log: [...res.state.log, log(isCrit ? 'crit' : 'damage',
            isCrit
              ? `${ally.name}이(가) 치명타! ${target.name}에게 ${res.actualDamage} 피해!`
              : `${ally.name}이(가) ${target.name}에게 ${res.actualDamage} 피해!`,
            { value: res.actualDamage, sourceId: ally.id, targetId: target.id })],
          totalDamageDealt: res.state.totalDamageDealt + res.actualDamage,
        }
        break
      }

      case 'heal_party': {
        const target = [...aliveParty].sort((a, b) => a.stats.hp - b.stats.hp)[0]
        const healAmount = Math.round(ally.stats.attack * action.multiplier)
        current = applyHealToCharacter(current, target.id, healAmount)
        current = {
          ...current,
          log: [...current.log, log('heal', `${ally.name}이(가) ${target.name}의 HP를 ${healAmount} 회복!`, {
            value: healAmount, sourceId: ally.id, targetId: target.id,
          })],
        }
        break
      }

      case 'apply_status': {
        const aliveEnemies = current.enemies.filter(e => e.isAlive)
        if (aliveEnemies.length === 0) break
        const target = aliveEnemies[0]
        const newStatus: StatusEffect = {
          kind: action.status,
          duration: action.duration,
          value: action.value,
          sourceId: ally.id,
        }
        current = updateEnemy(current, target.id, e => ({
          ...e,
          statusEffects: addStatus(e.statusEffects, newStatus),
        }))
        current = {
          ...current,
          log: [...current.log, log('status_apply', `${ally.name}이(가) ${target.name}에게 ${STATUS_NAME_KO[action.status] ?? action.status} 부여!`, {
            sourceId: ally.id, targetId: target.id,
          })],
        }
        break
      }

      case 'shield_party': {
        for (const member of aliveParty) {
          const newStatus: StatusEffect = {
            kind: 'shield',
            duration: 1,
            value: action.amount,
            sourceId: ally.id,
          }
          current = updateCharacter(current, member.id, c => ({
            ...c,
            statusEffects: addStatus(c.statusEffects, newStatus),
          }))
        }
        current = {
          ...current,
          log: [...current.log, log('system', `${ally.name}이(가) 파티 전체에 방어막 부여!`, { sourceId: ally.id })],
        }
        break
      }

      case 'apply_status_all': {
        const aliveEnemies = current.enemies.filter(e => e.isAlive)
        if (aliveEnemies.length === 0) break
        for (const enemy of aliveEnemies) {
          const newStatus: StatusEffect = {
            kind: action.status,
            duration: action.duration,
            value: action.value,
            sourceId: ally.id,
          }
          current = updateEnemy(current, enemy.id, e => ({
            ...e,
            statusEffects: addStatus(e.statusEffects, newStatus),
          }))
        }
        current = {
          ...current,
          log: [...current.log, log('status_apply', `${ally.name}이(가) 전체 적에게 ${STATUS_NAME_KO[action.status] ?? action.status} 부여!`, { sourceId: ally.id })],
        }
        break
      }

      case 'buff_party': {
        for (const member of aliveParty) {
          const newStatus: StatusEffect = {
            kind: action.status,
            duration: action.duration,
            value: action.value,
            sourceId: ally.id,
          }
          current = updateCharacter(current, member.id, c => ({
            ...c,
            statusEffects: addStatus(c.statusEffects, newStatus),
          }))
        }
        current = {
          ...current,
          log: [...current.log, log('status_apply', `${ally.name}이(가) 파티 전체에 ${STATUS_NAME_KO[action.status] ?? action.status} 부여!`, { sourceId: ally.id })],
        }
        break
      }

      case 'revive_party': {
        const deadMembers = current.party.filter(c => !c.isAlive)
        if (deadMembers.length === 0) break
        const target = deadMembers[0]
        const reviveHp = Math.round(target.stats.maxHp * action.healPercent)
        current = updateCharacter(current, target.id, c => ({
          ...c,
          stats: { ...c.stats, hp: reviveHp },
          isAlive: true,
        }))
        current = {
          ...current,
          log: [...current.log, log('heal', `${ally.name}이(가) ${target.name}을(를) HP ${reviveHp}으로 부활!`, {
            value: reviveHp, sourceId: ally.id, targetId: target.id,
          })],
        }
        break
      }
    }
  }

  return current
}

// ---------------------------------------------------------------------------
// Status Effect Tick (플레이어 턴 종료 시)
// ---------------------------------------------------------------------------

export function tickAllStatusEffects(state: BattleState): BattleState {
  let current = state
  const newLogs: BattleLogEntry[] = []

  // 플레이어 캐릭터 상태이상 처리
  for (const char of current.party) {
    if (!char.isAlive) continue

    // 독
    if (hasStatus(char.statusEffects, 'poison')) {
      const poisonPct = getStatusBonus(char.statusEffects, 'poison')
      const dmg = Math.round(char.stats.maxHp * poisonPct / 100)
      const res = applyDamageToCharacter(current, char.id, dmg)
      current = res.state
      newLogs.push(log('damage', `${char.name}이(가) 독으로 ${res.actualDamage} 피해!`, {
        value: res.actualDamage, targetId: char.id,
      }))
      if (res.revived) {
        newLogs.push(log('system', `${char.name}이(가) 불사조처럼 부활했다!`, { targetId: char.id }))
      }
    }

    // 화상
    if (hasStatus(char.statusEffects, 'burn')) {
      const burnDmg = getStatusBonus(char.statusEffects, 'burn')
      const res = applyDamageToCharacter(current, char.id, burnDmg)
      current = res.state
      newLogs.push(log('damage', `${char.name}이(가) 화상으로 ${res.actualDamage} 피해!`, {
        value: res.actualDamage, targetId: char.id,
      }))
      if (res.revived) {
        newLogs.push(log('system', `${char.name}이(가) 불사조처럼 부활했다!`, { targetId: char.id }))
      }
    }

    // mana_regen 상태이상 처리
    if (hasStatus(char.statusEffects, 'mana_regen')) {
      const regenAmount = getStatusBonus(char.statusEffects, 'mana_regen')
      const newMp = Math.min(char.stats.maxMp, char.stats.mp + regenAmount)
      current = updateCharacter(current, char.id, c => ({
        ...c,
        stats: { ...c.stats, mp: newMp },
      }))
      newLogs.push(log('system', `${char.name}의 MP가 ${regenAmount} 회복됐다.`, { sourceId: char.id }))
    }

    // regen 상태이상 처리 (HP 재생)
    if (hasStatus(char.statusEffects, 'regen')) {
      const currentChar = current.party.find(c => c.id === char.id) ?? char
      const regenAmount = getStatusBonus(char.statusEffects, 'regen')
      const newHp = Math.min(currentChar.stats.maxHp, currentChar.stats.hp + regenAmount)
      const actualHeal = newHp - currentChar.stats.hp
      if (actualHeal > 0) {
        current = updateCharacter(current, char.id, c => ({
          ...c,
          stats: { ...c.stats, hp: newHp },
        }))
        newLogs.push(log('heal', `${char.name}의 HP가 ${actualHeal} 재생됐다.`, {
          value: actualHeal, sourceId: char.id,
        }))
      }
    }

    // 아이템 MP 회복 및 기타 패시브 효과 처리
    for (const item of current.items) {
      for (const eff of item.effects) {
        if (eff.type === 'mp_regen') {
          const currentChar = current.party.find(c => c.id === char.id) ?? char
          const newMp = Math.min(currentChar.stats.maxMp, currentChar.stats.mp + eff.amount)
          current = updateCharacter(current, char.id, c => ({
            ...c,
            stats: { ...c.stats, mp: newMp },
          }))
          newLogs.push(log('system', `${item.name}으로 MP가 ${eff.amount} 회복됐다.`, { sourceId: char.id }))
        }
        if (eff.type === 'hp_drain_per_turn') {
          const res = applyDamageToCharacter(current, char.id, eff.amount)
          current = res.state
          newLogs.push(log('damage', `${item.name}의 저주: HP ${eff.amount} 감소.`, {
            value: eff.amount, targetId: char.id,
          }))
          if (res.revived) {
            newLogs.push(log('system', `${char.name}이(가) 불사조처럼 부활했다!`, { targetId: char.id }))
          }
        }
        if (eff.type === 'on_low_hp') {
          const hpRatio = char.stats.hp / char.stats.maxHp
          if (hpRatio < eff.threshold) {
            const innerEff = eff.effect
            if (innerEff.type === 'apply_status') {
              const alreadyHas = hasStatus(char.statusEffects, innerEff.status)
              if (!alreadyHas) {
                const newSt: StatusEffect = {
                  kind: innerEff.status,
                  duration: innerEff.duration,
                  value: innerEff.value,
                  sourceId: char.id,
                }
                current = updateCharacter(current, char.id, c => ({
                  ...c,
                  statusEffects: addStatus(c.statusEffects, newSt),
                }))
                newLogs.push(log('status_apply', `위기 발동! ${item.name}: ${STATUS_NAME_KO[innerEff.status] ?? innerEff.status} 부여.`, { sourceId: char.id }))
              }
            }
          }
        }
      }
    }
  }

  // 적 상태이상 처리 (독, 화상)
  for (const enemy of current.enemies) {
    if (!enemy.isAlive) continue

    if (hasStatus(enemy.statusEffects, 'poison')) {
      const poisonPct = getStatusBonus(enemy.statusEffects, 'poison')
      const dmg = Math.round(enemy.stats.maxHp * poisonPct / 100)
      const newHp = Math.max(0, enemy.stats.hp - dmg)
      const res = applyDamageToEnemy(current, enemy.id, dmg)
      current = {
        ...res.state,
        totalDamageDealt: res.state.totalDamageDealt + dmg,
      }
      void newHp
      newLogs.push(log('damage', `${enemy.name}이(가) 독으로 ${dmg} 피해!`, {
        value: dmg, targetId: enemy.id,
      }))
    }

    if (hasStatus(enemy.statusEffects, 'burn')) {
      const burnDmg = getStatusBonus(enemy.statusEffects, 'burn')
      const res = applyDamageToEnemy(current, enemy.id, burnDmg)
      current = {
        ...res.state,
        totalDamageDealt: res.state.totalDamageDealt + burnDmg,
      }
      newLogs.push(log('damage', `${enemy.name}이(가) 화상으로 ${burnDmg} 피해!`, {
        value: burnDmg, targetId: enemy.id,
      }))
    }
  }

  // 카오스 시너지: 매 턴 종료 시 랜덤 적에게 최대 HP 15% 피해
  if (hasSynergy(current.party, current.allies, 'chaos')) {
    const aliveEnemies = current.enemies.filter(e => e.isAlive)
    if (aliveEnemies.length > 0) {
      const chaosTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
      const chaosDmg = Math.round(chaosTarget.stats.maxHp * 0.15)
      const res = applyDamageToEnemy(current, chaosTarget.id, chaosDmg)
      current = { ...res.state, totalDamageDealt: res.state.totalDamageDealt + chaosDmg }
      newLogs.push(log('damage', `카오스! ${chaosTarget.name}에게 ${chaosDmg} 피해!`, {
        value: chaosDmg, targetId: chaosTarget.id,
      }))
    }
  }

  // skill_cooldown_reduce 아이템 추가 감소량 계산
  const extraCdReduction = current.items.reduce((acc, item) => {
    for (const eff of item.effects) {
      if (eff.type === 'skill_cooldown_reduce') return acc + eff.amount
    }
    return acc
  }, 0)

  // 상태이상 턴 감소
  current = {
    ...current,
    party: current.party.map(c => ({
      ...c,
      statusEffects: tickStatuses(c.statusEffects),
      skillCooldowns: Object.fromEntries(
        Object.entries(c.skillCooldowns).map(([id, cd]) => [id, Math.max(0, cd - 1 - extraCdReduction)])
      ),
    })),
    enemies: current.enemies.map(e => ({
      ...e,
      statusEffects: tickStatuses(e.statusEffects),
    })),
    log: [...current.log, ...newLogs],
  }

  return current
}

// ---------------------------------------------------------------------------
// Battle End Check
// ---------------------------------------------------------------------------

function checkBattleEnd(state: BattleState): BattleState {
  const allEnemiesDead = state.enemies.every(e => !e.isAlive)
  const allPartyDead = state.party.every(c => !c.isAlive)

  if (allEnemiesDead) {
    return { ...state, phase: 'victory' }
  }
  if (allPartyDead) {
    return { ...state, phase: 'defeat' }
  }
  return state
}

// ---------------------------------------------------------------------------
// Target Selection
// ---------------------------------------------------------------------------

type CombatTarget = {
  readonly id: EntityId
  readonly name: string
  readonly stats: Stats
  readonly element: Element
  readonly statusEffects: readonly StatusEffect[]
  readonly isAlive: boolean
}

function selectTarget(
  targets: readonly CombatTarget[],
  mode: 'random' | 'lowest_hp' | 'highest_attack',
): CombatTarget | undefined {
  if (targets.length === 0) return undefined

  switch (mode) {
    case 'lowest_hp':
      return [...targets].sort((a, b) => a.stats.hp - b.stats.hp)[0]
    case 'highest_attack':
      return [...targets].sort((a, b) => b.stats.attack - a.stats.attack)[0]
    case 'random':
    default:
      return targets[Math.floor(Math.random() * targets.length)]
  }
}

// ---------------------------------------------------------------------------
// Battle Reducer
// ---------------------------------------------------------------------------

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case 'SELECT_SKILL':
      return { ...state, selectedSkillId: action.skillId, selectedTargetId: null }

    case 'SELECT_TARGET':
      return { ...state, selectedTargetId: action.targetId }

    case 'USE_SKILL': {
      if (state.phase !== 'player_turn') return state
      const currentCounts = state.skillUseCounts ?? {}
      const stateWithCount = {
        ...state,
        skillUseCounts: {
          ...currentCounts,
          [action.skillId]: (currentCounts[action.skillId] ?? 0) + 1,
        },
      }
      const nextState = useSkill(stateWithCount, stateWithCount.party[0]?.id ?? '', action.targetId, action.skillId, stateWithCount.items)
      if (nextState.phase === 'player_turn') {
        return { ...nextState, phase: 'enemy_turn', selectedSkillId: null, selectedTargetId: null }
      }
      return { ...nextState, selectedSkillId: null, selectedTargetId: null }
    }

    case 'END_PLAYER_TURN': {
      if (state.phase !== 'player_turn') return state
      const afterMp = regenPartyMp(
        { ...state, phase: 'enemy_turn' },
        END_TURN_MP_BONUS,
        `방어 태세! MP +${END_TURN_MP_BONUS}`,
      )
      return applyDefendToParty(afterMp)
    }

    case 'PROCESS_ENEMY_TURN': {
      if (state.phase !== 'enemy_turn') return state
      const afterEnemyTurn = processEnemyTurn(state, state.items)
      if (afterEnemyTurn.phase === 'enemy_turn') {
        const nextTurn = { ...afterEnemyTurn, phase: 'player_turn' as const, turnCount: afterEnemyTurn.turnCount + 1 }
        return regenPartyMp(
          nextTurn,
          PASSIVE_MP_REGEN_PER_TURN,
          `마나가 자연 회복되었다. MP +${PASSIVE_MP_REGEN_PER_TURN}`,
        )
      }
      return afterEnemyTurn
    }

    case 'TICK_STATUS_EFFECTS':
      return tickAllStatusEffects(state)

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------
export {
  getElementMultiplier,
  hasStatus,
  addStatus,
  removeStatus,
  tickStatuses,
  getStatusBonus,
}
