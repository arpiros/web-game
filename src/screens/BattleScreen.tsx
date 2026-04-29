import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  BattleCharacter,
  BattleAlly,
  BattleEnemy,
  BattleLogEntry,
  StatusEffect,
  ItemDef,
  SkillDef,
  EnemyActionPattern,
  Element,
} from '../game/types'
import { getSkillById } from '../game/data/skills'
import { getFloorThemeByRound } from '../game/data/floorThemes'
import { MAX_ROUNDS } from '../game/run'
import { calcDamage, getItemElementMultiplier, getStatusBonus } from '../game/combat'
import { getActiveSynergies } from '../game/synergy'
import type { Synergy } from '../game/synergy'
import { useRunStore } from '../state/runStore'
import { GameIcon } from '../components/GameIcon'
import { CharacterPortrait } from '../components/CharacterPortrait'

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
  defend: 'var(--color-status-buff)',
}

const STATUS_LABEL: Record<string, string> = {
  poison: '독', burn: '화상', freeze: '빙결', stun: '기절',
  shield: '방막', regen: '재생', powerup: '강화', defdown: '방↓',
  mana_regen: 'MP재생', cc_immune: 'CC면역', revive: '부활대기', undying: '불사',
  defend: '방어중',
}

interface StatusDesc {
  summary: string
  detail: (value: number) => string | null
}

const STATUS_TOOLTIP_WIDTH = 220
const STATUS_TOOLTIP_GAP = 6
const TOOLTIP_EDGE_PADDING = 12

const STATUS_DESCRIPTION: Record<string, StatusDesc> = {
  poison:     { summary: '매 턴 최대 HP의 일정 %만큼 피해를 받는다',      detail: v => `${v}% / 턴` },
  burn:       { summary: '매 턴 고정 피해를 받는다',                      detail: v => `${v} 피해 / 턴` },
  freeze:     { summary: '이번 턴 행동 불가. 받는 데미지 +50%',           detail: () => null },
  stun:       { summary: '이번 턴 행동 불가',                             detail: () => null },
  shield:     { summary: '피해를 흡수한다. 흡수량 소진 시 사라진다',       detail: v => v > 0 ? `${v.toLocaleString()} 흡수` : null },
  regen:      { summary: '매 턴 시작 시 HP를 회복한다',                   detail: v => `+${v} HP / 턴` },
  powerup:    { summary: '공격력이 증폭된다',                             detail: v => `+${v}% 공격력` },
  defdown:    { summary: '방어력이 감소한다',                             detail: v => `-${v} 방어력` },
  mana_regen: { summary: '매 턴 MP를 회복한다',                          detail: v => `+${v} MP / 턴` },
  cc_immune:  { summary: '기절·빙결 등 행동 불능 효과가 무효화된다',       detail: () => null },
  revive:     { summary: '사망 시 HP 30%로 1회 부활한다',                 detail: () => null },
  undying:    { summary: '사망 직전 HP 1로 1회 버틴다',                   detail: () => null },
  defend:     { summary: '받는 데미지가 30% 감소한다',                    detail: () => '-30% 피해' },
}

function getStatusTooltipPosition(rect: DOMRect): { x: number; y: number } {
  const maxX = window.innerWidth - STATUS_TOOLTIP_WIDTH - TOOLTIP_EDGE_PADDING
  const x = Math.max(TOOLTIP_EDGE_PADDING, Math.min(rect.left, maxX))
  const yBelow = rect.bottom + STATUS_TOOLTIP_GAP
  const y = yBelow < window.innerHeight - TOOLTIP_EDGE_PADDING
    ? yBelow
    : Math.max(TOOLTIP_EDGE_PADDING, rect.top - STATUS_TOOLTIP_GAP)
  return { x, y }
}

function hpColor(ratio: number): string {
  if (ratio > 0.6) return 'var(--color-hp-high)'
  if (ratio > 0.3) return 'var(--color-hp-mid)'
  return 'var(--color-hp-low)'
}

// ---------------------------------------------------------------------------
// Damage Popup
// ---------------------------------------------------------------------------

interface PopupEntry {
  id: string
  text: string
  kind: 'damage' | 'crit' | 'miss' | 'heal'
  xPct: number
}

function DamagePopup({ popup, battleSpeed }: { popup: PopupEntry; battleSpeed: number }) {
  const isCrit = popup.kind === 'crit'
  const isMiss = popup.kind === 'miss'
  const isHeal = popup.kind === 'heal'

  const color =
    isCrit  ? 'var(--color-element-fire)' :
    isMiss  ? 'var(--color-text-muted)'   :
    isHeal  ? 'var(--color-hp-high)'      :
    'var(--color-hp-low)'

  return (
    <div style={{
      position: 'absolute',
      bottom: '30%',
      left: `${popup.xPct}%`,
      color,
      fontFamily: 'var(--font-heading)',
      fontWeight: 'var(--weight-bold)',
      fontSize: isCrit ? 'var(--text-lg)' : 'var(--text-sm)',
      pointerEvents: 'none',
      animation: `${isCrit ? 'popup-float-crit' : 'popup-float'} ${Math.round(1000 / battleSpeed)}ms ease-out forwards`,
      textShadow: '0 1px 4px oklch(0% 0 0 / 0.8)',
      whiteSpace: 'nowrap',
      zIndex: 10,
    }}>
      {isCrit ? `★ ${popup.text}` : popup.text}
    </div>
  )
}

// ---------------------------------------------------------------------------
// useBattleAnimations hook
// ---------------------------------------------------------------------------

interface AnimationState {
  shakingIds: ReadonlySet<string>
  dyingIds: ReadonlySet<string>
  removedIds: ReadonlySet<string>
  flashingIds: ReadonlySet<string>
  popups: PopupEntry[]
  bossPhaseFlash: 0 | 2 | 3
}

