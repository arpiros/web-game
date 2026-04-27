import type { CSSProperties } from 'react'
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

const CHARACTER_SIGILS: Record<string, string> = {
  dark_knight: 'blade',
  fire_mage: 'flame',
  holy_paladin: 'shield',
  tide_dancer: 'wave',
  berserker: 'axe',
}

const ENEMY_SIGILS: Record<string, string> = {
  goblin: 'dagger',
  orc_warrior: 'axe',
  fire_imp: 'flame',
  shadow_wolf: 'fang',
  ice_golem: 'crystal',
  cursed_knight: 'blade',
  demon_mage: 'flame',
  elder_troll: 'claw',
  lich: 'skull',
  dragon_lord: 'dragon',
  skeleton_archer: 'arrow',
  flame_phoenix: 'wing',
  dark_vampire: 'fang',
  frost_giant: 'crystal',
  poison_hydra: 'hydra',
  void_lord: 'void',
  warlord: 'axe',
  plague_witch: 'skull',
}

const ITEM_SIGILS: Record<string, string> = {
  iron_ring: 'ring',
  vampire_ring: 'ring',
  bloodstone_ring: 'ring',
  mana_crystal: 'crystal',
  vitality_gem: 'crystal',
  shadow_gem: 'crystal',
  frost_gem: 'crystal',
  elemental_core: 'crystal',
  void_crystal: 'crystal',
  tough_armor: 'armor',
  immortal_armor: 'armor',
  swift_boots: 'boots',
  whetstone: 'stone',
  executioner_axe: 'axe',
  flame_shard: 'flame',
  holy_symbol: 'crest',
  tide_pendant: 'drop',
  cooldown_watch: 'watch',
  time_sand: 'watch',
  berserker_heart: 'heart',
  titan_heart: 'heart',
  arcane_tome: 'book',
  archmage_tome: 'book',
  grand_tome: 'book',
  ancient_scroll: 'scroll',
  dragonscale: 'scale',
  death_mask: 'mask',
  cursed_necklace: 'chain',
  revival_potion: 'vial',
  magic_antidote: 'vial',
  heroes_crest: 'crest',
  twin_wings: 'wing',
  dragon_blade: 'blade',
  night_blade: 'blade',
  pyroclast_orb: 'orb',
  sacred_lance: 'lance',
  glacial_crown: 'crown',
  speed_talisman: 'crest',
  champion_belt: 'belt',
  stun_ward: 'ward',
  warrior_seal: 'seal',
  ancient_seal: 'seal',
}

const SKILL_BY_ELEMENT: Record<Element, string> = {
  physical: 'blade',
  fire: 'flame',
  water: 'wave',
  dark: 'void',
  light: 'crest',
}

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
  const sigil = getSigil(kind, id, element)
  const title = label ?? id

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
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <defs>
          <radialGradient id={`glow-${kind}-${id}`} cx="50%" cy="34%" r="70%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
            <stop offset="62%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path className="game-icon__halo" d="M32 3 58 18v28L32 61 6 46V18z" />
        <path className="game-icon__glass" d="M32 7 54 20v24L32 57 10 44V20z" />
        <circle className="game-icon__glow" cx="32" cy="32" r="25" fill={`url(#glow-${kind}-${id})`} />
        <path className="game-icon__frame" d="M32 8 53 20v24L32 56 11 44V20z" />
        {kind === 'character' || kind === 'ally' ? <FigureSigil sigil={sigil} /> : <ObjectSigil sigil={sigil} />}
        <path className="game-icon__shine" d="M18 18c7-5 18-7 28-1" />
      </svg>
    </span>
  )
}

function getSigil(kind: VisualKind, id: string, element: Element): string {
  if (kind === 'character') return CHARACTER_SIGILS[id] ?? SKILL_BY_ELEMENT[element]
  if (kind === 'enemy') return ENEMY_SIGILS[id] ?? SKILL_BY_ELEMENT[element]
  if (kind === 'item') return ITEM_SIGILS[id] ?? 'crest'
  if (kind === 'skill') return SKILL_BY_ELEMENT[element]
  return ENEMY_SIGILS[id] ?? CHARACTER_SIGILS[id] ?? SKILL_BY_ELEMENT[element]
}

function FigureSigil({ sigil }: { sigil: string }) {
  return (
    <g className="game-icon__mark">
      <path d="M20 48c2-9 7-14 12-14s10 5 12 14" />
      <path d="M24 27c1-7 4-11 8-11s7 4 8 11c-1 5-4 9-8 9s-7-4-8-9z" />
      {sigil === 'shield' && <path d="M32 13 43 18v9c0 8-5 14-11 18-6-4-11-10-11-18v-9z" />}
      {sigil === 'flame' && <path d="M32 12c7 7 10 13 6 21-2 4-5 7-6 12-5-4-9-8-8-15 1-6 7-9 8-18z" />}
      {sigil === 'wave' && <path d="M18 39c8 4 16-7 28-1M20 45c7 3 15-5 24-1" />}
      {sigil === 'axe' && <path d="m26 18 17 28M36 16c8 0 11 5 10 11-6 0-10-2-13-7" />}
      {sigil === 'blade' && <path d="M35 13 29 38l-8 10 11-6 10-25z" />}
    </g>
  )
}

