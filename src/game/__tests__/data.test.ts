import { describe, it, expect } from 'vitest'
import { ENEMIES, getEnemyById, getEnemyPoolForRound } from '../data/enemies'
import { ITEMS, getItemById } from '../data/items'
import { CHARACTERS, getCharacterById } from '../data/characters'
import { ALLIES, getAllyById } from '../data/allies'

// ---------------------------------------------------------------------------
// enemies.ts
// ---------------------------------------------------------------------------

describe('getEnemyById', () => {
  it('존재하는 적 ID로 EnemyDef를 반환한다', () => {
    const enemy = getEnemyById('goblin')
    expect(enemy).toBeDefined()
    expect(enemy?.id).toBe('goblin')
    expect(enemy?.name).toBe('고블린')
  })

  it('존재하지 않는 ID는 undefined를 반환한다', () => {
    expect(getEnemyById('not_exist')).toBeUndefined()
  })

  it('dragon_lord를 반환한다', () => {
    const boss = getEnemyById('dragon_lord')
    expect(boss).toBeDefined()
    expect(boss?.element).toBe('fire')
  })
})

describe('getEnemyPoolForRound', () => {
  it('라운드 1 — 초반 적만 포함된다', () => {
    const pool = getEnemyPoolForRound(1)
    const ids = pool.map(e => e.id)
    expect(ids).toContain('goblin')
    expect(ids).toContain('fire_imp')
    expect(ids).toContain('shadow_wolf')
    // 중반/후반 적은 없어야 한다
    expect(ids).not.toContain('orc_warrior')
    expect(ids).not.toContain('elder_troll')
  })

  it('라운드 2 — 초반 적만 포함된다 (경계값)', () => {
    const pool = getEnemyPoolForRound(2)
    const ids = pool.map(e => e.id)
    expect(ids).toContain('goblin')
    expect(ids).not.toContain('orc_warrior')
  })

  it('라운드 3 — 초반 + 중반 적이 포함된다', () => {
    const pool = getEnemyPoolForRound(3)
    const ids = pool.map(e => e.id)
    expect(ids).toContain('goblin')
    expect(ids).toContain('orc_warrior')
    expect(ids).toContain('ice_golem')
    expect(ids).not.toContain('elder_troll')
  })

  it('라운드 5 — 초반 + 중반 적이 포함된다 (경계값)', () => {
    const pool = getEnemyPoolForRound(5)
    const ids = pool.map(e => e.id)
    expect(ids).toContain('fire_imp')
    expect(ids).toContain('demon_mage')
    expect(ids).not.toContain('lich')
  })

  it('라운드 6 — 중반 + 후반 적이 포함된다', () => {
    const pool = getEnemyPoolForRound(6)
    const ids = pool.map(e => e.id)
    expect(ids).toContain('orc_warrior')
    expect(ids).toContain('elder_troll')
    expect(ids).toContain('lich')
    expect(ids).not.toContain('goblin')
  })

  it('라운드 7 — 중반 + 후반 적이 포함된다', () => {
    const pool = getEnemyPoolForRound(7)
    const ids = pool.map(e => e.id)
    expect(ids).toContain('dragon_lord')
    expect(ids).not.toContain('goblin')
    expect(ids).not.toContain('fire_imp')
  })

  it('ENEMIES 배열이 비어있지 않다', () => {
    expect(ENEMIES.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// items.ts
// ---------------------------------------------------------------------------

describe('getItemById', () => {
  it('존재하는 아이템 ID로 ItemDef를 반환한다', () => {
    const item = getItemById('iron_ring')
    expect(item).toBeDefined()
    expect(item?.id).toBe('iron_ring')
    expect(item?.effects[0].type).toBe('stat_boost')
  })

  it('존재하지 않는 ID는 undefined를 반환한다', () => {
    expect(getItemById('no_such_item')).toBeUndefined()
  })

  it('모든 아이템 효과 타입을 커버한다', () => {
    const types = new Set(ITEMS.flatMap(i => i.effects).map(e => e.type))
    expect(types.has('stat_boost')).toBe(true)
    expect(types.has('mp_regen')).toBe(true)
    expect(types.has('heal_on_kill')).toBe(true)
    expect(types.has('elemental_damage')).toBe(true)
    expect(types.has('skill_cooldown_reduce')).toBe(true)
    expect(types.has('on_low_hp')).toBe(true)
  })

  it('legendary 아이템이 존재한다', () => {
    const legendary = ITEMS.find(i => i.rarity === 'legendary')
    expect(legendary).toBeDefined()
  })

  it('ITEMS 배열이 비어있지 않다', () => {
    expect(ITEMS.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// characters.ts
// ---------------------------------------------------------------------------

describe('getCharacterById', () => {
  it('존재하는 캐릭터 ID로 CharacterDef를 반환한다', () => {
    const char = getCharacterById('dark_knight')
    expect(char).toBeDefined()
    expect(char?.id).toBe('dark_knight')
    expect(char?.element).toBe('dark')
  })

  it('존재하지 않는 ID는 undefined를 반환한다', () => {
    expect(getCharacterById('unknown_hero')).toBeUndefined()
  })

  it('모든 캐릭터가 innateSkillId와 startingSkillIds를 가진다', () => {
    for (const char of CHARACTERS) {
      expect(char.innateSkillId).toBeTruthy()
      expect(char.startingSkillIds.length).toBeGreaterThan(0)
    }
  })

  it('fire_mage의 element가 fire다', () => {
    expect(getCharacterById('fire_mage')?.element).toBe('fire')
  })

  it('CHARACTERS 배열이 비어있지 않다', () => {
    expect(CHARACTERS.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// allies.ts
// ---------------------------------------------------------------------------

describe('getAllyById', () => {
  it('존재하는 동료 ID로 AllyDef를 반환한다', () => {
    const ally = getAllyById('forest_archer')
    expect(ally).toBeDefined()
    expect(ally?.id).toBe('forest_archer')
    expect(ally?.action.type).toBe('attack')
  })

  it('존재하지 않는 ID는 undefined를 반환한다', () => {
    expect(getAllyById('no_ally')).toBeUndefined()
  })

  it('모든 동료 액션 타입을 커버한다', () => {
    const actionTypes = new Set(ALLIES.map(a => a.action.type))
    expect(actionTypes.has('attack')).toBe(true)
    expect(actionTypes.has('heal_party')).toBe(true)
    expect(actionTypes.has('apply_status')).toBe(true)
    expect(actionTypes.has('shield_party')).toBe(true)
  })

  it('legendary 동료가 존재한다', () => {
    const legendary = ALLIES.find(a => a.rarity === 'legendary')
    expect(legendary).toBeDefined()
  })

  it('ALLIES 배열이 비어있지 않다', () => {
    expect(ALLIES.length).toBeGreaterThan(0)
  })
})
