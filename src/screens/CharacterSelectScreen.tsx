import type { CSSProperties } from 'react'
import type { CharacterDef } from '../game/types'
import { CHARACTERS } from '../game/data/characters'
import { getSkillById } from '../game/data/skills'
import { useRunStore } from '../state/runStore'

const ELEMENT_COLORS: Record<string, string> = {
  physical: 'var(--color-element-physical)',
  fire: 'var(--color-element-fire)',
  water: 'var(--color-element-water)',
  dark: 'var(--color-element-dark)',
  light: 'var(--color-element-light)',
}

const ELEMENT_LABELS: Record<string, string> = {
  physical: '물리',
  fire: '화염',
  water: '물',
  dark: '어둠',
  light: '빛',
}

interface Props {
  onBack: () => void
}

export function CharacterSelectScreen({ onBack }: Props) {
  const startRun = useRunStore(s => s.startRun)

  return (
    <div className="screen-shell character-select-shell" style={{ overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <button
          onClick={onBack}
          className="ui-button"
          style={{
            '--button-accent': 'var(--color-text-muted)',
            minHeight: '2.25rem',
            paddingInline: 'var(--space-3)',
            background: 'transparent',
          } as CSSProperties}
        >
          ← 뒤로
        </button>
        <div className="screen-header" style={{ marginBottom: 0 }}>
          <div className="screen-eyebrow">Choose your vessel</div>
          <h2 className="screen-title">캐릭터 선택</h2>
        </div>
      </div>
      <p className="screen-copy" style={{ marginBottom: 'var(--space-6)' }}>
        함께할 캐릭터를 선택하세요. 각 캐릭터는 고유한 능력과 스타일을 지닙니다.
      </p>
      <div className="character-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: 'var(--space-6)',
        alignItems: 'stretch',
      }}>
        {CHARACTERS.map(char => (
          <CharacterCard key={char.id} character={char} onSelect={() => startRun(char.id)} />
        ))}
      </div>
    </div>
  )
}

function CharacterCard({ character, onSelect }: { character: CharacterDef; onSelect: () => void }) {
  const elColor = ELEMENT_COLORS[character.element] ?? 'var(--color-accent)'
  const elLabel = ELEMENT_LABELS[character.element] ?? character.element
  const innateSkill = getSkillById(character.innateSkillId)
  const openingSkills = character.startingSkillIds
    .map(id => getSkillById(id)?.name ?? id)
    .slice(0, 3)

  return (
    <button
      onClick={onSelect}
      className="ui-card character-card"
      style={{
        '--card-accent': elColor,
        minHeight: '100%',
        padding: 'var(--space-5)',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        position: 'relative',
      } as CSSProperties}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
      }}>
        <span className="ui-chip" style={{ '--chip-accent': elColor } as CSSProperties}>
          {elLabel}
        </span>
        <span style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.08em',
        }}>
          {character.element.toUpperCase()}
        </span>
      </div>

      <div>
        <div style={{
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-1)',
        }}>
          {character.name}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: elColor, opacity: 0.8 }}>
          {character.title}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <StatItem label="HP" value={character.baseStats.maxHp} max={1400} accent="var(--color-hp-high)" />
        <StatItem label="공격" value={character.baseStats.attack} max={230} accent="var(--color-hp-low)" />
        <StatItem label="방어" value={character.baseStats.defense} max={110} accent="var(--color-effect-neutral)" />
        <StatItem label="속도" value={character.baseStats.speed} max={100} accent="var(--color-element-water)" compactHidden />
        <StatItem label="MP" value={character.baseStats.maxMp} max={140} accent="var(--color-mp)" compactHidden />
      </div>

      <p className="character-lore" style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
        lineHeight: 'var(--leading-relaxed)',
        margin: 0,
        flex: 1,
      }}>
        {character.lore}
      </p>

      <div style={{
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--space-3)',
        display: 'grid',
        gap: 'var(--space-2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>고유기</span>
          <span style={{ color: elColor, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textAlign: 'right' }}>
            {innateSkill?.name ?? character.innateSkillId}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
          {openingSkills.map(name => (
            <span key={name} className="ui-chip" style={{ '--chip-accent': 'var(--color-text-muted)' } as CSSProperties}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

function StatItem({
  label,
  value,
  max,
  accent,
  compactHidden,
}: {
  label: string
  value: number
  max: number
  accent: string
  compactHidden?: boolean
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))

  return (
    <div className="character-stat" data-compact-hidden={compactHidden ? 'true' : undefined} style={{ display: 'grid', gap: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', fontFamily: 'var(--font-mono)' }}>
          {value.toLocaleString()}
        </span>
      </div>
      <div className="ui-progress" aria-hidden="true">
        <div className="ui-progress__fill" style={{ '--progress-value': `${pct}%`, '--progress-accent': accent } as CSSProperties} />
      </div>
    </div>
  )
}
