import { useRunStore } from '../state/runStore'

export function ResultScreen() {
  const run      = useRunStore(s => s.run)
  const resetRun = useRunStore(s => s.resetRun)

  if (!run || run.phase !== 'result') return null

  const isVictory  = run.isVictory === true
  const allyCount  = run.allies.length
  const itemCount  = run.acquiredItemIds.length

  const accentColor = isVictory ? 'var(--color-element-light)' : 'var(--color-hp-low)'

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
      {/* 결과 헤더 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-3)',
        }}>
          {isVictory ? '모험 완료' : '모험 실패'}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-hero)',
          color: accentColor,
          margin: 0,
          letterSpacing: '0.05em',
          textShadow: `0 0 40px ${accentColor}60`,
        }}>
          {isVictory ? '승리' : '패배'}
        </h1>
        <p style={{
          marginTop: 'var(--space-3)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          marginBottom: 0,
        }}>
          {isVictory
            ? '어둠의 용군주를 쓰러뜨렸습니다. 전설이 되었습니다.'
            : '모험자는 쓰러졌습니다. 다시 일어서세요.'}
        </p>
      </div>

      {/* 통계 패널 */}
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6) var(--space-8)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-6)',
        minWidth: '420px',
      }}>
        <StatBlock label="라운드" value={String(run.round)} accent={accentColor} />
        <StatBlock label="누적 피해" value={run.totalDamage.toLocaleString()} accent={accentColor} />
        <StatBlock label="동료" value={`${allyCount}명`} accent={accentColor} />
        <StatBlock label="아이템" value={`${itemCount}개`} accent={accentColor} />
        <StatBlock
          label="1라운드 평균"
          value={run.round > 0
            ? Math.round(run.totalDamage / run.round).toLocaleString()
            : '0'}
          accent={accentColor}
        />
        <StatBlock
          label="클리어 등급"
          value={clearRating(isVictory, run.totalDamage, run.round)}
          accent={accentColor}
        />
      </div>

      {/* 다시 시작 버튼 */}
      <button
        onClick={resetRun}
        style={{
          padding: 'var(--space-3) var(--space-10)',
          border: `1px solid ${accentColor}`,
          color: accentColor,
          background: `color-mix(in oklch, ${accentColor} 10%, transparent)`,
          fontSize: 'var(--text-md)',
          letterSpacing: '0.08em',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'background var(--duration-fast), box-shadow var(--duration-fast)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = `color-mix(in oklch, ${accentColor} 20%, transparent)`
          el.style.boxShadow = `0 0 24px ${accentColor}40`
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = `color-mix(in oklch, ${accentColor} 10%, transparent)`
          el.style.boxShadow = 'none'
        }}
      >
        처음으로
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatBlock
// ---------------------------------------------------------------------------

function StatBlock({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: '0.06em',
        marginBottom: 'var(--space-1)',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--weight-bold)',
        color: accent,
        fontFamily: 'var(--font-heading)',
      }}>
        {value}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// clearRating — 간단한 등급 계산
// ---------------------------------------------------------------------------

function clearRating(isVictory: boolean, totalDamage: number, round: number): string {
  if (!isVictory) {
    if (round <= 2) return 'F'
    if (round <= 4) return 'D'
    return 'C'
  }
  const avgDmg = round > 0 ? totalDamage / round : 0
  if (avgDmg >= 8000) return 'S'
  if (avgDmg >= 5000) return 'A'
  if (avgDmg >= 3000) return 'B'
  return 'C'
}
