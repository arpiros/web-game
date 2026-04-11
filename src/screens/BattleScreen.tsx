import { useEffect, useRef, useState } from 'react'
import type {
  BattleCharacter,
  BattleAlly,
  BattleEnemy,
  BattleLogEntry,
  StatusEffect,
  ItemDef,
  SkillDef,
} from '../game/types'
import { getSkillById } from '../game/data/skills'
import { MAX_ROUNDS } from '../game/run'
import { calcDamage, getItemElementMultiplier, getStatusBonus } from '../game/combat'
import { useRunStore } from '../state/runStore'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEBUFF_STATUSES = new Set(['poison', 'burn', 'freeze', 'stun', 'defdown'])

function needsEnemyTarget(skillId: string): boolean {
  const skill = getSkillById(skillId)
  if (!skill) return false
  if (skill.effects.some(e => e.type === 'damage_all')) return false
  if (skill.effects.some(e => e.type === 'damage')) return true
  return skill.effects.some(
    e => e.type === 'apply_status' && DEBUFF_STATUSES.has(e.status),
  )
}

const ELEMENT_COLOR: Record<string, string> = {
  physical: 'var(--color-element-physical)',
  fire:     'var(--color-element-fire)',
  water:    'var(--color-element-water)',
  dark:     'var(--color-element-dark)',
  light:    'var(--color-element-light)',
}

const ELEMENT_LABEL: Record<string, string> = {
  physical: '물리', fire: '화', water: '수', dark: '암', light: '광',
}

const STATUS_COLOR: Record<string, string> = {
  poison: 'var(--color-status-poison)',
  burn:   'var(--color-status-burn)',
  freeze: 'var(--color-status-freeze)',
  stun:   'var(--color-status-stun)',
  shield: 'var(--color-status-buff)',
  regen:  'var(--color-status-buff)',
  powerup: 'var(--color-status-buff)',
  defdown: 'var(--color-status-debuff)',
}

const STATUS_LABEL: Record<string, string> = {
  poison: '독', burn: '화상', freeze: '빙결', stun: '기절',
  shield: '방막', regen: '재생', powerup: '강화', defdown: '방↓',
}

