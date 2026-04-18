/* ==========================================================================
   Ornament.tsx — 재사용 가능한 장식 컴포넌트
   BattleScreen.tsx에서 import해서 필요한 곳에 drop-in.
   ========================================================================== */

import type { CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// FiligreeCorner — SVG 장식 코너 (4곳에 rotation 0/90/-90/180 으로 배치)
// ---------------------------------------------------------------------------

interface FiligreeCornerProps {
  size?: number
  color?: string
  rotation?: 0 | 90 | -90 | 180
  opacity?: number
  style?: CSSProperties
}

export function FiligreeCorner({
  size = 24,
  color = 'var(--color-gold-dim)',
  rotation = 0,
  opacity = 0.8,
  style,
}: FiligreeCornerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      style={{
        transform: `rotate(${rotation}deg)`,
        opacity,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <g fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round">
        <path d="M2 2 L2 28 M2 2 L28 2" />
        <path d="M2 14 Q 10 14 10 22 Q 10 28 4 28" />
        <path d="M14 2 Q 14 10 22 10 Q 28 10 28 4" />
        <circle cx="14" cy="14" r="2.2" fill={color} />
        <path d="M18 18 Q 24 20 28 26" />
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// OrnateFrame — 4 코너에 FiligreeCorner를 자동 배치하는 래퍼
// ---------------------------------------------------------------------------

interface OrnateFrameProps {
  children: React.ReactNode
  cornerSize?: number
  cornerColor?: string
  style?: CSSProperties
  className?: string
}

export function OrnateFrame({
  children,
  cornerSize = 24,
  cornerColor = 'var(--color-gold-dim)',
  style,
  className,
}: OrnateFrameProps) {
  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      <div style={{ position: 'absolute', top: 4, left: 4, zIndex: 2 }}>
        <FiligreeCorner size={cornerSize} color={cornerColor} rotation={0} />
      </div>
      <div style={{ position: 'absolute', top: 4, right: 4, zIndex: 2 }}>
        <FiligreeCorner size={cornerSize} color={cornerColor} rotation={90} />
      </div>
      <div style={{ position: 'absolute', bottom: 4, left: 4, zIndex: 2 }}>
        <FiligreeCorner size={cornerSize} color={cornerColor} rotation={-90} />
      </div>
      <div style={{ position: 'absolute', bottom: 4, right: 4, zIndex: 2 }}>
        <FiligreeCorner size={cornerSize} color={cornerColor} rotation={180} />
      </div>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Banner — 양쪽 꼬리가 있는 고딕 배너
// ---------------------------------------------------------------------------

interface BannerProps {
  children: React.ReactNode
  variant?: 'default' | 'boss' | 'minion'
  subtitle?: string
  style?: CSSProperties
}

export function Banner({ children, variant = 'default', subtitle, style }: BannerProps) {
  const isBoss = variant === 'boss'
  const bg = isBoss
    ? 'linear-gradient(180deg, var(--color-blood-deep), var(--color-ink))'
    : 'var(--color-ash-dark)'
  const border = isBoss ? 'var(--color-gold)' : 'var(--color-text-muted)'

  return (
    <div
      style={{
        position: 'relative',
        padding: '6px 24px',
        background: bg,
        borderTop: `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
        textAlign: 'center',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute', top: 0, bottom: 0, left: -8, width: 14,
          background: isBoss ? 'var(--color-blood-deep)' : 'var(--color-ash-dark)',
          clipPath: 'polygon(100% 0, 100% 100%, 0 50%)',
          borderLeft: `1px solid ${border}`,
        }}
      />
      <div
        style={{
          position: 'absolute', top: 0, bottom: 0, right: -8, width: 14,
          background: isBoss ? 'var(--color-blood-deep)' : 'var(--color-ash-dark)',
          clipPath: 'polygon(0 0, 0 100%, 100% 50%)',
          borderRight: `1px solid ${border}`,
        }}
      />
      {subtitle && (
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.62rem',
            letterSpacing: '0.4em',
            color: isBoss ? 'var(--color-gold)' : 'var(--color-text-muted)',
            textTransform: 'uppercase',
          }}
        >
          {subtitle}
        </div>
      )}
      <div
        style={{
          fontFamily: 'var(--font-korean)',
          fontSize: isBoss ? '1.2rem' : '0.95rem',
          fontWeight: 700,
          color: isBoss ? 'var(--color-paper)' : 'var(--color-bone)',
          lineHeight: 1.1,
          textShadow: isBoss ? '0 0 12px var(--color-blood)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RoundBeads — 로마 숫자 라운드 트래커
// ---------------------------------------------------------------------------

export function RoundBeads({ current, total = 7 }: { current: number; total?: number }) {
  const romans = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '0.62rem',
          letterSpacing: '0.3em',
          color: 'var(--color-text-muted)',
          marginRight: 4,
        }}
      >
        CANTO
      </span>
      {Array.from({ length: total }).map((_, i) => {
        const r = i + 1
        const isCurrent = r === current
        const isPast = r < current
        const isBoss = r === total
        const cls = isCurrent ? 'round-bead round-bead--current'
                  : isPast    ? 'round-bead round-bead--past'
                              : 'round-bead'
        return (
          <div
            key={r}
            className={cls}
            style={{
              borderColor: isBoss && !isCurrent && !isPast
                ? 'var(--color-gold)'
                : undefined,
              color: isBoss && !isCurrent && !isPast
                ? 'var(--color-gold)'
                : undefined,
            }}
          >
            {isBoss ? '†' : romans[i]}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TargetReticle — 타겟팅 레티클 (절대 배치)
// ---------------------------------------------------------------------------

export function TargetReticle() {
  return <div className="target-reticle" aria-hidden />
}
