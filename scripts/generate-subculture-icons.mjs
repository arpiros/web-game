import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = process.cwd()
const outDir = path.join(root, 'public/icons/subculture')

const sources = [
  { kind: 'skill', file: 'src/game/data/skills.ts' },
  { kind: 'item', file: 'src/game/data/items.ts' },
  { kind: 'character', file: 'src/game/data/characters.ts' },
  { kind: 'ally', file: 'src/game/data/allies.ts' },
  { kind: 'enemy', file: 'src/game/data/enemies.ts' },
]

function parseEntries(text, kind) {
  const matches = [...text.matchAll(/^\s*id:\s*'([^']+)'/gm)]
  return matches.map((match, index) => {
    const start = match.index ?? 0
    const end = matches[index + 1]?.index ?? text.length
    const chunk = text.slice(start, end)
    const id = match[1]
    const name = chunk.match(/name:\s*'([^']+)'/)?.[1] ?? id
    const element = chunk.match(/element:\s*'([^']+)'/)?.[1] ?? inferElement(id, name, chunk, kind)
    const rarity = chunk.match(/rarity:\s*'([^']+)'/)?.[1] ?? inferRarity(kind, id, chunk)
    return { kind, id, name, element, rarity }
  })
}

function inferElement(id, name, chunk, kind) {
  const haystack = `${id} ${name} ${chunk}`.toLowerCase()
  if (haystack.includes('fire') || haystack.includes('flame') || haystack.includes('pyro') || haystack.includes('화염') || haystack.includes('홍련') || haystack.includes('적련')) return 'fire'
  if (haystack.includes('water') || haystack.includes('tide') || haystack.includes('frost') || haystack.includes('glacial') || haystack.includes('ice') || haystack.includes('수계') || haystack.includes('해류') || haystack.includes('빙')) return 'water'
  if (haystack.includes('dark') || haystack.includes('shadow') || haystack.includes('void') || haystack.includes('night') || haystack.includes('poison') || haystack.includes('blood') || haystack.includes('어둠') || haystack.includes('공허') || haystack.includes('독') || haystack.includes('흑')) return 'dark'
  if (haystack.includes('holy') || haystack.includes('light') || haystack.includes('sacred') || haystack.includes('divine') || haystack.includes('빛') || haystack.includes('성')) return 'light'
  return kind === 'skill' ? 'physical' : 'physical'
}

function inferRarity(kind, id, chunk) {
  if (chunk.includes('legendary') || id.includes('dragon_lord') || id.includes('void_lord')) return 'legendary'
  if (chunk.includes('epic') || id.includes('boss')) return 'epic'
  if (chunk.includes('rare') || kind === 'enemy') return 'rare'
  return 'common'
}

const files = await Promise.all(sources.map(async source => ({
  ...source,
  text: await fs.readFile(path.join(root, source.file), 'utf8'),
})))

const entries = files.flatMap(source => parseEntries(source.text, source.kind))
const uniqueEntries = [...new Map(entries.map(entry => [`${entry.kind}-${entry.id}`, entry])).values()]
const fallbackEntries = ['physical', 'fire', 'water', 'dark', 'light'].map(element => ({
  kind: 'fallback',
  id: element,
  name: element,
  element,
  rarity: 'common',
}))

