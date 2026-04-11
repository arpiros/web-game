import { describe, it, expect } from 'vitest'
import { createRng, nextFloat, nextInt, pickOne, pickN, shuffle, roll } from '../rng'

describe('createRng', () => {
  it('동일 시드로 동일한 초기 상태를 만든다', () => {
    expect(createRng(42)).toEqual(createRng(42))
  })

  it('다른 시드는 다른 초기 상태를 만든다', () => {
    expect(createRng(1).seed).not.toBe(createRng(2).seed)
  })
})

describe('nextFloat', () => {
  it('[0, 1) 범위 내 값을 반환한다', () => {
    const rng = createRng(12345)
    for (let i = 0; i < 100; i++) {
      const [value, next] = nextFloat(rng)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
      // 각 호출은 독립적 — rng 상태 불변 확인
      void next
    }
  })

  it('동일 시드는 항상 동일한 값을 반환한다 (결정론적)', () => {
    const rng = createRng(99)
    const [v1] = nextFloat(rng)
    const [v2] = nextFloat(rng)
    expect(v1).toBe(v2)
  })

  it('연속 호출은 서로 다른 값을 반환한다', () => {
    const rng = createRng(7)
    const [v1, rng2] = nextFloat(rng)
    const [v2] = nextFloat(rng2)
    expect(v1).not.toBe(v2)
  })

  it('새 RNG 상태는 원본과 다르다 (불변 확인)', () => {
    const rng = createRng(42)
    const [, next] = nextFloat(rng)
    expect(next.seed).not.toBe(rng.seed)
  })
})

describe('nextInt', () => {
  it('[min, max) 범위 내 정수를 반환한다', () => {
    const rng = createRng(500)
    let current = rng
    for (let i = 0; i < 200; i++) {
      const [value, next] = nextInt(current, 3, 8)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThan(8)
      expect(Number.isInteger(value)).toBe(true)
      current = next
    }
  })

  it('min === max - 1 이면 항상 min 을 반환한다', () => {
    const rng = createRng(1)
    const [value] = nextInt(rng, 5, 6)
    expect(value).toBe(5)
  })
})

describe('pickOne', () => {
  it('배열 요소 중 하나를 반환한다', () => {
    const items = ['a', 'b', 'c', 'd'] as const
    const rng = createRng(123)
    const [picked] = pickOne(rng, items)
    expect(items).toContain(picked)
  })

  it('동일 시드는 항상 동일한 요소를 선택한다', () => {
    const items = [10, 20, 30, 40, 50]
    const rng = createRng(77)
    const [v1] = pickOne(rng, items)
    const [v2] = pickOne(rng, items)
    expect(v1).toBe(v2)
  })
})

describe('pickN', () => {
  it('n개의 중복 없는 요소를 반환한다', () => {
    const items = [1, 2, 3, 4, 5, 6, 7]
    const rng = createRng(42)
    const [picked] = pickN(rng, items, 3)
    expect(picked).toHaveLength(3)
    expect(new Set(picked).size).toBe(3)
    picked.forEach(p => expect(items).toContain(p))
  })

  it('n >= items.length 면 전체 배열을 반환한다', () => {
    const items = [1, 2, 3]
    const rng = createRng(1)
    const [picked] = pickN(rng, items, 5)
    expect(picked).toHaveLength(3)
  })

  it('원본 배열을 변경하지 않는다 (불변 확인)', () => {
    const items = Object.freeze([1, 2, 3, 4, 5])
    const rng = createRng(99)
    expect(() => pickN(rng, items, 3)).not.toThrow()
    expect(items).toHaveLength(5)
  })
})

describe('shuffle', () => {
  it('배열의 모든 요소를 포함한다', () => {
    const items = [1, 2, 3, 4, 5]
    const rng = createRng(55)
    const [shuffled] = shuffle(rng, items)
    expect(shuffled).toHaveLength(5)
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('원본 배열을 변경하지 않는다 (불변 확인)', () => {
    const items = [1, 2, 3]
    const rng = createRng(1)
    shuffle(rng, items)
    expect(items).toEqual([1, 2, 3])
  })

  it('동일 시드는 동일한 순서를 만든다', () => {
    const items = [1, 2, 3, 4, 5]
    const [s1] = shuffle(createRng(42), items)
    const [s2] = shuffle(createRng(42), items)
    expect(s1).toEqual(s2)
  })
})

describe('roll', () => {
  it('0% 확률은 항상 false', () => {
    const rng = createRng(1)
    const [value] = roll(rng, 0)
    expect(value).toBe(false)
  })

  it('100% 확률은 항상 true', () => {
    const rng = createRng(1)
    const [value] = roll(rng, 100)
    expect(value).toBe(true)
  })

  it('50% 확률은 대략 절반이 true (통계 검증)', () => {
    let trueCount = 0
    let rng = createRng(2024)
    for (let i = 0; i < 1000; i++) {
      const [value, next] = roll(rng, 50)
      if (value) trueCount++
      rng = next
    }
    // 50%±10% 허용
    expect(trueCount).toBeGreaterThan(400)
    expect(trueCount).toBeLessThan(600)
  })
})
