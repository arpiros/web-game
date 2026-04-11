import type React from 'react'
import type { DraftOption, SkillDef, AllyDef, ItemDef, Rarity, Element, AllyAction } from '../game/types'
import { getSkillById } from '../game/data/skills'
import { getAllyById } from '../game/data/allies'
import { getItemById } from '../game/data/items'
import { useRunStore } from '../state/runStore'

// ---------------------------------------------------------------------------
// Token maps
// ---------------------------------------------------------------------------

const ELEMENT_COLORS: Record<Element, string> = {
  physical: 'var(--color-element-physical)',
  fire:     'var(--color-element-fire)',
  water:    'var(--color-element-water)',
  dark:     'var(--color-element-dark)',
  light:    'var(--color-element-light)',
}

const ELEMENT_LABELS: Record<Element, string> = {
  physical: '물리',
  fire:     '화염',
  water:    '물',
  dark:     '어둠',
  light:    '빛',
}

const RARITY_COLORS: Record<Rarity, string> = {
  common:    'var(--color-rarity-common)',
  rare:      'var(--color-rarity-rare)',
  epic:      'var(--color-rarity-epic)',
  legendary: 'var(--color-rarity-legendary)',
}

const RARITY_LABELS: Record<Rarity, string> = {
  common:    '일반',
  rare:      '희귀',
  epic:      '영웅',
  legendary: '전설',
}

// ---------------------------------------------------------------------------
// DraftScreen
// ---------------------------------------------------------------------------

export function DraftScreen() {
  const run                = useRunStore(s => s.run)
  const selectDraft        = useRunStore(s => s.selectDraft)
  const advanceToNextBattle = useRunStore(s => s.advanceToNextBattle)

  if (!run || run.phase !== 'draft') return null

  function handleSelect(index: number) {
    selectDraft(index)
    advanceToNextBattle()
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)',
      gap: 'var(--space-8)',
    }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-2)',
        }}>
          라운드 {run.round} 클리어
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-accent)',
          margin: 0,
        }}>
          보상을 선택하세요
        </h2>
        <p style={{
          marginTop: 'var(--space-2)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
          marginBottom: 0,
        }}>
          누적 피해: {run.totalDamage.toLocaleString()}
        </p>
      </div>

      {/* 카드 3장 */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-6)',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {run.draftOptions.map((opt, i) => (
          <DraftCard
            key={i}
            option={opt}
            index={i}
            onSelect={handleSelect}
            ownedSkillIds={run.character.skillIds}
            ownedItemIds={run.acquiredItemIds}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DraftCard (dispatcher)
// ---------------------------------------------------------------------------

interface DraftCardProps {
  option: DraftOption
  index: number
  onSelect: (index: number) => void
  ownedSkillIds: readonly string[]
  ownedItemIds: readonly string[]
}

function DraftCard({ option, index, onSelect, ownedSkillIds, ownedItemIds }: DraftCardProps) {
  if (option.type === 'skill') {
    const skill = getSkillById(option.skillId)
    if (!skill) return null
    const isOwned = ownedSkillIds.includes(option.skillId)
    return <SkillCard skill={skill} onSelect={() => onSelect(index)} isOwned={isOwned} />
  }
  if (option.type === 'ally') {
    const ally = getAllyById(option.allyId)
    if (!ally) return null
    return <AllyCard ally={ally} onSelect={() => onSelect(index)} />
  }
  const item = getItemById(option.itemId)
  if (!item) return null
  const isOwned = ownedItemIds.includes(option.itemId)
  return <ItemCard item={item} onSelect={() => onSelect(index)} isOwned={isOwned} />
}

// ---------------------------------------------------------------------------
// Shared card wrapper
// ---------------------------------------------------------------------------

interface CardWrapperProps {
  rarity: Rarity
  element?: Element
  typeLabel: string
  onSelect: () => void
  children: React.ReactNode
}

