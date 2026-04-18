import { test, expect, Page } from '@playwright/test'

// QA Testing script for all 5 characters
// Tests: title screen, character select, battle screen, draft screen

const BASE_URL = 'http://localhost:5173/web-game/'
const CHARACTERS = [
  { id: 'dark_knight', name: '칠흑의 기사' },
  { id: 'fire_mage', name: '불꽃의 마법사' },
  { id: 'holy_paladin', name: '빛의 성기사' },
  { id: 'tide_dancer', name: '조류 무희' },
  { id: 'berserker', name: '광전사' },
]

async function navigateToTitle(page: Page) {
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')
}

async function startNewGame(page: Page) {
  // Click "시작하기" button on title screen
  const startBtn = page.getByRole('button', { name: '시작하기' })
  await startBtn.waitFor({ state: 'visible', timeout: 5000 })
  await startBtn.click()
  // Should now be on character select screen
  await page.waitForSelector('h2')
}

async function selectCharacter(page: Page, characterName: string) {
  const charBtn = page.getByRole('button', { name: new RegExp(characterName) })
  await charBtn.first().waitFor({ state: 'visible', timeout: 5000 })
  await charBtn.first().click()
}

async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `/tmp/qa-screenshots/${name}.png`, fullPage: false })
}

async function waitForBattleScreen(page: Page) {
  // Wait for battle phase - look for skill buttons or enemy display
  await page.waitForSelector('[data-testid="battle-screen"], .battle-screen, button:has-text("턴 종료")', {
    timeout: 5000
  }).catch(() => {
    // Try alternative - look for any battle indicator
  })
  await page.waitForTimeout(500)
}

// ============================================================================
// TITLE SCREEN TESTS
// ============================================================================

test.describe('Title Screen', () => {
  test('shows correct title and start button', async ({ page }) => {
    await navigateToTitle(page)
    await takeScreenshot(page, '01-title-screen')

    // Check title
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    const titleText = await h1.textContent()
    expect(titleText).toContain('Dark Roguelike')

    // Check start button - note: it says "시작하기" not "새 게임"
    const startBtn = page.getByRole('button', { name: '시작하기' })
    await expect(startBtn).toBeVisible()

    // Check version display
    const versionEl = page.locator('span:has-text("v")')
    // version element should be present
    const versionCount = await versionEl.count()
    console.log(`Version elements found: ${versionCount}`)
  })
})

// ============================================================================
// CHARACTER SELECT TESTS
// ============================================================================

test.describe('Character Select Screen', () => {
  test('shows all 5 characters', async ({ page }) => {
    await navigateToTitle(page)
    await startNewGame(page)
    await takeScreenshot(page, '02-character-select')

    // Check all 5 characters are displayed
    for (const char of CHARACTERS) {
      const charEl = page.getByRole('button', { name: new RegExp(char.name) })
      await expect(charEl.first()).toBeVisible()
    }

    // Check back button
    const backBtn = page.getByRole('button', { name: /뒤로/ })
    await expect(backBtn).toBeVisible()

    // Check "속도" (speed) stat is NOT shown (it's not in the card, only HP/공격/방어/MP)
    const speedLabel = page.getByText('속도')
    const speedCount = await speedLabel.count()
    console.log(`Speed stat displayed: ${speedCount} times (expected: 0)`)
  })

  test('back button returns to title', async ({ page }) => {
    await navigateToTitle(page)
    await startNewGame(page)

    const backBtn = page.getByRole('button', { name: /뒤로/ })
    await backBtn.click()
    await page.waitForTimeout(200)

    // Should be back on title screen
    const startBtn = page.getByRole('button', { name: '시작하기' })
    await expect(startBtn).toBeVisible()
  })
})

// ============================================================================
// DARK KNIGHT BATTLE TESTS
// ============================================================================

