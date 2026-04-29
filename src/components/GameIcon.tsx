import type { CSSProperties, SyntheticEvent } from 'react'
import type { Element, Rarity } from '../game/types'

type VisualKind = 'character' | 'enemy' | 'ally' | 'item' | 'skill'
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'portrait'

const ELEMENT_COLORS: Record<Element, string> = {
  physical: 'var(--color-element-physical)',
  fire: 'var(--color-element-fire)',
  water: 'var(--color-element-water)',
  dark: 'var(--color-element-dark)',
  light: 'var(--color-element-light)',
}

const RARITY_COLORS: Record<Rarity, string> = {
  common: 'var(--color-rarity-common)',
  rare: 'var(--color-rarity-rare)',
  epic: 'var(--color-rarity-epic)',
  legendary: 'var(--color-rarity-legendary)',
}

const SIZE_CLASS: Record<IconSize, string> = {
  xs: 'game-icon--xs',
  sm: 'game-icon--sm',
  md: 'game-icon--md',
  lg: 'game-icon--lg',
  portrait: 'game-icon--portrait',
}

const ICON_BASE = `${import.meta.env.BASE_URL}icons/subculture/`

interface GameIconProps {
  id: string
  kind: VisualKind
  element?: Element
  rarity?: Rarity
  size?: IconSize
  label?: string
  className?: string
  style?: CSSProperties
}

export function GameIcon({
  id,
  kind,
  element = 'physical',
  rarity,
  size = 'md',
  label,
  className,
  style,
}: GameIconProps) {
  const accent = element ? ELEMENT_COLORS[element] : rarity ? RARITY_COLORS[rarity] : 'var(--color-accent)'
  const rarityColor = rarity ? RARITY_COLORS[rarity] : accent
  const title = label ?? id
  const src = `${ICON_BASE}${kind}-${id}.png`
  const fallbackSrc = `${ICON_BASE}fallback-${element}.png`

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget
    if (img.dataset.fallbackApplied === 'true') return
    img.dataset.fallbackApplied = 'true'
    img.src = fallbackSrc
  }

  return (
    <span
      className={`game-icon ${SIZE_CLASS[size]} game-icon--${kind}${className ? ` ${className}` : ''}`}
      style={{
        '--game-icon-accent': accent,
        '--game-icon-rarity': rarityColor,
        ...style,
      } as CSSProperties}
      aria-label={title}
      role="img"
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        onError={handleError}
      />
    </span>
  )
}