function useBattleAnimations(
  bs: { log: readonly BattleLogEntry[]; enemies: readonly BattleEnemy[] } | null | undefined,
  battleSpeed: number,
): AnimationState {
  const [shakingIds, setShakingIds]         = useState<Set<string>>(new Set())
  const [dyingIds, setDyingIds]             = useState<Set<string>>(new Set())
  const [removedIds, setRemovedIds]         = useState<Set<string>>(new Set())
  const [flashingIds, setFlashingIds]       = useState<Set<string>>(new Set())
  const [bossPhaseFlash, setBossPhaseFlash] = useState<0 | 2 | 3>(0)
  const [popups, setPopups]                 = useState<PopupEntry[]>([])
  const prevLogLen    = useRef<number | null>(null)
  const shakeTimers   = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const flashTimers   = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const popupTimers   = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const dyingRef      = useRef(new Set<string>())

  useEffect(() => {
    if (!bs) return
    if (prevLogLen.current === null) {
      prevLogLen.current = bs.log.length
      return
    }
    const newEntries = bs.log.slice(prevLogLen.current)
    prevLogLen.current = bs.log.length

    for (const entry of newEntries) {
      // Boss phase transition flash
      if (entry.kind === 'system' && entry.text.includes('[페이즈')) {
        const phase = entry.text.includes('[페이즈 3') ? 3 : 2
        setBossPhaseFlash(phase as 2 | 3)
        setTimeout(() => setBossPhaseFlash(0), Math.round(1200 / battleSpeed))
      }

      // Shake / death animations
      if (entry.kind === 'death' && entry.targetId) {
        const id = entry.targetId
        const shakeTimer = shakeTimers.current.get(id)
        if (shakeTimer) {
          clearTimeout(shakeTimer)
          shakeTimers.current.delete(id)
        }
        setShakingIds(prev => { const next = new Set(prev); next.delete(id); return next })
        dyingRef.current.add(id)
        setDyingIds(prev => new Set([...prev, id]))
        setTimeout(() => {
          dyingRef.current.delete(id)
          setDyingIds(prev => { const next = new Set(prev); next.delete(id); return next })
          setRemovedIds(prev => new Set([...prev, id]))
        }, Math.round(600 / battleSpeed))
      } else if ((entry.kind === 'damage' || entry.kind === 'crit') && entry.targetId) {
        const id = entry.targetId
        if (!dyingRef.current.has(id)) {
          // Shake
          const existing = shakeTimers.current.get(id)
          if (existing) clearTimeout(existing)
          setShakingIds(prev => new Set([...prev, id]))
          const st = setTimeout(() => {
            setShakingIds(prev => { const next = new Set(prev); next.delete(id); return next })
            shakeTimers.current.delete(id)
          }, Math.round(300 / battleSpeed))
          shakeTimers.current.set(id, st)

          // Hit flash
          const existingFlash = flashTimers.current.get(id)
          if (existingFlash) clearTimeout(existingFlash)
          setFlashingIds(prev => new Set([...prev, id]))
          const ft = setTimeout(() => {
            setFlashingIds(prev => { const next = new Set(prev); next.delete(id); return next })
            flashTimers.current.delete(id)
          }, Math.round(200 / battleSpeed))
          flashTimers.current.set(id, ft)
        }
      }

      // Popups
      if (entry.kind !== 'damage' && entry.kind !== 'crit' &&
          entry.kind !== 'miss'   && entry.kind !== 'heal') continue

      let xPct = 50
      if (entry.targetId) {
        const idx = bs.enemies.findIndex(e => e.id === entry.targetId)
        if (idx >= 0) {
          const count = bs.enemies.length
          xPct = count === 1 ? 50 : 20 + (idx / (count - 1)) * 60
        } else {
          xPct = 82
        }
      }

      const text =
        entry.kind === 'miss' ? 'MISS' :
        entry.kind === 'heal' ? `+${entry.value ?? ''}` :
        `${entry.value ?? ''}`

      const popup: PopupEntry = { id: entry.id, text, kind: entry.kind, xPct }
      setPopups(prev => {
        const next = [...prev, popup]
        return next.length > 12 ? next.slice(next.length - 12) : next
      })
      const t = setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== popup.id))
        popupTimers.current.delete(popup.id)
      }, Math.round(1100 / battleSpeed))
      popupTimers.current.set(popup.id, t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bs?.log.length])

  useEffect(() => {
    return () => {
      shakeTimers.current.forEach(t => clearTimeout(t))
      flashTimers.current.forEach(t => clearTimeout(t))
      popupTimers.current.forEach(t => clearTimeout(t))
    }
  }, [])

  return { shakingIds, dyingIds, removedIds, flashingIds, popups, bossPhaseFlash }
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
  const battleSpeed    = useRunStore(s => s.battleSpeed)
  const setBattleSpeed = useRunStore(s => s.setBattleSpeed)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [logOpen, setLogOpen] = useState(false)

  const bs           = run?.battleState
  const isPlayerTurn = bs?.phase === 'player_turn'
  const isEnding     = bs?.phase === 'victory' || bs?.phase === 'defeat'

  const { shakingIds, dyingIds, removedIds, flashingIds, popups, bossPhaseFlash } = useBattleAnimations(bs, battleSpeed)

  useEffect(() => {
    if (!bs) return
    if (bs.phase === 'enemy_turn') {
      const t = setTimeout(() => dispatchBattle({ type: 'PROCESS_ENEMY_TURN' }), Math.round(600 / battleSpeed))
      return () => clearTimeout(t)
    }
    if (bs.phase === 'victory') {
      const t = setTimeout(onBattleVictory, Math.round(1200 / battleSpeed))
      return () => clearTimeout(t)
    }
    if (bs.phase === 'defeat') {
      const t = setTimeout(onBattleDefeat, Math.round(1200 / battleSpeed))
      return () => clearTimeout(t)
    }
  // onBattleVictory/onBattleDefeat 참조가 변해도 phase 기준으로만 재실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bs?.phase, battleSpeed])

  if (!run || !bs) return null

  const character    = bs.party[0]
  const aliveEnemies = bs.enemies.filter(e => e.isAlive)
  const selectedSkill = selectedSkillId ? getSkillById(selectedSkillId) : null
  const floorTheme = getFloorThemeByRound(run.round)

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
    <div className="battle-shell" style={{
      display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
      width: 'min(100%, calc(100dvh * 16 / 9))', margin: '0 auto',
      opacity: isEnding ? 0.75 : 1,
      transition: 'opacity var(--duration-slow)',
    }}>

      {/* ── HUD ── */}
      <div className="altar-hud battle-hud" style={{
        height: 'var(--hud-height)', flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: '0 var(--space-5)', gap: 'var(--space-4)',
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)', fontSize: 'var(--text-sm)',
          color: 'var(--color-accent)', letterSpacing: '0.06em',
        }}>
          Round {run.round} / {MAX_ROUNDS}
        </span>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: floorTheme.accent,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 'clamp(120px, 22vw, 260px)',
        }}>
          {floorTheme.name}
        </span>
        <span style={{ color: 'var(--color-border-default)', fontSize: 'var(--text-xs)' }}>│</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          턴 {bs.turnCount + 1}
        </span>
        {getActiveSynergies(bs.party, bs.allies).map(s => (
          <SynergyBadge key={s.id} synergy={s} />
        ))}
        <span style={{ flex: 1 }} />
        <SpeedControl speed={battleSpeed} onSetSpeed={setBattleSpeed} />
        <span style={{ color: 'var(--color-border-default)', fontSize: 'var(--text-xs)' }}>│</span>
        <PhaseLabel phase={bs.phase} />
      </div>

      {/* ── Main ── */}
      <div className="battle-main" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Center: enemies + log */}
        <div className="battle-center" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', padding: 'var(--space-3)', gap: 'var(--space-3)',
        }}>
          {/* Enemy zone */}
          <div className={`battle-enemy-zone ${bs.enemies.length <= 1 ? 'battle-enemy-zone--single' : ''}`} style={{
            flex: 1, position: 'relative', minHeight: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(1, bs.enemies.length)}, minmax(0, 188px))`,
            alignItems: 'end',
            justifyContent: 'center',
            gap: 'var(--space-5)',
            padding: 'var(--space-6) var(--space-4) var(--space-4)',
            background: floorTheme.background,
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{
              position: 'absolute',
              top: 'var(--space-3)',
              left: 'var(--space-4)',
              zIndex: 3,
              display: selectedSkill ? 'none' : 'flex',
              flexDirection: 'column',
              gap: '2px',
              pointerEvents: 'none',
            }}>
              <span style={{
                fontSize: 'var(--text-xxs)',
                color: floorTheme.accent,
                fontWeight: 'var(--weight-bold)',
                letterSpacing: '0.08em',
              }}>
                {floorTheme.subtitle}
              </span>
              <span style={{
                fontSize: 'var(--text-xxs)',
                color: 'var(--color-text-muted)',
                maxWidth: 'min(48vw, 420px)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {floorTheme.summary}
              </span>
            </div>
            {selectedSkill && needsEnemyTarget(selectedSkill.id) && (
              <div style={{
                position: 'absolute',
                top: 'var(--space-3)',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                border: `1px solid ${ELEMENT_COLOR[selectedSkill.element] ?? 'var(--color-accent)'}`,
                borderRadius: 'var(--radius-md)',
                background: 'color-mix(in oklch, var(--color-bg-overlay) 88%, transparent)',
                color: 'var(--color-text-primary)',
                boxShadow: `0 0 18px color-mix(in oklch, ${ELEMENT_COLOR[selectedSkill.element] ?? 'var(--color-accent)'} 30%, transparent)`,
                pointerEvents: 'none',
              }}>
                <span style={{
                  color: ELEMENT_COLOR[selectedSkill.element] ?? 'var(--color-accent)',
                  fontWeight: 'var(--weight-bold)',
                  fontSize: 'var(--text-xs)',
                }}>
                  TARGET
                </span>
                <span style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>
                  {selectedSkill.name} 대상 선택
                </span>
              </div>
            )}
            {bossPhaseFlash !== 0 && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 20,
                pointerEvents: 'none',
                borderRadius: 'var(--radius-lg)',
                background: bossPhaseFlash === 3
                  ? 'radial-gradient(ellipse at center, oklch(25% 0.18 15 / 0.85) 0%, oklch(10% 0.12 10 / 0.95) 100%)'
                  : 'radial-gradient(ellipse at center, oklch(30% 0.16 35 / 0.80) 0%, oklch(12% 0.10 20 / 0.90) 100%)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
                animation: `boss-phase-in ${Math.round(1200 / battleSpeed)}ms ease-out forwards`,
              }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-2xl)',
                  color: bossPhaseFlash === 3 ? 'oklch(75% 0.22 15)' : 'oklch(78% 0.20 45)',
                  letterSpacing: '0.12em',
                  textShadow: `0 0 24px ${bossPhaseFlash === 3 ? 'oklch(55% 0.28 15 / 0.9)' : 'oklch(60% 0.24 40 / 0.9)'}`,
                }}>
                  {bossPhaseFlash === 3 ? '최종 형태' : '페이즈 2 전환'}
                </span>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: 'oklch(70% 0.04 268)',
                  letterSpacing: '0.06em',
                }}>
                  {bossPhaseFlash === 3 ? '▸ 보스가 극한의 힘을 해방한다' : '▸ 보스가 형태를 바꾼다'}
                </span>
              </div>
            )}
            {bs.enemies.map(enemy => (
              removedIds.has(enemy.id) ? (
                <div key={enemy.id} className="battle-enemy-placeholder" aria-hidden="true" />
              ) : (
                <EnemyCard
                  key={enemy.id}
                  enemy={enemy}
                  isTargetable={isPlayerTurn && !!selectedSkillId && enemy.isAlive && !dyingIds.has(enemy.id)}
                  onClick={() => handleEnemyClick(enemy.id)}
                  party={[...bs.party, ...bs.allies]}
                  isShaking={shakingIds.has(enemy.id)}
                  isDying={dyingIds.has(enemy.id)}
                  isFlashing={flashingIds.has(enemy.id)}
                  battleSpeed={battleSpeed}
                />
              )
            ))}
            {popups.map(p => <DamagePopup key={p.id} popup={p} battleSpeed={battleSpeed} />)}
          </div>

          {/* Battle log */}
          <BattleLog entries={bs.log} isOpen={logOpen} onToggle={() => setLogOpen(p => !p)} />
        </div>

        {/* Right: party panel */}
        <div className="battle-party-panel" style={{
          width: 'var(--panel-width-side)', flexShrink: 0,
          borderLeft: '1px solid color-mix(in oklch, var(--color-accent) 16%, transparent)',
          background: 'linear-gradient(180deg, var(--color-glass-strong), var(--color-glass))',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden auto',
          padding: 'var(--space-3)', gap: 'var(--space-2)',
        }}>
          <div className="latin-label" style={{
            marginBottom: 'var(--space-1)',
          }}>
            PARTY
          </div>
          <PartyMemberCard
            entity={character}
            isShaking={shakingIds.has(character.id)}
            isDying={dyingIds.has(character.id)}
            isFlashing={flashingIds.has(character.id)}
            battleSpeed={battleSpeed}
          />
          {bs.allies.map(ally => (
            <PartyMemberCard
              key={ally.id}
              entity={ally}
              isAlly
              isShaking={shakingIds.has(ally.id)}
              isDying={dyingIds.has(ally.id)}
              isFlashing={flashingIds.has(ally.id)}
              battleSpeed={battleSpeed}
            />
          ))}

          {bs.items.length > 0 && (
            <>
              <div className="latin-label" style={{
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

          {(() => {
            const synergies = getActiveSynergies(bs.party, bs.allies)
            if (synergies.length === 0) return null
            return (
              <>
                <div className="latin-label" style={{
                  marginTop: 'var(--space-2)',
                  paddingTop: 'var(--space-2)',
                  borderTop: '1px solid var(--color-border-subtle)',
                }}>
                  SYNERGIES
                </div>
                {synergies.map(s => (
                  <SynergyPanelCard key={s.id} synergy={s} />
                ))}
              </>
            )
          })()}
        </div>
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// SpeedControl
// ---------------------------------------------------------------------------

function SpeedControl({ speed, onSetSpeed }: {
  speed: 1 | 1.5 | 2
  onSetSpeed: (s: 1 | 1.5 | 2) => void
}) {
  const speeds: Array<1 | 1.5 | 2> = [1, 1.5, 2]
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {speeds.map(s => (
        <button
          key={s}
          onClick={() => onSetSpeed(s)}
          style={{
            padding: '2px 6px',
            fontSize: 'var(--text-xxs)',
            fontWeight: s === speed ? 'var(--weight-bold)' : 'var(--weight-normal)',
            background: s === speed
              ? 'color-mix(in oklch, var(--color-accent) 25%, transparent)'
              : 'transparent',
            color: s === speed ? 'var(--color-accent)' : 'var(--color-text-muted)',
            border: `1px solid ${s === speed ? 'var(--color-accent)' : 'var(--color-border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          {s}x
        </button>
      ))}
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
// EnemyIntent
// ---------------------------------------------------------------------------