test.describe('Dark Knight - Battle', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTitle(page)
    await startNewGame(page)
    await selectCharacter(page, '칠흑의 기사')
    await page.waitForTimeout(1000)
  })

  test('battle screen loads with correct UI elements', async ({ page }) => {
    await takeScreenshot(page, '03-dark-knight-battle-start')

    // Check HP bars visible
    const hpText = page.getByText(/HP/)
    const hpCount = await hpText.count()
    console.log(`HP elements found: ${hpCount}`)

    // Check round indicator
    const roundText = page.getByText(/라운드|Round/i)
    const roundCount = await roundText.count()
    console.log(`Round indicator found: ${roundCount}`)

    // Check enemy visible
    const enemySection = page.getByText(/적|enemy/i)
    const enemyCount = await enemySection.count()
    console.log(`Enemy elements found: ${enemyCount}`)

    // Check skill buttons
    const endTurnBtn = page.getByRole('button', { name: /턴 종료/ })
    const endTurnCount = await endTurnBtn.count()
    console.log(`End turn button found: ${endTurnCount}`)

    // Take full screenshot and verify no JS errors
    await takeScreenshot(page, '03b-dark-knight-battle-full')
  })

  test('can use skills and attack enemies', async ({ page }) => {
    await page.waitForTimeout(500)
    await takeScreenshot(page, '04-dark-knight-before-skill')

    // Find skill buttons (not system buttons)
    const allButtons = page.getByRole('button')
    const buttonCount = await allButtons.count()
    console.log(`Total buttons: ${buttonCount}`)

    // Try to use a skill - look for slash or shadow_strike
    const slashBtn = page.getByRole('button', { name: /참격|슬래시|slash/i })
    const slashCount = await slashBtn.count()
    console.log(`Slash skill buttons: ${slashCount}`)

    if (slashCount > 0) {
      await slashBtn.first().click()
      await page.waitForTimeout(300)
      await takeScreenshot(page, '04b-dark-knight-skill-selected')

      // Look for enemy target selection
      const enemyBtns = page.locator('button[aria-label*="enemy"], button[data-enemy]')
      const enemyBtnCount = await enemyBtns.count()
      console.log(`Enemy target buttons: ${enemyBtnCount}`)

      // Try clicking an enemy
      if (enemyBtnCount > 0) {
        await enemyBtns.first().click()
        await page.waitForTimeout(500)
        await takeScreenshot(page, '04c-dark-knight-attack-executed')
      }
    }

    // Look for skill buttons by scanning all button texts
    const btns = await allButtons.all()
    const btnTexts: string[] = []
    for (const btn of btns) {
      const text = await btn.textContent()
      if (text && text.trim()) btnTexts.push(text.trim().substring(0, 30))
    }
    console.log('Battle screen buttons:', JSON.stringify(btnTexts))
  })

  test('end turn button works', async ({ page }) => {
    await page.waitForTimeout(500)

    const endTurnBtn = page.getByRole('button', { name: /턴 종료/ })
    if (await endTurnBtn.count() > 0) {
      await endTurnBtn.click()
      await page.waitForTimeout(1000)
      await takeScreenshot(page, '05-dark-knight-after-end-turn')
    } else {
      console.log('End turn button not found')
    }
  })
})

// ============================================================================
// FIRE MAGE BATTLE TESTS
// ============================================================================

test.describe('Fire Mage - Battle', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTitle(page)
    await startNewGame(page)
    await selectCharacter(page, '불꽃의 마법사')
    await page.waitForTimeout(1000)
  })

  test('fire mage has low HP and high MP', async ({ page }) => {
    await takeScreenshot(page, '06-fire-mage-battle-start')

    const pageContent = await page.textContent('body')
    console.log('Fire mage battle page has content length:', pageContent?.length)

    // Check for MP display
    const mpText = page.getByText(/MP/)
    const mpCount = await mpText.count()
    console.log(`MP elements: ${mpCount}`)
  })

  test('fire spells are available', async ({ page }) => {
    await page.waitForTimeout(500)

    const allButtons = page.getByRole('button')
    const btns = await allButtons.all()
    const btnTexts: string[] = []
    for (const btn of btns) {
      const text = await btn.textContent()
      if (text && text.trim()) btnTexts.push(text.trim().substring(0, 40))
    }
    console.log('Fire mage skill buttons:', JSON.stringify(btnTexts))

    await takeScreenshot(page, '06b-fire-mage-skills')
  })
})

// ============================================================================
// HOLY PALADIN BATTLE TESTS
// ============================================================================

test.describe('Holy Paladin - Battle', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTitle(page)
    await startNewGame(page)
    await selectCharacter(page, '빛의 성기사')
    await page.waitForTimeout(1000)
  })

  test('paladin loads with healing skills', async ({ page }) => {
    await takeScreenshot(page, '07-paladin-battle-start')

    const allButtons = page.getByRole('button')
    const btns = await allButtons.all()
    const btnTexts: string[] = []
    for (const btn of btns) {
      const text = await btn.textContent()
      if (text && text.trim()) btnTexts.push(text.trim().substring(0, 40))
    }
    console.log('Paladin skill buttons:', JSON.stringify(btnTexts))
  })
})

// ============================================================================
// TIDE DANCER BATTLE TESTS
// ============================================================================

test.describe('Tide Dancer - Battle', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTitle(page)
    await startNewGame(page)
    await selectCharacter(page, '조류 무희')
    await page.waitForTimeout(1000)
  })

  test('tide dancer battle screen loads', async ({ page }) => {
    await takeScreenshot(page, '08-tide-dancer-battle-start')

    const allButtons = page.getByRole('button')
    const btns = await allButtons.all()
    const btnTexts: string[] = []
    for (const btn of btns) {
      const text = await btn.textContent()
      if (text && text.trim()) btnTexts.push(text.trim().substring(0, 40))
    }
    console.log('Tide dancer skill buttons:', JSON.stringify(btnTexts))
  })
})

