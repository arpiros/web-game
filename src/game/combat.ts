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
} from './types'
import { getSkillById } from './data/skills'

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
  water:    { fire: 1.5,  light: 0.5 },
  dark:     { light: 0.5, fire: 0.5 },
  light:    { dark: 2.0,  water: 1.5 },
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
    .map(e => ({ ...e, duration: e.duration - 1 }))
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
): { state: BattleState; actualDamage: number } {
  const target = findCharacter(state, targetId)
  if (!target || !target.isAlive) return { state, actualDamage: 0 }

  const shield = getStatusBonus(target.statusEffects, 'shield')
  const absorbed = Math.min(shield, damage)
  const remaining = damage - absorbed
  const newHp = Math.max(0, target.stats.hp - remaining)
  const actualDamage = remaining + absorbed

  let next = updateCharacter(state, targetId, c => ({
    ...c,
    stats: { ...c.stats, hp: newHp },
    statusEffects: absorbed > 0
      ? removeStatus(c.statusEffects, 'shield')
      : c.statusEffects,
    isAlive: newHp > 0,
  }))

  return { state: next, actualDamage }
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

export function getItemElementMultiplier(items: readonly ItemDef[], element: Element): number {
  return items
    .filter(item => item.effect.type === 'elemental_damage' && item.effect.element === element)
    .reduce((acc, item) => {
      if (item.effect.type === 'elemental_damage') {
        return acc * item.effect.multiplier
      }
      return acc
    }, 1.0)
}

// ---------------------------------------------------------------------------
// Apply a single SkillEffect
// ---------------------------------------------------------------------------

interface ApplyEffectContext {
  actorId: EntityId
  targetId: EntityId
  actorAttack: number
  actorElement: Element
  targetElement: Element
  items: readonly ItemDef[]
}

function applySkillEffect(
  state: BattleState,
  effect: SkillEffect,
  ctx: ApplyEffectContext,
): { state: BattleState; newLogs: BattleLogEntry[]; totalDamage: number } {
  const { actorId, targetId, actorAttack, targetElement, items } = ctx
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

      const itemMult = getItemElementMultiplier(items, effect.element)
      const dmg = calcDamage({
        attack: actorAttack,
        defense: target.stats.defense,
        multiplier: effect.multiplier,
        attackElement: effect.element,
        defenderElement: targetElement,
        itemElementMultiplier: itemMult,
        powerupBonus,
      })

      const isEnemy = !!findEnemy(state, targetId)
      let nextState: BattleState
      let actualDmg: number

      if (isEnemy) {
        const res = applyDamageToEnemy(state, targetId, dmg)
        nextState = res.state
        actualDmg = res.actualDamage
      } else {
        const res = applyDamageToCharacter(state, targetId, dmg)
        nextState = res.state
        actualDmg = res.actualDamage
      }

      totalDamage += isEnemy ? actualDmg : 0
      newLogs.push(log('damage', `${target.name}에게 ${actualDmg} 피해!`, {
        value: actualDmg, sourceId: actorId, targetId,
      }))

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
          }
        }
      }

      return { state: nextState, newLogs, totalDamage }
    }

    case 'damage_all': {
      let current = state
      const targets = current.enemies.filter(e => e.isAlive)

      for (const enemy of targets) {
        const itemMult = getItemElementMultiplier(items, effect.element)
        const dmg = calcDamage({
          attack: actorAttack,
          defense: enemy.stats.defense,
          multiplier: effect.multiplier,
          attackElement: effect.element,
          defenderElement: enemy.element,
          itemElementMultiplier: itemMult,
          powerupBonus,
        })
        const res = applyDamageToEnemy(current, enemy.id, dmg)
        current = res.state
        totalDamage += res.actualDamage
        newLogs.push(log('damage', `${enemy.name}에게 ${res.actualDamage} 피해!`, {
          value: res.actualDamage, sourceId: actorId, targetId: enemy.id,
        }))
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
          }
        }
      }
      return { state: current, newLogs, totalDamage }
    }

    case 'heal': {
      const healAmount = Math.round(actorAttack * effect.multiplier)
      const next = applyHealToCharacter(state, actorId, healAmount)
      const actor = findCharacter(next, actorId)
      newLogs.push(log('heal', `HP를 ${healAmount} 회복했다.`, {
        value: healAmount, sourceId: actorId, targetId: actorId,
      }))
      void actor
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

      const isEnemy = !!findEnemy(state, targetId)
      let next = state

      if (isEnemy) {
        next = updateEnemy(state, targetId, e => ({
          ...e,
          statusEffects: addStatus(e.statusEffects, newStatus),
        }))
      } else {
        next = updateCharacter(state, targetId, c => ({
          ...c,
          statusEffects: addStatus(c.statusEffects, newStatus),
        }))
      }

      const targetName = isEnemy
        ? findEnemy(next, targetId)?.name
        : findCharacter(next, targetId)?.name
      newLogs.push(log('status_apply', `${targetName ?? '?'}에게 ${effect.status} 부여.`, {
        sourceId: actorId, targetId,
      }))
      return { state: next, newLogs, totalDamage }
    }

    case 'remove_status': {
      const next = updateCharacter(state, actorId, c => ({
        ...c,
        statusEffects: removeStatus(c.statusEffects, effect.status),
      }))
      newLogs.push(log('status_expire', `${effect.status} 상태이상이 해제됐다.`, { sourceId: actorId }))
      return { state: next, newLogs, totalDamage }
    }

    case 'shield': {
      const shieldAmount = Math.round(actorAttack * effect.amount)
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

  // MP 소비
  let current = updateCharacter(state, actorId, c => ({
    ...c,
    stats: { ...c.stats, mp: c.stats.mp - skill.mpCost },
    skillCooldowns: {
      ...c.skillCooldowns,
      [skillId]: skill.cooldown,
    },
  }))

  current = {
    ...current,
    log: [
      ...current.log,
      log('system', `${actor.name}이(가) ${skill.name}을(를) 사용!`, { sourceId: actorId }),
    ],
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
    if (hasStatus(enemy.statusEffects, 'freeze') || hasStatus(enemy.statusEffects, 'stun')) {
      current = {
        ...current,
        log: [...current.log, log('system', `${enemy.name}은(는) 행동 불능 상태다.`, { targetId: enemy.id })],
      }
      continue
    }

    const action = enemy.actions[enemy.actionIndex % enemy.actions.length]

    // 다음 액션 인덱스 증가
    current = updateEnemy(current, enemy.id, e => ({
      ...e,
      actionIndex: (e.actionIndex + 1) % e.actions.length,
    }))

    const alivePary = current.party.filter(c => c.isAlive)
    if (alivePary.length === 0) break

    switch (action.type) {
      case 'attack': {
        const target = selectPartyTarget(alivePary, action.targetMode)
        if (!target) break

        const powerupBonus = getStatusBonus(enemy.statusEffects, 'powerup')
        const defdownBonus = getStatusBonus(target.statusEffects, 'defdown')
        const effectiveDef = Math.max(0, target.stats.defense - defdownBonus)

        const dmg = calcDamage({
          attack: enemy.stats.attack,
          defense: effectiveDef,
          multiplier: action.multiplier,
          attackElement: action.element,
          defenderElement: target.element,
          itemElementMultiplier: 1,
          powerupBonus,
        })

        const res = applyDamageToCharacter(current, target.id, dmg)
        current = {
          ...res.state,
          log: [
            ...res.state.log,
            log('damage', `${enemy.name}이(가) ${target.name}에게 ${res.actualDamage} 피해!`, {
              value: res.actualDamage, sourceId: enemy.id, targetId: target.id,
            }),
          ],
        }
        if (!current.party.find(c => c.id === target.id)?.isAlive) {
          current = {
            ...current,
            log: [...current.log, log('death', `${target.name}이(가) 쓰러졌다!`, { targetId: target.id })],
          }
        }
        break
      }

      case 'attack_all': {
        for (const member of alivePary) {
          const powerupBonus = getStatusBonus(enemy.statusEffects, 'powerup')
          const dmg = calcDamage({
            attack: enemy.stats.attack,
            defense: member.stats.defense,
            multiplier: action.multiplier,
            attackElement: action.element,
            defenderElement: member.element,
            itemElementMultiplier: 1,
            powerupBonus,
          })
          const res = applyDamageToCharacter(current, member.id, dmg)
          current = {
            ...res.state,
            log: [
              ...res.state.log,
              log('damage', `${enemy.name}이(가) ${member.name}에게 ${res.actualDamage} 피해!`, {
                value: res.actualDamage, sourceId: enemy.id, targetId: member.id,
              }),
            ],
          }
        }
        break
      }

      case 'apply_status': {
        const targets = action.targetMode === 'all' ? alivePary : [selectPartyTarget(alivePary, 'random')].filter(Boolean) as BattleCharacter[]
        for (const t of targets) {
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
            log: [...current.log, log('status_apply', `${t.name}에게 ${action.status} 부여!`, {
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
          log: [...current.log, log('system', `${enemy.name}이(가) ${action.status} 버프 획득!`, {
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
    if (aliveParty.length === 0) break

    switch (action.type) {
      case 'attack': {
        const aliveEnemies = current.enemies.filter(e => e.isAlive)
        if (aliveEnemies.length === 0) break
        const target = aliveEnemies[0]
        const dmg = calcDamage({
          attack: ally.stats.attack,
          defense: target.stats.defense,
          multiplier: action.multiplier,
          attackElement: action.element,
          defenderElement: target.element,
          itemElementMultiplier: 1,
          powerupBonus: 0,
        })
        const res = applyDamageToEnemy(current, target.id, dmg)
        current = {
          ...res.state,
          log: [...res.state.log, log('damage', `${ally.name}이(가) ${target.name}에게 ${res.actualDamage} 피해!`, {
            value: res.actualDamage, sourceId: ally.id, targetId: target.id,
          })],
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
          log: [...current.log, log('status_apply', `${ally.name}이(가) ${target.name}에게 ${action.status} 부여!`, {
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
      const newHp = Math.max(0, char.stats.hp - dmg)
      current = updateCharacter(current, char.id, c => ({
        ...c,
        stats: { ...c.stats, hp: newHp },
        isAlive: newHp > 0,
      }))
      newLogs.push(log('damage', `${char.name}이(가) 독으로 ${dmg} 피해!`, {
        value: dmg, targetId: char.id,
      }))
    }

    // 화상
    if (hasStatus(char.statusEffects, 'burn')) {
      const burnDmg = getStatusBonus(char.statusEffects, 'burn')
      const newHp = Math.max(0, char.stats.hp - burnDmg)
      current = updateCharacter(current, char.id, c => ({
        ...c,
        stats: { ...c.stats, hp: newHp },
        isAlive: newHp > 0,
      }))
      newLogs.push(log('damage', `${char.name}이(가) 화상으로 ${burnDmg} 피해!`, {
        value: burnDmg, targetId: char.id,
      }))
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

    // 아이템 MP 회복 (mp_regen 아이템 효과)
    for (const item of current.items) {
      if (item.effect.type === 'mp_regen') {
        const newMp = Math.min(char.stats.maxMp, char.stats.mp + item.effect.amount)
        current = updateCharacter(current, char.id, c => ({
          ...c,
          stats: { ...c.stats, mp: newMp },
        }))
        newLogs.push(log('system', `${item.name}으로 MP가 ${item.effect.amount} 회복됐다.`, { sourceId: char.id }))
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

  // 상태이상 턴 감소
  current = {
    ...current,
    party: current.party.map(c => ({
      ...c,
      statusEffects: tickStatuses(c.statusEffects),
      skillCooldowns: Object.fromEntries(
        Object.entries(c.skillCooldowns).map(([id, cd]) => [id, Math.max(0, cd - 1)])
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

function selectPartyTarget(
  party: readonly BattleCharacter[],
  mode: 'random' | 'lowest_hp' | 'highest_attack',
): BattleCharacter | undefined {
  if (party.length === 0) return undefined

  switch (mode) {
    case 'lowest_hp':
      return [...party].sort((a, b) => a.stats.hp - b.stats.hp)[0]
    case 'highest_attack':
      return [...party].sort((a, b) => b.stats.attack - a.stats.attack)[0]
    case 'random':
    default:
      return party[Math.floor(Math.random() * party.length)]
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
      const nextState = useSkill(state, state.party[0]?.id ?? '', action.targetId, action.skillId, state.items)
      if (nextState.phase === 'player_turn') {
        return { ...nextState, phase: 'enemy_turn', selectedSkillId: null, selectedTargetId: null }
      }
      return { ...nextState, selectedSkillId: null, selectedTargetId: null }
    }

    case 'END_PLAYER_TURN': {
      if (state.phase !== 'player_turn') return state
      return { ...state, phase: 'enemy_turn' }
    }

    case 'PROCESS_ENEMY_TURN': {
      if (state.phase !== 'enemy_turn') return state
      const afterEnemyTurn = processEnemyTurn(state, state.items)
      if (afterEnemyTurn.phase === 'enemy_turn') {
        return { ...afterEnemyTurn, phase: 'player_turn', turnCount: afterEnemyTurn.turnCount + 1 }
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
