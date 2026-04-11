/* ==========================================================================
   Seeded Deterministic RNG — Mulberry32 algorithm
   Pure functions only. No side effects.
   ========================================================================== */

/**
 * RNG 상태 (불변). next()를 호출할 때마다 새 상태를 반환.
 */
export interface RngState {
  readonly seed: number
}

/**
 * RNG 초기화
 */
export function createRng(seed: number): RngState {
  return { seed: seed >>> 0 }
}

/**
 * [0, 1) 범위의 float 반환 + 새 RNG 상태
 * Mulberry32 알고리즘 사용
 */
export function nextFloat(rng: RngState): [value: number, next: RngState] {
  let t = (rng.seed + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return [value, { seed: t }]
}

/**
 * [min, max) 범위의 정수 반환 + 새 RNG 상태
 */
export function nextInt(rng: RngState, min: number, max: number): [value: number, next: RngState] {
  const [f, next] = nextFloat(rng)
  return [Math.floor(f * (max - min)) + min, next]
}

/**
 * 배열에서 무작위 요소 하나 반환 + 새 RNG 상태
 */
export function pickOne<T>(rng: RngState, items: readonly T[]): [value: T, next: RngState] {
  const [idx, next] = nextInt(rng, 0, items.length)
  return [items[idx], next]
}

/**
 * 배열에서 n개의 중복 없는 무작위 요소 반환 + 새 RNG 상태
 */
export function pickN<T>(rng: RngState, items: readonly T[], n: number): [values: T[], next: RngState] {
  if (n >= items.length) {
    return [[...items], rng]
  }

  const pool = [...items]
  const result: T[] = []
  let current = rng

  for (let i = 0; i < n; i++) {
    const [idx, next] = nextInt(current, 0, pool.length)
    result.push(pool[idx])
    pool.splice(idx, 1)
    current = next
  }

  return [result, current]
}

/**
 * Fisher-Yates 셔플 + 새 RNG 상태
 */
export function shuffle<T>(rng: RngState, items: readonly T[]): [shuffled: T[], next: RngState] {
  const arr = [...items]
  let current = rng

  for (let i = arr.length - 1; i > 0; i--) {
    const [j, next] = nextInt(current, 0, i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    current = next
  }

  return [arr, current]
}

/**
 * chance% 확률로 true 반환 (0~100)
 */
export function roll(rng: RngState, chance: number): [value: boolean, next: RngState] {
  const [f, next] = nextFloat(rng)
  return [f * 100 < chance, next]
}