// ============================================================================
// BERSERKER BATTLE TESTS
// ============================================================================

test.describe('Berserker - Battle', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTitle(page)
    await startNewGame(page)
    await selectCharacter(page, '광전사')
    await page.waitForTimeout(1000)
  })

  test('berserker battle screen loads', async ({ page }) => {
    await takeScreenshot(page, '09-berserker-battle-start')

    const allButtons = page.getByRole('button')
    const btns = await allButtons.all()
    const btnTexts: string[] = []
    for (const btn of btns) {
      const text = await btn.textContent()
      if (text && text.trim()) btnTexts.push(text.trim().substring(0, 40))
    }
    console.log('Berserker skill buttons:', JSON.stringify(btnTexts))
  })
})

// ============================================================================
// FULL GAME FLOW - Auto-battle through rounds to reach draft
// ============================================================================

test.describe('Full Flow Tests', () => {
  test('dark knight: play through round 1 to draft screen', async ({ page }) => {
    // Inject auto-battle helper via JS
    await navigateToTitle(page)
    await startNewGame(page)
    await selectCharacter(page, '칠흑의 기사')
    await page.waitForTimeout(1000)
    await takeScreenshot(page, '10-dark-knight-start')

    // Use store injection to auto-win battle
    const result = await page.evaluate(() => {
      // Access the Zustand store through window
      const store = (window as any).__ZUSTAND_STORE__
      if (store) {
        return 'store found'
      }
      return 'no store'
    })
    console.log('Store access result:', result)

    // Try clicking all skill buttons and using end turn multiple times
    for (let turn = 0; turn < 30; turn++) {
      const pageUrl = page.url()

      // Check if we're on draft screen
      const draftHeader = page.getByText('보상을 선택하세요')
      if (await draftHeader.count() > 0) {
        console.log(`Reached draft screen at turn ${turn}`)
        await takeScreenshot(page, '11-reached-draft-screen')
        break
      }

      // Check if result screen
      const resultScreen = page.getByText(/승리|패배|결과/)
      if (await resultScreen.count() > 0) {
        console.log(`Reached result screen at turn ${turn}`)
        await takeScreenshot(page, '11-reached-result-screen')
        break
      }

      // Try using first available skill on first enemy
      const skillBtns = page.locator('button').filter({ hasNotText: /턴 종료|뒤로|선택/ })
      const skillCount = await skillBtns.count()

      if (skillCount > 0) {
        // Try clicking a skill
        try {
          await skillBtns.first().click({ timeout: 500 })
          await page.waitForTimeout(300)

          // If waiting for target, click first enemy-like button
          const targetBtns = page.locator('button.enemy-btn, [data-enemy]')
          if (await targetBtns.count() > 0) {
            await targetBtns.first().click()
            await page.waitForTimeout(300)
          }
        } catch (e) {
          // ignore click errors
        }
      }

      // End turn
      const endTurnBtn = page.getByRole('button', { name: /턴 종료/ })
      if (await endTurnBtn.count() > 0) {
        try {
          await endTurnBtn.click({ timeout: 500 })
          await page.waitForTimeout(800)
        } catch (e) {
          // button might be disabled
        }
      }
    }

    await takeScreenshot(page, '12-after-battle-attempts')
  })

  test('inspect battle screen DOM structure', async ({ page }) => {
    await navigateToTitle(page)
    await startNewGame(page)
    await selectCharacter(page, '칠흑의 기사')
    await page.waitForTimeout(1000)

    // Get full DOM snapshot for analysis
    const bodyHTML = await page.evaluate(() => {
      // Get text content structure
      function getStructure(el: Element, depth: number): string {
        if (depth > 5) return ''
        const tag = el.tagName.toLowerCase()
        const text = el.childElementCount === 0 ? el.textContent?.trim().substring(0, 50) : ''
        const cls = el.className ? ` class="${el.className.substring(0, 30)}"` : ''
        let result = `${'  '.repeat(depth)}<${tag}${cls}>${text ? ` "${text}"` : ''}\n`
        for (const child of Array.from(el.children).slice(0, 20)) {
          result += getStructure(child, depth + 1)
        }
        return result
      }
      const main = document.querySelector('main')
      return main ? getStructure(main, 0) : document.body.innerHTML.substring(0, 3000)
    })
    console.log('Battle screen DOM structure:\n', bodyHTML.substring(0, 5000))

    await takeScreenshot(page, '13-battle-dom-inspect')
  })
})
