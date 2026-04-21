import type { CharacterDef } from '../game/types'
import { CHARACTERS } from '../game/data/characters'
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 'var(--space-8)', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <button
          onClick={onBack}
          style={{
            color: 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--text-base)',
            padding: 0,
          }}
        >
          ← 뒤로
        </button>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-accent)',
          margin: 0,
        }}>
          캐릭터 선택
        </h2>
      </div>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', marginTop: 0 }}>
        함께할 캐릭터를 선택하세요. 각 캐릭터는 고유한 능력과 스타일을 지닙니다.
      </p>
      <div style={{
        display: 'flex',
        gap: 'var(--space-6)',
        flexWrap: 'wrap',
        justifyContent: 'center',
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

  return (
    <button
      onClick={onSelect}
      style={{
        width: '210px',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        transition: 'border-color var(--duration-fast), transform var(--duration-fast)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = elColor
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = `0 8px 24px ${elColor}30`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = 'var(--color-border-subtle)'
        el.style.transform = 'none'
        el.style.boxShadow = 'none'
      }}
    >
      {/* 속성 뱃지 */}
      <span style={{
        alignSelf: 'flex-start',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)',
        padding: '2px var(--space-2)',
        borderRadius: 'var(--radius-sm)',
        background: `color-mix(in oklch, ${elColor} 20%, transparent)`,
        color: elColor,
        border: `1px solid color-mix(in oklch, ${elColor} 40%, transparent)`,
        letterSpacing: '0.05em',
      }}>
        {elLabel}
      </span>

      {/* 이름 + 부제 */}
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

      {/* 스탯 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2px var(--space-3)',
        fontSize: 'var(--text-xs)',
        padding: 'var(--space-2) 0',
        borderTop: '1px solid var(--color-border-subtle)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <StatItem label="HP" value={character.baseStats.maxHp} />
        <StatItem label="공격" value={character.baseStats.attack} />
        <StatItem label="방어" value={character.baseStats.defense} />
        <StatItem label="속도" value={character.baseStats.speed} />
        <StatItem label="MP" value={character.baseStats.maxMp} />
      </div>

      {/* 로어 */}
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        lineHeight: 'var(--leading-relaxed)',
        margin: 0,
      }}>
        {character.lore}
      </p>
    </button>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-1)' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>
        {value.toLocaleString()}
      </span>
    </div>
  )
}