function getNextEnemyAction(enemy: BattleEnemy): EnemyActionPattern {
  const actions =
    enemy.bossCurrentPhase === 3 && enemy.bossPhases ? enemy.bossPhases.phase3Actions :
    enemy.bossCurrentPhase === 2 && enemy.bossPhases ? enemy.bossPhases.phase2Actions :
    enemy.actions
  return actions[enemy.actionIndex % actions.length]
}

type PartyMember = BattleCharacter | BattleAlly

function EnemyIntentBadge({ action, enemy, party }: {
  action: EnemyActionPattern
  enemy: BattleEnemy
  party: readonly PartyMember[]
}) {
  const aliveParty   = party.filter(p => p.isAlive)
  const powerupBonus = getStatusBonus(enemy.statusEffects, 'powerup')

  function estimateAttack(multiplier: number, element: Element): number | null {
    const target = aliveParty[0]
    if (!target) return null
    return calcDamage({
      attack: enemy.stats.attack,
      defense: target.stats.defense,
      multiplier,
      attackElement: element,
      defenderElement: target.element,
      itemElementMultiplier: 1,
      powerupBonus,
    })
  }

  let icon:     string
  let label:    string
  let sublabel: string | null = null
  let color:    string        = 'var(--color-text-muted)'

  switch (action.type) {
    case 'attack': {
      const dmg = estimateAttack(action.multiplier, action.element)
      icon  = 'ATK'
      label = '공격'
      sublabel = dmg !== null ? `~${dmg.toLocaleString()}` : null
      color = ELEMENT_COLOR[action.element] ?? 'var(--color-hp-low)'
      break
    }
    case 'attack_all': {
      const dmg = estimateAttack(action.multiplier, action.element)
      icon  = 'ALL'
      label = '전체 공격'
      sublabel = dmg !== null ? `~${dmg.toLocaleString()}/명` : null
      color = ELEMENT_COLOR[action.element] ?? 'var(--color-hp-low)'
      break
    }
    case 'apply_status': {
      icon  = 'STS'
      label = `${STATUS_LABEL[action.status] ?? action.status} 부여`
      sublabel = action.targetMode === 'all' ? `전체 ${action.duration}턴` : `${action.duration}턴`
      color = STATUS_COLOR[action.status] ?? 'var(--color-text-muted)'
      break
    }
    case 'heal_self': {
      const healAmt = Math.round(enemy.stats.attack * action.multiplier)
      icon  = 'HP'
      label = '자가 치유'
      sublabel = `~${healAmt.toLocaleString()}`
      color = 'var(--color-hp-high)'
      break
    }
    case 'buff_self': {
      icon  = 'UP'
      label = `${STATUS_LABEL[action.status] ?? action.status} 강화`
      sublabel = `${action.duration}턴`
      color = 'var(--color-status-buff)'
      break
    }
  }

  return (
    <div style={{
      borderTop: '1px solid var(--color-border-subtle)',
      paddingTop: 'var(--space-1)',
      display: 'flex', alignItems: 'center', gap: '4px',
    }}>
      <span style={{
        minWidth: '1.55rem',
        padding: '1px 4px',
        borderRadius: 'var(--radius-full)',
        background: 'color-mix(in oklch, currentColor 10%, white)',
        color,
        fontSize: 'var(--text-xxs)',
        fontWeight: 'var(--weight-bold)',
        lineHeight: 1.2,
        textAlign: 'center',
        flexShrink: 0,
      }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
        <span style={{ fontSize: 'var(--text-xxs)', fontWeight: 'var(--weight-semibold)', color, lineHeight: 1 }}>
          {label}
        </span>
        {sublabel && (
          <span style={{ fontSize: 'var(--text-xxs)', color: 'var(--color-text-muted)', lineHeight: 1 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EnemyCard
// ---------------------------------------------------------------------------

function EnemyCard({ enemy, isTargetable, onClick, party, isShaking, isDying, isFlashing, battleSpeed }: {
  enemy: BattleEnemy
  isTargetable: boolean
  onClick: () => void
  party: readonly PartyMember[]
  isShaking: boolean
  isDying: boolean
  isFlashing: boolean
  battleSpeed: number
}) {
  const hpRatio = enemy.stats.maxHp > 0
    ? Math.max(0, enemy.stats.hp / enemy.stats.maxHp)
    : 0
  const elColor = ELEMENT_COLOR[enemy.element] ?? 'var(--color-accent)'
  const elLabel = ELEMENT_LABEL[enemy.element] ?? '?'

  const animStyle: React.CSSProperties = isDying
    ? { animation: `entity-death-fadeout ${Math.round(600 / battleSpeed)}ms ease-out forwards`, opacity: undefined, transition: 'none' }
    : isShaking
    ? { animation: `entity-shake ${Math.round(300 / battleSpeed)}ms ease-out${isFlashing ? `, entity-hit-flash ${Math.round(200 / battleSpeed)}ms ease-out` : ''}` }
    : isFlashing
    ? { animation: `entity-hit-flash ${Math.round(200 / battleSpeed)}ms ease-out` }
    : {}

  return (
    <button
      onClick={onClick}
      disabled={!isTargetable}
      className="battle-enemy-card"
      style={{
        width: '140px',
        position: 'relative',
        background: 'linear-gradient(180deg, var(--color-glass-strong), var(--color-glass))',
        border: `1px solid ${isTargetable ? elColor : 'color-mix(in oklch, var(--color-border-subtle) 78%, transparent)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-3)',
        cursor: isTargetable ? 'crosshair' : 'default',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
        opacity: isDying ? undefined : (enemy.isAlive ? 1 : 0.25),
        transition: (isDying || isShaking) ? 'none' : 'all var(--duration-fast)',
        boxShadow: isTargetable
          ? `0 16px 34px color-mix(in oklch, ${elColor} 22%, transparent), var(--shadow-inset)`
          : 'var(--shadow-sm), var(--shadow-inset)',
        transform: (isDying || isShaking) ? undefined : (isTargetable ? 'translateY(-4px) scale(1.02)' : 'none'),
        ...animStyle,
      }}
    >
      {/* Boss phase badge */}
      {enemy.isBoss && enemy.bossCurrentPhase !== undefined && (
        <div style={{
          fontSize: 'var(--text-xxs)', fontWeight: 'var(--weight-bold)', textAlign: 'center',
          padding: '2px 6px', borderRadius: 'var(--radius-sm)',
          background: enemy.bossCurrentPhase === 3
            ? 'color-mix(in oklch, var(--color-hp-low) 16%, white)'
            : enemy.bossCurrentPhase === 2
            ? 'color-mix(in oklch, var(--color-gold) 16%, white)'
            : 'color-mix(in oklch, var(--color-accent) 12%, white)',
          color: enemy.bossCurrentPhase === 3
            ? 'var(--color-hp-low)'
            : enemy.bossCurrentPhase === 2
            ? 'var(--color-gold-dim)'
            : 'var(--color-accent-dim)',
          letterSpacing: '0.05em',
        }}>
          {enemy.bossCurrentPhase === 3 ? '페이즈 3 · 최종 형태' : enemy.bossCurrentPhase === 2 ? '페이즈 2 · 분노' : '페이즈 1'}
        </div>
      )}

      {/* Elite badge */}
      {enemy.isElite && (
        <div style={{
          fontSize: 'var(--text-xxs)', fontWeight: 'var(--weight-bold)', textAlign: 'center',
          padding: '2px 6px', borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in oklch, var(--color-gold) 16%, white)',
          color: 'var(--color-gold-dim)',
          letterSpacing: '0.05em',
        }}>
          엘리트
        </div>
      )}

      {/* Element + name */}
      <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-1)' }}>
        <GameIcon
          id={enemy.defId}
          kind="enemy"
          element={enemy.element}
          rarity={enemy.isBoss ? 'legendary' : enemy.isElite ? 'epic' : 'rare'}
          size={enemy.isBoss ? 'lg' : 'md'}
          label={enemy.name}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', minWidth: 0, width: '100%' }}>
          <span style={{ fontSize: 'var(--text-xxs)', color: elColor, fontWeight: 'var(--weight-bold)' }}>
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
      </div>

      {/* HP bar */}
      <div>
        <div style={{
          height: '8px', background: 'oklch(100% 0 0 / 0.68)',
          borderRadius: 'var(--radius-full)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${hpRatio * 100}%`,
            background: hpColor(hpRatio), borderRadius: 'var(--radius-full)',
            transition: 'width var(--duration-normal)',
          }} />
        </div>
        <div style={{
          fontSize: 'var(--text-xxs)', color: 'var(--color-text-muted)',
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

      {/* Enemy intent */}
      {enemy.isAlive && (
        <EnemyIntentBadge
          action={getNextEnemyAction(enemy)}
          enemy={enemy}
          party={party}
        />
      )}

      {/* Targeting indicator */}
      {isTargetable && (
        <>
          <div className="target-reticle" />
          <div style={{
            fontSize: 'var(--text-xxs)', color: elColor, textAlign: 'center',
            fontWeight: 'var(--weight-bold)', letterSpacing: '0.05em',
          }}>
            TARGET
          </div>
        </>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// PartyMemberCard
// ---------------------------------------------------------------------------

type PartyEntity = BattleCharacter | BattleAlly

function PartyMemberCard({ entity, isAlly, isShaking, isDying, isFlashing, battleSpeed }: {
  entity: PartyEntity; isAlly?: boolean
  isShaking: boolean; isDying: boolean; isFlashing: boolean; battleSpeed: number
}) {
  const hpRatio  = entity.stats.maxHp > 0
    ? Math.max(0, entity.stats.hp / entity.stats.maxHp)
    : 0
  const elColor  = ELEMENT_COLOR[entity.element] ?? 'var(--color-accent)'
  const hasMp    = entity.stats.maxMp > 0

  const animStyle: React.CSSProperties = isDying
    ? { animation: `entity-death-fadeout ${Math.round(600 / battleSpeed)}ms ease-out forwards`, opacity: undefined, transition: 'none' }
    : isShaking
    ? { animation: `entity-shake ${Math.round(300 / battleSpeed)}ms ease-out${isFlashing ? `, entity-hit-flash ${Math.round(200 / battleSpeed)}ms ease-out` : ''}` }
    : isFlashing
    ? { animation: `entity-hit-flash ${Math.round(200 / battleSpeed)}ms ease-out` }
    : {}

  return (
    <div style={{
      background: 'linear-gradient(180deg, var(--color-glass-strong), var(--color-glass))',
      border: '1px solid color-mix(in oklch, var(--color-border-subtle) 82%, transparent)',
      borderLeft: `3px solid ${entity.isAlive ? elColor : 'var(--color-border-subtle)'}`,
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-2) var(--space-3)',
      opacity: isDying ? undefined : (entity.isAlive ? 1 : 0.35),
      transition: (isDying || isShaking) ? 'none' : 'opacity var(--duration-normal)',
      ...animStyle,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-1)',
      }}>
        {isAlly ? (
          <GameIcon
            id={entity.defId}
            kind="ally"
            element={entity.element}
            rarity="rare"
            size="xs"
            label={entity.name}
          />
        ) : (
          <CharacterPortrait
            id={entity.defId}
            element={entity.element}
            label={entity.name}
            size="panel"
          />
        )}
        <div style={{ display: 'grid', gap: '2px', minWidth: 0, flex: 1 }}>
          <span style={{
            fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
            color: isAlly ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {entity.name}
          </span>
          <span style={{ fontSize: 'var(--text-xxs)', color: 'var(--color-text-muted)' }}>
            {isAlly && 'title' in entity ? `${entity.title} · ` : ''}ATK {entity.stats.attack} · DEF {entity.stats.defense}
          </span>
        </div>
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
      background: 'linear-gradient(180deg, var(--color-glass-strong), var(--color-glass))',
      border: '1px solid color-mix(in oklch, var(--color-border-subtle) 82%, transparent)',
      borderLeft: `3px solid ${rarityColor}`,
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-2) var(--space-3)',
    }}>
      <div className="entity-heading" style={{ marginBottom: '2px' }}>
        <GameIcon id={item.id} kind="item" rarity={item.rarity} size="xs" label={item.name} />
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </div>
      </div>
      <div style={{
        fontSize: 'var(--text-xxs)', color: 'var(--color-text-muted)',
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
        <span style={{ fontSize: 'var(--text-xxs)', color: 'var(--color-text-muted)' }}>{label}</span>
        <span style={{ fontSize: 'var(--text-xxs)', color: 'var(--color-text-secondary)' }}>
          {current} / {max}
        </span>
      </div>
      <div style={{
        height: '5px', background: 'oklch(100% 0 0 / 0.68)',
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
// StatusTooltip
// ---------------------------------------------------------------------------

function StatusTooltip({ effect, x, y }: { effect: StatusEffect; x: number; y: number }) {
  const color = STATUS_COLOR[effect.kind] ?? 'var(--color-text-muted)'
  const label = STATUS_LABEL[effect.kind] ?? effect.kind
  const desc  = STATUS_DESCRIPTION[effect.kind]
  const detail = desc ? desc.detail(effect.value) : null

  return createPortal(
    <div style={{
      position: 'fixed', top: y, left: x,
      width: STATUS_TOOLTIP_WIDTH, padding: 'var(--space-3)',
      background: 'linear-gradient(180deg, var(--color-glass-strong), var(--color-glass))',
      border: '1px solid color-mix(in oklch, var(--color-accent) 22%, transparent)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg), var(--shadow-inset)',
      zIndex: 200, pointerEvents: 'none',
      fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
        <span style={{ color, fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
          {label}
        </span>
        {effect.duration > 0 && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xxs)' }}>
            {effect.duration}턴 남음
          </span>
        )}
      </div>
      {desc && (
        <>
          <p style={{ margin: '0 0 var(--space-1)', lineHeight: 'var(--leading-relaxed)' }}>
            {desc.summary}
          </p>
          {detail && (
            <div style={{
              borderTop: '1px solid var(--color-border-subtle)',
              paddingTop: 'var(--space-1)',
              color, fontWeight: 'var(--weight-semibold)',
            }}>
              {detail}
            </div>
          )}
        </>
      )}
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ effect }: { effect: StatusEffect }) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const lastPointerType = useRef<string>('mouse')
  const color = STATUS_COLOR[effect.kind] ?? 'var(--color-text-muted)'
  const label = STATUS_LABEL[effect.kind] ?? effect.kind

  return (
    <>
      {tooltipPos && <StatusTooltip effect={effect} x={tooltipPos.x} y={tooltipPos.y} />}
      <span
        role="button"
        tabIndex={0}
        onPointerDown={e => {
          lastPointerType.current = e.pointerType
        }}
        onPointerEnter={e => {
          if (e.pointerType === 'touch') return
          const rect = e.currentTarget.getBoundingClientRect()
          setTooltipPos(getStatusTooltipPosition(rect))
        }}
        onPointerLeave={e => {
          if (e.pointerType === 'touch') return
          setTooltipPos(null)
        }}
        onClick={e => {
          e.stopPropagation()
          const rect = e.currentTarget.getBoundingClientRect()
          const nextPos = getStatusTooltipPosition(rect)
          setTooltipPos(prev => lastPointerType.current === 'touch' && prev ? null : nextPos)
        }}
        onFocus={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          setTooltipPos(getStatusTooltipPosition(rect))
        }}
        onBlur={() => setTooltipPos(null)}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            setTooltipPos(null)
            return
          }
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            const rect = e.currentTarget.getBoundingClientRect()
            setTooltipPos(getStatusTooltipPosition(rect))
          }
        }}
        style={{
          display: 'inline-block',
          fontSize: 'var(--text-xxs)', padding: '1px 4px',
          borderRadius: 'var(--radius-sm)',
          background: `color-mix(in oklch, ${color} 20%, transparent)`,
          color,
          border: `1px solid color-mix(in oklch, ${color} 40%, transparent)`,
          cursor: 'help',
          userSelect: 'none',
        }}
      >
        {label}{effect.duration > 0 ? ` ${effect.duration}` : ''}
      </span>
    </>
  )
}

// ---------------------------------------------------------------------------
// SynergyTooltip / SynergyBadge / SynergyPanelCard
// ---------------------------------------------------------------------------

function SynergyTooltip({ synergy, x, y }: { synergy: Synergy; x: number; y: number }) {
  return (
    <div style={{
      position: 'fixed', top: y, left: x,
      width: '220px', padding: 'var(--space-3)',
      background: 'linear-gradient(180deg, var(--color-glass-strong), var(--color-glass))',
      border: '1px solid color-mix(in oklch, var(--color-accent) 22%, transparent)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg), var(--shadow-inset)',
      zIndex: 200, pointerEvents: 'none',
      fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
        <span style={{ color: 'var(--color-accent)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
          {synergy.name}
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xxs)' }}>
          {synergy.elements.join(' + ')}
        </span>
      </div>
      <p style={{ margin: 0, lineHeight: 'var(--leading-relaxed)' }}>
        {synergy.description}
      </p>
    </div>
  )
}

function SynergyBadge({ synergy }: { synergy: Synergy }) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  return (
    <>
      {tooltipPos && <SynergyTooltip synergy={synergy} x={tooltipPos.x} y={tooltipPos.y} />}
      <span
        role="button"
        tabIndex={0}
        onPointerEnter={e => {
          if (e.pointerType === 'touch') return
          const rect = e.currentTarget.getBoundingClientRect()
          setTooltipPos({ x: rect.left, y: rect.bottom + 4 })
        }}
        onPointerLeave={e => {
          if (e.pointerType === 'touch') return
          setTooltipPos(null)
        }}
        onClick={e => {
          e.stopPropagation()
          const rect = e.currentTarget.getBoundingClientRect()
          setTooltipPos(prev => prev ? null : { x: rect.left, y: rect.bottom + 4 })
        }}
        onKeyDown={e => {
          if (e.key === 'Escape') setTooltipPos(null)
        }}
        style={{
          fontSize: 'var(--text-xs)', padding: '2px 6px',
          borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in oklch, var(--color-accent) 20%, transparent)',
          color: 'var(--color-accent)',
          border: '1px solid color-mix(in oklch, var(--color-accent) 40%, transparent)',
          cursor: 'help',
          userSelect: 'none',
        }}
      >
        {synergy.name}
      </span>
    </>
  )
}

function SynergyPanelCard({ synergy }: { synergy: Synergy }) {
  return (
    <div style={{
      padding: 'var(--space-2) var(--space-3)',
      borderRadius: 'var(--radius-sm)',
      background: 'color-mix(in oklch, var(--color-accent) 8%, transparent)',
      border: '1px solid color-mix(in oklch, var(--color-accent) 25%, transparent)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        marginBottom: 'var(--space-1)',
      }}>
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-accent)',
        }}>
          {synergy.name}
        </span>
        <span style={{ fontSize: 'var(--text-xxs)', color: 'var(--color-text-muted)' }}>
          {synergy.elements.join(' + ')}
        </span>
      </div>
      <p style={{
        margin: 0,
        fontSize: 'var(--text-xxs)', color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
      }}>
        {synergy.description}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BattleLog
// ---------------------------------------------------------------------------

function BattleLog({ entries, isOpen, onToggle }: {
  entries: readonly BattleLogEntry[]
  isOpen: boolean
  onToggle: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [entries.length, isOpen])

  function entryClass(kind: string): string {
    switch (kind) {
      case 'damage':
      case 'death':  return 'battle-log-entry battle-log-entry--damage'
      case 'heal':   return 'battle-log-entry battle-log-entry--heal'
      case 'crit':   return 'battle-log-entry battle-log-entry--crit'
      case 'system': return 'battle-log-entry battle-log-entry--system'
      default:       return 'battle-log-entry'
    }
  }

  return (
    <div style={{ flexShrink: 0 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', height: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--space-3)',
          background: 'var(--color-glass)',
          border: '1px solid var(--color-border-subtle)',
          borderBottom: isOpen ? 'none' : '1px solid var(--color-border-subtle)',
          borderRadius: isOpen
            ? 'var(--radius-md) var(--radius-md) 0 0'
            : 'var(--radius-md)',
          cursor: 'pointer',
          fontSize: 'var(--text-xxs)',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.1em',
        }}
      >
        <span>BATTLE LOG</span>
        <span>{isOpen ? '접기' : '열기'}</span>
      </button>

      {isOpen && (
        <div
          ref={ref}
          style={{
            height: '90px',
            overflow: 'auto',
            fontSize: 'var(--text-xs)',
            display: 'flex', flexDirection: 'column', gap: '1px',
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--color-glass)',
            border: '1px solid var(--color-border-subtle)',
            borderTop: 'none',
            borderRadius: '0 0 var(--radius-md) var(--radius-md)',
            scrollBehavior: 'smooth',
          }}
        >
          {[...entries].slice(-30).map(entry => (
            <div key={entry.id} className={entryClass(entry.kind)}>
              {entry.text}
            </div>
          ))}
        </div>
      )}
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
    e => e.type === 'damage' || e.type === 'damage_all' || e.type === 'damage_hp_scale',
  )
  if (!dmgEffect) return null
  if (dmgEffect.type !== 'damage' && dmgEffect.type !== 'damage_all' && dmgEffect.type !== 'damage_hp_scale') return null
  const target = enemies[0]
  if (!target) return null
  const itemElemMult = getItemElementMultiplier(items, dmgEffect.element)
  const powerupBonus = getStatusBonus(character.statusEffects, 'powerup')

  if (dmgEffect.type === 'damage_hp_scale') {
    const missingHpRatio = 1 - character.stats.hp / character.stats.maxHp
    const scaledMultiplier = dmgEffect.baseMultiplier * (1 + missingHpRatio)
    return calcDamage({
      attack: character.stats.attack,
      defense: target.stats.defense,
      multiplier: scaledMultiplier,
      attackElement: dmgEffect.element,
      defenderElement: target.element,
      itemElementMultiplier: itemElemMult,
      powerupBonus,
    })
  }

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
  const elColor      = ELEMENT_COLOR[skill.element] ?? 'var(--color-accent)'
  const elLabel      = ELEMENT_LABEL[skill.element] ?? skill.element
  const hasDmgAll    = skill.effects.some(e => e.type === 'damage_all')
  const isHpScale    = skill.effects.some(e => e.type === 'damage_hp_scale')
  const dmg          = estimateDamage(skill, character, enemies, items)
  const hpPct        = character.stats.maxHp > 0
    ? Math.round((character.stats.hp / character.stats.maxHp) * 100)
    : 100

  return (
    <div style={{
      position: 'fixed', top: y, left: x,
      transform: 'translateY(-100%)',
      width: '240px', padding: 'var(--space-3)',
      background: 'linear-gradient(180deg, var(--color-glass-strong), var(--color-glass))',
      border: '1px solid color-mix(in oklch, var(--color-accent) 22%, transparent)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg), var(--shadow-inset)',
      zIndex: 100, pointerEvents: 'none',
      fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
    }}>
      <div style={{ marginBottom: 'var(--space-1)' }}>
        <span style={{ color: elColor, fontSize: 'var(--text-xxs)', fontWeight: 'var(--weight-bold)' }}>
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
        {isHpScale && (
          <span style={{ color: 'var(--color-hp-low)', marginTop: '2px', fontStyle: 'italic' }}>
            HP 스케일 (현재 {hpPct}% → 배율 {(() => {
              const e = skill.effects.find(x => x.type === 'damage_hp_scale')
              if (!e || e.type !== 'damage_hp_scale') return ''
              const scaled = (e.baseMultiplier * (1 + (100 - hpPct) / 100)).toFixed(1)
              return `${scaled}x`
            })()})
          </span>
        )}
      </div>
    </div>
  )
}

function canShowHoverTooltip(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
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

  function showSkillTooltip(skillId: string, rect: DOMRect) {
    if (!canShowHoverTooltip()) return
    const tooltipWidth = 240
    const edgePadding = 12
    const maxX = window.innerWidth - tooltipWidth - edgePadding
    setTooltip({
      skillId,
      x: Math.max(edgePadding, Math.min(rect.left, maxX)),
      y: rect.top - 4,
    })
  }

  return (
    <div className="battle-skill-bar" style={{
      height: 'var(--skill-bar-height)', flexShrink: 0,
      borderTop: '1px solid color-mix(in oklch, var(--color-accent) 18%, transparent)',
      background: 'linear-gradient(180deg, var(--color-glass-strong), var(--color-glass))',
      display: 'flex', alignItems: 'center',
      padding: '0 var(--space-4)', gap: 'var(--space-2)',
      overflowX: 'auto', overflowY: 'hidden',
      boxShadow: '0 -14px 34px oklch(45% 0.1 245 / 0.1), var(--shadow-inset)',
      backdropFilter: 'blur(18px) saturate(1.16)',
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
            className="battle-skill-button"
            onClick={() => {
              setTooltip(null)
              onSkillClick(skillId)
            }}
            disabled={isDisabled}
            aria-pressed={isSelected}
            aria-label={`${skill.name}. ${cannotAfford ? 'MP 부족. ' : ''}${isOnCooldown ? `쿨다운 ${cooldown}턴. ` : ''}${isSelected ? '대상 선택 중.' : ''}`}
            onMouseEnter={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              showSkillTooltip(skillId, rect)
            }}
            onMouseLeave={() => setTooltip(null)}
            onPointerDown={() => {
              if (!canShowHoverTooltip()) setTooltip(null)
            }}
            style={{
              minWidth: '92px', height: '104px', flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '2px', padding: 'var(--space-2)',
              background: isSelected
                ? `color-mix(in oklch, ${elColor} 18%, white)`
                : cannotAfford && !isOnCooldown
                  ? 'color-mix(in oklch, var(--color-hp-low) 8%, white)'
                  : 'var(--color-bg-elevated)',
              border: `1px solid ${
                isSelected    ? elColor :
                isOnCooldown  ? 'var(--color-border-subtle)' :
                cannotAfford  ? 'color-mix(in oklch, var(--color-hp-low) 50%, var(--color-border-subtle))' :
                rarityColor
              }`,
              borderRadius: 'var(--radius-md)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: !isPlayerTurn ? 0.4 : isOnCooldown ? 0.35 : cannotAfford ? 0.6 : 1,
              transition: 'all var(--duration-fast)',
              boxShadow: isSelected
                ? `0 14px 28px color-mix(in oklch, ${elColor} 24%, transparent), var(--shadow-inset)`
                : 'var(--shadow-sm), var(--shadow-inset)',
              transform: isSelected ? 'translateY(-3px)' : 'none',
            }}
          >
            {/* Rarity color strip */}
            <div className="battle-skill-rarity-strip" style={{
              width: '24px', height: '2px',
              background: isOnCooldown ? 'var(--color-border-subtle)' : rarityColor,
              borderRadius: 'var(--radius-full)',
              marginBottom: '2px',
            }} />

            <GameIcon
              id={skill.id}
              kind="skill"
              element={skill.element}
              rarity={skill.rarity}
              size="xs"
              label={skill.name}
            />

            {/* Name */}
            <span className="battle-skill-name" style={{
              fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
              color: isOnCooldown ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              textAlign: 'center', lineHeight: 1.2,
              maxWidth: '80px', overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              wordBreak: 'keep-all',
            }}>
              {skill.name}
            </span>

            {/* MP cost */}
            {skill.mpCost > 0 && (
              <span className="battle-skill-meta battle-skill-cost" style={{
                fontSize: 'var(--text-xxs)',
                color: cannotAfford ? 'var(--color-hp-low)' : 'var(--color-mp)',
              }}>
                {skill.mpCost} MP
              </span>
            )}

            {/* Cooldown or element */}
            {isOnCooldown ? (
              <span className="battle-skill-meta battle-skill-kind" style={{ fontSize: 'var(--text-xxs)', color: 'var(--color-text-muted)' }}>
                CD {cooldown}
              </span>
            ) : (
              <span className="battle-skill-meta battle-skill-kind" style={{
                fontSize: 'var(--text-xxs)',
                color: elColor, opacity: 0.8,
              }}>
                {ELEMENT_LABEL[skill.element] ?? skill.element}
              </span>
            )}
          </button>
        )
      })}

      {selectedSkillId && needsEnemyTarget(selectedSkillId) && (
        <span className="battle-skill-target-hint" style={{
          marginLeft: 'auto', marginRight: 'var(--space-3)',
          color: 'var(--color-accent)', fontSize: 'var(--text-xs)',
          whiteSpace: 'nowrap', opacity: 0.85,
          animation: 'pulse 1.2s ease-in-out infinite',
        }}>
          적을 선택하여 스킬을 사용하세요
        </span>
      )}

      {/* End Turn button — always available on player turn */}
      <button
        className="battle-end-turn-button"
        onClick={onEndTurn}
        disabled={!isPlayerTurn}
        title="턴을 종료하고 적 차례로 넘어갑니다"
        aria-label="방어하고 턴 종료"
        style={{
          minWidth: '72px', height: '88px', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '4px', padding: 'var(--space-2)',
          background: 'linear-gradient(180deg, var(--color-glass-strong), var(--color-glass))',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-md)',
          cursor: isPlayerTurn ? 'pointer' : 'not-allowed',
          opacity: isPlayerTurn ? 1 : 0.35,
          transition: 'all var(--duration-fast)',
          marginLeft: 'var(--space-2)',
        }}
      >
        <span style={{
          fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-text-secondary)', textAlign: 'center',
          lineHeight: 1.2,
        }}>
          방어하기
        </span>
      </button>
    </div>
  )
}
