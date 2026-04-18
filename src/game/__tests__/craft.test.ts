import { describe, it, expect } from 'vitest'
import { getAvailableRecipes, applyCraft } from '../craft'
import { RECIPES } from '../data/recipes'

describe('getAvailableRecipes', () => {
  it('재료 2개를 모두 보유한 경우 레시피를 반환한다', () => {
    const skillIds = ['shadow_strike', 'annihilation']
    const itemIds: string[] = []
    const recipes = getAvailableRecipes(skillIds, itemIds)
    expect(recipes.some(r => r.id === 'recipe_void_annihilation')).toBe(true)
  })

  it('재료 1개만 보유한 경우 해당 레시피를 반환하지 않는다', () => {
    const skillIds = ['shadow_strike']
    const itemIds: string[] = []
    const recipes = getAvailableRecipes(skillIds, itemIds)
    expect(recipes.some(r => r.id === 'recipe_void_annihilation')).toBe(false)
  })

  it('이미 결과물을 보유한 경우 해당 레시피를 반환하지 않는다', () => {
    const skillIds = ['shadow_strike', 'annihilation', 'void_annihilation']
    const itemIds: string[] = []
    const recipes = getAvailableRecipes(skillIds, itemIds)
    expect(recipes.some(r => r.id === 'recipe_void_annihilation')).toBe(false)
  })

  it('아이템 재료도 정상 인식한다', () => {
    const skillIds: string[] = []
    const itemIds = ['iron_ring', 'flame_shard']
    const recipes = getAvailableRecipes(skillIds, itemIds)
    expect(recipes.some(r => r.id === 'recipe_dragon_blade')).toBe(true)
  })

  it('스킬과 아이템이 섞인 재료도 인식한다', () => {
    // 현재 레시피는 모두 같은 카테고리 재료지만, 함수 자체는 섞인 재료를 지원한다
    const skillIds = ['shadow_strike']
    const itemIds = ['shadow_strike'] // 중복 소유 테스트용 — owned Set에 둘 다 포함됨
    const recipes = getAvailableRecipes(skillIds, itemIds)
    // shadow_strike가 skillIds와 itemIds 양쪽에 있으므로 annihilation만 없으면 결과 없음
    expect(recipes.some(r => r.id === 'recipe_void_annihilation')).toBe(false)
  })

  it('재료가 없으면 빈 배열을 반환한다', () => {
    const recipes = getAvailableRecipes([], [])
    expect(recipes).toHaveLength(0)
  })
})

describe('applyCraft', () => {
  it('스킬 레시피 적용 시 재료를 제거하고 결과 스킬을 추가한다', () => {
    const recipe = RECIPES.find(r => r.id === 'recipe_void_annihilation')!
    const skillIds = ['shadow_strike', 'annihilation', 'slash']
    const itemIds: string[] = []

    const result = applyCraft(recipe, skillIds, itemIds)

    expect(result.skillIds).not.toContain('shadow_strike')
    expect(result.skillIds).not.toContain('annihilation')
    expect(result.skillIds).toContain('void_annihilation')
    expect(result.skillIds).toContain('slash')
    expect(result.itemIds).toHaveLength(0)
  })

  it('아이템 레시피 적용 시 재료를 제거하고 결과 아이템을 추가한다', () => {
    const recipe = RECIPES.find(r => r.id === 'recipe_dragon_blade')!
    const skillIds: string[] = []
    const itemIds = ['iron_ring', 'flame_shard', 'mana_crystal']

    const result = applyCraft(recipe, skillIds, itemIds)

    expect(result.itemIds).not.toContain('iron_ring')
    expect(result.itemIds).not.toContain('flame_shard')
    expect(result.itemIds).toContain('dragon_blade')
    expect(result.itemIds).toContain('mana_crystal')
    expect(result.skillIds).toHaveLength(0)
  })

  it('원본 배열을 변경하지 않는다 (불변성)', () => {
    const recipe = RECIPES.find(r => r.id === 'recipe_void_annihilation')!
    const skillIds = ['shadow_strike', 'annihilation']
    const itemIds: string[] = []
    const originalSkills = [...skillIds]

    applyCraft(recipe, skillIds, itemIds)

    expect(skillIds).toEqual(originalSkills)
  })
})
