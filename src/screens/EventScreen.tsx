/* ==========================================================================
   Dark Fantasy Roguelike — EventScreen
   전투 사이 이벤트 화면 (라운드 2·4)
   ========================================================================== */

import type { EventEffect, Rarity } from '../game/types'
import { getEventById } from '../game/data/events'
import { useRunStore } from '../state/runStore'

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

// ---------------------------------------------------------------------------
// EventScreen
// ---------------------------------------------------------------------------

export function EventScreen() {
  const run          = useRunStore(s => s.run)
  const resolveEvent = useRunStore(s => s.resolveEvent)

  if (!run || run.phase !== 'event' || !run.currentEventId) return null

  const event = getEventById(run.currentEventId)
  if (!event) return null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      padding: 'var(--space-6)',
      gap: 'var(--space-6)',
    }}>
      {/* 이벤트 헤더 */}
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-2)',
        }}>
          이벤트 — 라운드 {run.round - 1} 클리어
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-accent)',
          margin: '0 0 var(--space-3)',
          letterSpacing: '0.04em',
        }}>
          {event.name}
        </h2>
        <p style={{
          color: 'var(--color-text-muted)',
          fontStyle: 'italic',
          fontSize: 'var(--text-sm)',
          margin: '0 0 var(--space-2)',
          lineHeight: 1.6,
        }}>
          "{event.flavor}"
        </p>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          {event.description}
        </p>
      </div>

      {/* 선택지 카드들 */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-5)',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '720px',
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
  return (
    <button
      onClick={onSelect}
      style={{
        flex: '1 1 260px',
        maxWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-5)',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color var(--duration-fast), box-shadow var(--duration-fast), background var(--duration-fast)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = 'var(--color-accent)'
        el.style.boxShadow = '0 0 20px color-mix(in oklch, var(--color-accent) 25%, transparent)'
        el.style.background = 'color-mix(in oklch, var(--color-bg-card) 90%, var(--color-accent) 10%)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = 'var(--color-border-default)'
        el.style.boxShadow = 'none'
        el.style.background = 'var(--color-bg-card)'
      }}
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
        flexDirection: 'column',
        gap: 'var(--space-1)',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--space-3)',
      }}>
        {effects.map((eff, i) => (
          <div
            key={i}
            style={{
              fontSize: 'var(--text-xs)',
              color: effectColor(eff),
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
            }}
          >
            <span style={{ opacity: 0.7 }}>▸</span>
            {formatEffect(eff)}
          </div>
        ))}
      </div>
    </button>
  )
}