await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const rendered = await page.evaluate(
  async ({ entries }) => {
    const palettes = {
      physical: {
        bg1: '#fff2b7', bg2: '#f3a95f', bg3: '#775034',
        main: '#ffe3a2', dark: '#8e5638', shine: '#fff9df',
      },
      fire: {
        bg1: '#ffe08a', bg2: '#ff6f69', bg3: '#8f2544',
        main: '#ff8b4e', dark: '#8d2435', shine: '#fff2b3',
      },
      water: {
        bg1: '#d7fbff', bg2: '#73d8ff', bg3: '#3a59b8',
        main: '#8be7ff', dark: '#3150b0', shine: '#f1ffff',
      },
      dark: {
        bg1: '#efd5ff', bg2: '#9c73ff', bg3: '#3d236d',
        main: '#ba8cff', dark: '#432269', shine: '#fff1ff',
      },
      light: {
        bg1: '#fff8bf', bg2: '#ffd776', bg3: '#8d6b2d',
        main: '#fff1a1', dark: '#9b752c', shine: '#ffffff',
      },
    }

    const rarityGlow = {
      common: '#ffffff88',
      rare: '#66d9ff99',
      epic: '#c987ff99',
      legendary: '#ffd66bbb',
    }

    function roundedRect(ctx, x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2)
      ctx.beginPath()
      ctx.moveTo(x + rr, y)
      ctx.arcTo(x + w, y, x + w, y + h, rr)
      ctx.arcTo(x + w, y + h, x, y + h, rr)
      ctx.arcTo(x, y + h, x, y, rr)
      ctx.arcTo(x, y, x + w, y, rr)
      ctx.closePath()
    }

    function pathWithOutline(ctx, pathFn, fillStyle, strokeStyle = '#ffffff', strokeWidth = 10) {
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = strokeWidth
      ctx.strokeStyle = strokeStyle
      pathFn()
      ctx.stroke()
      ctx.lineWidth = Math.max(2, strokeWidth * 0.28)
      ctx.strokeStyle = '#2c2340aa'
      pathFn()
      ctx.stroke()
      ctx.fillStyle = fillStyle
      pathFn()
      ctx.fill()
      ctx.restore()
    }

    function sparkle(ctx, x, y, s, color = '#ffffff') {
      ctx.save()
      ctx.fillStyle = color
      ctx.globalAlpha = 0.92
      ctx.beginPath()
      ctx.moveTo(x, y - s)
      ctx.quadraticCurveTo(x + s * 0.22, y - s * 0.22, x + s, y)
      ctx.quadraticCurveTo(x + s * 0.22, y + s * 0.22, x, y + s)
      ctx.quadraticCurveTo(x - s * 0.22, y + s * 0.22, x - s, y)
      ctx.quadraticCurveTo(x - s * 0.22, y - s * 0.22, x, y - s)
      ctx.fill()
      ctx.restore()
    }

    function pill(ctx, x, y, w, h, color) {
      ctx.save()
      roundedRect(ctx, x, y, w, h, h / 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.restore()
    }

    function archetype(entry) {
      const s = `${entry.kind} ${entry.id} ${entry.name}`.toLowerCase()
      if (entry.kind === 'character') {
        if (s.includes('fire')) return 'mage'
        if (s.includes('paladin')) return 'shield'
        if (s.includes('tide')) return 'dance'
        if (s.includes('berserker')) return 'axe'
        return 'sword'
      }
      if (entry.kind === 'ally') {
        if (s.includes('archer')) return 'bow'
        if (s.includes('cleric') || s.includes('angel')) return 'halo'
        if (s.includes('assassin')) return 'dagger'
        if (s.includes('guardian') || s.includes('shrine')) return 'shield'
        if (s.includes('dragon')) return 'dragon'
        if (s.includes('bard')) return 'music'
        if (s.includes('hunter')) return 'spear'
        if (s.includes('hydra')) return 'hydra'
        if (s.includes('scholar') || s.includes('mage')) return 'book'
      }
      if (entry.kind === 'enemy') {
        if (s.includes('dragon') || s.includes('drake') || s.includes('wyrm') || s.includes('wyvern')) return 'dragon'
        if (s.includes('goblin') || s.includes('orc')) return 'monster'
        if (s.includes('wolf') || s.includes('vampire')) return 'fang'
        if (s.includes('golem') || s.includes('giant') || s.includes('colossus')) return 'golem'
        if (s.includes('skeleton') || s.includes('lich')) return 'skull'
        if (s.includes('hydra') || s.includes('serpent')) return 'hydra'
        if (s.includes('witch') || s.includes('mage')) return 'book'
        if (s.includes('sentinel') || s.includes('guardian') || s.includes('paladin')) return 'shield'
      }
      if (entry.kind === 'item') {
        if (s.includes('ring') || s.includes('반지')) return 'ring'
        if (s.includes('crystal') || s.includes('gem') || s.includes('수정') || s.includes('보석') || s.includes('결정')) return 'gem'
        if (s.includes('armor') || s.includes('갑')) return 'armor'
        if (s.includes('boots') || s.includes('장화')) return 'boots'
        if (s.includes('axe') || s.includes('도끼')) return 'axe'
        if (s.includes('tome') || s.includes('scroll') || s.includes('book') || s.includes('금서') || s.includes('문서')) return 'book'
        if (s.includes('potion') || s.includes('antidote') || s.includes('묘약') || s.includes('약')) return 'vial'
        if (s.includes('watch') || s.includes('sand') || s.includes('시계') || s.includes('모래')) return 'clock'
        if (s.includes('heart') || s.includes('심')) return 'heart'
        if (s.includes('blade') || s.includes('sword') || s.includes('검')) return 'sword'
        if (s.includes('lance') || s.includes('창')) return 'spear'
        if (s.includes('wing') || s.includes('날개') || s.includes('쌍익')) return 'wing'
        if (s.includes('mask') || s.includes('가면')) return 'mask'
        if (s.includes('cloak') || s.includes('망토')) return 'cloak'
        if (s.includes('belt') || s.includes('허리띠')) return 'belt'
        if (s.includes('ward') || s.includes('seal') || s.includes('문장') || s.includes('부적') || s.includes('인장') || s.includes('봉인')) return 'badge'
      }
      if (entry.kind === 'skill') {
        if (s.includes('heal') || s.includes('치유') || s.includes('blessing') || s.includes('축복')) return 'heal'
        if (s.includes('shield') || s.includes('barrier') || s.includes('방벽') || s.includes('방패')) return 'shield'
        if (s.includes('lance') || s.includes('spear') || s.includes('창')) return 'spear'
        if (s.includes('blade') || s.includes('slash') || s.includes('검') || s.includes('참')) return 'sword'
        if (s.includes('fire') || s.includes('flame') || s.includes('burn') || s.includes('홍련') || s.includes('화') || entry.element === 'fire') return 'flame'
        if (s.includes('water') || s.includes('tide') || s.includes('rain') || s.includes('wave') || s.includes('물') || s.includes('조류') || entry.element === 'water') return 'wave'
        if (s.includes('dark') || s.includes('void') || s.includes('poison') || s.includes('nightmare') || s.includes('흑') || s.includes('공허') || entry.element === 'dark') return 'moon'
        if (s.includes('holy') || s.includes('divine') || s.includes('light') || s.includes('성') || entry.element === 'light') return 'halo'
        if (s.includes('rage') || s.includes('blood') || s.includes('분노') || s.includes('피')) return 'heart'
      }
      if (entry.kind === 'fallback') return entry.element === 'fire' ? 'flame' : entry.element === 'water' ? 'wave' : entry.element === 'dark' ? 'moon' : entry.element === 'light' ? 'halo' : 'sword'
      return 'star'
    }

    function paintBackground(ctx, entry, p) {
      ctx.clearRect(0, 0, 128, 128)
      ctx.save()
      ctx.shadowColor = rarityGlow[entry.rarity] || '#ffffff88'
      ctx.shadowBlur = entry.rarity === 'legendary' ? 20 : 13
      ctx.shadowOffsetY = 7
      const bg = ctx.createLinearGradient(18, 12, 108, 118)
      bg.addColorStop(0, p.bg1)
      bg.addColorStop(0.44, p.bg2)
      bg.addColorStop(1, p.bg3)
      roundedRect(ctx, 9, 9, 110, 110, 28)
      ctx.fillStyle = bg
      ctx.fill()
      ctx.restore()

      ctx.save()
      roundedRect(ctx, 15, 15, 98, 98, 24)
      ctx.strokeStyle = '#ffffffbb'
      ctx.lineWidth = 4
      ctx.stroke()
      const inner = ctx.createRadialGradient(42, 30, 8, 66, 70, 62)
      inner.addColorStop(0, '#ffffff88')
      inner.addColorStop(0.48, '#ffffff1d')
      inner.addColorStop(1, '#0000001a')
      ctx.fillStyle = inner
      ctx.fill()
      ctx.restore()

      ctx.save()
      roundedRect(ctx, 20, 18, 88, 44, 20)
      ctx.fillStyle = '#ffffff34'
      ctx.fill()
      ctx.restore()

      sparkle(ctx, 28, 30, 7)
      sparkle(ctx, 101, 35, 5, p.shine)
      sparkle(ctx, 96, 96, 6)
      pill(ctx, 19, 92, 34, 10, '#ffffff55')
      if (entry.rarity === 'legendary') {
        sparkle(ctx, 20, 107, 6, '#ffe98a')
        sparkle(ctx, 108, 19, 7, '#ffe98a')
      }
    }

    function drawIcon(ctx, type, p, entry) {
      const main = p.main
      const dark = p.dark
      const shine = p.shine
      ctx.save()
      ctx.translate(0, 2)
      if (type === 'sword') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(79, 24); ctx.lineTo(65, 80); ctx.lineTo(48, 100); ctx.lineTo(58, 70); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.rect(42, 78, 36, 10) }, dark, '#fff', 7)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.arc(52, 94, 8, 0, Math.PI * 2) }, shine, '#fff', 6)
      } else if (type === 'flame') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(66, 23); ctx.bezierCurveTo(89, 46, 82, 77, 66, 100); ctx.bezierCurveTo(44, 85, 40, 64, 55, 48); ctx.bezierCurveTo(63, 40, 64, 31, 66, 23); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(66, 54); ctx.bezierCurveTo(77, 67, 73, 84, 64, 93); ctx.bezierCurveTo(54, 83, 54, 72, 62, 63); ctx.closePath()
        }, shine, '#fff', 5)
      } else if (type === 'wave' || type === 'dance') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(27, 76); ctx.bezierCurveTo(47, 51, 63, 88, 84, 61); ctx.bezierCurveTo(91, 53, 98, 55, 103, 62); ctx.bezierCurveTo(84, 101, 53, 77, 32, 98); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.arc(47, 47, 10, 0, Math.PI * 2); ctx.arc(82, 85, 7, 0, Math.PI * 2)
        }, shine, '#fff', 4)
      } else if (type === 'moon') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.arc(69, 62, 34, 0.55 * Math.PI, 1.65 * Math.PI); ctx.bezierCurveTo(57, 52, 61, 78, 83, 88); ctx.bezierCurveTo(71, 99, 48, 91, 39, 73); ctx.bezierCurveTo(28, 51, 42, 27, 64, 24); ctx.closePath()
        }, main)
        sparkle(ctx, 83, 43, 7, shine)
      } else if (type === 'halo') {
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.ellipse(64, 45, 29, 13, -0.08, 0, Math.PI * 2) }, shine, '#fff', 7)
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(64, 34); ctx.lineTo(77, 63); ctx.lineTo(107, 66); ctx.lineTo(83, 84); ctx.lineTo(91, 111); ctx.lineTo(64, 96); ctx.lineTo(37, 111); ctx.lineTo(45, 84); ctx.lineTo(21, 66); ctx.lineTo(51, 63); ctx.closePath()
        }, main)
      } else if (type === 'shield') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(64, 24); ctx.lineTo(92, 38); ctx.lineTo(88, 74); ctx.quadraticCurveTo(78, 94, 64, 104); ctx.quadraticCurveTo(50, 94, 40, 74); ctx.lineTo(36, 38); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(64, 42); ctx.lineTo(64, 86); ctx.moveTo(46, 61); ctx.lineTo(82, 61) }, shine, '#fff', 5)
      } else if (type === 'gem') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(64, 22); ctx.lineTo(94, 55); ctx.lineTo(64, 105); ctx.lineTo(34, 55); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(34, 55); ctx.lineTo(94, 55); ctx.moveTo(64, 22); ctx.lineTo(64, 105) }, shine, '#fff', 5)
      } else if (type === 'book' || type === 'mage') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(34, 31); ctx.lineTo(77, 31); ctx.quadraticCurveTo(92, 35, 94, 50); ctx.lineTo(94, 100); ctx.lineTo(48, 100); ctx.quadraticCurveTo(34, 96, 34, 82); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(54, 34); ctx.lineTo(54, 99); ctx.moveTo(65, 51); ctx.lineTo(83, 51); ctx.moveTo(65, 67); ctx.lineTo(80, 67) }, shine, '#fff', 4)
      } else if (type === 'ring') {
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.arc(64, 72, 27, 0, Math.PI * 2); ctx.arc(64, 72, 14, 0, Math.PI * 2) }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(53, 39); ctx.lineTo(64, 25); ctx.lineTo(75, 39); ctx.lineTo(64, 51); ctx.closePath() }, shine, '#fff', 6)
      } else if (type === 'armor') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(39, 33); ctx.lineTo(89, 33); ctx.lineTo(82, 102); ctx.lineTo(46, 102); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(43, 34); ctx.lineTo(64, 58); ctx.lineTo(85, 34); ctx.moveTo(64, 58); ctx.lineTo(64, 98) }, shine, '#fff', 5)
      } else if (type === 'boots') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(45, 31); ctx.lineTo(66, 31); ctx.lineTo(62, 75); ctx.quadraticCurveTo(83, 77, 94, 91); ctx.lineTo(94, 101); ctx.lineTo(39, 101); ctx.closePath()
        }, main)
        pill(ctx, 48, 42, 16, 7, shine)
      } else if (type === 'axe') {
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(50, 26); ctx.lineTo(83, 104); ctx.lineTo(73, 107); ctx.lineTo(40, 30); ctx.closePath() }, dark, '#fff', 7)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(64, 27); ctx.quadraticCurveTo(94, 27, 96, 58); ctx.quadraticCurveTo(74, 57, 58, 43); ctx.closePath() }, main)
      } else if (type === 'vial') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(54, 26); ctx.lineTo(74, 26); ctx.lineTo(70, 49); ctx.lineTo(91, 87); ctx.quadraticCurveTo(86, 104, 64, 104); ctx.quadraticCurveTo(42, 104, 37, 87); ctx.lineTo(58, 49); ctx.closePath()
        }, main)
        pill(ctx, 50, 79, 28, 12, shine)
      } else if (type === 'clock') {
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.arc(64, 69, 30, 0, Math.PI * 2) }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(54, 28); ctx.lineTo(74, 28); ctx.moveTo(64, 69); ctx.lineTo(78, 55); ctx.moveTo(64, 69); ctx.lineTo(57, 78) }, shine, '#fff', 5)
      } else if (type === 'heart' || type === 'heal') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(64, 103); ctx.bezierCurveTo(30, 80, 34, 42, 55, 43); ctx.bezierCurveTo(61, 43, 64, 49, 64, 54); ctx.bezierCurveTo(64, 49, 67, 43, 73, 43); ctx.bezierCurveTo(94, 42, 98, 80, 64, 103); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(64, 59); ctx.lineTo(64, 83); ctx.moveTo(52, 71); ctx.lineTo(76, 71) }, shine, '#fff', 4)
      } else if (type === 'bow') {
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(48, 29); ctx.quadraticCurveTo(80, 64, 48, 99); ctx.moveTo(48, 29); ctx.quadraticCurveTo(25, 64, 48, 99); ctx.moveTo(48, 64); ctx.lineTo(98, 39) }, main, '#fff', 7)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(85, 35); ctx.lineTo(100, 38); ctx.lineTo(91, 50) }, shine, '#fff', 4)
      } else if (type === 'dagger') {
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(83, 24); ctx.lineTo(61, 76); ctx.lineTo(42, 96); ctx.lineTo(52, 64); ctx.closePath() }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(41, 83); ctx.lineTo(57, 99); ctx.moveTo(46, 93); ctx.lineTo(36, 103) }, shine, '#fff', 5)
      } else if (type === 'dragon') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(30, 87); ctx.quadraticCurveTo(50, 39, 82, 27); ctx.lineTo(99, 40); ctx.lineTo(82, 45); ctx.quadraticCurveTo(102, 55, 91, 90); ctx.quadraticCurveTo(70, 70, 30, 87); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(56, 44); ctx.lineTo(42, 27); ctx.moveTo(76, 39); ctx.lineTo(76, 33) }, shine, '#fff', 4)
      } else if (type === 'music') {
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(72, 30); ctx.lineTo(72, 82); ctx.arc(59, 86, 13, 0, Math.PI * 2); ctx.moveTo(72, 35); ctx.lineTo(94, 43); ctx.lineTo(94, 75); ctx.arc(86, 78, 11, 0, Math.PI * 2) }, main, '#fff', 7)
      } else if (type === 'spear') {
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(80, 22); ctx.lineTo(67, 67); ctx.lineTo(40, 104); ctx.lineTo(55, 56); ctx.closePath() }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(47, 72); ctx.lineTo(82, 99) }, shine, '#fff', 5)
      } else if (type === 'hydra') {
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(44, 101); ctx.bezierCurveTo(41, 67, 50, 53, 64, 53); ctx.bezierCurveTo(78, 53, 87, 67, 84, 101); ctx.closePath() }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(45, 62); ctx.quadraticCurveTo(31, 40, 49, 28); ctx.moveTo(64, 54); ctx.quadraticCurveTo(60, 33, 66, 24); ctx.moveTo(83, 62); ctx.quadraticCurveTo(97, 40, 79, 28) }, shine, '#fff', 6)
      } else if (type === 'skull') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(42, 63); ctx.quadraticCurveTo(42, 30, 64, 30); ctx.quadraticCurveTo(86, 30, 86, 63); ctx.quadraticCurveTo(84, 79, 74, 84); ctx.lineTo(74, 99); ctx.lineTo(54, 99); ctx.lineTo(54, 84); ctx.quadraticCurveTo(44, 79, 42, 63); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.arc(55, 63, 5, 0, Math.PI * 2); ctx.arc(73, 63, 5, 0, Math.PI * 2); ctx.moveTo(60, 79); ctx.lineTo(68, 79) }, dark, '#fff', 3)
      } else if (type === 'golem' || type === 'monster' || type === 'fang') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(39, 53); ctx.quadraticCurveTo(43, 30, 64, 32); ctx.quadraticCurveTo(86, 31, 91, 53); ctx.lineTo(83, 95); ctx.lineTo(45, 95); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.arc(55, 62, 5, 0, Math.PI * 2); ctx.arc(73, 62, 5, 0, Math.PI * 2); ctx.moveTo(52, 80); ctx.quadraticCurveTo(64, 88, 77, 80) }, dark, '#fff', 4)
      } else if (type === 'wing' || type === 'cloak') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(64, 88); ctx.quadraticCurveTo(92, 76, 99, 31); ctx.quadraticCurveTo(75, 39, 64, 68); ctx.quadraticCurveTo(53, 39, 29, 31); ctx.quadraticCurveTo(36, 76, 64, 88); ctx.closePath()
        }, main)
      } else if (type === 'mask') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(37, 37); ctx.quadraticCurveTo(64, 25, 91, 37); ctx.lineTo(85, 76); ctx.quadraticCurveTo(76, 95, 64, 101); ctx.quadraticCurveTo(52, 95, 43, 76); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(50, 63); ctx.lineTo(59, 63); ctx.moveTo(69, 63); ctx.lineTo(78, 63) }, dark, '#fff', 4)
      } else if (type === 'belt' || type === 'badge') {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(64, 27); ctx.lineTo(95, 45); ctx.lineTo(87, 92); ctx.lineTo(64, 105); ctx.lineTo(41, 92); ctx.lineTo(33, 45); ctx.closePath()
        }, main)
        pathWithOutline(ctx, () => { ctx.beginPath(); ctx.moveTo(48, 66); ctx.lineTo(60, 78); ctx.lineTo(83, 51) }, shine, '#fff', 5)
      } else {
        pathWithOutline(ctx, () => {
          ctx.beginPath(); ctx.moveTo(64, 30); ctx.lineTo(76, 55); ctx.lineTo(103, 59); ctx.lineTo(83, 78); ctx.lineTo(88, 105); ctx.lineTo(64, 92); ctx.lineTo(40, 105); ctx.lineTo(45, 78); ctx.lineTo(25, 59); ctx.lineTo(52, 55); ctx.closePath()
        }, main)
      }
      ctx.restore()
      sparkle(ctx, 35, 103, 4, '#ffffff')
      if (entry.kind === 'skill') sparkle(ctx, 106, 74, 4, p.shine)
      if (entry.kind === 'item') pill(ctx, 82, 101, 20, 7, '#ffffff66')
      if (entry.kind === 'enemy') {
        ctx.save(); ctx.globalAlpha = 0.55; pill(ctx, 24, 103, 28, 8, '#ff5b7c'); ctx.restore()
      }
    }

    function render(entry) {
      const canvas = document.createElement('canvas')
      canvas.width = 128
      canvas.height = 128
      const ctx = canvas.getContext('2d')
      const p = palettes[entry.element] || palettes.physical
      paintBackground(ctx, entry, p)
      drawIcon(ctx, archetype(entry), p, entry)
      return canvas.toDataURL('image/png')
    }

    return Promise.all(entries.map(async entry => ({
      filename: `${entry.kind}-${entry.id}.png`,
      dataUrl: render(entry),
    })))
  },
  { entries: [...uniqueEntries, ...fallbackEntries] },
)
await browser.close()

for (const { filename, dataUrl } of rendered) {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  await fs.writeFile(path.join(outDir, filename), Buffer.from(base64, 'base64'))
}

console.log(`generated ${rendered.length} subculture png icons in ${outDir}`)