function CardWrapper({ rarity, element, typeLabel, onSelect, children }: CardWrapperProps) {
  const rarityColor  = RARITY_COLORS[rarity]
  const accentColor  = element ? ELEMENT_COLORS[element] : rarityColor

  return (
    <button
      onClick={onSelect}
      style={{
        width: '220px',
        minHeight: '260px',
        background: 'var(--color-bg-surface)',
        border: `1px solid var(--color-border-subtle)`,
        borderTop: `3px solid ${rarityColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        transition: 'border-color var(--duration-fast), transform var(--duration-fast), box-shadow var(--duration-fast)',
        position: 'relative',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = rarityColor
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = `0 12px 32px ${accentColor}28`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = 'var(--color-border-subtle)'
        el.style.transform = 'none'
        el.style.boxShadow = 'none'
      }}
    >
      {/* 타입 레이블 */}
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {typeLabel}
      </div>

      {children}

      {/* 등급 뱃지 */}
      <span style={{
        marginTop: 'auto',
        alignSelf: 'flex-start',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)',
        padding: '2px var(--space-2)',
        borderRadius: 'var(--radius-sm)',
        background: `color-mix(in oklch, ${rarityColor} 18%, transparent)`,
        color: rarityColor,
        border: `1px solid color-mix(in oklch, ${rarityColor} 35%, transparent)`,
        letterSpacing: '0.04em',
      }}>
        {RARITY_LABELS[rarity]}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// SkillCard
// ---------------------------------------------------------------------------

const OWNED_BADGE: React.CSSProperties = {
  position: 'absolute',
  top: 'var(--space-2)',
  right: 'var(--space-2)',
  fontSize: 'var(--text-xs)',
  padding: '2px 6px',
  background: 'color-mix(in oklch, var(--color-text-muted) 20%, transparent)',
  color: 'var(--color-text-muted)',
  borderRadius: 'var(--radius-sm)',
  pointerEvents: 'none',
}

function SkillCard({ skill, onSelect, isOwned }: { skill: SkillDef; onSelect: () => void; isOwned?: boolean }) {
  const elColor = ELEMENT_COLORS[skill.element]
  const elLabel = ELEMENT_LABELS[skill.element]

  return (
    <CardWrapper rarity={skill.rarity} element={skill.element} typeLabel="스킬" onSelect={onSelect}>
      {isOwned && <span style={OWNED_BADGE}>보유중</span>}
      {/* 속성 + 이름 */}
      <div>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: elColor,
          marginBottom: 'var(--space-1)',
          display: 'block',
        }}>
          {elLabel}
        </span>
        <div style={{
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-text-primary)',
          lineHeight: 1.2,
        }}>
          {skill.name}
        </div>
      </div>

      {/* 설명 */}
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
        margin: 0,
        flex: 1,
      }}>
        {skill.description}
      </p>

      {/* MP / 쿨다운 */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-3)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--space-2)',
      }}>
        <span>MP <strong style={{ color: 'var(--color-mp)' }}>{skill.mpCost}</strong></span>
        {skill.cooldown > 0 && (
          <span>쿨다운 <strong style={{ color: 'var(--color-text-secondary)' }}>{skill.cooldown}턴</strong></span>
        )}
      </div>
    </CardWrapper>
  )
}

// ---------------------------------------------------------------------------
// AllyCard
// ---------------------------------------------------------------------------

function allyActionLabel(action: AllyAction): string {
  switch (action.type) {
    case 'attack':       return `공격력의 ${Math.round(action.multiplier * 100)}% 피해`
    case 'heal_party':   return `전체 치유 ${Math.round(action.multiplier * 100)}%`
    case 'apply_status': return `${action.status} 부여 ${action.duration}턴`
    case 'shield_party': return `방막 ${action.amount}`
  }
}

function AllyCard({ ally, onSelect }: { ally: AllyDef; onSelect: () => void }) {
  const elColor = ELEMENT_COLORS[ally.element]
  const elLabel = ELEMENT_LABELS[ally.element]

  return (
    <CardWrapper rarity={ally.rarity} element={ally.element} typeLabel="동료" onSelect={onSelect}>
      {/* 속성 + 이름 */}
      <div>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: elColor,
          marginBottom: 'var(--space-1)',
          display: 'block',
        }}>
          {elLabel}
        </span>
        <div style={{
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-text-primary)',
          lineHeight: 1.2,
        }}>
          {ally.name}
        </div>
      </div>

      {/* 설명 */}
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
        margin: 0,
        flex: 1,
      }}>
        {ally.description}
      </p>

      {/* 스탯 미니 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2px var(--space-2)',
        fontSize: 'var(--text-xs)',
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 'var(--space-2)',
      }}>
        <MiniStat label="HP"  value={ally.baseStats.maxHp} />
        <MiniStat label="공격" value={ally.baseStats.attack} />
        <div style={{
          gridColumn: '1 / -1',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--space-1)',
          marginTop: '2px',
        }}>
          <span style={{ color: 'var(--color-text-muted)' }}>행동</span>
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>
            {allyActionLabel(ally.action)}
          </span>
        </div>
      </div>
    </CardWrapper>
  )
}

// ---------------------------------------------------------------------------
// ItemCard
// ---------------------------------------------------------------------------

function ItemCard({ item, onSelect, isOwned }: { item: ItemDef; onSelect: () => void; isOwned?: boolean }) {
  return (
    <CardWrapper rarity={item.rarity} typeLabel="아이템" onSelect={onSelect}>
      {isOwned && <span style={OWNED_BADGE}>보유중</span>}
      {/* 이름 */}
      <div style={{
        fontSize: 'var(--text-md)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--color-text-primary)',
        lineHeight: 1.2,
      }}>
        {item.name}
      </div>

      {/* 설명 */}
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--leading-relaxed)',
        margin: 0,
        flex: 1,
      }}>
        {item.description}
      </p>
    </CardWrapper>
  )
}

// ---------------------------------------------------------------------------
// MiniStat
// ---------------------------------------------------------------------------

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-1)' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>
        {value.toLocaleString()}
      </span>
    </div>
  )
}
