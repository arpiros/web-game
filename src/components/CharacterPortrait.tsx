import type { CSSProperties } from 'react'
import type { Element } from '../game/types'

const PORTRAIT_INDEX: Record<string, number> = {
  dark_knight: 0,
  fire_mage: 1,
  holy_paladin: 2,
  tide_dancer: 3,
  berserker: 4,
}

const ELEMENT_COLORS: Record<Element, string> = {
  physical: 'var(--color-element-physical)',
  fire: 'var(--color-element-fire)',
  water: 'var(--color-element-water)',
  dark: 'var(--color-element-dark)',
  light: 'var(--color-element-light)',
}

interface CharacterPortraitProps {
  id: string
  element: Element
  label: string
  size?: 'card' | 'panel'
  className?: string
  style?: CSSProperties
}

export function CharacterPortrait({
  id,
  element,
  label,
  size = 'card',
  className,
  style,
}: CharacterPortraitProps) {
  const index = PORTRAIT_INDEX[id] ?? 0
  const x = index === 0 ? '0%' : `${index * 25}%`

  return (
    <span
      className={`character-portrait character-portrait--${size}${className ? ` ${className}` : ''}`}
      style={{
        '--portrait-accent': ELEMENT_COLORS[element],
        '--portrait-position-x': x,
        ...style,
      } as CSSProperties}
      role="img"
      aria-label={label}
    />
  )
}
