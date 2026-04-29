/* ==========================================================================
   Dark Fantasy Roguelike — EventScreen
   전투 사이 이벤트 화면
   ========================================================================== */

import type { CSSProperties } from 'react'
import type { EventEffect, Rarity } from '../game/types'
import { getEventById } from '../game/data/events'
import { useRunStore } from '../state/runStore'
import { MAX_ROUNDS } from '../game/run'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RARITY_LABELS: Record<Rarity, string> = {
  common:    '일반',
  rare:      '희귀',
  epic:      '영웅',
  legendary: '전설',
}

const RARITY_COLORS: Record<Rarity, string> = {
  common:    'var(--color-rarity-common)',
  rare:      'var(--color-rarity-rare)',
  epic:      'var(--color-rarity-epic)',
  legendary: 'var(--color-rarity-legendary)',
}

function formatEffect(effect: EventEffect): string {
  switch (effect.type) {
    case 'heal_hp':
      return `HP +${Math.round(effect.percent * 100)}% 회복`
    case 'stat_change': {
      const statName = effect.stat === 'maxHp' ? '최대 HP' :
                       effect.stat === 'attack' ? '공격력' : '방어력'
      const sign = effect.amount >= 0 ? '+' : ''
      return `${statName} ${sign}${effect.amount} (영구)`
    }
    case 'gain_skill':
      return `${RARITY_LABELS[effect.rarity]} 스킬 1장 획득`
    case 'gain_item':
      return `${RARITY_LABELS[effect.rarity]} 아이템 1개 획득`
    case 'nothing':
      return '아무 일도 일어나지 않는다'
  }
}

function effectColor(effect: EventEffect): string {
  switch (effect.type) {
    case 'heal_hp':
      return 'oklch(75% 0.16 145)'  // 초록
    case 'stat_change':
      return effect.amount >= 0
        ? 'oklch(75% 0.16 220)'  // 파랑 (버프)
        : 'oklch(70% 0.18 20)'   // 붉은 (패널티)
    case 'gain_skill':
      return RARITY_COLORS[effect.rarity]
    case 'gain_item':
      return RARITY_COLORS[effect.rarity]
    case 'nothing':
      return 'var(--color-text-muted)'
  }
}

function effectTone(effect: EventEffect): string {
  switch (effect.type) {
    case 'heal_hp':
    case 'gain_skill':
    case 'gain_item':
      return effectColor(effect)
    case 'stat_change':
      return effect.amount >= 0 ? 'var(--color-effect-positive)' : 'var(--color-effect-negative)'
    case 'nothing':
      return 'var(--color-text-muted)'
  }
}

// ---------------------------------------------------------------------------
// EventScreen
// ---------------------------------------------------------------------------

export function EventScreen() {
  const run          = useRunStore(s => s.run)
  const resolveEvent = useRunStore(s => s.resolveEvent)

  if (!run || run.phase !== 'event' || !run.currentEventId) return null

  const event = getEventById(run.currentEventId)
  if (!event) return null
  const progress = Math.min(100, Math.round(((run.round - 1) / MAX_ROUNDS) * 100))

  return (
    <div className="screen-shell screen-shell--center" style={{ gap: 'var(--space-6)' }}>
      {/* 이벤트 헤더 */}
      <div className="screen-header" style={{ textAlign: 'center', maxWidth: '560px', marginBottom: 0 }}>
        <div className="screen-eyebrow">
          {event.characterId ? '캐릭터 기억' : '이벤트'} — 라운드 {run.round - 1} 클리어
        </div>
        <h2 className="screen-title">{event.name}</h2>
        <div className="ui-progress" aria-label={`진행도 ${progress}%`}>
          <div
            className="ui-progress__fill"
            style={{ '--progress-value': `${progress}%`, '--progress-accent': 'var(--color-accent)' } as CSSProperties}
          />
        </div>
        <p style={{
          color: 'var(--color-text-muted)',
          fontStyle: 'italic',
          fontSize: 'var(--text-sm)',
          margin: '0 0 var(--space-2)',
          lineHeight: 1.6,
        }}>
          "{event.flavor}"
        </p>
        <p className="screen-copy" style={{ margin: 0 }}>
          {event.description}
        </p>
      </div>

      {/* 선택지 카드들 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: 'var(--space-5)',
        width: '100%',
        maxWidth: '780px',
      }}>
        {event.choices.map(choice => (
          <EventChoiceCard
            key={choice.id}
            label={choice.label}
            description={choice.description}
            effects={choice.effects}
            onSelect={() => resolveEvent(choice.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EventChoiceCard
// ---------------------------------------------------------------------------

interface EventChoiceCardProps {
  label: string
  description: string
  effects: readonly EventEffect[]
  onSelect: () => void
}

function EventChoiceCard({ label, description, effects, onSelect }: EventChoiceCardProps) {
  const primaryColor = effectTone(effects[0])

  return (
    <button
      onClick={onSelect}
      className="ui-card"
      style={{
        '--card-accent': primaryColor,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-5)',
        textAlign: 'left',
      } as CSSProperties}
    >
      {/* 선택지 제목 */}
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-md)',
        color: 'var(--color-text-primary)',
        fontWeight: 'var(--weight-bold)',
        letterSpacing: '0.02em',
      }}>
        {label}
      </div>

      {/* 선택지 설명 */}
      <div style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-secondary)',
        lineHeight: 1.6,
        flex: 1,
      }}>
        {description}
      </div>

      {/* 효과 목록 */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--space-3)',
      }}>
        {effects.map((eff, i) => (
          <span
            key={i}
            className="ui-chip"
            style={{ '--chip-accent': effectTone(eff) } as CSSProperties}
          >
            {formatEffect(eff)}
          </span>
        ))}
      </div>
    </button>
  )
}
