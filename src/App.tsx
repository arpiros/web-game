import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useRunStore } from './state/runStore'
import { CharacterSelectScreen } from './screens/CharacterSelectScreen'
import { BattleScreen } from './screens/BattleScreen'
import { DraftScreen } from './screens/DraftScreen'
import { EventScreen } from './screens/EventScreen'
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

  if (run.phase === 'event') {
    return (
      <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <EventScreen />
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
    <div className="title-screen" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      gap: 'var(--space-8)',
      position: 'relative',
      padding: 'var(--space-8)',
    }}>
      <div className="title-screen__copy" style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-hero)',
          letterSpacing: 0,
          color: 'var(--color-accent)',
          margin: 0,
        }}>
          회색 첨탑
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          marginTop: 'var(--space-3)',
          marginBottom: 0,
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-semibold)',
        }}>
          소원을 품은 소녀들이 탑의 끝을 향해 오르는 서브컬처 판타지 로그라이트
        </p>
      </div>
      <button
        onClick={onStart}
        className="ui-button title-screen__start"
        style={{
          '--button-accent': 'var(--color-accent)',
          padding: 'var(--space-3) var(--space-10)',
          fontSize: 'var(--text-md)',
        } as CSSProperties}
      >
        시작하기
      </button>

      <span style={{
        position: 'absolute',
        bottom: 'var(--space-4)',
        right: 'var(--space-5)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: '0.04em',
        opacity: 0.6,
      }}>
        v{__APP_VERSION__}
      </span>
    </div>
  )
}

export default App