function ObjectSigil({ sigil }: { sigil: string }) {
  return (
    <g className="game-icon__mark">
      {sigil === 'ring' && <><circle cx="32" cy="35" r="13" /><path d="m26 20 6-6 6 6-6 6z" /></>}
      {sigil === 'crystal' && <path d="m32 11 13 17-13 25-13-25zM19 28h26M32 11v42" />}
      {sigil === 'armor' && <path d="M20 17h24l-4 32H24zM24 17l8 9 8-9" />}
      {sigil === 'boots' && <path d="M23 18h10l-2 21 13 4v6H21z" />}
      {sigil === 'stone' && <path d="m18 42 14-24 14 9-10 19z" />}
      {sigil === 'axe' && <path d="m25 16 18 32M35 15c8 0 12 5 11 12-7 0-11-2-14-7" />}
      {sigil === 'flame' && <path d="M33 11c10 11 11 20 5 30-2 4-5 7-6 12-8-5-12-12-10-21 2-7 9-11 11-21z" />}
      {sigil === 'crest' && <path d="M32 11 46 18v12c0 9-6 16-14 22-8-6-14-13-14-22V18zM24 31h16M32 23v18" />}
      {sigil === 'drop' && <path d="M32 12c8 10 13 17 13 25a13 13 0 0 1-26 0c0-8 5-15 13-25z" />}
      {sigil === 'watch' && <><circle cx="32" cy="34" r="15" /><path d="M27 12h10M32 34l7-8M32 34l-5 5" /></>}
      {sigil === 'heart' && <path d="M32 51C15 39 17 20 27 18c3-1 5 1 5 4 0-3 3-5 6-4 10 2 12 21-6 33z" />}
      {sigil === 'book' && <path d="M17 16h20c6 0 10 4 10 10v22H27c-6 0-10-4-10-10zM27 16v32M32 24h9M32 31h9" />}
      {sigil === 'scroll' && <path d="M22 15h25c-4 2-4 8 0 10H22c-4 0-7-2-7-5s3-5 7-5zM17 25v22h25M23 33h14M23 40h10" />}
      {sigil === 'scale' && <path d="M32 12c9 9 13 18 10 29-6 1-14 4-20 9-1-15 1-27 10-38z" />}
      {sigil === 'mask' && <path d="M19 17c8-4 18-4 26 0v18c0 9-6 15-13 18-7-3-13-9-13-18zM24 31h7M33 31h7" />}
      {sigil === 'chain' && <path d="M24 25c-5-1-8 1-9 5s2 8 7 9l5 1M40 25c5-1 8 1 9 5s-2 8-7 9l-5 1M25 32h14" />}
      {sigil === 'vial' && <path d="M27 13h10M29 13v13L20 44c-2 4 1 8 5 8h14c4 0 7-4 5-8l-9-18V13" />}
      {sigil === 'wing' && <path d="M32 44c10-2 17-10 18-24-8 1-15 5-21 15M32 44c-10-2-17-10-18-24 8 1 15 5 21 15" />}
      {sigil === 'blade' && <path d="M39 10 29 39l-10 12 13-8 16-27z" />}
      {sigil === 'orb' && <><circle cx="32" cy="32" r="16" /><path d="M22 37c9 5 19-3 20-13" /></>}
      {sigil === 'lance' && <path d="m39 10-5 24-14 17 7-21zM25 35l12 8" />}
      {sigil === 'crown' && <path d="M17 42h30M20 39l4-20 8 12 8-12 4 20z" />}
      {sigil === 'belt' && <path d="M16 26h32v12H16zM28 25h8v14h-8z" />}
      {sigil === 'ward' && <path d="M32 12 47 28 32 52 17 28zM24 28h16M32 20v24" />}
      {sigil === 'seal' && <><circle cx="32" cy="32" r="17" /><path d="m22 32 7 7 14-16" /></>}
      {sigil === 'dagger' && <path d="M40 13 30 39l-9 9 5-12zM21 43l8 8" />}
      {sigil === 'fang' && <path d="M23 14c9 10 10 23 3 38M41 14c-9 10-10 23-3 38" />}
      {sigil === 'claw' && <path d="M22 14c5 12 5 23-1 34M32 12c4 13 4 24 0 39M42 14c-5 12-5 23 1 34" />}
      {sigil === 'skull' && <path d="M21 29c0-9 5-15 11-15s11 6 11 15c0 7-3 11-7 13v8h-8v-8c-4-2-7-6-7-13zM26 31h4M34 31h4M30 40h4" />}
      {sigil === 'dragon' && <path d="M18 44c5-16 11-25 22-29l7 5-6 3c6 3 8 9 6 18-7-7-15-8-29 3zM30 25l-8-9" />}
      {sigil === 'arrow' && <path d="M16 44 48 16M39 16h9v9M20 18c8 8 8 20 0 28" />}
      {sigil === 'hydra' && <path d="M22 48c0-13 5-20 10-20s10 7 10 20M20 25c-2-7 1-12 7-14M44 25c2-7-1-12-7-14M32 28c-2-8 0-13 0-18" />}
      {sigil === 'void' && <><circle cx="32" cy="32" r="16" /><path d="M16 32h32M32 16v32M21 21l22 22M43 21 21 43" /></>}
      {sigil === 'wave' && <path d="M16 39c10 5 20-9 32-2M18 47c9 4 18-5 29-1" />}
    </g>
  )
}
