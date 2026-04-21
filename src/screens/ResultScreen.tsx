import { useRunStore } from '../state/runStore'
import { getSkillById } from '../game/data/skills'
import { getItemById } from '../game/data/items'
import { MAX_ROUNDS } from '../game/run'

export function ResultScreen() {
  const run      = useRunStore(s => s.run)
  const resetRun = useRunStore(s => s.resetRun)

  if (!run || run.phase !== 'result') return null

  const isVictory  = run.isVictory === true
  const allyCount  = run.allies.length
  const itemCount  = run.acquiredItemIds.length

  const accentColor = isVictory ? 'var(--color-element-light)' : 'var(--color-hp-low)'

  // 스킬 TOP 3
  const top3Skills = Object.entries(run.skillUseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ name: getSkillById(id)?.name ?? id, count }))

  // 획득 아이템 목록
  const acquiredItems = run.acquiredItemIds
    .map(id => getItemById(id)?.name ?? id)

  // 보유 스킬 전체
  const allSkills = run.character.skillIds
    .map(id => getSkillById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getSkillById>>[]

  // 동료 목록
  const acquiredAllies = run.allies.map(a => a.name)

  // 클리어 라운드 텍스트
  const roundText = isVictory
    ? `${MAX_ROUNDS} / ${MAX_ROUNDS} 완주`
    : `${run.round - 1} / ${MAX_ROUNDS} 클리어`

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)',
      gap: 'var(--space-6)',
      overflowY: 'auto',
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

      {/* 기본 통계 패널 */}
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6) var(--space-8)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-6)',
        minWidth: '420px',
        width: '100%',
        maxWidth: '600px',
      }}>
        <StatBlock label="라운드" value={roundText} accent={accentColor} />
        <StatBlock label="누적 피해" value={run.totalDamage.toLocaleString()} accent={accentColor} />
        <StatBlock label="클리어 등급" value={clearRating(isVictory, run.totalDamage, run.round)} accent={accentColor} />
        <StatBlock label="최고 단타" value={run.maxSingleDamage.toLocaleString()} accent={accentColor} />
        <StatBlock label="크리티컬" value={`${run.critCount}회`} accent={accentColor} />
        <StatBlock label="미스" value={`${run.missCount}회`} accent={accentColor} />
        <StatBlock label="총 회복량" value={run.totalHealing.toLocaleString()} accent={accentColor} />
        <StatBlock label="총 턴 수" value={`${run.totalTurns}턴`} accent={accentColor} />
        <StatBlock label="동료 / 아이템" value={`${allyCount}명 / ${itemCount}개`} accent={accentColor} />
      </div>

      {/* 스킬 사용 TOP 3 */}
      {top3Skills.length > 0 && (
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-6)',
          width: '100%',
          maxWidth: '600px',
        }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-3)',
          }}>
            스킬 사용 TOP {top3Skills.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {top3Skills.map((s, i) => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: accentColor,
                    fontFamily: 'var(--font-heading)',
                    minWidth: '16px',
                  }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                    {s.name}
                  </span>
                </div>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-heading)',
                }}>
                  {s.count}회
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 획득 아이템 */}
      {acquiredItems.length > 0 && (
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-6)',
          width: '100%',
          maxWidth: '600px',
        }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-3)',
          }}>
            획득한 아이템
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {acquiredItems.map((name, i) => (
              <span key={i} style={{
                fontSize: 'var(--text-xs)',
                padding: '2px 8px',
                background: 'color-mix(in oklch, var(--color-text-muted) 12%, transparent)',
                color: 'var(--color-text-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 보유 스킬 */}
      {allSkills.length > 0 && (
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-6)',
          width: '100%',
          maxWidth: '600px',
        }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-3)',
          }}>
            보유 스킬 ({allSkills.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {allSkills.map(skill => (
              <span key={skill.id} style={{
                fontSize: 'var(--text-xs)',
                padding: '2px 8px',
                background: 'color-mix(in oklch, var(--color-accent) 10%, transparent)',
                color: 'var(--color-accent)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid color-mix(in oklch, var(--color-accent) 30%, transparent)',
              }}>
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 동료 목록 */}
      {acquiredAllies.length > 0 && (
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-6)',
          width: '100%',
          maxWidth: '600px',
        }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-3)',
          }}>
            동료 ({acquiredAllies.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {acquiredAllies.map((name, i) => (
              <span key={i} style={{
                fontSize: 'var(--text-xs)',
                padding: '2px 8px',
                background: 'color-mix(in oklch, var(--color-element-light) 10%, transparent)',
                color: 'var(--color-element-light)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid color-mix(in oklch, var(--color-element-light) 30%, transparent)',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

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