function hpColor(ratio: number): string {
  if (ratio > 0.6) return 'var(--color-hp-high)'
  if (ratio > 0.3) return 'var(--color-hp-mid)'
  return 'var(--color-hp-low)'
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

interface Props {
  onBattleVictory: () => void
  onBattleDefeat: () => void
}

export function BattleScreen({ onBattleVictory, onBattleDefeat }: Props) {
  const run            = useRunStore(s => s.run)
  const dispatchBattle = useRunStore(s => s.dispatchBattle)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)

  const bs           = run?.battleState
  const isPlayerTurn = bs?.phase === 'player_turn'
  const isEnding     = bs?.phase === 'victory' || bs?.phase === 'defeat'

  useEffect(() => {
    if (!bs) return
    if (bs.phase === 'enemy_turn') {
      const t = setTimeout(() => dispatchBattle({ type: 'PROCESS_ENEMY_TURN' }), 600)
      return () => clearTimeout(t)
    }
    if (bs.phase === 'victory') {
      const t = setTimeout(onBattleVictory, 1200)
      return () => clearTimeout(t)
    }
    if (bs.phase === 'defeat') {
      const t = setTimeout(onBattleDefeat, 1200)
      return () => clearTimeout(t)
    }
  // onBattleVictory/onBattleDefeat 참조가 변해도 phase 기준으로만 재실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bs?.phase])

  if (!run || !bs) return null

  const character    = bs.party[0]
  const aliveEnemies = bs.enemies.filter(e => e.isAlive)

  function handleSkillClick(skillId: string) {
    if (!isPlayerTurn) return
    const skill = getSkillById(skillId)
    if (!skill) return
    if (character.stats.mp < skill.mpCost) return
    if ((character.skillCooldowns[skillId] ?? 0) > 0) return

    if (needsEnemyTarget(skillId)) {
      setSelectedSkillId(prev => (prev === skillId ? null : skillId))
    } else {
      const target = aliveEnemies[0]
      if (!target) return
      setSelectedSkillId(null)
      dispatchBattle({ type: 'USE_SKILL', skillId, targetId: target.id })
    }
  }

  function handleEnemyClick(enemyId: string) {
    if (!isPlayerTurn || !selectedSkillId) return
    setSelectedSkillId(null)
    dispatchBattle({ type: 'USE_SKILL', skillId: selectedSkillId, targetId: enemyId })
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
      maxWidth: 'var(--battle-max-width)', width: '100%', margin: '0 auto',
      opacity: isEnding ? 0.75 : 1,
      transition: 'opacity var(--duration-slow)',
    }}>

      {/* ── HUD ── */}
      <div style={{
        height: 'var(--hud-height)', flexShrink: 0,
        borderBottom: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-surface)',
        display: 'flex', alignItems: 'center',
        padding: '0 var(--space-5)', gap: 'var(--space-4)',
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)', fontSize: 'var(--text-sm)',
          color: 'var(--color-accent)', letterSpacing: '0.06em',
        }}>
          Round {run.round} / {MAX_ROUNDS}
        </span>
        <span style={{ color: 'var(--color-border-default)', fontSize: 'var(--text-xs)' }}>│</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          턴 {bs.turnCount + 1}
        </span>
        <span style={{ flex: 1 }} />
        <PhaseLabel phase={bs.phase} />
      </div>

      {/* ── Skill bar ── */}
      <SkillBar
        character={character}
        isPlayerTurn={isPlayerTurn}
        selectedSkillId={selectedSkillId}
        onSkillClick={handleSkillClick}
        enemies={bs.enemies.filter(e => e.isAlive)}
        items={bs.items}
        onEndTurn={() => {
          if (!isPlayerTurn) return
          setSelectedSkillId(null)
          dispatchBattle({ type: 'END_PLAYER_TURN' })
        }}
      />

      {/* ── Main ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Center: enemies + log */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', padding: 'var(--space-3)', gap: 'var(--space-3)',
        }}>
          {/* Enemy zone */}
          <div style={{
            flex: '0 0 auto',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            gap: 'var(--space-5)',
            padding: 'var(--space-6) var(--space-4) var(--space-4)',
            minHeight: '210px',
            background: 'linear-gradient(to bottom, oklch(6% 0.025 268), transparent)',
            borderRadius: 'var(--radius-lg)',
          }}>
            {bs.enemies.map(enemy => (
              <EnemyCard
                key={enemy.id}
                enemy={enemy}
                isTargetable={isPlayerTurn && !!selectedSkillId && enemy.isAlive}
                onClick={() => handleEnemyClick(enemy.id)}
              />
            ))}
          </div>

          {/* Battle log */}
          <BattleLog entries={bs.log} />
        </div>

        {/* Right: party panel */}
        <div style={{
          width: 'var(--panel-width-side)', flexShrink: 0,
          borderLeft: '1px solid var(--color-border-subtle)',
          background: 'var(--color-bg-surface)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden auto',
          padding: 'var(--space-3)', gap: 'var(--space-2)',
        }}>
          <div style={{
            fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
            letterSpacing: '0.08em', marginBottom: 'var(--space-1)',
          }}>
            PARTY
          </div>
          <PartyMemberCard entity={character} />
          {bs.allies.map(ally => (
            <PartyMemberCard key={ally.id} entity={ally} isAlly />
          ))}

          {bs.items.length > 0 && (
            <>
              <div style={{
                fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                letterSpacing: '0.08em',
                marginTop: 'var(--space-2)',
                paddingTop: 'var(--space-2)',
                borderTop: '1px solid var(--color-border-subtle)',
              }}>
                ITEMS
              </div>
              {bs.items.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PhaseLabel
// ---------------------------------------------------------------------------

function PhaseLabel({ phase }: { phase: string }) {
  const label =
    phase === 'player_turn' ? '플레이어 턴' :
    phase === 'enemy_turn'  ? '적 턴 처리 중...' :
    phase === 'victory'     ? '전투 승리!' :
    phase === 'defeat'      ? '전투 패배...' : ''

  const color =
    phase === 'player_turn' ? 'var(--color-hp-high)' :
    phase === 'victory'     ? 'var(--color-accent)' :
    phase === 'defeat'      ? 'var(--color-hp-low)' :
    'var(--color-text-muted)'

  return (
    <span style={{
      fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color,
    }}>
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// EnemyCard
// ---------------------------------------------------------------------------

function EnemyCard({ enemy, isTargetable, onClick }: {
  enemy: BattleEnemy
  isTargetable: boolean
  onClick: () => void
}) {
  const hpRatio = enemy.stats.maxHp > 0
    ? Math.max(0, enemy.stats.hp / enemy.stats.maxHp)
    : 0
  const elColor = ELEMENT_COLOR[enemy.element] ?? 'var(--color-accent)'
  const elLabel = ELEMENT_LABEL[enemy.element] ?? '?'

  return (
    <button
      onClick={onClick}
      disabled={!isTargetable}
      style={{
        width: '140px',
        background: 'var(--color-bg-elevated)',
        border: `1px solid ${isTargetable ? elColor : 'var(--color-border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-3)',
        cursor: isTargetable ? 'crosshair' : 'default',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
        opacity: enemy.isAlive ? 1 : 0.25,
        transition: 'all var(--duration-fast)',
        boxShadow: isTargetable ? `0 0 16px ${elColor}50` : 'none',
        transform: isTargetable ? 'translateY(-4px) scale(1.02)' : 'none',
      }}
    >
      {/* Element + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <span style={{ fontSize: '0.6rem', color: elColor, fontWeight: 'var(--weight-bold)' }}>
          [{elLabel}]
        </span>
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
          color: 'var(--color-text-primary)', flex: 1, textAlign: 'center',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {enemy.name}
        </span>
      </div>

      {/* HP bar */}
      <div>
        <div style={{
          height: '5px', background: 'var(--color-border-subtle)',
          borderRadius: 'var(--radius-full)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${hpRatio * 100}%`,
            background: hpColor(hpRatio), borderRadius: 'var(--radius-full)',
            transition: 'width var(--duration-normal)',
          }} />
        </div>
        <div style={{
          fontSize: '0.6rem', color: 'var(--color-text-muted)',
          textAlign: 'right', marginTop: '2px',
        }}>
          {enemy.stats.hp.toLocaleString()} / {enemy.stats.maxHp.toLocaleString()}
        </div>
      </div>

      {/* Status effects */}
      {enemy.statusEffects.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
          {enemy.statusEffects.map((se, i) => (
            <StatusBadge key={i} effect={se} />
          ))}
        </div>
      )}

      {/* Targeting indicator */}
      {isTargetable && (
        <div style={{
          fontSize: '0.6rem', color: elColor, textAlign: 'center',
          fontWeight: 'var(--weight-bold)', letterSpacing: '0.05em',
        }}>
          ▼ 타겟
        </div>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// PartyMemberCard
// ---------------------------------------------------------------------------

type PartyEntity = BattleCharacter | BattleAlly

function PartyMemberCard({ entity, isAlly }: { entity: PartyEntity; isAlly?: boolean }) {
  const hpRatio  = entity.stats.maxHp > 0
    ? Math.max(0, entity.stats.hp / entity.stats.maxHp)
    : 0
  const elColor  = ELEMENT_COLOR[entity.element] ?? 'var(--color-accent)'
  const hasMp    = entity.stats.maxMp > 0

  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border-subtle)',
      borderLeft: `3px solid ${entity.isAlive ? elColor : 'var(--color-border-subtle)'}`,
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-2) var(--space-3)',
      opacity: entity.isAlive ? 1 : 0.35,
      transition: 'opacity var(--duration-normal)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 'var(--space-1)',
      }}>
        <span style={{
          fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
          color: isAlly ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
        }}>
          {entity.name}
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
          ATK {entity.stats.attack}
        </span>
      </div>

      <ResourceBar
        current={entity.stats.hp} max={entity.stats.maxHp}
        color={hpColor(hpRatio)} label="HP"
      />
      {hasMp && (
        <ResourceBar
          current={entity.stats.mp} max={entity.stats.maxMp}
          color="var(--color-mp)" label="MP"
        />
      )}

      {entity.statusEffects.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: 'var(--space-1)' }}>
          {entity.statusEffects.map((se, i) => (
            <StatusBadge key={i} effect={se} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ItemCard
// ---------------------------------------------------------------------------

const RARITY_COLOR: Record<string, string> = {
  common:    'var(--color-rarity-common)',
  rare:      'var(--color-rarity-rare)',
  epic:      'var(--color-rarity-epic)',
  legendary: 'var(--color-rarity-legendary)',
}

function ItemCard({ item }: { item: ItemDef }) {
  const rarityColor = RARITY_COLOR[item.rarity] ?? 'var(--color-text-muted)'
  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border-subtle)',
      borderLeft: `3px solid ${rarityColor}`,
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-2) var(--space-3)',
    }}>
      <div style={{
        fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
        color: 'var(--color-text-primary)',
        marginBottom: '2px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {item.name}
      </div>
      <div style={{
        fontSize: '0.6rem', color: 'var(--color-text-muted)',
        lineHeight: 'var(--leading-relaxed)',
      }}>
        {item.description}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ResourceBar
// ---------------------------------------------------------------------------

function ResourceBar({ current, max, color, label }: {
  current: number; max: number; color: string; label: string
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{label}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)' }}>
          {current} / {max}
        </span>
      </div>
      <div style={{
        height: '4px', background: 'var(--color-border-subtle)',
        borderRadius: 'var(--radius-full)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${ratio * 100}%`, background: color,
          borderRadius: 'var(--radius-full)',
          transition: 'width var(--duration-normal)',
        }} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ effect }: { effect: StatusEffect }) {
  const color = STATUS_COLOR[effect.kind] ?? 'var(--color-text-muted)'
  const label = STATUS_LABEL[effect.kind] ?? effect.kind
  return (
    <span style={{
      fontSize: '0.55rem', padding: '1px 4px',
      borderRadius: 'var(--radius-sm)',
      background: `color-mix(in oklch, ${color} 20%, transparent)`,
      color,
      border: `1px solid color-mix(in oklch, ${color} 40%, transparent)`,
    }}>
      {label}{effect.duration > 0 ? ` ${effect.duration}` : ''}
    </span>
  )
}

// ---------------------------------------------------------------------------
// BattleLog
// ---------------------------------------------------------------------------

function BattleLog({ entries }: { entries: readonly BattleLogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = 0
    }
  }, [entries.length])

  function entryColor(kind: string): string {
    switch (kind) {
      case 'system':       return 'var(--color-accent)'
      case 'death':        return 'var(--color-hp-low)'
      case 'heal':         return 'var(--color-hp-high)'
      case 'status_apply': return 'var(--color-status-burn)'
      case 'status_expire':return 'var(--color-text-muted)'
      default:             return 'var(--color-text-secondary)'
    }
  }

  return (
    <div
      ref={ref}
      style={{
        flex: 1, overflow: 'auto',
        fontSize: 'var(--text-xs)',
        display: 'flex', flexDirection: 'column', gap: '1px',
        padding: 'var(--space-2) var(--space-3)',
        background: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)',
        scrollBehavior: 'smooth',
      }}
    >
      {[...entries].slice(-30).reverse().map(entry => (
        <div
          key={entry.id}
          style={{
            color: entryColor(entry.kind),
            lineHeight: 'var(--leading-normal)',
            padding: '1px 0',
          }}
        >
          {entry.text}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SkillBar
// ---------------------------------------------------------------------------

function estimateDamage(
  skill: SkillDef,
  character: BattleCharacter,
  enemies: readonly BattleEnemy[],
  items: readonly ItemDef[],
): number | null {
  const dmgEffect = skill.effects.find(
    e => e.type === 'damage' || e.type === 'damage_all',
  )
  if (!dmgEffect || (dmgEffect.type !== 'damage' && dmgEffect.type !== 'damage_all')) return null
  const target = enemies[0]
  if (!target) return null
  const itemElemMult = getItemElementMultiplier(items, dmgEffect.element)
  const powerupBonus = getStatusBonus(character.statusEffects, 'powerup')
  return calcDamage({
    attack: character.stats.attack,
    defense: target.stats.defense,
    multiplier: dmgEffect.multiplier,
    attackElement: dmgEffect.element,
    defenderElement: target.element,
    itemElementMultiplier: itemElemMult,
    powerupBonus,
  })
}

function SkillTooltip({ skill, character, enemies, items, x, y }: {
  skill: SkillDef
  character: BattleCharacter
  enemies: readonly BattleEnemy[]
  items: readonly ItemDef[]
  x: number
  y: number
}) {
  const elColor   = ELEMENT_COLOR[skill.element] ?? 'var(--color-accent)'
  const elLabel   = ELEMENT_LABEL[skill.element] ?? skill.element
  const hasDmgAll = skill.effects.some(e => e.type === 'damage_all')
  const dmg       = estimateDamage(skill, character, enemies, items)

  return (
    <div style={{
      position: 'fixed', top: y, left: x,
      width: '240px', padding: 'var(--space-3)',
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border-default)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 4px 20px oklch(0% 0 0 / 0.5)',
      zIndex: 100, pointerEvents: 'none',
      fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
    }}>
      <div style={{ marginBottom: 'var(--space-1)' }}>
        <span style={{ color: elColor, fontSize: '0.6rem', fontWeight: 'var(--weight-bold)' }}>
          [{elLabel}]
        </span>
        {' '}
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
          {skill.name}
        </span>
      </div>
      <p style={{ margin: '0 0 var(--space-2)', lineHeight: 'var(--leading-relaxed)' }}>
        {skill.description}
      </p>
      <div style={{
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--space-2)',
        display: 'flex', flexDirection: 'column', gap: '2px',
      }}>
        {skill.mpCost > 0 && (
          <span>MP <strong style={{ color: 'var(--color-mp)' }}>{skill.mpCost}</strong></span>
        )}
        {skill.cooldown > 0 && (
          <span>쿨다운 <strong style={{ color: 'var(--color-text-secondary)' }}>{skill.cooldown}턴</strong></span>
        )}
        {dmg !== null && (
          <span style={{ color: 'var(--color-accent)', marginTop: '2px' }}>
            예상 데미지: ~{dmg.toLocaleString()}
            {hasDmgAll ? ' (전체)' : ' (첫 번째 적)'}
          </span>
        )}
      </div>
    </div>
  )
}

function SkillBar({ character, isPlayerTurn, selectedSkillId, onSkillClick, enemies, items, onEndTurn }: {
  character: BattleCharacter
  isPlayerTurn: boolean
  selectedSkillId: string | null
  onSkillClick: (skillId: string) => void
  enemies: readonly BattleEnemy[]
  items: readonly ItemDef[]
  onEndTurn: () => void
}) {
  const [tooltip, setTooltip] = useState<{ skillId: string; x: number; y: number } | null>(null)

  return (
    <div style={{
      height: 'var(--skill-bar-height)', flexShrink: 0,
      borderBottom: '1px solid var(--color-border-subtle)',
      background: 'var(--color-bg-surface)',
      display: 'flex', alignItems: 'center',
      padding: '0 var(--space-4)', gap: 'var(--space-2)',
      overflowX: 'auto', overflowY: 'hidden',
    }}>
      {tooltip && (() => {
        const skill = getSkillById(tooltip.skillId)
        if (!skill) return null
        return (
          <SkillTooltip
            skill={skill}
            character={character}
            enemies={enemies}
            items={items}
            x={tooltip.x}
            y={tooltip.y}
          />
        )
      })()}
      {character.skillIds.map(skillId => {
        const skill     = getSkillById(skillId)
        if (!skill) return null

        const cooldown      = character.skillCooldowns[skillId] ?? 0
        const cannotAfford  = character.stats.mp < skill.mpCost
        const isOnCooldown  = cooldown > 0
        const isDisabled    = !isPlayerTurn || cannotAfford || isOnCooldown
        const isSelected    = selectedSkillId === skillId
        const elColor       = ELEMENT_COLOR[skill.element] ?? 'var(--color-accent)'
        const rarityColor   = `var(--color-rarity-${skill.rarity})`

        return (
          <button
            key={skillId}
            onClick={() => onSkillClick(skillId)}
            disabled={isDisabled}
            onMouseEnter={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              setTooltip({ skillId, x: rect.left, y: rect.bottom + 4 })
            }}
            onMouseLeave={() => setTooltip(null)}
            style={{
              minWidth: '88px', height: '88px', flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '3px', padding: 'var(--space-2)',
              background: isSelected
                ? `color-mix(in oklch, ${elColor} 28%, var(--color-bg-elevated))`
                : 'var(--color-bg-elevated)',
              border: `1px solid ${
                isSelected    ? elColor :
                isOnCooldown  ? 'var(--color-border-subtle)' :
                rarityColor
              }`,
              borderRadius: 'var(--radius-md)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.4 : 1,
              transition: 'all var(--duration-fast)',
              boxShadow: isSelected ? `0 0 14px ${elColor}50` : 'none',
              transform: isSelected ? 'translateY(-3px)' : 'none',
            }}
          >
            {/* Rarity color strip */}
            <div style={{
              width: '24px', height: '2px',
              background: isOnCooldown ? 'var(--color-border-subtle)' : rarityColor,
              borderRadius: 'var(--radius-full)',
              marginBottom: '2px',
            }} />

            {/* Name */}
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
              color: isOnCooldown ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              textAlign: 'center', lineHeight: 1.2,
              maxWidth: '80px', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {skill.name}
            </span>

            {/* MP cost */}
            {skill.mpCost > 0 && (
              <span style={{
                fontSize: '0.6rem',
                color: cannotAfford ? 'var(--color-hp-low)' : 'var(--color-mp)',
              }}>
                {skill.mpCost} MP
              </span>
            )}

            {/* Cooldown or element */}
            {isOnCooldown ? (
              <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                CD {cooldown}
              </span>
            ) : (
              <span style={{
                fontSize: '0.55rem',
                color: elColor, opacity: 0.8,
              }}>
                {ELEMENT_LABEL[skill.element] ?? skill.element}
              </span>
            )}
          </button>
        )
      })}

      {/* End Turn button — always available on player turn */}
      <button
        onClick={onEndTurn}
        disabled={!isPlayerTurn}
        title="턴을 종료하고 적 차례로 넘어갑니다"
        style={{
          minWidth: '72px', height: '88px', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '4px', padding: 'var(--space-2)',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-md)',
          cursor: isPlayerTurn ? 'pointer' : 'not-allowed',
          opacity: isPlayerTurn ? 1 : 0.35,
          transition: 'all var(--duration-fast)',
          marginLeft: 'var(--space-2)',
        }}
      >
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⏭</span>
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-text-secondary)', textAlign: 'center',
          lineHeight: 1.2,
        }}>
          턴 종료
        </span>
      </button>
    </div>
  )
}
