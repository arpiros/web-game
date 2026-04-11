import { useState, useEffect } from 'react'
import { useRunStore } from './state/runStore'
import { CharacterSelectScreen } from './screens/CharacterSelectScreen'
import { BattleScreen } from './screens/BattleScreen'
import { DraftScreen } from './screens/DraftScreen'
import { ResultScreen } from './screens/ResultScreen'

function App() {
  const run = useRunStore(s => s.run)

  // run===null 상태에서 타이틀 ↔ 캐릭터 선택 전환용 로컬 플래그
  const [showCharSelect, setShowCharSelect] = useState(false)

  // resetRun() 호출로 run이 null로 돌아오면 타이틀로 복귀
  useEffect(() => {
    if (run === null) setShowCharSelect(false)
  }, [run])

  // -------------------------------------------------------------------------
  // 라우팅
  // -------------------------------------------------------------------------

  if (run === null) {
    if (showCharSelect) {
      return (
        <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <CharacterSelectScreen onBack={() => setShowCharSelect(false)} />
        </main>
      )
    }

    return (
      <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <TitleScreen onStart={() => setShowCharSelect(true)} />
      </main>
    )
  }

  if (run.phase === 'battle') {
    const { onBattleVictory, onBattleDefeat } = useRunStore.getState()
    return (
      <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <BattleScreen
          onBattleVictory={onBattleVictory}
          onBattleDefeat={onBattleDefeat}
        />
      </main>
    )
  }

  if (run.phase === 'draft') {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <DraftScreen />
      </main>
    )
  }

  // result
  return (
    <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <ResultScreen />
    </main>
  )
}

// ---------------------------------------------------------------------------
// TitleScreen (인라인)
// ---------------------------------------------------------------------------

function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      gap: 'var(--space-8)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-hero)',
          letterSpacing: '0.05em',
          color: 'var(--color-accent)',
          margin: 0,
        }}>
          Dark Roguelike
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          marginTop: 'var(--space-3)',
          marginBottom: 0,
          fontSize: 'var(--text-sm)',
          letterSpacing: '0.04em',
        }}>
          캐릭터와 스킬을 조합하여 최고의 누적 데미지를 노려라
        </p>
      </div>
      <button
        onClick={onStart}
        style={{
          padding: 'var(--space-3) var(--space-10)',
          border: '1px solid var(--color-accent)',
          color: 'var(--color-accent)',
          background: 'color-mix(in oklch, var(--color-accent) 8%, transparent)',
          fontSize: 'var(--text-md)',
          letterSpacing: '0.1em',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'background var(--duration-fast), box-shadow var(--duration-fast)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = 'color-mix(in oklch, var(--color-accent) 18%, transparent)'
          el.style.boxShadow = '0 0 24px color-mix(in oklch, var(--color-accent) 40%, transparent)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = 'color-mix(in oklch, var(--color-accent) 8%, transparent)'
          el.style.boxShadow = 'none'
        }}
      >
        시작하기
      </button>
    </div>
  )
}

export default App
