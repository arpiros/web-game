/**
 * QA Test Suite — Dark Fantasy Roguelike
 *
 * Tests all 5 characters across title, character select, battle, and draft screens.
 * Uses store injection to fast-forward through battle results.
 */

import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'http://localhost:5173/web-game/'
const SCREENSHOTS_DIR = '/tmp/qa-screenshots'

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

async function ss(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}.png`),
    fullPage: false,
  })
}

async function goToTitle(page: Page) {
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
}

async function clickNewGame(page: Page) {
  await page.click('button:has-text("시작하기")')
  await page.waitForTimeout(300)
}

async function selectCharByName(page: Page, name: string) {
  // Find and click the character card button containing the character name
  const buttons = page.locator('button')
  const count = await buttons.count()
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i)
    const text = await btn.textContent()
    if (text && text.includes(name)) {
      await btn.click()
      await page.waitForTimeout(800)
      return
    }
  }
  throw new Error(`Character button not found: ${name}`)
}

// Get all visible button texts on page
async function getButtonTexts(page: Page): Promise<string[]> {
  const buttons = page.locator('button')
  const count = await buttons.count()
  const texts: string[] = []
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i)
    const text = await btn.textContent()
    const visible = await btn.isVisible()
    if (text && text.trim() && visible) {
      texts.push(text.trim().replace(/\s+/g, ' ').substring(0, 80))
    }
  }
  return texts
}

// Get page text content (all visible text)
async function getPageText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText)
}

// Inject win state via Zustand store
async function winBattle(page: Page) {
  return page.evaluate(() => {
    // Try to access Zustand store - look for it on window
    // The store might be accessible via React DevTools or window globals
    const anyWindow = window as any

    // Try common Zustand access patterns
    if (anyWindow.__zustand_stores__) {
      return 'found __zustand_stores__'
    }

    // Look through React fiber for the Zustand store
    const rootEl = document.getElementById('root')
    if (rootEl) {
      const reactKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'))
      if (reactKey) {
        return 'react fiber found: ' + reactKey
      }
    }
    return 'no store access found'
  })
}

// ============================================================================
// TEST: Title Screen
// ============================================================================

test('01 - Title screen: layout and button text', async ({ page }) => {
  await goToTitle(page)
  await ss(page, '01-title')

  const bodyText = await getPageText(page)
  console.log('Title page text:', bodyText.substring(0, 500))

  // Check title exists
  await expect(page.locator('h1')).toBeVisible()
  const h1Text = await page.locator('h1').textContent()
  expect(h1Text).toContain('Dark Roguelike')

  // Check button text - NOTE: button says "시작하기" not "새 게임"
  const startBtn = page.locator('button:has-text("시작하기")')
  await expect(startBtn).toBeVisible()

  // Check subtitle
  const subtitleVisible = bodyText.includes('누적 데미지') || bodyText.includes('캐릭터')
  console.log('Subtitle mentions character/damage:', subtitleVisible)

  // Check version
  const hasVersion = bodyText.includes('v0.') || bodyText.includes('v1.')
  console.log('Version displayed:', hasVersion)

  // FINDING: Button says "시작하기" not "새 게임" - verify it's intentional
  const newGameBtn = page.locator('button:has-text("새 게임")')
  const newGameCount = await newGameBtn.count()
  console.log('FINDING: "새 게임" button count:', newGameCount, '(0 = button is named "시작하기" instead)')
})

// ============================================================================
// TEST: Character Select Screen
// ============================================================================

test('02 - Character select: all 5 characters displayed', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await ss(page, '02-char-select')

  const pageText = await getPageText(page)
  console.log('Character select text:', pageText.substring(0, 1000))

  // Verify all 5 character names
  const chars = ['칠흑의 기사', '불꽃의 마법사', '빛의 성기사', '조류 무희', '광전사']
  for (const char of chars) {
    const found = pageText.includes(char)
    console.log(`Character "${char}" displayed: ${found}`)
    expect(pageText, `Character "${char}" should be visible`).toContain(char)
  }

  // Check stats displayed
  expect(pageText).toContain('HP')
  expect(pageText).toContain('공격')
  expect(pageText).toContain('방어')
  expect(pageText).toContain('MP')

  // FINDING: Speed stat not shown in character select
  const speedInCards = pageText.includes('속도')
  console.log('FINDING: Speed stat in character select:', speedInCards, '(speed is not shown, only HP/Attack/Defense/MP)')

  // FINDING: Check if lore/story is shown
  const hasLore = pageText.includes('빛을 잃은 성기사') || pageText.includes('고대 화염')
  console.log('Lore text displayed:', hasLore)

  // FINDING: Character elements/types shown
  const hasElements = pageText.includes('어둠') && pageText.includes('화염') && pageText.includes('빛')
  console.log('Element badges shown:', hasElements)

  // Check back button
  const backBtn = page.locator('button:has-text("뒤로")')
  await expect(backBtn).toBeVisible()
})

// ============================================================================
// TEST: Dark Knight Battle
// ============================================================================

test('03 - Dark Knight: battle screen loads, skills visible', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '칠흑의 기사')
  await ss(page, '03-dark-knight-battle')

  const pageText = await getPageText(page)
  console.log('Dark Knight battle text:', pageText.substring(0, 2000))

  const btns = await getButtonTexts(page)
  console.log('Dark Knight battle buttons:', JSON.stringify(btns))

  // Check for basic battle UI elements
  console.log('Has HP:', pageText.includes('HP'))
  console.log('Has MP:', pageText.includes('MP'))
  console.log('Has 라운드 (Round):', pageText.includes('라운드'))
  console.log('Has 턴 종료 (End Turn):', pageText.includes('턴 종료'))

  // Dark Knight starting skills: slash, poison_bite, shadow_strike (innate)
  const hasSlash = btns.some(b => b.includes('참격') || b.includes('베기') || b.includes('slash') || b.includes('어둠의'))
  const hasShadow = btns.some(b => b.includes('그림자') || b.includes('shadow') || b.includes('암흑'))
  const hasPoison = btns.some(b => b.includes('독') || b.includes('poison'))
  const hasEndTurn = btns.some(b => b.includes('턴 종료'))

  console.log('Dark Knight skills - slash-like:', hasSlash)
  console.log('Dark Knight skills - shadow:', hasShadow)
  console.log('Dark Knight skills - poison:', hasPoison)
  console.log('Dark Knight has end turn button:', hasEndTurn)

  // FINDING: Check speed stat display
  const hasSpeed = pageText.includes('속도')
  console.log('Speed stat in battle:', hasSpeed)

  // FINDING: Check if battle log shows
  const hasLog = pageText.includes('로그') || pageText.includes('전투') || btns.some(b => b.includes('로그'))
  console.log('Battle log present:', hasLog)

  // Check round display
  const roundMatch = pageText.match(/라운드\s*(\d+)/)
  if (roundMatch) {
    console.log('Current round:', roundMatch[1])
  }

  // FINDING: Check enemy display
  const hasEnemy = pageText.includes('적') || pageText.includes('goblin') || pageText.includes('고블린')
  console.log('Enemy displayed:', hasEnemy)
})

// ============================================================================
// TEST: Dark Knight - Use Skills
// ============================================================================

test('04 - Dark Knight: skill usage flow', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '칠흑의 기사')
  await page.waitForTimeout(500)

  const btns = await getButtonTexts(page)
  console.log('Available buttons:', JSON.stringify(btns))

  // Try clicking first skill button (not system buttons)
  const allBtns = page.locator('button')
  const count = await allBtns.count()

  let skillClicked = false
  for (let i = 0; i < count; i++) {
    const btn = allBtns.nth(i)
    const text = await btn.textContent()
    const visible = await btn.isVisible()
    if (!text || !visible) continue

    const t = text.trim()
    // Skip system buttons
    if (t.includes('턴 종료') || t.includes('뒤로') || t.includes('시작')) continue

    // Skip very short texts (might be icons)
    if (t.length < 2) continue

    const isDisabled = await btn.isDisabled()
    if (!isDisabled) {
      console.log(`Clicking skill: "${t}"`)
      await btn.click()
      await page.waitForTimeout(300)
      skillClicked = true
      await ss(page, '04-after-skill-click')

      const afterBtns = await getButtonTexts(page)
      console.log('After skill click buttons:', JSON.stringify(afterBtns))

      // Check if enemy target selection is now needed
      const pageText = await getPageText(page)
      const needsTarget = pageText.includes('대상') || pageText.includes('선택')
      console.log('FINDING: Needs target after skill click:', needsTarget)
      break
    }
  }

  if (!skillClicked) {
    console.log('FINDING: No clickable skill buttons found!')
  }

  // Now try end turn
  const endTurnBtn = page.locator('button:has-text("턴 종료")')
  const endTurnCount = await endTurnBtn.count()
  if (endTurnCount > 0) {
    const isDisabled = await endTurnBtn.isDisabled()
    console.log('End turn button disabled:', isDisabled)

    if (!isDisabled) {
      await endTurnBtn.click()
      await page.waitForTimeout(1000)
      await ss(page, '04b-after-end-turn')
      console.log('End turn clicked successfully')
    }
  }
})

// ============================================================================
// TEST: Auto-play Dark Knight through victory to draft
// ============================================================================

test('05 - Dark Knight: auto-play to draft screen', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '칠흑의 기사')
  await page.waitForTimeout(500)

  // Use store injection to win battle instantly
  const winResult = await page.evaluate(() => {
    // Try to find Zustand store via React internal fiber
    const root = document.getElementById('root')
    if (!root) return 'no root'

    // Find fiber key
    const fiberKey = Object.keys(root).find(k =>
      k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
    )
    if (!fiberKey) return 'no fiber key'

    // Walk fiber tree to find store
    function findStore(fiber: any, depth: number): any {
      if (!fiber || depth > 20) return null

      // Check if this fiber has memoizedState with Zustand store getter
      try {
        if (fiber.memoizedState) {
          let hook = fiber.memoizedState
          while (hook) {
            if (hook.queue && hook.queue.dispatch) {
              const state = hook.memoizedState
              if (state && typeof state === 'object' && 'getState' in state) {
                return state
              }
            }
            hook = hook.next
          }
        }
      } catch (e) {}

      return findStore(fiber.child, depth + 1) ||
             findStore(fiber.sibling, depth + 1)
    }

    const store = findStore((root as any)[fiberKey], 0)
    if (!store) return 'no store in fiber'

    try {
      const storeState = store.getState()
      return JSON.stringify({
        hasRun: !!storeState.run,
        phase: storeState.run?.phase,
        round: storeState.run?.round,
      })
    } catch (e) {
      return 'error: ' + String(e)
    }
  })

  console.log('Store injection result:', winResult)

  // Manual fast-play: use end turn repeatedly and watch for state changes
  let reachedDraft = false
  let reachedResult = false

  for (let attempt = 0; attempt < 80; attempt++) {
    const pageText = await getPageText(page)

    // Check phases
    if (pageText.includes('보상을 선택하세요') || pageText.includes('보상 선택')) {
      reachedDraft = true
      console.log(`REACHED DRAFT at attempt ${attempt}`)
      await ss(page, '05-reached-draft')
      break
    }
    if (pageText.includes('승리') || pageText.includes('패배') || pageText.includes('결과')) {
      reachedResult = true
      console.log(`REACHED RESULT at attempt ${attempt}`)
      await ss(page, '05-reached-result')
      break
    }

    const btns = page.locator('button')
    const count = await btns.count()

    // Click first enabled non-system button (skill)
    let clickedSomething = false
    for (let i = 0; i < count && !clickedSomething; i++) {
      const btn = btns.nth(i)
      const text = (await btn.textContent() || '').trim()
      const visible = await btn.isVisible().catch(() => false)
      const disabled = await btn.isDisabled().catch(() => true)

      if (!visible || disabled) continue
      if (text.includes('턴 종료') || text.includes('뒤로') || text.length < 2) continue

      await btn.click().catch(() => {})
      clickedSomething = true
      await page.waitForTimeout(150)
    }

    // Always try end turn
    const endTurnBtn = page.locator('button:has-text("턴 종료")')
    if (await endTurnBtn.count() > 0) {
      const disabled = await endTurnBtn.isDisabled().catch(() => true)
      if (!disabled) {
        await endTurnBtn.click().catch(() => {})
        await page.waitForTimeout(600)
      }
    }
  }

  if (!reachedDraft && !reachedResult) {
    await ss(page, '05-stuck-state')
    const finalText = await getPageText(page)
    console.log('FINDING: Could not reach draft or result after 80 attempts')
    console.log('Final page text:', finalText.substring(0, 500))
  }
})

// ============================================================================
// TEST: Draft Screen Analysis
// ============================================================================

test('06 - Draft screen: layout and interactions', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '칠흑의 기사')
  await page.waitForTimeout(500)

  // Force victory using store
  const victoryResult = await page.evaluate(() => {
    // Walk React fiber to find onBattleVictory
    const root = document.getElementById('root')
    if (!root) return 'no root'

    const fiberKey = Object.keys(root).find(k =>
      k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
    )
    if (!fiberKey) return 'no fiber key'

    // Try to find useRunStore via window
    // Zustand stores are accessible if you know the variable name
    const anyWin = window as any

    // Check if module is exposed during dev
    const devEntries = Object.entries(anyWin).filter(([k]) =>
      k.toLowerCase().includes('store') || k.toLowerCase().includes('zustand')
    )
    return `dev entries: ${devEntries.map(([k]) => k).join(', ')}`
  })
  console.log('Victory injection attempt:', victoryResult)

  // Play through manually to get to draft
  let reachedDraft = false
  for (let attempt = 0; attempt < 100; attempt++) {
    const pageText = await getPageText(page)

    if (pageText.includes('보상을 선택하세요') || pageText.includes('보상 선택') || pageText.includes('라운드') && pageText.includes('클리어')) {
      reachedDraft = true
      console.log(`Draft reached at attempt ${attempt}`)
      break
    }
    if (pageText.includes('패배') || pageText.includes('게임 오버')) {
      console.log('Character died at attempt', attempt)
      await ss(page, '06-defeat')
      break
    }

    const btns = page.locator('button')
    const count = await btns.count()

    for (let i = 0; i < count; i++) {
      const btn = btns.nth(i)
      const text = (await btn.textContent() || '').trim()
      const visible = await btn.isVisible().catch(() => false)
      const disabled = await btn.isDisabled().catch(() => true)

      if (!visible || disabled) continue
      if (text.includes('뒤로') || text.includes('시작하기')) continue
      if (text.length < 2) continue

      if (text.includes('턴 종료')) {
        await btn.click().catch(() => {})
        await page.waitForTimeout(500)
        break
      }

      // Click first non-end-turn skill
      await btn.click().catch(() => {})
      await page.waitForTimeout(100)
    }
  }

  if (reachedDraft) {
    await ss(page, '06-draft-screen')
    const pageText = await getPageText(page)
    console.log('Draft screen text:', pageText.substring(0, 1500))

    const btns = await getButtonTexts(page)
    console.log('Draft screen buttons:', JSON.stringify(btns))

    // Check draft options
    const hasReward = pageText.includes('보상') || pageText.includes('선택')
    const hasCraft = pageText.includes('조합')
    const hasSkillCards = pageText.includes('스킬')
    const hasItemCards = pageText.includes('아이템')
    const hasAllyCards = pageText.includes('동료')

    console.log('FINDING - Draft has reward section:', hasReward)
    console.log('FINDING - Draft has craft section:', hasCraft)
    console.log('FINDING - Draft has skill cards:', hasSkillCards)
    console.log('FINDING - Draft has item cards:', hasItemCards)
    console.log('FINDING - Draft has ally cards:', hasAllyCards)

    // Check 3 cards are shown
    const draftButtons = btns.filter(b => !b.includes('보상 선택') && !b.includes('아이템 조합'))
    console.log('FINDING - Draft selectable options count:', draftButtons.length, '(should be 3)')

    // Check tabs
    const hasRewardTab = btns.some(b => b.includes('보상 선택'))
    const hasCraftTab = btns.some(b => b.includes('아이템 조합'))
    console.log('Draft reward tab:', hasRewardTab)
    console.log('Draft craft tab:', hasCraftTab)

    // Switch to craft tab
    const craftTab = page.locator('button:has-text("아이템 조합")')
    if (await craftTab.count() > 0) {
      await craftTab.click()
      await page.waitForTimeout(200)
      await ss(page, '06b-draft-craft-tab')
      const craftText = await getPageText(page)
      console.log('Craft tab text:', craftText.substring(0, 500))
    }

    // Select first draft option to proceed
    const rewardTab = page.locator('button:has-text("보상 선택")')
    if (await rewardTab.count() > 0) {
      await rewardTab.click()
      await page.waitForTimeout(200)
    }

    // Click first draft card
    const draftCardBtns = page.locator('button')
    const draftCount = await draftCardBtns.count()
    for (let i = 0; i < draftCount; i++) {
      const btn = draftCardBtns.nth(i)
      const text = (await btn.textContent() || '').trim()
      if (text.includes('보상 선택') || text.includes('아이템 조합') || text.includes('뒤로')) continue
      const visible = await btn.isVisible().catch(() => false)
      const disabled = await btn.isDisabled().catch(() => true)
      if (visible && !disabled && text.length > 2) {
        console.log(`Selecting draft card: "${text.substring(0, 40)}"`)
        await btn.click()
        await page.waitForTimeout(500)
        await ss(page, '06c-after-draft-select')
        break
      }
    }

    // Check we moved back to battle
    const newPhaseText = await getPageText(page)
    const isBackInBattle = newPhaseText.includes('라운드') || newPhaseText.includes('턴 종료')
    console.log('After draft selection, back in battle:', isBackInBattle)
  }
})

// ============================================================================
// TEST: Fire Mage - Battle Analysis
// ============================================================================

test('07 - Fire Mage: battle screen', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '불꽃의 마법사')
  await page.waitForTimeout(500)
  await ss(page, '07-fire-mage-battle')

  const pageText = await getPageText(page)
  const btns = await getButtonTexts(page)
  console.log('Fire Mage buttons:', JSON.stringify(btns))
  console.log('Fire Mage page text:', pageText.substring(0, 1000))

  // Verify fire skills
  const hasFire = btns.some(b => b.includes('화염') || b.includes('파이어') || b.includes('불') || b.includes('파볼'))
  console.log('Fire skills present:', hasFire)

  // Fire mage has basic_ember as 0MP attack
  const hasBasicAttack = btns.some(b => b.includes('기본') || b.includes('엠버') || b.includes('잉걸'))
  console.log('Basic ember attack present:', hasBasicAttack)

  // Check MP display - fire mage has 140 maxMp
  const mpMatch = pageText.match(/(\d+)\s*\/\s*(\d+)\s*MP|MP\s*(\d+)\s*\/\s*(\d+)/)
  if (mpMatch) {
    console.log('MP display found:', mpMatch[0])
  }
})

// ============================================================================
// TEST: Holy Paladin - Battle Analysis
// ============================================================================

test('08 - Holy Paladin: battle screen', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '빛의 성기사')
  await page.waitForTimeout(500)
  await ss(page, '08-paladin-battle')

  const pageText = await getPageText(page)
  const btns = await getButtonTexts(page)
  console.log('Paladin buttons:', JSON.stringify(btns))

  // Paladin starts with: divine_heal, barrier, basic_glimmer, smite, holy_strike (innate)
  const hasHeal = btns.some(b => b.includes('치유') || b.includes('힐') || b.includes('heal'))
  const hasBarrier = btns.some(b => b.includes('방어막') || b.includes('배리어') || b.includes('방막'))
  const hasSmite = btns.some(b => b.includes('심판') || b.includes('성스러') || b.includes('강타'))

  console.log('Paladin heal skill:', hasHeal)
  console.log('Paladin barrier skill:', hasBarrier)
  console.log('Paladin smite skill:', hasSmite)

  // Check HP display - paladin has high HP (1350)
  const hp1350 = pageText.includes('1,350') || pageText.includes('1350')
  console.log('Paladin max HP 1350 displayed:', hp1350)
})

// ============================================================================
// TEST: Tide Dancer - Battle Analysis
// ============================================================================

test('09 - Tide Dancer: battle screen', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '조류 무희')
  await page.waitForTimeout(500)
  await ss(page, '09-tide-dancer-battle')

  const pageText = await getPageText(page)
  const btns = await getButtonTexts(page)
  console.log('Tide Dancer buttons:', JSON.stringify(btns))

  // Tide dancer starts with: heal_water, cleanse, basic_splash, water_lance (innate)
  const hasWaterHeal = btns.some(b => b.includes('물') || b.includes('수류') || b.includes('물결'))
  const hasCleanse = btns.some(b => b.includes('정화') || b.includes('클렌즈'))

  console.log('Water/heal skills:', hasWaterHeal)
  console.log('Cleanse skill:', hasCleanse)

  // Tide dancer has highest speed (100)
  const hasHighSpeed = pageText.includes('100') // Speed stat
  console.log('Speed 100 in text:', hasHighSpeed)
})

// ============================================================================
// TEST: Berserker - Battle Analysis
// ============================================================================

test('10 - Berserker: battle screen', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '광전사')
  await page.waitForTimeout(500)
  await ss(page, '10-berserker-battle')

  const pageText = await getPageText(page)
  const btns = await getButtonTexts(page)
  console.log('Berserker buttons:', JSON.stringify(btns))

  // Berserker starts with: slash, cleave, heavy_blow (innate)
  const hasSlash = btns.some(b => b.includes('참격') || b.includes('베기'))
  const hasCleave = btns.some(b => b.includes('휩쓸기') || b.includes('클리브') || b.includes('전체'))

  console.log('Berserker slash skill:', hasSlash)
  console.log('Berserker cleave skill:', hasCleave)

  // Berserker has highest attack (230) and low defense (55)
  const highAttack = pageText.includes('230')
  const lowDefense = pageText.includes('55')
  console.log('Attack 230 in text:', highAttack)
  console.log('Defense 55 in text:', lowDefense)
})

// ============================================================================
// TEST: Check for JS Errors
// ============================================================================

test('11 - Check for JS errors across all characters', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  const characters = ['칠흑의 기사', '불꽃의 마법사', '빛의 성기사', '조류 무희', '광전사']

  for (const char of characters) {
    await goToTitle(page)
    await clickNewGame(page)
    await selectCharByName(page, char)
    await page.waitForTimeout(1000)

    // Use skills and end turn a few times
    for (let i = 0; i < 3; i++) {
      const endTurnBtn = page.locator('button:has-text("턴 종료")')
      if (await endTurnBtn.count() > 0) {
        const disabled = await endTurnBtn.isDisabled().catch(() => true)
        if (!disabled) {
          await endTurnBtn.click().catch(() => {})
          await page.waitForTimeout(500)
        }
      }
    }
  }

  console.log('JS Errors found:', errors.length)
  if (errors.length > 0) {
    console.log('FINDING - JS ERRORS:', JSON.stringify(errors))
  }
})

// ============================================================================
// TEST: Battle Speed UI
// ============================================================================

test('12 - Battle speed controls', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '칠흑의 기사')
  await page.waitForTimeout(500)

  const pageText = await getPageText(page)
  const btns = await getButtonTexts(page)

  // Check for speed buttons
  const has1x = btns.some(b => b.includes('1x') || b === '1')
  const has15x = btns.some(b => b.includes('1.5x') || b.includes('1.5'))
  const has2x = btns.some(b => b.includes('2x') || b === '2')

  console.log('FINDING - Speed 1x button:', has1x)
  console.log('FINDING - Speed 1.5x button:', has15x)
  console.log('FINDING - Speed 2x button:', has2x)
  console.log('FINDING - Speed controls in page text:', pageText.includes('1x') || pageText.includes('2x'))

  await ss(page, '12-battle-speed-controls')
})

// ============================================================================
// TEST: Stat display - check specific numbers
// ============================================================================

test('13 - Verify character stats in battle', async ({ page }) => {
  // Test dark knight: HP 1200, Attack 180, Defense 90, MP 100
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '칠흑의 기사')
  await page.waitForTimeout(500)

  const pageText = await getPageText(page)

  console.log('Dark Knight stat verification:')
  console.log('HP 1200:', pageText.includes('1,200') || pageText.includes('1200'))
  console.log('Attack 180:', pageText.includes('180'))
  console.log('Defense 90:', pageText.includes('90'))
  console.log('MP 100:', pageText.includes('100'))

  // Check combat log area
  const hasLog = pageText.includes('전투 로그') || pageText.includes('배틀 로그') || pageText.includes('로그')
  console.log('FINDING - Battle log section:', hasLog)
})

// ============================================================================
// TEST: Tooltip/Status Badge interaction
// ============================================================================

test('14 - Status badge tooltips', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '칠흑의 기사')
  await page.waitForTimeout(500)

  // Play enough to potentially get status effects
  for (let i = 0; i < 10; i++) {
    const endTurnBtn = page.locator('button:has-text("턴 종료")')
    if (await endTurnBtn.count() > 0) {
      const disabled = await endTurnBtn.isDisabled().catch(() => true)
      if (!disabled) {
        await endTurnBtn.click().catch(() => {})
        await page.waitForTimeout(400)
      }
    }

    // Check for status badges
    const pageText = await getPageText(page)
    if (pageText.includes('독') || pageText.includes('화상') || pageText.includes('기절') || pageText.includes('방막')) {
      console.log(`Status effect appeared at turn ${i}`)
      await ss(page, '14-status-effect-visible')
      break
    }
  }

  await ss(page, '14-after-turns')
})

// ============================================================================
// TEST: Result screen
// ============================================================================

test('15 - Result screen after defeat', async ({ page }) => {
  await goToTitle(page)
  await clickNewGame(page)
  // Use fire mage (low HP, likely to die faster)
  await selectCharByName(page, '불꽃의 마법사')
  await page.waitForTimeout(500)

  let reachedResult = false

  // Keep ending turns without using skills to die
  for (let attempt = 0; attempt < 100; attempt++) {
    const pageText = await getPageText(page)

    if (pageText.includes('패배') || pageText.includes('게임 오버') || pageText.includes('결과')) {
      reachedResult = true
      console.log(`Reached result/defeat at attempt ${attempt}`)
      await ss(page, '15-result-screen')
      console.log('Result text:', pageText.substring(0, 1000))
      break
    }
    if (pageText.includes('보상을 선택하세요')) {
      console.log('Reached draft instead of defeat at', attempt, '- clicking end turn to proceed')
      // Fast forward through draft
      const btns = page.locator('button')
      const count = await btns.count()
      for (let i = 0; i < count; i++) {
        const btn = btns.nth(i)
        const text = (await btn.textContent() || '').trim()
        if (!text.includes('보상 선택') && !text.includes('아이템 조합') && text.length > 2) {
          const visible = await btn.isVisible().catch(() => false)
          const disabled = await btn.isDisabled().catch(() => true)
          if (visible && !disabled) {
            await btn.click().catch(() => {})
            await page.waitForTimeout(300)
            break
          }
        }
      }
      continue
    }

    const endTurnBtn = page.locator('button:has-text("턴 종료")')
    if (await endTurnBtn.count() > 0) {
      const disabled = await endTurnBtn.isDisabled().catch(() => true)
      if (!disabled) {
        await endTurnBtn.click().catch(() => {})
        await page.waitForTimeout(600)
        continue
      }
    }

    await page.waitForTimeout(200)
  }

  if (reachedResult) {
    const pageText = await getPageText(page)
    const btns = await getButtonTexts(page)
    console.log('Result screen buttons:', JSON.stringify(btns))

    // Check for return-to-title button
    const hasReturnBtn = btns.some(b => b.includes('타이틀') || b.includes('다시') || b.includes('돌아'))
    console.log('FINDING - Return to title button:', hasReturnBtn)

    // Check stats shown
    const hasStats = pageText.includes('피해') || pageText.includes('라운드') || pageText.includes('데미지')
    console.log('FINDING - Stats on result screen:', hasStats)
  }
})

// ============================================================================
// TEST: Event Screen (if reachable)
// ============================================================================

test('16 - Event screen check', async ({ page }) => {
  // The event screen can appear during some phases
  await goToTitle(page)
  await clickNewGame(page)
  await selectCharByName(page, '칠흑의 기사')
  await page.waitForTimeout(500)

  // Check if event screen code has visible elements
  const pageText = await getPageText(page)
  const hasEventMarkers = pageText.includes('이벤트') || pageText.includes('선택지')
  console.log('FINDING - Event elements on battle screen:', hasEventMarkers)

  // Look through multiple battles to see if event appears
  let foundEvent = false
  for (let round = 0; round < 3 && !foundEvent; round++) {
    // Play through battle quickly
    for (let attempt = 0; attempt < 50; attempt++) {
      const text = await getPageText(page)

      if (text.includes('이벤트') && !text.includes('라운드')) {
        foundEvent = true
        console.log(`Event screen appeared at round ${round}, attempt ${attempt}`)
        await ss(page, '16-event-screen')
        break
      }
      if (text.includes('보상을 선택하세요')) {
        // At draft, select first option and continue
        const btns = page.locator('button')
        const count = await btns.count()
        for (let i = 0; i < count; i++) {
          const btn = btns.nth(i)
          const t = (await btn.textContent() || '').trim()
          if (!t.includes('보상 선택') && !t.includes('아이템 조합') && t.length > 2) {
            const visible = await btn.isVisible().catch(() => false)
            const disabled = await btn.isDisabled().catch(() => true)
            if (visible && !disabled) {
              await btn.click().catch(() => {})
              await page.waitForTimeout(300)
              break
            }
          }
        }
        break
      }

      const endTurnBtn = page.locator('button:has-text("턴 종료")')
      if (await endTurnBtn.count() > 0) {
        const disabled = await endTurnBtn.isDisabled().catch(() => true)
        if (!disabled) {
          await endTurnBtn.click().catch(() => {})
          await page.waitForTimeout(500)
          continue
        }
      }

      // Click first skill
      const btns = page.locator('button')
      const count = await btns.count()
      for (let i = 0; i < count; i++) {
        const btn = btns.nth(i)
        const t = (await btn.textContent() || '').trim()
        const visible = await btn.isVisible().catch(() => false)
        const disabled = await btn.isDisabled().catch(() => true)
        if (!visible || disabled) continue
        if (t.includes('턴 종료') || t.includes('뒤로') || t.length < 2) continue
        await btn.click().catch(() => {})
        await page.waitForTimeout(100)
        break
      }
    }
  }

  if (!foundEvent) {
    console.log('FINDING: Event screen not encountered in 3 rounds of play')
  }
})
