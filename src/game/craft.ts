/* ==========================================================================
   Dark Fantasy Roguelike — Craft (조합) System
   Pure functions. No React/Zustand dependency.
   ========================================================================== */

import type { CraftRecipe } from './types'
import { RECIPES } from './data/recipes'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasIngredients(
  ingredients: readonly [string, string],
  ownedSkillIds: readonly string[],
  ownedItemIds: readonly string[],
): boolean {
  const [a, b] = ingredients
  const owned = new Set([...ownedSkillIds, ...ownedItemIds])
  return owned.has(a) && owned.has(b)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 현재 보유한 스킬·아이템으로 만들 수 있는 레시피 목록을 반환한다.
 * 이미 결과물을 보유하고 있는 레시피는 제외한다.
 */
export function getAvailableRecipes(
  ownedSkillIds: readonly string[],
  ownedItemIds: readonly string[],
): readonly CraftRecipe[] {
  const allOwned = new Set([...ownedSkillIds, ...ownedItemIds])
  return RECIPES.filter(
    r =>
      hasIngredients(r.ingredients, ownedSkillIds, ownedItemIds) &&
      !allOwned.has(r.resultId),
  )
}

/**
 * 레시피를 적용해 재료 2개를 제거하고 결과물 1개를 추가한 새 목록을 반환한다.
 */
export function applyCraft(
  recipe: CraftRecipe,
  skillIds: readonly string[],
  itemIds: readonly string[],
): { skillIds: readonly string[]; itemIds: readonly string[] } {
  const [a, b] = recipe.ingredients

  let nextSkills = skillIds.filter(id => id !== a && id !== b)
  let nextItems = itemIds.filter(id => id !== a && id !== b)

  if (recipe.category === 'skill') {
    nextSkills = [...nextSkills, recipe.resultId]
  } else {
    nextItems = [...nextItems, recipe.resultId]
  }

  return { skillIds: nextSkills, itemIds: nextItems }
}
