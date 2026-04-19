/* ==========================================================================
   Dark Fantasy Roguelike — Run Store (Zustand)
   React/Zustand layer. Wraps pure game functions.
   ========================================================================== */

import { create } from 'zustand'
import type { RunState, BattleAction } from '../game/types'
import type { RngState } from '../game/rng'
import { createRng } from '../game/rng'
import {
  createRun,
  startBattle,
  completeBattle,
  applyDraftChoice,
  applyCraftChoice,
  applyEventChoice,
  handleDefeat,
  rerollDraftOption,
} from '../game/run'
import { battleReducer } from '../game/combat'

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface RunStore {
  /** 현재 런 상태. null이면 타이틀 화면 */
  run: RunState | null
  /** 현재 RNG 상태 (결정론적 재현을 위해 보관) */
  rng: RngState
  /** 전투 속도 배율 */
  battleSpeed: 1 | 1.5 | 2

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /** 새 런 시작 (캐릭터 선택 → 첫 번째 전투) */
  startRun: (characterDefId: string) => void

  /** 전투 액션 디스패치 (스킬 선택, 타겟 선택, 스킬 사용 등) */
  dispatchBattle: (action: BattleAction) => void

  /** 전투 승리 처리 → draft 단계로 전환 */
  onBattleVictory: () => void

  /** 전투 패배 처리 → result 화면으로 전환 */
  onBattleDefeat: () => void

  /** 드래프트 선택 (0, 1, 2 중 하나) */
  selectDraft: (optionIndex: number) => void

  /** 새 전투 시작 (draft → battle) */
  advanceToNextBattle: () => void

  /** 조합(Craft) 수행 후 다음 전투로 바로 전환 */
  craftAndAdvance: (recipeId: string) => void

  /** 이벤트 선택지 적용 → draft 단계로 전환 */
  resolveEvent: (choiceId: string) => void

  /** 드래프트 카드 1장 리롤 */
  rerollDraft: (targetIndex: number) => void

  /** 런 초기화 (타이틀로 돌아가기) */
  resetRun: () => void

  /** 전투 속도 변경 */
  setBattleSpeed: (speed: 1 | 1.5 | 2) => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useRunStore = create<RunStore>((set, get) => ({
  run: null,
  rng: createRng(Date.now()),
  battleSpeed: 1,

  startRun: (characterDefId) => {
    const seed = Date.now()
    const rng = createRng(seed)
    const run = createRun(characterDefId, seed)
    const [battleState, nextRng] = startBattle(run, rng)

    set({
      rng: nextRng,
      run: { ...run, battleState },
    })
  },

  dispatchBattle: (action) => {
    const { run } = get()
    if (!run?.battleState) return

    const newBattleState = battleReducer(run.battleState, action)

    set({
      run: { ...run, battleState: newBattleState },
    })
  },

  onBattleVictory: () => {
    const { run, rng } = get()
    if (!run?.battleState) return

    const [newRun, nextRng] = completeBattle(run, run.battleState, rng)
    set({ run: newRun, rng: nextRng })
  },

  onBattleDefeat: () => {
    const { run } = get()
    if (!run?.battleState) return

    const newRun = handleDefeat(run, run.battleState)
    set({ run: newRun })
  },

  selectDraft: (optionIndex) => {
    const { run } = get()
    if (!run || run.phase !== 'draft') return

    const newRun = applyDraftChoice(run, optionIndex)
    set({ run: newRun })
  },

  advanceToNextBattle: () => {
    const { run, rng } = get()
    if (!run || run.phase !== 'battle' || run.battleState !== null) return

    const [battleState, nextRng] = startBattle(run, rng)
    set({
      rng: nextRng,
      run: { ...run, battleState },
    })
  },

  craftAndAdvance: (recipeId) => {
    const { run } = get()
    if (!run || run.phase !== 'draft') return

    const newRun = applyCraftChoice(run, recipeId)
    set({ run: newRun })
  },

  resolveEvent: (choiceId) => {
    const { run, rng } = get()
    if (!run || run.phase !== 'event') return

    const [newRun, nextRng] = applyEventChoice(run, choiceId, rng)
    set({ run: newRun, rng: nextRng })
  },

  rerollDraft: (targetIndex) => {
    const { run, rng } = get()
    if (!run || run.phase !== 'draft') return
    if (run.rerollsRemaining <= 0) return

    const [newRun, nextRng] = rerollDraftOption(run, rng, targetIndex)
    set({ run: newRun, rng: nextRng })
  },

  resetRun: () => {
    set({
      run: null,
      rng: createRng(Date.now()),
    })
  },

  setBattleSpeed: (speed) => {
    set({ battleSpeed: speed })
  },
}))
